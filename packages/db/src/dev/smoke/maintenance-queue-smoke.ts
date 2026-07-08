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
  enqueuedRecordCount: number;
  queuedReadbackCount: number;
  claimedRecordCount: number;
  successRecordedCount: number;
  skipRecordedCount: number;
  retryRecordedCount: number;
  deadLetterRecordedCount: number;
  cleanupDeletedCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

interface CountRow {
  count: number;
}

interface MaintenanceQueueBoundaryReadback {
  writeBoundaryValidatedCount: number;
}

type MaintenanceQueueSmokeSettlementKind = "success" | "skip" | "retry" | "deadLetter";

export interface MaintenanceQueueSmokeSettlementPlan {
  success: number;
  skip: number;
  retry: number;
  deadLetter: number;
}

export const maintenanceQueueSmokeSettlementPlan = (
  jobCount: number
): MaintenanceQueueSmokeSettlementPlan => {
  const success = Math.min(2, jobCount);
  const skip = Math.min(1, Math.max(jobCount - success, 0));
  const retry = Math.min(1, Math.max(jobCount - success - skip, 0));
  const deadLetter = Math.max(jobCount - success - skip - retry, 0);

  return {
    success,
    skip,
    retry,
    deadLetter
  };
};

const countMarkerRows = async (client: Sql, marker: string): Promise<number> => {
  const rows = await client<CountRow[]>`
    select count(*)::int as count
    from maintenance_queue_records
    where payload->>'smokeId' = ${marker}
  `;

  return rows[0]?.count ?? 0;
};

const deleteMarkerRows = async (client: Sql, marker: string): Promise<void> => {
  await client`
    delete from maintenance_queue_records
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

  if (jobType === "review_feedback_delta") {
    return {
      jobType,
      payload: {
        ...basePayload,
        projectId: `project-${marker}`,
        feedbackDeltaId: `feedback-delta-${marker}`
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

const maintenanceQueueBoundaryReadback = (): MaintenanceQueueBoundaryReadback => {
  const descriptions = maintenanceQueueTypes.map((jobType) => describeMaintenanceJob(jobType));

  return {
    writeBoundaryValidatedCount: descriptions.length
  };
};

const settlementKindForIndex = (
  index: number,
  plan: MaintenanceQueueSmokeSettlementPlan
): MaintenanceQueueSmokeSettlementKind => {
  if (index < plan.success) {
    return "success";
  }

  if (index < plan.success + plan.skip) {
    return "skip";
  }

  return index < plan.success + plan.skip + plan.retry ? "retry" : "deadLetter";
};

const settleMaintenanceQueueSmokeRecord = async (
  repository: DrizzleMaintenanceQueueRepository,
  record: MaintenanceQueueRecord,
  index: number,
  plan: MaintenanceQueueSmokeSettlementPlan
): Promise<MaintenanceQueueSmokeSettlementKind> => {
  const claimedRecord = await repository.claimMaintenanceQueueRecord(record.id, {
    lockedBy: "maintenance-queue-smoke-claim",
    lockedAt: smokeFixtureClocks.maintenanceQueues.lockedAt
  });
  const settlementKind = settlementKindForIndex(index, plan);

  requireStatus(claimedRecord, "running", "record claim");

  if (settlementKind === "success") {
    const successRecord = await repository.recordMaintenanceQueueSuccess(record.id);
    requireStatus(successRecord, "succeeded", "success record");

    return settlementKind;
  }

  if (settlementKind === "skip") {
    const skipRecord = await repository.recordMaintenanceQueueSkip(
      record.id,
      "Skipped by maintenance queue smoke"
    );
    requireStatus(skipRecord, "skipped", "skip record");

    return settlementKind;
  }

  if (settlementKind === "retry") {
    const retryRecord = await repository.recordMaintenanceQueueRetry(record.id, {
      error: "Retried by maintenance queue smoke",
      runAfter: smokeFixtureClocks.maintenanceQueues.runAfter
    });

    requireStatus(retryRecord, "queued", "retry record");

    if (retryRecord.attempts !== claimedRecord.attempts + 1) {
      throw new Error("Maintenance queue smoke retry record did not increment attempts");
    }

    return settlementKind;
  }

  const deadLetterRecord = await repository.recordMaintenanceQueueDeadLetter(
    record.id,
    "Dead-lettered by maintenance queue smoke"
  );

  requireStatus(deadLetterRecord, "dead_letter", "dead-letter record");

  if (deadLetterRecord.attempts !== claimedRecord.attempts + 1) {
    throw new Error("Maintenance queue smoke dead-letter record did not increment attempts");
  }

  return settlementKind;
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

    const enqueuedRecords: MaintenanceQueueRecord[] = [];
    const writeBoundary = maintenanceQueueBoundaryReadback();

    for (const [index, jobType] of maintenanceQueueTypes.entries()) {
      const job = await repository.enqueueMaintenanceQueue({
        ...enqueueInputForJobType(jobType, marker, index + 1),
        runAfter: smokeFixtureClocks.maintenanceQueues.runAfter
      });

      requireStatus(job, "queued", "enqueue");
      maintenanceQueueIds.push(job.id);
      enqueuedRecords.push(job);
    }

    const queuedRecords = await repository.listQueuedMaintenanceQueues(1000);
    const queuedRecordIds = new Set(queuedRecords.map((record) => record.id));
    const queuedReadbackCount = maintenanceQueueIds.filter((id) => queuedRecordIds.has(id)).length;

    if (queuedReadbackCount !== enqueuedRecords.length) {
      throw new Error("Maintenance queue smoke did not read back every queued record");
    }

    let claimedRecordCount = 0;
    const settlementCounts: Record<MaintenanceQueueSmokeSettlementKind, number> = {
      success: 0,
      skip: 0,
      retry: 0,
      deadLetter: 0
    };
    const settlementPlan = maintenanceQueueSmokeSettlementPlan(enqueuedRecords.length);

    for (const [index, record] of enqueuedRecords.entries()) {
      const settlementKind = await settleMaintenanceQueueSmokeRecord(
        repository,
        record,
        index,
        settlementPlan
      );
      claimedRecordCount += 1;
      settlementCounts[settlementKind] += 1;
    }

    if (
      claimedRecordCount !== enqueuedRecords.length ||
      settlementCounts.success !== settlementPlan.success ||
      settlementCounts.skip !== settlementPlan.skip ||
      settlementCounts.retry !== settlementPlan.retry ||
      settlementCounts.deadLetter !== settlementPlan.deadLetter
    ) {
      throw new Error("Maintenance queue smoke record settlement counts did not match expected proof");
    }

    const cleanup = await repository.cleanupTestMaintenanceQueues({ maintenanceQueueIds });
    const remainingMarkerCount = await countMarkerRows(client, marker);
    cleanedUp = cleanup.deletedCount === enqueuedRecords.length && remainingMarkerCount === 0;

    return {
      writeBoundaryValidatedCount: writeBoundary.writeBoundaryValidatedCount,
      enqueuedRecordCount: enqueuedRecords.length,
      queuedReadbackCount,
      claimedRecordCount,
      successRecordedCount: settlementCounts.success,
      skipRecordedCount: settlementCounts.skip,
      retryRecordedCount: settlementCounts.retry,
      deadLetterRecordedCount: settlementCounts.deadLetter,
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
