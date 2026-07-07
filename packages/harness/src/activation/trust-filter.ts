import type {
  SourceAuthorityLabel
} from "@krn/core";
import {
  rankSourceAuthority
} from "@krn/core";
import type {
  RankedActivationCandidate
} from "./types.js";
import {
  markExcluded
} from "./types.js";

export interface TrustFilterPolicy {
  minimumSourceAuthority: SourceAuthorityLabel;
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
      rankSourceAuthority(candidate.sourceAuthority) >=
      rankSourceAuthority(policy.minimumSourceAuthority)
    ) {
      return candidate;
    }

    return markExcluded(candidate, {
      reason: "low_trust",
      explanation: `Candidate source authority ${candidate.sourceAuthority} is below ${policy.minimumSourceAuthority}.`
    });
  });
