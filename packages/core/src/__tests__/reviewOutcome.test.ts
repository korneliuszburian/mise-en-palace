import {
  describe,
  expect,
  test
} from "vitest";

import {
  isReviewOutcome,
  isReviewRisk,
  isReviewAssessmentStatus,
  parseReviewOutcome,
  parseReviewRisk,
  reviewStringListMetadata,
  reviewStringMetadata
} from "../reviewOutcome.js";

describe("review outcome vocabulary", () => {
  test("normalizes shared review outcomes and risk values", () => {
    expect(isReviewAssessmentStatus("changes_requested")).toBe(true);
    expect(isReviewAssessmentStatus("needs_changes")).toBe(false);
    expect(isReviewOutcome("needs_changes")).toBe(true);
    expect(isReviewOutcome("great")).toBe(false);
    expect(isReviewRisk("high")).toBe(true);
    expect(isReviewRisk("critical")).toBe(false);
    expect(parseReviewOutcome(" changes_requested ")).toBe("changes_requested");
    expect(parseReviewOutcome("great")).toBeUndefined();
    expect(parseReviewRisk(" medium ")).toBe("medium");
    expect(parseReviewRisk("critical")).toBeUndefined();
  });

  test("reads trimmed string and string-list metadata", () => {
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
