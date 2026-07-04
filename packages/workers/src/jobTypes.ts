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

export const maintenanceJobRuntimeContract = {
  workerTable: "worker_jobs",
  outboxTable: "outbox_events",
  outboxTopic: "worker_job.queued",
  requiresBackgroundLoop: false,
  outputEvent: "worker_job.completed",
  failureState: "failed"
} as const;

export type MaintenanceJobRuntimeContract = typeof maintenanceJobRuntimeContract;

export interface MaintenanceJobDescription {
  jobType: MaintenanceJobType;
  label: string;
  workerTable: MaintenanceJobRuntimeContract["workerTable"];
  outboxTable: MaintenanceJobRuntimeContract["outboxTable"];
  outboxTopic: MaintenanceJobRuntimeContract["outboxTopic"];
  requiresBackgroundLoop: MaintenanceJobRuntimeContract["requiresBackgroundLoop"];
  inputSchema: string;
  idempotencyKey: string;
  outputEvent: MaintenanceJobRuntimeContract["outputEvent"];
  failureState: MaintenanceJobRuntimeContract["failureState"];
  allowedWrites: readonly WorkerJobAllowedWrite[];
  forbiddenWrites: readonly WorkerJobForbiddenWrite[];
  memoryCoreGate: WorkerJobMemoryCoreGate;
}

export interface WorkerJobWriteAuthorityViolation {
  code:
    | "disallowed_write_for_memory_core_gate"
    | "missing_required_write_for_memory_core_gate"
    | "missing_required_forbidden_write";
  message: string;
}

export interface WorkerJobWriteAuthorityAssessment {
  jobType: MaintenanceJobType;
  memoryCoreGate: WorkerJobMemoryCoreGate;
  status: "passed" | "failed";
  violations: readonly WorkerJobWriteAuthorityViolation[];
}

export interface WorkerJobAuthorityReadback {
  jobType: MaintenanceJobType;
  memoryCoreGate: WorkerJobMemoryCoreGate;
  status: WorkerJobWriteAuthorityAssessment["status"];
  idempotencyKey: string;
  allowedWrites: readonly WorkerJobAllowedWrite[];
  forbiddenWrites: readonly WorkerJobForbiddenWrite[];
  doesNotProve: string;
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

const requiredForbiddenWrites = [
  "memory_records",
  "anti_memory_records"
] as const satisfies readonly WorkerJobForbiddenWrite[];

const allowedWritesByMemoryCoreGate = {
  no_memory_core_write: ["worker_jobs", "outbox_events", "embeddings"],
  read_memory_record_only: ["worker_jobs", "outbox_events", "embeddings"],
  write_memory_candidate_only: ["worker_jobs", "outbox_events", "memory_candidates"],
  write_reflection_record_only: ["worker_jobs", "outbox_events", "reflection_records"],
  must_create_reviewed_invalidation_candidate: [
    "worker_jobs",
    "outbox_events",
    "memory_candidates"
  ],
  must_not_promote_memory_record: [
    "worker_jobs",
    "outbox_events",
    "embeddings",
    "memory_candidates",
    "reflection_records"
  ]
} as const satisfies Record<WorkerJobMemoryCoreGate, readonly WorkerJobAllowedWrite[]>;

const requiredWritesByMemoryCoreGate = {
  no_memory_core_write: [],
  read_memory_record_only: [],
  write_memory_candidate_only: ["memory_candidates"],
  write_reflection_record_only: ["reflection_records"],
  must_create_reviewed_invalidation_candidate: ["memory_candidates"],
  must_not_promote_memory_record: []
} as const satisfies Record<WorkerJobMemoryCoreGate, readonly WorkerJobAllowedWrite[]>;

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
  const description: MaintenanceJobDescription = {
    jobType,
    label: labels[jobType],
    ...maintenanceJobRuntimeContract,
    inputSchema: authority.inputSchema,
    idempotencyKey: authority.idempotencyKey,
    allowedWrites: authority.allowedWrites,
    forbiddenWrites: authority.forbiddenWrites,
    memoryCoreGate: authority.memoryCoreGate
  };

  assertMaintenanceJobWriteAuthority(description);

  return description;
};

export const assessMaintenanceJobWriteAuthority = (
  description: MaintenanceJobDescription
): WorkerJobWriteAuthorityAssessment => {
  const allowedForGate = new Set<WorkerJobAllowedWrite>(
    allowedWritesByMemoryCoreGate[description.memoryCoreGate]
  );
  const requiredForGate = new Set<WorkerJobAllowedWrite>(
    requiredWritesByMemoryCoreGate[description.memoryCoreGate]
  );
  const forbiddenWrites = new Set<WorkerJobForbiddenWrite>(description.forbiddenWrites);
  const violations: WorkerJobWriteAuthorityViolation[] = [];

  for (const write of description.allowedWrites) {
    if (!allowedForGate.has(write)) {
      violations.push({
        code: "disallowed_write_for_memory_core_gate",
        message: `${description.jobType} allows ${write} but gate ${description.memoryCoreGate} does not.`
      });
    }
  }

  for (const write of requiredForGate) {
    if (!description.allowedWrites.includes(write)) {
      violations.push({
        code: "missing_required_write_for_memory_core_gate",
        message: `${description.jobType} gate ${description.memoryCoreGate} requires ${write}.`
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
    memoryCoreGate: description.memoryCoreGate,
    status: violations.length === 0 ? "passed" : "failed",
    violations
  };
};

export const assertMaintenanceJobWriteAuthority = (
  description: MaintenanceJobDescription
): void => {
  const assessment = assessMaintenanceJobWriteAuthority(description);

  if (assessment.status === "failed") {
    throw new Error(
      `Invalid worker write authority for ${description.jobType}: ${assessment.violations
        .map((violation) => violation.message)
        .join(" ")}`
    );
  }
};

export const buildMaintenanceJobAuthorityReadback = (
  jobType: MaintenanceJobType
): WorkerJobAuthorityReadback => {
  const description = describeMaintenanceJob(jobType);
  const assessment = assessMaintenanceJobWriteAuthority(description);

  return {
    jobType,
    memoryCoreGate: description.memoryCoreGate,
    status: assessment.status,
    idempotencyKey: description.idempotencyKey,
    allowedWrites: description.allowedWrites,
    forbiddenWrites: description.forbiddenWrites,
    doesNotProve:
      "Validated worker write authority does not prove worker execution, scheduler readiness, idempotent enqueue deduplication, runtime gate enforcement, candidate truth, review correctness, or Memory Core mutation safety outside this declared job boundary."
  };
};
