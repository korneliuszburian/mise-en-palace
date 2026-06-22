import type {
  RankedActivationCandidate
} from "./types.js";
import {
  markExcluded
} from "./types.js";

export interface ContextRoiPolicy {
  tokenBudget?: number;
  maxInclusions?: number;
  minimumScore?: number;
}

export const applyContextROI = (
  candidates: readonly RankedActivationCandidate[],
  policy: ContextRoiPolicy
): RankedActivationCandidate[] => {
  const maxInclusions = policy.maxInclusions ?? candidates.length;
  const minimumScore = policy.minimumScore ?? 25;
  let included = 0;
  let spentTokens = 0;

  return [...candidates]
    .sort((left, right) => right.totalScore - left.totalScore)
    .map((candidate) => {
      if (candidate.exclusion !== undefined) {
        return candidate;
      }

      if (candidate.totalScore < minimumScore) {
        return markExcluded(candidate, {
          reason: "low_context_roi",
          explanation: `Candidate score ${candidate.totalScore} is below ${minimumScore}.`
        });
      }

      if (included >= maxInclusions) {
        return markExcluded(candidate, {
          reason: "over_budget",
          explanation: `Candidate exceeds max inclusion count ${maxInclusions}.`
        });
      }

      if (
        policy.tokenBudget !== undefined &&
        spentTokens + candidate.tokenEstimate > policy.tokenBudget
      ) {
        return markExcluded(candidate, {
          reason: "over_budget",
          explanation: `Candidate would exceed token budget ${policy.tokenBudget}.`
        });
      }

      included += 1;
      spentTokens += candidate.tokenEstimate;
      return candidate;
    });
};

export const scoreContextROI = applyContextROI;
