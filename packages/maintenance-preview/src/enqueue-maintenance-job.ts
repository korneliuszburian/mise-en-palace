import type {
  MaintenanceJob,
  MaintenanceJobPayloadByType,
  MaintenanceJobType,
  IsoTimestamp
} from "@krn/core";
import type {
  MaintenanceQueueStatus
} from "./job-types.js";

export type MaintenanceQueueRecord<TType extends MaintenanceJobType = MaintenanceJobType> = {
  [K in TType]: {
    id: string;
    jobType: K;
    status: MaintenanceQueueStatus;
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

export interface MaintenanceQueueOutboxReceipt {
  id: string;
  topic: "maintenance_queue.queued";
}

export interface EnqueueMaintenanceJobRequest<
  TType extends MaintenanceJobType = MaintenanceJobType
> {
  job: MaintenanceJob<TType>;
  runAfter?: IsoTimestamp;
  maxAttempts?: number;
}

export interface EnqueueMaintenanceJobResult<TType extends MaintenanceJobType = MaintenanceJobType> {
  queueRecord: MaintenanceQueueRecord<TType>;
  outboxEvent: MaintenanceQueueOutboxReceipt;
}

export interface MaintenanceJobQueueRepository {
  enqueue<TType extends MaintenanceJobType>(
    request: EnqueueMaintenanceJobRequest<TType>
  ): Promise<EnqueueMaintenanceJobResult<TType>>;
}
