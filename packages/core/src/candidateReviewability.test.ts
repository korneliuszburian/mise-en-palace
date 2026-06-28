import { describe, expect, it } from "vitest";

import {
  assessCandidateReviewability
} from "./candidateReviewability.js";

describe("candidate reviewability", () => {
  it("classifies evidence-backed candidates as ready", () => {
    expect(assessCandidateReviewability({
      summary: "Use evidence provenance when reviewing candidate output.",
      body: "Future candidate reviews should inspect command provenance before promotion.",
      evidenceRefs: ["evidence-bundle-1"],
      applicationGuidance: "Use when a feedback candidate is reviewed.",
      doesNotProve: "This does not prove the candidate should be promoted."
    })).toEqual({
      reviewability: "ready",
      reasons: ["Candidate has review evidence, application guidance, and doesNotProve boundary."]
    });
  });

  it("classifies missing evidence as needs_more_evidence", () => {
    expect(assessCandidateReviewability({
      summary: "Use activation context for review.",
      applicationGuidance: "Use when activation output is reviewed.",
      doesNotProve: "This does not prove activation scoring is correct."
    })).toEqual({
      reviewability: "needs_more_evidence",
      reasons: ["Missing evidence refs or source lineage."]
    });
  });

  it("accepts typed source lineage as review evidence", () => {
    expect(assessCandidateReviewability({
      summary: "Use source-grounded candidate review.",
      sourceLineage: [{ sourceId: "source-claim-1", note: "review source" }],
      applicationGuidance: "Use when reviewing source-grounded candidates.",
      doesNotProve: "This does not prove the candidate should be promoted."
    })).toEqual({
      reviewability: "ready",
      reasons: ["Candidate has review evidence, application guidance, and doesNotProve boundary."]
    });
  });

  it("classifies vague candidates as too_vague", () => {
    expect(assessCandidateReviewability({
      summary: "Review changed files for reusable memory.",
      evidenceRefs: ["PLAN.md"],
      applicationGuidance: "Use later.",
      doesNotProve: "This does not prove usefulness."
    })).toEqual({
      reviewability: "too_vague",
      reasons: ["Candidate does not name a concrete future use."]
    });
  });

  it("classifies duplicate and not-useful candidates before evidence checks", () => {
    expect(assessCandidateReviewability({
      summary: "Duplicate candidate.",
      duplicateOf: "memory-1"
    }).reviewability).toBe("duplicate");

    expect(assessCandidateReviewability({
      summary: "Unhelpful candidate.",
      notUsefulReason: "Candidate would add review burden without a future use."
    }).reviewability).toBe("not_useful");
  });
});
