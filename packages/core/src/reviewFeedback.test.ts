import { describe, expect, expectTypeOf, test } from "vitest";

import {
  normalizeReviewAssessment,
  type ReviewAssessment
} from "./reviewAssessment.js";
import {
  normalizeFeedbackDelta,
  summarizeFeedbackCandidateProposals,
  type FeedbackDeltaCreateStatus,
  type FeedbackDeltaLifecycleStatus,
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
  test("separates feedback delta create status from later lifecycle states", () => {
    expectTypeOf<FeedbackDeltaCreateStatus>().toEqualTypeOf<"candidate">();
    expectTypeOf<FeedbackDeltaLifecycleStatus>().toEqualTypeOf<
      "accepted" | "rejected" | "applied"
    >();
  });

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

describe("feedback candidate proposal summary", () => {
  test("types eval candidates as proposal-only candidate status", () => {
    expectTypeOf<FeedbackDelta["evalCandidates"][number]["status"]>().toEqualTypeOf<"candidate">();
  });

  test("summarizes structured candidate proposals without final memory mutation semantics", () => {
    expect(summarizeFeedbackCandidateProposals(feedback({
      memoryCandidates: [{
        id: "memory-candidate-1",
        projectId: "project-1",
        feedbackDeltaId: "feedback-1",
        proposedBy: "reviewer",
        kind: "procedure",
        status: "candidate",
        summary: "Keep review feedback as candidates.",
        body: "Feedback extraction must not create MemoryRecord rows.",
        owner: "memory-governance",
        confidence: 80,
        applicationGuidance: "Use when closing review slices.",
        sourceClaimIds: [],
        sourceLineage: [{
          sourceId: "review-1",
          note: "review feedback"
        }],
        isUserPreference: false,
        validFrom: now,
        metadata: {},
        createdAt: now,
        updatedAt: now
      }],
      sourceDecisions: [{
        id: "source-decision-candidate-1",
        status: "defer",
        decision: "Review source graph decision update.",
        rationale: "Changed files imply a possible source decision.",
        falsifier: "No SourceClaim with mechanism exists.",
        consumer: "krn evidence capture",
        metadata: {},
        createdAt: now,
        updatedAt: now
      }],
      evalCandidates: [{
        id: "eval-candidate-1",
        projectId: "project-1",
        status: "candidate",
        title: "Feedback proposal summary does not promote memory",
        scenario: "Review feedback contains memory guidance.",
        expectedSignal: "Candidate proposal summary exists; MemoryRecord does not.",
        sourceEvidence: ["review-1"],
        metadata: {},
        createdAt: now
      }],
      metadata: {
        sourceClaimCandidates: [{
          id: "source-claim-candidate-1",
          claim: "Review feedback can propose source claims."
        }],
        antiMemoryCandidates: [{
          id: "anti-memory-candidate-1",
          rejectedClaim: "Feedback can directly mutate Memory Core."
        }],
        observationCandidates: [{
          id: "observation-candidate-1",
          summary: "Reviewer found a recurring rollback gap."
        }]
      }
    }))).toEqual({
      memoryRecordMutation: "none",
      counts: {
        memoryCandidates: 1,
        sourceClaimCandidates: 1,
        sourceDecisionCandidates: 1,
        antiMemoryCandidates: 1,
        evalCandidates: 1,
        observationCandidates: 1
      },
      candidates: [
        {
          kind: "memory_candidate",
          id: "memory-candidate-1",
          summary: "Keep review feedback as candidates.",
          status: "candidate"
        },
        {
          kind: "source_claim_candidate",
          id: "source-claim-candidate-1",
          summary: "Review feedback can propose source claims."
        },
        {
          kind: "source_decision_candidate",
          id: "source-decision-candidate-1",
          summary: "Review source graph decision update.",
          status: "defer"
        },
        {
          kind: "anti_memory_candidate",
          id: "anti-memory-candidate-1",
          summary: "Feedback can directly mutate Memory Core."
        },
        {
          kind: "eval_candidate",
          id: "eval-candidate-1",
          summary: "Feedback proposal summary does not promote memory",
          status: "candidate"
        },
        {
          kind: "observation_candidate",
          id: "observation-candidate-1",
          summary: "Reviewer found a recurring rollback gap."
        }
      ]
    });
  });
});
