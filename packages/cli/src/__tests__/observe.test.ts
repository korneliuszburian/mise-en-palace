import { describe, expect, it } from "vitest";

import { commandResultDoesNotProve } from "@krn/core";
import type {
  ObservationGroup,
  ObservationItem
} from "@krn/core";
import type {
  CreateObservationGroupInput,
  CreateObservationItemInput
} from "@krn/db/adapters";
import type { HarnessRunAggregate } from "@krn/harness/repositories/internal";

import { createNoStoreCompilerDependencies } from "../noStoreRepositories.js";
import { runCli } from "../runCli.js";

const now = "2026-06-21T12:00:00.000Z";

const observationGroupFromInput = (
  input: CreateObservationGroupInput
): ObservationGroup => ({
  id: "observation-group-1",
  ...(input.scope.projectId !== undefined ? { projectId: input.scope.projectId } : {}),
  ...(input.scope.executionRunId !== undefined ? { executionRunId: input.scope.executionRunId } : {}),
  scope: input.scope,
  title: input.title,
  summary: input.summary,
  source: input.source,
  metadata: input.metadata ?? {},
  createdAt: now,
  updatedAt: now
});

const observationItemFromInput = (
  groupId: string,
  input: CreateObservationItemInput,
  index: number
): ObservationItem => ({
  id: `observation-item-${index + 1}`,
  groupId,
  scope: input.scope ?? {
    projectId: "project-1",
    executionRunId: "execution-run-1"
  },
  kind: input.kind,
  status: input.status ?? "candidate",
  priority: input.priority ?? "medium",
  confidence: input.confidence ?? "medium",
  provenanceKind: input.provenanceKind,
  subject: input.subject,
  summary: input.summary,
  body: input.body,
  temporalScope: input.temporalScope,
  sourceRanges: (input.sourceRanges ?? []).map((sourceRange, sourceRangeIndex) => ({
    id: `observation-source-range-${index + 1}-${sourceRangeIndex + 1}`,
    sourceType: sourceRange.sourceType,
    sourceId: sourceRange.sourceId,
    locator: sourceRange.locator,
    ...(sourceRange.excerpt !== undefined ? { excerpt: sourceRange.excerpt } : {}),
    capturedAt: sourceRange.capturedAt
  })),
  entityLinks: input.entityLinks ?? [],
  claimLinks: input.claimLinks ?? [],
  metadata: input.metadata ?? {},
  createdAt: now,
  updatedAt: now
});

describe("runCli", () => {
  it("persists deterministic observations for a run without mutating memory", async () => {
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
        rawIntent: "observe run",
        metadata: {},
        createdAt: now
      },
      taskContract: {
        id: "task-contract-1",
        operatorIntentId: "operator-intent-1",
        projectId: "project-1",
        title: "observe run",
        objective: "observe run",
        constraints: [],
        nonGoals: [],
        acceptance: [],
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
        summary: "observe run",
        metadata: {},
        createdAt: now,
        updatedAt: now
      },
      executionRun: {
        id: "execution-run-1",
        harnessPlanId: "harness-plan-1",
        adapter: "codex",
        status: "succeeded",
        metadata: {},
        createdAt: now,
        updatedAt: now
      },
      evidenceBundles: [],
      reviewAssessments: [],
      feedbackDeltas: [],
      runEvents: [{
        id: "run-event-1",
        executionRunId: "execution-run-1",
        sequence: 1,
        type: "tool.result",
        severity: "info",
        message: "tests passed",
        payload: { command: "pnpm test", accessToken: "secret-token" },
        occurredAt: now
      }]
    };
    let createdGroupTitle: string | undefined;
    let createdItemCount = 0;
    const observationRepository = {
      async createGroup(input: CreateObservationGroupInput) {
        createdGroupTitle = input.title;

        return observationGroupFromInput(input);
      },
      async addItems(groupId: string, inputs: CreateObservationItemInput[]) {
        createdItemCount = inputs.length;

        return inputs.map((input, index) => observationItemFromInput(groupId, input, index));
      }
    };

    const result = await runCli(
      ["observe", "--run", "execution-run-1", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createObserveDatabaseRuntime: async () => ({
          harnessRunRepository: {
            ...dependencies.harnessRunRepository,
            async getHarnessRunByExecutionRunId() {
              return aggregate;
            }
          },
          async resolveProjectRuntime(input: { projectId: string }) {
            expect(input.projectId).toBe("project-1");

            return {
              workspaceId: "workspace-1",
              projectId: input.projectId,
              observationRepository
            };
          },
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Observe Run");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("Run ID: execution-run-1");
    expect(result.stdout).toContain("Observation group: observation-group-1");
    expect(result.stdout).toContain("Observation items: 1");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("MemoryRecord created: no");
    expect(createdGroupTitle).toContain("execution-run-1");
    expect(createdItemCount).toBe(1);
  });

  it("uses the persisted run project when observing a run", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const aggregate: HarnessRunAggregate = {
      operatorIntent: {
        id: "operator-intent-1",
        workspaceId: "workspace-1",
        projectId: "project-from-run",
        source: "cli",
        rawIntent: "observe run",
        metadata: {},
        createdAt: now
      },
      taskContract: {
        id: "task-contract-1",
        operatorIntentId: "operator-intent-1",
        projectId: "project-from-run",
        title: "observe run",
        objective: "observe run",
        constraints: [],
        nonGoals: [],
        acceptance: [],
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
        summary: "observe run",
        metadata: {},
        createdAt: now,
        updatedAt: now
      },
      executionRun: {
        id: "execution-run-1",
        harnessPlanId: "harness-plan-1",
        adapter: "codex",
        status: "succeeded",
        metadata: {},
        createdAt: now,
        updatedAt: now
      },
      evidenceBundles: [],
      reviewAssessments: [],
      feedbackDeltas: [],
      runEvents: [{
        id: "run-event-1",
        executionRunId: "execution-run-1",
        sequence: 1,
        type: "tool.result",
        severity: "info",
        message: "tests passed",
        payload: {},
        occurredAt: now
      }]
    };
    const resolvedProjectIds: string[] = [];
    let createdGroupProjectId: string | undefined;

    const result = await runCli(
      ["observe", "--run", "execution-run-1", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createObserveDatabaseRuntime: async () => ({
          harnessRunRepository: {
            ...dependencies.harnessRunRepository,
            async getHarnessRunByExecutionRunId() {
              return aggregate;
            }
          },
          async resolveProjectRuntime(input: { projectId: string }) {
            resolvedProjectIds.push(input.projectId);

            return {
              workspaceId: "workspace-1",
              projectId: input.projectId,
              observationRepository: {
                async createGroup(input: CreateObservationGroupInput) {
                  createdGroupProjectId = input.scope.projectId;

                  return observationGroupFromInput(input);
                },
                async addItems(groupId: string, inputs: CreateObservationItemInput[]) {
                  return inputs.map((input, index) => observationItemFromInput(groupId, input, index));
                }
              }
            };
          },
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(resolvedProjectIds).toEqual(["project-from-run"]);
    expect(createdGroupProjectId).toBe("project-from-run");
  });

  it("requires an explicit project when the persisted run has no project scope", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const aggregate: HarnessRunAggregate = {
      operatorIntent: {
        id: "operator-intent-1",
        workspaceId: "workspace-1",
        projectId: "",
        source: "cli",
        rawIntent: "observe run",
        metadata: {},
        createdAt: now
      },
      taskContract: {
        id: "task-contract-1",
        operatorIntentId: "operator-intent-1",
        projectId: "",
        title: "observe run",
        objective: "observe run",
        constraints: [],
        nonGoals: [],
        acceptance: [],
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
        summary: "observe run",
        metadata: {},
        createdAt: now,
        updatedAt: now
      },
      executionRun: {
        id: "execution-run-1",
        harnessPlanId: "harness-plan-1",
        adapter: "codex",
        status: "succeeded",
        metadata: {},
        createdAt: now,
        updatedAt: now
      },
      evidenceBundles: [],
      reviewAssessments: [],
      feedbackDeltas: [],
      runEvents: []
    };
    let resolveProjectCalled = false;

    const result = await runCli(
      ["observe", "--run", "execution-run-1"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createObserveDatabaseRuntime: async () => ({
          harnessRunRepository: {
            ...dependencies.harnessRunRepository,
            async getHarnessRunByExecutionRunId() {
              return aggregate;
            }
          },
          async resolveProjectRuntime() {
            resolveProjectCalled = true;
            throw new Error("should not resolve project");
          },
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("requires --project <project-id>");
    expect(resolveProjectCalled).toBe(false);
  });

  it("guards self-hosting evidence provenance through observe", async () => {
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
        rawIntent: "self-hosting evidence provenance",
        metadata: {},
        createdAt: now
      },
      taskContract: {
        id: "task-contract-1",
        operatorIntentId: "operator-intent-1",
        projectId: "project-1",
        title: "self-hosting evidence provenance",
        objective: "Represent plan/evidence/observe/reflect without false command proof.",
        constraints: ["no MemoryRecord mutation"],
        nonGoals: ["no automatic candidate rows"],
        acceptance: ["explicit command provenance is preserved"],
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
        summary: "self-hosting provenance plan",
        metadata: {},
        createdAt: now,
        updatedAt: now
      },
      executionRun: {
        id: "execution-run-1",
        harnessPlanId: "harness-plan-1",
        adapter: "codex",
        status: "succeeded",
        metadata: {},
        createdAt: now,
        updatedAt: now
      },
      evidenceBundles: [{
        id: "evidence-bundle-1",
        executionRunId: "execution-run-1",
        status: "captured",
        changedFiles: ["packages/cli/src/parseEvidenceArgs.ts"],
        commands: [
          {
            command: "pnpm typecheck",
            status: "passed",
            provenance: "operator_reported",
            assertedBy: "operator",
            doesNotProve: commandResultDoesNotProve
          },
          {
            command: "pnpm test",
            status: "passed",
            provenance: "captured_output_file",
            outputRef: ".local-lab/p7-self-hosting/03-test.txt",
            doesNotProve: commandResultDoesNotProve
          }
        ],
        diffRisk: "medium",
        reviewBurden: "Review persisted command provenance only.",
        rollbackPath: "git revert <commit>",
        metadata: {},
        createdAt: now,
        updatedAt: now
      }],
      reviewAssessments: [],
      feedbackDeltas: [],
      runEvents: [{
        id: "run-event-1",
        executionRunId: "execution-run-1",
        sequence: 1,
        type: "krn.plan.persisted",
        severity: "info",
        message: "Self-hosting plan persisted",
        payload: {},
        occurredAt: now
      }]
    };
    const observedBodies: string[] = [];

    const observeResult = await runCli(
      ["observe", "--run", "execution-run-1", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createObserveDatabaseRuntime: async () => ({
          harnessRunRepository: {
            ...dependencies.harnessRunRepository,
            async getHarnessRunByExecutionRunId() {
              return aggregate;
            }
          },
          async resolveProjectRuntime(input: { projectId: string }) {
            expect(input.projectId).toBe("project-1");

            return {
              workspaceId: "workspace-1",
              projectId: input.projectId,
              observationRepository: {
                async createGroup(groupInput: CreateObservationGroupInput) {
                  return observationGroupFromInput(groupInput);
                },
                async addItems(groupId: string, inputs: CreateObservationItemInput[]) {
                  observedBodies.push(...inputs.map((item) => item.body));

                  return inputs.map((item, index) => observationItemFromInput(groupId, item, index));
                }
              }
            };
          },
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(observeResult.exitCode).toBe(0);
    expect(observeResult.stderr).toBe("");
    expect(observeResult.stdout).toContain("MemoryRecord created: no");
    expect(observedBodies.join("\n")).toContain("\"provenance\":\"operator_reported\"");
    expect(observedBodies.join("\n")).toContain("\"provenance\":\"captured_output_file\"");
    expect(observedBodies.join("\n")).not.toContain("\"provenance\":\"default_template\"");
  });
});
