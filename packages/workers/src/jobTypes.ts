import type {
  MemoryRecordId,
  ProjectId,
  SourceChunkId,
  SourceClaimId
} from "@krn/core";
import type { IsoTimestamp } from "@krn/core";

export const maintenanceJobTypes = [
  "embed_source_chunk",
  "embed_memory_record",
  "compact_memory",
  "detect_contradiction",
  "expire_stale_memory"
] as const;

export type MaintenanceJobType = (typeof maintenanceJobTypes)[number];

const maintenanceJobTypeSet = new Set<string>(maintenanceJobTypes);

export const isMaintenanceJobType = (value: unknown): value is MaintenanceJobType =>
  typeof value === "string" && maintenanceJobTypeSet.has(value);

export const parseMaintenanceJobType = (value: unknown): MaintenanceJobType | undefined =>
  isMaintenanceJobType(value) ? value : undefined;

export interface EmbedSourceChunkPayload {
  sourceChunkId: SourceChunkId;
  reason: string;
  embeddingModelId?: string;
}

export interface EmbedMemoryRecordPayload {
  memoryRecordId: MemoryRecordId;
  reason: string;
  embeddingModelId?: string;
}

export interface CompactMemoryPayload {
  projectId: ProjectId;
  reason: string;
  memoryRecordId?: MemoryRecordId;
  maxSourceRecords?: number;
}

export interface DetectContradictionPayload {
  projectId: ProjectId;
  reason: string;
  memoryRecordId?: MemoryRecordId;
  sourceClaimId?: SourceClaimId;
}

export interface ExpireStaleMemoryPayload {
  projectId: ProjectId;
  reason: string;
  olderThan: IsoTimestamp;
}

export type MaintenanceJobPayloadByType = {
  embed_source_chunk: EmbedSourceChunkPayload;
  embed_memory_record: EmbedMemoryRecordPayload;
  compact_memory: CompactMemoryPayload;
  detect_contradiction: DetectContradictionPayload;
  expire_stale_memory: ExpireStaleMemoryPayload;
};

export type MaintenanceJob<TType extends MaintenanceJobType = MaintenanceJobType> = {
  [K in TType]: {
    jobType: K;
    payload: MaintenanceJobPayloadByType[K];
  };
}[TType];

export interface MaintenanceJobDescription {
  jobType: MaintenanceJobType;
  label: string;
  workerTable: "worker_jobs";
  outboxTable: "outbox_events";
  outboxTopic: "worker_job.queued";
  requiresBackgroundLoop: false;
  inputSchema: string;
  idempotencyKey: string;
  outputEvent: "worker_job.completed";
  failureState: "failed";
  allowedWrites: readonly WorkerJobAllowedWrite[];
  forbiddenWrites: readonly WorkerJobForbiddenWrite[];
  memoryCoreGate: WorkerJobMemoryCoreGate;
}

const labels: Record<MaintenanceJobType, string> = {
  embed_source_chunk: "Embed source chunk",
  embed_memory_record: "Embed memory record",
  compact_memory: "Compact memory",
  detect_contradiction: "Detect contradiction",
  expire_stale_memory: "Expire stale memory"
};

export type WorkerJobAllowedWrite =
  | "worker_jobs"
  | "outbox_events"
  | "embeddings"
  | "memory_candidates"
  | "reflection_records";

export type WorkerJobForbiddenWrite =
  | "memory_records"
  | "anti_memory_records"
  | "source_claims"
  | "source_decisions";

export type WorkerJobMemoryCoreGate =
  | "no_memory_core_write"
  | "read_memory_record_only"
  | "write_memory_candidate_only"
  | "write_reflection_record_only"
  | "must_create_reviewed_invalidation_candidate"
  | "must_not_promote_memory_record";

interface MaintenanceJobAuthority {
  inputSchema: string;
  idempotencyKey: string;
  allowedWrites: readonly WorkerJobAllowedWrite[];
  forbiddenWrites: readonly WorkerJobForbiddenWrite[];
  memoryCoreGate: WorkerJobMemoryCoreGate;
}

const commonForbiddenWrites = [
  "memory_records",
  "anti_memory_records",
  "source_claims",
  "source_decisions"
] as const satisfies readonly WorkerJobForbiddenWrite[];

const authorityByType: Record<MaintenanceJobType, MaintenanceJobAuthority> = {
  embed_source_chunk: {
    inputSchema: "EmbedSourceChunkPayload",
    idempotencyKey: "embed_source_chunk:{sourceChunkId}:{embeddingModelId}",
    allowedWrites: ["worker_jobs", "outbox_events", "embeddings"],
    forbiddenWrites: commonForbiddenWrites,
    memoryCoreGate: "no_memory_core_write"
  },
  embed_memory_record: {
    inputSchema: "EmbedMemoryRecordPayload",
    idempotencyKey: "embed_memory_record:{memoryRecordId}:{embeddingModelId}",
    allowedWrites: ["worker_jobs", "outbox_events", "embeddings"],
    forbiddenWrites: commonForbiddenWrites,
    memoryCoreGate: "read_memory_record_only"
  },
  compact_memory: {
    inputSchema: "CompactMemoryPayload",
    idempotencyKey: "compact_memory:{projectId}:{memoryRecordId}",
    allowedWrites: ["worker_jobs", "outbox_events", "memory_candidates"],
    forbiddenWrites: commonForbiddenWrites,
    memoryCoreGate: "write_memory_candidate_only"
  },
  detect_contradiction: {
    inputSchema: "DetectContradictionPayload",
    idempotencyKey: "detect_contradiction:{projectId}:{memoryRecordId}:{sourceClaimId}",
    allowedWrites: ["worker_jobs", "outbox_events", "reflection_records"],
    forbiddenWrites: commonForbiddenWrites,
    memoryCoreGate: "write_reflection_record_only"
  },
  expire_stale_memory: {
    inputSchema: "ExpireStaleMemoryPayload",
    idempotencyKey: "expire_stale_memory:{projectId}:{olderThan}",
    allowedWrites: ["worker_jobs", "outbox_events", "memory_candidates"],
    forbiddenWrites: commonForbiddenWrites,
    memoryCoreGate: "must_create_reviewed_invalidation_candidate"
  }
};

export const describeMaintenanceJob = (
  jobType: MaintenanceJobType
): MaintenanceJobDescription => {
  const authority = authorityByType[jobType];

  return {
    jobType,
    label: labels[jobType],
    workerTable: "worker_jobs",
    outboxTable: "outbox_events",
    outboxTopic: "worker_job.queued",
    requiresBackgroundLoop: false,
    inputSchema: authority.inputSchema,
    idempotencyKey: authority.idempotencyKey,
    outputEvent: "worker_job.completed",
    failureState: "failed",
    allowedWrites: authority.allowedWrites,
    forbiddenWrites: authority.forbiddenWrites,
    memoryCoreGate: authority.memoryCoreGate
  };
};
