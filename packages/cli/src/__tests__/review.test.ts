import { describe, expect, it } from "vitest";

import {
  runCli
} from "../runCli.js";
import {
  createNoStoreCompilerDependencies
} from "../noStoreRepositories.js";
import type {
  CreateFeedbackDeltaInput,
  CreateReviewAssessmentInput
} from "@krn/harness/repositories/internal";
import {
  now
} from "./helpers/testRuntime.js";

describe("runCli", () => {
  it("persists review assess as a ReviewAssessment and FeedbackDelta", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedReviewAssessment: CreateReviewAssessmentInput | undefined;
    let capturedFeedbackDelta: CreateFeedbackDeltaInput | undefined;
    const harnessRunRepository = {
      ...dependencies.harnessRunRepository,
      async createReviewAssessment(input: CreateReviewAssessmentInput) {
        capturedReviewAssessment = input;

        return {
          id: "review-assessment-1",
          evidenceBundleId: input.evidenceBundleId,
          status: input.status ?? "pending",
          reviewer: input.reviewer,
          summary: input.summary,
          findings: input.findings,
          metadata: input.metadata ?? {},
          createdAt: now,
          updatedAt: now
        };
      },
      async createFeedbackDelta(input: CreateFeedbackDeltaInput) {
        capturedFeedbackDelta = input;

        return {
          id: "feedback-delta-1",
          reviewAssessmentId: input.reviewAssessmentId,
          status: input.status ?? "candidate",
          memoryCandidates: input.memoryCandidates,
          sourceDecisions: input.sourceDecisions,
          evalCandidates: input.evalCandidates,
          metadata: input.metadata ?? {},
          createdAt: now,
          updatedAt: now
        };
      }
    };

    const result = await runCli(
      [
        "review",
        "assess",
        "--evidence-bundle-id",
        "evidence-bundle-1",
        "--reviewer",
        "operator",
        "--status",
        "changes_requested",
        "--summary",
        "Needs a stricter rollback path.",
        "--finding",
        "medium:Rollback path is too vague",
        "--outcome",
        "changes_requested",
        "--review-burden",
        "medium",
        "--diff-risk",
        "medium",
        "--correction-label",
        "rollback_path",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createReviewAssessDatabaseRuntime: async () => ({
          harnessRunRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Review Assess");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("reviewAssessment: review-assessment-1");
    expect(result.stdout).toContain("feedbackDelta: feedback-delta-1");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("MemoryRecord created: no");
    expect(capturedReviewAssessment).toMatchObject({
      evidenceBundleId: "evidence-bundle-1",
      status: "changes_requested",
      reviewer: "operator",
      summary: "Needs a stricter rollback path.",
      findings: [{
        severity: "medium",
        message: "Rollback path is too vague"
      }],
      metadata: {
        outcome: "changes_requested",
        reviewBurden: "medium",
        diffRisk: "medium",
        correctionLabels: ["rollback_path"]
      }
    });
    expect(capturedFeedbackDelta).toMatchObject({
      reviewAssessmentId: "review-assessment-1",
      status: "candidate",
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [],
      metadata: {
        outcome: "changes_requested",
        reviewBurden: "medium",
        diffRisk: "medium",
        correctionLabels: ["rollback_path"],
        memoryRecordMutation: "none"
      }
    });
  });
});
