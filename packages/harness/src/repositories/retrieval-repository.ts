import type {
  ActivationAbstentionReason,
  ActivationExclusionReason,
  ContextExclusion,
  ContextInclusion,
  ContextAssemblyId,
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
  EmbeddingModelId,
  EmbeddingSubjectFields,
  RetrievalCandidateId,
  RetrievalRunId,
  RetrievalCandidateFields,
  RetrievalCandidateRecord,
  RetrievalCandidateStatus,
  RetrievalRunMode,
  RetrievalRunRecord,
  RetrievalRunStatus,
  RetrievalSubjectType,
  RetrievalValidityStatus,
  SearchDocumentRecord,
  SearchDocumentSearchResult,
  SearchDocumentSubjectFields
} from "./types.js";

export interface CreateSearchDocumentInput extends SearchDocumentSubjectFields {
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

export interface SearchVectorInput {
  projectId?: ProjectId;
  embedding: readonly number[];
  embeddingModelId: EmbeddingModelId;
  limit?: number;
}

export interface SearchHybridInput extends SearchVectorInput {
  query: string;
  lexicalWeight?: number;
  vectorWeight?: number;
}

export interface CreateEmbeddingModelInput {
  provider: string;
  model: string;
  dimensions: number;
  distanceMetric: string;
  status?: EmbeddingModelStatus;
  metadata?: Record<string, unknown>;
}

export interface CreateEmbeddingInput extends EmbeddingSubjectFields {
  embeddingModelId: EmbeddingModelId;
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

export type CompleteRetrievalRunStatus = Extract<
  RetrievalRunStatus,
  "completed" | "abstained" | "failed"
>;

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
  retrievalRunId: RetrievalRunId;
  status: CompleteRetrievalRunStatus;
  completedAt: string;
  activationAbstentionReason?: ActivationAbstentionReason;
  rawEvidenceRecallTriggerCount?: number;
  rawEvidenceRecallTriggers?: readonly ActivationTraceRawRecallTrigger[];
  metadata?: Record<string, unknown>;
}

export interface AddRetrievalCandidateInput extends RetrievalCandidateFields {
  status?: RetrievalCandidateStatus;
  metadata?: Record<string, unknown>;
}

interface RecordActivationDecisionBaseInput {
  retrievalRunId: RetrievalRunId;
  retrievalCandidateId?: RetrievalCandidateId;
  contextAssemblyId?: ContextAssemblyId;
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
  contextAssemblyId: ContextAssemblyId;
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
  contextAssemblyId: ContextAssemblyId;
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
  contextAssemblyId: ContextAssemblyId;
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
  contextAssemblyId: ContextAssemblyId;
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
  contextAssemblyId: ContextAssemblyId;
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
  searchVector(input: SearchVectorInput): Promise<SearchDocumentSearchResult[]>;
  searchHybrid(input: SearchHybridInput): Promise<SearchDocumentSearchResult[]>;
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
  listCandidatesForRetrievalRun(
    retrievalRunId: RetrievalRunId
  ): Promise<RetrievalCandidateRecord[]>;
  listActivationDecisionsForRun(
    retrievalRunId: RetrievalRunId
  ): Promise<ActivationDecisionRecord[]>;
  cleanupTestRetrievalRecords(
    input: CleanupTestRetrievalRecordsInput
  ): Promise<CleanupTestRetrievalRecordsResult>;
  storeContextSelection(input: StoreContextSelectionInput): Promise<void>;
}
