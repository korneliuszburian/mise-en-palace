import {
  describe,
  expect,
  test
} from "vitest";

import {
  isNormalizedReviewOutcome,
  isNormalizedReviewRisk,
  isReviewAssessmentStatus,
  normalizeReviewOutcome,
  normalizeReviewRisk,
  reviewStringListMetadata,
  reviewStringMetadata
} from "./reviewSignal.js";

describe("review signal vocabulary", () => {
  test("normalizes shared review outcomes and risk values", () => {
    expect(isReviewAssessmentStatus("changes_requested")).toBe(true);
    expect(isReviewAssessmentStatus("needs_changes")).toBe(false);
    expect(isNormalizedReviewOutcome("needs_changes")).toBe(true);
    expect(isNormalizedReviewOutcome("great")).toBe(false);
    expect(isNormalizedReviewRisk("high")).toBe(true);
    expect(isNormalizedReviewRisk("critical")).toBe(false);
    expect(normalizeReviewOutcome(" changes_requested ")).toBe("changes_requested");
    expect(normalizeReviewOutcome("great")).toBeUndefined();
    expect(normalizeReviewRisk(" medium ")).toBe("medium");
    expect(normalizeReviewRisk("critical")).toBeUndefined();
  });

  test("reads normalized string and string-list metadata", () => {
    const metadata = {
      outcome: " needs_changes ",
      correctionLabels: [" rollback ", "", 42, "source_grounding"]
    };

    expect(reviewStringMetadata(metadata, "outcome")).toBe("needs_changes");
    expect(reviewStringMetadata(metadata, "missing")).toBeUndefined();
    expect(reviewStringListMetadata(metadata, "correctionLabels")).toEqual([
      "rollback",
      "source_grounding"
    ]);
  });
});
