import type {
  BrainKnowledgeNextAction,
  BrainKnowledgeReviewability
} from "@krn/harness";
import {
  brainKnowledgeNextActionValues,
  brainKnowledgeReviewabilityValues
} from "@krn/harness";
import {
  classifyTargetFit,
  parseTargetFitSummary,
  summarizeTargetFit,
  targetFitValues
} from "@krn/core";
import type {
  TargetFit,
  TargetFitSummary
} from "@krn/core";

export type RetainedPatternPlanSelectionStatus =
  | "selected"
  | "rejected_or_deferred"
  | "unavailable";

export interface RetainedPatternPlanItem {
  id: string;
  patternId: string;
  title: string;
  reviewability: BrainKnowledgeReviewability;
  nextAction: BrainKnowledgeNextAction;
  doesNotProve: string;
  targetFit: TargetFit;
  targetFitReasons: readonly string[];
}

export interface RetainedPatternPlanSelection {
  kind: "krn.retainedPatternPlanSelection.v1";
  status: RetainedPatternPlanSelectionStatus;
  query: string;
  source: "brain_knowledge_catalog";
  selectedPatternIds: string[];
  selectedPatterns: RetainedPatternPlanItem[];
  targetFitSummary: TargetFitSummary;
  recommendedNextAction: string;
  reason: string;
  doesNotProve: string;
  proof: {
    proves: string[];
    doesNotProve: string[];
  };
}

export const retainedPatternPlanSelectionMetadataKey = "retainedPatternSelection";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

type FieldParsers<T extends object> = {
  [Key in keyof T]-?: (record: Record<string, unknown>) => T[Key] | undefined;
};

type RetainedPatternPlanItemFields = Omit<
  RetainedPatternPlanItem,
  "patternId" | "targetFit" | "targetFitReasons"
>;

type RetainedPatternPlanSelectionMetadataFields = Pick<
  RetainedPatternPlanSelection,
  "kind" | "status" | "query" | "source" | "selectedPatternIds" | "reason" | "doesNotProve"
>;

const selectionStatuses = new Set<string>([
  "selected",
  "rejected_or_deferred",
  "unavailable"
]);

const selectionSources = new Set<string>([
  "brain_knowledge_catalog"
]);

const planItemReviewabilities = new Set<string>(
  brainKnowledgeReviewabilityValues
);

const planItemNextActions = new Set<string>(
  brainKnowledgeNextActionValues
);

const planItemTargetFits = new Set<string>(targetFitValues);

const parseNonEmptyString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const isSelectionStatus = (
  value: unknown
): value is RetainedPatternPlanSelectionStatus =>
  typeof value === "string" && selectionStatuses.has(value);

const isSelectionSource = (
  value: unknown
): value is RetainedPatternPlanSelection["source"] =>
  typeof value === "string" && selectionSources.has(value);

const isPlanItemReviewability = (
  value: unknown
): value is BrainKnowledgeReviewability =>
  typeof value === "string" && planItemReviewabilities.has(value);

const isPlanItemNextAction = (
  value: unknown
): value is BrainKnowledgeNextAction =>
  typeof value === "string" && planItemNextActions.has(value);

const isPlanItemTargetFit = (value: unknown): value is TargetFit =>
  typeof value === "string" && planItemTargetFits.has(value);

const parseStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const strings = value.filter((item): item is string => typeof item === "string");

  return strings.length === value.length ? strings : undefined;
};

const parseObjectFields = <T extends object>(
  record: Record<string, unknown>,
  parsers: FieldParsers<T>
): T | undefined => {
  const entries = (Object.keys(parsers) as Array<keyof T>).map((key) => [
    key,
    parsers[key](record)
  ] as const);

  if (entries.some(([, value]) => value === undefined)) {
    return undefined;
  }

  return Object.fromEntries(entries) as T;
};

const planItemFieldParsers: FieldParsers<RetainedPatternPlanItemFields> = {
  id: (record) => parseNonEmptyString(record["id"]),
  title: (record) => parseNonEmptyString(record["title"]),
  reviewability: (record) =>
    isPlanItemReviewability(record["reviewability"]) ? record["reviewability"] : undefined,
  nextAction: (record) =>
    isPlanItemNextAction(record["nextAction"]) ? record["nextAction"] : undefined,
  doesNotProve: (record) => parseNonEmptyString(record["doesNotProve"])
};

const selectionMetadataFieldParsers: FieldParsers<RetainedPatternPlanSelectionMetadataFields> = {
  kind: (record) =>
    record["kind"] === "krn.retainedPatternPlanSelection.v1"
      ? "krn.retainedPatternPlanSelection.v1"
      : undefined,
  status: (record) =>
    isSelectionStatus(record["status"]) ? record["status"] : undefined,
  query: (record) => parseNonEmptyString(record["query"]),
  source: (record) =>
    isSelectionSource(record["source"]) ? record["source"] : undefined,
  selectedPatternIds: (record) => parseStringArray(record["selectedPatternIds"]),
  reason: (record) => parseNonEmptyString(record["reason"]),
  doesNotProve: (record) => parseNonEmptyString(record["doesNotProve"])
};

const patternIdFromCardId = (id: string): string =>
  id.startsWith("pattern:") ? id.slice("pattern:".length) : id;

const cardTargetFitText = (record: Record<string, unknown>): string =>
  [
    record["id"],
    record["title"],
    record["summary"],
    record["reviewability"],
    record["nextAction"],
    record["falsifier"],
    record["doesNotProve"],
    ...(Array.isArray(record["consumers"]) ? record["consumers"] : [])
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ");

const planItemFromRecord = (
  record: Record<string, unknown>,
  patternId: string | undefined
): RetainedPatternPlanItem | undefined => {
  const requiredFields = parseObjectFields(record, planItemFieldParsers);

  if (requiredFields === undefined) {
    return undefined;
  }

  return {
    ...requiredFields,
    patternId: patternId ?? patternIdFromCardId(requiredFields.id),
    targetFit: isPlanItemTargetFit(record["targetFit"]) ? record["targetFit"] : "unknown",
    targetFitReasons: parseStringArray(record["targetFitReasons"]) ?? [
      "target-fit metadata was not present on this retained pattern item."
    ]
  };
};

const planItemFromCard = (
  value: unknown,
  query: string
): RetainedPatternPlanItem | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const item = planItemFromRecord(value, undefined);

  if (item === undefined) {
    return undefined;
  }

  // Target fit is query-relative plan evidence; selectedKnowledge cards do not own it.
  return {
    ...item,
    ...classifyTargetFit({
      query,
      text: cardTargetFitText(value),
      emptyTextReason: "retained pattern card has no classifiable target-fit text."
    })
  };
};

const proofFromRecord = (
  value: unknown
): RetainedPatternPlanSelection["proof"] => {
  if (!isRecord(value)) {
    return {
      proves: [],
      doesNotProve: []
    };
  }

  return {
    proves: parseStringArray(value["proves"]) ?? [],
    doesNotProve: parseStringArray(value["doesNotProve"]) ?? []
  };
};

export const retainedPatternSelectionFromKnowledgeJson = (
  query: string,
  text: string
): RetainedPatternPlanSelection => {
  const parsed: unknown = JSON.parse(text);
  const record = isRecord(parsed) ? parsed : undefined;
  const cards = Array.isArray(record?.cards) ? record.cards : [];
  const selectedPatterns = cards.flatMap((card) => {
    const item = planItemFromCard(card, query);

    return item === undefined ? [] : [item];
  });
  const targetFitSummary = summarizeTargetFit(selectedPatterns);

  if (selectedPatterns.length === 0) {
    return {
      kind: "krn.retainedPatternPlanSelection.v1",
      status: "rejected_or_deferred",
      query,
      source: "brain_knowledge_catalog",
      selectedPatternIds: [],
      selectedPatterns: [],
      targetFitSummary,
      recommendedNextAction: targetFitSummary.recommendedUse,
      reason: "No retained brain knowledge pattern matched the pre-coding plan query.",
      doesNotProve:
        "No matched retained pattern does not prove no relevant pattern exists; it proves only that this catalog readback did not select one.",
      proof: proofFromRecord(record?.proof)
    };
  }

  return {
    kind: "krn.retainedPatternPlanSelection.v1",
    status: "selected",
    query,
    source: "brain_knowledge_catalog",
    selectedPatternIds: selectedPatterns.map((pattern) => pattern.patternId),
    selectedPatterns,
    targetFitSummary,
    recommendedNextAction: targetFitSummary.recommendedUse,
    reason: "Retained brain knowledge matched the pre-coding plan query.",
    doesNotProve:
      "Selected retained patterns do not prove implementation correctness, source truth, ranking quality, or product readiness.",
    proof: proofFromRecord(record?.proof)
  };
};

export const unavailableRetainedPatternSelection = (
  query: string,
  reason: string
): RetainedPatternPlanSelection => {
  const targetFitSummary = summarizeTargetFit([]);

  return {
    kind: "krn.retainedPatternPlanSelection.v1",
    status: "unavailable",
    query,
    source: "brain_knowledge_catalog",
    selectedPatternIds: [],
    selectedPatterns: [],
    targetFitSummary,
    recommendedNextAction: targetFitSummary.recommendedUse,
    reason,
    doesNotProve:
      "Unavailable retained pattern readback does not prove no relevant pattern exists; run brain knowledge readback before making pattern-retention claims.",
    proof: {
      proves: ["plan recorded an explicit retained-pattern readback failure"],
      doesNotProve: [
        "brain knowledge catalog completeness",
        "pattern relevance",
        "implementation correctness"
      ]
    }
  }
};

const planItemFromMetadata = (value: unknown): RetainedPatternPlanItem | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const patternId = parseNonEmptyString(value["patternId"]);

  return patternId === undefined ? undefined : planItemFromRecord(value, patternId);
};

export const retainedPatternSelectionFromMetadata = (
  metadata: Record<string, unknown> | undefined
): RetainedPatternPlanSelection | undefined => {
  const value = metadata?.[retainedPatternPlanSelectionMetadataKey];

  if (!isRecord(value)) {
    return undefined;
  }

  const requiredFields = parseObjectFields(value, selectionMetadataFieldParsers);
  const selectedPatternsValue = value.selectedPatterns;
  if (requiredFields === undefined || !Array.isArray(selectedPatternsValue)) {
    return undefined;
  }

  const selectedPatterns = selectedPatternsValue.flatMap((item) => {
    const parsed = planItemFromMetadata(item);

    return parsed === undefined ? [] : [parsed];
  });

  if (selectedPatterns.length !== selectedPatternsValue.length) {
    return undefined;
  }
  const targetFitSummary =
    parseTargetFitSummary(value.targetFitSummary) ?? summarizeTargetFit(selectedPatterns);

  return {
    ...requiredFields,
    selectedPatterns,
    targetFitSummary,
    recommendedNextAction:
      parseNonEmptyString(value.recommendedNextAction) ?? targetFitSummary.recommendedUse,
    proof: proofFromRecord(value.proof)
  };
};

export const formatRetainedPatternSelectionLines = (
  selection: RetainedPatternPlanSelection | undefined
): string[] => {
  if (selection === undefined) {
    return [
      "Retained pattern selection: unavailable",
      "Retained pattern reason: no retained pattern metadata was present"
    ];
  }

  return [
    `Retained pattern selection: ${selection.status}`,
    `Retained pattern query: ${selection.query}`,
    `Retained pattern IDs: ${
      selection.selectedPatternIds.length === 0 ? "none" : selection.selectedPatternIds.join(", ")
    }`,
    `Retained pattern targetFit: ${selection.targetFitSummary.verdict}`,
    `Retained pattern recommended use: ${selection.recommendedNextAction}`,
    ...selection.selectedPatterns.map((pattern) =>
      [
        `- pattern=${pattern.patternId}`,
        `card=${pattern.id}`,
        `reviewability=${pattern.reviewability}`,
        `targetFit=${pattern.targetFit}`,
        `title=${pattern.title}`,
        `nextAction=${pattern.nextAction}`
      ].join(" | ")
    ),
    `Retained pattern reason: ${selection.reason}`,
    `Retained pattern does not prove: ${selection.doesNotProve}`
  ];
};
