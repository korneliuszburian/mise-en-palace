export type RetainedPatternPlanSelectionStatus =
  | "selected"
  | "rejected_or_deferred"
  | "unavailable";

export interface RetainedPatternPlanItem {
  id: string;
  patternId: string;
  title: string;
  reviewability: string;
  nextAction: string;
  doesNotProve: string;
}

export interface RetainedPatternPlanSelection {
  kind: "krn.retainedPatternPlanSelection.v1";
  status: RetainedPatternPlanSelectionStatus;
  query: string;
  source: "brain_knowledge_catalog";
  selectedPatternIds: string[];
  selectedPatterns: RetainedPatternPlanItem[];
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

const stringField = (
  record: Record<string, unknown>,
  field: string
): string | undefined => {
  const value = record[field];

  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

const stringArrayField = (
  record: Record<string, unknown>,
  field: string
): string[] | undefined => {
  const value = record[field];

  if (!Array.isArray(value)) {
    return undefined;
  }

  const strings = value.filter((item): item is string => typeof item === "string");

  return strings.length === value.length ? strings : undefined;
};

const patternIdFromCardId = (id: string): string =>
  id.startsWith("pattern:") ? id.slice("pattern:".length) : id;

const planItemFromRecord = (
  record: Record<string, unknown>,
  patternId: string | undefined
): RetainedPatternPlanItem | undefined => {
  const id = stringField(record, "id");
  const title = stringField(record, "title");
  const reviewability = stringField(record, "reviewability");
  const nextAction = stringField(record, "nextAction");
  const doesNotProve = stringField(record, "doesNotProve");

  if (
    id === undefined ||
    title === undefined ||
    reviewability === undefined ||
    nextAction === undefined ||
    doesNotProve === undefined
  ) {
    return undefined;
  }

  return {
    id,
    patternId: patternId ?? patternIdFromCardId(id),
    title,
    reviewability,
    nextAction,
    doesNotProve
  };
};

const planItemFromCard = (value: unknown): RetainedPatternPlanItem | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  return planItemFromRecord(value, undefined);
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
    proves: stringArrayField(value, "proves") ?? [],
    doesNotProve: stringArrayField(value, "doesNotProve") ?? []
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
    const item = planItemFromCard(card);

    return item === undefined ? [] : [item];
  });

  if (selectedPatterns.length === 0) {
    return {
      kind: "krn.retainedPatternPlanSelection.v1",
      status: "rejected_or_deferred",
      query,
      source: "brain_knowledge_catalog",
      selectedPatternIds: [],
      selectedPatterns: [],
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
    reason: "Retained brain knowledge matched the pre-coding plan query.",
    doesNotProve:
      "Selected retained patterns do not prove implementation correctness, source truth, ranking quality, or product readiness.",
    proof: proofFromRecord(record?.proof)
  };
};

export const unavailableRetainedPatternSelection = (
  query: string,
  reason: string
): RetainedPatternPlanSelection => ({
  kind: "krn.retainedPatternPlanSelection.v1",
  status: "unavailable",
  query,
  source: "brain_knowledge_catalog",
  selectedPatternIds: [],
  selectedPatterns: [],
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
});

const planItemFromMetadata = (value: unknown): RetainedPatternPlanItem | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const patternId = stringField(value, "patternId");

  return patternId === undefined ? undefined : planItemFromRecord(value, patternId);
};

export const retainedPatternSelectionFromMetadata = (
  metadata: Record<string, unknown> | undefined
): RetainedPatternPlanSelection | undefined => {
  const value = metadata?.[retainedPatternPlanSelectionMetadataKey];

  if (!isRecord(value)) {
    return undefined;
  }

  const kind = stringField(value, "kind");
  const status = stringField(value, "status");
  const query = stringField(value, "query");
  const source = stringField(value, "source");
  const reason = stringField(value, "reason");
  const doesNotProve = stringField(value, "doesNotProve");
  const selectedPatternIds = stringArrayField(value, "selectedPatternIds");
  const selectedPatternsValue = value.selectedPatterns;
  const selectedPatterns = Array.isArray(selectedPatternsValue)
    ? selectedPatternsValue.flatMap((item) => {
      const parsed = planItemFromMetadata(item);

      return parsed === undefined ? [] : [parsed];
    })
    : undefined;

  if (
    kind !== "krn.retainedPatternPlanSelection.v1" ||
    (status !== "selected" && status !== "rejected_or_deferred" && status !== "unavailable") ||
    query === undefined ||
    source !== "brain_knowledge_catalog" ||
    reason === undefined ||
    doesNotProve === undefined ||
    selectedPatternIds === undefined ||
    selectedPatterns === undefined
  ) {
    return undefined;
  }

  return {
    kind,
    status,
    query,
    source,
    selectedPatternIds,
    selectedPatterns,
    reason,
    doesNotProve,
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
    ...selection.selectedPatterns.map((pattern) =>
      [
        `- pattern=${pattern.patternId}`,
        `card=${pattern.id}`,
        `reviewability=${pattern.reviewability}`,
        `title=${pattern.title}`,
        `nextAction=${pattern.nextAction}`
      ].join(" | ")
    ),
    `Retained pattern reason: ${selection.reason}`,
    `Retained pattern does not prove: ${selection.doesNotProve}`
  ];
};
