import type { InferSelectModel } from "drizzle-orm";

import { maintenanceQueues } from "../schema/index.js";
import {
  metadataOrEmpty,
  toIsoTimestamp
} from "./repository-value-readers.js";
import { mapLockedRowMetadataFields } from "./locked-row-metadata.js";
import {
  maintenanceQueueLifecycleStatuses,
  maintenanceQueueTypes
} from "./maintenance-queue-types.js";
import type {
  MaintenanceQueueLifecycleStatus,
  MaintenanceQueueRecord,
  MaintenanceQueueType
} from "./maintenance-queue-types.js";

type MaintenanceQueueRow = InferSelectModel<typeof maintenanceQueues>;

const maintenanceQueueTypeSet = new Set<string>(maintenanceQueueTypes);
const maintenanceQueueLifecycleStatusSet = new Set<string>(maintenanceQueueLifecycleStatuses);

const isMaintenanceQueueType = (value: string): value is MaintenanceQueueType =>
  maintenanceQueueTypeSet.has(value);

const isMaintenanceQueueLifecycleStatus = (
  value: string
): value is MaintenanceQueueLifecycleStatus =>
  maintenanceQueueLifecycleStatusSet.has(value);

const toMaintenanceQueueType = (value: string): MaintenanceQueueType => {
  if (isMaintenanceQueueType(value)) {
    return value;
  }

  throw new Error(`Unsupported maintenance queue type: ${value}`);
};

const toMaintenanceQueueLifecycleStatus = (value: string): MaintenanceQueueLifecycleStatus => {
  if (isMaintenanceQueueLifecycleStatus(value)) {
    return value;
  }

  throw new Error(`Unsupported maintenance queue status: ${value}`);
};

export const mapMaintenanceQueue = (row: MaintenanceQueueRow): MaintenanceQueueRecord => ({
  id: row.id,
  jobType: toMaintenanceQueueType(row.jobType),
  status: toMaintenanceQueueLifecycleStatus(row.status),
  payload: metadataOrEmpty(row.payload),
  attempts: row.attempts,
  maxAttempts: row.maxAttempts,
  runAfter: toIsoTimestamp(row.runAfter),
  ...mapLockedRowMetadataFields(row)
});
