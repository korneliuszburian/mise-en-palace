import type {
  AntiMemoryRecord,
  ExecutionRunId,
  FeedbackDeltaId,
  MemoryApplication,
  MemoryApplicationOutcome,
  MemoryCandidate,
  MemoryCandidateId,
  MemoryFeedbackDirection,
  MemoryFeedbackEvent,
  MemoryFeedbackEventType,
  MemoryRecord,
  MemoryRecordKind,
  MemoryRecordStatus,
  MemoryRecordVersionId,
  ProjectId,
  SourceClaimId,
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
  status?: MemoryCandidate["status"];
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

export interface RecordMemoryApplicationInput extends RepositoryMetadata {
  memoryRecordId: MemoryRecord["id"];
  executionRunId: ExecutionRunId;
  taskContractId?: TaskContractId;
  contextAssemblyId?: ContextAssemblyId;
  expectedUse: string;
  outcome: MemoryApplicationOutcome;
  notes: string;
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
  invalidatedBySourceClaimId?: SourceClaimId;
  appliesTo?: string;
  mayRevisitWhen?: string;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  sourceLineage: SourceLineageRef[];
}

export interface MemoryRepository {
  createMemoryRecord(input: CreateMemoryRecordInput): Promise<MemoryRecord>;
  getMemoryRecord(id: string): Promise<MemoryRecord | undefined>;
  getMemoryRecordById(id: string): Promise<MemoryRecord | undefined>;
  listMemoryRecordsForProject(projectId: ProjectId, limit?: number): Promise<MemoryRecord[]>;
  listActiveMemory(projectId: ProjectId, limit: number): Promise<MemoryRecord[]>;
  createMemoryCandidate(input: CreateMemoryCandidateInput): Promise<MemoryCandidate>;
  getMemoryCandidateById(id: string): Promise<MemoryCandidate | undefined>;
  promoteMemoryCandidate(input: PromoteMemoryCandidateInput): Promise<MemoryRecord>;
  rejectMemoryCandidate(input: RejectMemoryCandidateInput): Promise<MemoryCandidate>;
  listMemoryCandidates(projectId: ProjectId, limit: number): Promise<MemoryCandidate[]>;
  recordMemoryApplication(input: RecordMemoryApplicationInput): Promise<MemoryApplication>;
  createMemoryFeedbackEvent(input: CreateMemoryFeedbackEventInput): Promise<MemoryFeedbackEvent>;
  createAntiMemoryRecord(input: CreateAntiMemoryRecordInput): Promise<AntiMemoryRecord>;
  listAntiMemoryForProject(projectId: ProjectId, limit: number): Promise<AntiMemoryRecord[]>;
  listAntiMemoryForRun(executionRunId: ExecutionRunId): Promise<AntiMemoryRecord[]>;
}
