import type {
  ContextAssemblyId,
  ExecutionRunId,
  HarnessPlanStatus,
  OperatorIntentSource,
  OperatorIntentId,
  ProjectId,
  RepoInstallationId,
  SourceArtifactId,
  SourceChunkId,
  SourceAuthorityLabel,
  TaskContractId,
  WorkspaceId
} from "@krn/core";
import type { IsoTimestamp } from "@krn/core";
import type {
  EmbeddingModelStatus,
  RetrievalActivationDecisionStatus,
  RetrievalCandidateKind,
  RetrievalCandidateStatus,
  RetrievalRunMode,
  RetrievalRunStatus,
  RetrievalSubjectType,
  RetrievalValidityStatus
} from "../retrieval-model.js";

export type SearchDocumentId = string;
export type EmbeddingModelId = string;
export type EmbeddingId = string;
export type RetrievalRunId = string;
export type RetrievalCandidateId = string;
export type ActivationDecisionId = string;

export interface RepositoryMetadata {
  metadata?: Record<string, unknown>;
}

export interface WorkspaceRecord {
  id: WorkspaceId;
  slug: string;
  displayName: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface ProjectRecord {
  id: ProjectId;
  workspaceId: WorkspaceId;
  slug: string;
  displayName: string;
  description?: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface RepoInstallationRecord {
  id: RepoInstallationId;
  projectId: ProjectId;
  provider: string;
  repoUrl: string;
  defaultBranch: string;
  repoFingerprint?: string;
  localPathHint?: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface ProjectKernelRecord {
  id: string;
  projectId: ProjectId;
  version: number;
  summary: string;
  activeContextRule: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export type RunEventSeverity = "debug" | "info" | "warning" | "error";

export interface RunEventRecord {
  id: string;
  executionRunId?: ExecutionRunId;
  sequence: number;
  type: string;
  severity: RunEventSeverity;
  message: string;
  payload: Record<string, unknown>;
  occurredAt: IsoTimestamp;
}

export interface OrdinaryRunEventInput {
  type: string;
  severity?: RunEventSeverity;
  message: string;
  payload?: Record<string, unknown>;
}

export type OutboxEventStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "dead_letter";

export interface OutboxEventRecord {
  id: string;
  topic: string;
  status: OutboxEventStatus;
  payload: Record<string, unknown>;
  attempts: number;
  availableAt: IsoTimestamp;
  lockedAt?: IsoTimestamp;
  lockedBy?: string;
  lastError?: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface SourceArtifactRecord {
  id: SourceArtifactId;
  projectId?: ProjectId;
  importId?: string;
  importRowId?: string;
  kind: "doc" | "file" | "url" | "paper" | "run" | "operator_input" | "external_doc";
  sourceAuthority: SourceAuthorityLabel;
  uri: string;
  title: string;
  contentHash: string;
  capturedAt: IsoTimestamp;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface SourceChunkRecord {
  id: SourceChunkId;
  sourceArtifactId: SourceArtifactId;
  ordinal: number;
  heading?: string;
  content: string;
  tokenCount?: number;
  contentHash: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}

export type ActivationDecisionStatus = RetrievalActivationDecisionStatus;

export type {
  EmbeddingModelStatus,
  RetrievalCandidateKind,
  RetrievalCandidateStatus,
  RetrievalRunMode,
  RetrievalRunStatus,
  RetrievalSubjectType,
  RetrievalValidityStatus
};

export interface SearchDocumentSubjectFields {
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
}

export interface SearchDocumentRecord extends SearchDocumentSubjectFields {
  id: SearchDocumentId;
  sourceAuthority: SourceAuthorityLabel;
  validityStatus: RetrievalValidityStatus;
  language: string;
  title: string;
  body: string;
  searchText: string;
  metadataFilters: Record<string, unknown>;
  validFrom: IsoTimestamp;
  validUntil?: IsoTimestamp;
  invalidatedAt?: IsoTimestamp;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface EmbeddingModelProvenance {
  embeddingModelId: EmbeddingModelId;
  provider: string;
  model: string;
  dimensions: number;
}

export interface SearchDocumentSearchResult extends SearchDocumentRecord {
  lexicalScore: number;
  vectorScore?: number;
  embeddingModel?: EmbeddingModelProvenance;
  graphScore?: number;
  temporalScore?: number;
  contextRoiScore?: number;
}

export interface EmbeddingModelRecord {
  id: EmbeddingModelId;
  provider: string;
  model: string;
  dimensions: number;
  distanceMetric: string;
  status: EmbeddingModelStatus;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface EmbeddingSubjectFields {
  projectId?: ProjectId;
  embeddingModelId: EmbeddingModelId;
  subjectType: RetrievalSubjectType;
  subjectId: string;
  sourceArtifactId?: string;
  sourceChunkId?: string;
  sourceClaimId?: string;
  memoryRecordId?: string;
  antiMemoryRecordId?: string;
  searchDocumentId?: SearchDocumentId;
}

export interface EmbeddingRecord extends EmbeddingSubjectFields {
  id: EmbeddingId;
  embedding: number[];
  contentHash: string;
  sourceAuthority: SourceAuthorityLabel;
  validityStatus: RetrievalValidityStatus;
  metadataFilters: Record<string, unknown>;
  validFrom: IsoTimestamp;
  validUntil?: IsoTimestamp;
  invalidatedAt?: IsoTimestamp;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface RetrievalRunRecord {
  id: RetrievalRunId;
  projectId?: ProjectId;
  executionRunId?: ExecutionRunId;
  taskContractId?: TaskContractId;
  status: RetrievalRunStatus;
  query: string;
  mode: RetrievalRunMode;
  budget?: number;
  tokenBudget?: number;
  metadataFilters: Record<string, unknown>;
  startedAt: IsoTimestamp;
  completedAt?: IsoTimestamp;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}

export interface RetrievalCandidateFields {
  retrievalRunId: RetrievalRunId;
  kind: RetrievalCandidateKind;
  subjectType: RetrievalSubjectType;
  subjectId: string;
  searchDocumentId?: SearchDocumentId;
  sourceAuthority: SourceAuthorityLabel;
  lexicalScore?: number;
  vectorScore?: number;
  graphScore?: number;
  temporalScore?: number;
  contextRoiScore?: number;
  totalScore?: number;
  score?: number;
  reason: string;
}

export interface RetrievalCandidateRecord extends RetrievalCandidateFields {
  id: RetrievalCandidateId;
  status: RetrievalCandidateStatus;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}

export interface ActivationDecisionRecord {
  id: ActivationDecisionId;
  retrievalRunId: RetrievalRunId;
  retrievalCandidateId?: RetrievalCandidateId;
  contextAssemblyId?: ContextAssemblyId;
  subjectType: RetrievalSubjectType;
  subjectId: string;
  decision: ActivationDecisionStatus;
  reason: string;
  score?: number;
  contextBudgetCost?: number;
  expectedDecisionImpact?: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}

export interface CreateOperatorIntentInput extends RepositoryMetadata {
  workspaceId: WorkspaceId;
  projectId?: ProjectId;
  source: OperatorIntentSource;
  rawIntent: string;
  normalizedIntent?: string;
}

export interface CreateTaskContractInput extends RepositoryMetadata {
  operatorIntentId: OperatorIntentId;
  projectId?: ProjectId;
  title: string;
  objective: string;
  constraints: string[];
  nonGoals: string[];
  acceptance: string[];
}

export interface CreateHarnessPlanInput extends RepositoryMetadata {
  taskContractId: TaskContractId;
  version: number;
  status?: HarnessPlanStatus;
  summary: string;
  nextAction?: string;
}

export interface CreateOutboxEventInput {
  topic: string;
  payload: Record<string, unknown>;
  availableAt?: IsoTimestamp;
}

export interface CreateWorkspaceInput extends RepositoryMetadata {
  slug: string;
  displayName: string;
}

export interface CreateProjectInput extends RepositoryMetadata {
  workspaceId: WorkspaceId;
  slug: string;
  displayName: string;
  description?: string;
}

export interface CreateRepoInstallationInput extends RepositoryMetadata {
  projectId: ProjectId;
  provider: string;
  repoUrl: string;
  defaultBranch: string;
  repoFingerprint?: string;
  localPathHint?: string;
}

export interface CreateProjectKernelInput extends RepositoryMetadata {
  projectId: ProjectId;
  version: number;
  summary: string;
  activeContextRule: string;
}

export interface CreateSourceArtifactInput extends RepositoryMetadata {
  projectId?: ProjectId;
  importId?: string;
  importRowId?: string;
  kind: SourceArtifactRecord["kind"];
  sourceAuthority: SourceArtifactRecord["sourceAuthority"];
  uri: string;
  title: string;
  contentHash: string;
}

export interface CreateSourceChunkInput extends RepositoryMetadata {
  sourceArtifactId: SourceArtifactId;
  ordinal: number;
  heading?: string;
  content: string;
  tokenCount?: number;
  contentHash: string;
}
