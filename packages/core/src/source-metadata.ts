import {
  readMetadataString,
  readMetadataStringList
} from "./metadata.js";
import {
  assessTemporalWindow,
  type TemporalWindowInvalidReason,
  type TemporalWindowAssessment
} from "./time.js";

export interface SourceRelationMetadataReadback {
  consumer?: string;
  doesNotProve?: string;
  evidenceRef?: string;
  evidenceRefs: readonly string[];
  file?: string;
  contentHash?: string;
  missingProofBoundaryFields: readonly SourceRelationMetadataProofBoundaryField[];
  sourceDecisionRef?: string;
  scope?: string;
  sourceRanges: readonly string[];
  validFrom?: string;
  validUntil?: string;
  invalidatedAt?: string;
}

export type SourceRelationMetadataProofBoundaryField = "consumer" | "doesNotProve";

const readTrimmedMetadataString = (
  metadata: Record<string, unknown>,
  key: string
): string | undefined => readMetadataString(metadata, key)?.trim();

const readTrimmedMetadataStringList = (
  metadata: Record<string, unknown>,
  key: string
): readonly string[] => readMetadataStringList(metadata, key).map((item) => item.trim());

const uniqueStrings = (values: readonly string[]): readonly string[] => [...new Set(values)];

export const readSourceRelationMetadataReadback = (
  metadata: Record<string, unknown>
): SourceRelationMetadataReadback => {
  const consumer = readTrimmedMetadataString(metadata, "consumer");
  const doesNotProve = readTrimmedMetadataString(metadata, "doesNotProve");
  const evidenceRef = readTrimmedMetadataString(metadata, "evidenceRef");
  const evidenceRefs = uniqueStrings([
    ...(evidenceRef === undefined ? [] : [evidenceRef]),
    ...readTrimmedMetadataStringList(metadata, "evidenceRefs")
  ]);
  const sourceDecisionRef = readTrimmedMetadataString(metadata, "sourceDecisionRef");
  const scope = readTrimmedMetadataString(metadata, "scope");
  const validFrom = readTrimmedMetadataString(metadata, "validFrom");
  const validUntil = readTrimmedMetadataString(metadata, "validUntil");
  const invalidatedAt = readTrimmedMetadataString(metadata, "invalidatedAt");
  const file = readTrimmedMetadataString(metadata, "file");
  const contentHash = readTrimmedMetadataString(metadata, "contentHash");
  const sourceRanges = uniqueStrings(readTrimmedMetadataStringList(metadata, "sourceRanges"));
  const missingProofBoundaryFields: SourceRelationMetadataProofBoundaryField[] = [
    ...(consumer === undefined ? ["consumer" as const] : []),
    ...(doesNotProve === undefined ? ["doesNotProve" as const] : [])
  ];

  return {
    ...(consumer === undefined ? {} : { consumer }),
    ...(doesNotProve === undefined ? {} : { doesNotProve }),
    ...(evidenceRef === undefined ? {} : { evidenceRef }),
    evidenceRefs,
    ...(file === undefined ? {} : { file }),
    ...(contentHash === undefined ? {} : { contentHash }),
    missingProofBoundaryFields,
    ...(sourceDecisionRef === undefined ? {} : { sourceDecisionRef }),
    ...(scope === undefined ? {} : { scope }),
    sourceRanges,
    ...(validFrom === undefined ? {} : { validFrom }),
    ...(validUntil === undefined ? {} : { validUntil }),
    ...(invalidatedAt === undefined ? {} : { invalidatedAt })
  };
};

const invalidTemporalMetadataReason = (
  metadata: Record<string, unknown>
): TemporalWindowInvalidReason | undefined => {
  const fields: readonly (readonly [string, TemporalWindowInvalidReason])[] = [
    ["validFrom", "invalid_valid_from"],
    ["validUntil", "invalid_valid_until"],
    ["invalidatedAt", "invalid_invalidated_at"]
  ];

  for (const [field, reason] of fields) {
    const value = metadata[field];

    if (value !== undefined && (typeof value !== "string" || value.trim().length === 0)) {
      return reason;
    }
  }

  return undefined;
};

export const assessSourceMetadataTemporalValidity = (
  metadata: Record<string, unknown>,
  now: string
): TemporalWindowAssessment => {
  const invalidReason = invalidTemporalMetadataReason(metadata);

  if (invalidReason !== undefined) {
    return {
      status: "invalid",
      reason: invalidReason
    };
  }

  return assessTemporalWindow(readSourceRelationMetadataReadback(metadata), now);
};
