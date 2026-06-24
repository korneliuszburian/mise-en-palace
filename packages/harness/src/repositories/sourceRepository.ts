import type {
  ExecutionRunId,
  ProjectId,
  SourceClaim,
  SourceDecision,
  SourceDecisionEdge,
  SourceRejection,
  SourceClaimCreateStatus,
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
  executionRunId?: ExecutionRunId;
  claim: string;
  mechanism: string;
  krnImplication: string;
  doesNotProve: string;
  trustTier: SourceTrustTier;
  supportType: SourceSupportType;
  consumer: string;
  falsifier?: string;
  revisitWhen?: string;
  status?: SourceClaimCreateStatus;
  metadata?: Record<string, unknown>;
}

export interface CreateSourceDecisionInput {
  projectId?: ProjectId;
  sourceClaimId?: string;
  status: SourceDecision["status"];
  decision: string;
  rationale: string;
  falsifier: string;
  consumer: string;
  metadata?: Record<string, unknown>;
}

export interface CreateSourceDecisionEdgeInput {
  sourceClaimId: SourceDecisionEdge["sourceClaimId"];
  targetType: SourceDecisionEdge["targetType"];
  targetId: SourceDecisionEdge["targetId"];
  supportType: SourceDecisionEdge["supportType"];
  confidence: SourceDecisionEdge["confidence"];
  notes: SourceDecisionEdge["notes"];
  metadata?: Record<string, unknown>;
}

export interface CreateSourceRejectionInput {
  projectId?: ProjectId;
  executionRunId?: ExecutionRunId;
  sourceArtifactId?: string;
  sourceClaimId?: string;
  title: SourceRejection["title"];
  attemptedClaim: SourceRejection["attemptedClaim"];
  rejectedBecause: SourceRejection["rejectedBecause"];
  reason: SourceRejection["reason"];
  doesNotProve: SourceRejection["doesNotProve"];
  consumer: SourceRejection["consumer"];
  metadata?: Record<string, unknown>;
}

export interface SourceRepository {
  createSourceArtifact(input: CreateSourceArtifactInput): Promise<SourceArtifactRecord>;
  createSourceChunk(input: CreateSourceChunkInput): Promise<SourceChunkRecord>;
  createSourceClaim(input: CreateSourceClaimInput): Promise<SourceClaim>;
  getSourceClaimById(id: SourceClaim["id"]): Promise<SourceClaim | undefined>;
  listClaimsForProject(projectId: ProjectId, limit: number): Promise<SourceClaim[]>;
  listSourceClaimsForRun(executionRunId: ExecutionRunId): Promise<SourceClaim[]>;
  createSourceDecision(input: CreateSourceDecisionInput): Promise<SourceDecision>;
  createSourceDecisionEdge(input: CreateSourceDecisionEdgeInput): Promise<SourceDecisionEdge>;
  listSourceDecisionEdgesForRun(executionRunId: ExecutionRunId): Promise<SourceDecisionEdge[]>;
  createSourceRejection(input: CreateSourceRejectionInput): Promise<SourceRejection>;
}
