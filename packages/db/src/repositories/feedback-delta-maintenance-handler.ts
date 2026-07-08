import type {
  FeedbackDelta,
  IsoTimestamp,
  KnowledgeUsefulnessOutcomeFeedback,
  SourceUsefulnessOutcomeFeedback
} from "@krn/core";
import {
  buildFeedbackRecommendationReadback,
  knowledgeUsefulnessOutcomesFromMetadata,
  sourceUsefulnessOutcomesFromMetadata
} from "@krn/core";
import type {
  HarnessRunRepository,
  MemoryRepository
} from "@krn/core/repositories/internal";

import type {
  MaintenanceQueueHandler
} from "./maintenance-queue-executor.js";

type CreateAntiMemoryCandidateInput = Parameters<
  MemoryRepository["createAntiMemoryCandidate"]
>[0];
type FeedbackMaintenanceOutcome = Pick<
  SourceUsefulnessOutcomeFeedback,
  "outcome" | "reason" | "evidenceRefs" | "doesNotProve"
>;
type FeedbackMaintenanceSubject = {
  readonly subjectKind: "source_claim" | "source_decision" | "brain_knowledge";
  readonly subjectId: string;
  readonly subjectRef: string;
  readonly blockedNoun: "current authority" | "current knowledge";
  readonly invalidatedBySourceClaimIds: readonly string[];
  readonly metadata: Record<string, unknown>;
};
type FeedbackMaintenanceCandidate = {
  readonly outcome: FeedbackMaintenanceOutcome;
  readonly subject: FeedbackMaintenanceSubject;
};

export interface CreateFeedbackDeltaMaintenanceHandlerInput {
  readonly harnessRunRepository: Pick<HarnessRunRepository, "listFeedbackDeltasForProject">;
  readonly memoryRepository: Pick<MemoryRepository, "createAntiMemoryCandidate">;
  readonly feedbackDeltaSearchLimit?: number;
  readonly now?: () => IsoTimestamp;
}

const reviewableFeedbackOutcomes = new Set(["noise", "stale", "unknown"]);

const unique = (values: readonly string[]): string[] => [...new Set(values)];

const sourceLineageFor = (
  feedbackDelta: FeedbackDelta,
  outcome: FeedbackMaintenanceOutcome
): CreateAntiMemoryCandidateInput["sourceLineage"] =>
  unique([
    `feedback_delta:${feedbackDelta.id}`,
    ...outcome.evidenceRefs
  ]).map((sourceId) => ({
    sourceId,
    note: "feedback-maintenance"
  }));

const sourceSubjectFor = (
  outcome: SourceUsefulnessOutcomeFeedback
): FeedbackMaintenanceSubject => {
  if (outcome.sourceClaimId !== undefined) {
    return {
      subjectKind: "source_claim",
      subjectId: outcome.sourceClaimId,
      subjectRef: `source_claim:${outcome.sourceClaimId}`,
      blockedNoun: "current authority",
      invalidatedBySourceClaimIds: [outcome.sourceClaimId],
      metadata: {
        sourceClaimId: outcome.sourceClaimId
      }
    };
  }

  const subjectId = outcome.sourceDecisionId ?? "unknown";

  return {
    subjectKind: "source_decision",
    subjectId,
    subjectRef: `source_decision:${subjectId}`,
    blockedNoun: "current authority",
    invalidatedBySourceClaimIds: [],
    metadata: outcome.sourceDecisionId === undefined ? {} : {
      sourceDecisionId: outcome.sourceDecisionId
    }
  };
};

const knowledgeSubjectFor = (
  outcome: KnowledgeUsefulnessOutcomeFeedback
): FeedbackMaintenanceSubject => ({
  subjectKind: "brain_knowledge",
  subjectId: outcome.knowledgeId,
  subjectRef: `brain_knowledge:${outcome.knowledgeId}`,
  blockedNoun: "current knowledge",
  invalidatedBySourceClaimIds: [],
  metadata: {
    knowledgeId: outcome.knowledgeId
  }
});

const antiMemoryCandidateForFeedback = (input: {
  readonly feedbackDelta: FeedbackDelta;
  readonly projectId: string;
  readonly outcome: FeedbackMaintenanceOutcome;
  readonly subject: FeedbackMaintenanceSubject;
  readonly now?: IsoTimestamp;
}): CreateAntiMemoryCandidateInput => {
  const { outcome, subject } = input;
  const recommendation = buildFeedbackRecommendationReadback({
    subjectKind: subject.subjectKind,
    subjectId: subject.subjectId,
    outcome: outcome.outcome,
    reason: outcome.reason,
    evidenceRefs: outcome.evidenceRefs,
    doesNotProve: outcome.doesNotProve
  });
  const recommendationActions = recommendation.recommendations
    .map((item) => item.action)
    .join(", ");

  return {
    projectId: input.projectId,
    feedbackDeltaId: input.feedbackDelta.id,
    proposedBy: "maintenance:review_feedback_delta",
    key: `feedback-maintenance:${input.feedbackDelta.id}:${subject.subjectRef}:${outcome.outcome}`,
    status: "candidate",
    rejectedClaim:
      `${subject.subjectRef} should not guide activation as ${subject.blockedNoun} until reviewed.`,
    reason:
      `Feedback marked ${subject.subjectRef} as ${outcome.outcome}: ${outcome.reason}`,
    invalidatedBySourceClaimIds: [...subject.invalidatedBySourceClaimIds],
    appliesTo: subject.subjectRef,
    summary: `Review ${outcome.outcome} feedback for ${subject.subjectRef}`,
    body:
      `FeedbackDelta ${input.feedbackDelta.id} reported ${subject.subjectRef} as ${outcome.outcome}. ` +
      `Recommended maintenance action(s): ${recommendationActions}. ` +
      `Evidence refs: ${outcome.evidenceRefs.join(", ") || "feedback delta only"}. ` +
      `Does not prove: ${outcome.doesNotProve}`,
    owner: "maintenance-feedback",
    confidence: outcome.outcome === "unknown" ? 50 : 75,
    sourceLineage: sourceLineageFor(input.feedbackDelta, outcome),
    ...(input.now === undefined ? {} : { validFrom: input.now }),
    metadata: {
      kind: "krn.feedbackMaintenanceCandidate.v1",
      feedbackDeltaId: input.feedbackDelta.id,
      outcome: outcome.outcome,
      subjectRef: subject.subjectRef,
      ...subject.metadata,
      recommendationActions: recommendation.recommendations.map((item) => item.action),
      mutation: "none",
      doesNotProve:
        "Feedback maintenance candidates do not mutate Memory Core, source truth, source decisions, or activation state until reviewed."
    }
  };
};

const feedbackMaintenanceCandidatesFor = (
  feedbackDelta: FeedbackDelta
): FeedbackMaintenanceCandidate[] => [
  ...sourceUsefulnessOutcomesFromMetadata(feedbackDelta.metadata)
    .filter((outcome) => reviewableFeedbackOutcomes.has(outcome.outcome))
    .map((outcome) => ({
      outcome,
      subject: sourceSubjectFor(outcome)
    })),
  ...knowledgeUsefulnessOutcomesFromMetadata(feedbackDelta.metadata)
    .filter((outcome) => reviewableFeedbackOutcomes.has(outcome.outcome))
    .map((outcome) => ({
      outcome,
      subject: knowledgeSubjectFor(outcome)
    }))
];

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

    const candidates = feedbackMaintenanceCandidatesFor(feedbackDelta);

    if (candidates.length === 0) {
      return {
        status: "skipped",
        reason: `FeedbackDelta ${feedbackDelta.id} has no stale/noise/unknown source or knowledge usefulness outcomes`
      };
    }

    const now = input.now?.();
    for (const candidate of candidates) {
      await input.memoryRepository.createAntiMemoryCandidate(
        antiMemoryCandidateForFeedback({
          feedbackDelta,
          outcome: candidate.outcome,
          projectId: job.payload.projectId,
          subject: candidate.subject,
          ...(now === undefined ? {} : { now })
        })
      );
    }

    return {
      status: "succeeded"
    };
  }
});
