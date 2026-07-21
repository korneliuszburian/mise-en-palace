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
  const feedbackByKnowledgeId = new Map<string, {
    feedback: KnowledgeUsefulnessFeedback;
    feedbackDelta: FeedbackDelta;
  }>();

  for (const feedbackDelta of [...feedbackDeltas].sort(newestFeedbackFirst)) {
    if (!include(feedbackDelta)) {
      continue;
    }

    const persistedOutcomes = knowledgeUsefulnessOutcomesFromMetadata(feedbackDelta.metadata);
    const outcomes = knowledgeUsefulnessFromKnowledgeOutcomes(
      persistedOutcomes,
      feedbackDelta.createdAt
    );

    for (const outcome of outcomes) {
      if (!feedbackByKnowledgeId.has(outcome.knowledgeId)) {
        feedbackByKnowledgeId.set(outcome.knowledgeId, {
          feedback: {
            ...outcome,
            feedbackLifecycleStatus: feedbackDelta.status
          },
          feedbackDelta
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
  readModels.map((readModel) => [readModel.memoryRecordId ?? readModel.id, {
    kind: "knowledge" as const,
    id: readModel.memoryRecordId ?? readModel.id
  }])
).values()];

const feedbackForKnowledgeReadModels = (
  readModels: readonly KnowledgeReadModel[],
  feedback: readonly KnowledgeUsefulnessFeedback[]
): KnowledgeUsefulnessFeedback[] => {
  const displayIdByPacketSubject = new Map(
    readModels.flatMap((readModel) => readModel.memoryRecordId === undefined
      ? []
      : [[readModel.memoryRecordId, readModel.id] as const])
  );

  return feedback.map((item) => ({
    ...item,
    knowledgeId: displayIdByPacketSubject.get(item.knowledgeId) ?? item.knowledgeId
  }));
};

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
  const feedback = [...visibleFeedback.values()].map(({ feedback }) => feedback);
  const readModelsWithFeedback = knowledgeReadModelsWithUsefulnessFeedback(
    readModels,
    feedbackForKnowledgeReadModels(readModels, feedback)
  );
  const knownKnowledgeIds = new Set(readModels.map((readModel) =>
    readModel.memoryRecordId ?? readModel.id
  ));
  const reviewOnlyUsefulnessCaveats = [...visibleFeedback.values()]
    .flatMap(({ feedback, feedbackDelta }) => {
      const outcome = feedback;

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
        reason: outcome.summary,
        doesNotProve:
          "Review-only usefulness feedback does not mutate source or memory truth, prove future usefulness, or authorize promotion."
      }];
    });

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
