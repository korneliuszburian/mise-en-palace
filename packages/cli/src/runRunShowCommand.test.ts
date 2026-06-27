import { describe, expect, it } from "vitest";
import type {
  HarnessRunAggregate
} from "@krn/harness/repositories";

import {
  runRunShowCommand
} from "./runRunShowCommand.js";
import type {
  RunReadbackResource
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
      },
      targetEvidence: {
        targetRepo: "../wilq-seo",
        mode: "observation_only",
        dirtyBefore: "dirty",
        dirtyAfter: "dirty",
        ownedChanges: "external",
        targetStatusFreshness: "changed_since_selection",
        targetPatchLifecycle: "handed_off_unresolved",
        handoffArtifact: "docs/reviews/target/HANDOFF.md",
        targetOwnerDecision: "stronger verification requested",
        allowedWrites: [],
        forbiddenWrites: ["wilq-seo/**"],
        changedFiles: [{
          status: "M",
          path: "apps/dashboard/src/App.tsx",
          ownership: "external"
        }],
        commands: ["wilq-seo scripts/test.sh"],
        doesNotProve: [
          "Target evidence does not prove KRN source correctness.",
          "Target evidence does not prove product readiness or V02-01 second-operator usability."
        ]
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
    sourceDecisions: [{
      id: "source-decision-candidate-1",
      status: "defer",
      decision: "Review changed files for source graph decision updates.",
      rationale: "Changed files imply a possible source decision.",
      falsifier: "No SourceClaim with mechanism exists.",
      consumer: "krn evidence capture",
      metadata: {
        reviewability: "needs_more_evidence",
        reviewabilityReasons: ["Missing source claim."]
      },
      createdAt: now,
      updatedAt: now
    }],
    evalCandidates: [],
    metadata: {
      reviewability: "needs_more_evidence"
    },
    createdAt: now,
    updatedAt: now
  }],
  runEvents: []
};

const isRunReadbackResource = (input: unknown): input is RunReadbackResource =>
  typeof input === "object" &&
  input !== null &&
  !Array.isArray(input) &&
  (input as Record<string, unknown>).kind === "krn.run.readback.v1";

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
      format: "text",
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
    expect(result.stdout).toContain("targetEvidence:");
    expect(result.stdout).toContain("- repo: ../wilq-seo");
    expect(result.stdout).toContain("- mode: observation_only");
    expect(result.stdout).toContain("- dirtyBefore: dirty");
    expect(result.stdout).toContain("- targetStatusFreshness: changed_since_selection");
    expect(result.stdout).toContain("- targetPatchLifecycle: handed_off_unresolved");
    expect(result.stdout).toContain("- handoffArtifact: docs/reviews/target/HANDOFF.md");
    expect(result.stdout).toContain("- targetOwnerDecision: stronger verification requested");
    expect(result.stdout).toContain("- M apps/dashboard/src/App.tsx | ownership=external");
    expect(result.stdout).toContain("pnpm typecheck: passed | provenance=operator_reported");
    expect(result.stdout).toContain("doesNotProve: This command result does not prove memory quality");
    expect(result.stdout).toContain("memory_candidate:memory-candidate-1");
    expect(result.stdout).toContain("source_decision_candidate:source-decision-candidate-1");
    expect(result.stdout).toContain("source_decision=1");
    expect(result.stdout).toContain("reviewability: needs_more_evidence");
    expect(result.stdout).toContain("What This Does Not Prove:");
    expect(closed).toBe(true);
  });

  it("renders read-only typed json for external consumers", async () => {
    let closed = false;
    const result = await runRunShowCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      runId: "run-1",
      format: "json",
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

    const parsed: unknown = JSON.parse(result.stdout);

    expect(isRunReadbackResource(parsed)).toBe(true);

    if (!isRunReadbackResource(parsed)) {
      throw new Error("run show json did not render a run readback resource");
    }

    expect(parsed).toMatchObject({
      kind: "krn.run.readback.v1",
      access: "read_only",
      mutation: "none",
      run: {
        id: "run-1"
      },
      evidenceBundles: [{
        changedFiles: {
          classification: {
            source: "metadata",
            intended: ["packages/cli/src/runRunShowCommand.ts"],
            unrelated: [],
            unknown: []
          }
        },
        targetEvidence: {
          targetRepo: "../wilq-seo",
          mode: "observation_only",
          dirtyBefore: "dirty",
          dirtyAfter: "dirty",
          ownedChanges: "external",
          targetStatusFreshness: "changed_since_selection",
          targetPatchLifecycle: "handed_off_unresolved",
          handoffArtifact: "docs/reviews/target/HANDOFF.md",
          targetOwnerDecision: "stronger verification requested",
          allowedWrites: ["none"],
          forbiddenWrites: ["wilq-seo/**"],
          changedFiles: [{
            status: "M",
            path: "apps/dashboard/src/App.tsx",
            ownership: "external"
          }],
          commands: ["wilq-seo scripts/test.sh"]
        },
        commands: [{
          command: "pnpm typecheck",
          status: "passed",
          provenance: "operator_reported",
          doesNotProve:
            "This command result does not prove memory quality, source truth, review correctness, or production readiness."
        }]
      }],
      feedbackDeltas: [{
        memoryRecordMutation: "none",
        candidateCounts: {
          source: 1,
          sourceClaim: 0,
          sourceDecision: 1
        },
        candidates: [{
          kind: "memory_candidate",
          reviewability: "needs_more_evidence",
          reviewabilityReasons: ["Missing source lineage."]
        }, {
          kind: "source_decision_candidate",
          id: "source-decision-candidate-1",
          status: "defer",
          summary: "Review changed files for source graph decision updates."
        }]
      }],
      proof: {
        proves: [
          "persisted run/evidence/review/feedback records can be read without ad hoc SQL",
          "this readback surface exposes no write action"
        ],
        doesNotProve: [
          "commands were executed by this readback command",
          "memory quality, source truth, review correctness, or product readiness",
          "Memory Core mutation"
        ]
      }
    });
    expect(parsed.proof.proves).toEqual([
      "persisted run/evidence/review/feedback records can be read without ad hoc SQL",
      "this readback surface exposes no write action"
    ]);
    expect(parsed.proof.proves).not.toContain("commands were executed by this readback command");
    expect(parsed.proof.proves).not.toContain(
      "memory quality, source truth, review correctness, or product readiness"
    );
    expect(parsed.proof.doesNotProve).toEqual([
      "commands were executed by this readback command",
      "memory quality, source truth, review correctness, or product readiness",
      "Memory Core mutation"
    ]);
    expect(parsed.evidenceBundles[0]?.commands[0]?.doesNotProve).toBe(
      "This command result does not prove memory quality, source truth, review correctness, or production readiness."
    );
    expect(result.stdout).not.toContain("promote");
    expect(result.stdout).not.toContain("mutate");
    expect(closed).toBe(true);
  });
});
