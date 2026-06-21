import type {
  AntiMemoryRecordId,
  ContextAssemblyId,
  ExecutionRunId,
  FeedbackDeltaId,
  MemoryApplicationId,
  MemoryCandidateId,
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
export type MemoryCandidateStatus =
  | "proposed"
  | "candidate"
  | "accepted"
  | "rejected"
  | "applied"
  | "superseded";
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

export interface AntiMemoryRecord extends ValidityWindow {
  id: AntiMemoryRecordId;
  projectId: ProjectId;
  executionRunId?: ExecutionRunId;
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
