import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { buildDecisionPacketIssuance } from "@krn/core";

import type {
  CreateAntiMemoryCandidateInput,
  CreateExecutionRunInput,
  CreateMemoryFeedbackEventInput,
  CreateMemoryCandidateInput,
  InvalidateMemoryRecordInput,
  PromoteAntiMemoryCandidateInput,
  PromoteMemoryCandidateInput,
  RejectAntiMemoryCandidateInput,
  RejectMemoryCandidateInput,
  RecordMemoryApplicationWithEffectsOnceInput,
  HarnessRunAggregate
} from "@krn/core/repositories/internal";
import {
  deriveCodexAdapterReadiness
} from "../doctor-readiness.js";
import type { DatabaseRuntime } from "../database-runtime.js";
import { createNoStoreCompilerDependencies } from "../no-store-repositories.js";
import { runCli } from "../run-cli.js";

const now = "2026-06-21T12:00:00.000Z";

const unusedMemoryRepository = {
  async createMemoryCandidate(_input: CreateMemoryCandidateInput): Promise<never> {
    throw new Error("createMemoryCandidate should not be called");
  },
  async getMemoryCandidateById(_id: string): Promise<never> {
    throw new Error("getMemoryCandidateById should not be called");
  },
  async promoteReviewedMemoryCandidate(_input: PromoteMemoryCandidateInput): Promise<never> {
    throw new Error("promoteReviewedMemoryCandidate should not be called");
  },
  async rejectMemoryCandidate(_input: RejectMemoryCandidateInput): Promise<never> {
    throw new Error("rejectMemoryCandidate should not be called");
  },
  async invalidateMemoryRecord(_input: InvalidateMemoryRecordInput): Promise<never> {
    throw new Error("invalidateMemoryRecord should not be called");
  },
  async getMemoryRecordById(_id: string): Promise<never> {
    throw new Error("getMemoryRecordById should not be called");
  },
  async listMemoryRecordsForProject(): Promise<never> {
    throw new Error("listMemoryRecordsForProject should not be called");
  },
  async recordMemoryApplicationWithEffectsOnce(
    _input: RecordMemoryApplicationWithEffectsOnceInput
  ): Promise<never> {
    throw new Error("recordMemoryApplicationWithEffectsOnce should not be called");
  },
  async createMemoryFeedbackEvent(_input: CreateMemoryFeedbackEventInput): Promise<never> {
    throw new Error("createMemoryFeedbackEvent should not be called");
  },
  async createAntiMemoryCandidate(_input: CreateAntiMemoryCandidateInput): Promise<never> {
    throw new Error("createAntiMemoryCandidate should not be called");
  },
  async getAntiMemoryCandidateById(_id: string): Promise<never> {
    throw new Error("getAntiMemoryCandidateById should not be called");
  },
  async promoteReviewedAntiMemoryCandidate(_input: PromoteAntiMemoryCandidateInput): Promise<never> {
    throw new Error("promoteReviewedAntiMemoryCandidate should not be called");
  },
  async rejectAntiMemoryCandidate(_input: RejectAntiMemoryCandidateInput): Promise<never> {
    throw new Error("rejectAntiMemoryCandidate should not be called");
  }
};

describe("runCli", () => {
  it("renders a read-only Codex brief for a persisted execution run", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const aggregate: HarnessRunAggregate = {
      operatorIntent: {
        id: "operator-intent-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        source: "cli",
        rawIntent: "render Codex execution brief",
        status: "received",
        metadata: {},
        createdAt: now
      },
      taskContract: {
        id: "task-contract-1",
        operatorIntentId: "operator-intent-1",
        projectId: "project-1",
        title: "Render Codex execution brief for TypeScript review risk",
        objective: "Render persisted activated context for Codex with TypeScript unknown-first boundary review and diff risk evidence.",
        constraints: ["do not invoke Codex", "preserve strict unknown boundaries", "report review risk"],
        nonGoals: ["do not mutate memory", "do not spawn agents"],
        acceptance: ["brief renders from persisted run"],
        status: "active",
        metadata: {},
        createdAt: now,
        updatedAt: now
      },
      harnessPlan: {
        id: "harness-plan-1",
        taskContractId: "task-contract-1",
        version: 1,
        status: "ready",
        summary: "render persisted Codex brief",
        metadata: {
          knowledgeSelection: {
            kind: "krn.knowledge.selection.v1",
            status: "selected",
            query: "unknown-first boundary",
            source: "memory_store",
            selectedKnowledgeIds: ["memory-record-1"],
            selectedKnowledge: [
              {
                id: "memory-record-1",
                knowledgeId: "memory-record-1",
                title: "Unknown-first TypeScript result boundary",
                reviewability: "ready",
                nextAction: "use",
                doesNotProve: "This knowledge does not prove implementation correctness."
              }
            ],
            reason: "Knowledge read model matched the pre-coding plan query.",
            doesNotProve:
              "Selected knowledge does not prove implementation correctness, source truth, ranking quality, or product readiness.",
            proof: {
              proves: ["local readback filters were applied deterministically"],
              doesNotProve: ["ranking quality is good"]
            }
          },
          evidenceContract: {
            taskContractId: "task-contract-1",
            commands: [
              {
                command: "pnpm typecheck",
                required: true
              }
            ],
            diffRisk: "medium",
            reviewBurden: "Review the CLI output only.",
            rollbackPath: "Revert the CLI brief command.",
            metadata: {}
          }
        },
        createdAt: now,
        updatedAt: now
      },
      contextAssembly: {
        id: "context-assembly-1",
        harnessPlanId: "harness-plan-1",
        status: "assembled",
        inclusions: [
          {
            subjectType: "source_claim",
            subjectId: "source-claim-1",
            reason: "Source claim grounds adapter boundary.",
            expectedUse: "Use in the execution brief.",
            sourceAuthority: "project-decision"
          },
          {
            subjectType: "memory_record",
            subjectId: "memory-record-1",
            reason: "Memory records prior adapter decision.",
            expectedUse: "Keep output bounded.",
            sourceAuthority: "high"
          }
        ],
        exclusions: [
          {
            subjectType: "anti_memory_record",
            subjectId: "anti-memory-1",
            reason: "unsafe",
            explanation: "Do not mutate memory while rendering a brief.",
            sourceAuthority: "high"
          }
        ],
        metadata: {},
        createdAt: now
      },
      executionRun: {
        id: "execution-run-1",
        harnessPlanId: "harness-plan-1",
        adapter: "codex",
        status: "planned",
        lifecycleRevision: 1,
        metadata: {},
        createdAt: now,
        updatedAt: now
      },
      evidenceBundles: [],
      reviewAssessments: [],
      feedbackDeltas: [],
      runEvents: []
    };
    let persistedAggregate: HarnessRunAggregate = aggregate;
    const issuance = buildDecisionPacketIssuance({
      aggregate,
      packetGeneratedAt: aggregate.executionRun.updatedAt,
      sha256Hex: (value) => createHash("sha256").update(value).digest("hex")
    });
    const harnessRunRepository = {
      ...dependencies.harnessRunRepository,
      async createExecutionRun(_input: CreateExecutionRunInput) {
        throw new Error("codex brief must not create execution runs");
      },
      async getHarnessRunByExecutionRunId(runId: string) {
        return runId === "execution-run-1" ? persistedAggregate : undefined;
      },
      async getIssuedDecisionPacketForExecutionRun(runId: string) {
        return runId === "execution-run-1" ? issuance : undefined;
      },
      async createEvidenceBundle(): Promise<never> {
        throw new Error("createEvidenceBundle should not be called");
      },
      async createReviewAssessment(): Promise<never> {
        throw new Error("createReviewAssessment should not be called");
      },
      async createFeedbackDelta(): Promise<never> {
        throw new Error("createFeedbackDelta should not be called");
      }
    };
    const sourceRepository = {
      async createSourceArtifact(): Promise<never> {
        throw new Error("createSourceArtifact should not be called");
      },
      async createSourceClaim(): Promise<never> {
        throw new Error("createSourceClaim should not be called");
      },
      async getSourceClaimById(): Promise<never> {
        throw new Error("getSourceClaimById should not be called");
      },
      async listClaimsForProject(): Promise<never> {
        throw new Error("listClaimsForProject should not be called");
      },
      async createSourceClaimEdge(): Promise<never> {
        throw new Error("createSourceClaimEdge should not be called");
      },
      async listSourceClaimEdgesForClaim(): Promise<never> {
        throw new Error("listSourceClaimEdgesForClaim should not be called");
      },
      async listSourceDecisionEdgesForClaim(): Promise<never> {
        throw new Error("listSourceDecisionEdgesForClaim should not be called");
      },
      async createSourceDecisionEdge(): Promise<never> {
        throw new Error("createSourceDecisionEdge should not be called");
      },
      async getSourceDecisionEdgeById(): Promise<never> {
        throw new Error("getSourceDecisionEdgeById should not be called");
      },
      async createSourceRejection(): Promise<never> {
        throw new Error("createSourceRejection should not be called");
      }
    } satisfies DatabaseRuntime["sourceRepository"];
    const cliRuntime = {
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix: string) => `${prefix}-1`,
      createDatabaseRuntime: async () => ({
        workspaceId: "workspace-1",
        projectId: "project-1",
        compilerDependencies: {
          ...dependencies,
          harnessRunRepository
        },
        harnessRunRepository,
        sourceRepository,
        memoryRepository: unusedMemoryRepository,
        async close() {
          return undefined;
        }
      })
    };
    const result = await runCli(
      ["codex", "brief", "--run-id", "execution-run-1"],
      cliRuntime
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Codex Brief");
    expect(result.stdout).toContain("Run ID: execution-run-1");
    expect(result.stdout).toContain("Persistence: read-only (Postgres)");
    expect(result.stdout).toContain("Codex invocation: none");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("Selected KRN Context:");
    expect(result.stdout).toContain("Selected KRN context: selected");
    expect(result.stdout).toContain("Selected KRN context IDs: memory-record-1");
    expect(result.stdout).toContain(
      "- knowledge=memory-record-1 | readModel=memory-record-1"
    );
    expect(result.stdout).toContain("KRN Codex Execution Brief");
    expect(result.stdout).not.toContain("Source Claims Selected:");
    expect(result.stdout).not.toContain("Memory Records Selected:");
    expect(result.stdout).toContain("Use in the execution brief.");
    expect(result.stdout).toContain("Keep output bounded.");
    expect(result.stdout).toContain("Anti-memory Warnings:");
    expect(result.stdout).toContain("anti_memory_record:anti-memory-1");
    expect(result.stdout).toContain("Evidence Contract:");
    expect(result.stdout).toContain("- pnpm typecheck (required)");
    expect(result.stdout).toContain("Diff risk: medium");
    expect(result.stdout).toContain("Review burden: Review the CLI output only.");

    persistedAggregate = {
      ...aggregate,
      harnessPlan: {
        ...aggregate.harnessPlan,
        metadata: {
          ...aggregate.harnessPlan.metadata,
          knowledgeSelection: {
            ...(aggregate.harnessPlan.metadata["knowledgeSelection"] as Record<string, unknown>),
            selectedKnowledgeIds: ["unbound-memory"],
            selectedKnowledge: [{
              id: "unbound-memory",
              knowledgeId: "unbound-memory",
              title: "Unbound memory knowledge",
              reviewability: "ready",
              nextAction: "use",
              doesNotProve: "Memory selection does not prove packet ownership."
            }]
          }
        }
      }
    };
    const unboundMemoryResult = await runCli(
      ["codex", "brief", "--run-id", "execution-run-1"],
      cliRuntime
    );

    expect(unboundMemoryResult.stdout).toContain("Selected KRN context: rejected_or_deferred");
    expect(unboundMemoryResult.stdout).toContain("Selected KRN context IDs: none");
    expect(unboundMemoryResult.stdout).not.toContain("title=Unbound memory knowledge");

    persistedAggregate = {
      ...aggregate,
      harnessPlan: {
        ...aggregate.harnessPlan,
        metadata: {
          ...aggregate.harnessPlan.metadata,
          knowledgeSelection: {
            ...(aggregate.harnessPlan.metadata["knowledgeSelection"] as Record<string, unknown>),
            source: "knowledge_catalog",
            selectedKnowledgeIds: ["catalog-only"],
            selectedKnowledge: [{
              id: "catalog-only",
              knowledgeId: "catalog-only",
              title: "Unbound catalog knowledge",
              reviewability: "ready",
              nextAction: "use",
              doesNotProve: "Catalog presence does not prove packet ownership."
            }]
          }
        }
      }
    };
    const unboundResult = await runCli(
      ["codex", "brief", "--run-id", "execution-run-1"],
      cliRuntime
    );

    expect(unboundResult.stdout).toContain("Selected KRN context: rejected_or_deferred");
    expect(unboundResult.stdout).toContain("Selected KRN context IDs: none");
    expect(unboundResult.stdout).not.toContain("title=Unbound catalog knowledge");

    persistedAggregate = {
      ...aggregate,
      executionRun: {
        ...aggregate.executionRun,
        status: "succeeded",
        completedAt: now
      }
    };
    const terminalResult = await runCli(
      ["codex", "brief", "--run-id", "execution-run-1"],
      cliRuntime
    );

    expect(terminalResult.exitCode).toBe(0);
    expect(terminalResult.stderr).toBe("");
    expect(terminalResult.stdout).toContain("Packet Status: abstain");
    expect(terminalResult.stdout).toContain("Active: yes");
    expect(terminalResult.stdout).not.toContain("execution_run_terminal");
    expect(terminalResult.stdout).toContain("Stop Condition: Do not execute");
    expect(terminalResult.stdout).toContain("- pnpm typecheck (required)");
  });

  it("requires database config for codex brief", async () => {
    const result = await runCli(["codex", "brief", "--run-id", "execution-run-1"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("KRN_DATABASE_URL is required for krn codex brief");
  });

  it("distinguishes doctor Codex adapter readiness blockers", () => {
    const postgresReady = [
      { label: "Postgres config", status: "configured and reachable" },
      { label: "pgvector", status: "available" },
      { label: "migrations", status: "verified (7/7 applied)" }
    ];
    const codexAdapterReady = [
      { label: "Codex adapter renderer", status: "present" },
      { label: "Execution brief smoke", status: "available (pnpm db:smoke:codex-adapter)" },
      { label: "Codex execution runner", status: "absent" },
      { label: "KRN MCP product server", status: "absent" },
      { label: "Codex adapter runtime proof", status: "ready (source 1, memory 1)" }
    ];

    expect(
      deriveCodexAdapterReadiness(postgresReady, codexAdapterReady)
    ).toEqual({
      label: "Codex adapter readiness",
      status: "ready (renderer, runtime proof, and forbidden surfaces checked)"
    });

    expect(
      deriveCodexAdapterReadiness(postgresReady, [
        ...codexAdapterReady.slice(0, 4),
        { label: "Codex adapter runtime proof", status: "unverified (run pnpm db:smoke:codex-adapter)" }
      ])
    ).toEqual({
      label: "Codex adapter readiness",
      status: "runtime unverified (run pnpm db:smoke:codex-adapter)"
    });

    expect(
      deriveCodexAdapterReadiness(postgresReady, [
        ...codexAdapterReady.slice(0, 2),
        { label: "Codex execution runner", status: "present" },
        { label: "KRN MCP product server", status: "absent" }
      ])
    ).toEqual({
      label: "Codex adapter readiness",
      status: "blocked (forbidden Codex execution or MCP product server present)"
    });
  });

  it("reports Codex adapter smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "codex-adapter"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Codex Adapter Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Codex adapter smoke: skipped (database not configured)");
  });
});
