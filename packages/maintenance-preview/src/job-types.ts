import {
  workerJobStatuses
} from "@krn/core";

export {
  assertMaintenanceJobWriteBoundary,
  assessMaintenanceJobWriteBoundary,
  buildMaintenanceJobWriteBoundaryReadback,
  describeMaintenanceJob,
  isMaintenanceJobType,
  maintenanceJobPersistenceContract,
  maintenanceJobTypes,
  parseMaintenanceJobType
} from "@krn/core";

export const maintenanceQueueStatuses = workerJobStatuses;

export type {
  CompactMemoryPayload,
  DetectContradictionPayload,
  EmbedMemoryRecordPayload,
  EmbedSourceChunkPayload,
  ExpireStaleMemoryPayload,
  MaintenanceJob,
  MaintenanceJobAllowedWrite,
  MaintenanceJobBoundaryReadback,
  MaintenanceJobDescription,
  MaintenanceJobForbiddenWrite,
  MaintenanceJobMemoryCoreGate,
  MaintenanceJobPayloadByType,
  MaintenanceJobPersistenceContract,
  MaintenanceJobType,
  MaintenanceJobWriteBoundaryAssessment,
  MaintenanceJobWriteBoundaryViolation,
  WorkerJobStatus as MaintenanceQueueStatus
} from "@krn/core";
