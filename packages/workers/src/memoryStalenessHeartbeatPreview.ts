import {
  assessCandidateReviewability,
  assessMemoryRecordReviewSignals,
  parseTimestampMs
} from "@krn/core";
import type {
  CandidateReviewability,
  IsoTimestamp,
  MemoryRecord,
  MemoryRecordId,
  MemoryRecordReviewSignalKind
} from "@krn/core";

import {
  buildMaintenanceJobAuthorityReadback
} from "./jobTypes.js";
import type {
  WorkerJobAuthorityReadback
} from "./jobTypes.js";

export type MemoryStalenessHeartbeatCandidateReason =
  | "expired_memory"
  | "near_expiry_memory"
  | MemoryRecordReviewSignalKind;

export type MemoryStalenessHeartbeatAction =
  | "review_memory_invalidation"
  | "review_memory_refresh"
  | "review_memory_feedback";

export interface MemoryStalenessHeartbeatCandidate {
  id: string;
  kind: "memory_staleness_maintenance_candidate";
  action: MemoryStalenessHeartbeatAction;
  reason: MemoryStalenessHeartbeatCandidateReason;
  memoryRecordId: MemoryRecordId;
  memoryKey: string;
  memoryKind: MemoryRecord["kind"];
  memoryStatus: MemoryRecord["status"];
  summary: string;
  applicationGuidance: string;
  invalidationIntent: string;
  evidenceRefs: readonly string[];
  sourceLineageRefs: readonly string[];
  doesNotProve: string;
  reviewability: CandidateReviewability;
  reviewabilityReasons: readonly string[];
  workerAuthority: WorkerJobAuthorityReadback;
  mutation: "none";
  forbiddenWrites: readonly [
    "memory_records",
    "anti_memory_records",
    "source_claims",
    "source_decisions"
  ];
}

export interface BuildMemoryStalenessHeartbeatPreviewInput {
  now: IsoTimestamp;
  memoryRecords: readonly MemoryRecord[];
  evidenceRef: string;
  nearExpiryDays?: number;
  maxCandidates?: number;
}

export interface MemoryStalenessHeartbeatPreview {
  generatedAt: IsoTimestamp;
  candidates: readonly MemoryStalenessHeartbeatCandidate[];
  skippedMemoryCount: number;
  mutation: "none";
  proof: string;
  doesNotProve: string;
}

const millisecondsPerDay = 24 * 60 * 60 * 1000;

const forbiddenWrites = [
  "memory_records",
  "anti_memory_records",
  "source_claims",
  "source_decisions"
] as const;

const previewDoesNotProve =
  "Memory-staleness heartbeat preview does not prove memory truth, memory usefulness, automatic invalidation correctness, autonomous worker execution, or Memory Core mutation.";

const hasText = (value: string | undefined): value is string =>
  value !== undefined && value.trim().length > 0;

const sourceLineageRefs = (record: MemoryRecord): readonly string[] =>
  record.sourceLineage
    .map((sourceLineage) => sourceLineage.sourceId)
    .filter(hasText);

const candidateReasonFromSignal = (
  signalKind: MemoryRecordReviewSignalKind
): MemoryStalenessHeartbeatCandidateReason => signalKind;

const actionFromReason = (
  reason: MemoryStalenessHeartbeatCandidateReason
): MemoryStalenessHeartbeatAction => {
  if (
    reason === "expired_memory" ||
    reason === "near_expiry_memory" ||
    reason === "stale_high_confidence"
  ) {
    return "review_memory_invalidation";
  }

  if (reason === "unresolved_negative_feedback") {
    return "review_memory_feedback";
  }

  return "review_memory_refresh";
};

const staleReasonForRecord = (
  record: MemoryRecord,
  now: IsoTimestamp,
  nearExpiryDays: number
): MemoryStalenessHeartbeatCandidateReason | undefined => {
  const validUntil = parseTimestampMs(record.validUntil);
  const nowAt = parseTimestampMs(now);

  if (validUntil !== undefined && nowAt !== undefined) {
    if (validUntil <= nowAt) {
      return "expired_memory";
    }

    const nearExpiryAt = nowAt + nearExpiryDays * millisecondsPerDay;

    if (validUntil <= nearExpiryAt) {
      return "near_expiry_memory";
    }
  }

  const reviewSignal = assessMemoryRecordReviewSignals(record)[0];

  return reviewSignal === undefined
    ? undefined
    : candidateReasonFromSignal(reviewSignal.kind);
};

const buildCandidate = (
  input: BuildMemoryStalenessHeartbeatPreviewInput,
  record: MemoryRecord,
  reason: MemoryStalenessHeartbeatCandidateReason
): MemoryStalenessHeartbeatCandidate => {
  const action = actionFromReason(reason);
  const summary = `Review stale memory ${record.id} (${record.key}).`;
  const applicationGuidance =
    "Route this candidate to human review before invalidating, refreshing, demoting, promoting, or rewriting Memory Core state.";
  const invalidationIntent =
    record.invalidationRule ??
    `Review whether memory ${record.id} should be invalidated, refreshed, demoted, or kept.`;
  const lineageRefs = sourceLineageRefs(record);
  const evidenceRefs = [input.evidenceRef, ...lineageRefs].filter(hasText);
  const reviewability = assessCandidateReviewability({
    summary,
    evidenceRefs,
    applicationGuidance,
    doesNotProve: previewDoesNotProve,
    sourceLineage: record.sourceLineage
  });

  return {
    id: `memory-staleness-heartbeat:${record.id}:${reason}`,
    kind: "memory_staleness_maintenance_candidate",
    action,
    reason,
    memoryRecordId: record.id,
    memoryKey: record.key,
    memoryKind: record.kind,
    memoryStatus: record.status,
    summary,
    applicationGuidance,
    invalidationIntent,
    evidenceRefs,
    sourceLineageRefs: lineageRefs,
    doesNotProve: previewDoesNotProve,
    reviewability: reviewability.reviewability,
    reviewabilityReasons: reviewability.reasons,
    workerAuthority: buildMaintenanceJobAuthorityReadback("expire_stale_memory"),
    mutation: "none",
    forbiddenWrites
  };
};

export const buildMemoryStalenessHeartbeatPreview = (
  input: BuildMemoryStalenessHeartbeatPreviewInput
): MemoryStalenessHeartbeatPreview => {
  const maxCandidates = Math.max(0, input.maxCandidates ?? input.memoryRecords.length);
  const nearExpiryDays = input.nearExpiryDays ?? 7;
  const candidates: MemoryStalenessHeartbeatCandidate[] = [];

  if (maxCandidates === 0) {
    return {
      generatedAt: input.now,
      candidates,
      skippedMemoryCount: input.memoryRecords.length,
      mutation: "none",
      proof:
        "Memory-staleness heartbeat preview inspects MemoryRecord validity and review signals to propose reviewable maintenance candidates only.",
      doesNotProve: previewDoesNotProve
    };
  }

  for (const record of input.memoryRecords) {
    const reason = staleReasonForRecord(record, input.now, nearExpiryDays);

    if (reason === undefined) {
      continue;
    }

    candidates.push(buildCandidate(input, record, reason));

    if (candidates.length >= maxCandidates) {
      break;
    }
  }

  return {
    generatedAt: input.now,
    candidates,
    skippedMemoryCount: input.memoryRecords.length - candidates.length,
    mutation: "none",
    proof:
      "Memory-staleness heartbeat preview inspects MemoryRecord validity and review signals to propose reviewable maintenance candidates only.",
    doesNotProve: previewDoesNotProve
  };
};
