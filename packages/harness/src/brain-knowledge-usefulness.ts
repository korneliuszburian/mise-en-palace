import type { BrainKnowledgeUsefulnessOutcomeFeedback } from "@krn/core";

import type { BrainKnowledgeUsefulnessFeedback } from "./brain-knowledge-read-model.js";

/**
 * Outcome semantics (9xc1, lossless 1:1 mapping).
 *
 * BrainKnowledgeUsefulnessOutcome mirrors SourceUsefulnessOutcome exactly —
 * both are the same 7 values — so a store-backed feedback_delta knowledge
 * outcome maps to a brain knowledge usefulness feedback entry with no
 * information loss and no fabricated semantics:
 *
 *   selected — knowledge was selected into an activation packet but not yet applied
 *   used     — knowledge was applied by Codex with no separate helped/hurt signal
 *   helped   — applying the knowledge verifiably helped the task
 *   neutral  — applied, neither helped nor harmed
 *   noise    — retrieved/selected but irrelevant to the task
 *   stale    — once useful, superseded by a newer standard or changed context
 *   unknown  — outcome could not be determined
 *
 * cardId is the full brain knowledge card id. observedAt is the feedback_delta
 * record timestamp when available, so cardsWithBrainKnowledgeUsefulnessFeedback
 * can keep the latest entry per card.
 */
export const brainKnowledgeUsefulnessFromKnowledgeOutcome = (
  outcome: BrainKnowledgeUsefulnessOutcomeFeedback,
  observedAt?: string
): BrainKnowledgeUsefulnessFeedback => ({
  cardId: outcome.brainKnowledgeId,
  outcome: outcome.outcome,
  summary: outcome.reason,
  evidenceRefs: [...outcome.evidenceRefs],
  doesNotProve: outcome.doesNotProve,
  ...(observedAt === undefined ? {} : { observedAt })
});

export const brainKnowledgeUsefulnessFromKnowledgeOutcomes = (
  outcomes: readonly BrainKnowledgeUsefulnessOutcomeFeedback[],
  observedAt?: string
): BrainKnowledgeUsefulnessFeedback[] =>
  outcomes.map((outcome) => brainKnowledgeUsefulnessFromKnowledgeOutcome(outcome, observedAt));
