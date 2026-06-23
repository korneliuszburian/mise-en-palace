import type {
  FeedbackDeltaId,
  ReviewAssessmentId
} from "./ids.js";
import type { EvalCandidate } from "./eval.js";
import type { MemoryCandidate } from "./memory.js";
import type { SourceDecision } from "./source.js";
import type { IsoTimestamp } from "./time.js";
import type {
  NormalizedReviewOutcome,
  NormalizedReviewSignal,
  NormalizedReviewRisk
} from "./reviewAssessment.js";

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

const feedbackOutcomes = new Set<NormalizedReviewOutcome>([
  "accepted",
  "changes_requested",
  "rejected",
  "pending",
  "needs_changes"
]);

const riskValues = new Set<NormalizedReviewRisk>(["low", "medium", "high"]);

const stringMetadata = (
  metadata: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = metadata[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

const stringListMetadata = (
  metadata: Record<string, unknown>,
  key: string
): string[] => {
  const value = metadata[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
};

const isFeedbackOutcome = (value: string): value is NormalizedReviewOutcome =>
  feedbackOutcomes.has(value as NormalizedReviewOutcome);

const isRiskValue = (value: string): value is NormalizedReviewRisk =>
  riskValues.has(value as NormalizedReviewRisk);

const normalizeOutcome = (value: string | undefined): NormalizedReviewOutcome | undefined =>
  value !== undefined && isFeedbackOutcome(value)
    ? value
    : undefined;

const normalizeRisk = (value: string | undefined): NormalizedReviewRisk | undefined =>
  value !== undefined && isRiskValue(value)
    ? value
    : undefined;

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
  const correctionLabels = stringListMetadata(feedback.metadata, "correctionLabels");

  return {
    outcome:
      normalizeOutcome(stringMetadata(feedback.metadata, "outcome")) ??
      outcomeFromStatus(feedback.status),
    reviewBurden:
      normalizeRisk(stringMetadata(feedback.metadata, "reviewBurden")) ??
      normalizeRisk(stringMetadata(feedback.metadata, "burden")) ??
      "low",
    diffRisk:
      normalizeRisk(stringMetadata(feedback.metadata, "diffRisk")) ??
      normalizeRisk(stringMetadata(feedback.metadata, "risk")) ??
      "low",
    correctionLabels: correctionLabels.length > 0 ? correctionLabels : ["feedback_delta"]
  };
};
