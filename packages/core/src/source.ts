import type {
  ProjectId,
  SourceArtifactId,
  SourceClaimId,
  SourceDecisionId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type SourceTrustTier = "high" | "medium" | "low";

export type SourceSupportType =
  | "supports"
  | "contradicts"
  | "qualifies"
  | "background"
  | "does_not_support";

export type SourceDecisionStatus = "adopt" | "reject" | "defer" | "lab_test";

export interface SourceClaim {
  id: SourceClaimId;
  sourceArtifactId: SourceArtifactId;
  claim: string;
  mechanism: string;
  krnImplication: string;
  doesNotProve: string;
  trustTier: SourceTrustTier;
  supportType: SourceSupportType;
  consumer: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface SourceDecisionEdge {
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
