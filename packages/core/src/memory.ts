import type {
  AntiMemoryRecordId,
  ContextAssemblyId,
  ExecutionRunId,
  FeedbackDeltaId,
  MemoryApplicationId,
  AntiMemoryCandidateId,
  MemoryCandidateId,
  MemoryFeedbackEventId,
  MemoryRecordId,
  MemoryRecordVersionId,
  ProjectId,
  SourceClaimId,
  TaskContractId
} from "./ids.js";
import type {
  IsoTimestamp,
  ValidityWindow
} from "./time.js";

export type MemoryRecordKind =
  | "fact"
  | "preference"
  | "constraint"
  | "procedure"
  | "pattern"
  | "risk";

export type MemoryRecordStatus =
  | "active"
  | "deprecated"
  | "stale"
  | "invalidated"
  | "superseded";
export type MemoryCandidateCreateStatus = "proposed" | "candidate";
export type MemoryCandidateLifecycleStatus =
  | "accepted"
  | "rejected"
  | "applied"
  | "superseded";
export type MemoryCandidateStatus =
  | MemoryCandidateCreateStatus
  | MemoryCandidateLifecycleStatus;
export type AntiMemoryCandidateStatus = MemoryCandidateStatus;
export type MemoryApplicationOutcome = "helped" | "hurt" | "neutral" | "stale";
export type MemoryFeedbackDirection = "positive" | "negative" | "correction";
export type MemoryFeedbackEventType =
  | "strengthened"
  | "demoted"
  | "invalidated"
  | "corrected"
  | "stale_detected";

export interface SourceLineageRef {
  sourceId: string;
  note?: string;
}

export interface MemoryRecord extends ValidityWindow {
  id: MemoryRecordId;
  projectId: ProjectId;
  currentVersionId?: MemoryRecordVersionId;
  key: string;
  kind: MemoryRecordKind;
  status: MemoryRecordStatus;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  applicationGuidance: string;
  invalidationRule?: string;
  sourceLineage: SourceLineageRef[];
  isUserPreference: boolean;
  positiveFeedbackCount: number;
  negativeFeedbackCount: number;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface MemoryCandidate {
  id: MemoryCandidateId;
  projectId: ProjectId;
  executionRunId?: ExecutionRunId;
  feedbackDeltaId?: FeedbackDeltaId;
  proposedBy: string;
  kind: MemoryRecordKind;
  status: MemoryCandidateStatus;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  applicationGuidance: string;
  invalidationRule?: string;
  sourceClaimIds: SourceClaimId[];
  sourceLineage: SourceLineageRef[];
  isUserPreference: boolean;
  reviewer?: string;
  reviewedAt?: IsoTimestamp;
  rejectionReason?: string;
  validFrom: IsoTimestamp;
  validUntil?: IsoTimestamp;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface MemoryApplication {
  id: MemoryApplicationId;
  memoryRecordId: MemoryRecordId;
  executionRunId?: ExecutionRunId;
  taskContractId?: TaskContractId;
  contextAssemblyId?: ContextAssemblyId;
  expectedUse: string;
  outcome?: MemoryApplicationOutcome;
  notes?: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}

export interface MemoryFeedbackEvent {
  id: MemoryFeedbackEventId;
  memoryRecordId: MemoryRecordId;
  executionRunId?: ExecutionRunId;
  feedbackDeltaId?: FeedbackDeltaId;
  eventType?: MemoryFeedbackEventType;
  direction: MemoryFeedbackDirection;
  note: string;
  reason?: string;
  evidenceRef?: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}

export interface AntiMemoryRecord extends ValidityWindow {
  id: AntiMemoryRecordId;
  projectId: ProjectId;
  executionRunId?: ExecutionRunId;
  createdFromCandidateId?: AntiMemoryCandidateId;
  key: string;
  rejectedClaim?: string;
  reason?: string;
  invalidatedBySourceClaimIds: SourceClaimId[];
  invalidatedBySourceClaimId?: SourceClaimId;
  appliesTo?: string;
  mayRevisitWhen?: string;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  sourceLineage: SourceLineageRef[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface AntiMemoryCandidate extends ValidityWindow {
  id: AntiMemoryCandidateId;
  projectId: ProjectId;
  executionRunId?: ExecutionRunId;
  feedbackDeltaId?: FeedbackDeltaId;
  proposedBy: string;
  key: string;
  status: AntiMemoryCandidateStatus;
  rejectedClaim?: string;
  reason?: string;
  invalidatedBySourceClaimIds: SourceClaimId[];
  invalidatedBySourceClaimId?: SourceClaimId;
  appliesTo?: string;
  mayRevisitWhen?: string;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  sourceLineage: SourceLineageRef[];
  reviewer?: string;
  reviewedAt?: IsoTimestamp;
  rejectionReason?: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export type MemoryRecordReviewSignalKind =
  | "stale_high_confidence"
  | "unresolved_negative_feedback"
  | "no_application_feedback";

export interface MemoryRecordReviewSignal {
  kind: MemoryRecordReviewSignalKind;
  severity: "warning" | "blocking";
  memoryRecordId: MemoryRecordId;
  reason: string;
}

export const assessMemoryRecordReviewSignals = (
  record: MemoryRecord
): MemoryRecordReviewSignal[] => {
  const signals: MemoryRecordReviewSignal[] = [];

  if (record.status === "stale" && record.confidence >= 85) {
    signals.push({
      kind: "stale_high_confidence",
      severity: "blocking",
      memoryRecordId: record.id,
      reason:
        "High-confidence stale memory must be reviewed, invalidated, or demoted before activation relies on it."
    });
  }

  if (record.negativeFeedbackCount >= 3) {
    signals.push({
      kind: "unresolved_negative_feedback",
      severity: "blocking",
      memoryRecordId: record.id,
      reason:
        "Repeated hurt/stale feedback must produce a governed demotion or invalidation review."
    });
  }

  if (
    (record.status === "active" || record.status === "stale") &&
    record.positiveFeedbackCount === 0
  ) {
    signals.push({
      kind: "no_application_feedback",
      severity: "warning",
      memoryRecordId: record.id,
      reason:
        "Active or stale memory without positive application feedback has not proven usefulness in KRN runs."
    });
  }

  return signals;
};
