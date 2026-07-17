import type {
  FeedbackDelta,
  IsoTimestamp,
  KnowledgeUsefulnessOutcomeFeedback,
  ProjectId,
  SourceClaim,
  SourceDecision,
  SourceUsefulnessOutcomeFeedback
} from "@krn/core";
import {
  buildFeedbackRecommendationReadback,
  isReviewableFeedbackOutcome,
  knowledgeUsefulnessOutcomesFromMetadata,
  sourceUsefulnessOutcomesFromMetadata
} from "@krn/core";
import type {
  FeedbackDeltaLookupRepository,
  FeedbackDeltaProjectLookup,
  MemoryRepository
} from "@krn/core/repositories/internal";

import type {
  MaintenanceQueueCreatedReviewCandidate,
  MaintenanceQueueHandler
} from "./maintenance-queue-executor.js";

type CreateAntiMemoryCandidateInput = Parameters<
  MemoryRepository["createAntiMemoryCandidate"]
>[0];
type FeedbackMaintenanceOutcome = Pick<
  SourceUsefulnessOutcomeFeedback,
  "outcome" | "reason" | "evidenceRefs" | "doesNotProve"
>;
type SourceClaimUsefulnessOutcomeFeedback = SourceUsefulnessOutcomeFeedback & {
  readonly sourceClaimId: NonNullable<SourceUsefulnessOutcomeFeedback["sourceClaimId"]>;
};
type SourceDecisionUsefulnessOutcomeFeedback = SourceUsefulnessOutcomeFeedback & {
  readonly sourceDecisionId: NonNullable<SourceUsefulnessOutcomeFeedback["sourceDecisionId"]>;
};
type SourceDecisionWithClaim = SourceDecision & {
  readonly sourceClaimId: NonNullable<SourceDecision["sourceClaimId"]>;
};
type FeedbackMaintenanceSubject = {
  readonly subjectKind: "source_claim" | "memory_record";
  readonly subjectId: string;
  readonly subjectRef: string;
  readonly activationTarget: string;
  readonly blockedNoun: "current authority" | "current knowledge";
  readonly invalidatedBySourceClaimIds: readonly string[];
  readonly metadata: Record<string, unknown>;
};
type FeedbackMaintenanceCandidate = {
  readonly outcome: FeedbackMaintenanceOutcome;
  readonly subject: FeedbackMaintenanceSubject;
};
type FeedbackMaintenanceCandidateLookup =
  | {
      readonly status: "candidate";
      readonly candidate: FeedbackMaintenanceCandidate;
    }
  | {
      readonly status: "ignored";
    }
  | {
      readonly status: "unavailable";
      readonly subjectKind: "SourceClaim" | "SourceDecision";
      readonly subjectId: string;
    };
type FeedbackMaintenanceCandidatesResult =
  | {
      readonly status: "ready";
      readonly candidates: readonly FeedbackMaintenanceCandidate[];
    }
  | {
      readonly status: "unavailable";
      readonly subjectKind: "SourceClaim" | "SourceDecision";
      readonly subjectId: string;
    };

interface ProjectScopedFeedbackSourceRepository {
  getSourceClaimForProject(
    projectId: ProjectId,
    id: SourceClaim["id"]
  ): Promise<SourceClaim | undefined>;
  getSourceDecisionForProject(
    projectId: ProjectId,
    id: SourceDecision["id"]
  ): Promise<SourceDecision | undefined>;
}

export interface CreateFeedbackDeltaMaintenanceHandlerInput {
  readonly harnessRunRepository: FeedbackDeltaLookupRepository;
  readonly memoryRepository: Pick<MemoryRepository, "createAntiMemoryCandidate">;
  readonly sourceRepository: ProjectScopedFeedbackSourceRepository;
  readonly now?: () => IsoTimestamp;
}

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

const hasReviewableSourceClaimOutcome = (
  outcome: SourceUsefulnessOutcomeFeedback
): outcome is SourceClaimUsefulnessOutcomeFeedback =>
  outcome.sourceClaimId !== undefined && isReviewableFeedbackOutcome(outcome.outcome);

const hasReviewableSourceDecisionOutcome = (
  outcome: SourceUsefulnessOutcomeFeedback
): outcome is SourceDecisionUsefulnessOutcomeFeedback =>
  outcome.sourceClaimId === undefined &&
  outcome.sourceDecisionId !== undefined &&
  isReviewableFeedbackOutcome(outcome.outcome);

const sourceDecisionHasClaim = (
  sourceDecision: SourceDecision
): sourceDecision is SourceDecisionWithClaim =>
  sourceDecision.sourceClaimId !== undefined;

const sourceClaimSubjectFor = (
  outcome: SourceClaimUsefulnessOutcomeFeedback
): FeedbackMaintenanceSubject => ({
  subjectKind: "source_claim",
  subjectId: outcome.sourceClaimId,
  subjectRef: `source_claim:${outcome.sourceClaimId}`,
  activationTarget: `source_claim:${outcome.sourceClaimId}`,
  blockedNoun: "current authority",
  invalidatedBySourceClaimIds: [outcome.sourceClaimId],
  metadata: {
    sourceClaimId: outcome.sourceClaimId
  }
});

const sourceDecisionSubjectFor = (
  outcome: SourceDecisionUsefulnessOutcomeFeedback,
  sourceDecision: SourceDecisionWithClaim
): FeedbackMaintenanceSubject => ({
  subjectKind: "source_claim",
  subjectId: sourceDecision.sourceClaimId,
  subjectRef: `source_decision:${outcome.sourceDecisionId}`,
  activationTarget: `source_claim:${sourceDecision.sourceClaimId}`,
  blockedNoun: "current authority",
  invalidatedBySourceClaimIds: [sourceDecision.sourceClaimId],
  metadata: {
    sourceDecisionId: outcome.sourceDecisionId,
    sourceClaimId: sourceDecision.sourceClaimId
  }
});

const knowledgeSubjectFor = (
  outcome: KnowledgeUsefulnessOutcomeFeedback
): FeedbackMaintenanceSubject => ({
  subjectKind: "memory_record",
  subjectId: outcome.knowledgeId,
  subjectRef: `memory_record:${outcome.knowledgeId}`,
  activationTarget: outcome.knowledgeId,
  blockedNoun: "current knowledge",
  invalidatedBySourceClaimIds: [],
  metadata: {
    knowledgeId: outcome.knowledgeId
  }
});

const antiMemoryCandidateForFeedback = (input: {
  readonly feedbackDelta: FeedbackDelta;
  readonly maintenanceQueueRecordId: string;
  readonly projectId: string;
  readonly outcome: FeedbackMaintenanceOutcome;
  readonly subject: FeedbackMaintenanceSubject;
  readonly now?: IsoTimestamp;
}): CreateAntiMemoryCandidateInput => {
  const { outcome, subject } = input;
  const candidateEvidenceRefs = unique([
    `feedback_delta:${input.feedbackDelta.id}`,
    ...outcome.evidenceRefs
  ]);
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
    maintenanceIdentity:
      `maintenance:review_feedback_delta:${input.maintenanceQueueRecordId}:` +
      `${subject.subjectRef}:${outcome.outcome}`,
    key: `feedback-maintenance:${input.feedbackDelta.id}:${subject.subjectRef}:${outcome.outcome}`,
    status: "candidate",
    rejectedClaim:
      `${subject.subjectRef} should not guide activation as ${subject.blockedNoun} until reviewed.`,
    reason:
      `Feedback marked ${subject.subjectRef} as ${outcome.outcome}: ${outcome.reason}`,
    invalidatedBySourceClaimIds: [...subject.invalidatedBySourceClaimIds],
    appliesTo: subject.activationTarget,
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
      reflectionCandidateEvidence: {
        provenance: "feedback_delta",
        evidenceRefs: candidateEvidenceRefs,
        doesNotProve:
          "FeedbackDelta evidence makes this candidate reviewable; it does not authorize AntiMemoryRecord promotion or mutate selection."
      },
      doesNotProve:
        "Feedback maintenance candidates do not mutate Memory Core, source truth, source decisions, or activation state until reviewed."
    }
  };
};

const sourceClaimCandidateFor = async (input: {
  readonly outcome: SourceClaimUsefulnessOutcomeFeedback;
  readonly projectId: ProjectId;
  readonly sourceRepository: ProjectScopedFeedbackSourceRepository;
}): Promise<FeedbackMaintenanceCandidateLookup> => {
  const sourceClaim = await input.sourceRepository.getSourceClaimForProject(
    input.projectId,
    input.outcome.sourceClaimId
  );

  return sourceClaim === undefined
    ? {
      status: "unavailable",
      subjectKind: "SourceClaim",
      subjectId: input.outcome.sourceClaimId
    }
    : {
      status: "candidate",
      candidate: {
        outcome: input.outcome,
        subject: sourceClaimSubjectFor(input.outcome)
      }
    };
};

const sourceDecisionCandidateFor = async (input: {
  readonly outcome: SourceDecisionUsefulnessOutcomeFeedback;
  readonly projectId: ProjectId;
  readonly sourceRepository: ProjectScopedFeedbackSourceRepository;
}): Promise<FeedbackMaintenanceCandidateLookup> => {
  const sourceDecision = await input.sourceRepository.getSourceDecisionForProject(
    input.projectId,
    input.outcome.sourceDecisionId
  );

  if (sourceDecision === undefined) {
    return {
      status: "unavailable",
      subjectKind: "SourceDecision",
      subjectId: input.outcome.sourceDecisionId
    };
  }

  if (!sourceDecisionHasClaim(sourceDecision)) {
    return { status: "ignored" };
  }

  const sourceClaim = await input.sourceRepository.getSourceClaimForProject(
    input.projectId,
    sourceDecision.sourceClaimId
  );

  return sourceClaim === undefined
    ? {
      status: "unavailable",
      subjectKind: "SourceClaim",
      subjectId: sourceDecision.sourceClaimId
    }
    : {
      status: "candidate",
      candidate: {
        outcome: input.outcome,
        subject: sourceDecisionSubjectFor(input.outcome, sourceDecision)
      }
    };
};

const feedbackMaintenanceCandidatesFor = async (input: {
  readonly feedbackDelta: FeedbackDelta;
  readonly projectId: ProjectId;
  readonly sourceRepository: ProjectScopedFeedbackSourceRepository;
}): Promise<FeedbackMaintenanceCandidatesResult> => {
  const sourceOutcomes = sourceUsefulnessOutcomesFromMetadata(input.feedbackDelta.metadata);
  const [sourceClaimLookups, sourceDecisionLookups] = await Promise.all([
    Promise.all(sourceOutcomes
      .filter(hasReviewableSourceClaimOutcome)
      .map((outcome) => sourceClaimCandidateFor({
        outcome,
        projectId: input.projectId,
        sourceRepository: input.sourceRepository
      }))),
    Promise.all(sourceOutcomes
      .filter(hasReviewableSourceDecisionOutcome)
      .map((outcome) => sourceDecisionCandidateFor({
        outcome,
        projectId: input.projectId,
        sourceRepository: input.sourceRepository
      })))
  ]);
  const unavailable = [...sourceClaimLookups, ...sourceDecisionLookups].find((lookup) =>
    lookup.status === "unavailable"
  );

  if (unavailable !== undefined && unavailable.status === "unavailable") {
    return unavailable;
  }

  return {
    status: "ready",
    candidates: [
      ...sourceClaimLookups.flatMap((lookup) =>
        lookup.status === "candidate" ? [lookup.candidate] : []),
      ...sourceDecisionLookups.flatMap((lookup) =>
        lookup.status === "candidate" ? [lookup.candidate] : []),
      ...knowledgeUsefulnessOutcomesFromMetadata(input.feedbackDelta.metadata)
        .filter((outcome) => isReviewableFeedbackOutcome(outcome.outcome))
        .map((outcome) => ({
          outcome,
          subject: knowledgeSubjectFor(outcome)
        }))
    ]
  };
};

const findFeedbackDelta = async (
  input: CreateFeedbackDeltaMaintenanceHandlerInput,
  projectId: string,
  feedbackDeltaId: string
): Promise<FeedbackDeltaProjectLookup> => input.harnessRunRepository.getFeedbackDeltaForProject(
  projectId,
  feedbackDeltaId
);

export const createFeedbackDeltaMaintenanceHandler = (
  input: CreateFeedbackDeltaMaintenanceHandlerInput
): MaintenanceQueueHandler => ({
  jobType: "review_feedback_delta",
  declaredWrites: ["anti_memory_candidates"],
  async run({ job, record }) {
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

    if (feedbackDelta.status === "missing") {
      return {
        status: "skipped",
        reason:
          `FeedbackDelta ${job.payload.feedbackDeltaId} does not exist; maintenance cannot be applied`
      };
    }

    if (feedbackDelta.status === "wrong_project") {
      return {
        status: "skipped",
        reason:
          `FeedbackDelta ${job.payload.feedbackDeltaId} belongs to another project; maintenance failed closed`
      };
    }

    const feedbackDeltaRecord = feedbackDelta.feedbackDelta;

    const candidateResult = await feedbackMaintenanceCandidatesFor({
      feedbackDelta: feedbackDeltaRecord,
      projectId: job.payload.projectId,
      sourceRepository: input.sourceRepository
    });

    if (candidateResult.status === "unavailable") {
      return {
        status: "skipped",
        reason:
          `${candidateResult.subjectKind} ${candidateResult.subjectId} is unavailable in project ` +
          `${job.payload.projectId}; maintenance failed closed`
      };
    }

    const { candidates } = candidateResult;

    if (candidates.length === 0) {
      return {
        status: "skipped",
        reason:
          `FeedbackDelta ${feedbackDeltaRecord.id} has no source-claim, source-decision-with-linked-claim, or knowledge usefulness outcomes with a maintenance consumer`
      };
    }

    const now = input.now?.();
    const createdReviewCandidates: MaintenanceQueueCreatedReviewCandidate[] = [];

    for (const candidate of candidates) {
      const antiMemoryCandidate = await input.memoryRepository.createAntiMemoryCandidate(
        antiMemoryCandidateForFeedback({
          feedbackDelta: feedbackDeltaRecord,
          maintenanceQueueRecordId: record.id,
          outcome: candidate.outcome,
          projectId: job.payload.projectId,
          subject: candidate.subject,
          ...(now === undefined ? {} : { now })
        })
      );
      createdReviewCandidates.push({
        kind: "anti_memory_candidate",
        id: antiMemoryCandidate.id
      });
    }

    return {
      status: "succeeded",
      createdReviewCandidates
    };
  }
});
