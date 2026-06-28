export type BrainKnowledgeKind =
  | "source_claim"
  | "source_decision"
  | "pattern"
  | "memory"
  | "memory_candidate"
  | "anti_memory_candidate"
  | "eval_candidate"
  | "adr"
  | "standard"
  | "skill"
  | "run_evidence";

export type BrainKnowledgeStatus =
  | "active"
  | "candidate"
  | "accepted"
  | "rejected"
  | "deferred"
  | "stale"
  | "superseded"
  | "unknown";

export type BrainKnowledgeConfidence = "high" | "medium" | "low" | "unknown";

export type BrainKnowledgeReviewability =
  | "ready"
  | "needs_more_evidence"
  | "too_vague"
  | "duplicate"
  | "not_useful"
  | "unknown";

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

export type BrainKnowledgeNextAction =
  | "use"
  | "review"
  | "promote"
  | "demote"
  | "invalidate"
  | "add_evidence"
  | "reject"
  | "defer"
  | "unknown";

export type BrainKnowledgeUsefulnessOutcome =
  | "helped"
  | "neutral"
  | "noise"
  | "stale"
  | "unknown";

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
  usefulnessOutcome?: BrainKnowledgeUsefulnessOutcome;
  text?: string;
};

export type RetainedPatternAdoptionStatus =
  | "adopt_now"
  | "lab"
  | "later"
  | "reject";

export type RetainedPatternDecision = {
  patternId: string;
  name: string;
  adoptionStatus: RetainedPatternAdoptionStatus;
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

const knowledgeKinds = new Set<BrainKnowledgeKind>([
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
]);

const knowledgeStatuses = new Set<BrainKnowledgeStatus>([
  "active",
  "candidate",
  "accepted",
  "rejected",
  "deferred",
  "stale",
  "superseded",
  "unknown"
]);

const knowledgeConfidences = new Set<BrainKnowledgeConfidence>([
  "high",
  "medium",
  "low",
  "unknown"
]);

const knowledgeReviewabilities = new Set<BrainKnowledgeReviewability>([
  "ready",
  "needs_more_evidence",
  "too_vague",
  "duplicate",
  "not_useful",
  "unknown"
]);

const knowledgeNextActions = new Set<BrainKnowledgeNextAction>([
  "use",
  "review",
  "promote",
  "demote",
  "invalidate",
  "add_evidence",
  "reject",
  "defer",
  "unknown"
]);

const knowledgeUsefulnessOutcomes = new Set<BrainKnowledgeUsefulnessOutcome>([
  "helped",
  "neutral",
  "noise",
  "stale",
  "unknown"
]);

const patternAdoptionStatuses = new Set<RetainedPatternAdoptionStatus>([
  "adopt_now",
  "lab",
  "later",
  "reject"
]);

export function parseBrainKnowledgeReadModel(value: unknown): BrainKnowledgeReadModel | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const kind = parseSetValue(value["kind"], knowledgeKinds);
  const status = parseSetValue(value["status"], knowledgeStatuses);
  const confidence = parseSetValue(value["confidence"], knowledgeConfidences);
  const reviewability = parseSetValue(value["reviewability"], knowledgeReviewabilities);
  const temporal = parseTemporal(value["temporal"]);
  const dissent = parseDissent(value["dissent"]);
  const nextAction = parseSetValue(value["nextAction"], knowledgeNextActions);

  const id = parseNonEmptyString(value["id"]);
  const title = parseNonEmptyString(value["title"]);
  const summary = parseNonEmptyString(value["summary"]);
  const sourceRefs = parseNonEmptyStringArray(value["sourceRefs"]);
  const evidenceRefs = parseNonEmptyStringArray(value["evidenceRefs"]);
  const consumers = parseNonEmptyStringArray(value["consumers"]);
  const falsifier = parseNonEmptyString(value["falsifier"]);
  const doesNotProve = parseNonEmptyString(value["doesNotProve"]);
  const usefulnessFeedback = value["usefulnessFeedback"] === undefined
    ? undefined
    : parseBrainKnowledgeUsefulnessFeedback(value["usefulnessFeedback"]);

  if (
    id === undefined ||
    kind === undefined ||
    status === undefined ||
    title === undefined ||
    summary === undefined ||
    confidence === undefined ||
    reviewability === undefined ||
    sourceRefs === undefined ||
    evidenceRefs === undefined ||
    consumers === undefined ||
    falsifier === undefined ||
    doesNotProve === undefined ||
    temporal === undefined ||
    dissent === undefined ||
    nextAction === undefined ||
    (value["usefulnessFeedback"] !== undefined && usefulnessFeedback === undefined)
  ) {
    return undefined;
  }

  return {
    id,
    kind,
    status,
    title,
    summary,
    confidence,
    reviewability,
    sourceRefs,
    evidenceRefs,
    consumers,
    falsifier,
    doesNotProve,
    temporal,
    dissent,
    nextAction,
    ...(usefulnessFeedback === undefined ? {} : { usefulnessFeedback })
  };
}

export function parseBrainKnowledgeUsefulnessFeedback(value: unknown): BrainKnowledgeUsefulnessFeedback | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const cardId = parseNonEmptyString(value["cardId"]);
  const outcome = parseSetValue(value["outcome"], knowledgeUsefulnessOutcomes);
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

export function parseRetainedPatternDecision(value: unknown): RetainedPatternDecision | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const patternId = parseNonEmptyString(value["patternId"]);
  const name = parseNonEmptyString(value["name"]);
  const adoptionStatus = parseSetValue(value["adoptionStatus"], patternAdoptionStatuses);
  const confidence = parseSetValue(value["confidence"], knowledgeConfidences);
  const reviewability = parseSetValue(value["reviewability"], knowledgeReviewabilities);
  const decision = parseNonEmptyString(value["decision"]);
  const sourceRefs = parseNonEmptyStringArray(value["sourceRefs"]);
  const evidenceRefs = parseNonEmptyStringArray(value["evidenceRefs"]);
  const consumers = parseNonEmptyStringArray(value["consumers"]);
  const falsifier = parseNonEmptyString(value["falsifier"]);
  const doesNotProve = parseNonEmptyString(value["doesNotProve"]);
  const nextAction = parseSetValue(value["nextAction"], knowledgeNextActions);

  if (
    patternId === undefined ||
    name === undefined ||
    adoptionStatus === undefined ||
    confidence === undefined ||
    reviewability === undefined ||
    decision === undefined ||
    sourceRefs === undefined ||
    evidenceRefs === undefined ||
    consumers === undefined ||
    falsifier === undefined ||
    doesNotProve === undefined ||
    nextAction === undefined ||
    !optionalStringFields(value, ["observedAt"])
  ) {
    return undefined;
  }

  return {
    patternId,
    name,
    adoptionStatus,
    confidence,
    reviewability,
    decision,
    sourceRefs,
    evidenceRefs,
    consumers,
    falsifier,
    doesNotProve,
    ...pickOptionalString(value, "observedAt"),
    nextAction
  };
}

export function brainKnowledgeCardFromRetainedPatternDecision(
  pattern: RetainedPatternDecision
): BrainKnowledgeReadModel {
  return {
    id: `pattern:${pattern.patternId}`,
    kind: "pattern",
    status: statusFromPatternAdoption(pattern.adoptionStatus),
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
  const normalizedText = filter.text?.trim().toLowerCase();

  return cards.filter((card) => {
    if (filter.kind !== undefined && card.kind !== filter.kind) {
      return false;
    }

    if (filter.status !== undefined && card.status !== filter.status) {
      return false;
    }

    if (filter.reviewability !== undefined && card.reviewability !== filter.reviewability) {
      return false;
    }

    if (
      filter.usefulnessOutcome !== undefined &&
      card.usefulnessFeedback?.outcome !== filter.usefulnessOutcome
    ) {
      return false;
    }

    if (normalizedText !== undefined && normalizedText.length > 0) {
      const searchable = [
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

      return searchable.includes(normalizedText);
    }

    return true;
  });
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

function statusFromPatternAdoption(status: RetainedPatternAdoptionStatus): BrainKnowledgeStatus {
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

function parseSetValue<T extends string>(value: unknown, allowed: ReadonlySet<T>): T | undefined {
  return typeof value === "string" && allowed.has(value as T) ? value as T : undefined;
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
