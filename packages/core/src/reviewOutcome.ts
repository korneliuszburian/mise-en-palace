export const reviewAssessmentStatuses = [
  "pending",
  "accepted",
  "changes_requested",
  "rejected"
] as const;

export type ReviewAssessmentStatus = typeof reviewAssessmentStatuses[number];

export const reviewOutcomes = [
  "accepted",
  "changes_requested",
  "rejected",
  "pending",
  "needs_changes"
] as const;

export type ReviewOutcome = typeof reviewOutcomes[number];

export const reviewRisks = ["low", "medium", "high"] as const;

export type ReviewRisk = typeof reviewRisks[number];
export type ReviewBurden = ReviewRisk;

export interface ReviewOutcomeSummary {
  outcome: ReviewOutcome;
  reviewBurden: ReviewBurden;
  diffRisk: ReviewRisk;
  correctionLabels: string[];
}

const reviewAssessmentStatusSet = new Set<string>(reviewAssessmentStatuses);
const reviewOutcomeSet = new Set<string>(reviewOutcomes);
const reviewRiskSet = new Set<string>(reviewRisks);

export const isReviewAssessmentStatus = (value: string): value is ReviewAssessmentStatus =>
  reviewAssessmentStatusSet.has(value);

export const isReviewOutcome = (value: string): value is ReviewOutcome =>
  reviewOutcomeSet.has(value);

export const isReviewRisk = (value: string): value is ReviewRisk =>
  reviewRiskSet.has(value);

export const parseReviewOutcome = (
  value: string | undefined
): ReviewOutcome | undefined => {
  const trimmedOutcome = value?.trim();
  return trimmedOutcome !== undefined && isReviewOutcome(trimmedOutcome)
    ? trimmedOutcome
    : undefined;
};

export const parseReviewRisk = (
  value: string | undefined
): ReviewRisk | undefined => {
  const trimmedRisk = value?.trim();
  return trimmedRisk !== undefined && isReviewRisk(trimmedRisk)
    ? trimmedRisk
    : undefined;
};

export const reviewStringMetadata = (
  metadata: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = metadata[key];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const reviewStringListMetadata = (
  metadata: Record<string, unknown>,
  key: string
): string[] => {
  const value = metadata[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item !== "string") {
      return [];
    }

    const trimmed = item.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  });
};
