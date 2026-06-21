import type { IsoTimestamp } from "@krn/core";

import type {
  MaintenanceJob,
  MaintenanceJobPayloadByType,
  MaintenanceJobType
} from "./jobTypes.js";

export type WorkerJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "dead_letter"
  | "cancelled";

export interface CreateWorkerJobInput<TType extends MaintenanceJobType = MaintenanceJobType> {
  type: TType;
  payload: MaintenanceJobPayloadByType[TType];
  availableAt?: IsoTimestamp;
  maxAttempts?: number;
}

export type WorkerJobRecord<TType extends MaintenanceJobType = MaintenanceJobType> = {
  [K in TType]: {
    id: string;
    type: K;
    status: WorkerJobStatus;
    payload: MaintenanceJobPayloadByType[K];
    attempts: number;
    maxAttempts: number;
    availableAt: IsoTimestamp;
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
    type: MaintenanceJobType;
    payload: MaintenanceJob["payload"];
  };
  availableAt?: IsoTimestamp;
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
  availableAt?: IsoTimestamp;
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
    type: input.job.type,
    payload: input.job.payload,
    ...(input.availableAt === undefined ? {} : { availableAt: input.availableAt }),
    ...(input.maxAttempts === undefined ? {} : { maxAttempts: input.maxAttempts })
  });

  const outboxEvent = await input.repositories.outbox.enqueue({
    topic: "worker_job.queued",
    payload: {
      workerJobId: workerJob.id,
      type: workerJob.type,
      payload: workerJob.payload
    },
    ...(input.availableAt === undefined ? {} : { availableAt: input.availableAt })
  });

  return {
    workerJob,
    outboxEvent
  };
};
