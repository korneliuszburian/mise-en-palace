import type {
  FeedbackDelta,
  IsoTimestamp,
  SourceUsefulnessOutcomeFeedback
} from "@krn/core";
import {
  buildFeedbackRecommendationReadback,
  sourceUsefulnessOutcomesFromMetadata
} from "@krn/core";
import type {
  HarnessRunRepository,
  MemoryRepository
} from "@krn/harness/repositories/internal";

import type {
  MaintenanceQueueHandler
} from "./maintenance-queue-executor.js";

type CreateAntiMemoryCandidateInput = Parameters<
  MemoryRepository["createAntiMemoryCandidate"]
>[0];

export interface CreateFeedbackDeltaMaintenanceHandlerInput {
  readonly harnessRunRepository: Pick<HarnessRunRepository, "listFeedbackDeltasForProject">;
  readonly memoryRepository: Pick<MemoryRepository, "createAntiMemoryCandidate">;
  readonly feedbackDeltaSearchLimit?: number;
  readonly now?: () => IsoTimestamp;
}

const reviewableFeedbackOutcomes = new Set(["noise", "stale", "unknown"]);

const unique = (values: readonly string[]): string[] => [...new Set(values)];

const sourceSubjectRef = (outcome: SourceUsefulnessOutcomeFeedback): string =>
  outcome.sourceClaimId !== undefined
    ? `source_claim:${outcome.sourceClaimId}`
    : `source_decision:${outcome.sourceDecisionId ?? "unknown"}`;

const sourceClaimIdsFor = (
  outcome: SourceUsefulnessOutcomeFeedback
): NonNullable<CreateAntiMemoryCandidateInput["invalidatedBySourceClaimIds"]> =>
  outcome.sourceClaimId === undefined ? [] : [outcome.sourceClaimId];

const sourceLineageFor = (
  feedbackDelta: FeedbackDelta,
  outcome: SourceUsefulnessOutcomeFeedback
): CreateAntiMemoryCandidateInput["sourceLineage"] =>
  unique([
    `feedback_delta:${feedbackDelta.id}`,
    ...outcome.evidenceRefs
  ]).map((sourceId) => ({
    sourceId,
    note: "feedback-maintenance"
  }));

const antiMemoryCandidateForOutcome = (input: {
  readonly feedbackDelta: FeedbackDelta;
  readonly outcome: SourceUsefulnessOutcomeFeedback;
  readonly projectId: string;
  readonly now?: IsoTimestamp;
}): CreateAntiMemoryCandidateInput => {
  const subjectRef = sourceSubjectRef(input.outcome);
  const recommendation = buildFeedbackRecommendationReadback({
    subjectKind: input.outcome.sourceClaimId === undefined ? "source_decision" : "source_claim",
    subjectId: input.outcome.sourceClaimId ?? input.outcome.sourceDecisionId ?? subjectRef,
    outcome: input.outcome.outcome,
    reason: input.outcome.reason,
    evidenceRefs: input.outcome.evidenceRefs,
    doesNotProve: input.outcome.doesNotProve
  });
  const recommendationActions = recommendation.recommendations
    .map((item) => item.action)
    .join(", ");

  return {
    projectId: input.projectId,
    feedbackDeltaId: input.feedbackDelta.id,
    proposedBy: "maintenance:review_feedback_delta",
    key: `feedback-maintenance:${input.feedbackDelta.id}:${subjectRef}:${input.outcome.outcome}`,
    status: "candidate",
    rejectedClaim:
      `${subjectRef} should not guide activation as current authority until reviewed.`,
    reason:
      `Feedback marked ${subjectRef} as ${input.outcome.outcome}: ${input.outcome.reason}`,
    invalidatedBySourceClaimIds: sourceClaimIdsFor(input.outcome),
    appliesTo: subjectRef,
    summary: `Review ${input.outcome.outcome} feedback for ${subjectRef}`,
    body:
      `FeedbackDelta ${input.feedbackDelta.id} reported ${subjectRef} as ${input.outcome.outcome}. ` +
      `Recommended maintenance action(s): ${recommendationActions}. ` +
      `Evidence refs: ${input.outcome.evidenceRefs.join(", ") || "feedback delta only"}. ` +
      `Does not prove: ${input.outcome.doesNotProve}`,
    owner: "maintenance-feedback",
    confidence: input.outcome.outcome === "unknown" ? 50 : 75,
    sourceLineage: sourceLineageFor(input.feedbackDelta, input.outcome),
    ...(input.now === undefined ? {} : { validFrom: input.now }),
    metadata: {
      kind: "krn.feedbackMaintenanceCandidate.v1",
      feedbackDeltaId: input.feedbackDelta.id,
      outcome: input.outcome.outcome,
      subjectRef,
      sourceClaimId: input.outcome.sourceClaimId,
      sourceDecisionId: input.outcome.sourceDecisionId,
      recommendationActions: recommendation.recommendations.map((item) => item.action),
      mutation: "none",
      doesNotProve:
        "Feedback maintenance candidates do not mutate Memory Core, source truth, source decisions, or activation state until reviewed."
    }
  };
};

const findFeedbackDelta = async (
  input: CreateFeedbackDeltaMaintenanceHandlerInput,
  projectId: string,
  feedbackDeltaId: string
): Promise<FeedbackDelta | undefined> => {
  const feedbackDeltas = await input.harnessRunRepository.listFeedbackDeltasForProject(
    projectId,
    input.feedbackDeltaSearchLimit ?? 500
  );

  return feedbackDeltas.find((feedbackDelta) => feedbackDelta.id === feedbackDeltaId);
};

export const createFeedbackDeltaMaintenanceHandler = (
  input: CreateFeedbackDeltaMaintenanceHandlerInput
): MaintenanceQueueHandler => ({
  jobType: "review_feedback_delta",
  declaredWrites: ["anti_memory_candidates"],
  async run({ job }) {
    if (job.jobType !== "review_feedback_delta") {
      return {
        status: "skipped",
        reason: `Feedback maintenance handler cannot process ${job.jobType}`
      };
    }

    const feedbackDelta = await findFeedbackDelta(
      input,
      job.payload.projectId,
      job.payload.feedbackDeltaId
    );

    if (feedbackDelta === undefined) {
      return {
        status: "skipped",
        reason: `FeedbackDelta ${job.payload.feedbackDeltaId} was not found for project ${job.payload.projectId}`
      };
    }

    const outcomes = sourceUsefulnessOutcomesFromMetadata(feedbackDelta.metadata)
      .filter((outcome) => reviewableFeedbackOutcomes.has(outcome.outcome));

    if (outcomes.length === 0) {
      return {
        status: "skipped",
        reason: `FeedbackDelta ${feedbackDelta.id} has no stale/noise/unknown source usefulness outcomes`
      };
    }

    const now = input.now?.();
    for (const outcome of outcomes) {
      await input.memoryRepository.createAntiMemoryCandidate(
        antiMemoryCandidateForOutcome({
          feedbackDelta,
          outcome,
          projectId: job.payload.projectId,
          ...(now === undefined ? {} : { now })
        })
      );
    }

    return {
      status: "succeeded"
    };
  }
});
