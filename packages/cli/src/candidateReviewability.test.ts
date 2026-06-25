import {
  describe,
  expect,
  it
} from "vitest";

import {
  assessCandidateReviewability
} from "./candidateReviewability.js";

describe("candidate reviewability", () => {
  it("classifies review-ready candidates", () => {
    expect(assessCandidateReviewability({
      summary: "Apply evidence provenance labels when rendering command proof.",
      body: "Use when rendering EvidenceBundle command rows for operator review.",
      evidenceRefs: ["docs/reviews/controlled-dogfood/report.md"],
      applicationGuidance:
        "Use for evidence capture output that renders command proof provenance.",
      doesNotProve:
        "This does not prove the candidate should be promoted automatically."
    })).toEqual({
      reviewability: "ready",
      reasons: [
        "Candidate has review evidence, application guidance, and doesNotProve boundary."
      ]
    });
  });

  it("classifies candidates missing evidence as needs_more_evidence", () => {
    expect(assessCandidateReviewability({
      summary: "Render candidate reviewability before human review.",
      body: "Use when showing feedback candidates.",
      applicationGuidance: "Show this in candidate output.",
      doesNotProve:
        "This does not prove the candidate should be promoted automatically."
    })).toEqual({
      reviewability: "needs_more_evidence",
      reasons: ["Missing evidence refs or source lineage."]
    });
  });

  it("classifies vague candidates as too_vague", () => {
    expect(assessCandidateReviewability({
      summary: "Improve quality",
      body: "Review files and make things better.",
      evidenceRefs: ["packages/cli/src/runEvidenceCaptureCommand.ts"],
      applicationGuidance: "Use when reviewing files.",
      doesNotProve:
        "This does not prove the candidate should be promoted automatically."
    })).toEqual({
      reviewability: "too_vague",
      reasons: ["Candidate does not name a concrete future use."]
    });
  });

  it("classifies duplicates and not-useful candidates before evidence checks", () => {
    expect(assessCandidateReviewability({
      summary: "Duplicate candidate.",
      duplicateOf: "memory:existing-reviewability-rule"
    }).reviewability).toBe("duplicate");
    expect(assessCandidateReviewability({
      summary: "Not useful candidate.",
      notUsefulReason: "Candidate would not reduce future review burden."
    })).toEqual({
      reviewability: "not_useful",
      reasons: ["Candidate would not reduce future review burden."]
    });
  });
});
