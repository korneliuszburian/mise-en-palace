import type {
  ProjectId,
  SourceArtifactId,
  SourceClaimId,
  SourceDecisionEdgeId,
  SourceDecisionId,
  SourceRejectionId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type SourceTrustTier =
  | "high"
  | "medium"
  | "low"
  | "primary"
  | "official"
  | "project-decision"
  | "source-code"
  | "paper"
  | "practitioner"
  | "secondary"
  | "hypothesis";

export type SourceSupportType =
  | "supports"
  | "contradicts"
  | "qualifies"
  | "background"
  | "does_not_support"
  | "mechanism"
  | "decision"
  | "risk"
  | "rejection"
  | "eval-design"
  | "implementation-boundary";

export type SourceClaimStatus = "proposed" | "accepted" | "rejected" | "deprecated";

export type SourceDecisionStatus = "adopt" | "reject" | "defer" | "lab_test";

export type SourceDecisionTargetType =
  | "harness_run"
  | "task_contract"
  | "harness_plan"
  | "context_assembly"
  | "evidence_bundle"
  | "review_assessment"
  | "feedback_delta"
  | "architecture_decision"
  | "memory_record"
  | "eval_candidate";

export type SourceDecisionEdgeConfidence = "low" | "medium" | "high";

export type SourceRejectionReason =
  | "no_mechanism"
  | "no_consumer"
  | "decorative"
  | "stale"
  | "conflicting"
  | "unsupported"
  | "duplicate";

export interface SourceClaim {
  id: SourceClaimId;
  sourceArtifactId: SourceArtifactId;
  sourceChunkId?: string;
  executionRunId?: string;
  claim: string;
  mechanism: string;
  krnImplication: string;
  doesNotProve: string;
  trustTier: SourceTrustTier;
  supportType: SourceSupportType;
  consumer: string;
  falsifier?: string;
  revisitWhen?: string;
  status: SourceClaimStatus;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface SourceDecision {
  id: SourceDecisionId;
  projectId?: ProjectId;
  sourceClaimId?: SourceClaimId;
  status: SourceDecisionStatus;
  decision: string;
  rationale: string;
  falsifier: string;
  consumer: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface SourceDecisionEdge {
  id: SourceDecisionEdgeId;
  sourceClaimId: SourceClaimId;
  targetType: SourceDecisionTargetType;
  targetId: string;
  supportType: SourceSupportType;
  confidence: SourceDecisionEdgeConfidence;
  notes: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}

export interface SourceRejection {
  id: SourceRejectionId;
  projectId?: ProjectId;
  executionRunId?: string;
  sourceArtifactId?: SourceArtifactId;
  sourceClaimId?: SourceClaimId;
  title: string;
  attemptedClaim: string;
  rejectedBecause: SourceRejectionReason;
  reason: string;
  doesNotProve: string;
  consumer: string;
  metadata: Record<string, unknown>;
  rejectedAt: IsoTimestamp;
}
