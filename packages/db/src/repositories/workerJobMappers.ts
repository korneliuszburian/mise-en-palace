import type { InferSelectModel } from "drizzle-orm";

import { workerJobs } from "../schema/index.js";
import {
  metadataOrEmpty,
  toIsoTimestamp
} from "./common.js";
import {
  workerJobLifecycleStatuses,
  workerJobTypes
} from "./workerJobTypes.js";
import type {
  WorkerJobLifecycleStatus,
  WorkerJobRecord,
  WorkerJobType
} from "./workerJobTypes.js";

type WorkerJobRow = InferSelectModel<typeof workerJobs>;

const workerJobTypeSet = new Set<string>(workerJobTypes);
const workerJobLifecycleStatusSet = new Set<string>(workerJobLifecycleStatuses);

const toWorkerJobType = (value: string): WorkerJobType => {
  if (workerJobTypeSet.has(value)) {
    return value as WorkerJobType;
  }

  throw new Error(`Unsupported worker job type: ${value}`);
};

const toWorkerJobLifecycleStatus = (value: string): WorkerJobLifecycleStatus => {
  if (workerJobLifecycleStatusSet.has(value)) {
    return value as WorkerJobLifecycleStatus;
  }

  throw new Error(`Unsupported worker job status: ${value}`);
};

export const mapWorkerJob = (row: WorkerJobRow): WorkerJobRecord => ({
  id: row.id,
  jobType: toWorkerJobType(row.jobType),
  status: toWorkerJobLifecycleStatus(row.status),
  payload: metadataOrEmpty(row.payload),
  attempts: row.attempts,
  maxAttempts: row.maxAttempts,
  runAfter: toIsoTimestamp(row.runAfter),
  ...(row.lockedAt === null ? {} : { lockedAt: toIsoTimestamp(row.lockedAt) }),
  ...(row.lockedBy === null ? {} : { lockedBy: row.lockedBy }),
  ...(row.lastError === null ? {} : { lastError: row.lastError }),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});
