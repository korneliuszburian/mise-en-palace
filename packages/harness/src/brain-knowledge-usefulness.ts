import type { PatternUsefulnessOutcomeFeedback } from "@krn/core";

import type { BrainKnowledgeUsefulnessFeedback } from "./brain-knowledge-read-model.js";

/**
 * Outcome semantics (9xc1, lossless 1:1 mapping).
 *
 * BrainKnowledgeUsefulnessOutcome mirrors SourceUsefulnessOutcome exactly —
 * both are the same 7 values — so a store-backed feedback_delta pattern
 * outcome maps to a brain knowledge usefulness feedback entry with no
 * information loss and no fabricated semantics:
 *
 *   selected — pattern was selected into an activation packet but not yet applied
 *   used     — pattern was applied by Codex with no separate helped/hurt signal
 *   helped   — applying the pattern verifiably helped the task
 *   neutral  — applied, neither helped nor harmed
 *   noise    — retrieved/selected but irrelevant to the task
 *   stale    — once useful, superseded by a newer standard or changed context
 *   unknown  — outcome could not be determined
 *
 * cardId is the brain knowledge card id for a retained pattern
 * (`pattern:<patternId>`). observedAt is the feedback_delta record timestamp
 * when available, so cardsWithBrainKnowledgeUsefulnessFeedback can keep the
 * latest entry per card.
 */
export const brainKnowledgeUsefulnessFromPatternOutcome = (
  outcome: PatternUsefulnessOutcomeFeedback,
  observedAt?: string
): BrainKnowledgeUsefulnessFeedback => ({
  cardId: `pattern:${outcome.patternId}`,
  outcome: outcome.outcome,
  summary: outcome.reason,
  evidenceRefs: [...outcome.evidenceRefs],
  doesNotProve: outcome.doesNotProve,
  ...(observedAt === undefined ? {} : { observedAt })
});

export const brainKnowledgeUsefulnessFromPatternOutcomes = (
  outcomes: readonly PatternUsefulnessOutcomeFeedback[],
  observedAt?: string
): BrainKnowledgeUsefulnessFeedback[] =>
  outcomes.map((outcome) => brainKnowledgeUsefulnessFromPatternOutcome(outcome, observedAt));
