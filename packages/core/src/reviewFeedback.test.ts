import { describe, expect, test } from "vitest";

import {
  normalizeReviewAssessment,
  type ReviewAssessment
} from "./reviewAssessment.js";
import {
  normalizeFeedbackDelta,
  type FeedbackDelta
} from "./feedbackDelta.js";

const now = "2026-06-23T07:20:00.000Z";

const review = (overrides: Partial<ReviewAssessment>): ReviewAssessment => ({
  id: "review-1",
  evidenceBundleId: "evidence-1",
  status: "changes_requested",
  reviewer: "extended-reviewer",
  summary: "Changes need source grounding and rollback evidence.",
  findings: [
    {
      severity: "high",
      message: "Missing rollback proof.",
      file: "PLAN.md"
    },
    {
      severity: "medium",
      message: "Type boundary should be reviewed.",
      file: "packages/core/src/reviewAssessment.ts"
    }
  ],
  metadata: {
    outcome: "changes_requested",
    reviewBurden: "high",
    diffRisk: "medium",
    correctionLabels: ["rollback_missing", "type_boundary"]
  },
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const feedback = (overrides: Partial<FeedbackDelta>): FeedbackDelta => ({
  id: "feedback-1",
  reviewAssessmentId: "review-1",
  status: "candidate",
  memoryCandidates: [],
  sourceDecisions: [],
  evalCandidates: [],
  metadata: {
    outcome: "needs_changes",
    burden: "medium",
    risk: "high",
    correctionLabels: ["source_grounding", "rollback"]
  },
  createdAt: now,
  updatedAt: now,
  ...overrides
});

describe("review and feedback normalization", () => {
  test("normalizes review outcome burden risk and correction labels", () => {
    expect(normalizeReviewAssessment(review({}))).toEqual({
      outcome: "changes_requested",
      reviewBurden: "high",
      diffRisk: "medium",
      correctionLabels: ["rollback_missing", "type_boundary"]
    });
  });

  test("falls back to conservative review labels from status and findings", () => {
    expect(normalizeReviewAssessment(review({
      status: "accepted",
      findings: [
        {
          severity: "low",
          message: "Minor wording polish."
        }
      ],
      metadata: {}
    }))).toEqual({
      outcome: "accepted",
      reviewBurden: "low",
      diffRisk: "low",
      correctionLabels: ["review_finding"]
    });
  });

  test("normalizes feedback outcome burden risk and correction labels", () => {
    expect(normalizeFeedbackDelta(feedback({}))).toEqual({
      outcome: "needs_changes",
      reviewBurden: "medium",
      diffRisk: "high",
      correctionLabels: ["source_grounding", "rollback"]
    });
  });

  test("falls back to stable feedback labels when metadata is absent", () => {
    expect(normalizeFeedbackDelta(feedback({
      status: "accepted",
      metadata: {}
    }))).toEqual({
      outcome: "accepted",
      reviewBurden: "low",
      diffRisk: "low",
      correctionLabels: ["feedback_delta"]
    });
  });
});
