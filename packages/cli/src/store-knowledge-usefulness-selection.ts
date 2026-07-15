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
  KnowledgeReadModel,
  KnowledgeUsefulnessFeedback
} from "@krn/harness";

const blockingUsefulnessOutcomes = new Set<string>([
  "noise",
  "stale",
  "hurt",
  "rejected"
]);

const approvedFeedbackStatuses = new Set<FeedbackDelta["status"]>([
  "accepted",
  "applied"
]);

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
  const visibleFeedback = usefulnessFeedbackByKnowledgeId(
    feedbackDeltas,
    (feedbackDelta) => feedbackDelta.status !== "rejected"
  );
  const approvedFeedback = usefulnessFeedbackByKnowledgeId(
    feedbackDeltas,
    (feedbackDelta) => approvedFeedbackStatuses.has(feedbackDelta.status)
  );
  const readModelsWithFeedback = knowledgeReadModelsWithUsefulnessFeedback(
    readModels,
    [...visibleFeedback.values()]
  );

  return {
    readModels: readModelsWithFeedback
      .map((readModel) => readModel.usefulnessFeedback?.feedbackLifecycleStatus === "candidate"
        ? {
          ...readModel,
          nextAction: readModel.nextAction === "use" ? "review" as const : readModel.nextAction
        }
        : readModel)
      .filter((readModel) => {
        const governingFeedback = approvedFeedback.get(readModel.id);

        return governingFeedback === undefined ||
          !blockingUsefulnessOutcomes.has(governingFeedback.outcome);
      }),
    appliedUsefulnessFeedback: visibleFeedback.size > 0
  };
};
