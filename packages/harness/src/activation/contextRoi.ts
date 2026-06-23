import type {
  ActivationCandidateKind,
  RankedActivationCandidate
} from "./types.js";
import {
  markExcluded
} from "./types.js";

export interface ContextRoiPolicy {
  tokenBudget?: number;
  maxInclusions?: number;
  minimumScore?: number;
  minimumDiverseKinds?: readonly ActivationCandidateKind[];
}

const canonicalCandidateKey = (candidate: RankedActivationCandidate): string => {
  if (candidate.sourceClaimId !== undefined) {
    return `source_claim:${candidate.sourceClaimId}`;
  }

  if (candidate.memoryRecordId !== undefined) {
    return `memory_record:${candidate.memoryRecordId}`;
  }

  return `${candidate.subjectType}:${candidate.subjectId}`;
};

const canInclude = (
  candidate: RankedActivationCandidate,
  selectedCount: number,
  spentTokens: number,
  maxInclusions: number,
  tokenBudget: number | undefined
): boolean => {
  if (selectedCount >= maxInclusions) {
    return false;
  }

  return tokenBudget === undefined || spentTokens + candidate.tokenEstimate <= tokenBudget;
};

export const applyContextROI = (
  candidates: readonly RankedActivationCandidate[],
  policy: ContextRoiPolicy
): RankedActivationCandidate[] => {
  const maxInclusions = policy.maxInclusions ?? candidates.length;
  const minimumScore = policy.minimumScore ?? 25;
  const ordered = [...candidates].sort((left, right) => right.totalScore - left.totalScore);
  const seenKeys = new Set<string>();
  const deduped = ordered.map((candidate) => {
    if (candidate.exclusion !== undefined) {
      return candidate;
    }

    const key = canonicalCandidateKey(candidate);

    if (seenKeys.has(key)) {
      return markExcluded(candidate, {
        reason: "duplicate",
        explanation: `Candidate duplicates already selected context subject ${key}.`
      });
    }

    seenKeys.add(key);
    return candidate;
  });
  const selectable = deduped.filter((candidate) => candidate.exclusion === undefined);
  const selectedIds = new Set<string>();
  let spentTokens = 0;

  for (const kind of policy.minimumDiverseKinds ?? []) {
    const candidate = selectable.find((item) =>
      item.kind === kind &&
      !selectedIds.has(item.id) &&
      item.totalScore >= minimumScore &&
      canInclude(item, selectedIds.size, spentTokens, maxInclusions, policy.tokenBudget)
    );

    if (candidate !== undefined) {
      selectedIds.add(candidate.id);
      spentTokens += candidate.tokenEstimate;
    }
  }

  for (const candidate of selectable) {
    if (selectedIds.has(candidate.id)) {
      continue;
    }

    if (
      candidate.totalScore >= minimumScore &&
      canInclude(candidate, selectedIds.size, spentTokens, maxInclusions, policy.tokenBudget)
    ) {
      selectedIds.add(candidate.id);
      spentTokens += candidate.tokenEstimate;
    }
  }

  return deduped.map((candidate) => {
    if (candidate.exclusion !== undefined || selectedIds.has(candidate.id)) {
      return candidate;
    }

    if (candidate.totalScore < minimumScore) {
      return markExcluded(candidate, {
        reason: "low_context_roi",
        explanation: `Candidate score ${candidate.totalScore} is below ${minimumScore}.`
      });
    }

    return markExcluded(candidate, {
      reason: "over_budget",
      explanation: `Candidate exceeds max inclusion count ${maxInclusions} or token budget.`
    });
  });
};
