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
  DrizzleMaintenanceQueueRepository
} from "../../repositories/drizzle-maintenance-queue-repository.js";
import {
  maintenanceQueueTypes
} from "../../repositories/maintenance-queue-types.js";
import {
  smokeFixtureClocks
} from "./smoke-fixture-clocks.js";
import type {
  EnqueueMaintenanceQueueInput,
  MaintenanceQueueRecord,
  MaintenanceQueueType
} from "../../repositories/maintenance-queue-types.js";

export interface MaintenanceQueueSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface MaintenanceQueueSmokeReport {
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

export interface MaintenanceQueueSmokeTransitionPlan {
  succeeded: number;
  skipped: number;
  failed: number;
}

export const maintenanceQueueSmokeTransitionPlan = (
  jobCount: number
): MaintenanceQueueSmokeTransitionPlan => {
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
  jobType: MaintenanceQueueType,
  marker: string,
  sequence: number
): EnqueueMaintenanceQueueInput => {
  const basePayload = {
    smoke: true,
    smokeId: marker,
    jobType,
    sequence,
    reason: "M26.08 maintenance queue smoke"
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
        olderThan: smokeFixtureClocks.maintenanceQueues.olderThan
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
  record: MaintenanceQueueRecord,
  expectedStatus: MaintenanceQueueRecord["status"],
  operation: string
): void => {
  if (record.status !== expectedStatus) {
    throw new Error(
      `Maintenance queue smoke ${operation} expected ${expectedStatus}, received ${record.status}`
    );
  }
};

const maintenanceQueueBoundaryReadback = (): MaintenanceJobBoundaryReadback => {
  const descriptions = maintenanceQueueTypes.map((jobType) => describeMaintenanceJob(jobType));

  return {
    writeBoundaryValidatedCount: descriptions.length
  };
};

export const runMaintenanceQueueSmokeCheck = async (
  input: MaintenanceQueueSmokeInput
): Promise<MaintenanceQueueSmokeReport> => {
  await ensureSmokeBrainStoreReady(
    input.databaseUrl,
    input.migrationsFolder,
    "maintenance queue smoke"
  );

  const marker = normalizeSmokeSlugPart(input.smokeId);
  const { client, db } = createSmokeDatabase(input.databaseUrl);
  const repository = new DrizzleMaintenanceQueueRepository(db);
  const maintenanceQueueIds: string[] = [];
  let cleanedUp = false;

  try {
    await deleteMarkerRows(client, marker);

    const enqueuedJobs: MaintenanceQueueRecord[] = [];
    const writeBoundary = maintenanceQueueBoundaryReadback();

    for (const [index, jobType] of maintenanceQueueTypes.entries()) {
      const job = await repository.enqueueMaintenanceQueue({
        ...enqueueInputForJobType(jobType, marker, index + 1),
        runAfter: smokeFixtureClocks.maintenanceQueues.runAfter
      });

      requireStatus(job, "queued", "enqueue");
      maintenanceQueueIds.push(job.id);
      enqueuedJobs.push(job);
    }

    const queuedJobs = await repository.listQueuedMaintenanceQueues(1000);
    const queuedJobIds = new Set(queuedJobs.map((job) => job.id));
    const queuedReadbackCount = maintenanceQueueIds.filter((id) => queuedJobIds.has(id)).length;

    if (queuedReadbackCount !== enqueuedJobs.length) {
      throw new Error("Maintenance queue smoke did not read back every queued job");
    }

    let runningTransitionCount = 0;
    let succeededCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const transitionPlan = maintenanceQueueSmokeTransitionPlan(enqueuedJobs.length);

    for (const [index, job] of enqueuedJobs.entries()) {
      const runningJob = await repository.markMaintenanceQueueRunning(job.id, {
        lockedBy: "maintenance-queue-smoke",
        lockedAt: smokeFixtureClocks.maintenanceQueues.lockedAt
      });

      requireStatus(runningJob, "running", "running transition");
      runningTransitionCount += 1;

      if (index < transitionPlan.succeeded) {
        const succeededJob = await repository.markMaintenanceQueueSucceeded(job.id);
        requireStatus(succeededJob, "succeeded", "succeeded transition");
        succeededCount += 1;
        continue;
      }

      if (index < transitionPlan.succeeded + transitionPlan.skipped) {
        const skippedJob = await repository.markMaintenanceQueueSkipped(
          job.id,
          "Skipped by maintenance queue smoke"
        );
        requireStatus(skippedJob, "skipped", "skipped transition");
        skippedCount += 1;
        continue;
      }

      const failedJob = await repository.markMaintenanceQueueFailed(
        job.id,
        "Failed by maintenance queue smoke"
      );

      requireStatus(failedJob, "failed", "failed transition");

      if (failedJob.attempts !== runningJob.attempts + 1) {
        throw new Error("Maintenance queue smoke failed transition did not increment attempts");
      }

      failedCount += 1;
    }

    if (
      runningTransitionCount !== enqueuedJobs.length ||
      succeededCount !== transitionPlan.succeeded ||
      skippedCount !== transitionPlan.skipped ||
      failedCount !== transitionPlan.failed
    ) {
      throw new Error("Maintenance queue smoke transition counts did not match expected proof");
    }

    const cleanup = await repository.cleanupTestMaintenanceQueues({ maintenanceQueueIds });
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
