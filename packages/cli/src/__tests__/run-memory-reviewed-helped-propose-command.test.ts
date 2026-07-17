import { describe, expect, it } from "vitest";

import type { MemoryCandidate } from "@krn/core";

import type { DatabaseRuntime } from "../database-runtime.js";
import { createNoStoreCompilerDependencies } from "../no-store-repositories.js";
import { runMemoryReviewedHelpedProposeCommand } from "../run-memory-reviewed-helped-propose-command.js";
import { unusedMemoryRepository } from "./helpers/test-runtime.js";

const now = "2026-07-16T12:00:00.000Z";

const candidate: MemoryCandidate = {
  id: "candidate-1",
  projectId: "project-1",
  executionRunId: "run-1",
  feedbackDeltaId: "feedback-1",
  reviewAssessmentId: "review-1",
  usefulnessApplicationId: "application-1",
  proposedBy: "krn memory learn propose",
  kind: "procedure",
  status: "candidate",
  summary: "Parse raw JSON as unknown before validated domain reads.",
  body: "Store-validated reviewed helped learning.",
  owner: "memory-core",
  confidence: 90,
  applicationGuidance: "Use at JSON boundaries.",
  sourceClaimIds: ["claim-1"],
  sourceLineage: [{ sourceId: "claim-1" }],
  isUserPreference: false,
  validFrom: now,
  metadata: {
    sourceDecisionId: "decision-1",
    usefulnessOutcome: "helped"
  },
  createdAt: now,
  updatedAt: now
};

describe("runMemoryReviewedHelpedProposeCommand", () => {
  it("keeps preview no-store and delegates persisted eligibility to the atomic repository seam", async () => {
    let databaseCalls = 0;
    const preview = await runMemoryReviewedHelpedProposeCommand({
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      createDatabaseRuntime: async (): Promise<never> => {
        databaseCalls += 1;
        throw new Error("preview must not create a database runtime");
      },
      command: {
        kind: "memoryReviewedHelpedPropose",
        persist: false,
        feedbackDeltaId: "feedback-1",
        reviewAssessmentId: "review-1",
        sourceDecisionId: "decision-1"
      }
    });

    expect(preview.stdout).toContain("DB reads: none");
    expect(preview.stdout).toContain("Eligibility: not asserted");
    expect(databaseCalls).toBe(0);

    let closeCount = 0;
    let proposalInput: unknown;
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const createDatabaseRuntime = async (): Promise<DatabaseRuntime> => ({
      workspaceId: "workspace-1",
      projectId: "project-1",
      compilerDependencies: dependencies,
      harnessRunRepository: {} as DatabaseRuntime["harnessRunRepository"],
      sourceRepository: {} as DatabaseRuntime["sourceRepository"],
      memoryRepository: {
        ...unusedMemoryRepository,
        async proposeReviewedHelpedMemoryCandidateOnce(input) {
          proposalInput = input;
          return {
            candidate,
            created: false,
            sourceClaimId: "claim-1",
            evidenceBundleId: "bundle-1",
            usefulnessApplicationId: "application-1",
            packetChecksum: "packet-1"
          };
        }
      } as DatabaseRuntime["memoryRepository"],
      async close() {
        closeCount += 1;
      }
    });

    const persisted = await runMemoryReviewedHelpedProposeCommand({
      env: { KRN_DATABASE_URL: "postgres://local" },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      createDatabaseRuntime,
      command: {
        kind: "memoryReviewedHelpedPropose",
        persist: true,
        projectId: "project-1",
        feedbackDeltaId: "feedback-1",
        reviewAssessmentId: "review-1",
        sourceDecisionId: "decision-1"
      }
    });

    expect(proposalInput).toEqual({
      projectId: "project-1",
      feedbackDeltaId: "feedback-1",
      reviewAssessmentId: "review-1",
      sourceDecisionId: "decision-1"
    });
    expect(persisted.stdout).toContain("memoryCandidate: candidate-1");
    expect(persisted.stdout).toContain("created: no (idempotent readback)");
    expect(persisted.stdout).toContain("MemoryRecord created: no");
    expect(closeCount).toBe(1);
  });
});
