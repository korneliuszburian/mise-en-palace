import type {
  AntiMemoryRecord,
  ConflictSet
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
import type {
  RankedActivationCandidate
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

export const applyActivationFilters = (
  input: ApplyActivationFiltersInput
): ApplyActivationFiltersResult => {
  const conflictResult = detectConflicts(input.candidates, input.antiMemoryRecords);
  const trusted = applyTrustFilter(conflictResult.candidates, {
    minimumTrustTier: input.minimumTrustTier
  });
  const current = applyTemporalFilter(trusted, input.now);

  return {
    candidates: current,
    conflictSets: conflictResult.conflictSets
  };
};
