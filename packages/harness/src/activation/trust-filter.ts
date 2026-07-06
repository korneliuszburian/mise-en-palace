import type {
  SourceTrustTier
} from "@krn/core";
import {
  rankSourceTrustTier
} from "@krn/core";
import type {
  RankedActivationCandidate
} from "./types.js";
import {
  markExcluded
} from "./types.js";

export interface TrustFilterPolicy {
  minimumTrustTier: SourceTrustTier;
}

export const applyTrustFilter = (
  candidates: readonly RankedActivationCandidate[],
  policy: TrustFilterPolicy
): RankedActivationCandidate[] =>
  candidates.map((candidate) => {
    if (candidate.exclusion !== undefined) {
      return candidate;
    }

    if (
      rankSourceTrustTier(candidate.trustTier) >=
      rankSourceTrustTier(policy.minimumTrustTier)
    ) {
      return candidate;
    }

    return markExcluded(candidate, {
      reason: "low_trust",
      explanation: `Candidate trust tier ${candidate.trustTier} is below ${policy.minimumTrustTier}.`
    });
  });
