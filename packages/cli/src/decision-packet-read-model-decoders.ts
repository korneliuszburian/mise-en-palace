import {
  readMetadataString,
  readMetadataStringList
} from "@krn/core";
import type { CandidateReviewability } from "@krn/core";
import type { ProjectStandardDecisionReadback } from "@krn/core";
import type { SourceClaimEdgeKind } from "@krn/core";
import type {
  SourceClaimAuthorityReason,
  SourceClaimAuthorityStatus
} from "@krn/core";
import type { SourceDecisionTargetType } from "@krn/core";
import type { HarnessRunAggregate } from "@krn/core/repositories";

import type {
  ProjectResolution,
  ProjectResolutionKind
} from "./database-runtime.js";
import type {
  DecisionPacketReadModelChangedFiles,
  DecisionPacketReadModelPendingAntiMemoryReview,
  DecisionPacketReadModelSourceClaimEdgeInfluence,
  DecisionPacketReadModelSourceDecisionSupportBoost,
  DecisionPacketReadModelSourceDecisionSupportTarget
} from "./decision-packet-read-model.js";

type MetadataRecordParseResult =
  | {
    status: "record";
    value: Record<string, unknown>;
  }
  | {
    status: "invalid";
    reason: "missing" | "not_object" | "array";
  };

const isMetadataRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseMetadataRecord = (value: unknown): MetadataRecordParseResult => {
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

const metadataRecordValue = (value: unknown): Record<string, unknown> | undefined => {
  const result = parseMetadataRecord(value);

  return result.status === "record" ? result.value : undefined;
};

const isProjectResolutionKind = (value: string): value is ProjectResolutionKind => {
  switch (value) {
    case "explicit_project":
    case "connected_repo_path":
    case "workspace_project_slug":
      return true;
    default:
      return false;
  }
};

const sourceDecisionTargetTypes = [
  "harness_run",
  "task_contract",
  "harness_plan",
  "context_assembly",
  "evidence_bundle",
  "review_assessment",
  "feedback_delta",
  "architecture_decision",
  "memory_record",
  "eval_candidate"
] as const satisfies readonly SourceDecisionTargetType[];

const isSourceDecisionTargetType = (value: string): value is SourceDecisionTargetType => {
  return sourceDecisionTargetTypes.some((targetType) => targetType === value);
};

const sourceClaimEdgeKinds = [
  "supports",
  "contradicts",
  "qualifies",
  "depends_on",
  "supersedes",
  "duplicates",
  "narrows",
  "invalidates",
  "expires"
] as const satisfies readonly SourceClaimEdgeKind[];

const isSourceClaimEdgeKind = (value: string): value is SourceClaimEdgeKind =>
  sourceClaimEdgeKinds.some((edgeKind) => edgeKind === value);

const sourceClaimAuthorityStatuses = [
  "accepted",
  "caveated",
  "blocked",
  "stale",
  "rejected",
  "evidence_gap"
] as const satisfies readonly SourceClaimAuthorityStatus[];

const isSourceClaimAuthorityStatus = (
  value: string
): value is SourceClaimAuthorityStatus =>
  sourceClaimAuthorityStatuses.some((status) => status === value);

const sourceClaimAuthorityReasons = [
  "current_decision_linked_authority",
  "accepted_with_dissenting_source_claims",
  "candidate_not_accepted",
  "rejected_or_deprecated",
  "invalid_time",
  "stale",
  "missing_source_to_decision_fields",
  "decorative_support_type",
  "missing_source_decision_support",
  "superseded_by_current_claim",
  "weaker_than_current_valid_consensus",
  "rejected_by_source_rejection"
] as const satisfies readonly SourceClaimAuthorityReason[];

const isSourceClaimAuthorityReason = (
  value: string
): value is SourceClaimAuthorityReason =>
  sourceClaimAuthorityReasons.some((reason) => reason === value);

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
): DecisionPacketReadModelChangedFiles["classification"] => {
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

export const readMetadataFiniteNumber = (
  metadata: Record<string, unknown>,
  key: string
): number | undefined => {
  const value = metadata[key];

  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

export const sourceClaimEdgeInfluenceFromMetadata = (
  metadata: Record<string, unknown>
): DecisionPacketReadModelSourceClaimEdgeInfluence | undefined => {
  const value = metadataRecordValue(metadata.sourceClaimEdgeInfluence);

  if (value === undefined) {
    return undefined;
  }

  const edgeIds = readMetadataStringList(value, "edgeIds");
  const edgeKinds = readMetadataStringList(value, "edgeKinds").filter(isSourceClaimEdgeKind);
  const missingRelationSupportEdgeIds = readMetadataStringList(
    value,
    "missingRelationSupportEdgeIds"
  );
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
    ...(missingRelationSupportEdgeIds.length === 0 ? {} : { missingRelationSupportEdgeIds }),
    seedSourceClaimIds,
    doesNotProve
  };
};

export const sourceClaimAuthorityFromMetadata = (
  metadata: Record<string, unknown>
): {
  status: SourceClaimAuthorityStatus;
  reasons: SourceClaimAuthorityReason[];
} | undefined => {
  const value = metadataRecordValue(metadata.sourceClaimAuthority);

  if (value === undefined) {
    return undefined;
  }

  const status = readMetadataString(value, "status");
  const reasons = readMetadataStringList(value, "reasons").filter(isSourceClaimAuthorityReason);

  if (status === undefined || !isSourceClaimAuthorityStatus(status) || reasons.length === 0) {
    return undefined;
  }

  return {
    status,
    reasons
  };
};

const sourceDecisionSupportTargetsFromMetadata = (
  metadata: Record<string, unknown>
): DecisionPacketReadModelSourceDecisionSupportTarget[] => {
  const value = metadata["targets"];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = metadataRecordValue(item);

    if (record === undefined) {
      return [];
    }

    const sourceDecisionEdgeId = readMetadataString(record, "sourceDecisionEdgeId");
    const targetType = readMetadataString(record, "targetType");
    const targetId = readMetadataString(record, "targetId");

    if (
      sourceDecisionEdgeId === undefined ||
      targetType === undefined ||
      !isSourceDecisionTargetType(targetType) ||
      targetId === undefined
    ) {
      return [];
    }

    return [{
      sourceDecisionEdgeId,
      targetType,
      targetId
    }];
  });
};

export const sourceDecisionSupportBoostFromMetadata = (
  metadata: Record<string, unknown>
): DecisionPacketReadModelSourceDecisionSupportBoost | undefined => {
  const value = metadataRecordValue(metadata.sourceDecisionSupportBoost);

  if (value === undefined) {
    return undefined;
  }

  const sourceDecisionEdgeIds = readMetadataStringList(value, "sourceDecisionEdgeIds");
  const sourceDecisionIds = readMetadataStringList(value, "sourceDecisionIds");
  const targets = sourceDecisionSupportTargetsFromMetadata(value);
  const confidence = readMetadataStringList(value, "confidence");
  const supportTypes = readMetadataStringList(value, "supportTypes");
  const doesNotProve = readMetadataString(value, "doesNotProve");

  if (
    sourceDecisionEdgeIds.length === 0 ||
    targets.length === 0 ||
    confidence.length === 0 ||
    supportTypes.length === 0 ||
    doesNotProve === undefined
  ) {
    return undefined;
  }

  return {
    sourceDecisionEdgeIds,
    ...(sourceDecisionIds.length === 0 ? {} : { sourceDecisionIds }),
    targets,
    confidence,
    supportTypes,
    doesNotProve
  };
};

export const pendingAntiMemoryReviewFromMetadata = (
  metadata: Record<string, unknown>
): DecisionPacketReadModelPendingAntiMemoryReview | undefined => {
  const value = metadataRecordValue(metadata.pendingAntiMemoryReview);

  if (value === undefined) {
    return undefined;
  }

  const antiMemoryCandidateIds = readMetadataStringList(value, "antiMemoryCandidateIds");
  const feedbackDeltaIds = readMetadataStringList(value, "feedbackDeltaIds");
  const subjectRefs = readMetadataStringList(value, "subjectRefs");
  const doesNotProve = readMetadataString(value, "doesNotProve");

  if (antiMemoryCandidateIds.length === 0 || doesNotProve === undefined) {
    return undefined;
  }

  return {
    antiMemoryCandidateIds,
    feedbackDeltaIds,
    subjectRefs,
    doesNotProve
  };
};

export const projectStandardDecisionFromMetadata = (
  metadata: Record<string, unknown>
): ProjectStandardDecisionReadback | undefined => {
  const value = metadataRecordValue(metadata.projectStandardDecision);

  if (value === undefined) {
    return undefined;
  }

  const kind = readMetadataString(value, "kind");
  const memoryRecordId = readMetadataString(value, "memoryRecordId");
  const key = readMetadataString(value, "key");
  const sourceRefs = readMetadataStringList(value, "sourceRefs");
  const mechanism = readMetadataString(value, "mechanism");
  const krnImplication = readMetadataString(value, "krnImplication");
  const decision = readMetadataString(value, "decision");
  const consumer = readMetadataString(value, "consumer");
  const falsifier = readMetadataString(value, "falsifier");
  const validFrom = readMetadataString(value, "validFrom");
  const doesNotProve = readMetadataString(value, "doesNotProve");

  if (
    kind !== "krn.projectStandardDecision.v1" ||
    memoryRecordId === undefined ||
    key === undefined ||
    sourceRefs.length === 0 ||
    mechanism === undefined ||
    krnImplication === undefined ||
    decision === undefined ||
    consumer === undefined ||
    falsifier === undefined ||
    validFrom === undefined ||
    doesNotProve === undefined
  ) {
    return undefined;
  }

  const validUntil = readMetadataString(value, "validUntil");
  const rejectedPath = readMetadataString(value, "rejectedPath");

  return {
    kind,
    memoryRecordId,
    key,
    sourceRefs,
    mechanism,
    krnImplication,
    decision,
    consumer,
    falsifier,
    validFrom,
    ...(validUntil === undefined ? {} : { validUntil }),
    ...(rejectedPath === undefined ? {} : { rejectedPath }),
    doesNotProve
  };
};

export const candidateReviewabilityReasons = (
  metadata: Record<string, unknown>
): string[] => readMetadataStringList(metadata, "reviewabilityReasons");

const isCandidateReviewability = (value: string): value is CandidateReviewability => {
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
