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
import { tokenizeActivationText } from "./memory-query.js";

export interface ContextRoiPolicy {
  tokenBudget?: number;
  maxInclusions?: number;
  minimumScore?: number;
  minimumTaskRelevanceScore?: number;
  minimumTaskRelevanceRatio?: number;
  minimumDiverseKinds?: readonly ActivationCandidateKind[];
  preserveApplicableTaskConcernCoverage?: boolean;
}

const taskRelevanceScore = (candidate: RankedActivationCandidate): number =>
  candidate.lexicalScore + candidate.vectorScore + candidate.contextRoiScore;

const isGovernedKnowledgeCandidate = (candidate: RankedActivationCandidate): boolean =>
  candidate.subjectType === "memory_record" || candidate.subjectType === "source_claim";

const metadataStrings = (
  candidate: RankedActivationCandidate,
  key: string
): readonly string[] => {
  const value = candidate.metadata[key];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
};

const applicableTaskConcerns = (candidate: RankedActivationCandidate): readonly string[] => {
  const activationQueryTerms = metadataStrings(candidate, "activationQueryTerms");
  const matchedTerms = new Set(
    activationQueryTerms.length === 0
      ? metadataStrings(candidate, "matchedQueryTerms")
      : activationQueryTerms
  );

  const genericScopeTerms = new Set(["component", "components", "engineering", "frontend", "task"]);

  const matchedScopes = metadataStrings(candidate, "taskScopes").filter((scope) => {
    const scopeTerms = tokenizeActivationText(scope);
    const discriminatingTerms = scopeTerms.filter((term) => !genericScopeTerms.has(term));

    return discriminatingTerms.length > 0 &&
      discriminatingTerms.every((term) => matchedTerms.has(term));
  });
  const taskConcerns = metadataStrings(candidate, "taskConcerns");

  return matchedScopes.length === 0
    ? []
    : taskConcerns.length === 0
      ? matchedScopes
      : taskConcerns;
};

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

const selectConcernCoverage = (input: {
  candidates: readonly RankedActivationCandidate[];
  selectedIds: Set<string>;
  spentTokens: number;
  minimumScore: number;
  maxInclusions: number;
  tokenBudget?: number;
  minimumTaskRelevanceScore: number;
  isTaskRelevant: (candidate: RankedActivationCandidate) => boolean;
}): number => {
  const coveredConcerns = new Set<string>();
  let spentTokens = input.spentTokens;

  for (const candidate of input.candidates) {
    const concerns = applicableTaskConcerns(candidate);
    const addsCoverage = concerns.some((concern) => !coveredConcerns.has(concern));
    const clearsRelevanceFloor = taskRelevanceScore(candidate) >= input.minimumTaskRelevanceScore;
    if (!addsCoverage || candidate.totalScore < input.minimumScore) continue;
    if (!input.isTaskRelevant(candidate) && !clearsRelevanceFloor) continue;
    if (!canInclude(candidate, input.selectedIds.size, spentTokens, input.maxInclusions, input.tokenBudget)) continue;

    input.selectedIds.add(candidate.id);
    spentTokens += candidate.tokenEstimate;
    concerns.forEach((concern) => coveredConcerns.add(concern));
  }

  return spentTokens;
};

const dedupeCandidates = (
  candidates: readonly RankedActivationCandidate[]
): RankedActivationCandidate[] => {
  const seenKeys = new Set<string>();
  return [...candidates]
    .sort((left, right) => right.totalScore - left.totalScore)
    .map((candidate) => {
      if (candidate.exclusion !== undefined) return candidate;
      const key = canonicalCandidateKey(candidate);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        return candidate;
      }
      return markExcluded(candidate, {
        reason: "duplicate",
        explanation: `Candidate duplicates already selected context subject ${key}.`
      });
    });
};

type SelectionState = {
  readonly selectedIds: Set<string>;
  spentTokens: number;
};

const selectCandidates = (input: {
  candidates: readonly RankedActivationCandidate[];
  state: SelectionState;
  predicate: (candidate: RankedActivationCandidate) => boolean;
  maxInclusions: number;
  tokenBudget?: number;
}): void => {
  for (const candidate of input.candidates) {
    if (input.state.selectedIds.has(candidate.id) || !input.predicate(candidate)) continue;
    if (!canInclude(candidate, input.state.selectedIds.size, input.state.spentTokens, input.maxInclusions, input.tokenBudget)) continue;
    input.state.selectedIds.add(candidate.id);
    input.state.spentTokens += candidate.tokenEstimate;
  }
};

const excludedCandidate = (input: {
  candidate: RankedActivationCandidate;
  selectedIds: ReadonlySet<string>;
  minimumScore: number;
  maxInclusions: number;
  isTaskRelevant: (candidate: RankedActivationCandidate) => boolean;
  minimumTaskRelevance: (candidate: RankedActivationCandidate) => number;
}): RankedActivationCandidate => {
  const { candidate } = input;
  if (candidate.exclusion !== undefined || input.selectedIds.has(candidate.id)) return candidate;
  if (candidate.totalScore < input.minimumScore) {
    return markExcluded(candidate, {
      reason: "low_context_roi",
      explanation: `Candidate score ${candidate.totalScore} is below ${input.minimumScore}.`
    });
  }
  if (!input.isTaskRelevant(candidate)) {
    return markExcluded(candidate, {
      reason: "low_context_roi",
      explanation: `Candidate task relevance ${taskRelevanceScore(candidate)} is below ${input.minimumTaskRelevance(candidate)}.`
    });
  }
  return markExcluded(candidate, {
    reason: "over_budget",
    explanation: `Candidate exceeds max inclusion count ${input.maxInclusions} or token budget.`
  });
};

export const applyContextROI = (
  candidates: readonly RankedActivationCandidate[],
  policy: ContextRoiPolicy
): RankedActivationCandidate[] => {
  const maxInclusions = policy.maxInclusions ?? candidates.length;
  const minimumScore = policy.minimumScore ?? 25;
  const deduped = dedupeCandidates(candidates);
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
  const state: SelectionState = { selectedIds: new Set<string>(), spentTokens: 0 };

  for (const kind of policy.minimumDiverseKinds ?? []) selectCandidates({
    candidates: selectable.filter((candidate) => candidate.kind === kind).slice(0, 1),
    state,
    predicate: (candidate) => candidate.totalScore >= minimumScore && isTaskRelevant(candidate),
    maxInclusions,
    ...(policy.tokenBudget === undefined ? {} : { tokenBudget: policy.tokenBudget })
  });

  if (policy.preserveApplicableTaskConcernCoverage === true) {
    state.spentTokens = selectConcernCoverage({
      candidates: selectable,
      selectedIds: state.selectedIds,
      spentTokens: state.spentTokens,
      minimumScore,
      maxInclusions,
      ...(policy.tokenBudget === undefined ? {} : { tokenBudget: policy.tokenBudget }),
      minimumTaskRelevanceScore: policy.minimumTaskRelevanceScore ?? 0,
      isTaskRelevant
    });
  }

  selectCandidates({
    candidates: selectable,
    state,
    predicate: (candidate) => candidate.totalScore >= minimumScore && isTaskRelevant(candidate),
    maxInclusions,
    ...(policy.tokenBudget === undefined ? {} : { tokenBudget: policy.tokenBudget })
  });

  return deduped.map((candidate) => excludedCandidate({
    candidate,
    selectedIds: state.selectedIds,
    minimumScore,
    maxInclusions,
    isTaskRelevant,
    minimumTaskRelevance
  }));
};
