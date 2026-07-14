import type {
  FeedbackDeltaId,
  ReviewAssessmentId,
  SourceClaimId,
  SourceDecisionId
} from "./ids.js";
import type { EvalCandidateProposal } from "./eval.js";
import { isAdmittedCurrentDecisionPacketAuthorityMetadata } from "./evidence-bundle.js";
import type { MemoryCandidate } from "./memory.js";
import {
  readMetadataObjectList,
  readMetadataString,
  readMetadataStringList
} from "./metadata.js";
import type { SourceDecision } from "./source.js";
import type { IsoTimestamp } from "./time.js";
import {
  parseReviewOutcome,
  parseReviewRisk,
  reviewStringListMetadata,
  reviewStringMetadata
} from "./review-outcome.js";
import type {
  ReviewOutcome,
  ReviewOutcomeSummary
} from "./review-outcome.js";

export const feedbackDeltaCreateStatuses = ["candidate"] as const;

export type FeedbackDeltaCreateStatus = typeof feedbackDeltaCreateStatuses[number];

export const feedbackDeltaLifecycleStatuses = [
  "accepted",
  "rejected",
  "applied"
] as const;

export type FeedbackDeltaLifecycleStatus = typeof feedbackDeltaLifecycleStatuses[number];

export const feedbackDeltaStatuses = [
  ...feedbackDeltaCreateStatuses,
  ...feedbackDeltaLifecycleStatuses
] as const;

export type FeedbackDeltaStatus = typeof feedbackDeltaStatuses[number];

export interface FeedbackDelta {
  id: FeedbackDeltaId;
  reviewAssessmentId: ReviewAssessmentId;
  status: FeedbackDeltaStatus;
  memoryCandidates: MemoryCandidate[];
  sourceDecisions: SourceDecision[];
  evalCandidates: EvalCandidateProposal[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export type FeedbackCandidateProposalKind =
  | "memory_candidate"
  | "source_claim_candidate"
  | "source_decision_candidate"
  | "anti_memory_candidate"
  | "eval_candidate"
  | "observation_candidate";

export interface FeedbackCandidateProposalRef {
  kind: FeedbackCandidateProposalKind;
  id: string;
  summary: string;
  status?: string;
}

export interface FeedbackCandidateProposalSummary {
  memoryRecordMutation: "none";
  counts: {
    memoryCandidates: number;
    sourceClaimCandidates: number;
    sourceDecisionCandidates: number;
    antiMemoryCandidates: number;
    evalCandidates: number;
    observationCandidates: number;
  };
  candidates: FeedbackCandidateProposalRef[];
}

export type SourceUsefulnessOutcome =
  | "selected"
  | "used"
  | "helped"
  | "neutral"
  | "noise"
  | "stale"
  | "hurt"
  | "rejected"
  | "unknown";

export interface SourceUsefulnessOutcomeFeedback {
  sourceClaimId?: SourceClaimId;
  sourceDecisionId?: SourceDecisionId;
  outcome: SourceUsefulnessOutcome;
  reason: string;
  evidenceRefs: string[];
  doesNotProve: string;
}

export interface KnowledgeUsefulnessOutcomeFeedback {
  knowledgeId: string;
  outcome: SourceUsefulnessOutcome;
  reason: string;
  evidenceRefs: string[];
  doesNotProve: string;
}

export type FeedbackRecommendationOutcome =
  | SourceUsefulnessOutcome
  | "hurt"
  | "rejected";

export type FeedbackRecommendationAction =
  | "retain"
  | "demote"
  | "refresh"
  | "delete"
  | "supersede"
  | "add_evidence";

export interface FeedbackRecommendation {
  action: FeedbackRecommendationAction;
  reason: string;
  requiresReview: boolean;
}

export interface FeedbackRecommendationReadback {
  kind: "krn.feedbackRecommendation.v1";
  subjectKind: "source_claim" | "source_decision" | "memory_record";
  subjectId: string;
  outcome: FeedbackRecommendationOutcome;
  reason: string;
  recommendations: readonly FeedbackRecommendation[];
  evidenceRefs: readonly string[];
  mutation: "none";
  doesNotProve: string;
}

const sourceUsefulnessOutcomes = new Set<string>([
  "selected",
  "used",
  "helped",
  "neutral",
  "noise",
  "stale",
  "hurt",
  "rejected",
  "unknown"
]);

export const isSourceUsefulnessOutcome = (
  value: unknown
): value is SourceUsefulnessOutcome =>
  typeof value === "string" && sourceUsefulnessOutcomes.has(value);

const reviewableFeedbackOutcomes = new Set<SourceUsefulnessOutcome>([
  "noise",
  "stale",
  "hurt",
  "rejected",
  "unknown"
]);

export const isReviewableFeedbackOutcome = (
  outcome: SourceUsefulnessOutcome
): boolean => reviewableFeedbackOutcomes.has(outcome);

export const feedbackRecommendationsForOutcome = (
  outcome: FeedbackRecommendationOutcome
): readonly FeedbackRecommendation[] => {
  switch (outcome) {
    case "selected":
    case "used":
    case "helped":
      return [{
        action: "retain",
        reason: "Feedback says this knowledge remained useful for the run.",
        requiresReview: false
      }];
    case "neutral":
      return [{
        action: "retain",
        reason: "Feedback does not justify demotion; keep as weakly useful until stronger evidence appears.",
        requiresReview: true
      }];
    case "noise":
      return [{
        action: "demote",
        reason: "Feedback says this knowledge was selected but did not help the task.",
        requiresReview: true
      }];
    case "stale":
      return [{
        action: "refresh",
        reason: "Feedback says this knowledge may still be useful as history but needs current evidence.",
        requiresReview: true
      }, {
        action: "supersede",
        reason: "Feedback says a newer decision may need to replace this guidance for future activation.",
        requiresReview: true
      }];
    case "hurt":
      return [{
        action: "demote",
        reason: "Feedback says applying this memory hurt the task.",
        requiresReview: true
      }, {
        action: "delete",
        reason: "Feedback may justify removing this memory from active authority after review.",
        requiresReview: true
      }];
    case "rejected":
      return [{
        action: "delete",
        reason: "Feedback says this candidate or knowledge path was rejected and should not guide activation.",
        requiresReview: true
      }];
    case "unknown":
      return [{
        action: "add_evidence",
        reason: "Feedback did not establish usefulness; require evidence before retaining or demoting.",
        requiresReview: true
      }];
  }
};

export const buildFeedbackRecommendationReadback = (input: {
  subjectKind: FeedbackRecommendationReadback["subjectKind"];
  subjectId: string;
  outcome: FeedbackRecommendationOutcome;
  reason: string;
  evidenceRefs?: readonly string[];
  doesNotProve: string;
}): FeedbackRecommendationReadback => ({
  kind: "krn.feedbackRecommendation.v1",
  subjectKind: input.subjectKind,
  subjectId: input.subjectId,
  outcome: input.outcome,
  reason: input.reason,
  recommendations: feedbackRecommendationsForOutcome(input.outcome),
  evidenceRefs: [...(input.evidenceRefs ?? [])],
  mutation: "none",
  doesNotProve: input.doesNotProve
});

const sourceUsefulnessOutcomeField = (
  input: Record<string, unknown>
): SourceUsefulnessOutcome => {
  const value = readMetadataString(input, "outcome");

  return value !== undefined && isSourceUsefulnessOutcome(value)
    ? value
    : "unknown";
};

export const sourceUsefulnessOutcomesFromMetadata = (
  metadata: Record<string, unknown>
): SourceUsefulnessOutcomeFeedback[] => {
  if (!isAdmittedCurrentDecisionPacketAuthorityMetadata(metadata)) {
    return [];
  }

  return readMetadataObjectList(metadata, "sourceUsefulnessOutcomes").flatMap((item) => {
    const sourceClaimId = readMetadataString(item, "sourceClaimId") as SourceClaimId | undefined;
    const sourceDecisionId = readMetadataString(item, "sourceDecisionId") as SourceDecisionId | undefined;
    const reason = readMetadataString(item, "reason");
    const doesNotProve = readMetadataString(item, "doesNotProve");

    if (sourceClaimId === undefined && sourceDecisionId === undefined) {
      return [];
    }

    if (reason === undefined || doesNotProve === undefined) {
      return [];
    }

    return [{
      ...(sourceClaimId === undefined ? {} : { sourceClaimId }),
      ...(sourceDecisionId === undefined ? {} : { sourceDecisionId }),
      outcome: sourceUsefulnessOutcomeField(item),
      reason,
      evidenceRefs: readMetadataStringList(item, "evidenceRefs"),
      doesNotProve
    }];
  });
};

export const knowledgeUsefulnessOutcomesFromMetadata = (
  metadata: Record<string, unknown>
): KnowledgeUsefulnessOutcomeFeedback[] => {
  if (!isAdmittedCurrentDecisionPacketAuthorityMetadata(metadata)) {
    return [];
  }

  return readMetadataObjectList(metadata, "knowledgeUsefulnessOutcomes").flatMap((item) => {
    const knowledgeId = readMetadataString(item, "knowledgeId");
    const reason = readMetadataString(item, "reason");
    const doesNotProve = readMetadataString(item, "doesNotProve");

    if (knowledgeId === undefined || reason === undefined || doesNotProve === undefined) {
      return [];
    }

    return [{
      knowledgeId,
      outcome: sourceUsefulnessOutcomeField(item),
      reason,
      evidenceRefs: readMetadataStringList(item, "evidenceRefs"),
      doesNotProve
    }];
  });
};

const metadataCandidateRefs = (
  metadata: Record<string, unknown>,
  key: string,
  kind: FeedbackCandidateProposalKind,
  summaryField: string
): FeedbackCandidateProposalRef[] =>
  readMetadataObjectList(metadata, key).flatMap((item) => {
    const id = readMetadataString(item, "id");
    const summary = readMetadataString(item, summaryField) ?? readMetadataString(item, "summary");

    if (id === undefined || summary === undefined) {
      return [];
    }

    return [{
      kind,
      id,
      summary
    }];
  });

const outcomeFromStatus = (status: FeedbackDeltaStatus): ReviewOutcome => {
  if (status === "accepted" || status === "applied") {
    return "accepted";
  }

  if (status === "rejected") {
    return "rejected";
  }

  return "pending";
};

export const summarizeFeedbackDeltaReview = (
  feedback: FeedbackDelta
): ReviewOutcomeSummary => {
  const correctionLabels = reviewStringListMetadata(feedback.metadata, "correctionLabels");

  return {
    outcome:
      parseReviewOutcome(reviewStringMetadata(feedback.metadata, "outcome")) ??
      outcomeFromStatus(feedback.status),
    reviewBurden:
      parseReviewRisk(reviewStringMetadata(feedback.metadata, "reviewBurden")) ??
      parseReviewRisk(reviewStringMetadata(feedback.metadata, "burden")) ??
      "low",
    diffRisk:
      parseReviewRisk(reviewStringMetadata(feedback.metadata, "diffRisk")) ??
      parseReviewRisk(reviewStringMetadata(feedback.metadata, "risk")) ??
      "low",
    correctionLabels: correctionLabels.length > 0 ? correctionLabels : ["feedback_delta"]
  };
};

export const summarizeFeedbackCandidateProposals = (
  feedback: FeedbackDelta
): FeedbackCandidateProposalSummary => {
  const memoryCandidates = feedback.memoryCandidates.map((candidate): FeedbackCandidateProposalRef => ({
    kind: "memory_candidate",
    id: candidate.id,
    summary: candidate.summary,
    status: candidate.status
  }));
  const sourceClaimCandidates = metadataCandidateRefs(
    feedback.metadata,
    "sourceClaimCandidates",
    "source_claim_candidate",
    "claim"
  );
  const sourceDecisionCandidates = feedback.sourceDecisions.map((decision): FeedbackCandidateProposalRef => ({
    kind: "source_decision_candidate",
    id: decision.id,
    summary: decision.decision,
    status: decision.status
  }));
  const antiMemoryCandidates = metadataCandidateRefs(
    feedback.metadata,
    "antiMemoryCandidates",
    "anti_memory_candidate",
    "rejectedClaim"
  );
  const evalCandidates = feedback.evalCandidates.map((candidate): FeedbackCandidateProposalRef => ({
    kind: "eval_candidate",
    id: candidate.id,
    summary: candidate.title,
    status: candidate.status
  }));
  const observationCandidates = metadataCandidateRefs(
    feedback.metadata,
    "observationCandidates",
    "observation_candidate",
    "summary"
  );

  return {
    memoryRecordMutation: "none",
    counts: {
      memoryCandidates: memoryCandidates.length,
      sourceClaimCandidates: sourceClaimCandidates.length,
      sourceDecisionCandidates: sourceDecisionCandidates.length,
      antiMemoryCandidates: antiMemoryCandidates.length,
      evalCandidates: evalCandidates.length,
      observationCandidates: observationCandidates.length
    },
    candidates: [
      ...memoryCandidates,
      ...sourceClaimCandidates,
      ...sourceDecisionCandidates,
      ...antiMemoryCandidates,
      ...evalCandidates,
      ...observationCandidates
    ]
  };
};
