import postgres from "postgres";
import type {
  Sql
} from "postgres";

import {
  createKrnDatabase
} from "./database.js";
import {
  runMigrationReadinessCheck
} from "./migrationReadiness.js";
import {
  DrizzleWorkerJobRepository
} from "./repositories/DrizzleWorkerJobRepository.js";
import {
  workerJobTypes
} from "./repositories/workerJobTypes.js";
import type {
  WorkerJobRecord,
  WorkerJobType
} from "./repositories/workerJobTypes.js";

export interface WorkerJobSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface WorkerJobSmokeReport {
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

const normalizeMarker = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalized.length === 0 ? "local" : normalized;
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

const payloadForJobType = (
  jobType: WorkerJobType,
  marker: string,
  sequence: number
): Record<string, unknown> => {
  const basePayload = {
    smoke: true,
    smokeId: marker,
    jobType,
    sequence,
    reason: "M26.08 worker job smoke"
  } satisfies Record<string, unknown>;

  if (jobType === "embed_source_chunk") {
    return {
      ...basePayload,
      sourceChunkId: `source-chunk-${marker}`
    };
  }

  if (jobType === "embed_memory_record") {
    return {
      ...basePayload,
      memoryRecordId: `memory-record-${marker}`
    };
  }

  if (jobType === "promote_eval_candidate") {
    return {
      ...basePayload,
      evalCandidateId: `eval-candidate-${marker}`
    };
  }

  if (jobType === "expire_stale_memory") {
    return {
      ...basePayload,
      projectId: `project-${marker}`,
      olderThan: "2026-06-01T00:00:00.000Z"
    };
  }

  return {
    ...basePayload,
    projectId: `project-${marker}`
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

export const runWorkerJobSmokeCheck = async (
  input: WorkerJobSmokeInput
): Promise<WorkerJobSmokeReport> => {
  const readiness = await runMigrationReadinessCheck({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder
  });

  if (!readiness.migrationsVerified || !readiness.pgvectorAvailable) {
    throw new Error("Brain store is not ready for worker job smoke");
  }

  const marker = normalizeMarker(input.smokeId);
  const client = postgres(input.databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });
  const db = createKrnDatabase(client);
  const repository = new DrizzleWorkerJobRepository(db);
  const workerJobIds: string[] = [];
  let cleanedUp = false;

  try {
    await deleteMarkerRows(client, marker);

    const enqueuedJobs: WorkerJobRecord[] = [];

    for (const [index, jobType] of workerJobTypes.entries()) {
      const job = await repository.enqueueWorkerJob({
        jobType,
        payload: payloadForJobType(jobType, marker, index + 1),
        runAfter: "2026-06-01T00:00:00.000Z"
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

    for (const [index, job] of enqueuedJobs.entries()) {
      const runningJob = await repository.markWorkerJobRunning(job.id, {
        lockedBy: "worker-job-smoke",
        lockedAt: "2026-06-22T06:00:00.000Z"
      });

      requireStatus(runningJob, "running", "running transition");
      runningTransitionCount += 1;

      if (index < 2) {
        const succeededJob = await repository.markWorkerJobSucceeded(job.id);
        requireStatus(succeededJob, "succeeded", "succeeded transition");
        succeededCount += 1;
        continue;
      }

      if (index < 4) {
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
      succeededCount !== 2 ||
      skippedCount !== 2 ||
      failedCount !== 2
    ) {
      throw new Error("Worker job smoke transition counts did not match expected proof");
    }

    const cleanup = await repository.cleanupTestWorkerJobs({ workerJobIds });
    const remainingMarkerCount = await countMarkerRows(client, marker);
    cleanedUp = cleanup.deletedCount === enqueuedJobs.length && remainingMarkerCount === 0;

    return {
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
