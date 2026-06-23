import type {
  EvidenceBundleId,
  ReviewAssessmentId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type ReviewAssessmentStatus =
  | "pending"
  | "accepted"
  | "changes_requested"
  | "rejected";

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

export type NormalizedReviewOutcome =
  | "accepted"
  | "changes_requested"
  | "rejected"
  | "pending"
  | "needs_changes";

export type NormalizedReviewBurden = "low" | "medium" | "high";
export type NormalizedReviewRisk = "low" | "medium" | "high";

export interface NormalizedReviewSignal {
  outcome: NormalizedReviewOutcome;
  reviewBurden: NormalizedReviewBurden;
  diffRisk: NormalizedReviewRisk;
  correctionLabels: string[];
}

const reviewOutcomes = new Set<NormalizedReviewOutcome>([
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

const isReviewOutcome = (value: string): value is NormalizedReviewOutcome =>
  reviewOutcomes.has(value as NormalizedReviewOutcome);

const isReviewRisk = (value: string): value is NormalizedReviewRisk =>
  riskValues.has(value as NormalizedReviewRisk);

const normalizeOutcome = (value: string | undefined): NormalizedReviewOutcome | undefined =>
  value !== undefined && isReviewOutcome(value)
    ? value
    : undefined;

const normalizeRisk = (value: string | undefined): NormalizedReviewRisk | undefined =>
  value !== undefined && isReviewRisk(value)
    ? value
    : undefined;

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
  const correctionLabels = stringListMetadata(review.metadata, "correctionLabels");

  return {
    outcome: normalizeOutcome(stringMetadata(review.metadata, "outcome")) ?? review.status,
    reviewBurden:
      normalizeRisk(stringMetadata(review.metadata, "reviewBurden")) ??
      highestFindingSeverity(review.findings),
    diffRisk:
      normalizeRisk(stringMetadata(review.metadata, "diffRisk")) ??
      highestFindingSeverity(review.findings),
    correctionLabels: correctionLabels.length > 0
      ? correctionLabels
      : review.findings.length > 0
        ? ["review_finding"]
        : ["review_clean"]
  };
};
