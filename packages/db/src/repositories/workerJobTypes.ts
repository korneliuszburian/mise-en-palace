import type { IsoTimestamp } from "@krn/core";

export const workerJobTypes = [
  "embed_source_chunk",
  "embed_memory_record",
  "compact_memory",
  "detect_contradiction",
  "expire_stale_memory",
  "promote_eval_candidate"
] as const;

export type WorkerJobType = (typeof workerJobTypes)[number];

export const workerJobLifecycleStatuses = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "skipped"
] as const;

export type WorkerJobLifecycleStatus = (typeof workerJobLifecycleStatuses)[number];

export interface EnqueueWorkerJobInput {
  jobType: WorkerJobType;
  payload: Record<string, unknown>;
  runAfter?: IsoTimestamp;
  maxAttempts?: number;
}

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
