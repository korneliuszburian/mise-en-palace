export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const requiredString = (
  record: Record<string, unknown>,
  key: string,
  label: string
): string => {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label}.${key} must be a non-empty string`);
  }

  return value;
};

export const requiredFiniteNumber = (
  record: Record<string, unknown>,
  key: string,
  label: string
): number => {
  const value = record[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label}.${key} must be a finite number`);
  }

  return value;
};

export const requiredStringArray = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly string[] => {
  const value = record[key];

  if (!Array.isArray(value)) {
    throw new Error(`${label}.${key} must be a string array`);
  }

  return value.map((item, index) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new Error(`${label}.${key}[${index}] must be a non-empty string`);
    }

    return item;
  });
};

export const requiredNonEmptyStringArray = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly string[] => {
  const values = requiredStringArray(record, key, label);

  if (values.length === 0) {
    throw new Error(`${label}.${key} must be a non-empty string array`);
  }

  return values;
};

export const recordArray = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly Record<string, unknown>[] => {
  const value = record[key];

  if (!Array.isArray(value)) {
    throw new Error(`${label}.${key} must be an array`);
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`${label}.${key}[${index}] must be an object`);
    }

    return item;
  });
};

export interface EvalKnowledgeReadModelFixture {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly consumers: readonly string[];
  readonly falsifier: string;
  readonly doesNotProve: string;
  readonly nextAction: string;
}

export interface EvalSourceClaimFixture {
  readonly sourceClaimId: string;
  readonly claim: string;
  readonly mechanism: string;
  readonly krnImplication: string;
  readonly consumer: string;
  readonly falsifier: string;
  readonly doesNotProve: string;
}

export interface BrainSearchPreviewSections {
  readonly selectedKnowledge: readonly Record<string, unknown>[];
  readonly sourceSearch: Record<string, unknown>;
}

const parseEvalKnowledgeReadModel = (
  value: Record<string, unknown>,
  label: string
): EvalKnowledgeReadModelFixture => ({
  id: requiredString(value, "id", label),
  title: requiredString(value, "title", label),
  summary: requiredString(value, "summary", label),
  consumers: requiredNonEmptyStringArray(value, "consumers", label),
  falsifier: requiredString(value, "falsifier", label),
  doesNotProve: requiredString(value, "doesNotProve", label),
  nextAction: requiredString(value, "nextAction", label)
});

const parseEvalSourceClaim = (
  value: Record<string, unknown>,
  label: string
): EvalSourceClaimFixture => ({
  sourceClaimId: requiredString(value, "sourceClaimId", label),
  claim: requiredString(value, "claim", label),
  mechanism: requiredString(value, "mechanism", label),
  krnImplication: requiredString(value, "krnImplication", label),
  consumer: requiredString(value, "consumer", label),
  falsifier: requiredString(value, "falsifier", label),
  doesNotProve: requiredString(value, "doesNotProve", label)
});

export const parseEvalKnowledgeReadModels = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly EvalKnowledgeReadModelFixture[] =>
  recordArray(record, key, label).map((readModel, index) =>
    parseEvalKnowledgeReadModel(readModel, `${label}.${key}[${index}]`)
  );

export const parseEvalSourceClaims = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly EvalSourceClaimFixture[] =>
  recordArray(record, key, label).map((claim, index) =>
    parseEvalSourceClaim(claim, `${label}.${key}[${index}]`)
  );

export const parseBrainSearchPreviewSections = (
  stdout: string,
  label: string
): BrainSearchPreviewSections => {
  const parsed: unknown = JSON.parse(stdout);

  if (!isRecord(parsed) || parsed["kind"] !== "krn.memorySearch.preview.v1") {
    throw new Error(`${label} did not return a memory search preview`);
  }

  const knowledgeReadModels = parsed["knowledgeReadModels"];
  const sourceSearch = parsed["sourceSearch"];

  if (!isRecord(knowledgeReadModels) || !isRecord(sourceSearch)) {
    throw new Error(`${label} memory search preview is missing readback sections`);
  }

  return {
    selectedKnowledge: recordArray(
      knowledgeReadModels,
      "selectedKnowledge",
      `${label}.knowledgeReadModels`
    ),
    sourceSearch
  };
};
