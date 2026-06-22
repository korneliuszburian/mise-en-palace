import type {
  EvalCandidateId,
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
  "expire_stale_memory",
  "promote_eval_candidate"
] as const;

export type MaintenanceJobType = (typeof maintenanceJobTypes)[number];

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

export interface PromoteEvalCandidatePayload {
  evalCandidateId: EvalCandidateId;
  reason: string;
  projectId?: ProjectId;
}

export type MaintenanceJobPayloadByType = {
  embed_source_chunk: EmbedSourceChunkPayload;
  embed_memory_record: EmbedMemoryRecordPayload;
  compact_memory: CompactMemoryPayload;
  detect_contradiction: DetectContradictionPayload;
  expire_stale_memory: ExpireStaleMemoryPayload;
  promote_eval_candidate: PromoteEvalCandidatePayload;
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
}

const labels: Record<MaintenanceJobType, string> = {
  embed_source_chunk: "Embed source chunk",
  embed_memory_record: "Embed memory record",
  compact_memory: "Compact memory",
  detect_contradiction: "Detect contradiction",
  expire_stale_memory: "Expire stale memory",
  promote_eval_candidate: "Promote eval candidate"
};

export const describeMaintenanceJob = (
  jobType: MaintenanceJobType
): MaintenanceJobDescription => ({
  jobType,
  label: labels[jobType],
  workerTable: "worker_jobs",
  outboxTable: "outbox_events",
  outboxTopic: "worker_job.queued",
  requiresBackgroundLoop: false
});
