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
import {
  readMetadataString,
  readMetadataStringList
} from "./metadata.js";

export const memoryRecordKinds = [
  "fact",
  "preference",
  "constraint",
  "procedure",
  "risk"
] as const;

export const memoryRecordStatuses = [
  "active",
  "deprecated",
  "stale",
  "invalidated",
  "superseded"
] as const;

export const memoryCandidateCreateStatuses = [
  "proposed",
  "candidate"
] as const;

export const memoryCandidateLifecycleStatuses = [
  "accepted",
  "rejected",
  "applied",
  "superseded"
] as const;

export const memoryCandidateStatuses = [
  ...memoryCandidateCreateStatuses,
  ...memoryCandidateLifecycleStatuses
] as const;

export const memoryPromotionDecisions = [
  "accepted",
  "rejected"
] as const;

export const memoryApplicationOutcomes = [
  "helped",
  "hurt",
  "neutral",
  "stale"
] as const;

export const memoryFeedbackDirections = [
  "positive",
  "negative",
  "correction"
] as const;

export const memoryFeedbackEventTypes = [
  "strengthened",
  "demoted",
  "invalidated",
  "corrected",
  "stale_detected"
] as const;

export type MemoryRecordKind = typeof memoryRecordKinds[number];
export type MemoryRecordStatus = typeof memoryRecordStatuses[number];
export type MemoryCandidateCreateStatus = typeof memoryCandidateCreateStatuses[number];
export type MemoryCandidateLifecycleStatus = typeof memoryCandidateLifecycleStatuses[number];
export type MemoryCandidateStatus = typeof memoryCandidateStatuses[number];
export type AntiMemoryCandidateStatus = MemoryCandidateStatus;
export type MemoryPromotionDecision = typeof memoryPromotionDecisions[number];
export type MemoryApplicationOutcome = typeof memoryApplicationOutcomes[number];
export type MemoryFeedbackDirection = typeof memoryFeedbackDirections[number];
export type MemoryFeedbackEventType = typeof memoryFeedbackEventTypes[number];

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

export interface ProjectStandardDecisionReadback {
  kind: "krn.projectStandardDecision.v1";
  memoryRecordId: MemoryRecordId;
  key: string;
  sourceRefs: string[];
  mechanism: string;
  krnImplication: string;
  decision: string;
  consumer: string;
  falsifier: string;
  validFrom: IsoTimestamp;
  validUntil?: IsoTimestamp;
  rejectedPath?: string;
  doesNotProve: string;
}

const isMetadataRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const projectStandardDecisionMetadata = (
  metadata: Record<string, unknown>
): Record<string, unknown> | undefined => {
  const value = metadata["projectStandardDecision"];

  return isMetadataRecord(value) ? value : undefined;
};

export const projectStandardDecisionFromMemoryRecord = (
  record: MemoryRecord
): ProjectStandardDecisionReadback | undefined => {
  const metadata = projectStandardDecisionMetadata(record.metadata);

  if (metadata === undefined) {
    return undefined;
  }

  const mechanism = readMetadataString(metadata, "mechanism");
  const krnImplication = readMetadataString(metadata, "krnImplication");
  const decision = readMetadataString(metadata, "decision");
  const consumer = readMetadataString(metadata, "consumer");
  const falsifier = readMetadataString(metadata, "falsifier");
  const doesNotProve = readMetadataString(metadata, "doesNotProve");
  const sourceRefs = [
    ...record.sourceLineage.map((source) => source.sourceId),
    ...readMetadataStringList(metadata, "sourceRefs")
  ].filter((sourceRef, index, refs) => refs.indexOf(sourceRef) === index);

  if (
    sourceRefs.length === 0 ||
    mechanism === undefined ||
    krnImplication === undefined ||
    decision === undefined ||
    consumer === undefined ||
    falsifier === undefined ||
    doesNotProve === undefined
  ) {
    return undefined;
  }

  const rejectedPath = readMetadataString(metadata, "rejectedPath");

  return {
    kind: "krn.projectStandardDecision.v1",
    memoryRecordId: record.id,
    key: record.key,
    sourceRefs,
    mechanism,
    krnImplication,
    decision,
    consumer,
    falsifier,
    validFrom: record.validFrom,
    ...(record.validUntil === undefined ? {} : { validUntil: record.validUntil }),
    ...(rejectedPath === undefined ? {} : { rejectedPath }),
    doesNotProve
  };
};

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
