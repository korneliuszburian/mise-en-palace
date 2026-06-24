import type {
  ActivationAbstentionReason,
  ActivationExclusionReason,
  ContextExclusion,
  ContextInclusion,
  ExecutionRunId,
  ProjectId,
  SourceTrustTier,
  TaskContractId
} from "@krn/core";

import type {
  ActivationDecisionRecord,
  EmbeddingModelRecord,
  EmbeddingModelStatus,
  EmbeddingRecord,
  RetrievalCandidateKind,
  RetrievalCandidateRecord,
  RetrievalCandidateStatus,
  RetrievalRunMode,
  RetrievalRunRecord,
  RetrievalSubjectType,
  RetrievalValidityStatus,
  SearchDocumentRecord,
  SearchDocumentSearchResult
} from "./types.js";

export interface CreateSearchDocumentInput {
  projectId?: ProjectId;
  subjectType: RetrievalSubjectType;
  subjectId: string;
  sourceArtifactId?: string;
  sourceChunkId?: string;
  sourceClaimId?: string;
  memoryRecordId?: string;
  antiMemoryRecordId?: string;
  evidenceBundleId?: string;
  reviewAssessmentId?: string;
  sourceDecisionId?: string;
  runEventId?: string;
  trustTier?: SourceTrustTier;
  validityStatus?: RetrievalValidityStatus;
  language?: string;
  title: string;
  body: string;
  searchText?: string;
  metadataFilters?: Record<string, unknown>;
  validFrom?: string;
  validUntil?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchLexicalInput {
  projectId?: ProjectId;
  query: string;
  limit?: number;
}

export interface CreateEmbeddingModelInput {
  provider: string;
  model: string;
  dimensions: number;
  distanceMetric: string;
  status?: EmbeddingModelStatus;
  metadata?: Record<string, unknown>;
}

export interface CreateEmbeddingInput {
  projectId?: ProjectId;
  embeddingModelId: string;
  subjectType: RetrievalSubjectType;
  subjectId: string;
  sourceArtifactId?: string;
  sourceChunkId?: string;
  sourceClaimId?: string;
  memoryRecordId?: string;
  antiMemoryRecordId?: string;
  searchDocumentId?: string;
  embedding: number[];
  contentHash: string;
  trustTier?: SourceTrustTier;
  validityStatus?: RetrievalValidityStatus;
  metadataFilters?: Record<string, unknown>;
  validFrom?: string;
  validUntil?: string;
  metadata?: Record<string, unknown>;
}

export interface StartRetrievalRunInput {
  projectId?: ProjectId;
  executionRunId?: ExecutionRunId;
  taskContractId?: TaskContractId;
  query: string;
  mode?: RetrievalRunMode;
  budget?: number;
  tokenBudget?: number;
  metadataFilters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export type ActivationTraceRawRecallReason = "exact_proof_required" | "low_trust";

export interface ActivationTraceRawRecall {
  required: boolean;
  reasons: readonly ActivationTraceRawRecallReason[];
  evidenceHints: readonly string[];
}

export interface ActivationTraceRawRecallTrigger {
  subjectType: RetrievalSubjectType;
  subjectId: string;
  candidateId: string;
  reasons: readonly ActivationTraceRawRecallReason[];
  trustTier: SourceTrustTier;
  evidenceHints: readonly string[];
}

export type ActivationDecisionSourceSupportState =
  | "not_applicable"
  | "source_claim_supported"
  | "source_claim_missing_mechanism"
  | "source_claim_missing_does_not_prove";

export interface CompleteRetrievalRunInput {
  retrievalRunId: string;
  status: RetrievalRunRecord["status"];
  completedAt: string;
  activationAbstentionReason?: ActivationAbstentionReason;
  rawEvidenceRecallTriggerCount?: number;
  rawEvidenceRecallTriggers?: readonly ActivationTraceRawRecallTrigger[];
  metadata?: Record<string, unknown>;
}

export interface AddRetrievalCandidateInput {
  retrievalRunId: string;
  kind: RetrievalCandidateKind;
  status?: RetrievalCandidateStatus;
  subjectType: RetrievalSubjectType;
  subjectId: string;
  searchDocumentId?: string;
  trustTier: SourceTrustTier;
  lexicalScore?: number;
  vectorScore?: number;
  graphScore?: number;
  temporalScore?: number;
  contextRoiScore?: number;
  totalScore?: number;
  score?: number;
  reason: string;
  metadata?: Record<string, unknown>;
}

interface RecordActivationDecisionBaseInput {
  retrievalRunId: string;
  retrievalCandidateId?: string;
  contextAssemblyId?: string;
  subjectType: RetrievalSubjectType;
  subjectId: string;
  reason: string;
  score?: number;
  contextBudgetCost?: number;
  expectedDecisionImpact?: string;
  metadata?: Record<string, unknown>;
}

export interface RecordIncludedActivationDecisionInput
  extends RecordActivationDecisionBaseInput {
  decision: "included";
  contextAssemblyId: string;
  expectedDecisionImpact: string;
  expectedUse: string;
  rawRecall?: ActivationTraceRawRecall;
  sourceSupportState?: ActivationDecisionSourceSupportState;
  antiMemoryRecordId?: never;
  exclusionCategory?: never;
  activationAbstentionReason?: never;
}

export interface RecordExcludedActivationDecisionInput
  extends RecordActivationDecisionBaseInput {
  decision: "excluded";
  contextAssemblyId: string;
  expectedUse?: never;
  rawRecall?: never;
  antiMemoryRecordId?: never;
  exclusionCategory: Exclude<ActivationExclusionReason, "stale">;
  sourceSupportState?: ActivationDecisionSourceSupportState;
  activationAbstentionReason?: ActivationAbstentionReason;
}

export interface RecordConflictActivationDecisionInput
  extends RecordActivationDecisionBaseInput {
  decision: "conflict";
  contextAssemblyId: string;
  expectedUse?: never;
  rawRecall?: never;
  antiMemoryRecordId: string;
  exclusionCategory: ActivationExclusionReason;
  sourceSupportState?: ActivationDecisionSourceSupportState;
  activationAbstentionReason?: ActivationAbstentionReason;
}

export interface RecordStaleActivationDecisionInput
  extends RecordActivationDecisionBaseInput {
  decision: "stale";
  contextAssemblyId: string;
  expectedUse?: never;
  rawRecall?: never;
  antiMemoryRecordId?: never;
  exclusionCategory: "stale";
  sourceSupportState?: ActivationDecisionSourceSupportState;
  activationAbstentionReason?: ActivationAbstentionReason;
}

export interface RecordDeferredActivationDecisionInput
  extends RecordActivationDecisionBaseInput {
  decision: "deferred";
  expectedUse?: never;
  rawRecall?: never;
  antiMemoryRecordId?: never;
  exclusionCategory?: never;
  sourceSupportState?: ActivationDecisionSourceSupportState;
  activationAbstentionReason?: never;
}

export type RecordActivationDecisionInput =
  | RecordIncludedActivationDecisionInput
  | RecordExcludedActivationDecisionInput
  | RecordConflictActivationDecisionInput
  | RecordStaleActivationDecisionInput
  | RecordDeferredActivationDecisionInput;

export interface StoreContextSelectionInput {
  contextAssemblyId: string;
  inclusions: ContextInclusion[];
  exclusions: ContextExclusion[];
}

export interface CleanupTestRetrievalRecordsInput {
  smokeId: string;
}

export interface CleanupTestRetrievalRecordsResult {
  deletedCount: number;
}

export interface RetrievalRepository {
  createSearchDocument(input: CreateSearchDocumentInput): Promise<SearchDocumentRecord>;
  searchLexical(input: SearchLexicalInput): Promise<SearchDocumentSearchResult[]>;
  createEmbeddingModel(input: CreateEmbeddingModelInput): Promise<EmbeddingModelRecord>;
  createEmbedding(input: CreateEmbeddingInput): Promise<EmbeddingRecord>;
  createRetrievalRun(input: StartRetrievalRunInput): Promise<RetrievalRunRecord>;
  startRetrievalRun(input: StartRetrievalRunInput): Promise<RetrievalRunRecord>;
  completeRetrievalRun(input: CompleteRetrievalRunInput): Promise<RetrievalRunRecord>;
  createRetrievalCandidate(input: AddRetrievalCandidateInput): Promise<RetrievalCandidateRecord>;
  addCandidate(input: AddRetrievalCandidateInput): Promise<RetrievalCandidateRecord>;
  createActivationDecision(
    input: RecordActivationDecisionInput
  ): Promise<ActivationDecisionRecord>;
  recordActivationDecision(input: RecordActivationDecisionInput): Promise<ActivationDecisionRecord>;
  listCandidatesForRetrievalRun(retrievalRunId: string): Promise<RetrievalCandidateRecord[]>;
  listActivationDecisionsForRun(retrievalRunId: string): Promise<ActivationDecisionRecord[]>;
  cleanupTestRetrievalRecords(
    input: CleanupTestRetrievalRecordsInput
  ): Promise<CleanupTestRetrievalRecordsResult>;
  storeContextSelection(input: StoreContextSelectionInput): Promise<void>;
}
