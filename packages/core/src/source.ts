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

export const decisionGradeSourceSupportTypes = [
  "mechanism",
  "decision",
  "risk",
  "rejection",
  "eval-design",
  "implementation-boundary",
  "contradicts"
] as const satisfies readonly SourceSupportType[];

const decisionGradeSourceSupportTypeSet = new Set<SourceSupportType>(
  decisionGradeSourceSupportTypes
);

export const isDecisionGradeSourceSupportType = (
  supportType: SourceSupportType
): boolean => decisionGradeSourceSupportTypeSet.has(supportType);

const sourceTrustTierRanks: Record<SourceTrustTier, number> = {
  official: 100,
  primary: 100,
  "project-decision": 100,
  "source-code": 100,
  paper: 85,
  high: 85,
  practitioner: 60,
  secondary: 60,
  medium: 60,
  low: 25,
  hypothesis: 10
};

export const rankSourceTrustTier = (trustTier: SourceTrustTier): number =>
  sourceTrustTierRanks[trustTier];

const parseTime = (value: string | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Date.parse(value);

  return Number.isFinite(parsed) ? parsed : undefined;
};

const hasText = (value: string | undefined): value is string =>
  value !== undefined && value.trim().length > 0;

export const isSourceClaimTemporallyValid = (
  sourceClaim: Pick<SourceClaim, "status" | "revisitWhen">,
  now: string
): boolean => {
  if (sourceClaim.status === "rejected" || sourceClaim.status === "deprecated") {
    return false;
  }

  const revisitAt = parseTime(sourceClaim.revisitWhen);
  const nowAt = parseTime(now);

  if (revisitAt === undefined || nowAt === undefined) {
    return true;
  }

  return revisitAt >= nowAt;
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
    };

export const assessSourceClaimOverride = (input: {
  readonly candidate: SourceClaimOverrideClaim;
  readonly currentConsensus: readonly SourceClaimOverrideClaim[];
  readonly now: string;
  readonly overrideReason?: string;
}): SourceClaimOverrideAssessment => {
  const candidateCreatedAt = parseTime(input.candidate.createdAt);
  const overrideReason = input.overrideReason?.trim();

  if (overrideReason !== undefined && overrideReason.length > 0) {
    return {
      allowed: true,
      reason: "explicit_override_reason"
    };
  }

  const candidateTrustRank = rankSourceTrustTier(input.candidate.trustTier);
  const strongerCurrentConsensus = input.currentConsensus.find((currentClaim) => {
    if (!isSourceClaimTemporallyValid(currentClaim, input.now)) {
      return false;
    }

    const currentCreatedAt = parseTime(currentClaim.createdAt);
    const candidateIsNewer =
      candidateCreatedAt === undefined ||
      currentCreatedAt === undefined ||
      candidateCreatedAt > currentCreatedAt;

    return (
      candidateIsNewer &&
      rankSourceTrustTier(currentClaim.trustTier) > candidateTrustRank
    );
  });

  if (strongerCurrentConsensus !== undefined) {
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

  if (
    claim.status === "accepted" &&
    input.now !== undefined &&
    !isSourceClaimTemporallyValid(claim, input.now)
  ) {
    signals.push({
      kind: "stale_accepted_claim",
      severity: "warning",
      sourceClaimId: claim.id,
      reason:
        "Accepted SourceClaim is past revisitWhen and needs refresh, deprecation, or replacement before continued use."
    });
  }

  if (
    claim.status === "accepted" &&
    hasText(claim.consumer) &&
    input.sourceDecisionCount === 0
  ) {
    signals.push({
      kind: "accepted_claim_without_decision",
      severity: "warning",
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
