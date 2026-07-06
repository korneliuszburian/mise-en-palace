import type {
  FeedbackDeltaId,
  ReviewAssessmentId,
  SourceClaimId,
  SourceDecisionId
} from "./ids.js";
import type { EvalCandidateProposal } from "./eval.js";
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

export type FeedbackDeltaCreateStatus = "candidate";

export type FeedbackDeltaLifecycleStatus = "accepted" | "rejected" | "applied";

export type FeedbackDeltaStatus =
  | FeedbackDeltaCreateStatus
  | FeedbackDeltaLifecycleStatus;

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
  | "unknown";

export interface SourceUsefulnessOutcomeFeedback {
  sourceClaimId?: SourceClaimId;
  sourceDecisionId?: SourceDecisionId;
  outcome: SourceUsefulnessOutcome;
  reason: string;
  evidenceRefs: string[];
  doesNotProve: string;
}

export interface PatternUsefulnessOutcomeFeedback {
  patternId: string;
  outcome: SourceUsefulnessOutcome;
  reason: string;
  evidenceRefs: string[];
  doesNotProve: string;
}

const sourceUsefulnessOutcomes = new Set<string>([
  "selected",
  "used",
  "helped",
  "neutral",
  "noise",
  "stale",
  "unknown"
]);

export const isSourceUsefulnessOutcome = (
  value: unknown
): value is SourceUsefulnessOutcome =>
  typeof value === "string" && sourceUsefulnessOutcomes.has(value);

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
): SourceUsefulnessOutcomeFeedback[] =>
  readMetadataObjectList(metadata, "sourceUsefulnessOutcomes").flatMap((item) => {
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

export const patternUsefulnessOutcomesFromMetadata = (
  metadata: Record<string, unknown>
): PatternUsefulnessOutcomeFeedback[] =>
  readMetadataObjectList(metadata, "patternUsefulnessOutcomes").flatMap((item) => {
    const patternId = readMetadataString(item, "patternId");
    const reason = readMetadataString(item, "reason");
    const doesNotProve = readMetadataString(item, "doesNotProve");

    if (patternId === undefined || reason === undefined || doesNotProve === undefined) {
      return [];
    }

    return [{
      patternId,
      outcome: sourceUsefulnessOutcomeField(item),
      reason,
      evidenceRefs: readMetadataStringList(item, "evidenceRefs"),
      doesNotProve
    }];
  });

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
