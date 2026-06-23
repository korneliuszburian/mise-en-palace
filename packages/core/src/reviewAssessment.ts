import type {
  EvidenceBundleId,
  ReviewAssessmentId
} from "./ids.js";
import {
  normalizeReviewOutcome,
  normalizeReviewRisk,
  reviewStringListMetadata,
  reviewStringMetadata
} from "./reviewSignal.js";
import type {
  NormalizedReviewSignal,
  NormalizedReviewRisk,
  ReviewAssessmentStatus
} from "./reviewSignal.js";
import type { IsoTimestamp } from "./time.js";

export interface ReviewFinding {
  severity: "low" | "medium" | "high";
  message: string;
  file?: string;
  line?: number;
}

export interface ReviewAssessment {
  id: ReviewAssessmentId;
  evidenceBundleId: EvidenceBundleId;
  status: ReviewAssessmentStatus;
  reviewer: string;
  summary: string;
  findings: ReviewFinding[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

const highestFindingSeverity = (
  findings: readonly ReviewFinding[]
): NormalizedReviewRisk => {
  if (findings.some((finding) => finding.severity === "high")) {
    return "high";
  }

  if (findings.some((finding) => finding.severity === "medium")) {
    return "medium";
  }

  return "low";
};

export const normalizeReviewAssessment = (
  review: ReviewAssessment
): NormalizedReviewSignal => {
  const correctionLabels = reviewStringListMetadata(review.metadata, "correctionLabels");

  return {
    outcome: normalizeReviewOutcome(reviewStringMetadata(review.metadata, "outcome")) ?? review.status,
    reviewBurden:
      normalizeReviewRisk(reviewStringMetadata(review.metadata, "reviewBurden")) ??
      highestFindingSeverity(review.findings),
    diffRisk:
      normalizeReviewRisk(reviewStringMetadata(review.metadata, "diffRisk")) ??
      highestFindingSeverity(review.findings),
    correctionLabels: correctionLabels.length > 0
      ? correctionLabels
      : review.findings.length > 0
        ? ["review_finding"]
        : ["review_clean"]
  };
};
