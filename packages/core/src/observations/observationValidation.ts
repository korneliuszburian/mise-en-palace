import type { ObservationItem } from "./ObservationItem.js";
import { requiresObservationSourceRange } from "./observationPolicy.js";

export type ObservationContractError =
  | "source_range_required"
  | "memory_promotion_forbidden"
  | "chain_of_thought_forbidden"
  | "temporal_anchor_required";

export interface ObservationContractValidation {
  ok: boolean;
  errors: ObservationContractError[];
}

const forbiddenMetadataKeys = new Set([
  "chainOfThought",
  "chain_of_thought",
  "reasoningTrace",
  "reasoning_trace",
  "privateReasoning",
  "private_reasoning"
]);

const hasForbiddenMetadataKey = (metadata: Record<string, unknown>): boolean =>
  Object.keys(metadata).some((key) => forbiddenMetadataKeys.has(key));

const hasPromotionTarget = (observation: ObservationItem): boolean =>
  Object.hasOwn(observation, "promotionTarget") ||
  Object.hasOwn(observation.metadata, "promotionTarget") ||
  Object.hasOwn(observation.metadata, "memoryPromotion");

export const validateObservationContract = (
  observation: ObservationItem
): ObservationContractValidation => {
  const errors: ObservationContractError[] = [];

  if (
    requiresObservationSourceRange(observation.kind, observation.provenanceKind) &&
    observation.sourceRanges.length === 0
  ) {
    errors.push("source_range_required");
  }

  if (hasPromotionTarget(observation)) {
    errors.push("memory_promotion_forbidden");
  }

  if (hasForbiddenMetadataKey(observation.metadata)) {
    errors.push("chain_of_thought_forbidden");
  }

  if (!observation.temporalScope.observedAt || !observation.temporalScope.ingestedAt) {
    errors.push("temporal_anchor_required");
  }

  return {
    ok: errors.length === 0,
    errors
  };
};
