import type {
  ActivationCandidateKind,
  RankedActivationCandidate
} from "./types.js";
import {
  markExcluded
} from "./types.js";
import {
  canonicalCandidateKey
} from "./candidate-identity.js";

export interface ContextRoiPolicy {
  tokenBudget?: number;
  maxInclusions?: number;
  minimumScore?: number;
  minimumTaskRelevanceScore?: number;
  minimumTaskRelevanceRatio?: number;
  minimumDiverseKinds?: readonly ActivationCandidateKind[];
}

const taskRelevanceScore = (candidate: RankedActivationCandidate): number =>
  candidate.lexicalScore + candidate.vectorScore + candidate.contextRoiScore;

const isGovernedKnowledgeCandidate = (candidate: RankedActivationCandidate): boolean =>
  candidate.subjectType === "memory_record" || candidate.subjectType === "source_claim";

const strongestTaskRelevanceBySubjectType = (
  candidates: readonly RankedActivationCandidate[]
): ReadonlyMap<RankedActivationCandidate["subjectType"], number> => {
  const strongest = new Map<RankedActivationCandidate["subjectType"], number>();

  for (const candidate of candidates.filter(isGovernedKnowledgeCandidate)) {
    strongest.set(
      candidate.subjectType,
      Math.max(strongest.get(candidate.subjectType) ?? 0, taskRelevanceScore(candidate))
    );
  }

  return strongest;
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
  const strongestBySubjectType = strongestTaskRelevanceBySubjectType(selectable);
  const minimumTaskRelevance = (candidate: RankedActivationCandidate): number => Math.max(
    policy.minimumTaskRelevanceScore ?? 0,
    (strongestBySubjectType.get(candidate.subjectType) ?? 0) *
      (policy.minimumTaskRelevanceRatio ?? 0)
  );
  const isTaskRelevant = (candidate: RankedActivationCandidate): boolean =>
    !isGovernedKnowledgeCandidate(candidate) ||
    taskRelevanceScore(candidate) >= minimumTaskRelevance(candidate);
  const selectedIds = new Set<string>();
  let spentTokens = 0;

  for (const kind of policy.minimumDiverseKinds ?? []) {
    const candidate = selectable.find((item) =>
      item.kind === kind &&
      !selectedIds.has(item.id) &&
      item.totalScore >= minimumScore &&
      isTaskRelevant(item) &&
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
      isTaskRelevant(candidate) &&
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

    if (!isTaskRelevant(candidate)) {
      return markExcluded(candidate, {
        reason: "low_context_roi",
        explanation:
          `Candidate task relevance ${taskRelevanceScore(candidate)} is below ${minimumTaskRelevance(candidate)}.`
      });
    }

    return markExcluded(candidate, {
      reason: "over_budget",
      explanation: `Candidate exceeds max inclusion count ${maxInclusions} or token budget.`
    });
  });
};
