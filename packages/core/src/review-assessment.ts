import type {
  EvidenceBundleId,
  ReviewAssessmentId
} from "./ids.js";
import type { ReviewAssessmentStatus } from "./review-outcome.js";
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
