import type {
  ActivationAbstention,
  ActivationAbstentionReason,
  ContextAssembly,
  ContextAssemblyCurrentStatus,
  ContextObservationPrefix,
  ContextObservationPrefixGate,
  ContextExclusion,
  ContextInclusion
} from "@krn/core";
import {
  createActivationAbstention
} from "@krn/core";

import type {
  ActivationExclusion,
  ActivationExclusionReason,
  AssembleContextInput,
  RankedActivationCandidate
} from "./types.js";
import {
  markExcluded
} from "./types.js";
import {
  sourceClaimAuthorityExclusion
} from "./source-claim-authority.js";

export type AssembleContextStatus = ContextAssemblyCurrentStatus;

export type AssembledContextAssembly = Omit<ContextAssembly, "status"> & {
  status: AssembleContextStatus;
};

const shouldPreserveExistingSourceExclusion = (
  candidate: RankedActivationCandidate
): boolean =>
  candidate.exclusion !== undefined &&
  candidate.exclusion.reason !== "over_budget" &&
  candidate.exclusion.reason !== "low_context_roi";

const sourceClaimContentExclusion = (
  candidate: RankedActivationCandidate
): ActivationExclusion | undefined => {
  if (candidate.hasMechanism === false) {
    return {
      reason: "unsafe",
      explanation: "Source claims require mechanism before activation."
    };
  }

  if (candidate.doesNotProve !== undefined && candidate.doesNotProve.trim().length > 0) {
    return undefined;
  }

  return {
    reason: "unsafe",
    explanation: "Source claims require doesNotProve before activation."
  };
};

const sourceClaimReviewExclusion = (
  candidate: RankedActivationCandidate
): ActivationExclusion | undefined => {
  const signal = candidate.sourceClaimReviewSignals?.find((item) => item.severity === "blocking");

  if (signal === undefined) {
    return undefined;
  }

  return {
    reason: "unsafe",
    explanation: `SourceClaim review signal ${signal.kind}: ${signal.reason}`
  };
};

const sourceClaimSafetyExclusion = (
  candidate: RankedActivationCandidate
): ActivationExclusion | undefined =>
  sourceClaimAuthorityExclusion(candidate) ??
  sourceClaimReviewExclusion(candidate) ??
  sourceClaimContentExclusion(candidate);

const enforceSourceClaimSafety = (
  candidate: RankedActivationCandidate
): RankedActivationCandidate => {
  if (candidate.subjectType !== "source_claim") {
    return candidate;
  }

  if (shouldPreserveExistingSourceExclusion(candidate)) {
    return candidate;
  }

  const exclusion = sourceClaimSafetyExclusion(candidate);

  return exclusion === undefined ? candidate : markExcluded(candidate, exclusion);
};

const sourceTaxonomyContextFields = (
  candidate: RankedActivationCandidate
): Pick<
  ContextInclusion,
  "sourceAuthorityRank" | "sourceKind" | "sourceSupportRelation" | "sourceUse"
> => ({
  ...(candidate.sourceAuthorityRank === undefined
    ? {}
    : { sourceAuthorityRank: candidate.sourceAuthorityRank }),
  ...(candidate.sourceKind === undefined ? {} : { sourceKind: candidate.sourceKind }),
  ...(candidate.sourceSupportRelation === undefined
    ? {}
    : { sourceSupportRelation: candidate.sourceSupportRelation }),
  ...(candidate.sourceUse === undefined ? {} : { sourceUse: candidate.sourceUse })
});

const toInclusion = (candidate: RankedActivationCandidate): ContextInclusion => ({
  subjectType: candidate.subjectType,
  subjectId: candidate.subjectId,
  reason: candidate.reason,
  expectedUse: candidate.expectedUse,
  tokenEstimate: candidate.tokenEstimate,
  trustTier: candidate.trustTier,
  ...sourceTaxonomyContextFields(candidate)
});

const toExclusion = (candidate: RankedActivationCandidate): ContextExclusion | undefined => {
  if (candidate.exclusion === undefined) {
    return undefined;
  }

  return {
    subjectType: candidate.subjectType,
    subjectId: candidate.subjectId,
    reason: candidate.exclusion.reason,
    explanation: candidate.exclusion.explanation,
    score: candidate.totalScore,
    trustTier: candidate.trustTier,
    ...sourceTaxonomyContextFields(candidate)
  };
};

const observationPrefixMetadata = (input: AssembleContextInput): {
  prefix?: ContextObservationPrefix;
  gate?: ContextObservationPrefixGate;
} => {
  const prefix = input.observationPrefix;

  if (prefix === undefined) {
    return {};
  }

  const unsourcedItems = prefix.items.filter((item) => item.sourceRangeCount <= 0);

  if (unsourcedItems.length > 0) {
    return {
      gate: {
        status: "rejected",
        reasons: ["missing_source_ranges"],
        rejectedObservationIds: unsourcedItems.map((item) => item.observationId)
      }
    };
  }

  return {
    prefix
  };
};

const uniqueExclusionReasons = (
  candidates: readonly RankedActivationCandidate[]
): ActivationExclusionReason[] => Array.from(new Set(
  candidates
    .map((candidate) => candidate.exclusion?.reason)
    .filter((reason): reason is ActivationExclusionReason => reason !== undefined)
));

const abstentionReasonFor = (
  candidates: readonly RankedActivationCandidate[],
  exclusionReasons: readonly ActivationExclusionReason[]
): ActivationAbstentionReason => {
  if (candidates.length === 0) {
    return "no_candidates";
  }

  if (exclusionReasons.length > 0 && exclusionReasons.every((reason) => reason === "over_budget")) {
    return "over_budget";
  }

  if (
    exclusionReasons.some((reason) =>
      reason === "low_trust" || reason === "low_context_roi" || reason === "stale"
    )
  ) {
    return "weak_context";
  }

  if (
    exclusionReasons.some((reason) =>
      reason === "unsafe" || reason === "invalidated" || reason === "superseded"
    )
  ) {
    return "unsafe_context";
  }

  return "all_excluded";
};

const abstentionExplanationFor = (reason: ActivationAbstentionReason): string => {
  switch (reason) {
    case "no_candidates":
      return "Activation abstained because no memory, source, or search candidates were available.";
    case "weak_context":
      return "Activation abstained because available context was weak, stale, low-trust, or low-ROI.";
    case "over_budget":
      return "Activation abstained because available candidates exceeded the context budget.";
    case "unsafe_context":
      return "Activation abstained because available candidates were unsafe, invalidated, or superseded.";
    case "all_excluded":
      return "Activation abstained because all candidates were excluded.";
  }
};

export const assembleContext = (input: AssembleContextInput): AssembledContextAssembly => {
  const candidates = input.candidates.map(enforceSourceClaimSafety);
  const prefixMetadata = observationPrefixMetadata(input);
  const hasObservationPrefixItems =
    prefixMetadata.prefix !== undefined &&
    (input.observationPrefix?.items.length ?? 0) > 0;
  const inclusions = candidates
    .filter((candidate) => candidate.exclusion === undefined)
    .sort((left, right) => right.totalScore - left.totalScore)
    .map(toInclusion);
  const exclusions = candidates
    .map(toExclusion)
    .filter((exclusion): exclusion is ContextExclusion => exclusion !== undefined);
  const status = inclusions.length === 0 && !hasObservationPrefixItems ? "abstained" : "assembled";
  const exclusionReasons = uniqueExclusionReasons(candidates);
  const metadata = input.metadata ?? {};
  let activationAbstention: ActivationAbstention | undefined;

  if (status === "abstained") {
    const abstentionReason = abstentionReasonFor(candidates, exclusionReasons);
    activationAbstention = createActivationAbstention({
      reason: abstentionReason,
      explanation: abstentionExplanationFor(abstentionReason),
      metadata: {
        candidateCount: candidates.length,
        exclusionCount: exclusions.length,
        exclusionReasons
      }
    });
  }

  return {
    id: input.id,
    harnessPlanId: input.harnessPlanId,
    status,
    ...(input.tokenBudget === undefined ? {} : { tokenBudget: input.tokenBudget }),
    inclusions,
    exclusions,
    ...(prefixMetadata.prefix === undefined ? {} : { observationPrefix: prefixMetadata.prefix }),
    ...(prefixMetadata.gate === undefined ? {} : { observationPrefixGate: prefixMetadata.gate }),
    ...(activationAbstention === undefined ? {} : { activationAbstention }),
    metadata,
    createdAt: input.createdAt
  };
};
