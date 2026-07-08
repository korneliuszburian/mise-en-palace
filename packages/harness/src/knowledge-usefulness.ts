import type { KnowledgeUsefulnessOutcomeFeedback } from "@krn/core";

import type { KnowledgeUsefulnessFeedback } from "./knowledge-read-model.js";

/**
 * Outcome semantics (9xc1, lossless 1:1 mapping).
 *
 * KnowledgeUsefulnessOutcome mirrors SourceUsefulnessOutcome exactly —
 * both are the same 7 values — so a store-backed feedback_delta knowledge
 * outcome maps to a knowledge usefulness feedback entry with no
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
 * knowledgeId is the knowledge read model id. observedAt is the feedback_delta
 * record timestamp when available, so knowledgeReadModelsWithUsefulnessFeedback
 * can keep the latest entry per read model.
 */
export const knowledgeUsefulnessFromKnowledgeOutcome = (
  outcome: KnowledgeUsefulnessOutcomeFeedback,
  observedAt?: string
): KnowledgeUsefulnessFeedback => ({
  knowledgeId: outcome.knowledgeId,
  outcome: outcome.outcome,
  summary: outcome.reason,
  evidenceRefs: [...outcome.evidenceRefs],
  doesNotProve: outcome.doesNotProve,
  ...(observedAt === undefined ? {} : { observedAt })
});

export const knowledgeUsefulnessFromKnowledgeOutcomes = (
  outcomes: readonly KnowledgeUsefulnessOutcomeFeedback[],
  observedAt?: string
): KnowledgeUsefulnessFeedback[] =>
  outcomes.map((outcome) => knowledgeUsefulnessFromKnowledgeOutcome(outcome, observedAt));
