import type {
  ContextAssembly,
  ContextExclusion,
  ContextInclusion
} from "@krn/core";

import type {
  AssembleContextInput,
  RankedActivationCandidate
} from "./types.js";
import {
  markExcluded
} from "./types.js";

const enforceSourceClaimSafety = (
  candidate: RankedActivationCandidate
): RankedActivationCandidate => {
  if (candidate.exclusion !== undefined || candidate.subjectType !== "source_claim") {
    return candidate;
  }

  if (candidate.doesNotProve !== undefined && candidate.doesNotProve.trim().length > 0) {
    return candidate;
  }

  return markExcluded(candidate, {
    reason: "unsafe",
    explanation: "Source claims require doesNotProve before activation."
  });
};

const toInclusion = (candidate: RankedActivationCandidate): ContextInclusion => ({
  subjectType: candidate.subjectType,
  subjectId: candidate.subjectId,
  reason: candidate.reason,
  expectedUse: candidate.expectedUse,
  tokenEstimate: candidate.tokenEstimate,
  trustTier: candidate.trustTier
});

const toExclusion = (candidate: RankedActivationCandidate): ContextExclusion | undefined => {
  if (candidate.exclusion === undefined) {
    return undefined;
  }

  return {
    subjectType: candidate.subjectType,
    subjectId: candidate.subjectId,
    reason: candidate.exclusion.reason,
    explanation: candidate.exclusion.explanation,
    score: candidate.totalScore,
    trustTier: candidate.trustTier
  };
};

export const assembleContext = (input: AssembleContextInput): ContextAssembly => {
  const candidates = input.candidates.map(enforceSourceClaimSafety);
  const inclusions = candidates
    .filter((candidate) => candidate.exclusion === undefined)
    .sort((left, right) => right.totalScore - left.totalScore)
    .map(toInclusion);
  const exclusions = candidates
    .map(toExclusion)
    .filter((exclusion): exclusion is ContextExclusion => exclusion !== undefined);

  return {
    id: input.id,
    harnessPlanId: input.harnessPlanId,
    status: inclusions.length === 0 ? "abstained" : "assembled",
    ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
    inclusions,
    exclusions,
    metadata: input.metadata ?? {},
    createdAt: input.createdAt
  };
};
