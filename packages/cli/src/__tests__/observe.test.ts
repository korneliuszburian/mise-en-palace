import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  runCli
} from "../runCli.js";
import {
  createNoStoreCompilerDependencies
} from "../noStoreRepositories.js";
import {
  commandResultDoesNotProve
} from "@krn/core";
import type {
  AntiMemoryCandidate,
  AntiMemoryRecord,
  MemoryRecord,
  ObservationItem,
  SourceClaim
} from "@krn/core";
import type {
  CreateAntiMemoryCandidateInput,
  CreateEvidenceBundleInput,
  CreateExecutionRunInput,
  CreateFeedbackDeltaInput,
  CreateMemoryFeedbackEventInput,
  CreateMemoryCandidateInput,
  InvalidateMemoryRecordInput,
  PromoteAntiMemoryCandidateInput,
  PromoteMemoryCandidateInput,
  RejectAntiMemoryCandidateInput,
  RejectMemoryCandidateInput,
  RecordMemoryApplicationInput,
  CreateReviewAssessmentInput,
  HarnessRunAggregate,
  SearchDocumentSearchResult
} from "@krn/harness/repositories/internal";
import type {
  DatabaseRuntimeInput
} from "../databaseRuntime.js";
import {
  deriveBrainStoreReadiness,
  deriveHarnessPersistenceReadiness,
  deriveActivationReadiness,
  deriveCodexAdapterReadiness,
  deriveMemoryGovernanceReadiness,
  deriveRetrievalSubstrateReadiness,
  deriveSourceGraphReadiness,
  deriveTargetRepoReadiness,
  deriveWorkerJobReadiness
} from "../doctorReadiness.js";

const now = "2026-06-21T12:00:00.000Z";

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
      async createGroup(input: { title: string }) {
        createdGroupTitle = input.title;

        return {
          id: "observation-group-1",
          projectId: "project-1",
          executionRunId: "execution-run-1",
          scope: {
            projectId: "project-1",
            executionRunId: "execution-run-1"
          },
          title: input.title,
          summary: "summary",
          source: "krn observe",
          metadata: {},
          createdAt: now,
          updatedAt: now
        };
      },
      async addItems(_groupId: string, inputs: readonly unknown[]) {
        createdItemCount = inputs.length;

        return inputs.map((_input, index) => ({
          id: `observation-item-${index + 1}`
        }));
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
                async createGroup(input: { scope: { projectId?: string }; title: string }) {
                  createdGroupProjectId = input.scope.projectId;

                  return {
                    id: "observation-group-1",
                    projectId: input.scope.projectId,
                    executionRunId: "execution-run-1",
                    scope: input.scope,
                    title: input.title,
                    summary: "summary",
                    source: "krn observe",
                    metadata: {},
                    createdAt: now,
                    updatedAt: now
                  };
                },
                async addItems(_groupId: string, inputs: readonly unknown[]) {
                  return inputs.map((_input, index) => ({
                    id: `observation-item-${index + 1}`
                  }));
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
  const observationItem: ObservationItem = {
    id: "observation-item-1",
    groupId: "observation-group-1",
    scope: {
      projectId: "project-1",
      executionRunId: "execution-run-1",
      taskContractId: "task-contract-1"
    },
    kind: "fact",
    status: "candidate",
    priority: "medium",
    confidence: "medium",
    provenanceKind: "evidence_bundle",
    subject: "evidence_bundle",
    summary: "Evidence bundle contains explicit command provenance.",
    body:
      "{\"commands\":[{\"command\":\"pnpm typecheck\",\"provenance\":\"operator_reported\"},{\"command\":\"pnpm test\",\"provenance\":\"captured_output_file\"}]}",
    temporalScope: {
      observedAt: now,
      eventTime: now,
      ingestedAt: now
    },
    sourceRanges: [{
      id: "observation-source-range-1",
      sourceType: "evidence_bundle",
      sourceId: "evidence-bundle-1",
      locator: "evidence_bundles.id:evidence-bundle-1",
      capturedAt: now
    }],
    entityLinks: [],
    claimLinks: [],
    metadata: {},
    createdAt: now,
    updatedAt: now
  };

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
              async createGroup(groupInput: { title: string }) {
                return {
                  id: "observation-group-1",
                  projectId: input.projectId,
                  executionRunId: "execution-run-1",
                  scope: {
                    projectId: input.projectId,
                    executionRunId: "execution-run-1"
                  },
                  title: groupInput.title,
                  summary: "summary",
                  source: "krn observe",
                  metadata: {},
                  createdAt: now,
                  updatedAt: now
                };
              },
              async addItems(_groupId: string, inputs: readonly { body: string }[]) {
                observedBodies.push(...inputs.map((item) => item.body));

                return inputs.map((_item, index) => ({
                  id: `observation-item-${index + 1}`
                }));
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
