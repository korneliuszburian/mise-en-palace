import {
  isIsoTimestamp,
  sourceAuthorityLabels,
  sourceClaimEdgeKinds,
  sourceClaimStatuses,
  type SourceConsensusTimelineReadback
} from "@krn/core";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const relationTemporalStates = new Set([
  "current:undefined",
  "historical:before_valid_from",
  "historical:valid_until_elapsed",
  "historical:invalidated",
  "invalid:invalid_now",
  "invalid:invalid_valid_from",
  "invalid:invalid_valid_until",
  "invalid:invalid_invalidated_at"
]);

const entryOnlyTemporalStates = new Set([
  "historical:revisit_when_elapsed",
  "invalid:invalid_revisit_when",
  "inactive:rejected_or_deprecated"
]);

const temporalState = (value: unknown): string | undefined =>
  isRecord(value) && typeof value["status"] === "string"
    ? `${value["status"]}:${String(value["reason"])}`
    : undefined;

const isRelationTemporalValidity = (value: unknown): boolean => {
  if (isRecord(value) && value["status"] === "current") return true;
  const state = temporalState(value);
  return state !== undefined && relationTemporalStates.has(state);
};

const isEntryTemporalValidity = (value: unknown): boolean => {
  const state = temporalState(value);
  return state !== undefined && (relationTemporalStates.has(state) || entryOnlyTemporalStates.has(state));
};

const optionalString = (value: unknown): boolean =>
  value === undefined || typeof value === "string";

const relationIdentityIsValid = (value: JsonRecord): boolean =>
  typeof value["sourceClaimEdgeId"] === "string" &&
    (value["direction"] === "incoming" || value["direction"] === "outgoing") &&
    sourceClaimEdgeKinds.includes(value["kind"] as typeof sourceClaimEdgeKinds[number]) &&
    typeof value["relatedSourceClaimId"] === "string";

const relationSupportIsValid = (value: JsonRecord): boolean =>
  isStringArray(value["metadataEvidenceRefs"]) &&
    optionalString(value["metadataSourceDecisionRef"]) &&
    isStringArray(value["sourceRanges"]) &&
    Array.isArray(value["evidenceGaps"]) &&
    value["evidenceGaps"].every((gap: unknown) => gap === "missing_relation_support_ref") &&
    isRelationTemporalValidity(value["temporalValidity"]);

const isRelationEvidence = (value: unknown): boolean =>
  isRecord(value) && relationIdentityIsValid(value) && relationSupportIsValid(value);

const sourceClaimIdentityIsValid = (entry: JsonRecord): boolean =>
  typeof entry["sourceClaimId"] === "string" &&
  typeof entry["claim"] === "string" &&
  sourceClaimStatuses.includes(entry["status"] as typeof sourceClaimStatuses[number]) &&
  typeof entry["createdAt"] === "string" &&
  isIsoTimestamp(entry["createdAt"]) &&
  sourceAuthorityLabels.includes(entry["sourceAuthority"] as typeof sourceAuthorityLabels[number]) &&
  typeof entry["authorityRank"] === "number" &&
  Number.isFinite(entry["authorityRank"]);

const authorityStates = new Set([
  "accepted",
  "stale",
  "superseded",
  "rejected",
  "unsupported",
  "conflicting",
  "unknown"
]);

const timelineStates = new Set([
  "current_authority",
  "caveated_authority",
  "historical",
  "rejected"
]);

const sourceClaimAuthorityIsValid = (entry: JsonRecord): boolean =>
  authorityStates.has(entry["authorityState"] as string) &&
  timelineStates.has(entry["state"] as string) &&
  isEntryTemporalValidity(entry["temporalValidity"]) &&
  optionalString(entry["blockedByCurrentSourceClaimId"]);

const sourceClaimEvidenceIsValid = (entry: JsonRecord): boolean => [
  entry["decisionSupportEdgeIds"],
  entry["evidenceRefs"],
  entry["rawEvidenceCitationRefs"],
  entry["sourceRanges"],
  entry["supportingSourceClaimIds"],
  entry["dissentingSourceClaimIds"],
  entry["supersededBySourceClaimIds"],
  entry["supersedesSourceClaimIds"],
  entry["rejectionIds"],
  entry["caveats"]
].every(isStringArray) &&
  Array.isArray(entry["relationEvidence"]) &&
  entry["relationEvidence"].every(isRelationEvidence);

const isSourceConsensusEntry = (value: unknown): boolean =>
  isRecord(value) &&
  sourceClaimIdentityIsValid(value) &&
  sourceClaimAuthorityIsValid(value) &&
  sourceClaimEvidenceIsValid(value);

export const isSourceConsensusTimelineReadback = (
  value: unknown
): value is SourceConsensusTimelineReadback => {
  if (!isRecord(value)) return false;
  return [
    value["currentSourceClaimIds"],
    value["caveatedSourceClaimIds"],
    value["historicalSourceClaimIds"],
    value["staleSourceClaimIds"],
    value["supersededSourceClaimIds"],
    value["unknownSourceClaimIds"],
    value["rejectedSourceClaimIds"]
  ].every(isStringArray) &&
    Array.isArray(value["entries"]) &&
    value["entries"].every(isSourceConsensusEntry) &&
    typeof value["doesNotProve"] === "string";
};
