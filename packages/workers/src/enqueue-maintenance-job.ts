import type { IsoTimestamp } from "@krn/core";

import type {
  MaintenanceJob,
  MaintenanceJobPayloadByType,
  MaintenanceJobType
} from "./job-types.js";

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

export interface EnqueueMaintenanceJobResult<TType extends MaintenanceJobType = MaintenanceJobType> {
  workerJob: WorkerJobRecord<TType>;
  outboxEvent: WorkerOutboxEventReceipt;
}

export interface MaintenanceJobQueueRepository {
  enqueue<TType extends MaintenanceJobType>(
    request: EnqueueMaintenanceJobRequest<TType>
  ): Promise<EnqueueMaintenanceJobResult<TType>>;
}
