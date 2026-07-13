import type {
  SourceClaimId,
  SourceDecisionId
} from "./ids.js";
import { assessSourceClaimTemporalValidity } from "./source-authority.js";
import {
  isDecisionGradeSourceSupportType,
  type SourceClaim,
  type SourceClaimStatus,
  type SourceDecision
} from "./source-model.js";
import { hasSourceText } from "./source-text.js";
import type { IsoTimestamp } from "./time.js";

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
    !hasSourceText(claim.mechanism) ||
    !hasSourceText(claim.krnImplication) ||
    !hasSourceText(claim.doesNotProve) ||
    !hasSourceText(claim.consumer) ||
    !hasSourceText(claim.falsifier)
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

    if (temporalValidity.status === "invalid") {
      signals.push({
        kind: "invalid_source_claim_time",
        severity: "blocking",
        sourceClaimId: claim.id,
        reason:
          "Accepted SourceClaim has invalid temporal metadata and cannot be used as current authority."
      });
    }

    if (temporalValidity.status === "historical") {
      signals.push({
        kind: "stale_accepted_claim",
        severity: "warning",
        sourceClaimId: claim.id,
        reason:
          "Accepted SourceClaim is outside its current temporal window and needs refresh, deprecation, or replacement before continued use."
      });
    }
  }

  if (
    claim.status === "accepted" &&
    hasSourceText(claim.consumer) &&
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
    !hasSourceText(decision.sourceClaimId)
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
    !hasSourceText(decision.decision) ||
    !hasSourceText(decision.rationale) ||
    !hasSourceText(decision.falsifier) ||
    !hasSourceText(decision.consumer)
  ) {
    signals.push({
      kind: "missing_decision_fields",
      severity: "blocking",
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
