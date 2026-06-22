import type { IsoTimestamp } from "@krn/core";

import type {
  MaintenanceJob,
  MaintenanceJobPayloadByType,
  MaintenanceJobType
} from "./jobTypes.js";

export const workerJobStatuses = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "skipped"
] as const;

export type WorkerJobStatus = (typeof workerJobStatuses)[number];

export interface CreateWorkerJobInput<TType extends MaintenanceJobType = MaintenanceJobType> {
  jobType: TType;
  payload: MaintenanceJobPayloadByType[TType];
  runAfter?: IsoTimestamp;
  maxAttempts?: number;
}

export type WorkerJobRecord<TType extends MaintenanceJobType = MaintenanceJobType> = {
  [K in TType]: {
    id: string;
    jobType: K;
    status: WorkerJobStatus;
    payload: MaintenanceJobPayloadByType[K];
    attempts: number;
    maxAttempts: number;
    runAfter: IsoTimestamp;
    lockedAt?: IsoTimestamp;
    lockedBy?: string;
    lastError?: string;
    createdAt: IsoTimestamp;
    updatedAt: IsoTimestamp;
  };
}[TType];

export interface WorkerJobRepository {
  enqueue<TType extends MaintenanceJobType>(
    input: CreateWorkerJobInput<TType>
  ): Promise<WorkerJobRecord<TType>>;
}

export interface CreateWorkerOutboxEventInput {
  topic: "worker_job.queued";
  payload: {
    workerJobId: string;
    jobType: MaintenanceJobType;
    payload: MaintenanceJob["payload"];
  };
  runAfter?: IsoTimestamp;
}

export interface WorkerOutboxEventReceipt {
  id: string;
  topic: "worker_job.queued";
}

export interface WorkerOutboxRepository {
  enqueue(input: CreateWorkerOutboxEventInput): Promise<WorkerOutboxEventReceipt>;
}

export interface EnqueueMaintenanceJobInput<TType extends MaintenanceJobType = MaintenanceJobType> {
  job: MaintenanceJob<TType>;
  repositories: {
    workerJobs: WorkerJobRepository;
    outbox: WorkerOutboxRepository;
  };
  runAfter?: IsoTimestamp;
  maxAttempts?: number;
}

export interface EnqueueMaintenanceJobResult<TType extends MaintenanceJobType = MaintenanceJobType> {
  workerJob: WorkerJobRecord<TType>;
  outboxEvent: WorkerOutboxEventReceipt;
}

export const enqueueMaintenanceJob = async <TType extends MaintenanceJobType>(
  input: EnqueueMaintenanceJobInput<TType>
): Promise<EnqueueMaintenanceJobResult<TType>> => {
  const workerJob = await input.repositories.workerJobs.enqueue({
    jobType: input.job.jobType,
    payload: input.job.payload,
    ...(input.runAfter === undefined ? {} : { runAfter: input.runAfter }),
    ...(input.maxAttempts === undefined ? {} : { maxAttempts: input.maxAttempts })
  });

  const outboxEvent = await input.repositories.outbox.enqueue({
    topic: "worker_job.queued",
    payload: {
      workerJobId: workerJob.id,
      jobType: workerJob.jobType,
      payload: workerJob.payload
    },
    ...(input.runAfter === undefined ? {} : { runAfter: input.runAfter })
  });

  return {
    workerJob,
    outboxEvent
  };
};
