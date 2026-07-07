import type {
  Sql
} from "postgres";
import {
  describeMaintenanceJob
} from "@krn/core";

import {
  createSmokeDatabase,
  ensureSmokeBrainStoreReady,
  normalizeSmokeSlugPart
} from "./db-smoke-support.js";
import {
  DrizzleWorkerJobRepository
} from "./repositories/drizzle-worker-job-repository.js";
import {
  workerJobTypes
} from "./repositories/worker-job-types.js";
import {
  smokeFixtureClocks
} from "./smoke-fixture-clocks.js";
import type {
  EnqueueWorkerJobInput,
  WorkerJobRecord,
  WorkerJobType
} from "./repositories/worker-job-types.js";

export interface WorkerJobSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface WorkerJobSmokeReport {
  writeBoundaryValidatedCount: number;
  enqueuedJobCount: number;
  queuedReadbackCount: number;
  runningTransitionCount: number;
  succeededCount: number;
  skippedCount: number;
  failedCount: number;
  cleanupDeletedCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

interface CountRow {
  count: number;
}

interface MaintenanceJobBoundaryReadback {
  writeBoundaryValidatedCount: number;
}

export interface WorkerJobSmokeTransitionPlan {
  succeeded: number;
  skipped: number;
  failed: number;
}

export const workerJobSmokeTransitionPlan = (
  jobCount: number
): WorkerJobSmokeTransitionPlan => {
  const succeeded = Math.min(2, jobCount);
  const skipped = Math.min(2, Math.max(jobCount - succeeded, 0));
  const failed = Math.max(jobCount - succeeded - skipped, 0);

  return {
    succeeded,
    skipped,
    failed
  };
};

const countMarkerRows = async (client: Sql, marker: string): Promise<number> => {
  const rows = await client<CountRow[]>`
    select count(*)::int as count
    from worker_jobs
    where payload->>'smokeId' = ${marker}
  `;

  return rows[0]?.count ?? 0;
};

const deleteMarkerRows = async (client: Sql, marker: string): Promise<void> => {
  await client`
    delete from worker_jobs
    where payload->>'smokeId' = ${marker}
  `;
};

const enqueueInputForJobType = (
  jobType: WorkerJobType,
  marker: string,
  sequence: number
): EnqueueWorkerJobInput => {
  const basePayload = {
    smoke: true,
    smokeId: marker,
    jobType,
    sequence,
    reason: "M26.08 worker job smoke"
  } satisfies Record<string, unknown>;

  if (jobType === "embed_source_chunk") {
    return {
      jobType,
      payload: {
        ...basePayload,
        sourceChunkId: `source-chunk-${marker}`,
        embeddingModelId: "text-embedding-3-small"
      }
    };
  }

  if (jobType === "embed_memory_record") {
    return {
      jobType,
      payload: {
        ...basePayload,
        memoryRecordId: `memory-record-${marker}`,
        embeddingModelId: "text-embedding-3-small"
      }
    };
  }

  if (jobType === "expire_stale_memory") {
    return {
      jobType,
      payload: {
        ...basePayload,
        projectId: `project-${marker}`,
        olderThan: smokeFixtureClocks.workerJobs.olderThan
      }
    };
  }

  return {
    jobType,
    payload: {
      ...basePayload,
      projectId: `project-${marker}`
    }
  };
};

const requireStatus = (
  record: WorkerJobRecord,
  expectedStatus: WorkerJobRecord["status"],
  operation: string
): void => {
  if (record.status !== expectedStatus) {
    throw new Error(
      `Worker job smoke ${operation} expected ${expectedStatus}, received ${record.status}`
    );
  }
};

const workerJobBoundaryReadback = (): MaintenanceJobBoundaryReadback => {
  const descriptions = workerJobTypes.map((jobType) => describeMaintenanceJob(jobType));

  return {
    writeBoundaryValidatedCount: descriptions.length
  };
};

export const runWorkerJobSmokeCheck = async (
  input: WorkerJobSmokeInput
): Promise<WorkerJobSmokeReport> => {
  await ensureSmokeBrainStoreReady(
    input.databaseUrl,
    input.migrationsFolder,
    "worker job smoke"
  );

  const marker = normalizeSmokeSlugPart(input.smokeId);
  const { client, db } = createSmokeDatabase(input.databaseUrl);
  const repository = new DrizzleWorkerJobRepository(db);
  const workerJobIds: string[] = [];
  let cleanedUp = false;

  try {
    await deleteMarkerRows(client, marker);

    const enqueuedJobs: WorkerJobRecord[] = [];
    const writeBoundary = workerJobBoundaryReadback();

    for (const [index, jobType] of workerJobTypes.entries()) {
      const job = await repository.enqueueWorkerJob({
        ...enqueueInputForJobType(jobType, marker, index + 1),
        runAfter: smokeFixtureClocks.workerJobs.runAfter
      });

      requireStatus(job, "queued", "enqueue");
      workerJobIds.push(job.id);
      enqueuedJobs.push(job);
    }

    const queuedJobs = await repository.listQueuedWorkerJobs(1000);
    const queuedJobIds = new Set(queuedJobs.map((job) => job.id));
    const queuedReadbackCount = workerJobIds.filter((id) => queuedJobIds.has(id)).length;

    if (queuedReadbackCount !== enqueuedJobs.length) {
      throw new Error("Worker job smoke did not read back every queued job");
    }

    let runningTransitionCount = 0;
    let succeededCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const transitionPlan = workerJobSmokeTransitionPlan(enqueuedJobs.length);

    for (const [index, job] of enqueuedJobs.entries()) {
      const runningJob = await repository.markWorkerJobRunning(job.id, {
        lockedBy: "worker-job-smoke",
        lockedAt: smokeFixtureClocks.workerJobs.lockedAt
      });

      requireStatus(runningJob, "running", "running transition");
      runningTransitionCount += 1;

      if (index < transitionPlan.succeeded) {
        const succeededJob = await repository.markWorkerJobSucceeded(job.id);
        requireStatus(succeededJob, "succeeded", "succeeded transition");
        succeededCount += 1;
        continue;
      }

      if (index < transitionPlan.succeeded + transitionPlan.skipped) {
        const skippedJob = await repository.markWorkerJobSkipped(
          job.id,
          "Skipped by worker job smoke"
        );
        requireStatus(skippedJob, "skipped", "skipped transition");
        skippedCount += 1;
        continue;
      }

      const failedJob = await repository.markWorkerJobFailed(
        job.id,
        "Failed by worker job smoke"
      );

      requireStatus(failedJob, "failed", "failed transition");

      if (failedJob.attempts !== runningJob.attempts + 1) {
        throw new Error("Worker job smoke failed transition did not increment attempts");
      }

      failedCount += 1;
    }

    if (
      runningTransitionCount !== enqueuedJobs.length ||
      succeededCount !== transitionPlan.succeeded ||
      skippedCount !== transitionPlan.skipped ||
      failedCount !== transitionPlan.failed
    ) {
      throw new Error("Worker job smoke transition counts did not match expected proof");
    }

    const cleanup = await repository.cleanupTestWorkerJobs({ workerJobIds });
    const remainingMarkerCount = await countMarkerRows(client, marker);
    cleanedUp = cleanup.deletedCount === enqueuedJobs.length && remainingMarkerCount === 0;

    return {
      writeBoundaryValidatedCount: writeBoundary.writeBoundaryValidatedCount,
      enqueuedJobCount: enqueuedJobs.length,
      queuedReadbackCount,
      runningTransitionCount,
      succeededCount,
      skippedCount,
      failedCount,
      cleanupDeletedCount: cleanup.deletedCount,
      remainingMarkerCount,
      cleanedUp
    };
  } catch (error) {
    await deleteMarkerRows(client, marker);
    throw error;
  } finally {
    if (!cleanedUp) {
      await deleteMarkerRows(client, marker);
    }

    await client.end();
  }
};
