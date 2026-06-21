import type {
  ProjectId,
  SourceClaim,
  SourceDecisionEdge,
  SourceSupportType,
  SourceTrustTier
} from "@krn/core";

import type {
  CreateSourceArtifactInput,
  CreateSourceChunkInput,
  SourceArtifactRecord,
  SourceChunkRecord
} from "./types.js";

export interface CreateSourceClaimInput {
  sourceArtifactId: string;
  sourceChunkId?: string;
  claim: string;
  mechanism: string;
  krnImplication: string;
  doesNotProve: string;
  trustTier: SourceTrustTier;
  supportType: SourceSupportType;
  consumer: string;
  metadata?: Record<string, unknown>;
}

export interface CreateSourceDecisionInput {
  projectId?: ProjectId;
  sourceClaimId?: string;
  status: SourceDecisionEdge["status"];
  decision: string;
  rationale: string;
  falsifier: string;
  consumer: string;
  metadata?: Record<string, unknown>;
}

export interface SourceRepository {
  createSourceArtifact(input: CreateSourceArtifactInput): Promise<SourceArtifactRecord>;
  createSourceChunk(input: CreateSourceChunkInput): Promise<SourceChunkRecord>;
  createSourceClaim(input: CreateSourceClaimInput): Promise<SourceClaim>;
  listClaimsForProject(projectId: ProjectId, limit: number): Promise<SourceClaim[]>;
  createSourceDecision(input: CreateSourceDecisionInput): Promise<SourceDecisionEdge>;
}
