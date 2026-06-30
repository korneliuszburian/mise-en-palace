import type {
  AntiMemoryRecord,
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
  | "anti_memory"
  | "budget_exceeded";

export interface ObservationPrefixItem {
  observationId: string;
  kind: ObservationItem["kind"];
  confidence: ObservationConfidence;
  priority: ObservationPriority;
  summary: string;
  sourceRangeCount: number;
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
  antiMemoryRecords?: readonly AntiMemoryRecord[];
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

interface ObservationPrefixCandidate {
  observation: ObservationItem;
  matches: string[];
  score: number;
}

interface ObservationPrefixSelectionContext {
  projectId: ProjectId;
  terms: ReadonlySet<string>;
  antiMemoryRecords: readonly AntiMemoryRecord[];
  now: string;
}

type ObservationPrefixSelection =
  | {
    kind: "candidate";
    candidate: ObservationPrefixCandidate;
  }
  | {
    kind: "exclusion";
    exclusion: ObservationPrefixExclusion;
  };

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

const epochMs = (timestamp: string): number | undefined => {
  const parsed = Date.parse(timestamp);

  return Number.isNaN(parsed) ? undefined : parsed;
};

const isStale = (observation: ObservationItem, now: string): boolean => {
  const validUntil = observation.temporalScope.validUntil;

  if (validUntil === undefined) {
    return false;
  }

  const validUntilEpoch = epochMs(validUntil);
  const nowEpoch = epochMs(now);

  if (validUntilEpoch === undefined || nowEpoch === undefined) {
    return true;
  }

  return validUntilEpoch < nowEpoch;
};

const antiMemoryTargetsObservation = (
  antiMemory: AntiMemoryRecord,
  observation: ObservationItem
): boolean => {
  const appliesTo = antiMemory.appliesTo?.trim();

  return (
    antiMemory.key === observation.id ||
    antiMemory.key === observation.subject ||
    appliesTo === observation.id ||
    appliesTo === observation.subject
  );
};

const antiMemoryForObservation = (
  antiMemoryRecords: readonly AntiMemoryRecord[],
  observation: ObservationItem
): AntiMemoryRecord | undefined =>
  antiMemoryRecords.find((antiMemory) =>
    antiMemoryTargetsObservation(antiMemory, observation)
  );

const excludedObservation = (
  observation: ObservationItem,
  reason: ObservationPrefixExclusionReason,
  explanation: string
): ObservationPrefixExclusion => ({
  observationId: observation.id,
  reason,
  explanation
});

const projectScopeExclusion = (
  projectId: ProjectId,
  observation: ObservationItem
): ObservationPrefixExclusion | undefined => {
  if (observation.scope.projectId === undefined) {
    return excludedObservation(
      observation,
      "project_mismatch",
      "Observation is unscoped and cannot enter a project-scoped prefix."
    );
  }

  if (observation.scope.projectId !== projectId) {
    return excludedObservation(
      observation,
      "project_mismatch",
      `Observation belongs to project ${observation.scope.projectId}.`
    );
  }

  return undefined;
};

const lifecycleExclusion = (
  observation: ObservationItem,
  now: string
): ObservationPrefixExclusion | undefined => {
  if (invalidStatuses.has(observation.status)) {
    return excludedObservation(
      observation,
      "invalidated",
      `Observation status is ${observation.status}.`
    );
  }

  if (isStale(observation, now)) {
    return excludedObservation(
      observation,
      "stale",
      `Observation expired at ${observation.temporalScope.validUntil}.`
    );
  }

  return undefined;
};

const antiMemoryExclusion = (
  antiMemoryRecords: readonly AntiMemoryRecord[],
  observation: ObservationItem
): ObservationPrefixExclusion | undefined => {
  const antiMemory = antiMemoryForObservation(antiMemoryRecords, observation);

  if (antiMemory === undefined) {
    return undefined;
  }

  return excludedObservation(
    observation,
    "anti_memory",
    `Blocked by anti-memory ${antiMemory.id}: ${antiMemory.reason ?? antiMemory.summary}`
  );
};

const scoreObservationPrefixCandidate = (
  observation: ObservationItem,
  matches: readonly string[]
): number => (
  matches.length * 3 +
  priorityScore[observation.priority] +
  confidenceScore[observation.confidence]
);

const relevantCandidate = (
  terms: ReadonlySet<string>,
  observation: ObservationItem
): ObservationPrefixSelection => {
  const matches = matchedTerms(terms, observation);

  if (matches.length === 0) {
    return {
      kind: "exclusion",
      exclusion: excludedObservation(
        observation,
        "low_relevance",
        "Observation did not match task terms; priority/confidence alone cannot activate it."
      )
    };
  }

  return {
    kind: "candidate",
    candidate: {
      observation,
      matches,
      score: scoreObservationPrefixCandidate(observation, matches)
    }
  };
};

const selectObservationCandidate = (
  context: ObservationPrefixSelectionContext,
  observation: ObservationItem
): ObservationPrefixSelection => {
  const exclusion =
    projectScopeExclusion(context.projectId, observation) ??
    lifecycleExclusion(observation, context.now) ??
    antiMemoryExclusion(context.antiMemoryRecords, observation);

  if (exclusion !== undefined) {
    return {
      kind: "exclusion",
      exclusion
    };
  }

  return relevantCandidate(context.terms, observation);
};

const compareObservationPrefixCandidates = (
  left: ObservationPrefixCandidate,
  right: ObservationPrefixCandidate
): number => (
  right.score - left.score ||
  priorityScore[right.observation.priority] - priorityScore[left.observation.priority] ||
  confidenceScore[right.observation.confidence] - confidenceScore[left.observation.confidence] ||
  left.observation.id.localeCompare(right.observation.id)
);

const budgetExceededExclusion = (
  candidate: ObservationPrefixCandidate
): ObservationPrefixExclusion => excludedObservation(
  candidate.observation,
  "budget_exceeded",
  "Observation was relevant but outside the observation prefix budget."
);

const prefixItemForCandidate = (
  candidate: ObservationPrefixCandidate
): ObservationPrefixItem => ({
  observationId: candidate.observation.id,
  kind: candidate.observation.kind,
  confidence: candidate.observation.confidence,
  priority: candidate.observation.priority,
  summary: candidate.observation.summary,
  sourceRangeCount: candidate.observation.sourceRanges.length,
  reason: `matched task terms: ${candidate.matches.join(", ")}`,
  score: candidate.score
});

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
  const antiMemoryRecords = input.antiMemoryRecords ?? [];
  const exclusions: ObservationPrefixExclusion[] = [];
  const candidates: ObservationPrefixCandidate[] = [];
  const context: ObservationPrefixSelectionContext = {
    projectId: input.projectId,
    terms,
    antiMemoryRecords,
    now: input.now
  };

  for (const observation of input.observations) {
    const selection = selectObservationCandidate(context, observation);
    if (selection.kind === "exclusion") {
      exclusions.push(selection.exclusion);
      continue;
    }

    candidates.push(selection.candidate);
  }

  candidates.sort(compareObservationPrefixCandidates);

  const selected = candidates.slice(0, maxItems);
  const overflow = candidates.slice(maxItems);

  for (const candidate of overflow) {
    exclusions.push(budgetExceededExclusion(candidate));
  }

  const items = selected.map(prefixItemForCandidate);
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
