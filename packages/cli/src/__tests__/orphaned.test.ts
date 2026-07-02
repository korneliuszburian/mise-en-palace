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

type CapturedPlanRun = {
  result: Awaited<ReturnType<typeof runCli>>;
  executionRunMetadata: Record<string, unknown> | undefined;
};

const runPersistedPlanWithCapturedMetadata = async (
  task: string
): Promise<CapturedPlanRun> => {
  let executionRunMetadata: Record<string, unknown> | undefined;
  const result = await runCli(
    [
      "plan",
      "--task",
      task,
      "--persist"
    ],
    {
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
        const dependencies = createNoStoreCompilerDependencies(input);
        const harnessRunRepository = {
          ...dependencies.harnessRunRepository,
          async createExecutionRun(runInput: CreateExecutionRunInput) {
            executionRunMetadata = runInput.metadata ?? {};

            return {
              id: "execution-run-1",
              harnessPlanId: runInput.harnessPlanId,
              adapter: runInput.adapter,
              status: runInput.status ?? "planned",
              metadata: runInput.metadata ?? {},
              createdAt: now,
              updatedAt: now
            };
          },
          async getHarnessRunByExecutionRunId() {
            return undefined;
          }
        };

        return {
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: {
            ...dependencies,
            harnessRunRepository
          },
          harnessRunRepository,
          memoryRepository: unusedMemoryRepository,
          async close() {
            return undefined;
          }
        };
      }
    }
  );

  return {
    result,
    executionRunMetadata
  };
};

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
  async recordMemoryApplication(_input: RecordMemoryApplicationInput): Promise<never> {
    throw new Error("recordMemoryApplication should not be called");
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
  // TODO: Move these once audit, init, plan, run, review, help, and cross-command namespaces are authorized split groups.
  it("rejects the removed public audit command", async () => {
    const result = await runCli(["audit", "repo"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Unsupported command: audit");
    expect(result.stderr).not.toContain("krn audit");
  });

  it("prints a target repo init dry-run without writing files", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const fixtureRepo = path.join(
      repoRoot,
      "tests",
      "fixtures",
      "target-repos",
      "typescript-basic"
    );
    const result = await runCli(
      ["init", "--dry-run", "--repo", fixtureRepo],
      {
        env: {},
        cwd: repoRoot,
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Init Dry Run");
    expect(result.stdout).toContain(`Repo path: ${fixtureRepo}`);
    expect(result.stdout).toContain("Package manager: package-json");
    expect(result.stdout).toContain("TypeScript: present");
    expect(result.stdout).toContain("Scripts: build, test");
    expect(result.stdout).toContain("Command detection:");
    expect(result.stdout).toContain("- scripts: build, test");
    expect(result.stdout).toContain("Existing AGENTS.md: present");
    expect(result.stdout).toContain("Existing .codex: absent");
    expect(result.stdout).toContain("Existing .agents/skills: absent");
    expect(result.stdout).toContain("Forbidden surfaces: absent");
    expect(result.stdout).toContain("Source seed proposal:");
    expect(result.stdout).toContain(
      "- package.json | kind=package_manifest | reason=detect package identity and scripts"
    );
    expect(result.stdout).toContain(
      "- tsconfig.json | kind=typescript_config | reason=detect TypeScript boundary settings"
    );
    expect(result.stdout).toContain(
      "- README.md | kind=project_readme | reason=capture project-facing current truth"
    );
    expect(result.stdout).toContain(
      "- AGENTS.md | kind=agent_instructions | reason=capture target repo Codex instructions when present"
    );
    expect(result.stdout).toContain("- docs | kind=docs_root | reason=seed target documentation and runbook context");
    expect(result.stdout).toContain("- src | kind=source_root | reason=seed source owner-file recall");
    expect(result.stdout).toContain("- tests | kind=test_root | reason=seed target repo verification surface");
    expect(result.stdout).toContain("Owner-file proposal:");
    expect(result.stdout).toContain("- none");
    expect(result.stdout).toContain("ProjectKernel proposal:");
    expect(result.stdout).toContain("Codex overlay proposal:");
    expect(result.stdout).toContain("No files written");
    expect(result.stdout).toContain(
      `Next command: krn init --connect --repo ${fixtureRepo} --persist`
    );
  });

  it("resolves init --repo relative to the workspace root when run through a package cwd", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const fixtureRepo = path.join(
      repoRoot,
      "tests",
      "fixtures",
      "target-repos",
      "typescript-basic"
    );
    const result = await runCli(
      ["init", "--dry-run", "--repo", "tests/fixtures/target-repos/typescript-basic"],
      {
        env: {},
        cwd: path.join(repoRoot, "packages", "cli"),
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(`Repo path: ${fixtureRepo}`);
    expect(result.stdout).toContain(
      `Next command: krn init --connect --repo ${fixtureRepo} --persist`
    );
  });

  it("keeps owner-file inputs in the dry-run connect next command", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const fixtureRepo = path.join(
      repoRoot,
      "tests",
      "fixtures",
      "target-repos",
      "typescript-basic"
    );
    const result = await runCli(
      [
        "init",
        "--dry-run",
        "--repo",
        fixtureRepo,
        "--owner-file",
        "src/index.ts|src|implementation_entry|implementation entry point",
        "--owner-file",
        "tests/readiness.test.ts|tests|behavior_test|readiness behavior proof"
      ],
      {
        env: {},
        cwd: repoRoot,
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Owner-file proposal:");
    expect(result.stdout).toContain(
      "- src/index.ts | root=src | kind=implementation_entry | reason=implementation entry point"
    );
    expect(result.stdout).toContain(
      `Next command: krn init --connect --repo ${fixtureRepo} --owner-file "src/index.ts|src|implementation_entry|implementation entry point" --owner-file "tests/readiness.test.ts|tests|behavior_test|readiness behavior proof" --persist`
    );
  });

  it("requires database config for init --connect --persist", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli(
      [
        "init",
        "--connect",
        "--repo",
        "tests/fixtures/target-repos/typescript-basic",
        "--persist"
      ],
      {
        env: {},
        cwd: repoRoot,
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "KRN_DATABASE_URL is required for krn init --connect --persist"
    );
    expect(result.stderr).toContain(
      "Next action: export KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn; docker compose up -d krn-postgres; pnpm db:ready"
    );
    expect(result.stderr).toContain(
      "Does not prove: setting KRN_DATABASE_URL does not prove the requested persisted command is valid, commands executed, or Memory Core mutated"
    );
  });

  it("connects a target repo to the brain store with persisted IDs", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const fixtureRepo = path.join(
      repoRoot,
      "tests",
      "fixtures",
      "target-repos",
      "typescript-basic"
    );
    const result = await runCli(
      [
        "init",
        "--connect",
        "--repo",
        fixtureRepo,
        "--owner-file",
        "src/index.ts|src|implementation_entry|implementation entry point",
        "--owner-file",
        "tests/readiness.test.ts|tests|behavior_test|readiness behavior proof",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        cwd: repoRoot,
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createInitConnectRuntime: async () => ({
          async connectTargetRepo(input) {
            expect(input.repoPath).toBe(fixtureRepo);
            expect(input.repoFingerprint).toMatch(/^sha256:/);
            expect(input.sourceSeeds).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  path: "package.json",
                  kind: "package_manifest"
                }),
                expect.objectContaining({
                  path: "tsconfig.json",
                  kind: "typescript_config"
                }),
                expect.objectContaining({
                  path: "src",
                  kind: "source_root"
                })
              ])
            );
            expect(input.ownerFiles).toEqual([
              {
                path: "src/index.ts",
                root: "src",
                kind: "implementation_entry",
                reason: "implementation entry point"
              },
              {
                path: "tests/readiness.test.ts",
                root: "tests",
                kind: "behavior_test",
                reason: "readiness behavior proof"
              }
            ]);

            return {
              project: {
                id: "project-target-1",
                workspaceId: "workspace-1",
                slug: "krn-fixture-typescript-basic",
                displayName: "krn-fixture-typescript-basic",
                metadata: {},
                createdAt: now,
                updatedAt: now
              },
              projectCreated: true,
              repoInstallation: {
                id: "repo-installation-1",
                projectId: "project-target-1",
                provider: "local",
                repoUrl: `file://${fixtureRepo}`,
                defaultBranch: "main",
                repoFingerprint: input.repoFingerprint,
                localPathHint: fixtureRepo,
                metadata: {},
                createdAt: now,
                updatedAt: now
              },
              repoInstallationCreated: true,
              projectKernel: {
                id: "project-kernel-1",
                projectId: "project-target-1",
                version: 1,
                summary: "kernel",
                activeContextRule: "project scoped",
                metadata: {},
                createdAt: now,
                updatedAt: now
              },
              projectKernelCreated: true
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
    expect(result.stdout).toContain("KRN Init Connect");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("Project ID: project-target-1 (created)");
    expect(result.stdout).toContain("Repo installation ID: repo-installation-1 (created)");
    expect(result.stdout).toContain("ProjectKernel ID: project-kernel-1 (created)");
    expect(result.stdout).toContain(
      "Project scope: project-scoped source, memory, retrieval, and anti-memory only"
    );
    expect(result.stdout).toContain("Command detection:");
    expect(result.stdout).toContain("- scripts: build, test");
    expect(result.stdout).toContain("Source seed:");
    expect(result.stdout).toContain(
      "- package.json | kind=package_manifest | reason=detect package identity and scripts"
    );
    expect(result.stdout).toContain("- src | kind=source_root | reason=seed source owner-file recall");
    expect(result.stdout).toContain("Owner files:");
    expect(result.stdout).toContain(
      "- src/index.ts | root=src | kind=implementation_entry | reason=implementation entry point"
    );
    expect(result.stdout).toContain(
      "- tests/readiness.test.ts | root=tests | kind=behavior_test | reason=readiness behavior proof"
    );
    expect(result.stdout).toContain("Files written: none");
    expect(result.stdout).toContain(
      "Next command: krn plan --project project-target-1 --task \"improve test script readiness\" --persist"
    );
  });

  it("prints a bounded no-store plan for plan --task", async () => {
    const result = await runCli(["plan", "--task", "improve KRN doctor brain store readiness"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Plan");
    expect(result.stdout).toContain("Task: improve KRN doctor brain store readiness");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("Context included: 0");
    expect(result.stdout).toContain("Context excluded: 0");
    expect(result.stdout).toContain("Activation diagnostics:");
    expect(result.stdout).toContain("- inputStatus: empty_activation_store");
    expect(result.stdout).toContain(
      "- counts: memory=0 sourceClaims=0 search=0 ownerFile=0 antiMemory=0 merged=0"
    );
    expect(result.stdout).toContain("Evidence expected: pnpm typecheck, pnpm test, git diff --check");
    expect(result.stdout).toContain("KRN Codex Execution Brief");
    expect(result.stdout).toContain("Context activation abstained");
  });

  it("keeps plan as no-store preview unless --persist is explicit", async () => {
    const result = await runCli(["plan", "--task", "preview even with DB configured"], {
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@127.0.0.1:1/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("no-store preview");
  });

  it("requires database config for plan --persist", async () => {
    const result = await runCli(
      ["plan", "--task", "persist harness run", "--persist"],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("KRN_DATABASE_URL is required for krn plan --persist");
    expect(result.stderr).toContain(
      "Next action: export KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn; docker compose up -d krn-postgres; pnpm db:ready"
    );
  });

  it("prints persisted IDs for plan --persist", async () => {
    const result = await runCli(
      ["plan", "--task", "persist harness run", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
          const dependencies = createNoStoreCompilerDependencies(input);
          const harnessRunRepository = {
            ...dependencies.harnessRunRepository,
            async createExecutionRun(runInput: CreateExecutionRunInput) {
              return {
                id: "execution-run-1",
                harnessPlanId: runInput.harnessPlanId,
                adapter: runInput.adapter,
                status: runInput.status ?? "planned",
                ...(runInput.startedAt === undefined ? {} : { startedAt: runInput.startedAt }),
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            }
          };

          return {
            workspaceId: "workspace-1",
            projectId: "project-1",
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository
            },
            harnessRunRepository,
            memoryRepository: unusedMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("Persisted IDs:");
    expect(result.stdout).toContain("operatorIntent: operator-intent-1");
    expect(result.stdout).toContain("taskContract: task-contract-1");
    expect(result.stdout).toContain("harnessPlan: harness-plan-1");
    expect(result.stdout).toContain("contextAssembly: context-assembly-1");
    expect(result.stdout).toContain("executionRun: execution-run-1");
  });

  it("persists selected retained pattern IDs for plan --persist", async () => {
    let executionRunMetadata: Record<string, unknown> | undefined;
    const result = await runCli(
      ["plan", "--task", "unknown first", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
          const dependencies = createNoStoreCompilerDependencies(input);
          const harnessRunRepository = {
            ...dependencies.harnessRunRepository,
            async createExecutionRun(runInput: CreateExecutionRunInput) {
              executionRunMetadata = runInput.metadata ?? {};

              return {
                id: "execution-run-1",
                harnessPlanId: runInput.harnessPlanId,
                adapter: runInput.adapter,
                status: runInput.status ?? "planned",
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            }
          };

          return {
            workspaceId: "workspace-1",
            projectId: "project-1",
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository
            },
            harnessRunRepository,
            memoryRepository: unusedMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Retained pattern selection: selected");
    expect(result.stdout).toContain(
      "Retained pattern IDs: ts-boundary-brain-knowledge-parser-exemplar, ts-boundary-unknown-first-result-state"
    );
    expect(result.stdout).toContain(
      "- pattern=ts-boundary-brain-knowledge-parser-exemplar | card=pattern:ts-boundary-brain-knowledge-parser-exemplar"
    );
    expect(result.stdout).toContain(
      "- pattern=ts-boundary-unknown-first-result-state | card=pattern:ts-boundary-unknown-first-result-state"
    );
    expect(executionRunMetadata).toMatchObject({
      retainedPatternSelection: {
        status: "selected",
        selectedPatternIds: [
          "ts-boundary-brain-knowledge-parser-exemplar",
          "ts-boundary-unknown-first-result-state"
        ]
      }
    });
  });

  it("retries retained-pattern planning with compact mechanism terms", async () => {
    const { result, executionRunMetadata } = await runPersistedPlanWithCapturedMetadata(
      "Use the retained consensus relation heartbeat review boundary in a bounded mini Brain-QA or consensus-lane readback; verify whether pattern:consensus-relation-heartbeat-review-boundary is selected or classify the miss; record whether it changes the next source-to-decision decision; no runtime schema dashboard API MCP worker daemon crawler graph ranking rewrite or Memory Core mutation work"
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Retained pattern selection: selected");
    expect(result.stdout).toContain("Retained pattern IDs: consensus-relation-heartbeat-review-boundary");
    expect(executionRunMetadata).toMatchObject({
      retainedPatternSelection: {
        status: "selected",
        selectedPatternIds: ["consensus-relation-heartbeat-review-boundary"]
      }
    });
  });

  it("retries retained-pattern planning with parser exemplar mechanism terms", async () => {
    const { result, executionRunMetadata } = await runPersistedPlanWithCapturedMetadata(
      "Improve retained-pattern plan query shaping so long TypeScript parser exemplar metadata-boundary tasks select pattern:ts-boundary-brain-knowledge-parser-exemplar without ranking, schema, or Memory Core changes"
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Retained pattern selection: selected");
    expect(result.stdout).toContain("Retained pattern query: typescript parser exemplar");
    expect(result.stdout).toContain("Retained pattern IDs: ts-boundary-brain-knowledge-parser-exemplar");
    expect(executionRunMetadata).toMatchObject({
      retainedPatternSelection: {
        status: "selected",
        query: "typescript parser exemplar",
        selectedPatternIds: ["ts-boundary-brain-knowledge-parser-exemplar"]
      }
    });
  });

  it("selects reference implementation recipe patterns for exemplar tasks", async () => {
    const { result, executionRunMetadata } = await runPersistedPlanWithCapturedMetadata(
      "Prove the retained reference-implementation recipe pattern through one executable/readback brain surface so future KRN work can retrieve and apply a local code exemplar without building a clone runtime or more markdown instructions"
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Retained pattern selection: selected");
    expect(result.stdout).toContain("Retained pattern query: prove reference implementation recipe");
    expect(result.stdout).toContain(
      "Retained pattern IDs: reference-implementation-recipe-clone-boundary, ts-boundary-brain-knowledge-parser-exemplar"
    );
    expect(executionRunMetadata).toMatchObject({
      retainedPatternSelection: {
        status: "selected",
        query: "prove reference implementation recipe",
        selectedPatternIds: [
          "reference-implementation-recipe-clone-boundary",
          "ts-boundary-brain-knowledge-parser-exemplar"
        ]
      }
    });
  });

  it("passes the current repo root hint for default persisted planning", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    let observedRepoPathHint: string | undefined;
    let executionRunMetadata: Record<string, unknown> | undefined;

    const result = await runCli(
      ["plan", "--task", "use connected current repo project", "--persist"],
      {
        cwd: path.join(repoRoot, "packages", "cli"),
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
          observedRepoPathHint = input.repoPathHint;
          const dependencies = createNoStoreCompilerDependencies(input);
          const harnessRunRepository = {
            ...dependencies.harnessRunRepository,
            async createExecutionRun(runInput: CreateExecutionRunInput) {
              executionRunMetadata = runInput.metadata ?? {};

              return {
                id: "execution-run-1",
                harnessPlanId: runInput.harnessPlanId,
                adapter: runInput.adapter,
                status: runInput.status ?? "planned",
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            }
          };

          return {
            workspaceId: "workspace-connected",
            projectId: "project-connected",
            projectResolution: {
              kind: "connected_repo_path",
              reason: "Resolved from repo_installations.local_path_hint matching the current repo root.",
              doesNotProve:
                "Connected repo path resolution does not prove owner files are complete, current, or sufficient.",
              repoPathHint: repoRoot
            },
            projectKernel: {
              id: "project-kernel-connected",
              projectId: "project-connected",
              version: 1,
              summary: "Connected current repo kernel",
              activeContextRule: "Use connected current repo read model.",
              metadata: {},
              createdAt: now,
              updatedAt: now
            },
            repoInstallations: [
              {
                id: "repo-installation-connected",
                projectId: "project-connected",
                provider: "local",
                repoUrl: `file://${repoRoot}`,
                defaultBranch: "main",
                repoFingerprint: "sha256:connected",
                localPathHint: repoRoot,
                metadata: {
                  ownerFiles: [
                    {
                      path: "packages/cli/src/runPlanCommand.ts",
                      root: "packages/cli/src",
                      kind: "cli_plan_rendering",
                      reason: "plan output owner"
                    }
                  ]
                },
                createdAt: now,
                updatedAt: now
              }
            ],
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository
            },
            harnessRunRepository,
            memoryRepository: unusedMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(observedRepoPathHint).toBe(repoRoot);
    expect(result.stdout).toContain("Project ID: project-connected");
    expect(result.stdout).toContain("Project resolution: connected_repo_path (connected repo path)");
    expect(result.stdout).toContain(
      "Project resolution reason: Resolved from repo_installations.local_path_hint matching the current repo root."
    );
    expect(result.stdout).toContain(`Project resolution repoPathHint: ${repoRoot}`);
    expect(result.stdout).toContain(
      "Project resolution does not prove: Connected repo path resolution does not prove owner files are complete, current, or sufficient."
    );
    expect(result.stdout).toContain("ProjectKernel: project-kernel-connected");
    expect(result.stdout).toContain("Repo installations: repo-installation-connected");
    expect(result.stdout).toContain("Target owner files: packages/cli/src/runPlanCommand.ts");
    expect(executionRunMetadata).toMatchObject({
      projectResolution: {
        kind: "connected_repo_path",
        repoPathHint: repoRoot
      }
    });
  });

  it("uses explicit project identity for persisted planning", async () => {
    let observedProjectId: string | undefined;
    let executionRunMetadata: Record<string, unknown> | undefined;

    const result = await runCli(
      [
        "plan",
        "--project",
        "project-target-1",
        "--task",
        "improve test script readiness",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
          observedProjectId = input.projectId;
          const dependencies = createNoStoreCompilerDependencies(input);
          const harnessRunRepository = {
            ...dependencies.harnessRunRepository,
            async createExecutionRun(runInput: CreateExecutionRunInput) {
              executionRunMetadata = runInput.metadata ?? {};

              return {
                id: "execution-run-1",
                harnessPlanId: runInput.harnessPlanId,
                adapter: runInput.adapter,
                status: runInput.status ?? "planned",
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            }
          };

          return {
            workspaceId: "workspace-target-1",
            projectId: "project-target-1",
            projectKernel: {
              id: "project-kernel-1",
              projectId: "project-target-1",
              version: 1,
              summary: "Target repo kernel",
              activeContextRule: "Use target repo context only.",
              metadata: {
                sourceSeeds: [
                  {
                    path: "evals",
                    kind: "eval_workspace",
                    reason: "seed eval, acceptance report, and test owner-file recall"
                  }
                ]
              },
              createdAt: now,
              updatedAt: now
            },
            repoInstallations: [
              {
                id: "repo-installation-1",
                projectId: "project-target-1",
                provider: "local",
                repoUrl: "file:///tmp/target-repo",
                defaultBranch: "main",
                repoFingerprint: "sha256:fixture",
                localPathHint: "/tmp/target-repo",
                metadata: {
                  sourceSeeds: [
                    {
                      path: "scripts",
                      kind: "script_root",
                      reason: "seed operator script and automation owner-file recall"
                    }
                  ]
                },
                createdAt: now,
                updatedAt: now
              }
            ],
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository
            },
            harnessRunRepository,
            memoryRepository: unusedMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(observedProjectId).toBe("project-target-1");
    expect(result.stdout).toContain("Project ID: project-target-1");
    expect(result.stdout).toContain("ProjectKernel: project-kernel-1");
    expect(result.stdout).toContain("Repo installations: repo-installation-1");
    expect(result.stdout).toContain("Target read model: sourceSeeds=2, ownerFiles=0, trustExclusions=7");
    expect(result.stdout).toContain("Target owner-file recall: missing_owner_file_read_model");
    expect(result.stdout).toContain("Target owner-file reason: target_read_model_has_no_owner_files");
    expect(result.stdout).toContain(
      "Target owner-file explanation: Target read model has source seeds but no exact owner-file entries, so KRN can only surface root-level target context."
    );
    expect(result.stdout).toContain(
      "Target owner-file does not prove: Missing owner-file entries do not prove owner files do not exist; it proves only that the current read model cannot name them."
    );
    expect(result.stdout).toContain("Target owner files: unavailable; using root-level source seeds only");
    expect(result.stdout).toContain("executionRun: execution-run-1");
    expect(executionRunMetadata).toMatchObject({
      targetReadModel: {
        sourceSeedCount: 2,
        ownerFileCount: 0,
        trustExclusionCount: 7,
        ownerFileRecall: {
          status: "missing_owner_file_read_model",
          reason: "target_read_model_has_no_owner_files",
          sourceSeedPaths: ["evals", "scripts"],
          ownerFilePaths: []
        }
      }
    });
  });

  it("loads explicit target owner files from project metadata for persisted planning", async () => {
    let executionRunMetadata: Record<string, unknown> | undefined;

    const result = await runCli(
      [
        "plan",
        "--project",
        "project-target-1",
        "--task",
        "improve readiness test owner path",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
          const dependencies = createNoStoreCompilerDependencies(input);
          const harnessRunRepository = {
            ...dependencies.harnessRunRepository,
            async createExecutionRun(runInput: CreateExecutionRunInput) {
              executionRunMetadata = runInput.metadata ?? {};

              return {
                id: "execution-run-1",
                harnessPlanId: runInput.harnessPlanId,
                adapter: runInput.adapter,
                status: runInput.status ?? "planned",
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            }
          };

          return {
            workspaceId: "workspace-target-1",
            projectId: "project-target-1",
            projectKernel: {
              id: "project-kernel-1",
              projectId: "project-target-1",
              version: 1,
              summary: "Target repo kernel",
              activeContextRule: "Use target repo context only.",
              metadata: {
                sourceSeeds: [
                  {
                    path: "tests",
                    kind: "test_root",
                    reason: "seed target repo verification surface"
                  }
                ],
                ownerFiles: [
                  {
                    path: "tests/readiness.test.ts",
                    root: "tests",
                    kind: "behavior_test",
                    reason: "readiness behavior proof"
                  }
                ]
              },
              createdAt: now,
              updatedAt: now
            },
            repoInstallations: [],
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository
            },
            harnessRunRepository,
            memoryRepository: unusedMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Target read model: sourceSeeds=1, ownerFiles=1, trustExclusions=7");
    expect(result.stdout).toContain("Target owner-file recall: owner_files_available");
    expect(result.stdout).toContain("Target owner files: tests/readiness.test.ts");
    expect(executionRunMetadata).toMatchObject({
      targetReadModel: {
        sourceSeedCount: 1,
        ownerFileCount: 1,
        ownerFilePaths: ["tests/readiness.test.ts"],
        ownerFileRecall: {
          status: "owner_files_available",
          ownerFilePaths: ["tests/readiness.test.ts"]
        }
      }
    });
  });

  it("does not fallback to the default project when an explicit project is missing", async () => {
    const result = await runCli(
      [
        "plan",
        "--project",
        "missing-project",
        "--task",
        "improve test script readiness",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
          if (input.projectId === "missing-project") {
            throw new Error("Project not found for --project missing-project");
          }

          throw new Error("unexpected fallback to default project");
        }
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Project not found for --project missing-project");
    expect(result.stderr).not.toContain("unexpected fallback");
  });

  it("prints run show DB requirements in help", async () => {
    const result = await runCli(["run", "--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: krn run show --run-id <execution-run-id> [--json]");
    expect(result.stdout).toContain("requires: KRN_DATABASE_URL and a persisted execution run");
    expect(result.stdout).toContain("verify DB first: pnpm db:ready");
  });

  it("explains how to unblock run show without database config", async () => {
    const result = await runCli(["run", "show", "--run-id", "execution-run-1"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("KRN_DATABASE_URL is required for krn run show");
    expect(result.stderr).toContain(
      "Next action: export KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn and run pnpm db:ready before readback"
    );
    expect(result.stderr).toContain(
      "Does not prove: setting KRN_DATABASE_URL does not prove the requested run exists, commands executed, or Memory Core mutated"
    );
  });

  it("prints bounded activation inclusions and explicit exclusions for plan --persist", async () => {
    const activeMemory: MemoryRecord = {
      id: "11111111-1111-4111-8111-111111111111",
      projectId: "project-1",
      key: "activation-output",
      kind: "constraint",
      status: "active",
      summary: "Activation output should be explicit",
      body: "Persisted plan output should show selected context and rejected context.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance: "Use when formatting persisted activation summaries.",
      sourceLineage: [{ sourceId: "22222222-2222-4222-8222-222222222222" }],
      isUserPreference: false,
      positiveFeedbackCount: 0,
      negativeFeedbackCount: 0,
      metadata: {},
      validFrom: now,
      createdAt: now,
      updatedAt: now
    };
    const rejectedClaim: SourceClaim = {
      id: "33333333-3333-4333-8333-333333333333",
      sourceArtifactId: "44444444-4444-4444-8444-444444444444",
      claim: "Persisted plan output should hide activation exclusions.",
      mechanism: "",
      krnImplication: "Operators would miss rejected context.",
      doesNotProve: "The claim has a mechanism.",
      trustTier: "high",
      supportType: "background",
      consumer: "M25.05 CLI output",
      status: "proposed",
      metadata: {},
      createdAt: now,
      updatedAt: now
    };
    const antiMemory: AntiMemoryRecord = {
      id: "55555555-5555-4555-8555-555555555555",
      projectId: "project-1",
      key: "activation-output-anti",
      rejectedClaim: "Persisted plan output should hide activation exclusions.",
      reason: "Exclusions must be visible in M25.05 output.",
      invalidatedBySourceClaimIds: [rejectedClaim.id],
      summary: "Do not hide activation exclusions",
      body: "Persisted plan output must show explicit exclusions.",
      owner: "kernel",
      confidence: 95,
      sourceLineage: [{ sourceId: rejectedClaim.id }],
      metadata: {},
      validFrom: now,
      createdAt: now,
      updatedAt: now
    };
    const searchResult: SearchDocumentSearchResult = {
      id: "66666666-6666-4666-8666-666666666666",
      projectId: "project-1",
      subjectType: "search_document",
      subjectId: "66666666-6666-4666-8666-666666666666",
      trustTier: "project-decision",
      validityStatus: "active",
      language: "english",
      title: "Activation output search result",
      body: "Persisted plan output includes activation inclusions exclusions and abstentions.",
      searchText: "persisted plan output activation inclusions exclusions abstentions",
      metadataFilters: {},
      metadata: {},
      validFrom: now,
      createdAt: now,
      updatedAt: now,
      lexicalScore: 200
    };
    const result = await runCli(
      ["plan", "--task", "persist activation output", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
          const dependencies = createNoStoreCompilerDependencies(input);
          const harnessRunRepository = {
            ...dependencies.harnessRunRepository,
            async createExecutionRun(runInput: CreateExecutionRunInput) {
              return {
                id: "execution-run-1",
                harnessPlanId: runInput.harnessPlanId,
                adapter: runInput.adapter,
                status: runInput.status ?? "planned",
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            }
          };

          return {
            workspaceId: "workspace-1",
            projectId: "project-1",
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository,
              memoryRepository: {
                async listActiveMemory() {
                  return [activeMemory];
                },
                async listAntiMemoryForProject() {
                  return [antiMemory];
                }
              },
              sourceRepository: {
                async listClaimsForProject() {
                  return [rejectedClaim];
                },
                async listSourceClaimEdgesForClaim() {
                  return [];
                }
              },
              retrievalRepository: {
                ...dependencies.retrievalRepository,
                async searchLexical() {
                  return [searchResult];
                }
              }
            },
            harnessRunRepository,
            memoryRepository: unusedMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Context status: assembled");
    expect(result.stdout).toContain("Context inclusions:");
    expect(result.stdout).toContain("search_document:66666666-6666-4666-8666-666666666666");
    expect(result.stdout).toContain("memory_record:11111111-1111-4111-8111-111111111111");
    expect(result.stdout).toContain("Context exclusions:");
    expect(result.stdout).toContain("source_claim:33333333-3333-4333-8333-333333333333");
    expect(result.stdout).toContain("anti-memory");
  });

  it("selects reviewed Memory Core write-authority memory for the self-hosting plan", async () => {
    const writeAuthorityMemory: MemoryRecord = {
      id: "11111111-1111-4111-8111-111111111111",
      projectId: "project-1",
      key: "memory-core-write-authority",
      kind: "constraint",
      status: "active",
      summary: "MemoryReviewGate seals Memory Core write authority",
      body:
        "Public Memory Core promotion must go through MemoryReviewGate and promoteReviewedMemoryCandidate; raw MemoryRecord writes remain adapter internals.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance:
        "Use when sealing Memory Core write authority or reviewing public MemoryRecord promotion paths.",
      sourceLineage: [{ sourceId: "PLAN.md#P2-00" }],
      isUserPreference: false,
      positiveFeedbackCount: 0,
      negativeFeedbackCount: 0,
      metadata: {},
      validFrom: now,
      createdAt: now,
      updatedAt: now
    };
    const adjacentSourceGraphMemory: MemoryRecord = {
      id: "22222222-2222-4222-8222-222222222222",
      projectId: "project-1",
      key: "source-graph-postgres",
      kind: "constraint",
      status: "active",
      summary: "Source graph decisions should remain Postgres-backed",
      body: "Use relational source graph edges before adding a separate graph database.",
      owner: "kernel",
      confidence: 95,
      applicationGuidance: "Use when deciding whether source graph work needs a graph database.",
      sourceLineage: [{ sourceId: "PLAN.md#P2-01" }],
      isUserPreference: false,
      positiveFeedbackCount: 0,
      negativeFeedbackCount: 0,
      metadata: {},
      validFrom: now,
      createdAt: now,
      updatedAt: now
    };
    const result = await runCli(
      ["plan", "--task", "seal Memory Core write authority", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async (input: DatabaseRuntimeInput) => {
          const dependencies = createNoStoreCompilerDependencies(input);
          const harnessRunRepository = {
            ...dependencies.harnessRunRepository,
            async createExecutionRun(runInput: CreateExecutionRunInput) {
              return {
                id: "execution-run-1",
                harnessPlanId: runInput.harnessPlanId,
                adapter: runInput.adapter,
                status: runInput.status ?? "planned",
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            }
          };

          return {
            workspaceId: "workspace-1",
            projectId: "project-1",
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository,
              memoryRepository: {
                async listActiveMemory() {
                  return [adjacentSourceGraphMemory, writeAuthorityMemory];
                },
                async listAntiMemoryForProject() {
                  return [];
                }
              },
              sourceRepository: {
                async listClaimsForProject() {
                  return [];
                },
                async listSourceClaimEdgesForClaim() {
                  return [];
                }
              },
              retrievalRepository: {
                ...dependencies.retrievalRepository,
                async searchLexical() {
                  return [];
                }
              }
            },
            harnessRunRepository,
            memoryRepository: unusedMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
      }
    );

    const writeAuthorityIndex = result.stdout.indexOf(
      "memory_record:11111111-1111-4111-8111-111111111111"
    );
    const adjacentIndex = result.stdout.indexOf(
      "memory_record:22222222-2222-4222-8222-222222222222"
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(writeAuthorityIndex).toBeGreaterThanOrEqual(0);
    expect(adjacentIndex).toBeGreaterThan(writeAuthorityIndex);
    expect(result.stdout).toContain(
      "expected_use=Use when sealing Memory Core write authority or reviewing public MemoryRecord promotion paths."
    );
  });

  it("returns exit 2 for invalid plan args", async () => {
    const result = await runCli(["plan"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Usage: krn plan [--project <project-id>] --task");
  });

  it("groups public, governed admin, and internal dev commands in help", async () => {
    const result = await runCli(["--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Public operator commands:");
    expect(result.stdout).toContain("Governed admin commands:");
    expect(result.stdout).toContain("Internal/dev commands:");
    expect(result.stdout).toContain("krn db --help");
    expect(result.stdout).toContain(
      "DB readiness/smoke commands prove local runtime plumbing only"
    );
    expect(result.stdout).not.toContain("krn audit");
  });

  it("guards self-hosting evidence provenance through observe and reflect", async () => {
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

    let reflectedOutputMemoryCandidateCount: number | undefined;
    const reflectResult = await runCli(
      ["reflect", "--scope", "run:execution-run-1", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createReflectDatabaseRuntime: async () => ({
          async getRunSnapshot(runId: string) {
            expect(runId).toBe("execution-run-1");

            return {
              executionRunId: runId,
              projectId: "project-1",
              taskContractId: "task-contract-1"
            };
          },
          async projectExists() {
            return true;
          },
          observationRepository: {
            async findByRun() {
              return [observationItem];
            },
            async findByScope() {
              return [observationItem];
            }
          },
          sourceRepository: {
            async listClaimsForProject() {
              return [];
            },
            async listSourceClaimsForRun() {
              return [];
            }
          },
          memoryRepository: {
            async listAntiMemoryForProject() {
              return [];
            },
            async listAntiMemoryForRun() {
              return [];
            }
          },
          reflectionRepository: {
            async createReflectionRecord(input) {
              reflectedOutputMemoryCandidateCount = input.output.memoryCandidates.length;

              return {
                id: "reflection-record-1",
                scope: input.scope,
                status: input.status,
                summary: input.summary,
                input: input.input,
                output: input.output,
                metadata: input.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            }
          },
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(reflectResult.exitCode).toBe(0);
    expect(reflectResult.stderr).toBe("");
    expect(reflectResult.stdout).toContain("Candidate rows written: no");
    expect(reflectResult.stdout).toContain("MemoryRecord created: no");
    expect(reflectedOutputMemoryCandidateCount).toBe(0);
  });

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
