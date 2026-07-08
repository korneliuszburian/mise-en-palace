import type {
  KnowledgeNextAction,
  KnowledgeReviewability
} from "@krn/harness";
import {
  knowledgeNextActionValues,
  knowledgeReviewabilityValues
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

export type KnowledgePlanSelectionStatus =
  | "selected"
  | "rejected_or_deferred"
  | "unavailable";

export type KnowledgePlanSelectionSource =
  | "knowledge_catalog"
  | "memory_store";

export interface KnowledgePlanItem {
  id: string;
  knowledgeId: string;
  title: string;
  reviewability: KnowledgeReviewability;
  nextAction: KnowledgeNextAction;
  doesNotProve: string;
  targetFit: TargetFit;
  targetFitReasons: readonly string[];
}

export interface KnowledgePlanSelection {
  kind: "krn.knowledge.selection.v1";
  status: KnowledgePlanSelectionStatus;
  query: string;
  source: KnowledgePlanSelectionSource;
  selectedKnowledgeIds: string[];
  selectedKnowledge: KnowledgePlanItem[];
  targetFitSummary: TargetFitSummary;
  recommendedNextAction: string;
  reason: string;
  doesNotProve: string;
  proof: {
    proves: string[];
    doesNotProve: string[];
  };
}

export const knowledgePlanSelectionMetadataKey = "knowledgeSelection";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

type FieldParsers<T extends object> = {
  [Key in keyof T]-?: (record: Record<string, unknown>) => T[Key] | undefined;
};

type KnowledgePlanItemFields = Omit<
  KnowledgePlanItem,
  "knowledgeId" | "targetFit" | "targetFitReasons"
>;

type KnowledgePlanSelectionMetadataFields = Pick<
  KnowledgePlanSelection,
  "kind" | "status" | "query" | "source" | "selectedKnowledgeIds" | "reason" | "doesNotProve"
>;

const selectionStatuses = new Set<string>([
  "selected",
  "rejected_or_deferred",
  "unavailable"
]);

const selectionSources = new Set<string>([
  "knowledge_catalog",
  "memory_store"
]);

const planItemReviewabilities = new Set<string>(
  knowledgeReviewabilityValues
);

const planItemNextActions = new Set<string>(
  knowledgeNextActionValues
);

const planItemTargetFits = new Set<string>(targetFitValues);

const parseNonEmptyString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const isSelectionStatus = (
  value: unknown
): value is KnowledgePlanSelectionStatus =>
  typeof value === "string" && selectionStatuses.has(value);

const isSelectionSource = (
  value: unknown
): value is KnowledgePlanSelection["source"] =>
  typeof value === "string" && selectionSources.has(value);

const isPlanItemReviewability = (
  value: unknown
): value is KnowledgeReviewability =>
  typeof value === "string" && planItemReviewabilities.has(value);

const isPlanItemNextAction = (
  value: unknown
): value is KnowledgeNextAction =>
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

const planItemFieldParsers: FieldParsers<KnowledgePlanItemFields> = {
  id: (record) => parseNonEmptyString(record["id"]),
  title: (record) => parseNonEmptyString(record["title"]),
  reviewability: (record) =>
    isPlanItemReviewability(record["reviewability"]) ? record["reviewability"] : undefined,
  nextAction: (record) =>
    isPlanItemNextAction(record["nextAction"]) ? record["nextAction"] : undefined,
  doesNotProve: (record) => parseNonEmptyString(record["doesNotProve"])
};

const selectionMetadataFieldParsers: FieldParsers<KnowledgePlanSelectionMetadataFields> = {
  kind: (record) =>
    record["kind"] === "krn.knowledge.selection.v1"
      ? "krn.knowledge.selection.v1"
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

const knowledgeIdFromReadModelId = (id: string): string =>
  id.startsWith("knowledge:") ? id.slice("knowledge:".length) : id;

const readModelTargetFitText = (record: Record<string, unknown>): string =>
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
): KnowledgePlanItem | undefined => {
  const requiredFields = parseObjectFields(record, planItemFieldParsers);

  if (requiredFields === undefined) {
    return undefined;
  }

  return {
    ...requiredFields,
    knowledgeId: knowledgeId ?? knowledgeIdFromReadModelId(requiredFields.id),
    targetFit: isPlanItemTargetFit(record["targetFit"]) ? record["targetFit"] : "unknown",
    targetFitReasons: parseStringArray(record["targetFitReasons"]) ?? [
      "target-fit metadata was not present on this knowledge read model."
    ]
  };
};

const planItemFromReadModel = (
  value: unknown,
  query: string
): KnowledgePlanItem | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const item = planItemFromRecord(value, undefined);

  if (item === undefined) {
    return undefined;
  }

  // Target fit is query-relative plan evidence; selectedKnowledge readModels do not own it.
  return {
    ...item,
    ...classifyTargetFit({
      query,
      text: readModelTargetFitText(value),
      emptyTextReason: "knowledge read model has no classifiable target-fit text."
    })
  };
};

const proofFromRecord = (
  value: unknown
): KnowledgePlanSelection["proof"] => {
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

const selectionSourceFromReadback = (
  record: Record<string, unknown> | undefined
): KnowledgePlanSelectionSource =>
  record?.["source"] === "memory_store" ? "memory_store" : "knowledge_catalog";

const readbackLabelFor = (source: KnowledgePlanSelectionSource): string =>
  source === "memory_store" ? "memory-store readback" : "catalog readback";

export const knowledgeSelectionFromReadbackJson = (
  query: string,
  text: string
): KnowledgePlanSelection => {
  const parsed: unknown = JSON.parse(text);
  const record = isRecord(parsed) ? parsed : undefined;
  const source = selectionSourceFromReadback(record);
  const readModels = Array.isArray(record?.readModels) ? record.readModels : [];
  const selectedKnowledge = readModels.flatMap((readModel) => {
    const item = planItemFromReadModel(readModel, query);

    return item === undefined ? [] : [item];
  });
  const targetFitSummary = summarizeTargetFit(selectedKnowledge);

  if (selectedKnowledge.length === 0) {
    return {
      kind: "krn.knowledge.selection.v1",
      status: "rejected_or_deferred",
      query,
      source,
      selectedKnowledgeIds: [],
      selectedKnowledge: [],
      targetFitSummary,
      recommendedNextAction: targetFitSummary.recommendedUse,
      reason: "No knowledge read model matched the pre-coding plan query.",
      doesNotProve:
        `No matched knowledge read model does not prove no relevant knowledge exists; it proves only that this ${readbackLabelFor(source)} did not select one.`,
      proof: proofFromRecord(record?.proof)
    };
  }

  return {
    kind: "krn.knowledge.selection.v1",
    status: "selected",
    query,
    source,
    selectedKnowledgeIds: selectedKnowledge.map((knowledge) => knowledge.knowledgeId),
    selectedKnowledge,
    targetFitSummary,
    recommendedNextAction: targetFitSummary.recommendedUse,
    reason: "Knowledge read model matched the pre-coding plan query.",
    doesNotProve:
      "Selected knowledge does not prove implementation correctness, source truth, ranking quality, or product readiness.",
    proof: proofFromRecord(record?.proof)
  };
};

export const unavailableKnowledgeSelection = (
  query: string,
  reason: string,
  source: KnowledgePlanSelectionSource = "memory_store"
): KnowledgePlanSelection => {
  const targetFitSummary = summarizeTargetFit([]);

  return {
    kind: "krn.knowledge.selection.v1",
    status: "unavailable",
    query,
    source,
    selectedKnowledgeIds: [],
    selectedKnowledge: [],
    targetFitSummary,
    recommendedNextAction: targetFitSummary.recommendedUse,
    reason,
    doesNotProve:
      "Unavailable brain recall readback does not prove no relevant knowledge exists; run brain recall readback before making selection claims.",
    proof: {
      proves: ["plan recorded an explicit brain recall readback failure"],
      doesNotProve: [
        "brain recall catalog completeness",
        "knowledge relevance",
        "implementation correctness"
      ]
    }
  }
};

const planItemFromMetadata = (value: unknown): KnowledgePlanItem | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const knowledgeId = parseNonEmptyString(value["knowledgeId"]);

  return knowledgeId === undefined ? undefined : planItemFromRecord(value, knowledgeId);
};

export const knowledgeSelectionFromMetadata = (
  metadata: Record<string, unknown> | undefined
): KnowledgePlanSelection | undefined => {
  const value = metadata?.[knowledgePlanSelectionMetadataKey];

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

export const formatKnowledgeSelectionLines = (
  selection: KnowledgePlanSelection | undefined
): string[] => {
  if (selection === undefined) {
    return [
      "Selected KRN context: unavailable",
      "Selected KRN context reason: no selected knowledge metadata was present"
    ];
  }

  return [
    `Selected KRN context: ${selection.status}`,
    `Selected KRN context query: ${selection.query}`,
    `Selected KRN context IDs: ${
      selection.selectedKnowledgeIds.length === 0 ? "none" : selection.selectedKnowledgeIds.join(", ")
    }`,
    `Selected KRN context targetFit: ${selection.targetFitSummary.verdict}`,
    `Selected KRN context recommended use: ${selection.recommendedNextAction}`,
    ...selection.selectedKnowledge.map((knowledge) =>
      [
        `- knowledge=${knowledge.knowledgeId}`,
        `readModel=${knowledge.id}`,
        `reviewability=${knowledge.reviewability}`,
        `targetFit=${knowledge.targetFit}`,
        `title=${knowledge.title}`,
        `nextAction=${knowledge.nextAction}`
      ].join(" | ")
    ),
    `Selected KRN context reason: ${selection.reason}`,
    `Selected KRN context does not prove: ${selection.doesNotProve}`
  ];
};
