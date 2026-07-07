export const brainKnowledgeKindValues = [
  "source_claim",
  "source_decision",
  "pattern",
  "memory",
  "memory_candidate",
  "anti_memory_candidate",
  "eval_candidate",
  "adr",
  "standard",
  "skill",
  "run_evidence"
] as const;

export type BrainKnowledgeKind = typeof brainKnowledgeKindValues[number];

export const brainKnowledgeStatusValues = [
  "active",
  "candidate",
  "accepted",
  "rejected",
  "deferred",
  "stale",
  "superseded",
  "unknown"
] as const;

export type BrainKnowledgeStatus = typeof brainKnowledgeStatusValues[number];

export type BrainKnowledgeConfidence = "high" | "medium" | "low" | "unknown";

export const brainKnowledgeReviewabilityValues = [
  "ready",
  "needs_more_evidence",
  "too_vague",
  "duplicate",
  "not_useful",
  "unknown"
] as const;

export type BrainKnowledgeReviewability = typeof brainKnowledgeReviewabilityValues[number];

export type BrainKnowledgeTemporal =
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

export type BrainKnowledgeDissent =
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

export const brainKnowledgeNextActionValues = [
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

export type BrainKnowledgeNextAction = typeof brainKnowledgeNextActionValues[number];

export const brainKnowledgeUsefulnessOutcomeValues = [
  "selected",
  "used",
  "helped",
  "neutral",
  "noise",
  "stale",
  "unknown"
] as const;

export type BrainKnowledgeUsefulnessOutcome =
  typeof brainKnowledgeUsefulnessOutcomeValues[number];

export type BrainKnowledgeUsefulnessOutcomeFilter =
  | BrainKnowledgeUsefulnessOutcome
  | "none";

export const brainKnowledgeUsefulnessOutcomeFilterValues = [
  ...brainKnowledgeUsefulnessOutcomeValues,
  "none"
] as const satisfies readonly BrainKnowledgeUsefulnessOutcomeFilter[];

export type BrainKnowledgeUsefulnessFeedback = {
  cardId: string;
  outcome: BrainKnowledgeUsefulnessOutcome;
  summary: string;
  evidenceRefs: string[];
  doesNotProve: string;
  observedAt?: string;
};

export type BrainKnowledgeReadModel = {
  id: string;
  kind: BrainKnowledgeKind;
  status: BrainKnowledgeStatus;
  title: string;
  summary: string;
  confidence: BrainKnowledgeConfidence;
  reviewability: BrainKnowledgeReviewability;
  sourceRefs: string[];
  evidenceRefs: string[];
  consumers: string[];
  falsifier: string;
  doesNotProve: string;
  temporal: BrainKnowledgeTemporal;
  dissent: BrainKnowledgeDissent;
  nextAction: BrainKnowledgeNextAction;
  usefulnessFeedback?: BrainKnowledgeUsefulnessFeedback;
};

export type BrainKnowledgeSearchFilter = {
  kind?: BrainKnowledgeKind;
  status?: BrainKnowledgeStatus;
  reviewability?: BrainKnowledgeReviewability;
  usefulnessOutcome?: BrainKnowledgeUsefulnessOutcomeFilter;
  text?: string;
};

export type BrainKnowledgeDecisionStatus =
  | "adopt_now"
  | "lab"
  | "later"
  | "reject";

export type BrainKnowledgeDecision = {
  knowledgeId: string;
  name: string;
  decisionStatus: BrainKnowledgeDecisionStatus;
  confidence: BrainKnowledgeConfidence;
  reviewability: BrainKnowledgeReviewability;
  decision: string;
  sourceRefs: string[];
  evidenceRefs: string[];
  consumers: string[];
  falsifier: string;
  doesNotProve: string;
  observedAt?: string;
  nextAction: BrainKnowledgeNextAction;
};

type BrainKnowledgeReadModelRequiredFields = Omit<BrainKnowledgeReadModel, "usefulnessFeedback">;

type BrainKnowledgeDecisionRequiredFields = Omit<BrainKnowledgeDecision, "observedAt">;

type BrainKnowledgeEvidenceBoundaryFields = Pick<
  BrainKnowledgeReadModelRequiredFields,
  "reviewability" | "sourceRefs" | "evidenceRefs" | "consumers" | "falsifier" | "doesNotProve"
>;

type FieldParsers<T extends object> = {
  [Key in keyof T]-?: (record: Record<string, unknown>) => T[Key] | undefined;
};

type NormalizedBrainKnowledgeSearchFilter = {
  kind?: BrainKnowledgeKind;
  status?: BrainKnowledgeStatus;
  reviewability?: BrainKnowledgeReviewability;
  usefulnessOutcome?: BrainKnowledgeUsefulnessOutcomeFilter;
  text?: string;
  textTokens: string[];
};

const knowledgeKinds = new Set<string>(brainKnowledgeKindValues);

const knowledgeStatuses = new Set<string>(brainKnowledgeStatusValues);

const knowledgeConfidences = new Set<string>([
  "high",
  "medium",
  "low",
  "unknown"
]);

const knowledgeReviewabilities = new Set<string>(
  brainKnowledgeReviewabilityValues
);

const knowledgeNextActions = new Set<string>(
  brainKnowledgeNextActionValues
);

const knowledgeUsefulnessOutcomes = new Set<string>(
  brainKnowledgeUsefulnessOutcomeValues
);

const brainKnowledgeDecisionStatuses = new Set<string>([
  "adopt_now",
  "lab",
  "later",
  "reject"
]);

const isBrainKnowledgeKind = (value: unknown): value is BrainKnowledgeKind =>
  typeof value === "string" && knowledgeKinds.has(value);

const isBrainKnowledgeStatus = (value: unknown): value is BrainKnowledgeStatus =>
  typeof value === "string" && knowledgeStatuses.has(value);

const isBrainKnowledgeConfidence = (value: unknown): value is BrainKnowledgeConfidence =>
  typeof value === "string" && knowledgeConfidences.has(value);

const isBrainKnowledgeReviewability = (value: unknown): value is BrainKnowledgeReviewability =>
  typeof value === "string" && knowledgeReviewabilities.has(value);

const isBrainKnowledgeNextAction = (value: unknown): value is BrainKnowledgeNextAction =>
  typeof value === "string" && knowledgeNextActions.has(value);

const isBrainKnowledgeUsefulnessOutcome = (
  value: unknown
): value is BrainKnowledgeUsefulnessOutcome =>
  typeof value === "string" && knowledgeUsefulnessOutcomes.has(value);

const isBrainKnowledgeDecisionStatus = (
  value: unknown
): value is BrainKnowledgeDecisionStatus =>
  typeof value === "string" && brainKnowledgeDecisionStatuses.has(value);

const evidenceBoundaryFieldParsers: FieldParsers<BrainKnowledgeEvidenceBoundaryFields> = {
  reviewability: (record) =>
    isBrainKnowledgeReviewability(record["reviewability"]) ? record["reviewability"] : undefined,
  sourceRefs: (record) => parseNonEmptyStringArray(record["sourceRefs"]),
  evidenceRefs: (record) => parseNonEmptyStringArray(record["evidenceRefs"]),
  consumers: (record) => parseNonEmptyStringArray(record["consumers"]),
  falsifier: (record) => parseNonEmptyString(record["falsifier"]),
  doesNotProve: (record) => parseNonEmptyString(record["doesNotProve"])
};

const brainKnowledgeReadModelFieldParsers: FieldParsers<BrainKnowledgeReadModelRequiredFields> = {
  id: (record) => parseNonEmptyString(record["id"]),
  kind: (record) => isBrainKnowledgeKind(record["kind"]) ? record["kind"] : undefined,
  status: (record) => isBrainKnowledgeStatus(record["status"]) ? record["status"] : undefined,
  title: (record) => parseNonEmptyString(record["title"]),
  summary: (record) => parseNonEmptyString(record["summary"]),
  confidence: (record) =>
    isBrainKnowledgeConfidence(record["confidence"]) ? record["confidence"] : undefined,
  ...evidenceBoundaryFieldParsers,
  temporal: (record) => parseTemporal(record["temporal"]),
  dissent: (record) => parseDissent(record["dissent"]),
  nextAction: (record) =>
    isBrainKnowledgeNextAction(record["nextAction"]) ? record["nextAction"] : undefined
};

const brainKnowledgeDecisionFieldParsers: FieldParsers<BrainKnowledgeDecisionRequiredFields> = {
  knowledgeId: (record) => parseNonEmptyString(record["knowledgeId"]),
  name: (record) => parseNonEmptyString(record["name"]),
  decisionStatus: (record) =>
    isBrainKnowledgeDecisionStatus(record["decisionStatus"]) ? record["decisionStatus"] : undefined,
  confidence: (record) =>
    isBrainKnowledgeConfidence(record["confidence"]) ? record["confidence"] : undefined,
  decision: (record) => parseNonEmptyString(record["decision"]),
  ...evidenceBoundaryFieldParsers,
  nextAction: (record) =>
    isBrainKnowledgeNextAction(record["nextAction"]) ? record["nextAction"] : undefined
};

export function parseBrainKnowledgeReadModel(value: unknown): BrainKnowledgeReadModel | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const requiredFields = parseObjectFields(value, brainKnowledgeReadModelFieldParsers);
  const usefulnessFeedback = parseOptionalUsefulnessFeedback(value);

  if (requiredFields === undefined || usefulnessFeedback === undefined) {
    return undefined;
  }

  return {
    ...requiredFields,
    ...usefulnessFeedback
  };
}

export function parseBrainKnowledgeUsefulnessFeedback(value: unknown): BrainKnowledgeUsefulnessFeedback | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const cardId = parseNonEmptyString(value["cardId"]);
  const outcome = isBrainKnowledgeUsefulnessOutcome(value["outcome"])
    ? value["outcome"]
    : undefined;
  const summary = parseNonEmptyString(value["summary"]);
  const evidenceRefs = parseNonEmptyStringArray(value["evidenceRefs"]);
  const doesNotProve = parseNonEmptyString(value["doesNotProve"]);

  if (
    cardId === undefined ||
    outcome === undefined ||
    summary === undefined ||
    evidenceRefs === undefined ||
    doesNotProve === undefined ||
    !optionalStringFields(value, ["observedAt"])
  ) {
    return undefined;
  }

  return {
    cardId,
    outcome,
    summary,
    evidenceRefs,
    doesNotProve,
    ...pickOptionalString(value, "observedAt")
  };
}

export function parseBrainKnowledgeUsefulnessFeedbackList(value: unknown): BrainKnowledgeUsefulnessFeedback[] | undefined {
  if (!isRecord(value) || !Array.isArray(value["feedback"])) {
    return undefined;
  }

  const feedback = value["feedback"].map(parseBrainKnowledgeUsefulnessFeedback);

  return feedback.every((item) => item !== undefined)
    ? feedback
    : undefined;
}

export function parseBrainKnowledgeDecision(value: unknown): BrainKnowledgeDecision | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const requiredFields = parseObjectFields(value, brainKnowledgeDecisionFieldParsers);

  return requiredFields !== undefined && optionalStringFields(value, ["observedAt"]) ? {
    ...requiredFields,
    ...pickOptionalString(value, "observedAt")
  } : undefined;
}

export function brainKnowledgeCardFromDecision(
  pattern: BrainKnowledgeDecision
): BrainKnowledgeReadModel {
  return {
    id: `pattern:${pattern.knowledgeId}`,
    kind: "pattern",
    status: statusFromBrainKnowledgeDecision(pattern.decisionStatus),
    title: pattern.name,
    summary: pattern.decision,
    confidence: pattern.confidence,
    reviewability: pattern.reviewability,
    sourceRefs: pattern.sourceRefs,
    evidenceRefs: pattern.evidenceRefs,
    consumers: pattern.consumers,
    falsifier: pattern.falsifier,
    doesNotProve: pattern.doesNotProve,
    temporal: {
      kind: "current",
      ...(pattern.observedAt === undefined ? {} : { observedAt: pattern.observedAt })
    },
    dissent: {
      kind: "none"
    },
    nextAction: pattern.nextAction
  };
}

export function cardsWithBrainKnowledgeUsefulnessFeedback(
  cards: BrainKnowledgeReadModel[],
  feedback: readonly BrainKnowledgeUsefulnessFeedback[]
): BrainKnowledgeReadModel[] {
  const latestByCardId = new Map<string, BrainKnowledgeUsefulnessFeedback>();

  for (const item of feedback) {
    const previous = latestByCardId.get(item.cardId);

    if (previous === undefined || isNewerFeedback(item, previous)) {
      latestByCardId.set(item.cardId, item);
    }
  }

  return cards.map((card) => {
    const usefulnessFeedback = latestByCardId.get(card.id);

    return usefulnessFeedback === undefined
      ? card
      : {
        ...card,
        usefulnessFeedback
      };
  });
}

export function searchBrainKnowledgeCards(
  cards: BrainKnowledgeReadModel[],
  filter: BrainKnowledgeSearchFilter
): BrainKnowledgeReadModel[] {
  const normalizedFilter = normalizeSearchFilter(filter);

  return cards.filter((card) => matchesBrainKnowledgeSearch(card, normalizedFilter));
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
): Pick<BrainKnowledgeReadModel, "usefulnessFeedback"> | undefined {
  if (record["usefulnessFeedback"] === undefined) {
    return {};
  }

  const usefulnessFeedback = parseBrainKnowledgeUsefulnessFeedback(record["usefulnessFeedback"]);

  return usefulnessFeedback === undefined ? undefined : { usefulnessFeedback };
}

function normalizeSearchFilter(filter: BrainKnowledgeSearchFilter): NormalizedBrainKnowledgeSearchFilter {
  const text = filter.text?.trim().toLowerCase();

  return {
    ...filter,
    ...(text === undefined ? {} : { text }),
    textTokens: tokenizeSearchText(text ?? "")
  };
}

function matchesBrainKnowledgeSearch(
  card: BrainKnowledgeReadModel,
  filter: NormalizedBrainKnowledgeSearchFilter
): boolean {
  return matchesStructuredFilter(card, filter) &&
    matchesUsefulnessOutcomeFilter(card, filter) &&
    matchesTextFilter(card, filter);
}

function matchesStructuredFilter(
  card: BrainKnowledgeReadModel,
  filter: NormalizedBrainKnowledgeSearchFilter
): boolean {
  return (filter.kind === undefined || card.kind === filter.kind) &&
    (filter.status === undefined || card.status === filter.status) &&
    (filter.reviewability === undefined || card.reviewability === filter.reviewability);
}

function matchesUsefulnessOutcomeFilter(
  card: BrainKnowledgeReadModel,
  filter: NormalizedBrainKnowledgeSearchFilter
): boolean {
  if (filter.usefulnessOutcome === undefined) {
    return true;
  }

  if (filter.usefulnessOutcome === "none") {
    return card.usefulnessFeedback === undefined;
  }

  return card.usefulnessFeedback?.outcome === filter.usefulnessOutcome;
}

function matchesTextFilter(
  card: BrainKnowledgeReadModel,
  filter: NormalizedBrainKnowledgeSearchFilter
): boolean {
  if (filter.text === undefined || filter.text.length === 0) {
    return true;
  }

  if (buildExactSearchText(card).includes(filter.text)) {
    return true;
  }

  const searchableTokens = new Set(tokenizeSearchText(buildTokenSearchText(card)));

  return filter.textTokens.length > 0 && filter.textTokens.every((token) => searchableTokens.has(token));
}

function buildExactSearchText(card: BrainKnowledgeReadModel): string {
  return [
    card.id,
    card.title,
    card.summary,
    card.falsifier,
    card.doesNotProve,
    card.usefulnessFeedback?.outcome ?? "",
    card.usefulnessFeedback?.summary ?? "",
    card.usefulnessFeedback?.doesNotProve ?? "",
    ...card.sourceRefs,
    ...card.evidenceRefs,
    ...card.consumers,
    ...(card.usefulnessFeedback?.evidenceRefs ?? [])
  ].join("\n").toLowerCase();
}

function buildTokenSearchText(card: BrainKnowledgeReadModel): string {
  return [
    card.id,
    card.title,
    card.summary,
    card.falsifier,
    card.doesNotProve,
    ...card.consumers
  ].join("\n").toLowerCase();
}

function isNewerFeedback(
  candidate: BrainKnowledgeUsefulnessFeedback,
  previous: BrainKnowledgeUsefulnessFeedback
): boolean {
  if (candidate.observedAt === undefined) {
    return previous.observedAt === undefined;
  }

  return previous.observedAt === undefined || candidate.observedAt >= previous.observedAt;
}

function statusFromBrainKnowledgeDecision(status: BrainKnowledgeDecisionStatus): BrainKnowledgeStatus {
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

function parseTemporal(value: unknown): BrainKnowledgeTemporal | undefined {
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

function parseDissent(value: unknown): BrainKnowledgeDissent | undefined {
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
