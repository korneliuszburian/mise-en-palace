import type {
  RankedActivationCandidate
} from "./types.js";
import {
  markExcluded,
  trustRank
} from "./types.js";

export interface TrustFilterPolicy {
  minimumTrustTier: "low" | "medium" | "high";
}

export const applyTrustFilter = (
  candidates: readonly RankedActivationCandidate[],
  policy: TrustFilterPolicy
): RankedActivationCandidate[] =>
  candidates.map((candidate) => {
    if (candidate.exclusion !== undefined) {
      return candidate;
    }

    if (trustRank[candidate.trustTier] >= trustRank[policy.minimumTrustTier]) {
      return candidate;
    }

    return markExcluded(candidate, {
      reason: "low_trust",
      explanation: `Candidate trust tier ${candidate.trustTier} is below ${policy.minimumTrustTier}.`
    });
  });
