import type {
  ActivationRetrievalDiagnostics,
  ActivationRetrievalInputStatus
} from "./types.js";

const doesNotProve =
  "Activation diagnostics do not prove selected context is sufficient, source truth is correct, vector/hybrid activation is active, or ranking quality is good.";

interface BuildActivationRetrievalDiagnosticsInput {
  projectScoped: boolean;
  memoryRecordCount: number;
  sourceClaimCount: number;
  searchResultCount: number;
  ownerFileCandidateCount: number;
  antiMemoryRecordCount: number;
  mergedCandidateCount: number;
  targetReadModelStatus: ActivationRetrievalDiagnostics["targetReadModelStatus"];
  sourceSeedCount: number;
  targetOwnerFileCount: number;
  trustExclusionCount: number;
}

const inputStatusFor = (
  input: BuildActivationRetrievalDiagnosticsInput
): ActivationRetrievalInputStatus => {
  if (!input.projectScoped) {
    return "missing_project_scope";
  }

  if (input.mergedCandidateCount > 0) {
    return "candidates_available";
  }

  const storedInputCount =
    input.memoryRecordCount +
    input.sourceClaimCount +
    input.searchResultCount +
    input.antiMemoryRecordCount;

  if (storedInputCount === 0 && input.ownerFileCandidateCount === 0) {
    return "empty_activation_store";
  }

  return "no_matching_candidates";
};

export const buildActivationRetrievalDiagnostics = (
  input: BuildActivationRetrievalDiagnosticsInput
): ActivationRetrievalDiagnostics => ({
  projectScoped: input.projectScoped,
  inputStatus: inputStatusFor(input),
  searchMode: "lexical",
  memoryRecordCount: input.memoryRecordCount,
  sourceClaimCount: input.sourceClaimCount,
  searchResultCount: input.searchResultCount,
  ownerFileCandidateCount: input.ownerFileCandidateCount,
  antiMemoryRecordCount: input.antiMemoryRecordCount,
  mergedCandidateCount: input.mergedCandidateCount,
  targetReadModelStatus: input.targetReadModelStatus,
  sourceSeedCount: input.sourceSeedCount,
  targetOwnerFileCount: input.targetOwnerFileCount,
  trustExclusionCount: input.trustExclusionCount,
  doesNotProve
});

const numberField = (
  record: Record<string, unknown>,
  key: keyof ActivationRetrievalDiagnostics
): number | undefined => {
  const value = record[key];

  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : undefined;
};

const booleanField = (
  record: Record<string, unknown>,
  key: keyof ActivationRetrievalDiagnostics
): boolean | undefined => {
  const value = record[key];

  return typeof value === "boolean" ? value : undefined;
};

const stringField = (
  record: Record<string, unknown>,
  key: keyof ActivationRetrievalDiagnostics
): string | undefined => {
  const value = record[key];

  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

const inputStatuses = new Set<ActivationRetrievalDiagnostics["inputStatus"]>([
  "candidates_available",
  "missing_project_scope",
  "empty_activation_store",
  "no_matching_candidates"
]);

const targetReadModelStatuses = new Set<ActivationRetrievalDiagnostics["targetReadModelStatus"]>([
  "not_provided",
  "provided"
]);

const searchModes = new Set<ActivationRetrievalDiagnostics["searchMode"]>([
  "lexical"
]);

const diagnosticsNumberFieldKeys = [
  "memoryRecordCount",
  "sourceClaimCount",
  "searchResultCount",
  "ownerFileCandidateCount",
  "antiMemoryRecordCount",
  "mergedCandidateCount",
  "sourceSeedCount",
  "targetOwnerFileCount",
  "trustExclusionCount"
] as const satisfies readonly (keyof ActivationRetrievalDiagnostics)[];

type DiagnosticsNumberFieldKey = (typeof diagnosticsNumberFieldKeys)[number];

const enumStringField = <TValue extends string>(
  record: Record<string, unknown>,
  key: keyof ActivationRetrievalDiagnostics,
  allowedValues: ReadonlySet<TValue>
): TValue | undefined => {
  const value = stringField(record, key);

  return value !== undefined && allowedValues.has(value as TValue)
    ? value as TValue
    : undefined;
};

const numberFields = (
  record: Record<string, unknown>
): Record<DiagnosticsNumberFieldKey, number> | undefined => {
  const entries = diagnosticsNumberFieldKeys.map((key) => [key, numberField(record, key)] as const);

  if (entries.some(([, value]) => value === undefined)) {
    return undefined;
  }

  return Object.fromEntries(entries) as Record<DiagnosticsNumberFieldKey, number>;
};

export const activationRetrievalDiagnosticsFromMetadata = (
  metadata: Record<string, unknown> | undefined
): ActivationRetrievalDiagnostics | undefined => {
  const value = metadata?.activationRetrievalDiagnostics;

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const inputStatus = enumStringField(record, "inputStatus", inputStatuses);
  const searchMode = enumStringField(record, "searchMode", searchModes);
  const targetReadModelStatus = enumStringField(
    record,
    "targetReadModelStatus",
    targetReadModelStatuses
  );
  const projectScoped = booleanField(record, "projectScoped");
  const counts = numberFields(record);
  const parsedDoesNotProve = stringField(record, "doesNotProve");

  if (
    projectScoped === undefined ||
    inputStatus === undefined ||
    searchMode === undefined ||
    targetReadModelStatus === undefined ||
    counts === undefined ||
    parsedDoesNotProve === undefined
  ) {
    return undefined;
  }

  return {
    projectScoped,
    inputStatus,
    searchMode,
    ...counts,
    targetReadModelStatus,
    doesNotProve: parsedDoesNotProve
  };
};

export const formatActivationRetrievalDiagnostics = (
  diagnostics: ActivationRetrievalDiagnostics
): string[] => [
  "Activation diagnostics:",
  `- inputStatus: ${diagnostics.inputStatus}`,
  `- searchMode: ${diagnostics.searchMode}`,
  [
    "- counts:",
    `memory=${diagnostics.memoryRecordCount}`,
    `sourceClaims=${diagnostics.sourceClaimCount}`,
    `search=${diagnostics.searchResultCount}`,
    `ownerFile=${diagnostics.ownerFileCandidateCount}`,
    `antiMemory=${diagnostics.antiMemoryRecordCount}`,
    `merged=${diagnostics.mergedCandidateCount}`
  ].join(" "),
  [
    "- targetReadModel:",
    diagnostics.targetReadModelStatus,
    `sourceSeeds=${diagnostics.sourceSeedCount}`,
    `ownerFiles=${diagnostics.targetOwnerFileCount}`,
    `trustExclusions=${diagnostics.trustExclusionCount}`
  ].join(" "),
  `- doesNotProve: ${diagnostics.doesNotProve}`
];
