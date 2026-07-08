import {
  assessMaintenanceQueueRuntimeWriteBoundary,
  buildMaintenanceQueueWriteBoundaryReadback,
  parseMaintenanceJob
} from "@krn/core";
import type {
  IsoTimestamp,
  MaintenanceJob,
  MaintenanceJobType,
  MaintenanceQueueRuntimeWriteBoundaryAssessment,
  MaintenanceQueueWriteBoundaryReadback
} from "@krn/core";

import type {
  ClaimMaintenanceQueueRecordInput,
  MaintenanceQueueRecord,
  MaintenanceQueueRepository
} from "./maintenance-queue-types.js";

export type MaintenanceQueueHandlerOutcome =
  | {
      status: "succeeded";
    }
  | {
      status: "skipped";
      reason: string;
    }
  | {
      status: "failed";
      error: string;
      retryAfter?: IsoTimestamp;
    };

export interface MaintenanceQueueHandlerInput {
  record: MaintenanceQueueRecord;
  job: MaintenanceJob;
  writeBoundary: MaintenanceQueueWriteBoundaryReadback;
}

export interface MaintenanceQueueHandler {
  jobType: MaintenanceJobType;
  declaredWrites: readonly string[];
  run(input: MaintenanceQueueHandlerInput): Promise<MaintenanceQueueHandlerOutcome>;
}

export interface RunMaintenanceQueueRecordInput {
  repository: MaintenanceQueueRepository;
  recordId: string;
  handlers: readonly MaintenanceQueueHandler[];
  claim?: ClaimMaintenanceQueueRecordInput;
}

export type MaintenanceQueueExecutorStatus =
  | "succeeded"
  | "skipped"
  | "retried"
  | "dead_lettered";

export interface MaintenanceQueueExecutorReadback {
  status: MaintenanceQueueExecutorStatus;
  jobType: MaintenanceJobType;
  record: MaintenanceQueueRecord;
  writeBoundary: MaintenanceQueueWriteBoundaryReadback;
  handlerWriteBoundary?: MaintenanceQueueRuntimeWriteBoundaryAssessment;
  queueRecordKeyUniqueness: "db_unique_queue_key";
  proves: readonly string[];
  doesNotProve: readonly string[];
}

const executorBaseProofs = [
  "A single queued maintenance record was claimed through the repository before settlement.",
  "The claimed payload was parsed for its job type before handler dispatch.",
  "The record was settled through the repository lifecycle after executor handling."
] as const;

const handlerBoundaryProof =
  "Handler declared writes were checked against the job memory boundary before handler execution.";

const executorDoesNotProve = [
  "Explicit maintenance record execution does not prove autonomous scheduler or daemon readiness.",
  "Explicit maintenance record execution relies on the DB queue_key constraint for enqueue deduplication.",
  "Handler side effects still require focused tests or DB smoke evidence.",
  "Maintenance execution does not directly promote memory records or source claims."
] as const;

const findHandler = (
  handlers: readonly MaintenanceQueueHandler[],
  jobType: MaintenanceJobType
): MaintenanceQueueHandler | undefined =>
  handlers.find((handler) => handler.jobType === jobType);

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Maintenance queue handler failed";

const buildReadback = (
  status: MaintenanceQueueExecutorStatus,
  record: MaintenanceQueueRecord,
  writeBoundary: MaintenanceQueueWriteBoundaryReadback,
  handlerWriteBoundary?: MaintenanceQueueRuntimeWriteBoundaryAssessment
): MaintenanceQueueExecutorReadback => ({
  status,
  jobType: record.jobType,
  record,
  writeBoundary,
  ...(handlerWriteBoundary === undefined ? {} : { handlerWriteBoundary }),
  queueRecordKeyUniqueness: "db_unique_queue_key",
  proves: [
    ...executorBaseProofs,
    ...(handlerWriteBoundary === undefined ? [] : [handlerBoundaryProof])
  ],
  doesNotProve: executorDoesNotProve
});

const settleFailure = async (
  repository: MaintenanceQueueRepository,
  claimedRecord: MaintenanceQueueRecord,
  writeBoundary: MaintenanceQueueWriteBoundaryReadback,
  error: string,
  retryAfter?: IsoTimestamp,
  handlerWriteBoundary?: MaintenanceQueueRuntimeWriteBoundaryAssessment
): Promise<MaintenanceQueueExecutorReadback> => {
  const nextAttempt = claimedRecord.attempts + 1;

  if (nextAttempt < claimedRecord.maxAttempts) {
    const retryRecord = await repository.recordMaintenanceQueueRetry(claimedRecord.id, {
      error,
      ...(retryAfter === undefined ? {} : { runAfter: retryAfter })
    });

    return buildReadback("retried", retryRecord, writeBoundary, handlerWriteBoundary);
  }

  const deadLetterRecord = await repository.recordMaintenanceQueueDeadLetter(
    claimedRecord.id,
    error
  );

  return buildReadback("dead_lettered", deadLetterRecord, writeBoundary, handlerWriteBoundary);
};

export const runMaintenanceQueueRecord = async (
  input: RunMaintenanceQueueRecordInput
): Promise<MaintenanceQueueExecutorReadback> => {
  const claimedRecord = await input.repository.claimMaintenanceQueueRecord(
    input.recordId,
    input.claim
  );
  const writeBoundary = buildMaintenanceQueueWriteBoundaryReadback(claimedRecord.jobType);
  const job = parseMaintenanceJob(claimedRecord.jobType, claimedRecord.payload);

  if (job === undefined) {
    const deadLetterRecord = await input.repository.recordMaintenanceQueueDeadLetter(
      claimedRecord.id,
      `Invalid maintenance payload for ${claimedRecord.jobType}`
    );

    return buildReadback("dead_lettered", deadLetterRecord, writeBoundary);
  }

  const handler = findHandler(input.handlers, job.jobType);
  if (handler === undefined) {
    const skippedRecord = await input.repository.recordMaintenanceQueueSkip(
      claimedRecord.id,
      `No maintenance handler registered for ${job.jobType}`
    );

    return buildReadback("skipped", skippedRecord, writeBoundary);
  }

  const handlerWriteBoundary = assessMaintenanceQueueRuntimeWriteBoundary(
    handler.jobType,
    handler.declaredWrites
  );

  if (handlerWriteBoundary.status === "failed") {
    return settleFailure(
      input.repository,
      claimedRecord,
      writeBoundary,
      `Maintenance handler write boundary failed for ${job.jobType}`,
      undefined,
      handlerWriteBoundary
    );
  }

  try {
    const outcome = await handler.run({
      record: claimedRecord,
      job,
      writeBoundary
    });

    if (outcome.status === "succeeded") {
      const succeededRecord = await input.repository.recordMaintenanceQueueSuccess(
        claimedRecord.id
      );

      return buildReadback(
        "succeeded",
        succeededRecord,
        writeBoundary,
        handlerWriteBoundary
      );
    }

    if (outcome.status === "skipped") {
      const skippedRecord = await input.repository.recordMaintenanceQueueSkip(
        claimedRecord.id,
        outcome.reason
      );

      return buildReadback("skipped", skippedRecord, writeBoundary, handlerWriteBoundary);
    }

    return settleFailure(
      input.repository,
      claimedRecord,
      writeBoundary,
      outcome.error,
      outcome.retryAfter,
      handlerWriteBoundary
    );
  } catch (error) {
    return settleFailure(
      input.repository,
      claimedRecord,
      writeBoundary,
      errorMessage(error),
      undefined,
      handlerWriteBoundary
    );
  }
};
