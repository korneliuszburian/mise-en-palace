import type {
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

export interface CompleteRetrievalRunInput {
  retrievalRunId: string;
  status: RetrievalRunRecord["status"];
  completedAt: string;
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

export interface RecordActivationDecisionInput {
  retrievalRunId: string;
  retrievalCandidateId?: string;
  contextAssemblyId?: string;
  subjectType: RetrievalSubjectType;
  subjectId: string;
  decision: ActivationDecisionRecord["decision"];
  reason: string;
  score?: number;
  contextBudgetCost?: number;
  expectedDecisionImpact?: string;
  metadata?: Record<string, unknown>;
}

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
