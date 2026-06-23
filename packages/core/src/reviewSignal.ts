export const reviewAssessmentStatuses = [
  "pending",
  "accepted",
  "changes_requested",
  "rejected"
] as const;

export type ReviewAssessmentStatus = typeof reviewAssessmentStatuses[number];

export const normalizedReviewOutcomes = [
  "accepted",
  "changes_requested",
  "rejected",
  "pending",
  "needs_changes"
] as const;

export type NormalizedReviewOutcome = typeof normalizedReviewOutcomes[number];

export const normalizedReviewRisks = ["low", "medium", "high"] as const;

export type NormalizedReviewRisk = typeof normalizedReviewRisks[number];
export type NormalizedReviewBurden = NormalizedReviewRisk;

export interface NormalizedReviewSignal {
  outcome: NormalizedReviewOutcome;
  reviewBurden: NormalizedReviewBurden;
  diffRisk: NormalizedReviewRisk;
  correctionLabels: string[];
}

const reviewAssessmentStatusSet = new Set<string>(reviewAssessmentStatuses);
const normalizedReviewOutcomeSet = new Set<string>(normalizedReviewOutcomes);
const normalizedReviewRiskSet = new Set<string>(normalizedReviewRisks);

export const isReviewAssessmentStatus = (value: string): value is ReviewAssessmentStatus =>
  reviewAssessmentStatusSet.has(value);

export const isNormalizedReviewOutcome = (value: string): value is NormalizedReviewOutcome =>
  normalizedReviewOutcomeSet.has(value);

export const isNormalizedReviewRisk = (value: string): value is NormalizedReviewRisk =>
  normalizedReviewRiskSet.has(value);

export const normalizeReviewOutcome = (
  value: string | undefined
): NormalizedReviewOutcome | undefined => {
  const normalized = value?.trim();
  return normalized !== undefined && isNormalizedReviewOutcome(normalized)
    ? normalized
    : undefined;
};

export const normalizeReviewRisk = (
  value: string | undefined
): NormalizedReviewRisk | undefined => {
  const normalized = value?.trim();
  return normalized !== undefined && isNormalizedReviewRisk(normalized)
    ? normalized
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
