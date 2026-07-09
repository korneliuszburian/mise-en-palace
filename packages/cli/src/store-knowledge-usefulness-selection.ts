import {
  knowledgeUsefulnessOutcomesFromMetadata
} from "@krn/core";
import type {
  FeedbackDelta
} from "@krn/core";
import {
  knowledgeReadModelsWithUsefulnessFeedback,
  knowledgeUsefulnessFromKnowledgeOutcomes
} from "@krn/harness";
import type {
  KnowledgeReadModel
} from "@krn/harness";

const blockingUsefulnessOutcomes = new Set<string>([
  "noise",
  "stale",
  "hurt",
  "rejected"
]);

const hasBlockingUsefulnessFeedback = (
  readModel: KnowledgeReadModel
): boolean =>
  readModel.usefulnessFeedback !== undefined &&
  blockingUsefulnessOutcomes.has(readModel.usefulnessFeedback.outcome);

export interface StoreKnowledgeUsefulnessSelection {
  readModels: KnowledgeReadModel[];
  appliedUsefulnessFeedback: boolean;
}

export const applyStoreKnowledgeUsefulnessFeedback = (
  readModels: KnowledgeReadModel[],
  feedbackDeltas: readonly FeedbackDelta[]
): StoreKnowledgeUsefulnessSelection => {
  const usefulnessFeedback = feedbackDeltas.flatMap((feedback) =>
    knowledgeUsefulnessFromKnowledgeOutcomes(
      knowledgeUsefulnessOutcomesFromMetadata(feedback.metadata),
      feedback.updatedAt
    )
  );
  const readModelsWithFeedback = knowledgeReadModelsWithUsefulnessFeedback(
    readModels,
    usefulnessFeedback
  );

  return {
    readModels: readModelsWithFeedback.filter((readModel) =>
      !hasBlockingUsefulnessFeedback(readModel)
    ),
    appliedUsefulnessFeedback: usefulnessFeedback.length > 0
  };
};
