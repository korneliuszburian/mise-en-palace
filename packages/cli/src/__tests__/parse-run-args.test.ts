import { describe, expect, it } from "vitest";

import {
  parseRunArgs
} from "../parse-run-args.js";

describe("parseRunArgs", () => {
  it("parses run show with run id", () => {
    expect(parseRunArgs(["show", "--run-id", "run-1"])).toEqual({
      command: {
        kind: "runShow",
        runId: "run-1",
        format: "text"
      }
    });
  });

  it("parses run show json format", () => {
    expect(parseRunArgs(["show", "--run-id", "run-1", "--json"])).toEqual({
      command: {
        kind: "runShow",
        runId: "run-1",
        format: "json"
      }
    });
  });

  it("requires run id", () => {
    expect(parseRunArgs(["show"])).toEqual({
      error: expect.stringContaining("Missing required --run-id")
    });
  });

  it("parses eval promotion eligibility with exact candidate identity", () => {
    expect(parseRunArgs([
      "eval-promotion-eligibility",
      "--project-id",
      "project-1",
      "--run-id",
      "run-1",
      "--candidate-id",
      "paired-target-repair:run-1",
      "--source-decision-id",
      "source-decision-1",
      "--review-assessment-id",
      "review-1",
      "--limit",
      "5",
      "--json"
    ])).toEqual({
      command: {
        kind: "runEvalPromotionEligibility",
        projectId: "project-1",
        runId: "run-1",
        candidateId: "paired-target-repair:run-1",
        sourceDecisionId: "source-decision-1",
        reviewAssessmentId: "review-1",
        limit: 5,
        format: "json"
      }
    });
  });
});
