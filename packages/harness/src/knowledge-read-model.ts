export const knowledgeKindValues = [
  "source_claim",
  "source_decision",
  "procedure",
  "memory",
  "memory_candidate",
  "anti_memory_candidate",
  "eval_candidate",
  "adr",
  "standard",
  "skill",
  "run_evidence"
] as const;

export type KnowledgeKind = typeof knowledgeKindValues[number];

export const knowledgeStatusValues = [
  "active",
  "candidate",
  "accepted",
  "rejected",
  "deferred",
  "stale",
  "superseded",
  "unknown"
] as const;

export type KnowledgeStatus = typeof knowledgeStatusValues[number];

export type KnowledgeConfidence = "high" | "medium" | "low" | "unknown";

export const knowledgeReviewabilityValues = [
  "ready",
  "needs_more_evidence",
  "too_vague",
  "duplicate",
  "not_useful",
  "unknown"
] as const;

export type KnowledgeReviewability = typeof knowledgeReviewabilityValues[number];

export type KnowledgeTemporal =
  | {
      kind: "current";
      observedAt?: string;
    }
  | {
      kind: "historical";
      validFrom?: string;
      validUntil?: string;
      observedAt?: string;
    }
  | {
      kind: "unknown";
    };

export type KnowledgeDissent =
  | {
      kind: "none";
    }
  | {
      kind: "conflict";
      refs: string[];
      summary: string;
    }
  | {
      kind: "unknown";
    };

export const knowledgeNextActionValues = [
  "use",
  "review",
  "promote",
  "demote",
  "invalidate",
  "add_evidence",
  "reject",
  "defer",
  "unknown"
] as const;

export type KnowledgeNextAction = typeof knowledgeNextActionValues[number];

export const knowledgeUsefulnessOutcomeValues = [
  "selected",
  "used",
  "helped",
  "neutral",
  "noise",
  "stale",
  "hurt",
  "rejected",
  "unknown"
] as const;

export type KnowledgeUsefulnessOutcome =
  typeof knowledgeUsefulnessOutcomeValues[number];

export type KnowledgeUsefulnessOutcomeFilter =
  | KnowledgeUsefulnessOutcome
  | "none";

export const knowledgeUsefulnessOutcomeFilterValues = [
  ...knowledgeUsefulnessOutcomeValues,
  "none"
] as const satisfies readonly KnowledgeUsefulnessOutcomeFilter[];

export type KnowledgeUsefulnessFeedback = {
  knowledgeId: string;
  outcome: KnowledgeUsefulnessOutcome;
  summary: string;
  evidenceRefs: string[];
  doesNotProve: string;
  observedAt?: string;
};

export type KnowledgeReadModel = {
  id: string;
  kind: KnowledgeKind;
  status: KnowledgeStatus;
  title: string;
  summary: string;
  mechanism?: string;
  krnImplication?: string;
  confidence: KnowledgeConfidence;
  reviewability: KnowledgeReviewability;
  sourceRefs: string[];
  evidenceRefs: string[];
  consumers: string[];
  falsifier: string;
  doesNotProve: string;
  temporal: KnowledgeTemporal;
  dissent: KnowledgeDissent;
  nextAction: KnowledgeNextAction;
  usefulnessFeedback?: KnowledgeUsefulnessFeedback;
};

export type KnowledgeSearchFilter = {
  kind?: KnowledgeKind;
  status?: KnowledgeStatus;
  reviewability?: KnowledgeReviewability;
  usefulnessOutcome?: KnowledgeUsefulnessOutcomeFilter;
  text?: string;
};

export type KnowledgeDecisionStatus =
  | "adopt_now"
  | "lab"
  | "later"
  | "reject";

export type KnowledgeDecision = {
  knowledgeId: string;
  name: string;
  decisionStatus: KnowledgeDecisionStatus;
  confidence: KnowledgeConfidence;
  reviewability: KnowledgeReviewability;
  decision: string;
  mechanism?: string;
  krnImplication?: string;
  sourceRefs: string[];
  evidenceRefs: string[];
  consumers: string[];
  falsifier: string;
  doesNotProve: string;
  observedAt?: string;
  nextAction: KnowledgeNextAction;
};

type KnowledgeReadModelRequiredFields = Omit<
  KnowledgeReadModel,
  "usefulnessFeedback" | "mechanism" | "krnImplication"
>;

type KnowledgeDecisionRequiredFields = Omit<
  KnowledgeDecision,
  "observedAt" | "mechanism" | "krnImplication"
>;

type KnowledgeEvidenceBoundaryFields = Pick<
  KnowledgeReadModelRequiredFields,
  "reviewability" | "sourceRefs" | "evidenceRefs" | "consumers" | "falsifier" | "doesNotProve"
>;

type FieldParsers<T extends object> = {
  [Key in keyof T]-?: (record: Record<string, unknown>) => T[Key] | undefined;
};

type KnowledgeSearchRuntimeFilter = {
  kind?: KnowledgeKind;
  status?: KnowledgeStatus;
  reviewability?: KnowledgeReviewability;
  usefulnessOutcome?: KnowledgeUsefulnessOutcomeFilter;
  text?: string;
  textTokens: string[];
};

const knowledgeKinds = new Set<string>(knowledgeKindValues);

const knowledgeStatuses = new Set<string>(knowledgeStatusValues);

const knowledgeConfidences = new Set<string>([
  "high",
  "medium",
  "low",
  "unknown"
]);

const knowledgeReviewabilities = new Set<string>(
  knowledgeReviewabilityValues
);

const knowledgeNextActions = new Set<string>(
  knowledgeNextActionValues
);

const knowledgeUsefulnessOutcomes = new Set<string>(
  knowledgeUsefulnessOutcomeValues
);

const knowledgeDecisionStatuses = new Set<string>([
  "adopt_now",
  "lab",
  "later",
  "reject"
]);

const isKnowledgeKind = (value: unknown): value is KnowledgeKind =>
  typeof value === "string" && knowledgeKinds.has(value);

const isKnowledgeStatus = (value: unknown): value is KnowledgeStatus =>
  typeof value === "string" && knowledgeStatuses.has(value);

const isKnowledgeConfidence = (value: unknown): value is KnowledgeConfidence =>
  typeof value === "string" && knowledgeConfidences.has(value);

const isKnowledgeReviewability = (value: unknown): value is KnowledgeReviewability =>
  typeof value === "string" && knowledgeReviewabilities.has(value);

const isKnowledgeNextAction = (value: unknown): value is KnowledgeNextAction =>
  typeof value === "string" && knowledgeNextActions.has(value);

const isKnowledgeUsefulnessOutcome = (
  value: unknown
): value is KnowledgeUsefulnessOutcome =>
  typeof value === "string" && knowledgeUsefulnessOutcomes.has(value);

const isKnowledgeDecisionStatus = (
  value: unknown
): value is KnowledgeDecisionStatus =>
  typeof value === "string" && knowledgeDecisionStatuses.has(value);

const evidenceBoundaryFieldParsers: FieldParsers<KnowledgeEvidenceBoundaryFields> = {
  reviewability: (record) =>
    isKnowledgeReviewability(record["reviewability"]) ? record["reviewability"] : undefined,
  sourceRefs: (record) => parseNonEmptyStringArray(record["sourceRefs"]),
  evidenceRefs: (record) => parseNonEmptyStringArray(record["evidenceRefs"]),
  consumers: (record) => parseNonEmptyStringArray(record["consumers"]),
  falsifier: (record) => parseNonEmptyString(record["falsifier"]),
  doesNotProve: (record) => parseNonEmptyString(record["doesNotProve"])
};

const knowledgeReadModelFieldParsers: FieldParsers<KnowledgeReadModelRequiredFields> = {
  id: (record) => parseNonEmptyString(record["id"]),
  kind: (record) => isKnowledgeKind(record["kind"]) ? record["kind"] : undefined,
  status: (record) => isKnowledgeStatus(record["status"]) ? record["status"] : undefined,
  title: (record) => parseNonEmptyString(record["title"]),
  summary: (record) => parseNonEmptyString(record["summary"]),
  confidence: (record) =>
    isKnowledgeConfidence(record["confidence"]) ? record["confidence"] : undefined,
  ...evidenceBoundaryFieldParsers,
  temporal: (record) => parseTemporal(record["temporal"]),
  dissent: (record) => parseDissent(record["dissent"]),
  nextAction: (record) =>
    isKnowledgeNextAction(record["nextAction"]) ? record["nextAction"] : undefined
};

const knowledgeDecisionFieldParsers: FieldParsers<KnowledgeDecisionRequiredFields> = {
  knowledgeId: (record) => parseNonEmptyString(record["knowledgeId"]),
  name: (record) => parseNonEmptyString(record["name"]),
  decisionStatus: (record) =>
    isKnowledgeDecisionStatus(record["decisionStatus"]) ? record["decisionStatus"] : undefined,
  confidence: (record) =>
    isKnowledgeConfidence(record["confidence"]) ? record["confidence"] : undefined,
  decision: (record) => parseNonEmptyString(record["decision"]),
  ...evidenceBoundaryFieldParsers,
  nextAction: (record) =>
    isKnowledgeNextAction(record["nextAction"]) ? record["nextAction"] : undefined
};

export function parseKnowledgeReadModel(value: unknown): KnowledgeReadModel | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const requiredFields = parseObjectFields(value, knowledgeReadModelFieldParsers);
  const usefulnessFeedback = parseOptionalUsefulnessFeedback(value);

  if (requiredFields === undefined || usefulnessFeedback === undefined) {
    return undefined;
  }

  return {
    ...requiredFields,
    ...usefulnessFeedback
  };
}

export function parseKnowledgeUsefulnessFeedback(value: unknown): KnowledgeUsefulnessFeedback | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const knowledgeId = parseNonEmptyString(value["knowledgeId"]);
  const outcome = isKnowledgeUsefulnessOutcome(value["outcome"])
    ? value["outcome"]
    : undefined;
  const summary = parseNonEmptyString(value["summary"]);
  const evidenceRefs = parseNonEmptyStringArray(value["evidenceRefs"]);
  const doesNotProve = parseNonEmptyString(value["doesNotProve"]);

  if (
    knowledgeId === undefined ||
    outcome === undefined ||
    summary === undefined ||
    evidenceRefs === undefined ||
    doesNotProve === undefined ||
    !optionalStringFields(value, ["observedAt"])
  ) {
    return undefined;
  }

  return {
    knowledgeId,
    outcome,
    summary,
    evidenceRefs,
    doesNotProve,
    ...pickOptionalString(value, "observedAt")
  };
}

export function parseKnowledgeUsefulnessFeedbackList(value: unknown): KnowledgeUsefulnessFeedback[] | undefined {
  if (!isRecord(value) || !Array.isArray(value["feedback"])) {
    return undefined;
  }

  const feedback = value["feedback"].map(parseKnowledgeUsefulnessFeedback);

  return feedback.every((item) => item !== undefined)
    ? feedback
    : undefined;
}

export function parseKnowledgeDecision(value: unknown): KnowledgeDecision | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const requiredFields = parseObjectFields(value, knowledgeDecisionFieldParsers);

  return requiredFields !== undefined &&
    optionalStringFields(value, ["observedAt", "mechanism", "krnImplication"]) ? {
    ...requiredFields,
    ...pickOptionalString(value, "mechanism"),
    ...pickOptionalString(value, "krnImplication"),
    ...pickOptionalString(value, "observedAt")
  } : undefined;
}

export function knowledgeReadModelFromDecision(
  knowledge: KnowledgeDecision
): KnowledgeReadModel {
  return {
    id: `knowledge:${knowledge.knowledgeId}`,
    kind: "procedure",
    status: statusFromKnowledgeDecision(knowledge.decisionStatus),
    title: knowledge.name,
    summary: knowledge.decision,
    ...(knowledge.mechanism === undefined ? {} : { mechanism: knowledge.mechanism }),
    ...(knowledge.krnImplication === undefined ? {} : { krnImplication: knowledge.krnImplication }),
    confidence: knowledge.confidence,
    reviewability: knowledge.reviewability,
    sourceRefs: knowledge.sourceRefs,
    evidenceRefs: knowledge.evidenceRefs,
    consumers: knowledge.consumers,
    falsifier: knowledge.falsifier,
    doesNotProve: knowledge.doesNotProve,
    temporal: {
      kind: "current",
      ...(knowledge.observedAt === undefined ? {} : { observedAt: knowledge.observedAt })
    },
    dissent: {
      kind: "none"
    },
    nextAction: knowledge.nextAction
  };
}

export function knowledgeReadModelsWithUsefulnessFeedback(
  readModels: KnowledgeReadModel[],
  feedback: readonly KnowledgeUsefulnessFeedback[]
): KnowledgeReadModel[] {
  const latestByKnowledgeId = new Map<string, KnowledgeUsefulnessFeedback>();

  for (const item of feedback) {
    const previous = latestByKnowledgeId.get(item.knowledgeId);

    if (previous === undefined || isNewerFeedback(item, previous)) {
      latestByKnowledgeId.set(item.knowledgeId, item);
    }
  }

  return readModels.map((readModel) => {
    const usefulnessFeedback = latestByKnowledgeId.get(readModel.id);

    return usefulnessFeedback === undefined
      ? readModel
      : {
        ...readModel,
        usefulnessFeedback
      };
  });
}

export function searchKnowledgeReadModels(
  readModels: KnowledgeReadModel[],
  filter: KnowledgeSearchFilter
): KnowledgeReadModel[] {
  const runtimeFilter = searchRuntimeFilter(filter);

  return readModels.filter((readModel) => matchesKnowledgeSearch(readModel, runtimeFilter));
}

function tokenizeSearchText(value: string): string[] {
  return [...value.matchAll(/[\p{L}\p{N}]+/gu)].map((match) => match[0]);
}

function parseObjectFields<T extends object>(
  record: Record<string, unknown>,
  parsers: FieldParsers<T>
): T | undefined {
  const result: Partial<T> = {};

  for (const field of Object.keys(parsers) as Array<keyof T>) {
    const parsed = parsers[field](record);

    if (parsed === undefined) {
      return undefined;
    }

    result[field] = parsed;
  }

  return result as T;
}

function parseOptionalUsefulnessFeedback(
  record: Record<string, unknown>
): Pick<KnowledgeReadModel, "usefulnessFeedback"> | undefined {
  if (record["usefulnessFeedback"] === undefined) {
    return {};
  }

  const usefulnessFeedback = parseKnowledgeUsefulnessFeedback(record["usefulnessFeedback"]);

  return usefulnessFeedback === undefined ? undefined : { usefulnessFeedback };
}

function searchRuntimeFilter(filter: KnowledgeSearchFilter): KnowledgeSearchRuntimeFilter {
  const text = filter.text?.trim().toLowerCase();

  return {
    ...filter,
    ...(text === undefined ? {} : { text }),
    textTokens: tokenizeSearchText(text ?? "")
  };
}

function matchesKnowledgeSearch(
  readModel: KnowledgeReadModel,
  filter: KnowledgeSearchRuntimeFilter
): boolean {
  return matchesStructuredFilter(readModel, filter) &&
    matchesUsefulnessOutcomeFilter(readModel, filter) &&
    matchesTextFilter(readModel, filter);
}

function matchesStructuredFilter(
  readModel: KnowledgeReadModel,
  filter: KnowledgeSearchRuntimeFilter
): boolean {
  return (filter.kind === undefined || readModel.kind === filter.kind) &&
    (filter.status === undefined || readModel.status === filter.status) &&
    (filter.reviewability === undefined || readModel.reviewability === filter.reviewability);
}

function matchesUsefulnessOutcomeFilter(
  readModel: KnowledgeReadModel,
  filter: KnowledgeSearchRuntimeFilter
): boolean {
  if (filter.usefulnessOutcome === undefined) {
    return true;
  }

  if (filter.usefulnessOutcome === "none") {
    return readModel.usefulnessFeedback === undefined;
  }

  return readModel.usefulnessFeedback?.outcome === filter.usefulnessOutcome;
}

function matchesTextFilter(
  readModel: KnowledgeReadModel,
  filter: KnowledgeSearchRuntimeFilter
): boolean {
  if (filter.text === undefined || filter.text.length === 0) {
    return true;
  }

  if (buildExactSearchText(readModel).includes(filter.text)) {
    return true;
  }

  const searchableTokens = new Set(tokenizeSearchText(buildTokenSearchText(readModel)));

  return filter.textTokens.length > 0 && filter.textTokens.every((token) => searchableTokens.has(token));
}

function buildExactSearchText(readModel: KnowledgeReadModel): string {
  return [
    readModel.id,
    readModel.title,
    readModel.summary,
    readModel.mechanism ?? "",
    readModel.krnImplication ?? "",
    readModel.falsifier,
    readModel.doesNotProve,
    ...readModel.sourceRefs,
    ...readModel.evidenceRefs,
    ...readModel.consumers,
    ...usefulnessSearchText(readModel)
  ].join("\n").toLowerCase();
}

function buildTokenSearchText(readModel: KnowledgeReadModel): string {
  return [
    readModel.id,
    readModel.title,
    readModel.summary,
    readModel.mechanism ?? "",
    readModel.krnImplication ?? "",
    readModel.falsifier,
    readModel.doesNotProve,
    ...readModel.consumers
  ].join("\n").toLowerCase();
}

function usefulnessSearchText(readModel: KnowledgeReadModel): string[] {
  if (readModel.usefulnessFeedback === undefined) {
    return [];
  }

  return [
    readModel.usefulnessFeedback.outcome,
    readModel.usefulnessFeedback.summary,
    readModel.usefulnessFeedback.doesNotProve,
    ...readModel.usefulnessFeedback.evidenceRefs
  ];
}

function isNewerFeedback(
  candidate: KnowledgeUsefulnessFeedback,
  previous: KnowledgeUsefulnessFeedback
): boolean {
  if (candidate.observedAt === undefined) {
    return previous.observedAt === undefined;
  }

  return previous.observedAt === undefined || candidate.observedAt >= previous.observedAt;
}

function statusFromKnowledgeDecision(status: KnowledgeDecisionStatus): KnowledgeStatus {
  switch (status) {
    case "adopt_now":
      return "active";
    case "lab":
    case "later":
      return "deferred";
    case "reject":
      return "rejected";
  }
}

function parseTemporal(value: unknown): KnowledgeTemporal | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (value["kind"] === "current") {
    return optionalStringFields(value, ["observedAt"]) ? {
      kind: "current",
      ...pickOptionalString(value, "observedAt")
    } : undefined;
  }

  if (value["kind"] === "historical") {
    return optionalStringFields(value, ["validFrom", "validUntil", "observedAt"]) ? {
      kind: "historical",
      ...pickOptionalString(value, "validFrom"),
      ...pickOptionalString(value, "validUntil"),
      ...pickOptionalString(value, "observedAt")
    } : undefined;
  }

  return value["kind"] === "unknown" ? { kind: "unknown" } : undefined;
}

function parseDissent(value: unknown): KnowledgeDissent | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (value["kind"] === "none") {
    return { kind: "none" };
  }

  if (value["kind"] === "conflict") {
    const refs = parseNonEmptyStringArray(value["refs"]);
    const summary = parseNonEmptyString(value["summary"]);

    return refs !== undefined && summary !== undefined ? {
      kind: "conflict",
      refs,
      summary
    } : undefined;
  }

  return value["kind"] === "unknown" ? { kind: "unknown" } : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function parseNonEmptyStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }

  return value.every((item) => parseNonEmptyString(item) !== undefined)
    ? value
    : undefined;
}

function optionalStringFields(record: Record<string, unknown>, fields: string[]): boolean {
  return fields.every((field) => record[field] === undefined || typeof record[field] === "string");
}

function pickOptionalString(record: Record<string, unknown>, field: string): Record<string, string> {
  const value = record[field];

  return typeof value === "string" ? { [field]: value } : {};
}
