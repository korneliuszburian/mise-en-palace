import {
  knowledgeUsefulnessOutcomesFromMetadata
} from "@krn/core";
import type {
  FeedbackDelta
} from "@krn/core";
import type {
  FeedbackSubjectReference,
  HarnessRunRepository
} from "@krn/core/repositories/internal";
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

const feedbackSubjectsForKnowledgeReadModels = (
  readModels: readonly KnowledgeReadModel[]
): FeedbackSubjectReference[] => [...new Map(
  readModels.map((readModel) => [readModel.id, {
    kind: "knowledge" as const,
    id: readModel.id
  }])
).values()];

export const listStoreKnowledgeUsefulnessFeedback = async (input: {
  projectId: string;
  readModels: readonly KnowledgeReadModel[];
  harnessRunRepository?: Partial<Pick<
    HarnessRunRepository,
    "listFeedbackDeltasForSubjects"
  >>;
}): Promise<FeedbackDelta[]> => {
  const subjects = feedbackSubjectsForKnowledgeReadModels(input.readModels);

  if (subjects.length === 0 || input.harnessRunRepository === undefined) {
    return [];
  }

  if (input.harnessRunRepository.listFeedbackDeltasForSubjects === undefined) {
    return [];
  }

  return input.harnessRunRepository.listFeedbackDeltasForSubjects({
    projectId: input.projectId,
    subjects,
    limitPerSubject: 100
  });
};

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
