import { describe, expect, it } from "vitest";
import type {
  HarnessRunAggregate
} from "@krn/harness/repositories";

import {
  runRunShowCommand
} from "./runRunShowCommand.js";

const now = "2026-06-25T14:40:00.000Z";

const aggregate: HarnessRunAggregate = {
  operatorIntent: {
    id: "intent-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    source: "cli",
    rawIntent: "show run",
    metadata: {},
    createdAt: now
  },
  taskContract: {
    id: "task-1",
    operatorIntentId: "intent-1",
    projectId: "project-1",
    title: "Read back run evidence",
    objective: "Show persisted evidence without SQL.",
    constraints: ["read-only"],
    nonGoals: ["do not mutate memory"],
    acceptance: ["operator sees proof boundaries"],
    status: "active",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  harnessPlan: {
    id: "plan-1",
    taskContractId: "task-1",
    version: 1,
    status: "ready",
    summary: "Run readback plan",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  contextAssembly: {
    id: "context-1",
    harnessPlanId: "plan-1",
    status: "assembled",
    tokenBudget: 100,
    inclusions: [{
      subjectType: "source_claim",
      subjectId: "claim-1",
      reason: "Evidence readback should distinguish proof strength.",
      expectedUse: "Render proof boundary.",
      tokenEstimate: 20,
      trustTier: "project-decision"
    }],
    exclusions: [{
      subjectType: "source_claim",
      subjectId: "claim-weak",
      reason: "low_trust",
      explanation: "Weak source excluded.",
      score: 10,
      trustTier: "low"
    }],
    metadata: {},
    createdAt: now
  },
  executionRun: {
    id: "run-1",
    harnessPlanId: "plan-1",
    adapter: "cli",
    status: "succeeded",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  evidenceBundles: [{
    id: "evidence-1",
    executionRunId: "run-1",
    status: "captured",
    changedFiles: ["packages/cli/src/runRunShowCommand.ts"],
    commands: [{
      command: "pnpm typecheck",
      status: "passed",
      provenance: "operator_reported",
      doesNotProve:
        "This command result does not prove memory quality, source truth, review correctness, or production readiness."
    }],
    diffRisk: "medium",
    reviewBurden: "Review readback output.",
    rollbackPath: "Revert run show commit.",
    metadata: {
      changedFileClassification: {
        intended: ["packages/cli/src/runRunShowCommand.ts"],
        unrelated: [],
        unknown: []
      }
    },
    createdAt: now,
    updatedAt: now
  }],
  reviewAssessments: [{
    id: "review-1",
    evidenceBundleId: "evidence-1",
    status: "pending",
    reviewer: "krn-cli",
    summary: "Review required.",
    findings: [],
    metadata: {},
    createdAt: now,
    updatedAt: now
  }],
  feedbackDeltas: [{
    id: "feedback-1",
    reviewAssessmentId: "review-1",
    status: "candidate",
    memoryCandidates: [{
      id: "memory-candidate-1",
      projectId: "project-1",
      executionRunId: "run-1",
      feedbackDeltaId: "feedback-1",
      proposedBy: "krn evidence capture",
      kind: "pattern",
      status: "proposed",
      summary: "Review changed files for reusable memory.",
      body: "Changed files may contain reusable KRN operating knowledge.",
      owner: "krn-cli",
      confidence: 50,
      applicationGuidance: "Review only with source lineage.",
      sourceClaimIds: [],
      sourceLineage: [],
      isUserPreference: false,
      validFrom: now,
      metadata: {
        reviewability: "needs_more_evidence",
        reviewabilityReasons: ["Missing source lineage."]
      },
      createdAt: now,
      updatedAt: now
    }],
    sourceDecisions: [],
    evalCandidates: [],
    metadata: {
      reviewability: "needs_more_evidence"
    },
    createdAt: now,
    updatedAt: now
  }],
  runEvents: []
};

describe("runRunShowCommand", () => {
  it("renders persisted run evidence without mutating state", async () => {
    let closed = false;
    const result = await runRunShowCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      runId: "run-1",
      createDatabaseRuntime: async () => ({
        harnessRunRepository: {
          async getHarnessRunByExecutionRunId(runId: string) {
            return runId === "run-1" ? aggregate : undefined;
          }
        },
        async close() {
          closed = true;
        }
      })
    });

    expect(result.stdout).toContain("KRN Run Readback");
    expect(result.stdout).toContain("Persistence: read-only (Postgres)");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("Run ID: run-1");
    expect(result.stdout).toContain("changed file classification:");
    expect(result.stdout).toContain("- intended=1");
    expect(result.stdout).toContain("- unrelated=0");
    expect(result.stdout).toContain("- unknown=0");
    expect(result.stdout).toContain("pnpm typecheck: passed | provenance=operator_reported");
    expect(result.stdout).toContain("doesNotProve: This command result does not prove memory quality");
    expect(result.stdout).toContain("memory_candidate:memory-candidate-1");
    expect(result.stdout).toContain("reviewability: needs_more_evidence");
    expect(result.stdout).toContain("What This Does Not Prove:");
    expect(closed).toBe(true);
  });
});
