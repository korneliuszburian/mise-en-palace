import { describe, expect, test } from "vitest";

import {
  buildConsensusCandidateEvaluationPreview
} from "../consensusCandidateEvaluationPreview.js";

const generatedAt = "2026-06-29T06:00:00.000Z";

const support = {
  id: "support-1",
  position: "support" as const,
  summary: "The candidate is grounded in a completed dogfood report.",
  evidenceRef:
    "docs/reviews/controlled-dogfood/2026-06-29-v338-memory-staleness-heartbeat-candidate-preview/REPORT.md",
  doesNotProve: "This support does not prove promotion readiness."
};

const dissent = {
  id: "dissent-1",
  position: "dissent" as const,
  summary: "The candidate may overstate consensus because it has one run only.",
  evidenceRef:
    "docs/reviews/controlled-dogfood/2026-06-29-v338-memory-staleness-heartbeat-candidate-preview/REPORT.md#proof-boundary",
  doesNotProve: "This dissent does not prove the candidate should be rejected."
};

const risk = {
  id: "risk-1",
  position: "risk" as const,
  summary: "Autonomous truth runtime is explicitly out of scope.",
  evidenceRef:
    "docs/reviews/controlled-dogfood/2026-06-29-v338-memory-staleness-heartbeat-candidate-preview/REPORT.md#next-recommended-task",
  doesNotProve: "This risk does not prove the candidate is unusable."
};

describe("consensus candidate evaluation preview", () => {
  test("preserves dissent and keeps candidate evaluation read-only", () => {
    const result = buildConsensusCandidateEvaluationPreview({
      generatedAt,
      candidates: [{
        candidateId: "candidate-1",
        candidateKind: "eval_candidate",
        summary: "Evaluate candidate consensus with preserved dissent.",
        applicationGuidance:
          "Use this preview to route the candidate to human review without promotion.",
        evidence: [support, dissent, risk]
      }]
    });

    expect(result.mutation).toBe("none");
    expect(result.doesNotProve).toContain("autonomous agent judgment");
    expect(result.evaluations).toEqual([
      expect.objectContaining({
        id: "consensus-candidate-evaluation:candidate-1",
        kind: "consensus_candidate_evaluation_preview",
        candidateId: "candidate-1",
        candidateKind: "eval_candidate",
        reviewability: "ready",
        decisionOptions: [
          "review_candidate",
          "defer_candidate",
          "request_more_evidence"
        ],
        mutation: "none",
        forbiddenWrites: [
          "memory_records",
          "anti_memory_records",
          "source_claims",
          "source_decisions",
          "eval_candidates"
        ]
      })
    ]);
    expect(result.evaluations[0]?.preservedDissent).toEqual([dissent]);
    expect(result.evaluations[0]?.supportEvidenceRefs).toEqual([support.evidenceRef]);
    expect(result.evaluations[0]?.dissentEvidenceRefs).toEqual([dissent.evidenceRef]);
    expect(result.evaluations[0]?.riskEvidenceRefs).toEqual([risk.evidenceRef]);
  });

  test("preserves duplicate relation review focus as candidate-only consensus input", () => {
    const result = buildConsensusCandidateEvaluationPreview({
      generatedAt,
      candidates: [{
        candidateId: "candidate-duplicate-relation",
        candidateKind: "source_decision_candidate",
        summary: "Evaluate duplicate relation focus before source decision review.",
        applicationGuidance:
          "Use this preview to route graph relation review without promotion.",
        relationReview: {
          sourceClaimEdgeId: "edge-duplicate-1",
          edgeKind: "duplicates",
          relationReviewFocus: "duplicate",
          relationReviewQuestion:
            "Review whether these claims are true duplicates before consolidation, suppression, or source truth changes."
        },
        evidence: [support, risk]
      }]
    });

    expect(result.proof).toContain("relation review focus");
    expect(result.evaluations[0]).toEqual(
      expect.objectContaining({
        applicationGuidance:
          "Use this preview to route graph relation review without promotion. Review whether these claims are true duplicates before consolidation, suppression, or source truth changes.",
        relationReview: {
          sourceClaimEdgeId: "edge-duplicate-1",
          edgeKind: "duplicates",
          relationReviewFocus: "duplicate",
          relationReviewQuestion:
            "Review whether these claims are true duplicates before consolidation, suppression, or source truth changes.",
          consumedBy: "consensus_candidate_evaluation_preview",
          reviewUsefulness: "used",
          doesNotProve:
            "Consensus relation review focus consumption does not prove source truth, edge correctness, contradiction resolution, duplicate consolidation, consensus correctness, or Memory Core mutation."
        },
        mutation: "none",
        forbiddenWrites: [
          "memory_records",
          "anti_memory_records",
          "source_claims",
          "source_decisions",
          "eval_candidates"
        ]
      })
    );
  });

  test("requires supporting evidence before a candidate is review-ready", () => {
    const result = buildConsensusCandidateEvaluationPreview({
      generatedAt,
      candidates: [{
        candidateId: "candidate-without-support",
        candidateKind: "memory_candidate",
        summary: "Review a memory candidate with dissent only.",
        applicationGuidance: "Ask for support before review.",
        evidence: [dissent]
      }]
    });

    expect(result.evaluations[0]).toEqual(
      expect.objectContaining({
        reviewability: "needs_more_evidence",
        decisionOptions: ["request_more_evidence", "defer_candidate"]
      })
    );
    expect(result.evaluations[0]?.reviewabilityReasons).toContain(
      "Missing fields: supportingEvidence."
    );
  });

  test("keeps vague candidates from looking review-ready", () => {
    const result = buildConsensusCandidateEvaluationPreview({
      generatedAt,
      candidates: [{
        candidateId: "candidate-vague",
        candidateKind: "skill_candidate",
        summary: "Review changed files for reusable memory.",
        applicationGuidance: "Do not promote vague candidates.",
        evidence: [support]
      }]
    });

    expect(result.evaluations[0]).toEqual(
      expect.objectContaining({
        reviewability: "too_vague",
        decisionOptions: ["request_more_evidence", "defer_candidate"]
      })
    );
  });

  test("routes duplicate and not useful candidates away from promotion", () => {
    const duplicate = buildConsensusCandidateEvaluationPreview({
      generatedAt,
      candidates: [{
        candidateId: "candidate-duplicate",
        candidateKind: "source_decision_candidate",
        summary: "Reuse source-to-decision retention gate.",
        duplicateOf: "source-to-decision-retention-gate",
        applicationGuidance: "Reject duplicates before review burden grows.",
        evidence: [support]
      }]
    });
    const notUseful = buildConsensusCandidateEvaluationPreview({
      generatedAt,
      candidates: [{
        candidateId: "candidate-not-useful",
        candidateKind: "policy_candidate",
        summary: "Add another decorative policy note.",
        notUsefulReason: "Candidate would not reduce future review burden.",
        applicationGuidance: "Reject decorative candidates.",
        evidence: [support]
      }]
    });

    expect(duplicate.evaluations[0]).toEqual(
      expect.objectContaining({
        reviewability: "duplicate",
        decisionOptions: ["reject_candidate", "defer_candidate"]
      })
    );
    expect(notUseful.evaluations[0]).toEqual(
      expect.objectContaining({
        reviewability: "not_useful",
        decisionOptions: ["reject_candidate", "defer_candidate"]
      })
    );
  });

  test("respects maxCandidates zero", () => {
    const result = buildConsensusCandidateEvaluationPreview({
      generatedAt,
      maxCandidates: 0,
      candidates: [{
        candidateId: "candidate-disabled",
        candidateKind: "unknown_candidate",
        summary: "Evaluate nothing.",
        evidence: [support]
      }]
    });

    expect(result.evaluations).toEqual([]);
    expect(result.skippedCandidateCount).toBe(1);
    expect(result.mutation).toBe("none");
  });
});
