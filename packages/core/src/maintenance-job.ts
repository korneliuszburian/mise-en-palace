import type {
  MemoryRecordId,
  ProjectId,
  SourceChunkId,
  SourceClaimId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

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
  embeddingModelId: string;
}

export interface EmbedMemoryRecordPayload {
  memoryRecordId: MemoryRecordId;
  reason: string;
  embeddingModelId: string;
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

export const maintenanceQueueStatuses = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "skipped"
] as const;

export type MaintenanceQueueStatus = (typeof maintenanceQueueStatuses)[number];

export const maintenanceJobPersistenceContract = {
  queueStore: "maintenance_queue_records",
  outboxTable: "outbox_events",
  outboxTopic: "maintenance_queue.queued",
  executionMode: "persistence_only",
  recordSettlementTopic: "maintenance_queue.record_settled",
  failureRecordStatus: "failed"
} as const;

export type MaintenanceJobPersistenceContract = typeof maintenanceJobPersistenceContract;

export interface MaintenanceJobDescription {
  jobType: MaintenanceJobType;
  label: string;
  queueStore: MaintenanceJobPersistenceContract["queueStore"];
  outboxTable: MaintenanceJobPersistenceContract["outboxTable"];
  outboxTopic: MaintenanceJobPersistenceContract["outboxTopic"];
  executionMode: MaintenanceJobPersistenceContract["executionMode"];
  inputSchema: string;
  queueRecordKeyTemplate: string;
  recordSettlementTopic: MaintenanceJobPersistenceContract["recordSettlementTopic"];
  failureRecordStatus: MaintenanceJobPersistenceContract["failureRecordStatus"];
  allowedWrites: readonly MaintenanceJobAllowedWrite[];
  forbiddenWrites: readonly MaintenanceJobForbiddenWrite[];
  memoryBoundary: MaintenanceJobMemoryBoundary;
}

export interface MaintenanceQueueWriteBoundaryViolation {
  code:
    | "disallowed_write_for_memory_boundary"
    | "missing_required_write_for_memory_boundary"
    | "missing_required_forbidden_write";
  message: string;
}

export interface MaintenanceQueueWriteBoundaryAssessment {
  jobType: MaintenanceJobType;
  memoryBoundary: MaintenanceJobMemoryBoundary;
  status: "passed" | "failed";
  violations: readonly MaintenanceQueueWriteBoundaryViolation[];
}

export interface MaintenanceQueueWriteBoundaryReadback {
  jobType: MaintenanceJobType;
  memoryBoundary: MaintenanceJobMemoryBoundary;
  status: MaintenanceQueueWriteBoundaryAssessment["status"];
  queueRecordKeyTemplate: string;
  allowedWrites: readonly MaintenanceJobAllowedWrite[];
  forbiddenWrites: readonly MaintenanceJobForbiddenWrite[];
  doesNotProve: string;
}

const labels: Record<MaintenanceJobType, string> = {
  embed_source_chunk: "Embed source chunk",
  embed_memory_record: "Embed memory record",
  compact_memory: "Compact memory",
  detect_contradiction: "Detect contradiction",
  expire_stale_memory: "Expire stale memory"
};

export type MaintenanceJobAllowedWrite =
  | "maintenance_queue_records"
  | "outbox_events"
  | "embeddings"
  | "memory_candidates"
  | "reflection_records";

export type MaintenanceJobForbiddenWrite =
  | "memory_records"
  | "anti_memory_records"
  | "source_claims"
  | "source_decisions";

export type MaintenanceJobMemoryBoundary =
  | "no_memory_core_write"
  | "read_memory_record_only"
  | "write_memory_candidate_only"
  | "write_reflection_record_only"
  | "must_create_reviewed_invalidation_candidate"
  | "must_not_promote_memory_record";

interface MaintenanceQueueWriteBoundary {
  inputSchema: string;
  queueRecordKeyTemplate: string;
  allowedWrites: readonly MaintenanceJobAllowedWrite[];
  forbiddenWrites: readonly MaintenanceJobForbiddenWrite[];
  memoryBoundary: MaintenanceJobMemoryBoundary;
}

const commonForbiddenWrites = [
  "memory_records",
  "anti_memory_records",
  "source_claims",
  "source_decisions"
] as const satisfies readonly MaintenanceJobForbiddenWrite[];

const requiredForbiddenWrites = [
  "memory_records",
  "anti_memory_records"
] as const satisfies readonly MaintenanceJobForbiddenWrite[];

const allowedWritesByMemoryBoundary = {
  no_memory_core_write: ["maintenance_queue_records", "outbox_events", "embeddings"],
  read_memory_record_only: ["maintenance_queue_records", "outbox_events", "embeddings"],
  write_memory_candidate_only: [
    "maintenance_queue_records",
    "outbox_events",
    "memory_candidates"
  ],
  write_reflection_record_only: [
    "maintenance_queue_records",
    "outbox_events",
    "reflection_records"
  ],
  must_create_reviewed_invalidation_candidate: [
    "maintenance_queue_records",
    "outbox_events",
    "memory_candidates"
  ],
  must_not_promote_memory_record: [
    "maintenance_queue_records",
    "outbox_events",
    "embeddings",
    "memory_candidates",
    "reflection_records"
  ]
} as const satisfies Record<MaintenanceJobMemoryBoundary, readonly MaintenanceJobAllowedWrite[]>;

const requiredWritesByMemoryBoundary = {
  no_memory_core_write: [],
  read_memory_record_only: [],
  write_memory_candidate_only: ["memory_candidates"],
  write_reflection_record_only: ["reflection_records"],
  must_create_reviewed_invalidation_candidate: ["memory_candidates"],
  must_not_promote_memory_record: []
} as const satisfies Record<MaintenanceJobMemoryBoundary, readonly MaintenanceJobAllowedWrite[]>;

const writeBoundaryByType: Record<MaintenanceJobType, MaintenanceQueueWriteBoundary> = {
  embed_source_chunk: {
    inputSchema: "EmbedSourceChunkPayload",
    queueRecordKeyTemplate: "embed_source_chunk:{sourceChunkId}:{embeddingModelId}",
    allowedWrites: ["maintenance_queue_records", "outbox_events", "embeddings"],
    forbiddenWrites: commonForbiddenWrites,
    memoryBoundary: "no_memory_core_write"
  },
  embed_memory_record: {
    inputSchema: "EmbedMemoryRecordPayload",
    queueRecordKeyTemplate: "embed_memory_record:{memoryRecordId}:{embeddingModelId}",
    allowedWrites: ["maintenance_queue_records", "outbox_events", "embeddings"],
    forbiddenWrites: commonForbiddenWrites,
    memoryBoundary: "read_memory_record_only"
  },
  compact_memory: {
    inputSchema: "CompactMemoryPayload",
    queueRecordKeyTemplate: "compact_memory:{projectId}:{memoryRecordId}",
    allowedWrites: ["maintenance_queue_records", "outbox_events", "memory_candidates"],
    forbiddenWrites: commonForbiddenWrites,
    memoryBoundary: "write_memory_candidate_only"
  },
  detect_contradiction: {
    inputSchema: "DetectContradictionPayload",
    queueRecordKeyTemplate: "detect_contradiction:{projectId}:{memoryRecordId}:{sourceClaimId}",
    allowedWrites: ["maintenance_queue_records", "outbox_events", "reflection_records"],
    forbiddenWrites: commonForbiddenWrites,
    memoryBoundary: "write_reflection_record_only"
  },
  expire_stale_memory: {
    inputSchema: "ExpireStaleMemoryPayload",
    queueRecordKeyTemplate: "expire_stale_memory:{projectId}:{olderThan}",
    allowedWrites: ["maintenance_queue_records", "outbox_events", "memory_candidates"],
    forbiddenWrites: commonForbiddenWrites,
    memoryBoundary: "must_create_reviewed_invalidation_candidate"
  }
};

export const describeMaintenanceJob = (
  jobType: MaintenanceJobType
): MaintenanceJobDescription => {
  const writeBoundary = writeBoundaryByType[jobType];
  const description: MaintenanceJobDescription = {
    jobType,
    label: labels[jobType],
    ...maintenanceJobPersistenceContract,
    inputSchema: writeBoundary.inputSchema,
    queueRecordKeyTemplate: writeBoundary.queueRecordKeyTemplate,
    allowedWrites: writeBoundary.allowedWrites,
    forbiddenWrites: writeBoundary.forbiddenWrites,
    memoryBoundary: writeBoundary.memoryBoundary
  };

  assertMaintenanceQueueWriteBoundary(description);

  return description;
};

export const assessMaintenanceQueueWriteBoundary = (
  description: MaintenanceJobDescription
): MaintenanceQueueWriteBoundaryAssessment => {
  const allowedForGate = new Set<MaintenanceJobAllowedWrite>(
    allowedWritesByMemoryBoundary[description.memoryBoundary]
  );
  const requiredForGate = new Set<MaintenanceJobAllowedWrite>(
    requiredWritesByMemoryBoundary[description.memoryBoundary]
  );
  const forbiddenWrites = new Set<MaintenanceJobForbiddenWrite>(description.forbiddenWrites);
  const violations: MaintenanceQueueWriteBoundaryViolation[] = [];

  for (const write of description.allowedWrites) {
    if (!allowedForGate.has(write)) {
      violations.push({
        code: "disallowed_write_for_memory_boundary",
        message: `${description.jobType} allows ${write} but memory boundary ${description.memoryBoundary} does not.`
      });
    }
  }

  for (const write of requiredForGate) {
    if (!description.allowedWrites.includes(write)) {
      violations.push({
        code: "missing_required_write_for_memory_boundary",
        message: `${description.jobType} memory boundary ${description.memoryBoundary} requires ${write}.`
      });
    }
  }

  for (const write of requiredForbiddenWrites) {
    if (!forbiddenWrites.has(write)) {
      violations.push({
        code: "missing_required_forbidden_write",
        message: `${description.jobType} must forbid ${write} to avoid direct Memory Core mutation.`
      });
    }
  }

  return {
    jobType: description.jobType,
    memoryBoundary: description.memoryBoundary,
    status: violations.length === 0 ? "passed" : "failed",
    violations
  };
};

export const assertMaintenanceQueueWriteBoundary = (
  description: MaintenanceJobDescription
): void => {
  const assessment = assessMaintenanceQueueWriteBoundary(description);

  if (assessment.status === "failed") {
    throw new Error(
      `Invalid maintenance write boundary for ${description.jobType}: ${assessment.violations
        .map((violation) => violation.message)
        .join(" ")}`
    );
  }
};

export const buildMaintenanceQueueWriteBoundaryReadback = (
  jobType: MaintenanceJobType
): MaintenanceQueueWriteBoundaryReadback => {
  const description = describeMaintenanceJob(jobType);
  const assessment = assessMaintenanceQueueWriteBoundary(description);

  return {
    jobType,
    memoryBoundary: description.memoryBoundary,
    status: assessment.status,
    queueRecordKeyTemplate: description.queueRecordKeyTemplate,
    allowedWrites: description.allowedWrites,
    forbiddenWrites: description.forbiddenWrites,
    doesNotProve:
      "Declared maintenance queue write boundary does not prove maintenance execution, scheduler readiness, unique enqueue deduplication, runtime enforcement, candidate truth, review correctness, or Memory Core mutation safety outside this declared queue boundary."
  };
};
