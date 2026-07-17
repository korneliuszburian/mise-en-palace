import type {
  Sql
} from "postgres";
import {
  buildMaintenanceQueueWriteBoundaryReadback,
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
  DrizzleMemoryRepository
} from "../../repositories/drizzle-memory-repository.js";
import {
  DrizzleProjectRepository
} from "../../repositories/drizzle-project-repository.js";
import {
  createExpireStaleMemoryMaintenanceHandler
} from "../../repositories/expire-stale-memory-maintenance-handler.js";
import { runMaintenanceQueueRecord } from "../../repositories/maintenance-queue-executor.js";
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
  recoveredRecordCount: number;
  candidateConcurrentRunCount: number;
  candidateReplayRunCount: number;
  candidatePersistedCount: number;
  candidateStableId: boolean;
  successRecordedCount: number;
  skipRecordedCount: number;
  retryRecordedCount: number;
  deadLetterRecordedCount: number;
  cleanupDeletedCount: number;
  candidateCleanupDeletedCount: number;
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

const candidateIdFromOutcome = (
  outcome: Awaited<ReturnType<ReturnType<typeof createExpireStaleMemoryMaintenanceHandler>["run"]>>,
  label: string
): string => {
  if (outcome.status !== "succeeded" || outcome.createdReviewCandidates?.length !== 1) {
    throw new Error(`Maintenance queue smoke ${label} did not create one review candidate`);
  }

  const candidate = outcome.createdReviewCandidates[0];

  if (candidate === undefined) {
    throw new Error(`Maintenance queue smoke ${label} did not return a candidate id`);
  }

  return candidate.id;
};

const createCandidateProofProject = async (
  projectRepository: DrizzleProjectRepository,
  marker: string
) => {
  const workspace = await projectRepository.createWorkspace({
    slug: `maintenance-queue-candidate-${marker}`,
    displayName: `Maintenance queue candidate ${marker}`,
    metadata: {
      fixtureMarker: marker,
      smokeId: marker
    }
  });
  const project = await projectRepository.createProject({
    workspaceId: workspace.id,
    slug: `maintenance-queue-candidate-${marker}`,
    displayName: `Maintenance queue candidate ${marker}`,
    metadata: {
      smokeId: marker
    }
  });

  return project;
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
  const concurrentCandidateDatabaseA = createSmokeDatabase(input.databaseUrl);
  const concurrentCandidateDatabaseB = createSmokeDatabase(input.databaseUrl);
  const repository = new DrizzleMaintenanceQueueRepository(db);
  const projectRepository = new DrizzleProjectRepository(db);
  const maintenanceQueueIds: string[] = [];
  let cleanedUp = false;

  try {
    await projectRepository.cleanupFixtureProjectRecords(marker);
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
    let recoveredRecordCount = 0;
    const staleRecoveryTarget = enqueuedRecords[0];
    if (staleRecoveryTarget !== undefined) {
      const staleClaim = await repository.claimMaintenanceQueueRecord(staleRecoveryTarget.id, {
        lockedBy: "maintenance-queue-smoke-stale-claim",
        lockedAt: smokeFixtureClocks.maintenanceQueues.lockedAt
      });
      requireStatus(staleClaim, "running", "stale recovery claim");
      claimedRecordCount += 1;

      const recoveredRecord = await repository.recoverStaleMaintenanceQueueRecord(
        staleRecoveryTarget.id,
        {
          lockedBefore: smokeFixtureClocks.maintenanceQueues.recoveryLockedBefore,
          error: "Recovered stale maintenance queue smoke record",
          runAfter: smokeFixtureClocks.maintenanceQueues.runAfter
        }
      );
      requireStatus(recoveredRecord, "queued", "stale recovery record");
      recoveredRecordCount = 1;
    }

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
      claimedRecordCount !== enqueuedRecords.length + recoveredRecordCount ||
      settlementCounts.success !== settlementPlan.success ||
      settlementCounts.skip !== settlementPlan.skip ||
      settlementCounts.retry !== settlementPlan.retry ||
      settlementCounts.deadLetter !== settlementPlan.deadLetter
    ) {
      throw new Error("Maintenance queue smoke record settlement counts did not match expected proof");
    }

    const candidateProject = await createCandidateProofProject(projectRepository, marker);
    const candidateMemoryRepositoryA = new DrizzleMemoryRepository(
      concurrentCandidateDatabaseA.db
    );
    const candidateMemoryRepositoryB = new DrizzleMemoryRepository(
      concurrentCandidateDatabaseB.db
    );
    const staleMemory = await candidateMemoryRepositoryA.createMemoryRecord({
      projectId: candidateProject.id,
      key: `maintenance-queue-smoke:${marker}:stale-memory`,
      kind: "procedure",
      summary: "A stale memory used to prove candidate replay safety.",
      body: "This memory exists only to drive the maintenance candidate smoke.",
      owner: "maintenance-queue-smoke",
      confidence: 70,
      applicationGuidance: "Review the candidate before any durable mutation.",
      invalidationRule: "A newer reviewed memory replaces this stale fixture.",
      sourceLineage: [{
        sourceId: `maintenance-queue-smoke:${marker}`,
        note: "maintenance candidate idempotency smoke"
      }],
      isUserPreference: false,
      validFrom: "2026-07-01T00:00:00.000Z",
      validUntil: "2026-07-02T00:00:00.000Z",
      metadata: {
        smokeId: marker
      }
    });
    const candidateProofRecord: MaintenanceQueueRecord = {
      id: `maintenance-candidate-proof-${marker}`,
      jobType: "expire_stale_memory",
      queueKey: `expire_stale_memory:candidate-proof:${marker}`,
      status: "running",
      payload: {
        projectId: candidateProject.id,
        reason: "maintenance candidate idempotency smoke",
        olderThan: "2026-07-08T00:00:00.000Z"
      },
      attempts: 1,
      maxAttempts: 3,
      runAfter: "2026-07-08T00:00:00.000Z",
      lockedAt: "2026-07-08T00:00:00.000Z",
      lockedBy: "maintenance-candidate-idempotency-smoke",
      createdAt: "2026-07-08T00:00:00.000Z",
      updatedAt: "2026-07-08T00:00:00.000Z"
    };
    const candidateProofJob = {
      jobType: "expire_stale_memory" as const,
      payload: {
        projectId: candidateProject.id,
        reason: "maintenance candidate idempotency smoke",
        olderThan: "2026-07-08T00:00:00.000Z"
      }
    };
    const candidateProofWriteBoundary = buildMaintenanceQueueWriteBoundaryReadback(
      "expire_stale_memory"
    );
    const candidateHandlerA = createExpireStaleMemoryMaintenanceHandler({
      memoryRepository: candidateMemoryRepositoryA
    });
    const candidateHandlerB = createExpireStaleMemoryMaintenanceHandler({
      memoryRepository: candidateMemoryRepositoryB
    });
    const executorSuccess = await repository.enqueueMaintenanceQueue({
      jobType: "expire_stale_memory",
      payload: {
        projectId: candidateProject.id,
        olderThan: "2026-07-08T00:00:00.000Z",
        reason: "executor production proposal readback"
      },
      runAfter: smokeFixtureClocks.maintenanceQueues.runAfter
    });
    maintenanceQueueIds.push(executorSuccess.id);
    const executorSuccessResult = await runMaintenanceQueueRecord({
      repository,
      recordId: executorSuccess.id,
      handlers: [candidateHandlerA]
    });
    requireStatus(executorSuccessResult.record, "succeeded", "executor production proposal readback");
    if (executorSuccessResult.createdReviewCandidates.length !== 1) {
      throw new Error("Maintenance queue smoke executor did not persist one review candidate");
    }
    const executorForged = await repository.enqueueMaintenanceQueue({
      jobType: "expire_stale_memory",
      payload: {
        projectId: candidateProject.id,
        olderThan: "2026-07-09T00:00:00.000Z",
        reason: "executor forged boundary readback"
      },
      runAfter: smokeFixtureClocks.maintenanceQueues.runAfter
    });
    maintenanceQueueIds.push(executorForged.id);
    const executorForgedResult = await runMaintenanceQueueRecord({
      repository,
      recordId: executorForged.id,
      handlers: [{
        jobType: "expire_stale_memory",
        declaredWrites: ["memory_records"],
        async run() {
          throw new Error("forged handler must not execute");
        }
      }]
    });
    if (executorForgedResult.status !== "retried" || executorForgedResult.handlerWriteBoundary?.status !== "failed") {
      throw new Error("Maintenance queue smoke did not fail closed on forged executor write boundary");
    }
    const [concurrentOutcomeA, concurrentOutcomeB] = await Promise.all([
      candidateHandlerA.run({
        record: candidateProofRecord,
        job: candidateProofJob,
        writeBoundary: candidateProofWriteBoundary
      }),
      candidateHandlerB.run({
        record: candidateProofRecord,
        job: candidateProofJob,
        writeBoundary: candidateProofWriteBoundary
      })
    ]);
    const concurrentCandidateIdA = candidateIdFromOutcome(
      concurrentOutcomeA,
      "concurrent run A"
    );
    const concurrentCandidateIdB = candidateIdFromOutcome(
      concurrentOutcomeB,
      "concurrent run B"
    );
    const replayOutcome = await candidateHandlerA.run({
      record: candidateProofRecord,
      job: candidateProofJob,
      writeBoundary: candidateProofWriteBoundary
    });
    const replayCandidateId = candidateIdFromOutcome(replayOutcome, "replay run");
    const candidateRows = await client<{ count: number }[]>`
      select count(*)::int as count
      from anti_memory_candidates
      where project_id = ${candidateProject.id}
        and maintenance_identity = ${
          `maintenance:expire_stale_memory:${candidateProofRecord.id}:` +
          `${staleMemory.id}:review_memory_invalidation`
        }
    `;
    const candidatePersistedCount = candidateRows[0]?.count ?? 0;
    const candidateStableId =
      concurrentCandidateIdA === concurrentCandidateIdB &&
      concurrentCandidateIdA === replayCandidateId;

    if (candidatePersistedCount !== 1 || !candidateStableId) {
      throw new Error("Maintenance queue smoke duplicated a semantic maintenance candidate");
    }

    const cleanup = await repository.cleanupTestMaintenanceQueues({ maintenanceQueueIds });
    const remainingMarkerCount = await countMarkerRows(client, marker);
    const candidateCleanupDeletedCount = await projectRepository.cleanupFixtureProjectRecords(marker);
    cleanedUp =
      cleanup.deletedCount === maintenanceQueueIds.length &&
      candidateCleanupDeletedCount === 1 &&
      remainingMarkerCount === 0;

    return {
      writeBoundaryValidatedCount: writeBoundary.writeBoundaryValidatedCount,
      enqueuedRecordCount: enqueuedRecords.length,
      queuedReadbackCount,
      claimedRecordCount,
      recoveredRecordCount,
      candidateConcurrentRunCount: 2,
      candidateReplayRunCount: 1,
      candidatePersistedCount,
      candidateStableId,
      successRecordedCount: settlementCounts.success,
      skipRecordedCount: settlementCounts.skip,
      retryRecordedCount: settlementCounts.retry,
      deadLetterRecordedCount: settlementCounts.deadLetter,
      cleanupDeletedCount: cleanup.deletedCount,
      candidateCleanupDeletedCount,
      remainingMarkerCount,
      cleanedUp
    };
  } catch (error) {
    await repository.cleanupTestMaintenanceQueues({ maintenanceQueueIds });
    await projectRepository.cleanupFixtureProjectRecords(marker);
    await deleteMarkerRows(client, marker);
    throw error;
  } finally {
    if (!cleanedUp) {
      await repository.cleanupTestMaintenanceQueues({ maintenanceQueueIds });
      await projectRepository.cleanupFixtureProjectRecords(marker);
      await deleteMarkerRows(client, marker);
    }

    await client.end();
    await concurrentCandidateDatabaseA.client.end();
    await concurrentCandidateDatabaseB.client.end();
  }
};
