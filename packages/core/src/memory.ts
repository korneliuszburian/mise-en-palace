import type {
  AntiMemoryRecordId,
  MemoryCandidateId,
  MemoryRecordId,
  ProjectId
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

export type MemoryRecordStatus = "active" | "stale" | "invalidated" | "superseded";
export type MemoryCandidateStatus = "candidate" | "accepted" | "rejected" | "applied";

export interface SourceLineageRef {
  sourceId: string;
  note?: string;
}

export interface MemoryRecord extends ValidityWindow {
  id: MemoryRecordId;
  projectId: ProjectId;
  key: string;
  kind: MemoryRecordKind;
  status: MemoryRecordStatus;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  applicationGuidance: string;
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
  proposedBy: string;
  kind: MemoryRecordKind;
  status: MemoryCandidateStatus;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  applicationGuidance: string;
  sourceLineage: SourceLineageRef[];
  isUserPreference: boolean;
  rejectionReason?: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface AntiMemoryRecord extends ValidityWindow {
  id: AntiMemoryRecordId;
  projectId: ProjectId;
  key: string;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  sourceLineage: SourceLineageRef[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}
