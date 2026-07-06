import type { InferSelectModel } from "drizzle-orm";

import { workerJobs } from "../schema/index.js";
import {
  metadataOrEmpty,
  toIsoTimestamp
} from "./repository-value-readers.js";
import { mapLockedRowMetadataFields } from "./locked-row-metadata.js";
import {
  workerJobLifecycleStatuses,
  workerJobTypes
} from "./worker-job-types.js";
import type {
  WorkerJobLifecycleStatus,
  WorkerJobRecord,
  WorkerJobType
} from "./worker-job-types.js";

type WorkerJobRow = InferSelectModel<typeof workerJobs>;

const workerJobTypeSet = new Set<string>(workerJobTypes);
const workerJobLifecycleStatusSet = new Set<string>(workerJobLifecycleStatuses);

const isWorkerJobType = (value: string): value is WorkerJobType =>
  workerJobTypeSet.has(value);

const isWorkerJobLifecycleStatus = (
  value: string
): value is WorkerJobLifecycleStatus =>
  workerJobLifecycleStatusSet.has(value);

const toWorkerJobType = (value: string): WorkerJobType => {
  if (isWorkerJobType(value)) {
    return value;
  }

  throw new Error(`Unsupported worker job type: ${value}`);
};

const toWorkerJobLifecycleStatus = (value: string): WorkerJobLifecycleStatus => {
  if (isWorkerJobLifecycleStatus(value)) {
    return value;
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
  ...mapLockedRowMetadataFields(row)
});
