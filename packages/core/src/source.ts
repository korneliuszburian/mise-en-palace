import type {
  ProjectId,
  SourceArtifactId,
  SourceClaimEdgeId,
  SourceClaimId,
  SourceDecisionEdgeId,
  SourceDecisionId,
  SourceRejectionId
} from "./ids.js";
import {
  readMetadataString,
  readMetadataStringList
} from "./metadata.js";
import {
  parseTimestampMs,
  type IsoTimestamp
} from "./time.js";

export const sourceTrustTiers = [
  "high",
  "medium",
  "low",
  "primary",
  "official",
  "project-decision",
  "source-code",
  "paper",
  "practitioner",
  "secondary",
  "hypothesis"
] as const;

export type SourceTrustTier = typeof sourceTrustTiers[number];

export type SourceTrustLevel = "high" | "medium" | "low";

export type SourceKind =
  | "unspecified"
  | "primary"
  | "official"
  | "project-decision"
  | "source-code"
  | "paper"
  | "practitioner"
  | "secondary"
  | "hypothesis";

export const sourceSupportTypes = [
  "supports",
  "contradicts",
  "qualifies",
  "background",
  "does_not_support",
  "mechanism",
  "decision",
  "risk",
  "rejection",
  "eval-design",
  "implementation-boundary"
] as const;

export type SourceSupportType = typeof sourceSupportTypes[number];

export type SourceSupportRelation =
  | "supports"
  | "contradicts"
  | "qualifies"
  | "does_not_support"
  | "not_applicable";

export type SourceUse =
  | "background"
  | "relation-only"
  | "mechanism"
  | "decision"
  | "risk"
  | "rejection"
  | "eval-design"
  | "implementation-boundary";

export interface SourceAuthority {
  trustLevel: SourceTrustLevel;
  sourceKind: SourceKind;
  rank: number;
}

export type SourceTrustTaxonomy = Omit<SourceAuthority, "rank">;

export interface SourceSupportAssessment {
  relation: SourceSupportRelation;
  use: SourceUse;
  decisionGrade: boolean;
}

export type SourceSupportTaxonomy = SourceSupportAssessment;

export interface SourceClaimTaxonomy extends SourceTrustTaxonomy {
  supportRelation: SourceSupportRelation;
  sourceUse: SourceUse;
  decisionGrade: boolean;
}

export interface SourceContextTaxonomy {
  sourceTrustLevel?: SourceTrustLevel;
  sourceKind?: SourceKind;
  sourceSupportRelation?: SourceSupportRelation;
  sourceUse?: SourceUse;
}

export type SourceClaimCreateStatus = "proposed";

export type SourceClaimLifecycleStatus = "accepted" | "rejected" | "deprecated";

export type SourceClaimStatus = SourceClaimCreateStatus | SourceClaimLifecycleStatus;

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

export type SourceClaimEdgeKind =
  | "supports"
  | "contradicts"
  | "qualifies"
  | "depends_on"
  | "supersedes"
  | "duplicates"
  | "narrows"
  | "invalidates"
  | "expires";

export type SourceRelationReviewFocus =
  | "contradiction"
  | "duplicate"
  | "supersession"
  | "invalidation"
  | "expiration"
  | "relation_evidence"
  | "stale_connected_claim";

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

export interface SourceClaimEdge {
  id: SourceClaimEdgeId;
  fromSourceClaimId: SourceClaimId;
  toSourceClaimId: SourceClaimId;
  kind: SourceClaimEdgeKind;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
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

export interface SourceRelationMetadataReadback {
  consumer?: string;
  doesNotProve?: string;
  evidenceRef?: string;
  evidenceRefs: readonly string[];
  file?: string;
  contentHash?: string;
  missingProofBoundaryFields: readonly SourceRelationMetadataProofBoundaryField[];
  sourceDecisionRef?: string;
  scope?: string;
  sourceRanges: readonly string[];
  validFrom?: string;
  validUntil?: string;
  invalidatedAt?: string;
}

export type SourceRelationMetadataProofBoundaryField = "consumer" | "doesNotProve";

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

export const sourceAuthorityByTrustTier: Record<SourceTrustTier, SourceAuthority> = {
  high: { trustLevel: "high", sourceKind: "unspecified", rank: 85 },
  medium: { trustLevel: "medium", sourceKind: "unspecified", rank: 60 },
  low: { trustLevel: "low", sourceKind: "unspecified", rank: 25 },
  primary: { trustLevel: "high", sourceKind: "primary", rank: 100 },
  official: { trustLevel: "high", sourceKind: "official", rank: 100 },
  "project-decision": {
    trustLevel: "high",
    sourceKind: "project-decision",
    rank: 100
  },
  "source-code": { trustLevel: "high", sourceKind: "source-code", rank: 100 },
  paper: { trustLevel: "high", sourceKind: "paper", rank: 85 },
  practitioner: { trustLevel: "medium", sourceKind: "practitioner", rank: 60 },
  secondary: { trustLevel: "medium", sourceKind: "secondary", rank: 60 },
  hypothesis: { trustLevel: "low", sourceKind: "hypothesis", rank: 10 }
};

export const rankSourceTrustTier = (trustTier: SourceTrustTier): number =>
  sourceAuthorityByTrustTier[trustTier].rank;

const readTrimmedMetadataString = (
  metadata: Record<string, unknown>,
  key: string
): string | undefined => readMetadataString(metadata, key)?.trim();

const readTrimmedMetadataStringList = (
  metadata: Record<string, unknown>,
  key: string
): readonly string[] => readMetadataStringList(metadata, key).map((item) => item.trim());

const uniqueStrings = (values: readonly string[]): readonly string[] => [...new Set(values)];

export const readSourceRelationMetadataReadback = (
  metadata: Record<string, unknown>
): SourceRelationMetadataReadback => {
  const consumer = readTrimmedMetadataString(metadata, "consumer");
  const doesNotProve = readTrimmedMetadataString(metadata, "doesNotProve");
  const evidenceRef = readTrimmedMetadataString(metadata, "evidenceRef");
  const evidenceRefs = uniqueStrings([
    ...(evidenceRef === undefined ? [] : [evidenceRef]),
    ...readTrimmedMetadataStringList(metadata, "evidenceRefs")
  ]);
  const sourceDecisionRef = readTrimmedMetadataString(metadata, "sourceDecisionRef");
  const scope = readTrimmedMetadataString(metadata, "scope");
  const validFrom = readTrimmedMetadataString(metadata, "validFrom");
  const validUntil = readTrimmedMetadataString(metadata, "validUntil");
  const invalidatedAt = readTrimmedMetadataString(metadata, "invalidatedAt");
  const file = readTrimmedMetadataString(metadata, "file");
  const contentHash = readTrimmedMetadataString(metadata, "contentHash");
  const sourceRanges = uniqueStrings(readTrimmedMetadataStringList(metadata, "sourceRanges"));
  const missingProofBoundaryFields: SourceRelationMetadataProofBoundaryField[] = [
    ...(consumer === undefined ? ["consumer" as const] : []),
    ...(doesNotProve === undefined ? ["doesNotProve" as const] : [])
  ];

  return {
    ...(consumer === undefined ? {} : { consumer }),
    ...(doesNotProve === undefined ? {} : { doesNotProve }),
    ...(evidenceRef === undefined ? {} : { evidenceRef }),
    evidenceRefs,
    ...(file === undefined ? {} : { file }),
    ...(contentHash === undefined ? {} : { contentHash }),
    missingProofBoundaryFields,
    ...(sourceDecisionRef === undefined ? {} : { sourceDecisionRef }),
    ...(scope === undefined ? {} : { scope }),
    sourceRanges,
    ...(validFrom === undefined ? {} : { validFrom }),
    ...(validUntil === undefined ? {} : { validUntil }),
    ...(invalidatedAt === undefined ? {} : { invalidatedAt })
  };
};

export const classifySourceAuthority = (
  trustTier: SourceTrustTier
): SourceAuthority => sourceAuthorityByTrustTier[trustTier];

export const classifySourceTrustTier = (
  trustTier: SourceTrustTier
): SourceTrustTaxonomy => {
  const authority = classifySourceAuthority(trustTier);

  return {
    trustLevel: authority.trustLevel,
    sourceKind: authority.sourceKind
  };
};

export const sourceSupportAssessmentByType: Record<
  SourceSupportType,
  SourceSupportAssessment
> = {
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
};

export const assessSourceSupportType = (
  supportType: SourceSupportType
): SourceSupportAssessment => sourceSupportAssessmentByType[supportType];

export const classifySourceSupportType = (
  supportType: SourceSupportType
): SourceSupportTaxonomy => assessSourceSupportType(supportType);

export const classifySourceClaimTaxonomy = (
  claim: Pick<SourceClaim, "trustTier" | "supportType">
): SourceClaimTaxonomy => {
  const trust = classifySourceTrustTier(claim.trustTier);
  const support = classifySourceSupportType(claim.supportType);

  return {
    ...trust,
    supportRelation: support.relation,
    sourceUse: support.use,
    decisionGrade: support.decisionGrade
  };
};

export const decisionGradeSourceSupportTypes: readonly SourceSupportType[] =
  sourceSupportTypes.filter((supportType) =>
    classifySourceSupportType(supportType).decisionGrade);

const decisionGradeSourceSupportTypeSet = new Set<SourceSupportType>(
  decisionGradeSourceSupportTypes
);

export const isDecisionGradeSourceSupportType = (
  supportType: SourceSupportType
): boolean => decisionGradeSourceSupportTypeSet.has(supportType);

const hasText = (value: string | undefined): value is string =>
  value !== undefined && value.trim().length > 0;

const hasMeaningfulOverrideReason = (value: string | undefined): boolean => {
  const trimmed = value?.trim();

  if (trimmed === undefined || trimmed.length < 24) {
    return false;
  }

  return trimmed.split(/\s+/u).filter((word) => word.length >= 3).length >= 4;
};

export type SourceClaimTemporalValidity =
  | {
      readonly status: "valid";
    }
  | {
      readonly status: "stale";
      readonly reason: "revisit_when_elapsed";
    }
  | {
      readonly status: "invalid_time";
      readonly reason: "invalid_now" | "invalid_revisit_when";
    }
  | {
      readonly status: "inactive";
      readonly reason: "rejected_or_deprecated";
    };

export const assessSourceClaimTemporalValidity = (
  sourceClaim: Pick<SourceClaim, "status" | "revisitWhen">,
  now: string
): SourceClaimTemporalValidity => {
  if (sourceClaim.status === "rejected" || sourceClaim.status === "deprecated") {
    return {
      status: "inactive",
      reason: "rejected_or_deprecated"
    };
  }

  const nowAt = parseTimestampMs(now);

  if (nowAt === undefined) {
    return {
      status: "invalid_time",
      reason: "invalid_now"
    };
  }

  if (sourceClaim.revisitWhen === undefined) {
    return {
      status: "valid"
    };
  }

  const revisitAt = parseTimestampMs(sourceClaim.revisitWhen);

  if (revisitAt === undefined) {
    return {
      status: "invalid_time",
      reason: "invalid_revisit_when"
    };
  }

  if (revisitAt < nowAt) {
    return {
      status: "stale",
      reason: "revisit_when_elapsed"
    };
  }

  return {
    status: "valid"
  };
};

export const isSourceClaimTemporallyValid = (
  sourceClaim: Pick<SourceClaim, "status" | "revisitWhen">,
  now: string
): boolean => {
  return assessSourceClaimTemporalValidity(sourceClaim, now).status === "valid";
};

export type SourceClaimOverrideClaim = Pick<
  SourceClaim,
  "id" | "status" | "trustTier" | "revisitWhen" | "createdAt"
>;

export type SourceClaimOverrideAssessment =
  | {
      readonly allowed: true;
      readonly reason: "explicit_override_reason" | "no_stronger_valid_consensus";
    }
  | {
      readonly allowed: false;
      readonly reason: "weaker_than_current_valid_consensus";
      readonly blockedBySourceClaimId: SourceClaim["id"];
    }
  | {
      readonly allowed: false;
      readonly reason: "candidate_not_current_authority";
    };

export const assessSourceClaimOverride = (input: {
  readonly candidate: SourceClaimOverrideClaim;
  readonly currentConsensus: readonly SourceClaimOverrideClaim[];
  readonly now: string;
  readonly overrideReason?: string;
  readonly overrideProvenanceRef?: string;
}): SourceClaimOverrideAssessment => {
  if (assessSourceClaimTemporalValidity(input.candidate, input.now).status !== "valid") {
    return {
      allowed: false,
      reason: "candidate_not_current_authority"
    };
  }

  const candidateTrustRank = rankSourceTrustTier(input.candidate.trustTier);
  const nowIsInvalid = parseTimestampMs(input.now) === undefined;
  const strongerCurrentConsensus = input.currentConsensus.find((currentClaim) => {
    if (currentClaim.id === input.candidate.id || currentClaim.status !== "accepted") {
      return false;
    }

    if (!nowIsInvalid && !isSourceClaimTemporallyValid(currentClaim, input.now)) {
      return false;
    }

    return rankSourceTrustTier(currentClaim.trustTier) > candidateTrustRank;
  });

  if (strongerCurrentConsensus !== undefined) {
    if (
      hasMeaningfulOverrideReason(input.overrideReason) &&
      hasText(input.overrideProvenanceRef)
    ) {
      return {
        allowed: true,
        reason: "explicit_override_reason"
      };
    }

    return {
      allowed: false,
      reason: "weaker_than_current_valid_consensus",
      blockedBySourceClaimId: strongerCurrentConsensus.id
    };
  }

  return {
    allowed: true,
    reason: "no_stronger_valid_consensus"
  };
};

export type SourceClaimReviewSignalKind =
  | "missing_source_to_decision_fields"
  | "decorative_support_type"
  | "invalid_source_claim_time"
  | "stale_accepted_claim"
  | "accepted_claim_without_decision";

export interface SourceClaimReviewSignal {
  kind: SourceClaimReviewSignalKind;
  severity: "warning" | "blocking";
  sourceClaimId: SourceClaimId;
  reason: string;
}

export interface AssessSourceClaimReviewSignalsInput {
  now?: IsoTimestamp;
  sourceDecisionCount?: number;
}

export const assessSourceClaimReviewSignals = (
  claim: SourceClaim,
  input: AssessSourceClaimReviewSignalsInput = {}
): SourceClaimReviewSignal[] => {
  const signals: SourceClaimReviewSignal[] = [];

  if (
    !hasText(claim.mechanism) ||
    !hasText(claim.krnImplication) ||
    !hasText(claim.doesNotProve) ||
    !hasText(claim.consumer) ||
    !hasText(claim.falsifier)
  ) {
    signals.push({
      kind: "missing_source_to_decision_fields",
      severity: "blocking",
      sourceClaimId: claim.id,
      reason:
        "SourceClaim requires mechanism, KRN implication, doesNotProve, consumer, and falsifier before it can guide KRN decisions."
    });
  }

  if (!isDecisionGradeSourceSupportType(claim.supportType)) {
    signals.push({
      kind: "decorative_support_type",
      severity: "blocking",
      sourceClaimId: claim.id,
      reason:
        "SourceClaim support must be decision-grade; decorative/background sources should be rejected instead of retained as authority."
    });
  }

  if (claim.status === "accepted" && input.now !== undefined) {
    const temporalValidity = assessSourceClaimTemporalValidity(claim, input.now);

    if (temporalValidity.status === "invalid_time") {
      signals.push({
        kind: "invalid_source_claim_time",
        severity: "blocking",
        sourceClaimId: claim.id,
        reason:
          "Accepted SourceClaim has invalid temporal metadata and cannot be used as current authority."
      });
    }

    if (temporalValidity.status === "stale") {
      signals.push({
        kind: "stale_accepted_claim",
        severity: "warning",
        sourceClaimId: claim.id,
        reason:
          "Accepted SourceClaim is past revisitWhen and needs refresh, deprecation, or replacement before continued use."
      });
    }
  }

  if (
    claim.status === "accepted" &&
    hasText(claim.consumer) &&
    input.sourceDecisionCount === 0
  ) {
    signals.push({
      kind: "accepted_claim_without_decision",
      severity: "blocking",
      sourceClaimId: claim.id,
      reason:
        "Accepted SourceClaim has a consumer but no linked SourceDecision, which risks source hoarding instead of source-to-decision evidence."
    });
  }

  return signals;
};

export type SourceDecisionReviewSignalKind =
  | "missing_source_claim"
  | "missing_decision_fields"
  | "unsupported_source_claim";

export interface SourceDecisionReviewSignal {
  kind: SourceDecisionReviewSignalKind;
  severity: "warning" | "blocking";
  sourceDecisionId: SourceDecisionId;
  reason: string;
}

export interface AssessSourceDecisionReviewSignalsInput {
  sourceClaimStatus?: SourceClaimStatus;
}

export const assessSourceDecisionReviewSignals = (
  decision: SourceDecision,
  input: AssessSourceDecisionReviewSignalsInput = {}
): SourceDecisionReviewSignal[] => {
  const signals: SourceDecisionReviewSignal[] = [];

  if (
    (decision.status === "adopt" || decision.status === "reject") &&
    !hasText(decision.sourceClaimId)
  ) {
    signals.push({
      kind: "missing_source_claim",
      severity: "blocking",
      sourceDecisionId: decision.id,
      reason:
        "Adopt/reject SourceDecision records require a SourceClaim link before they can be treated as source-grounded decisions."
    });
  }

  if (
    !hasText(decision.decision) ||
    !hasText(decision.rationale) ||
    !hasText(decision.falsifier) ||
    !hasText(decision.consumer)
  ) {
    signals.push({
      kind: "missing_decision_fields",
      severity: "warning",
      sourceDecisionId: decision.id,
      reason:
        "SourceDecision needs decision, rationale, consumer, and falsifier to avoid decorative source retention."
    });
  }

  if (
    input.sourceClaimStatus === "rejected" ||
    input.sourceClaimStatus === "deprecated"
  ) {
    signals.push({
      kind: "unsupported_source_claim",
      severity: "blocking",
      sourceDecisionId: decision.id,
      reason:
        "SourceDecision must not rely on a rejected or deprecated SourceClaim."
    });
  }

  return signals;
};
