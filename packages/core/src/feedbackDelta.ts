import type {
  FeedbackDeltaId,
  ReviewAssessmentId
} from "./ids.js";
import type { EvalCandidate } from "./eval.js";
import type { MemoryCandidate } from "./memory.js";
import type { SourceDecision } from "./source.js";
import type { IsoTimestamp } from "./time.js";
import {
  normalizeReviewOutcome,
  normalizeReviewRisk,
  reviewStringListMetadata,
  reviewStringMetadata
} from "./reviewSignal.js";
import type {
  NormalizedReviewOutcome,
  NormalizedReviewSignal
} from "./reviewSignal.js";

export type FeedbackDeltaStatus = "candidate" | "accepted" | "rejected" | "applied";

export interface FeedbackDelta {
  id: FeedbackDeltaId;
  reviewAssessmentId: ReviewAssessmentId;
  status: FeedbackDeltaStatus;
  memoryCandidates: MemoryCandidate[];
  sourceDecisions: SourceDecision[];
  evalCandidates: EvalCandidate[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export type FeedbackCandidateProposalKind =
  | "memory_candidate"
  | "source_claim_candidate"
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
    antiMemoryCandidates: number;
    evalCandidates: number;
    observationCandidates: number;
  };
  candidates: FeedbackCandidateProposalRef[];
}

const objectListMetadata = (
  metadata: Record<string, unknown>,
  key: string
): Record<string, unknown>[] => {
  const value = metadata[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is Record<string, unknown> =>
    typeof item === "object" && item !== null && !Array.isArray(item)
  );
};

const stringField = (
  input: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = input[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

const metadataCandidateRefs = (
  metadata: Record<string, unknown>,
  key: string,
  kind: FeedbackCandidateProposalKind,
  summaryField: string
): FeedbackCandidateProposalRef[] =>
  objectListMetadata(metadata, key).flatMap((item) => {
    const id = stringField(item, "id");
    const summary = stringField(item, summaryField) ?? stringField(item, "summary");

    if (id === undefined || summary === undefined) {
      return [];
    }

    return [{
      kind,
      id,
      summary
    }];
  });

const outcomeFromStatus = (status: FeedbackDeltaStatus): NormalizedReviewOutcome => {
  if (status === "accepted" || status === "applied") {
    return "accepted";
  }

  if (status === "rejected") {
    return "rejected";
  }

  return "pending";
};

export const normalizeFeedbackDelta = (
  feedback: FeedbackDelta
): NormalizedReviewSignal => {
  const correctionLabels = reviewStringListMetadata(feedback.metadata, "correctionLabels");

  return {
    outcome:
      normalizeReviewOutcome(reviewStringMetadata(feedback.metadata, "outcome")) ??
      outcomeFromStatus(feedback.status),
    reviewBurden:
      normalizeReviewRisk(reviewStringMetadata(feedback.metadata, "reviewBurden")) ??
      normalizeReviewRisk(reviewStringMetadata(feedback.metadata, "burden")) ??
      "low",
    diffRisk:
      normalizeReviewRisk(reviewStringMetadata(feedback.metadata, "diffRisk")) ??
      normalizeReviewRisk(reviewStringMetadata(feedback.metadata, "risk")) ??
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
      antiMemoryCandidates: antiMemoryCandidates.length,
      evalCandidates: evalCandidates.length,
      observationCandidates: observationCandidates.length
    },
    candidates: [
      ...memoryCandidates,
      ...sourceClaimCandidates,
      ...antiMemoryCandidates,
      ...evalCandidates,
      ...observationCandidates
    ]
  };
};
