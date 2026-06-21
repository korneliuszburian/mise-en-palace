import type {
  AntiMemoryRecord,
  MemoryCandidate,
  MemoryRecord,
  MemoryRecordKind,
  MemoryRecordStatus,
  ProjectId,
  SourceLineageRef
} from "@krn/core";

import type { RepositoryMetadata } from "./types.js";

export interface CreateMemoryRecordInput extends RepositoryMetadata {
  projectId: ProjectId;
  key: string;
  kind: MemoryRecordKind;
  status?: MemoryRecordStatus;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  applicationGuidance: string;
  sourceLineage: SourceLineageRef[];
  isUserPreference: boolean;
}

export interface CreateMemoryCandidateInput extends RepositoryMetadata {
  projectId: ProjectId;
  proposedBy: string;
  kind: MemoryRecordKind;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  applicationGuidance: string;
  sourceLineage: SourceLineageRef[];
  isUserPreference: boolean;
}

export interface CreateAntiMemoryRecordInput extends RepositoryMetadata {
  projectId: ProjectId;
  key: string;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  sourceLineage: SourceLineageRef[];
}

export interface MemoryRepository {
  createMemoryRecord(input: CreateMemoryRecordInput): Promise<MemoryRecord>;
  getMemoryRecord(id: string): Promise<MemoryRecord | undefined>;
  listActiveMemory(projectId: ProjectId, limit: number): Promise<MemoryRecord[]>;
  createMemoryCandidate(input: CreateMemoryCandidateInput): Promise<MemoryCandidate>;
  listMemoryCandidates(projectId: ProjectId, limit: number): Promise<MemoryCandidate[]>;
  createAntiMemoryRecord(input: CreateAntiMemoryRecordInput): Promise<AntiMemoryRecord>;
}
