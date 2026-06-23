import type {
  ContextAssemblyId,
  ExecutionRunId,
  OperatorIntentId,
  ProjectId,
  RepoInstallationId,
  SourceArtifactId,
  SourceChunkId,
  SourceTrustTier,
  TaskContractId,
  WorkspaceId
} from "@krn/core";
import type { IsoTimestamp } from "@krn/core";

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

export interface NewRunEvent {
  sequence: number;
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
  kind: "doc" | "file" | "url" | "paper" | "run" | "operator_input" | "external_doc";
  trustTier: SourceTrustTier;
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

export type RetrievalSubjectType =
  | "source_artifact"
  | "source_chunk"
  | "source_claim"
  | "memory_record"
  | "anti_memory_record"
  | "task_contract"
  | "search_document"
  | "evidence_bundle"
  | "review_assessment"
  | "architecture_decision"
  | "run_event";

export type RetrievalRunStatus = "running" | "completed" | "abstained" | "failed";
export type RetrievalRunMode = "lexical" | "vector" | "hybrid" | "graph" | "mixed";
export type RetrievalCandidateKind = "memory" | "anti_memory" | "source" | "search";
export type RetrievalCandidateStatus = "candidate" | "included" | "excluded";
export type RetrievalValidityStatus = "active" | "expired" | "invalidated";
export type EmbeddingModelStatus = "active" | "deprecated" | "disabled";
export type ActivationDecisionStatus =
  | "included"
  | "excluded"
  | "abstained"
  | "deferred"
  | "conflict"
  | "stale";

export interface SearchDocumentRecord {
  id: string;
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
  trustTier: SourceTrustTier;
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

export interface SearchDocumentSearchResult extends SearchDocumentRecord {
  lexicalScore: number;
  vectorScore?: number;
  graphScore?: number;
  temporalScore?: number;
  contextRoiScore?: number;
}

export interface EmbeddingModelRecord {
  id: string;
  provider: string;
  model: string;
  dimensions: number;
  distanceMetric: string;
  status: EmbeddingModelStatus;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface EmbeddingRecord {
  id: string;
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
  trustTier: SourceTrustTier;
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
  id: string;
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

export interface RetrievalCandidateRecord {
  id: string;
  retrievalRunId: string;
  kind: RetrievalCandidateKind;
  status: RetrievalCandidateStatus;
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
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}

export interface ActivationDecisionRecord {
  id: string;
  retrievalRunId: string;
  retrievalCandidateId?: string;
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
  source: "goal" | "cli" | "api" | "codex" | "operator";
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
  status?: "draft" | "ready" | "running" | "completed" | "blocked";
  summary: string;
  nextAction?: string;
}

export interface CreateOutboxEventInput {
  topic: string;
  payload: Record<string, unknown>;
  availableAt?: IsoTimestamp;
}

export interface AppendRunEventInput extends NewRunEvent {
  executionRunId: ExecutionRunId;
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
  kind: SourceArtifactRecord["kind"];
  trustTier: SourceArtifactRecord["trustTier"];
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
