import type {
  ContextSubjectType,
  SourceClaimAuthorityReason,
  SourceClaimAuthorityStatus,
  SourceClaimStatus
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
  status: SourceClaimAuthorityStatus
): ActivationExclusion["reason"] => {
  if (status === "stale") {
    return "stale";
  }

  return "unsafe";
};

const sourceClaimAuthorityCanActivate = (
  status: SourceClaimAuthorityStatus
): boolean => status === "accepted" || status === "caveated" || status === "evidence_gap";

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
    if (sourceClaimAuthorityCanActivate(candidate.sourceClaimAuthorityStatus)) {
      return undefined;
    }

    if (candidate.sourceClaimStatus !== undefined && candidate.sourceClaimStatus !== "accepted") {
      return {
        reason: sourceClaimAuthorityExclusionReason(candidate.sourceClaimAuthorityStatus),
        explanation:
          `Source claims require accepted status before activation; ${candidate.sourceClaimStatus} claims remain review candidates, not implementation authority. SourceClaim authority status ${candidate.sourceClaimAuthorityStatus}: ${sourceClaimAuthorityReasonText(candidate.sourceClaimAuthorityReasons)}.`
      };
    }

    return {
      reason: sourceClaimAuthorityExclusionReason(candidate.sourceClaimAuthorityStatus),
      explanation:
        `SourceClaim authority status ${candidate.sourceClaimAuthorityStatus}: ${sourceClaimAuthorityReasonText(candidate.sourceClaimAuthorityReasons)}.`
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
