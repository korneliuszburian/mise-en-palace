import { describe, expect, it } from "vitest";

import {
  buildFeedbackRecommendationReadback,
  feedbackRecommendationsForOutcome
} from "../feedback-delta.js";

describe("feedback recommendation readback", () => {
  it.each([
    ["selected", ["observe"], [false], ["packet membership", "does not prove application"]],
    ["used", ["add_evidence"], [true], ["application", "does not prove helped"]],
    ["helped", ["retain"], [false], ["fresh verification", "usefulness for this run"]],
    ["neutral", ["observe"], [true], ["neutral", "does not establish usefulness"]],
    ["noise", ["demote"], [true], ["did not help"]],
    ["stale", ["refresh", "supersede"], [true, true], ["current evidence", "newer decision"]],
    ["hurt", ["demote", "delete"], [true, true], ["hurt the task", "after review"]],
    ["rejected", ["delete"], [true], ["rejected"]],
    ["unknown", ["add_evidence"], [true], ["did not establish usefulness"]]
  ] as const)(
    "keeps %s recommendations within their evidence state",
    (outcome, actions, requiresReview, reasonFragments) => {
      const recommendations = feedbackRecommendationsForOutcome(outcome);
      const reasons = recommendations.map((recommendation) => recommendation.reason).join(" ");

      expect(recommendations.map((recommendation) => recommendation.action)).toEqual(actions);
      expect(recommendations.map((recommendation) => recommendation.requiresReview))
        .toEqual(requiresReview);
      for (const fragment of reasonFragments) {
        expect(reasons.toLowerCase()).toContain(fragment);
      }
    }
  );

  it("turns stale and hurt feedback into reviewable recommendations without mutating memory", () => {
    const staleReadback = buildFeedbackRecommendationReadback({
      subjectKind: "memory_record",
      subjectId: "knowledge:frontend-bootstrap-old",
      outcome: "stale",
      reason: "A newer source-backed decision replaced this starter.",
      evidenceRefs: ["feedback-delta-1", "source-claim-2"],
      doesNotProve: "This feedback does not prove the replacement applies to every future frontend project."
    });
    const hurtReadback = buildFeedbackRecommendationReadback({
      subjectKind: "memory_record",
      subjectId: "memory-old-bootstrap",
      outcome: "hurt",
      reason: "Applying this memory caused the wrong project setup.",
      evidenceRefs: ["memory-application-1", "memory-feedback-event-1"],
      doesNotProve: "This feedback does not delete memory without review."
    });

    expect(staleReadback.mutation).toBe("none");
    expect(staleReadback.recommendations.map((recommendation) => recommendation.action))
      .toEqual(["refresh", "supersede"]);
    expect(staleReadback.recommendations.every((recommendation) => recommendation.requiresReview))
      .toBe(true);
    expect(hurtReadback.mutation).toBe("none");
    expect(hurtReadback.recommendations.map((recommendation) => recommendation.action))
      .toEqual(["demote", "delete"]);
    expect(hurtReadback.evidenceRefs).toEqual([
      "memory-application-1",
      "memory-feedback-event-1"
    ]);
  });
});
