import type {
  AntiMemoryCandidate,
  AntiMemoryRecord,
  ExecutionRunId,
  FeedbackDeltaId,
  MemoryApplication,
  MemoryApplicationOutcome,
  MemoryCandidate,
  MemoryCandidateCreateStatus,
  MemoryCandidateId,
  MemoryFeedbackDirection,
  MemoryFeedbackEvent,
  MemoryFeedbackEventType,
  MemoryRecord,
  MemoryRecordKind,
  MemoryRecordStatus,
  MemoryRecordVersionId,
  ProjectId,
  ReviewAssessmentId,
  IsoTimestamp,
  SourceClaimId,
  SourceDecisionId,
  SourceLineageRef,
  TaskContractId,
  ContextAssemblyId
} from "@krn/core";

import type { RepositoryMetadata } from "./types.js";

export interface CreateMemoryRecordInput extends RepositoryMetadata {
  projectId: ProjectId;
  key: string;
  kind: MemoryRecordKind;
  status?: MemoryRecordStatus;
  currentVersionId?: MemoryRecordVersionId;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  applicationGuidance: string;
  invalidationRule?: string;
  sourceLineage: SourceLineageRef[];
  isUserPreference: boolean;
  validFrom?: string;
  validUntil?: string;
}

export interface CreateMemoryCandidateInput extends RepositoryMetadata {
  projectId: ProjectId;
  executionRunId?: ExecutionRunId;
  feedbackDeltaId?: FeedbackDeltaId;
  proposedBy: string;
  kind: MemoryRecordKind;
  status?: MemoryCandidateCreateStatus;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  applicationGuidance: string;
  invalidationRule?: string;
  sourceClaimIds?: SourceClaimId[];
  sourceLineage: SourceLineageRef[];
  isUserPreference: boolean;
  validFrom?: string;
  validUntil?: string;
}

export interface ProposeReviewedHelpedMemoryCandidateInput {
  projectId: ProjectId;
  feedbackDeltaId: FeedbackDeltaId;
  reviewAssessmentId: ReviewAssessmentId;
  sourceDecisionId: SourceDecisionId;
}

export interface ProposeReviewedHelpedMemoryCandidateResult {
  candidate: MemoryCandidate;
  created: boolean;
  sourceClaimId: SourceClaimId;
  evidenceBundleId: string;
  usefulnessApplicationId: string;
  packetChecksum: string;
}

export interface GetReviewedHelpedMemoryProposalEligibilityInput {
  projectId: ProjectId;
  feedbackDeltaId: FeedbackDeltaId;
  sourceDecisionId?: SourceDecisionId;
  reviewAssessmentId?: ReviewAssessmentId;
}

export type ReviewedHelpedLearningBlockedReason =
  | "feedback_delta_not_found"
  | "feedback_delta_not_authoritative"
  | "review_assessment_not_found"
  | "review_assessment_not_accepted"
  | "review_evidence_bundle_mismatch"
  | "review_subject_mismatch"
  | "evidence_bundle_not_passed"
  | "source_outcome_missing"
  | "source_outcome_ambiguous"
  | "source_outcome_not_helped"
  | "application_reference_missing"
  | "application_not_found"
  | "application_identity_mismatch"
  | "packet_binding_mismatch"
  | "source_decision_not_eligible"
  | "existing_candidate_identity_conflict";

export class ReviewedHelpedLearningBlockedError extends Error {
  constructor(readonly reason: ReviewedHelpedLearningBlockedReason) {
    super(`reviewed helped learning blocked: ${reason}`);
    this.name = "ReviewedHelpedLearningBlockedError";
  }
}

export interface ReviewedHelpedMemoryProposalReady {
  status: "ready_to_propose";
  projectId: ProjectId;
  feedbackDeltaId: FeedbackDeltaId;
  reviewAssessmentId: ReviewAssessmentId;
  sourceDecisionId: SourceDecisionId;
  sourceClaimId: SourceClaimId;
  evidenceBundleId: string;
  usefulnessApplicationId: string;
  packetChecksum: string;
  existingCandidateId?: MemoryCandidateId;
}

export interface ReviewedHelpedMemoryProposalMissingReview {
  status: "missing_review";
  projectId: ProjectId;
  feedbackDeltaId: FeedbackDeltaId;
  sourceDecisionId?: SourceDecisionId;
  evidenceBundleId?: string;
  usefulnessApplicationId?: string;
  reason: ReviewedHelpedLearningBlockedReason;
}

export interface ReviewedHelpedMemoryProposalBlocked {
  status: "blocked_authority";
  projectId: ProjectId;
  feedbackDeltaId: FeedbackDeltaId;
  sourceDecisionId?: SourceDecisionId;
  reason: ReviewedHelpedLearningBlockedReason;
}

export type ReviewedHelpedMemoryProposalEligibility =
  | ReviewedHelpedMemoryProposalReady
  | ReviewedHelpedMemoryProposalMissingReview
  | ReviewedHelpedMemoryProposalBlocked;

export interface PromoteMemoryCandidateInput extends RepositoryMetadata {
  candidateId: MemoryCandidateId;
  reviewer: string;
  decision: "accepted";
  recordKey?: string;
}

export interface RejectMemoryCandidateInput extends RepositoryMetadata {
  candidateId: MemoryCandidateId;
  reviewer: string;
  reason: string;
}

export interface InvalidateMemoryRecordInput extends RepositoryMetadata {
  memoryRecordId: MemoryRecord["id"];
  reviewer: string;
  reason: string;
  invalidatedAt?: string;
}

export interface SupersedeMemoryRecordInput extends RepositoryMetadata {
  memoryRecordId: MemoryRecord["id"];
  reviewer: string;
  reason: string;
  supersededByMemoryRecordId: MemoryRecord["id"];
  supersededAt?: string;
}

export interface ApplyReviewedMemoryRevisionInput extends RepositoryMetadata {
  candidateId: MemoryCandidateId;
  sourceMemoryRecordId: MemoryRecord["id"];
  reviewer: string;
  reason: string;
  recordKey?: string;
  supersededAt?: string;
}

export interface ApplyReviewedMemoryRevisionResult {
  memoryRecord: MemoryRecord;
  supersededMemoryRecord: MemoryRecord;
}

export interface RecordMemoryApplicationInput extends RepositoryMetadata {
  memoryRecordId: MemoryRecord["id"];
  executionRunId: ExecutionRunId;
  taskContractId?: TaskContractId;
  contextAssemblyId?: ContextAssemblyId;
  expectedUse: string;
  outcome: MemoryApplicationOutcome;
  notes: string;
  evidenceBundleId?: string;
  packetChecksum: string;
  packetGeneratedAt: IsoTimestamp;
  sourceRunLifecycleRevision: number;
}

export interface RecordMemoryApplicationOnceInput extends RecordMemoryApplicationInput {
  executionRunId: ExecutionRunId;
  packetChecksum: string;
}

export interface RecordMemoryApplicationOnceResult {
  application: MemoryApplication;
  created: boolean;
}

export type MemoryApplicationNegativeOutcome = Extract<MemoryApplicationOutcome, "hurt" | "stale">;

export interface RecordMemoryApplicationNegativeEffectsInput extends RepositoryMetadata {
  outcome: MemoryApplicationNegativeOutcome;
  eventType: Extract<MemoryFeedbackEventType, "demoted" | "stale_detected">;
  note: string;
  reason: string;
  evidenceRef?: string;
  candidate: {
    key: string;
    rejectedClaim: string;
    reason: string;
    invalidatedBySourceClaimIds: string[];
    appliesTo: string;
    mayRevisitWhen?: string;
    summary: string;
    body: string;
    owner: string;
    confidence: number;
    sourceLineage: SourceLineageRef[];
  };
}

export interface RecordMemoryApplicationWithEffectsOnceInput
  extends RecordMemoryApplicationOnceInput {
  negativeEffects?: RecordMemoryApplicationNegativeEffectsInput;
}

export interface RecordMemoryApplicationWithEffectsOnceResult extends RecordMemoryApplicationOnceResult {
  feedbackEvent?: MemoryFeedbackEvent;
  antiMemoryCandidate?: AntiMemoryCandidate;
}

export interface RecordMemoryFeedbackWithPacketBindingInput {
  memoryRecordId: MemoryRecord["id"];
  outcome: Extract<MemoryApplicationOutcome, "helped" | "hurt" | "stale">;
  runId: ExecutionRunId;
  packetChecksum: string;
  note?: string;
}

export interface RecordMemoryFeedbackWithPacketBindingResult {
  feedbackEventId: MemoryFeedbackEvent["id"];
  idempotentReplay: boolean;
}

export class MemoryApplicationIdentityConflictError extends Error {
  constructor(
    readonly memoryRecordId: MemoryRecord["id"],
    readonly executionRunId: ExecutionRunId,
    readonly packetChecksum: string
  ) {
    super(
      `memory application identity conflict for ${memoryRecordId} in run ${executionRunId}: immutable application request differs`
    );
    this.name = "MemoryApplicationIdentityConflictError";
  }
}

export interface RebuildMemoryApplicationCountersResult {
  canonicalApplicationCount: number;
  legacyApplicationCount: number;
  rebuiltMemoryRecordCount: number;
  canonicalOutcomeCounts: Record<MemoryApplicationOutcome, number>;
}

export interface CreateMemoryFeedbackEventInput extends RepositoryMetadata {
  memoryRecordId: MemoryRecord["id"];
  executionRunId?: ExecutionRunId;
  feedbackDeltaId?: FeedbackDeltaId;
  eventType?: MemoryFeedbackEventType;
  direction: MemoryFeedbackDirection;
  note: string;
  reason?: string;
  evidenceRef?: string;
}

export interface CreateAntiMemoryRecordInput extends RepositoryMetadata {
  projectId: ProjectId;
  executionRunId?: ExecutionRunId;
  key: string;
  rejectedClaim?: string;
  reason?: string;
  invalidatedBySourceClaimIds?: SourceClaimId[];
  appliesTo?: string;
  mayRevisitWhen?: string;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  sourceLineage: SourceLineageRef[];
  validFrom?: string;
  validUntil?: string;
}

export interface CreateAntiMemoryCandidateInput extends RepositoryMetadata {
  projectId: ProjectId;
  executionRunId?: ExecutionRunId;
  feedbackDeltaId?: FeedbackDeltaId;
  proposedBy: string;
  maintenanceIdentity?: string;
  key: string;
  status?: MemoryCandidateCreateStatus;
  rejectedClaim?: string;
  reason?: string;
  invalidatedBySourceClaimIds?: SourceClaimId[];
  appliesTo?: string;
  mayRevisitWhen?: string;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  sourceLineage: SourceLineageRef[];
  validFrom?: string;
  validUntil?: string;
}

export interface ActiveMemorySelectionOptions {
  terms?: readonly string[];
  now?: string;
}

export interface HistoricalMemoryWarningSelectionOptions {
  terms?: readonly string[];
  now?: string;
}

export interface AntiMemorySelectionOptions {
  terms?: readonly string[];
  now?: string;
}

export interface PromoteAntiMemoryCandidateInput extends RepositoryMetadata {
  candidateId: AntiMemoryCandidate["id"];
  reviewer: string;
  decision: "accepted";
  recordKey?: string;
}

export interface RejectAntiMemoryCandidateInput extends RepositoryMetadata {
  candidateId: AntiMemoryCandidate["id"];
  reviewer: string;
  reason: string;
}

export interface MemoryRepository {
  getMemoryRecord(id: string): Promise<MemoryRecord | undefined>;
  getMemoryRecordById(id: string): Promise<MemoryRecord | undefined>;
  listMemoryRecordsForProject(projectId: ProjectId, limit?: number): Promise<MemoryRecord[]>;
  listActiveMemory(
    projectId: ProjectId,
    limit: number,
    options?: ActiveMemorySelectionOptions
  ): Promise<MemoryRecord[]>;
  listHistoricalMemoryWarnings(
    projectId: ProjectId,
    limit: number,
    options?: HistoricalMemoryWarningSelectionOptions
  ): Promise<MemoryRecord[]>;
  createMemoryCandidate(input: CreateMemoryCandidateInput): Promise<MemoryCandidate>;
  proposeReviewedHelpedMemoryCandidateOnce(
    input: ProposeReviewedHelpedMemoryCandidateInput
  ): Promise<ProposeReviewedHelpedMemoryCandidateResult>;
  getMemoryCandidateById(id: string): Promise<MemoryCandidate | undefined>;
  promoteReviewedMemoryCandidate(input: PromoteMemoryCandidateInput): Promise<MemoryRecord>;
  rejectMemoryCandidate(input: RejectMemoryCandidateInput): Promise<MemoryCandidate>;
  listMemoryCandidates(projectId: ProjectId, limit: number): Promise<MemoryCandidate[]>;
  invalidateMemoryRecord(input: InvalidateMemoryRecordInput): Promise<MemoryRecord>;
  supersedeMemoryRecord(input: SupersedeMemoryRecordInput): Promise<MemoryRecord>;
  applyReviewedMemoryRevision(
    input: ApplyReviewedMemoryRevisionInput
  ): Promise<ApplyReviewedMemoryRevisionResult>;
  recordMemoryApplicationWithEffectsOnce(
    input: RecordMemoryApplicationWithEffectsOnceInput
  ): Promise<RecordMemoryApplicationWithEffectsOnceResult>;
  recordMemoryFeedbackWithPacketBinding(
    input: RecordMemoryFeedbackWithPacketBindingInput
  ): Promise<RecordMemoryFeedbackWithPacketBindingResult>;
  rebuildMemoryApplicationCounters?(): Promise<RebuildMemoryApplicationCountersResult>;
  createMemoryFeedbackEvent(input: CreateMemoryFeedbackEventInput): Promise<MemoryFeedbackEvent>;
  createAntiMemoryCandidate(input: CreateAntiMemoryCandidateInput): Promise<AntiMemoryCandidate>;
  getAntiMemoryCandidateById(id: string): Promise<AntiMemoryCandidate | undefined>;
  promoteReviewedAntiMemoryCandidate(
    input: PromoteAntiMemoryCandidateInput
  ): Promise<AntiMemoryRecord>;
  rejectAntiMemoryCandidate(input: RejectAntiMemoryCandidateInput): Promise<AntiMemoryCandidate>;
  listAntiMemoryCandidates(projectId: ProjectId, limit: number): Promise<AntiMemoryCandidate[]>;
  createAntiMemoryRecord(input: CreateAntiMemoryRecordInput): Promise<AntiMemoryRecord>;
  listAntiMemoryForProject(
    projectId: ProjectId,
    limit: number,
    options?: AntiMemorySelectionOptions
  ): Promise<AntiMemoryRecord[]>;
  listAntiMemoryForRun(executionRunId: ExecutionRunId): Promise<AntiMemoryRecord[]>;
}

export type MemoryActivationRepository = Pick<
  MemoryRepository,
  "listActiveMemory" | "listAntiMemoryForProject"
>;

export type MemoryCandidateReviewRepository = Pick<
  MemoryRepository,
  | "createMemoryCandidate"
  | "getMemoryCandidateById"
  | "promoteReviewedMemoryCandidate"
  | "rejectMemoryCandidate"
  | "getMemoryRecordById"
  | "invalidateMemoryRecord"
  | "supersedeMemoryRecord"
  | "applyReviewedMemoryRevision"
  | "recordMemoryApplicationWithEffectsOnce"
  | "recordMemoryFeedbackWithPacketBinding"
  | "createMemoryFeedbackEvent"
  | "listMemoryCandidates"
  | "createAntiMemoryCandidate"
  | "getAntiMemoryCandidateById"
  | "promoteReviewedAntiMemoryCandidate"
  | "rejectAntiMemoryCandidate"
  | "listAntiMemoryCandidates"
>;
