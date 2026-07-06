import type {
  ActivationRetrievalDiagnostics,
  ActivationRetrievalInputStatus
} from "./types.js";

const doesNotProve =
  "Activation diagnostics do not prove selected context is sufficient, source truth is correct, or ranking quality is good.";

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

export const activationRetrievalDiagnosticsFromMetadata = (
  metadata: Record<string, unknown> | undefined
): ActivationRetrievalDiagnostics | undefined => {
  const value = metadata?.activationRetrievalDiagnostics;

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const inputStatus = stringField(record, "inputStatus");
  const targetReadModelStatus = stringField(record, "targetReadModelStatus");
  const projectScoped = booleanField(record, "projectScoped");
  const memoryRecordCount = numberField(record, "memoryRecordCount");
  const sourceClaimCount = numberField(record, "sourceClaimCount");
  const searchResultCount = numberField(record, "searchResultCount");
  const ownerFileCandidateCount = numberField(record, "ownerFileCandidateCount");
  const antiMemoryRecordCount = numberField(record, "antiMemoryRecordCount");
  const mergedCandidateCount = numberField(record, "mergedCandidateCount");
  const sourceSeedCount = numberField(record, "sourceSeedCount");
  const targetOwnerFileCount = numberField(record, "targetOwnerFileCount");
  const trustExclusionCount = numberField(record, "trustExclusionCount");
  const parsedDoesNotProve = stringField(record, "doesNotProve");

  if (
    projectScoped === undefined ||
    inputStatus === undefined ||
    !inputStatuses.has(inputStatus as ActivationRetrievalDiagnostics["inputStatus"]) ||
    targetReadModelStatus === undefined ||
    !targetReadModelStatuses.has(
      targetReadModelStatus as ActivationRetrievalDiagnostics["targetReadModelStatus"]
    ) ||
    memoryRecordCount === undefined ||
    sourceClaimCount === undefined ||
    searchResultCount === undefined ||
    ownerFileCandidateCount === undefined ||
    antiMemoryRecordCount === undefined ||
    mergedCandidateCount === undefined ||
    sourceSeedCount === undefined ||
    targetOwnerFileCount === undefined ||
    trustExclusionCount === undefined ||
    parsedDoesNotProve === undefined
  ) {
    return undefined;
  }

  return {
    projectScoped,
    inputStatus: inputStatus as ActivationRetrievalDiagnostics["inputStatus"],
    memoryRecordCount,
    sourceClaimCount,
    searchResultCount,
    ownerFileCandidateCount,
    antiMemoryRecordCount,
    mergedCandidateCount,
    targetReadModelStatus:
      targetReadModelStatus as ActivationRetrievalDiagnostics["targetReadModelStatus"],
    sourceSeedCount,
    targetOwnerFileCount,
    trustExclusionCount,
    doesNotProve: parsedDoesNotProve
  };
};

export const formatActivationRetrievalDiagnostics = (
  diagnostics: ActivationRetrievalDiagnostics
): string[] => [
  "Activation diagnostics:",
  `- inputStatus: ${diagnostics.inputStatus}`,
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
