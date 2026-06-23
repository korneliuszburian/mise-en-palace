import {
  describe,
  expect,
  it
} from "vitest";

import {
  formatReviewAssessUsage,
  parseReviewArgs
} from "./parseReviewArgs.js";

describe("parseReviewArgs", () => {
  it("parses review assess with findings, labels, metadata, and risk fields", () => {
    expect(parseReviewArgs([
      "assess",
      "--evidence-bundle-id",
      " evidence-1 ",
      "--reviewer=operator",
      "--status",
      "changes_requested",
      "--summary",
      "Needs rollback evidence",
      "--finding=medium:rollback missing",
      "--outcome",
      "needs_changes",
      "--review-burden",
      "medium",
      "--diff-risk",
      "high",
      "--correction-label",
      "rollback_path",
      "--metadata",
      "slice=QG-04B",
      "--persist"
    ])).toEqual({
      command: {
        kind: "reviewAssess",
        persist: true,
        evidenceBundleId: "evidence-1",
        reviewer: "operator",
        status: "changes_requested",
        summary: "Needs rollback evidence",
        findings: ["medium:rollback missing"],
        outcome: "needs_changes",
        reviewBurden: "medium",
        diffRisk: "high",
        correctionLabels: ["rollback_path"],
        metadata: {
          slice: "QG-04B"
        }
      }
    });
  });

  it("rejects unsupported review command shapes", () => {
    expect(parseReviewArgs([])).toEqual({
      error: formatReviewAssessUsage()
    });
    expect(parseReviewArgs(["show"])).toEqual({
      error: formatReviewAssessUsage()
    });
    expect(parseReviewArgs(["assess", "--metadata", "not-a-pair"])).toEqual({
      error: "--metadata requires key=value"
    });
    expect(parseReviewArgs(["assess", "--unknown"])).toEqual({
      error: formatReviewAssessUsage()
    });
  });
});
