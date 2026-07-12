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
  IsoTimestamp,
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

export interface AntiMemorySelectionOptions {
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
  createMemoryCandidate(input: CreateMemoryCandidateInput): Promise<MemoryCandidate>;
  getMemoryCandidateById(id: string): Promise<MemoryCandidate | undefined>;
  promoteReviewedMemoryCandidate(input: PromoteMemoryCandidateInput): Promise<MemoryRecord>;
  rejectMemoryCandidate(input: RejectMemoryCandidateInput): Promise<MemoryCandidate>;
  listMemoryCandidates(projectId: ProjectId, limit: number): Promise<MemoryCandidate[]>;
  invalidateMemoryRecord(input: InvalidateMemoryRecordInput): Promise<MemoryRecord>;
  supersedeMemoryRecord(input: SupersedeMemoryRecordInput): Promise<MemoryRecord>;
  recordMemoryApplication(input: RecordMemoryApplicationInput): Promise<MemoryApplication>;
  recordMemoryApplicationOnce?(
    input: RecordMemoryApplicationOnceInput
  ): Promise<RecordMemoryApplicationOnceResult>;
  recordMemoryApplicationWithEffectsOnce?(
    input: RecordMemoryApplicationWithEffectsOnceInput
  ): Promise<RecordMemoryApplicationWithEffectsOnceResult>;
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
  | "recordMemoryApplication"
  | "createMemoryFeedbackEvent"
  | "listMemoryCandidates"
  | "createAntiMemoryCandidate"
  | "getAntiMemoryCandidateById"
  | "promoteReviewedAntiMemoryCandidate"
  | "rejectAntiMemoryCandidate"
  | "listAntiMemoryCandidates"
>;
