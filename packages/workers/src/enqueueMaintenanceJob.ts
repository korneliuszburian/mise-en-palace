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

export interface WorkerOutboxEventReceipt {
  id: string;
  topic: "worker_job.queued";
}

export interface EnqueueMaintenanceJobRequest<
  TType extends MaintenanceJobType = MaintenanceJobType
> {
  job: MaintenanceJob<TType>;
  runAfter?: IsoTimestamp;
  maxAttempts?: number;
}

export interface EnqueueMaintenanceJobInput<TType extends MaintenanceJobType = MaintenanceJobType> {
  queue: MaintenanceJobQueueRepository;
  request: EnqueueMaintenanceJobRequest<TType>;
}

export interface EnqueueMaintenanceJobResult<TType extends MaintenanceJobType = MaintenanceJobType> {
  workerJob: WorkerJobRecord<TType>;
  outboxEvent: WorkerOutboxEventReceipt;
}

export interface MaintenanceJobQueueRepository {
  enqueue<TType extends MaintenanceJobType>(
    request: EnqueueMaintenanceJobRequest<TType>
  ): Promise<EnqueueMaintenanceJobResult<TType>>;
}

export const enqueueMaintenanceJob = async <TType extends MaintenanceJobType>(
  input: EnqueueMaintenanceJobInput<TType>
): Promise<EnqueueMaintenanceJobResult<TType>> => input.queue.enqueue(input.request);
