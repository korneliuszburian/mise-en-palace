import { describe, expect, it } from "vitest";

import {
  runCli
} from "../run-cli.js";
import {
  createNoStoreCompilerDependencies
} from "../no-store-repositories.js";
import type {
  CreateReviewFeedbackOnceInput
} from "@krn/core/repositories/internal";
import {
  now
} from "./helpers/test-runtime.js";

describe("runCli", () => {
  it("persists review assess as a ReviewAssessment and FeedbackDelta", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedInput: CreateReviewFeedbackOnceInput | undefined;
    const harnessRunRepository = {
      ...dependencies.harnessRunRepository,
      async createReviewFeedbackOnce(input: CreateReviewFeedbackOnceInput) {
        capturedInput = input;
        return {
          reviewAssessment: {
            id: "review-assessment-1",
            evidenceBundleId: input.evidenceBundleId,
            status: input.review.status ?? "pending",
            reviewer: input.review.reviewer,
            summary: input.review.summary,
            findings: input.review.findings,
            metadata: input.review.metadata ?? {},
            createdAt: now,
            updatedAt: now
          },
          feedbackDelta: {
            id: "feedback-delta-1",
            reviewAssessmentId: "review-assessment-1",
            status: input.feedback.status ?? "candidate",
            memoryCandidates: input.feedback.memoryCandidates,
            sourceDecisions: input.feedback.sourceDecisions,
            evalCandidates: input.feedback.evalCandidates,
            metadata: input.feedback.metadata ?? {},
            createdAt: now,
            updatedAt: now
          },
          created: true
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
    expect(capturedInput).toMatchObject({
      evidenceBundleId: "evidence-bundle-1",
      requestIdentity: "review:evidence-bundle-1",
      review: {
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
      },
      feedback: {
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
      }
    });
  });

  it("does not duplicate an assessment when review persistence is retried", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const persistedAssessmentIds: string[] = [];
    const requestIdentities: string[] = [];
    let persistenceAttempts = 0;
    const harnessRunRepository = {
      ...dependencies.harnessRunRepository,
      async createReviewFeedbackOnce(input: CreateReviewFeedbackOnceInput) {
        persistenceAttempts += 1;
        requestIdentities.push(input.requestIdentity);

        if (persistenceAttempts === 1) {
          throw new Error("fault after review assessment");
        }

        persistedAssessmentIds.push("review-assessment-1");
        return {
          reviewAssessment: {
            id: "review-assessment-1",
            evidenceBundleId: input.evidenceBundleId,
            status: input.review.status ?? "pending",
            reviewer: input.review.reviewer,
            summary: input.review.summary,
            findings: input.review.findings,
            metadata: input.review.metadata ?? {},
            createdAt: now,
            updatedAt: now
          },
          feedbackDelta: {
            id: "feedback-delta-1",
            reviewAssessmentId: "review-assessment-1",
            status: input.feedback.status ?? "candidate",
            memoryCandidates: input.feedback.memoryCandidates,
            sourceDecisions: input.feedback.sourceDecisions,
            evalCandidates: input.feedback.evalCandidates,
            metadata: input.feedback.metadata ?? {},
            createdAt: now,
            updatedAt: now
          },
          created: true
        };
      }
    };
    const args = [
      "review",
      "assess",
      "--evidence-bundle-id",
      "evidence-bundle-1",
      "--reviewer",
      "operator",
      "--summary",
      "Retry the same assessment.",
      "--persist"
    ];
    const runtime = {
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix: string) => `${prefix}-1`,
      createReviewAssessDatabaseRuntime: async () => ({
        harnessRunRepository,
        async close() {
          return undefined;
        }
      })
    };

    await expect(runCli(args, runtime)).resolves.toMatchObject({
      exitCode: 1,
      stderr: "fault after review assessment\n"
    });
    await expect(runCli(args, runtime)).resolves.toMatchObject({ exitCode: 0 });

    expect(persistedAssessmentIds).toEqual(["review-assessment-1"]);
    expect(requestIdentities).toEqual([
      "review:evidence-bundle-1",
      "review:evidence-bundle-1"
    ]);
  });
});
