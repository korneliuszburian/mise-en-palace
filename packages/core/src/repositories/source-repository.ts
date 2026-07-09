import type {
  ExecutionRunId,
  ProjectId,
  SourceClaim,
  SourceClaimEdge,
  SourceClaimEdgeKind,
  SourceDecision,
  SourceDecisionEdge,
  SourceRejection,
  SourceClaimCreateStatus,
  SourceSupportType,
  SourceAuthorityLabel
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
  sourceAuthority: SourceAuthorityLabel;
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

export interface CreateSourceClaimEdgeInput {
  fromSourceClaimId: SourceClaimEdge["fromSourceClaimId"];
  toSourceClaimId: SourceClaimEdge["toSourceClaimId"];
  kind: SourceClaimEdgeKind;
  metadata: {
    consumer: string;
    doesNotProve: string;
    evidenceRef?: string;
    sourceDecisionRef?: string;
    scope?: string;
    validFrom?: string;
    validUntil?: string;
    invalidatedAt?: string;
  } & Record<string, unknown>;
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

export interface SourceDecisionKnowledgeSource {
  sourceDecision: SourceDecision;
  sourceClaim: SourceClaim;
  sourceDecisionEdge: SourceDecisionEdge;
}

export interface RejectedSourceDecisionKnowledgeSource {
  sourceDecision: SourceDecision;
  sourceClaim: SourceClaim;
  sourceRejection: SourceRejection;
}

export interface SourceRepository {
  createSourceArtifact(input: CreateSourceArtifactInput): Promise<SourceArtifactRecord>;
  createSourceChunk(input: CreateSourceChunkInput): Promise<SourceChunkRecord>;
  createSourceClaim(input: CreateSourceClaimInput): Promise<SourceClaim>;
  getSourceClaimById(id: SourceClaim["id"]): Promise<SourceClaim | undefined>;
  listClaimsForProject(projectId: ProjectId, limit: number): Promise<SourceClaim[]>;
  listSourceClaimsForRun(executionRunId: ExecutionRunId): Promise<SourceClaim[]>;
  createSourceDecision(input: CreateSourceDecisionInput): Promise<SourceDecision>;
  getSourceDecisionById(id: SourceDecision["id"]): Promise<SourceDecision | undefined>;
  listSourceDecisionKnowledgeSources(
    projectId: ProjectId,
    limit: number
  ): Promise<SourceDecisionKnowledgeSource[]>;
  listRejectedSourceDecisionKnowledgeSources(
    projectId: ProjectId,
    limit: number
  ): Promise<RejectedSourceDecisionKnowledgeSource[]>;
  createSourceClaimEdge(input: CreateSourceClaimEdgeInput): Promise<SourceClaimEdge>;
  listSourceClaimEdgesForClaim(sourceClaimId: SourceClaim["id"]): Promise<SourceClaimEdge[]>;
  createSourceDecisionEdge(input: CreateSourceDecisionEdgeInput): Promise<SourceDecisionEdge>;
  getSourceDecisionEdgeById(id: SourceDecisionEdge["id"]): Promise<SourceDecisionEdge | undefined>;
  listSourceDecisionEdgesForClaim(
    sourceClaimId: SourceDecisionEdge["sourceClaimId"]
  ): Promise<SourceDecisionEdge[]>;
  listSourceDecisionEdgesForRun(executionRunId: ExecutionRunId): Promise<SourceDecisionEdge[]>;
  createSourceRejection(input: CreateSourceRejectionInput): Promise<SourceRejection>;
  listSourceRejectionsForClaim?(sourceClaimId: SourceClaim["id"]): Promise<SourceRejection[]>;
}
