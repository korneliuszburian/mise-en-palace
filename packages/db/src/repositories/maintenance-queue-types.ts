import type { IsoTimestamp } from "@krn/core";
import {
  maintenanceJobTypes,
  maintenanceQueueStatuses
} from "@krn/core";
import type {
  MaintenanceJob,
  MaintenanceJobType,
  MaintenanceQueueStatus
} from "@krn/core";

export const maintenanceQueueTypes = maintenanceJobTypes;

export type MaintenanceQueueType = MaintenanceJobType;

export const maintenanceQueueLifecycleStatuses = maintenanceQueueStatuses;

export type MaintenanceQueueLifecycleStatus = MaintenanceQueueStatus;

interface EnqueueMaintenanceQueueInputBase {
  runAfter?: IsoTimestamp;
  maxAttempts?: number;
}

export type EnqueueMaintenanceQueueInput<TType extends MaintenanceQueueType = MaintenanceQueueType> = {
  [K in TType]: EnqueueMaintenanceQueueInputBase & {
    jobType: K;
    payload: MaintenanceJob<K>["payload"];
  };
}[TType];

export interface MarkMaintenanceQueueRunningInput {
  lockedAt?: IsoTimestamp;
  lockedBy?: string;
}

export interface MaintenanceQueueRecord {
  id: string;
  jobType: MaintenanceQueueType;
  status: MaintenanceQueueLifecycleStatus;
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

export interface CleanupTestMaintenanceQueuesInput {
  maintenanceQueueIds: string[];
}

export interface CleanupTestMaintenanceQueuesResult {
  deletedCount: number;
}

export interface MaintenanceQueueRepository {
  enqueueMaintenanceQueue(input: EnqueueMaintenanceQueueInput): Promise<MaintenanceQueueRecord>;
  listQueuedMaintenanceQueues(limit: number): Promise<MaintenanceQueueRecord[]>;
  markMaintenanceQueueRunning(
    id: string,
    input?: MarkMaintenanceQueueRunningInput
  ): Promise<MaintenanceQueueRecord>;
  markMaintenanceQueueSucceeded(id: string): Promise<MaintenanceQueueRecord>;
  markMaintenanceQueueFailed(id: string, error: string): Promise<MaintenanceQueueRecord>;
  markMaintenanceQueueSkipped(id: string, reason: string): Promise<MaintenanceQueueRecord>;
  cleanupTestMaintenanceQueues(
    input: CleanupTestMaintenanceQueuesInput
  ): Promise<CleanupTestMaintenanceQueuesResult>;
}
