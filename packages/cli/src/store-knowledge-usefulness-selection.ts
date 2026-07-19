import {
  isSourceUsefulnessOutcome,
  knowledgeUsefulnessOutcomesFromMetadata
} from "@krn/core";
import type {
  DecisionPacketReviewOnlyUsefulnessCaveat,
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
  KnowledgeReadModel,
  KnowledgeUsefulnessFeedback
} from "@krn/harness";

const newestFeedbackFirst = (
  left: FeedbackDelta,
  right: FeedbackDelta
): number => {
  const createdAtDifference = right.createdAt.localeCompare(left.createdAt);

  return createdAtDifference === 0
    ? right.id.localeCompare(left.id)
    : createdAtDifference;
};

const usefulnessFeedbackByKnowledgeId = (
  feedbackDeltas: readonly FeedbackDelta[],
  include: (feedbackDelta: FeedbackDelta) => boolean
) => {
  const feedbackByKnowledgeId = new Map<string, KnowledgeUsefulnessFeedback>();

  for (const feedbackDelta of [...feedbackDeltas].sort(newestFeedbackFirst)) {
    if (!include(feedbackDelta)) {
      continue;
    }

    const outcomes = knowledgeUsefulnessFromKnowledgeOutcomes(
      knowledgeUsefulnessOutcomesFromMetadata(feedbackDelta.metadata),
      feedbackDelta.createdAt
    );

    for (const outcome of outcomes) {
      if (!feedbackByKnowledgeId.has(outcome.knowledgeId)) {
        feedbackByKnowledgeId.set(outcome.knowledgeId, {
          ...outcome,
          feedbackLifecycleStatus: feedbackDelta.status
        });
      }
    }
  }

  return feedbackByKnowledgeId;
};

export interface StoreKnowledgeUsefulnessSelection {
  readModels: KnowledgeReadModel[];
  attachedReviewOnlyFeedback: boolean;
  reviewOnlyUsefulnessCaveats: DecisionPacketReviewOnlyUsefulnessCaveat[];
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
  const visibleFeedback = usefulnessFeedbackByKnowledgeId(
    feedbackDeltas,
    (feedbackDelta) => feedbackDelta.status !== "rejected"
  );
  const readModelsWithFeedback = knowledgeReadModelsWithUsefulnessFeedback(
    readModels,
    [...visibleFeedback.values()]
  );
  const knownKnowledgeIds = new Set(readModels.map((readModel) => readModel.id));
  const reviewOnlyUsefulnessCaveats = feedbackDeltas
    .filter((feedbackDelta) => feedbackDelta.status !== "rejected")
    .flatMap((feedbackDelta) => knowledgeUsefulnessOutcomesFromMetadata(feedbackDelta.metadata)
      .flatMap((outcome) => {
        if (
          !knownKnowledgeIds.has(outcome.knowledgeId) ||
          !isSourceUsefulnessOutcome(outcome.outcome) ||
          !["noise", "stale", "hurt", "rejected", "unknown"].includes(outcome.outcome)
        ) {
          return [];
        }
        return [{
          feedbackDeltaId: feedbackDelta.id,
          subjectType: "knowledge" as const,
          subjectId: outcome.knowledgeId,
          feedbackStatus: feedbackDelta.status,
          outcome: outcome.outcome,
          reason: outcome.reason,
          doesNotProve:
            "Review-only usefulness feedback does not mutate source or memory truth, prove future usefulness, or authorize promotion."
        }];
      }));

  return {
    readModels: readModelsWithFeedback
      .map((readModel) => readModel.usefulnessFeedback !== undefined
        ? {
          ...readModel,
          nextAction: readModel.nextAction === "use" ? "review" as const : readModel.nextAction
        }
        : readModel),
    attachedReviewOnlyFeedback: visibleFeedback.size > 0,
    reviewOnlyUsefulnessCaveats
  };
};
