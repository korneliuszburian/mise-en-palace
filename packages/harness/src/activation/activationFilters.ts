import type {
  AntiMemoryRecord,
  ConflictSet,
  MemoryRecordReviewSignal
} from "@krn/core";

import {
  detectConflicts
} from "./conflictFilter.js";
import {
  applyTemporalFilter
} from "./temporalFilter.js";
import {
  applyTrustFilter,
  type TrustFilterPolicy
} from "./trustFilter.js";
import {
  sourceClaimAuthorityExclusion
} from "./sourceClaimAuthority.js";
import type {
  ActivationExclusionReason,
  RankedActivationCandidate
} from "./types.js";
import {
  markExcluded
} from "./types.js";

export interface ApplyActivationFiltersInput {
  candidates: readonly RankedActivationCandidate[];
  antiMemoryRecords: readonly AntiMemoryRecord[];
  minimumTrustTier: TrustFilterPolicy["minimumTrustTier"];
  now: string;
}

export interface ApplyActivationFiltersResult {
  candidates: readonly RankedActivationCandidate[];
  conflictSets: readonly ConflictSet[];
}

const blockingMemoryReviewSignal = (
  candidate: RankedActivationCandidate
): MemoryRecordReviewSignal | undefined =>
  candidate.kind === "memory" && candidate.subjectType === "memory_record"
    ? candidate.memoryReviewSignals?.find((signal) => signal.severity === "blocking")
    : undefined;

const memoryReviewExclusionReason = (
  signal: MemoryRecordReviewSignal
): ActivationExclusionReason => {
  switch (signal.kind) {
    case "stale_high_confidence":
      return "stale";
    case "unresolved_negative_feedback":
      return "unsafe";
    case "no_application_feedback":
      return "low_context_roi";
  }
};

export const applyMemoryReviewSignalFilter = (
  candidates: readonly RankedActivationCandidate[]
): RankedActivationCandidate[] =>
  candidates.map((candidate) => {
    if (candidate.exclusion !== undefined) {
      return candidate;
    }

    const signal = blockingMemoryReviewSignal(candidate);

    if (signal === undefined) {
      return candidate;
    }

    return markExcluded(candidate, {
      reason: memoryReviewExclusionReason(signal),
      explanation: `Memory review signal ${signal.kind}: ${signal.reason}`
    });
  });

export const applySourceClaimAuthorityFilter = (
  candidates: readonly RankedActivationCandidate[]
): RankedActivationCandidate[] =>
  candidates.map((candidate) => {
    if (candidate.exclusion !== undefined) {
      return candidate;
    }

    const exclusion = sourceClaimAuthorityExclusion(candidate);

    return exclusion === undefined ? candidate : markExcluded(candidate, exclusion);
  });

export const applyActivationFilters = (
  input: ApplyActivationFiltersInput
): ApplyActivationFiltersResult => {
  const conflictResult = detectConflicts(input.candidates, input.antiMemoryRecords);
  const memoryReviewSafe = applyMemoryReviewSignalFilter(conflictResult.candidates);
  const sourceAuthoritySafe = applySourceClaimAuthorityFilter(memoryReviewSafe);
  const trusted = applyTrustFilter(sourceAuthoritySafe, {
    minimumTrustTier: input.minimumTrustTier
  });
  const current = applyTemporalFilter(trusted, input.now);

  return {
    candidates: current,
    conflictSets: conflictResult.conflictSets
  };
};
