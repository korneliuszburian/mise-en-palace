import type {
  ContextSubjectType,
  SourceClaimAuthorityReason,
  SourceClaimAuthorityState,
  SourceClaimAuthorityStatus,
  SourceClaimStatus
} from "@krn/core";
import {
  sourceClaimAuthorityStateFor
} from "@krn/core";

import type {
  ActivationExclusion
} from "./types.js";

export interface SourceClaimAuthorityCandidate {
  subjectType: ContextSubjectType;
  sourceClaimStatus?: SourceClaimStatus;
  sourceClaimAuthorityStatus?: SourceClaimAuthorityStatus;
  sourceClaimAuthorityReasons?: readonly SourceClaimAuthorityReason[];
}

const sourceClaimAuthorityExclusionReason = (
  state: SourceClaimAuthorityState
): ActivationExclusion["reason"] => {
  if (state === "stale") {
    return "stale";
  }

  return "unsafe";
};

const sourceClaimAuthorityCanActivate = (
  state: SourceClaimAuthorityState
): boolean => state === "accepted" || state === "conflicting";

const sourceClaimAuthorityReasonText = (
  reasons: readonly SourceClaimAuthorityReason[] | undefined
): string => {
  if (reasons === undefined || reasons.length === 0) {
    return "unknown_source_claim_authority";
  }

  return reasons.join(", ");
}

export const sourceClaimAuthorityExclusion = (
  candidate: SourceClaimAuthorityCandidate
): ActivationExclusion | undefined => {
  if (candidate.subjectType !== "source_claim") {
    return undefined;
  }

  if (candidate.sourceClaimAuthorityStatus !== undefined) {
    const state = sourceClaimAuthorityStateFor({
      status: candidate.sourceClaimAuthorityStatus,
      reasons: candidate.sourceClaimAuthorityReasons ?? []
    });

    if (
      sourceClaimAuthorityCanActivate(state) &&
      (candidate.sourceClaimStatus === undefined || candidate.sourceClaimStatus === "accepted")
    ) {
      return undefined;
    }

    if (candidate.sourceClaimStatus !== undefined && candidate.sourceClaimStatus !== "accepted") {
      return {
        reason: sourceClaimAuthorityExclusionReason(state),
        explanation:
          `Source claims require accepted authority state before activation; ${candidate.sourceClaimStatus} claims remain review candidates, not implementation authority. SourceClaim authority state ${state}: ${sourceClaimAuthorityReasonText(candidate.sourceClaimAuthorityReasons)}.`
      };
    }

    return {
      reason: sourceClaimAuthorityExclusionReason(state),
      explanation:
        `SourceClaim authority state ${state}: ${sourceClaimAuthorityReasonText(candidate.sourceClaimAuthorityReasons)}.`
    };
  }

  if (candidate.sourceClaimStatus === "accepted") {
    return undefined;
  }

  return {
    reason: "unsafe",
    explanation:
      `Source claims require accepted status before activation; ${candidate.sourceClaimStatus ?? "unknown"} claims remain review candidates, not implementation authority.`
  };
};
