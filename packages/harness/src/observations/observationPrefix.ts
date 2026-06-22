import type {
  ObservationConfidence,
  ObservationItem,
  ObservationPriority,
  ObservationStatus,
  ProjectId,
  TaskContract
} from "@krn/core";

export type ObservationPrefixExclusionReason =
  | "project_mismatch"
  | "invalidated"
  | "stale"
  | "low_relevance"
  | "budget_exceeded";

export interface ObservationPrefixItem {
  observationId: string;
  kind: ObservationItem["kind"];
  confidence: ObservationConfidence;
  priority: ObservationPriority;
  summary: string;
  reason: string;
  score: number;
}

export interface ObservationPrefixExclusion {
  observationId: string;
  reason: ObservationPrefixExclusionReason;
  explanation: string;
}

export interface ObservationPrefixWarning {
  observationId: string;
  warning: "contested" | "conflict" | "gap";
  summary: string;
}

export interface SelectObservationPrefixInput {
  task: TaskContract;
  projectId: ProjectId;
  observations: readonly ObservationItem[];
  maxItems?: number;
  now: string;
}

export interface ObservationPrefix {
  projectId: ProjectId;
  taskContractId: string;
  text: string;
  items: ObservationPrefixItem[];
  exclusions: ObservationPrefixExclusion[];
  warnings: ObservationPrefixWarning[];
}

const defaultMaxItems = 5;
const invalidStatuses = new Set<ObservationStatus>([
  "deprecated",
  "invalidated",
  "superseded"
]);

const priorityScore = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3
} as const satisfies Record<ObservationPriority, number>;

const confidenceScore = {
  low: 0,
  medium: 1,
  high: 2
} as const satisfies Record<ObservationConfidence, number>;

const tokenize = (text: string): string[] => (
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((term) => term.length >= 3)
);

const taskTerms = (task: TaskContract): Set<string> => new Set(tokenize([
  task.title,
  task.objective,
  ...task.constraints,
  ...task.nonGoals,
  ...task.acceptance
].join(" ")));

const observationText = (observation: ObservationItem): string => [
  observation.subject,
  observation.summary,
  observation.body
].join(" ");

const matchedTerms = (
  terms: ReadonlySet<string>,
  observation: ObservationItem
): string[] => {
  const observedTerms = new Set(tokenize(observationText(observation)));

  return [...terms].filter((term) => observedTerms.has(term)).sort();
};

const isStale = (observation: ObservationItem, now: string): boolean => {
  const validUntil = observation.temporalScope.validUntil;

  return validUntil !== undefined && validUntil < now;
};

const warningFor = (observation: ObservationItem): ObservationPrefixWarning | undefined => {
  if (observation.status === "contested") {
    return {
      observationId: observation.id,
      warning: "contested",
      summary: observation.summary
    };
  }

  if (observation.kind === "conflict" || observation.kind === "gap") {
    return {
      observationId: observation.id,
      warning: observation.kind,
      summary: observation.summary
    };
  }

  return undefined;
};

const prefixText = (items: readonly ObservationPrefixItem[]): string => {
  if (items.length === 0) {
    return "Observation prefix: abstain; no active relevant observations selected.";
  }

  return [
    "Observation prefix:",
    ...items.map((item) =>
      `- [${item.confidence}/${item.priority}] ${item.summary} (${item.reason})`)
  ].join("\n");
};

export const selectObservationPrefix = (
  input: SelectObservationPrefixInput
): ObservationPrefix => {
  const terms = taskTerms(input.task);
  const maxItems = input.maxItems ?? defaultMaxItems;
  const exclusions: ObservationPrefixExclusion[] = [];
  const candidates: Array<{
    observation: ObservationItem;
    matches: string[];
    score: number;
  }> = [];

  for (const observation of input.observations) {
    if (observation.scope.projectId === undefined) {
      exclusions.push({
        observationId: observation.id,
        reason: "project_mismatch",
        explanation: "Observation is unscoped and cannot enter a project-scoped prefix."
      });
      continue;
    }

    if (observation.scope.projectId !== input.projectId) {
      exclusions.push({
        observationId: observation.id,
        reason: "project_mismatch",
        explanation: `Observation belongs to project ${observation.scope.projectId}.`
      });
      continue;
    }

    if (invalidStatuses.has(observation.status)) {
      exclusions.push({
        observationId: observation.id,
        reason: "invalidated",
        explanation: `Observation status is ${observation.status}.`
      });
      continue;
    }

    if (isStale(observation, input.now)) {
      exclusions.push({
        observationId: observation.id,
        reason: "stale",
        explanation: `Observation expired at ${observation.temporalScope.validUntil}.`
      });
      continue;
    }

    const matches = matchedTerms(terms, observation);
    if (matches.length === 0) {
      exclusions.push({
        observationId: observation.id,
        reason: "low_relevance",
        explanation: "Observation did not match task terms; priority/confidence alone cannot activate it."
      });
      continue;
    }

    const score =
      matches.length * 3 +
      priorityScore[observation.priority] +
      confidenceScore[observation.confidence];

    candidates.push({
      observation,
      matches,
      score
    });
  }

  candidates.sort((left, right) => (
    right.score - left.score ||
    priorityScore[right.observation.priority] - priorityScore[left.observation.priority] ||
    confidenceScore[right.observation.confidence] - confidenceScore[left.observation.confidence] ||
    left.observation.id.localeCompare(right.observation.id)
  ));

  const selected = candidates.slice(0, maxItems);
  const overflow = candidates.slice(maxItems);

  for (const candidate of overflow) {
    exclusions.push({
      observationId: candidate.observation.id,
      reason: "budget_exceeded",
      explanation: "Observation was relevant but outside the observation prefix budget."
    });
  }

  const items = selected.map((candidate): ObservationPrefixItem => ({
    observationId: candidate.observation.id,
    kind: candidate.observation.kind,
    confidence: candidate.observation.confidence,
    priority: candidate.observation.priority,
    summary: candidate.observation.summary,
    reason: `matched task terms: ${candidate.matches.join(", ")}`,
    score: candidate.score
  }));
  const warnings = selected
    .map((candidate) => warningFor(candidate.observation))
    .filter((warning): warning is ObservationPrefixWarning => warning !== undefined);

  return {
    projectId: input.projectId,
    taskContractId: input.task.id,
    text: prefixText(items),
    items,
    exclusions,
    warnings
  };
};
