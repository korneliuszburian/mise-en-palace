import {
  readMetadataString,
  readMetadataStringList
} from "@krn/core";
import type { CandidateReviewability } from "@krn/core";
import type { HarnessRunAggregate } from "@krn/harness/repositories";

import type {
  ProjectResolution,
  ProjectResolutionKind
} from "./database-runtime.js";
import type {
  RunReadbackChangedFilesResource,
  RunReadbackSourceClaimEdgeInfluenceResource
} from "./run-readback-resource.js";

type MetadataRecordParseResult =
  | {
    status: "record";
    value: Record<string, unknown>;
  }
  | {
    status: "invalid";
    reason: "missing" | "not_object" | "array";
  };

export const isMetadataRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parseMetadataRecord = (value: unknown): MetadataRecordParseResult => {
  if (value === undefined || value === null) {
    return {
      status: "invalid",
      reason: "missing"
    };
  }

  if (Array.isArray(value)) {
    return {
      status: "invalid",
      reason: "array"
    };
  }

  if (!isMetadataRecord(value)) {
    return {
      status: "invalid",
      reason: "not_object"
    };
  }

  return {
    status: "record",
    value
  };
};

export const metadataRecordValue = (value: unknown): Record<string, unknown> | undefined => {
  const result = parseMetadataRecord(value);

  return result.status === "record" ? result.value : undefined;
};

export const isProjectResolutionKind = (value: string): value is ProjectResolutionKind => {
  switch (value) {
    case "explicit_project":
    case "connected_repo_path":
    case "workspace_project_slug":
      return true;
    default:
      return false;
  }
};

export const projectResolutionFromMetadata = (
  metadata: Record<string, unknown>
): ProjectResolution | undefined => {
  const value = metadataRecordValue(metadata.projectResolution);

  if (value === undefined) {
    return undefined;
  }

  const kind = readMetadataString(value, "kind");
  const reason = readMetadataString(value, "reason");
  const doesNotProve = readMetadataString(value, "doesNotProve");

  if (
    kind === undefined ||
    !isProjectResolutionKind(kind) ||
    reason === undefined ||
    doesNotProve === undefined
  ) {
    return undefined;
  }

  const repoPathHint = readMetadataString(value, "repoPathHint");

  return {
    kind,
    reason,
    doesNotProve,
    ...(repoPathHint === undefined ? {} : { repoPathHint })
  };
};

export const changedFileClassification = (
  bundle: HarnessRunAggregate["evidenceBundles"][number]
): RunReadbackChangedFilesResource["classification"] => {
  const group = metadataRecordValue(bundle.metadata.changedFileClassification);

  if (group === undefined) {
    return {
      source: "not_recorded",
      intended: [],
      unrelated: [],
      unknown: bundle.changedFiles
    };
  }

  return {
    source: "metadata",
    intended: readMetadataStringList(group, "intended"),
    unrelated: readMetadataStringList(group, "unrelated"),
    unknown: readMetadataStringList(group, "unknown")
  };
};

export const metadataArrayLength = (
  metadata: Record<string, unknown>,
  groupKey: string,
  key: string
): string => {
  const group = metadataRecordValue(metadata[groupKey]);

  if (group === undefined) {
    return "unknown";
  }

  const value = group[key];

  return Array.isArray(value) ? String(value.length) : "unknown";
};

export const sourceClaimEdgeInfluenceFromMetadata = (
  metadata: Record<string, unknown>
): RunReadbackSourceClaimEdgeInfluenceResource | undefined => {
  const value = metadataRecordValue(metadata.sourceClaimEdgeInfluence);

  if (value === undefined) {
    return undefined;
  }

  const edgeIds = readMetadataStringList(value, "edgeIds");
  const edgeKinds = readMetadataStringList(value, "edgeKinds");
  const seedSourceClaimIds = readMetadataStringList(value, "seedSourceClaimIds");
  const doesNotProve = readMetadataString(value, "doesNotProve");

  if (
    edgeIds.length === 0 ||
    edgeKinds.length === 0 ||
    seedSourceClaimIds.length === 0 ||
    doesNotProve === undefined
  ) {
    return undefined;
  }

  return {
    edgeIds,
    edgeKinds,
    seedSourceClaimIds,
    doesNotProve
  };
};

export const candidateReviewabilityReasons = (
  metadata: Record<string, unknown>
): string[] => readMetadataStringList(metadata, "reviewabilityReasons");

export const isCandidateReviewability = (value: string): value is CandidateReviewability => {
  switch (value) {
    case "ready":
    case "needs_more_evidence":
    case "too_vague":
    case "duplicate":
    case "not_useful":
    case "unknown":
      return true;
    default:
      return false;
  }
};

export const candidateReviewability = (
  metadata: Record<string, unknown>
): CandidateReviewability => {
  const value = readMetadataString(metadata, "reviewability");

  return value !== undefined && isCandidateReviewability(value)
    ? value
    : "unknown";
};
