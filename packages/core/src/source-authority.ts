import {
  isDecisionGradeSourceSupportType,
  rankSourceAuthority,
  type SourceClaim,
  type SourceDecisionEdge,
  type SourceRejection
} from "./source-model.js";
import { hasSourceText } from "./source-text.js";
import {
  assessTemporalWindow,
  type TemporalWindowAssessment,
  type IsoTimestamp
} from "./time.js";
import { assessSourceMetadataTemporalValidity } from "./source-metadata.js";

const uniqueStrings = (values: readonly string[]): readonly string[] => [...new Set(values)];

const hasMeaningfulOverrideReason = (value: string | undefined): boolean => {
  const trimmed = value?.trim();

  if (trimmed === undefined || trimmed.length < 24) {
    return false;
  }

  return trimmed.split(/\s+/u).filter((word) => word.length >= 3).length >= 4;
};

const sourceDecisionOverrideProvenancePrefix = "source-decision:";

const hasSourceDecisionOverrideProvenance = (value: string | undefined): boolean => {
  const trimmed = value?.trim();

  return trimmed !== undefined &&
    trimmed.startsWith(sourceDecisionOverrideProvenancePrefix) &&
    hasSourceText(trimmed.slice(sourceDecisionOverrideProvenancePrefix.length));
};

export type SourceClaimTemporalValidity =
  | TemporalWindowAssessment
  | {
      readonly status: "historical";
      readonly reason: "revisit_when_elapsed";
    }
  | {
      readonly status: "invalid";
      readonly reason: "invalid_revisit_when";
    }
  | {
      readonly status: "inactive";
      readonly reason: "rejected_or_deprecated";
    };

type SourceClaimTemporalInput = Pick<SourceClaim, "status" | "revisitWhen"> & {
  readonly metadata?: Record<string, unknown>;
};

export const assessSourceClaimTemporalValidity = (
  sourceClaim: SourceClaimTemporalInput,
  now: string
): SourceClaimTemporalValidity => {
  if (sourceClaim.status === "rejected" || sourceClaim.status === "deprecated") {
    return {
      status: "inactive",
      reason: "rejected_or_deprecated"
    };
  }

  const metadataValidity = assessSourceMetadataTemporalValidity(sourceClaim.metadata ?? {}, now);

  if (metadataValidity.status !== "current") {
    return metadataValidity;
  }

  if (sourceClaim.revisitWhen === undefined) {
    return metadataValidity;
  }

  const revisitValidity = assessTemporalWindow({
    validUntil: sourceClaim.revisitWhen
  }, now);

  if (revisitValidity.status === "invalid") {
    return {
      status: "invalid",
      reason: "invalid_revisit_when"
    };
  }

  if (revisitValidity.status === "historical") {
    return {
      status: "historical",
      reason: "revisit_when_elapsed"
    };
  }

  return revisitValidity;
};

export const isSourceClaimTemporallyValid = (
  sourceClaim: SourceClaimTemporalInput,
  now: string
): boolean => {
  return assessSourceClaimTemporalValidity(sourceClaim, now).status === "current";
};

export type SourceClaimOverrideClaim = Pick<
  SourceClaim,
  "id" | "status" | "sourceAuthority" | "revisitWhen" | "createdAt"
>;

export type SourceClaimOverrideAssessment =
  | {
      readonly allowed: true;
      readonly reason: "explicit_override_reason" | "no_stronger_valid_consensus";
    }
  | {
      readonly allowed: false;
      readonly reason: "weaker_than_current_valid_consensus";
      readonly blockedBySourceClaimId: SourceClaim["id"];
    }
  | {
      readonly allowed: false;
      readonly reason: "candidate_not_current_authority";
    };

export const assessSourceClaimOverride = (input: {
  readonly candidate: SourceClaimOverrideClaim;
  readonly currentConsensus: readonly SourceClaimOverrideClaim[];
  readonly now: string;
  readonly overrideReason?: string;
  readonly overrideProvenanceRef?: string;
}): SourceClaimOverrideAssessment => {
  if (assessSourceClaimTemporalValidity(input.candidate, input.now).status !== "current") {
    return {
      allowed: false,
      reason: "candidate_not_current_authority"
    };
  }

  const candidateTrustRank = rankSourceAuthority(input.candidate.sourceAuthority);
  const strongerCurrentConsensus = input.currentConsensus.find((currentClaim) => {
    if (currentClaim.id === input.candidate.id || currentClaim.status !== "accepted") {
      return false;
    }

    if (!isSourceClaimTemporallyValid(currentClaim, input.now)) {
      return false;
    }

    return rankSourceAuthority(currentClaim.sourceAuthority) > candidateTrustRank;
  });

  if (strongerCurrentConsensus !== undefined) {
    if (
      hasMeaningfulOverrideReason(input.overrideReason) &&
      hasSourceDecisionOverrideProvenance(input.overrideProvenanceRef)
    ) {
      return {
        allowed: true,
        reason: "explicit_override_reason"
      };
    }

    return {
      allowed: false,
      reason: "weaker_than_current_valid_consensus",
      blockedBySourceClaimId: strongerCurrentConsensus.id
    };
  }

  return {
    allowed: true,
    reason: "no_stronger_valid_consensus"
  };
};

export type SourceClaimAuthorityStatus =
  | "accepted"
  | "caveated"
  | "blocked"
  | "stale"
  | "rejected"
  | "evidence_gap";

export type SourceClaimAuthorityState =
  | "accepted"
  | "stale"
  | "superseded"
  | "rejected"
  | "unsupported"
  | "conflicting"
  | "unknown";

export const sourceClaimAuthorityStateFor = (input: {
  readonly status: SourceClaimAuthorityStatus;
  readonly reasons: readonly SourceClaimAuthorityReason[];
}): SourceClaimAuthorityState => {
  if (input.status === "stale" || input.reasons.includes("stale")) {
    return "stale";
  }

  if (input.status === "rejected" || input.reasons.includes("rejected_or_deprecated")) {
    return "rejected";
  }

  if (
    input.reasons.includes("superseded_by_current_claim") ||
    input.reasons.includes("weaker_than_current_valid_consensus")
  ) {
    return input.reasons.includes("weaker_than_current_valid_consensus")
      ? "conflicting"
      : "superseded";
  }

  if (
    input.status === "evidence_gap" ||
    input.reasons.includes("missing_source_to_decision_fields") ||
    input.reasons.includes("missing_source_decision_support") ||
    input.reasons.includes("decorative_support_type")
  ) {
    return "unsupported";
  }

  if (input.reasons.includes("accepted_with_dissenting_source_claims")) {
    return "conflicting";
  }

  return input.status === "accepted" ? "accepted" : "unknown";
};

export type SourceClaimAuthorityReason =
  | "current_decision_linked_authority"
  | "accepted_with_dissenting_source_claims"
  | "candidate_not_accepted"
  | "rejected_or_deprecated"
  | "invalid_time"
  | "stale"
  | "missing_source_to_decision_fields"
  | "decorative_support_type"
  | "missing_source_decision_support"
  | "superseded_by_current_claim"
  | "weaker_than_current_valid_consensus"
  | "rejected_by_source_rejection";

export interface SourceClaimAuthorityAssessment {
  status: SourceClaimAuthorityStatus;
  reasons: readonly SourceClaimAuthorityReason[];
  caveats: readonly string[];
  temporalValidity: SourceClaimTemporalValidity;
  blockedByCurrentSourceClaimId?: SourceClaim["id"];
}

export interface AssessSourceClaimAuthorityInput {
  readonly claim: SourceClaim;
  readonly now: IsoTimestamp;
  readonly sourceDecisionSupportCount?: number;
  readonly decisionSupportEdgeIds?: readonly SourceDecisionEdge["id"][];
  readonly supersededBySourceClaimIds?: readonly SourceClaim["id"][];
  readonly acceptedDissentingSourceClaimIds?: readonly SourceClaim["id"][];
  readonly rejectionIds?: readonly SourceRejection["id"][];
  readonly blockedByCurrentSourceClaimId?: SourceClaim["id"];
}

const authoritySupportCount = (
  input: Pick<AssessSourceClaimAuthorityInput, "sourceDecisionSupportCount" | "decisionSupportEdgeIds">
): number | undefined =>
  input.sourceDecisionSupportCount ?? input.decisionSupportEdgeIds?.length;

const uniqueSourceClaimAuthorityReasons = (
  values: readonly SourceClaimAuthorityReason[]
): readonly SourceClaimAuthorityReason[] => [...new Set(values)];

const sourceClaimLifecycleAuthorityReasons = (
  claim: Pick<SourceClaim, "status" | "metadata">
): readonly SourceClaimAuthorityReason[] => {
  if (claim.metadata["decisionCorpusStatus"] === "stale") {
    return ["stale"];
  }

  if (claim.status !== "accepted") {
    return [
      claim.status === "proposed"
        ? "candidate_not_accepted"
        : "rejected_or_deprecated"
    ];
  }

  return [];
};

const sourceClaimTextAuthorityReasons = (
  claim: Pick<SourceClaim, "mechanism" | "krnImplication" | "doesNotProve" | "consumer" | "falsifier" | "supportType">
): readonly SourceClaimAuthorityReason[] => [
  ...(!hasSourceText(claim.mechanism) ||
  !hasSourceText(claim.krnImplication) ||
  !hasSourceText(claim.doesNotProve) ||
  !hasSourceText(claim.consumer) ||
  !hasSourceText(claim.falsifier)
    ? ["missing_source_to_decision_fields" as const]
    : []),
  ...(!isDecisionGradeSourceSupportType(claim.supportType)
    ? ["decorative_support_type" as const]
    : [])
];

const sourceClaimTemporalAuthorityReason = (
  temporalValidity: SourceClaimTemporalValidity
): SourceClaimAuthorityReason | undefined => {
  if (temporalValidity.status === "invalid") {
    return "invalid_time";
  }

  if (temporalValidity.status === "historical") {
    return "stale";
  }

  return undefined;
};

const sourceClaimTemporalAuthorityCaveats = (
  temporalValidity: SourceClaimTemporalValidity
): readonly string[] => {
  if (temporalValidity.status === "invalid") {
    return [`invalid_time:${temporalValidity.reason}`];
  }

  if (temporalValidity.status === "historical") {
    return ["stale"];
  }

  return [];
};

const sourceClaimStructuralAuthorityReasons = (
  input: Pick<
    AssessSourceClaimAuthorityInput,
    "supersededBySourceClaimIds" | "acceptedDissentingSourceClaimIds" | "rejectionIds" | "blockedByCurrentSourceClaimId"
  > & {
    readonly sourceDecisionSupportCount?: number | undefined;
  }
): readonly SourceClaimAuthorityReason[] => [
  ...(input.sourceDecisionSupportCount === 0
    ? ["missing_source_decision_support" as const]
    : []),
  ...((input.supersededBySourceClaimIds ?? []).length > 0
    ? ["superseded_by_current_claim" as const]
    : []),
  ...((input.acceptedDissentingSourceClaimIds ?? []).length > 0
    ? ["accepted_with_dissenting_source_claims" as const]
    : []),
  ...(input.blockedByCurrentSourceClaimId === undefined
    ? []
    : ["weaker_than_current_valid_consensus" as const]),
  ...((input.rejectionIds ?? []).length > 0
    ? ["rejected_by_source_rejection" as const]
    : [])
];

const stringIfPresent = (value: string | undefined): readonly string[] =>
  value === undefined ? [] : [value];

const sourceClaimListCaveat = (
  prefix: string,
  ids: readonly string[] | undefined
): string | undefined => {
  if (ids === undefined || ids.length === 0) {
    return undefined;
  }

  return `${prefix}:${ids.join(",")}`;
};

const sourceDecisionSupportCaveat = (
  sourceDecisionSupportCount: number | undefined
): string | undefined =>
  sourceDecisionSupportCount === 0 ? "missing_source_decision_support" : undefined;

const sourceClaimStructuralAuthorityCaveats = (
  input: Pick<
    AssessSourceClaimAuthorityInput,
    "supersededBySourceClaimIds" | "acceptedDissentingSourceClaimIds" | "rejectionIds" | "blockedByCurrentSourceClaimId"
  > & {
    readonly sourceDecisionSupportCount?: number | undefined;
  }
): readonly string[] => [
  ...stringIfPresent(sourceDecisionSupportCaveat(input.sourceDecisionSupportCount)),
  ...stringIfPresent(sourceClaimListCaveat("superseded_by", input.supersededBySourceClaimIds)),
  ...stringIfPresent(sourceClaimListCaveat("dissenting_source_claims", input.acceptedDissentingSourceClaimIds)),
  ...stringIfPresent(input.blockedByCurrentSourceClaimId === undefined
    ? undefined
    : `weaker_than_current_valid_consensus:${input.blockedByCurrentSourceClaimId}`),
  ...stringIfPresent(sourceClaimListCaveat("rejected_by", input.rejectionIds))
];

const sourceClaimIsRejectedAuthority = (input: {
  readonly claim: Pick<SourceClaim, "status" | "metadata">;
  readonly rejectionIds: readonly SourceRejection["id"][];
}): boolean =>
  (input.claim.status === "rejected" && input.claim.metadata["decisionCorpusStatus"] !== "stale") ||
  (input.claim.status === "deprecated" && input.claim.metadata["decisionCorpusStatus"] !== "stale") ||
  input.rejectionIds.length > 0;

const sourceClaimIsBlockedAuthority = (input: {
  readonly claim: Pick<SourceClaim, "status" | "metadata">;
  readonly temporalValidity: SourceClaimTemporalValidity;
  readonly reasons: readonly SourceClaimAuthorityReason[];
  readonly supersededBySourceClaimIds: readonly SourceClaim["id"][];
  readonly blockedByCurrentSourceClaimId?: SourceClaim["id"];
}): boolean =>
  (input.claim.status !== "accepted" && input.claim.metadata["decisionCorpusStatus"] !== "stale") ||
  input.temporalValidity.status === "invalid" ||
  input.reasons.includes("missing_source_to_decision_fields") ||
  input.reasons.includes("decorative_support_type") ||
  input.supersededBySourceClaimIds.length > 0 ||
  input.blockedByCurrentSourceClaimId !== undefined;

const sourceClaimAuthorityStatus = (input: {
  readonly claim: Pick<SourceClaim, "status" | "metadata">;
  readonly temporalValidity: SourceClaimTemporalValidity;
  readonly reasons: readonly SourceClaimAuthorityReason[];
  readonly sourceDecisionSupportCount?: number | undefined;
  readonly supersededBySourceClaimIds: readonly SourceClaim["id"][];
  readonly acceptedDissentingSourceClaimIds: readonly SourceClaim["id"][];
  readonly rejectionIds: readonly SourceRejection["id"][];
  readonly blockedByCurrentSourceClaimId?: SourceClaim["id"];
}): SourceClaimAuthorityStatus => {
  if (input.claim.metadata["decisionCorpusStatus"] === "stale") {
    return "stale";
  }

  if (sourceClaimIsRejectedAuthority(input)) {
    return "rejected";
  }

  if (sourceClaimIsBlockedAuthority(input)) {
    return "blocked";
  }

  if (input.temporalValidity.status === "historical") {
    return "stale";
  }

  if (input.sourceDecisionSupportCount === 0) {
    return "evidence_gap";
  }

  if (input.acceptedDissentingSourceClaimIds.length > 0) {
    return "caveated";
  }

  return "accepted";
};

export const assessSourceClaimAuthority = (
  input: AssessSourceClaimAuthorityInput
): SourceClaimAuthorityAssessment => {
  const temporalValidity = assessSourceClaimTemporalValidity(input.claim, input.now);
  const sourceDecisionSupportCount = authoritySupportCount(input);
  const supersededBySourceClaimIds = input.supersededBySourceClaimIds ?? [];
  const acceptedDissentingSourceClaimIds = input.acceptedDissentingSourceClaimIds ?? [];
  const rejectionIds = input.rejectionIds ?? [];
  const temporalReason = sourceClaimTemporalAuthorityReason(temporalValidity);
  const reasons = uniqueSourceClaimAuthorityReasons([
    ...sourceClaimLifecycleAuthorityReasons(input.claim),
    ...(temporalReason === undefined ? [] : [temporalReason]),
    ...sourceClaimTextAuthorityReasons(input.claim),
    ...sourceClaimStructuralAuthorityReasons({
      sourceDecisionSupportCount,
      supersededBySourceClaimIds,
      acceptedDissentingSourceClaimIds,
      rejectionIds,
      ...(input.blockedByCurrentSourceClaimId === undefined
        ? {}
        : { blockedByCurrentSourceClaimId: input.blockedByCurrentSourceClaimId })
    })
  ]);
  const caveats = uniqueStrings([
    ...sourceClaimTemporalAuthorityCaveats(temporalValidity),
    ...sourceClaimStructuralAuthorityCaveats({
      sourceDecisionSupportCount,
      supersededBySourceClaimIds,
      acceptedDissentingSourceClaimIds,
      rejectionIds,
      ...(input.blockedByCurrentSourceClaimId === undefined
        ? {}
        : { blockedByCurrentSourceClaimId: input.blockedByCurrentSourceClaimId })
    })
  ]);
  const status = sourceClaimAuthorityStatus({
    claim: input.claim,
    temporalValidity,
    reasons,
    sourceDecisionSupportCount,
    supersededBySourceClaimIds,
    acceptedDissentingSourceClaimIds,
    rejectionIds,
    ...(input.blockedByCurrentSourceClaimId === undefined
      ? {}
      : { blockedByCurrentSourceClaimId: input.blockedByCurrentSourceClaimId })
  });

  if (status === "accepted") {
    return {
      status,
      reasons: ["current_decision_linked_authority"],
      caveats,
      temporalValidity
    };
  }

  return {
    status,
    reasons,
    caveats,
    temporalValidity,
    ...(input.blockedByCurrentSourceClaimId === undefined
      ? {}
      : { blockedByCurrentSourceClaimId: input.blockedByCurrentSourceClaimId })
  };
};
