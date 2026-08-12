import type {
  ProjectId,
  SourceArtifactId,
  SourceClaimEdgeId,
  SourceClaimId,
  SourceDecisionEdgeId,
  SourceDecisionId,
  SourceRejectionId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export const sourceArtifactKinds = [
  "doc",
  "file",
  "url",
  "paper",
  "run",
  "operator_input",
  "external_doc"
] as const;

export type SourceArtifactKind = (typeof sourceArtifactKinds)[number];

// Canonical authority taxonomy. The label is the persisted/input value; rank
// and kind are projections used by activation, override policy, and readbacks.
const sourceAuthorityByLabel = {
  high: { authorityRank: "high", sourceKind: "unspecified", rank: 85 },
  medium: { authorityRank: "medium", sourceKind: "unspecified", rank: 60 },
  low: { authorityRank: "low", sourceKind: "unspecified", rank: 25 },
  primary: { authorityRank: "high", sourceKind: "primary", rank: 100 },
  official: { authorityRank: "high", sourceKind: "official", rank: 100 },
  "project-decision": {
    authorityRank: "high",
    sourceKind: "project-decision",
    rank: 100
  },
  "source-code": { authorityRank: "high", sourceKind: "source-code", rank: 100 },
  paper: { authorityRank: "high", sourceKind: "paper", rank: 85 },
  practitioner: { authorityRank: "medium", sourceKind: "practitioner", rank: 60 },
  secondary: { authorityRank: "medium", sourceKind: "secondary", rank: 60 },
  hypothesis: { authorityRank: "low", sourceKind: "hypothesis", rank: 10 }
} as const;

export type SourceAuthorityLabel = keyof typeof sourceAuthorityByLabel;

export type SourceAuthorityRank =
  (typeof sourceAuthorityByLabel)[SourceAuthorityLabel]["authorityRank"];

export type SourceKind =
  (typeof sourceAuthorityByLabel)[SourceAuthorityLabel]["sourceKind"];

export interface SourceAuthority {
  authorityRank: SourceAuthorityRank;
  sourceKind: SourceKind;
  rank: number;
}

export const sourceAuthorityLabels = Object.keys(
  sourceAuthorityByLabel
) as [SourceAuthorityLabel, ...SourceAuthorityLabel[]];

// Canonical support taxonomy. The support type is the persisted/input value;
// relation/use/decisionGrade are projections used by review and activation.
const sourceSupportAssessmentByType = {
  supports: {
    relation: "supports",
    use: "relation-only",
    decisionGrade: false
  },
  contradicts: {
    relation: "contradicts",
    use: "rejection",
    decisionGrade: true
  },
  qualifies: {
    relation: "qualifies",
    use: "relation-only",
    decisionGrade: false
  },
  background: {
    relation: "not_applicable",
    use: "background",
    decisionGrade: false
  },
  does_not_support: {
    relation: "does_not_support",
    use: "relation-only",
    decisionGrade: false
  },
  mechanism: {
    relation: "not_applicable",
    use: "mechanism",
    decisionGrade: true
  },
  decision: {
    relation: "not_applicable",
    use: "decision",
    decisionGrade: true
  },
  risk: {
    relation: "not_applicable",
    use: "risk",
    decisionGrade: true
  },
  rejection: {
    relation: "not_applicable",
    use: "rejection",
    decisionGrade: true
  },
  "eval-design": {
    relation: "not_applicable",
    use: "eval-design",
    decisionGrade: true
  },
  "implementation-boundary": {
    relation: "not_applicable",
    use: "implementation-boundary",
    decisionGrade: true
  }
} as const;

export type SourceSupportType = keyof typeof sourceSupportAssessmentByType;

export type SourceSupportRelation =
  (typeof sourceSupportAssessmentByType)[SourceSupportType]["relation"];

export type SourceUse =
  (typeof sourceSupportAssessmentByType)[SourceSupportType]["use"];

export interface SourceSupportAssessment {
  relation: SourceSupportRelation;
  use: SourceUse;
  decisionGrade: boolean;
}

export const sourceSupportTypes = Object.keys(
  sourceSupportAssessmentByType
) as [SourceSupportType, ...SourceSupportType[]];

export const decisionGradeSourceSupportTypes = sourceSupportTypes.filter((supportType) =>
  sourceSupportAssessmentByType[supportType].decisionGrade);

export interface SourceClaimTaxonomy {
  authorityRank: SourceAuthorityRank;
  sourceKind: SourceKind;
  supportRelation: SourceSupportRelation;
  sourceUse: SourceUse;
  decisionGrade: boolean;
}

export interface SourceContextTaxonomy {
  sourceAuthorityRank?: SourceAuthorityRank;
  sourceKind?: SourceKind;
  sourceSupportRelation?: SourceSupportRelation;
  sourceUse?: SourceUse;
}

export const sourceClaimCreateStatuses = ["proposed"] as const;

export type SourceClaimCreateStatus = (typeof sourceClaimCreateStatuses)[number];

export const sourceClaimLifecycleStatuses = ["accepted", "rejected", "deprecated"] as const;

export type SourceClaimLifecycleStatus = (typeof sourceClaimLifecycleStatuses)[number];

export const sourceClaimStatuses = [
  ...sourceClaimCreateStatuses,
  ...sourceClaimLifecycleStatuses
] as const;

export type SourceClaimStatus = (typeof sourceClaimStatuses)[number];

export const sourceDecisionStatuses = ["adopt", "reject", "defer", "lab_test"] as const;

export type SourceDecisionStatus = (typeof sourceDecisionStatuses)[number];

export const sourceDecisionTargetTypes = [
  "harness_run",
  "task_contract",
  "harness_plan",
  "context_assembly",
  "evidence_bundle",
  "review_assessment",
  "feedback_delta",
  "architecture_decision",
  "memory_record",
  "eval_candidate"
] as const;

export type SourceDecisionTargetType = (typeof sourceDecisionTargetTypes)[number];

export const sourceDecisionEdgeConfidences = ["low", "medium", "high"] as const;

export type SourceDecisionEdgeConfidence = (typeof sourceDecisionEdgeConfidences)[number];

export const sourceClaimEdgeKinds = [
  "supports",
  "contradicts",
  "qualifies",
  "depends_on",
  "supersedes",
  "duplicates",
  "narrows",
  "invalidates",
  "expires"
] as const;

export type SourceClaimEdgeKind = (typeof sourceClaimEdgeKinds)[number];

export type SourceRelationReviewFocus =
  | "contradiction"
  | "duplicate"
  | "supersession"
  | "invalidation"
  | "expiration"
  | "relation_evidence"
  | "stale_connected_claim";

export const sourceRejectionReasons = [
  "no_mechanism",
  "no_consumer",
  "decorative",
  "stale",
  "conflicting",
  "unsupported",
  "duplicate"
] as const;

export type SourceRejectionReason = (typeof sourceRejectionReasons)[number];

export interface SourceClaim {
  id: SourceClaimId;
  sourceArtifactId: SourceArtifactId;
  sourceChunkId?: string;
  executionRunId?: string;
  claim: string;
  mechanism: string;
  krnImplication: string;
  doesNotProve: string;
  sourceAuthority: SourceAuthorityLabel;
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
  /** Legacy rows may omit this until the src005 contraction quarantines them. */
  sourceDecisionId?: SourceDecisionId;
  targetType: SourceDecisionTargetType;
  targetId: string;
  supportType: SourceSupportType;
  confidence: SourceDecisionEdgeConfidence;
  notes: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}

export interface SourceClaimEdge {
  id: SourceClaimEdgeId;
  fromSourceClaimId: SourceClaimId;
  toSourceClaimId: SourceClaimId;
  kind: SourceClaimEdgeKind;
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

export const relatedSourceClaimIdForEdge = (
  sourceClaimId: SourceClaimId,
  edge: Pick<SourceClaimEdge, "fromSourceClaimId" | "toSourceClaimId">
): SourceClaimId | undefined => {
  if (edge.fromSourceClaimId === sourceClaimId) {
    return edge.toSourceClaimId;
  }

  if (edge.toSourceClaimId === sourceClaimId) {
    return edge.fromSourceClaimId;
  }

  return undefined;
};

export const classifySourceAuthority = (
  sourceAuthority: SourceAuthorityLabel
): SourceAuthority => sourceAuthorityByLabel[sourceAuthority];

export const rankSourceAuthority = (sourceAuthority: SourceAuthorityLabel): number =>
  classifySourceAuthority(sourceAuthority).rank;

export const assessSourceSupportType = (
  supportType: SourceSupportType
): SourceSupportAssessment => sourceSupportAssessmentByType[supportType];

export const classifySourceClaimTaxonomy = (
  claim: Pick<SourceClaim, "sourceAuthority" | "supportType">
): SourceClaimTaxonomy => {
  const authority = classifySourceAuthority(claim.sourceAuthority);
  const support = assessSourceSupportType(claim.supportType);

  return {
    authorityRank: authority.authorityRank,
    sourceKind: authority.sourceKind,
    supportRelation: support.relation,
    sourceUse: support.use,
    decisionGrade: support.decisionGrade
  };
};

const decisionGradeSourceSupportTypeSet = new Set<SourceSupportType>(
  decisionGradeSourceSupportTypes
);

export const isDecisionGradeSourceSupportType = (
  supportType: SourceSupportType
): boolean => decisionGradeSourceSupportTypeSet.has(supportType);
