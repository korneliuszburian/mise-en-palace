import { describe, expect, it } from "vitest";

import {
  buildFeedbackRecommendationReadback
} from "../feedback-delta.js";

describe("feedback recommendation readback", () => {
  it("turns stale and hurt feedback into reviewable recommendations without mutating memory", () => {
    const staleReadback = buildFeedbackRecommendationReadback({
      subjectKind: "brain_knowledge",
      subjectId: "pattern:frontend-bootstrap-old",
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
