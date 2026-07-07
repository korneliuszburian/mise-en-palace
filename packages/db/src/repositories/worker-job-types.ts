import type { IsoTimestamp } from "@krn/core";
import {
  maintenanceJobTypes,
  workerJobStatuses
} from "@krn/maintenance-preview";
import type {
  MaintenanceJob,
  MaintenanceJobType,
  WorkerJobStatus
} from "@krn/maintenance-preview";

export const workerJobTypes = maintenanceJobTypes;

export type WorkerJobType = MaintenanceJobType;

export const workerJobLifecycleStatuses = workerJobStatuses;

export type WorkerJobLifecycleStatus = WorkerJobStatus;

interface EnqueueWorkerJobInputBase {
  runAfter?: IsoTimestamp;
  maxAttempts?: number;
}

export type EnqueueWorkerJobInput<TType extends WorkerJobType = WorkerJobType> = {
  [K in TType]: EnqueueWorkerJobInputBase & {
    jobType: K;
    payload: MaintenanceJob<K>["payload"];
  };
}[TType];

export interface MarkWorkerJobRunningInput {
  lockedAt?: IsoTimestamp;
  lockedBy?: string;
}

export interface WorkerJobRecord {
  id: string;
  jobType: WorkerJobType;
  status: WorkerJobLifecycleStatus;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  runAfter: IsoTimestamp;
  lockedAt?: IsoTimestamp;
  lockedBy?: string;
  lastError?: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface CleanupTestWorkerJobsInput {
  workerJobIds: string[];
}

export interface CleanupTestWorkerJobsResult {
  deletedCount: number;
}

export interface WorkerJobRepository {
  enqueueWorkerJob(input: EnqueueWorkerJobInput): Promise<WorkerJobRecord>;
  getWorkerJobById(id: string): Promise<WorkerJobRecord | undefined>;
  listQueuedWorkerJobs(limit: number): Promise<WorkerJobRecord[]>;
  markWorkerJobRunning(
    id: string,
    input?: MarkWorkerJobRunningInput
  ): Promise<WorkerJobRecord>;
  markWorkerJobSucceeded(id: string): Promise<WorkerJobRecord>;
  markWorkerJobFailed(id: string, error: string): Promise<WorkerJobRecord>;
  markWorkerJobSkipped(id: string, reason: string): Promise<WorkerJobRecord>;
  cleanupTestWorkerJobs(
    input: CleanupTestWorkerJobsInput
  ): Promise<CleanupTestWorkerJobsResult>;
}
