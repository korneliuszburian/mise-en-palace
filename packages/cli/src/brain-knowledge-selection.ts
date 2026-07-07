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

export type BrainKnowledgePlanSelectionStatus =
  | "selected"
  | "rejected_or_deferred"
  | "unavailable";

export interface BrainKnowledgePlanItem {
  id: string;
  knowledgeId: string;
  title: string;
  reviewability: BrainKnowledgeReviewability;
  nextAction: BrainKnowledgeNextAction;
  doesNotProve: string;
  targetFit: TargetFit;
  targetFitReasons: readonly string[];
}

export interface BrainKnowledgePlanSelection {
  kind: "krn.brainKnowledgePlanSelection.v1";
  status: BrainKnowledgePlanSelectionStatus;
  query: string;
  source: "brain_knowledge_catalog";
  selectedKnowledgeIds: string[];
  selectedKnowledge: BrainKnowledgePlanItem[];
  targetFitSummary: TargetFitSummary;
  recommendedNextAction: string;
  reason: string;
  doesNotProve: string;
  proof: {
    proves: string[];
    doesNotProve: string[];
  };
}

export const brainKnowledgePlanSelectionMetadataKey = "brainKnowledgeSelection";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

type FieldParsers<T extends object> = {
  [Key in keyof T]-?: (record: Record<string, unknown>) => T[Key] | undefined;
};

type BrainKnowledgePlanItemFields = Omit<
  BrainKnowledgePlanItem,
  "knowledgeId" | "targetFit" | "targetFitReasons"
>;

type BrainKnowledgePlanSelectionMetadataFields = Pick<
  BrainKnowledgePlanSelection,
  "kind" | "status" | "query" | "source" | "selectedKnowledgeIds" | "reason" | "doesNotProve"
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
): value is BrainKnowledgePlanSelectionStatus =>
  typeof value === "string" && selectionStatuses.has(value);

const isSelectionSource = (
  value: unknown
): value is BrainKnowledgePlanSelection["source"] =>
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

const planItemFieldParsers: FieldParsers<BrainKnowledgePlanItemFields> = {
  id: (record) => parseNonEmptyString(record["id"]),
  title: (record) => parseNonEmptyString(record["title"]),
  reviewability: (record) =>
    isPlanItemReviewability(record["reviewability"]) ? record["reviewability"] : undefined,
  nextAction: (record) =>
    isPlanItemNextAction(record["nextAction"]) ? record["nextAction"] : undefined,
  doesNotProve: (record) => parseNonEmptyString(record["doesNotProve"])
};

const selectionMetadataFieldParsers: FieldParsers<BrainKnowledgePlanSelectionMetadataFields> = {
  kind: (record) =>
    record["kind"] === "krn.brainKnowledgePlanSelection.v1"
      ? "krn.brainKnowledgePlanSelection.v1"
      : undefined,
  status: (record) =>
    isSelectionStatus(record["status"]) ? record["status"] : undefined,
  query: (record) => parseNonEmptyString(record["query"]),
  source: (record) =>
    isSelectionSource(record["source"]) ? record["source"] : undefined,
  selectedKnowledgeIds: (record) => parseStringArray(record["selectedKnowledgeIds"]),
  reason: (record) => parseNonEmptyString(record["reason"]),
  doesNotProve: (record) => parseNonEmptyString(record["doesNotProve"])
};

const knowledgeIdFromCardId = (id: string): string =>
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
  knowledgeId: string | undefined
): BrainKnowledgePlanItem | undefined => {
  const requiredFields = parseObjectFields(record, planItemFieldParsers);

  if (requiredFields === undefined) {
    return undefined;
  }

  return {
    ...requiredFields,
    knowledgeId: knowledgeId ?? knowledgeIdFromCardId(requiredFields.id),
    targetFit: isPlanItemTargetFit(record["targetFit"]) ? record["targetFit"] : "unknown",
    targetFitReasons: parseStringArray(record["targetFitReasons"]) ?? [
      "target-fit metadata was not present on this brain knowledge item."
    ]
  };
};

const planItemFromCard = (
  value: unknown,
  query: string
): BrainKnowledgePlanItem | undefined => {
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
      emptyTextReason: "brain knowledge card has no classifiable target-fit text."
    })
  };
};

const proofFromRecord = (
  value: unknown
): BrainKnowledgePlanSelection["proof"] => {
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

export const brainKnowledgeSelectionFromReadbackJson = (
  query: string,
  text: string
): BrainKnowledgePlanSelection => {
  const parsed: unknown = JSON.parse(text);
  const record = isRecord(parsed) ? parsed : undefined;
  const cards = Array.isArray(record?.cards) ? record.cards : [];
  const selectedKnowledge = cards.flatMap((card) => {
    const item = planItemFromCard(card, query);

    return item === undefined ? [] : [item];
  });
  const targetFitSummary = summarizeTargetFit(selectedKnowledge);

  if (selectedKnowledge.length === 0) {
    return {
      kind: "krn.brainKnowledgePlanSelection.v1",
      status: "rejected_or_deferred",
      query,
      source: "brain_knowledge_catalog",
      selectedKnowledgeIds: [],
      selectedKnowledge: [],
      targetFitSummary,
      recommendedNextAction: targetFitSummary.recommendedUse,
      reason: "No brain knowledge matched the pre-coding plan query.",
      doesNotProve:
        "No matched brain knowledge does not prove no relevant knowledge exists; it proves only that this catalog readback did not select one.",
      proof: proofFromRecord(record?.proof)
    };
  }

  return {
    kind: "krn.brainKnowledgePlanSelection.v1",
    status: "selected",
    query,
    source: "brain_knowledge_catalog",
    selectedKnowledgeIds: selectedKnowledge.map((knowledge) => knowledge.knowledgeId),
    selectedKnowledge,
    targetFitSummary,
    recommendedNextAction: targetFitSummary.recommendedUse,
    reason: "Brain knowledge matched the pre-coding plan query.",
    doesNotProve:
      "Selected brain knowledge does not prove implementation correctness, source truth, ranking quality, or product readiness.",
    proof: proofFromRecord(record?.proof)
  };
};

export const unavailableBrainKnowledgeSelection = (
  query: string,
  reason: string
): BrainKnowledgePlanSelection => {
  const targetFitSummary = summarizeTargetFit([]);

  return {
    kind: "krn.brainKnowledgePlanSelection.v1",
    status: "unavailable",
    query,
    source: "brain_knowledge_catalog",
    selectedKnowledgeIds: [],
    selectedKnowledge: [],
    targetFitSummary,
    recommendedNextAction: targetFitSummary.recommendedUse,
    reason,
    doesNotProve:
      "Unavailable brain knowledge readback does not prove no relevant knowledge exists; run brain knowledge readback before making selection claims.",
    proof: {
      proves: ["plan recorded an explicit brain-knowledge readback failure"],
      doesNotProve: [
        "brain knowledge catalog completeness",
        "knowledge relevance",
        "implementation correctness"
      ]
    }
  }
};

const planItemFromMetadata = (value: unknown): BrainKnowledgePlanItem | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const knowledgeId = parseNonEmptyString(value["knowledgeId"]);

  return knowledgeId === undefined ? undefined : planItemFromRecord(value, knowledgeId);
};

export const brainKnowledgeSelectionFromMetadata = (
  metadata: Record<string, unknown> | undefined
): BrainKnowledgePlanSelection | undefined => {
  const value = metadata?.[brainKnowledgePlanSelectionMetadataKey];

  if (!isRecord(value)) {
    return undefined;
  }

  const requiredFields = parseObjectFields(value, selectionMetadataFieldParsers);
  const selectedKnowledgeValue = value.selectedKnowledge;
  if (requiredFields === undefined || !Array.isArray(selectedKnowledgeValue)) {
    return undefined;
  }

  const selectedKnowledge = selectedKnowledgeValue.flatMap((item) => {
    const parsed = planItemFromMetadata(item);

    return parsed === undefined ? [] : [parsed];
  });

  if (selectedKnowledge.length !== selectedKnowledgeValue.length) {
    return undefined;
  }
  const targetFitSummary =
    parseTargetFitSummary(value.targetFitSummary) ?? summarizeTargetFit(selectedKnowledge);

  return {
    ...requiredFields,
    selectedKnowledge,
    targetFitSummary,
    recommendedNextAction:
      parseNonEmptyString(value.recommendedNextAction) ?? targetFitSummary.recommendedUse,
    proof: proofFromRecord(value.proof)
  };
};

export const formatBrainKnowledgeSelectionLines = (
  selection: BrainKnowledgePlanSelection | undefined
): string[] => {
  if (selection === undefined) {
    return [
      "Brain knowledge selection: unavailable",
      "Brain knowledge reason: no brain knowledge metadata was present"
    ];
  }

  return [
    `Brain knowledge selection: ${selection.status}`,
    `Brain knowledge query: ${selection.query}`,
    `Brain knowledge IDs: ${
      selection.selectedKnowledgeIds.length === 0 ? "none" : selection.selectedKnowledgeIds.join(", ")
    }`,
    `Brain knowledge targetFit: ${selection.targetFitSummary.verdict}`,
    `Brain knowledge recommended use: ${selection.recommendedNextAction}`,
    ...selection.selectedKnowledge.map((knowledge) =>
      [
        `- knowledge=${knowledge.knowledgeId}`,
        `card=${knowledge.id}`,
        `reviewability=${knowledge.reviewability}`,
        `targetFit=${knowledge.targetFit}`,
        `title=${knowledge.title}`,
        `nextAction=${knowledge.nextAction}`
      ].join(" | ")
    ),
    `Brain knowledge reason: ${selection.reason}`,
    `Brain knowledge does not prove: ${selection.doesNotProve}`
  ];
};
