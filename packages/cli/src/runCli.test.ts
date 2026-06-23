import { describe, expect, it } from "vitest";
import path from "node:path";

import {
  runCli
} from "./runCli.js";
import {
  createNoStoreCompilerDependencies
} from "./noStoreRepositories.js";
import {
  commandResultDoesNotProve
} from "@krn/core";
import type {
  AntiMemoryRecord,
  MemoryRecord,
  ObservationItem,
  SourceClaim
} from "@krn/core";
import type {
  CreateAntiMemoryRecordInput,
  CreateEvidenceBundleInput,
  CreateExecutionRunInput,
  CreateFeedbackDeltaInput,
  CreateMemoryFeedbackEventInput,
  CreateMemoryCandidateInput,
  InvalidateMemoryRecordInput,
  PromoteMemoryCandidateInput,
  RejectMemoryCandidateInput,
  RecordMemoryApplicationInput,
  CreateReviewAssessmentInput,
  HarnessRunAggregate,
  SearchDocumentSearchResult
} from "@krn/harness/repositories";
import type {
  DatabaseRuntimeInput
} from "./databaseRuntime.js";
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
} from "./doctorReadiness.js";

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
  async recordMemoryApplication(_input: RecordMemoryApplicationInput): Promise<never> {
    throw new Error("recordMemoryApplication should not be called");
  },
  async createMemoryFeedbackEvent(_input: CreateMemoryFeedbackEventInput): Promise<never> {
    throw new Error("createMemoryFeedbackEvent should not be called");
  },
  async createAntiMemoryRecord(_input: CreateAntiMemoryRecordInput): Promise<never> {
    throw new Error("createAntiMemoryRecord should not be called");
  }
};

describe("runCli", () => {
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
    expect(result.stdout).toContain("Existing AGENTS.md: absent");
    expect(result.stdout).toContain("Existing .codex: absent");
    expect(result.stdout).toContain("Existing .agents/skills: absent");
    expect(result.stdout).toContain("Forbidden surfaces: absent");
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
  });

  it("routes reflect scope commands through the CLI parser", async () => {
    const result = await runCli(["reflect", "--scope", "run:run-1"], {
      env: {},
      cwd: path.resolve(process.cwd(), "../.."),
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("KRN_DATABASE_URL is required for krn reflect");
  });

  it("prints missing DB guidance for target repo init-connect smoke", async () => {
    const result = await runCli(["db", "smoke", "init-connect"], {
      env: {},
      cwd: path.resolve(process.cwd(), "../.."),
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("KRN Target Repo Init-Connect Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Init-connect smoke: skipped (database not configured)");
  });

  it("prints missing DB guidance for target repo harness smoke", async () => {
    const result = await runCli(["db", "smoke", "target-repo-harness"], {
      env: {},
      cwd: path.resolve(process.cwd(), "../.."),
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("KRN Target Repo Harness Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain(
      "Target repo harness smoke: skipped (database not configured)"
    );
  });

  it("exposes the target repo init-connect smoke script", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const packageJson = JSON.parse(
      await import("node:fs/promises").then((fs) =>
        fs.readFile(path.join(repoRoot, "package.json"), "utf8")
      )
    ) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.["db:smoke:init-connect"]).toBe(
      "pnpm --filter @krn/cli krn db smoke init-connect"
    );
  });

  it("exposes the target repo harness smoke script", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const packageJson = JSON.parse(
      await import("node:fs/promises").then((fs) =>
        fs.readFile(path.join(repoRoot, "package.json"), "utf8")
      )
    ) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.["db:smoke:target-repo-harness"]).toBe(
      "pnpm --filter @krn/cli krn db smoke target-repo-harness"
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
      ["init", "--connect", "--repo", fixtureRepo, "--persist"],
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

  it("uses explicit project identity for persisted planning", async () => {
    let observedProjectId: string | undefined;

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
              metadata: {},
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
                metadata: {},
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
    expect(result.stdout).toContain("executionRun: execution-run-1");
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
        metadata: {},
        createdAt: now,
        updatedAt: now
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
          evidenceContract: {
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
            trustTier: "project-decision"
          },
          {
            subjectType: "memory_record",
            subjectId: "memory-record-1",
            reason: "Memory records prior adapter decision.",
            expectedUse: "Keep output bounded.",
            trustTier: "high"
          }
        ],
        exclusions: [
          {
            subjectType: "anti_memory_record",
            subjectId: "anti-memory-1",
            reason: "unsafe",
            explanation: "Do not mutate memory while rendering a brief.",
            trustTier: "high"
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
        metadata: {},
        createdAt: now,
        updatedAt: now
      },
      evidenceBundles: [],
      reviewAssessments: [],
      feedbackDeltas: [],
      runEvents: []
    };
    const harnessRunRepository = {
      ...dependencies.harnessRunRepository,
      async createExecutionRun(_input: CreateExecutionRunInput) {
        throw new Error("codex brief must not create execution runs");
      },
      async getHarnessRunByExecutionRunId(runId: string) {
        return runId === "execution-run-1" ? aggregate : undefined;
      }
    };
    const result = await runCli(["codex", "brief", "--run-id", "execution-run-1"], {
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      createDatabaseRuntime: async () => ({
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
      })
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Codex Brief");
    expect(result.stdout).toContain("Run ID: execution-run-1");
    expect(result.stdout).toContain("Persistence: read-only (Postgres)");
    expect(result.stdout).toContain("Codex invocation: none");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("KRN Codex Execution Brief");
    expect(result.stdout).toContain("Source Claims Used:");
    expect(result.stdout).toContain("- source-claim-1");
    expect(result.stdout).toContain("Memory Records Used:");
    expect(result.stdout).toContain("- memory-record-1");
    expect(result.stdout).toContain("Anti-memory Warnings:");
    expect(result.stdout).toContain("anti_memory_record:anti-memory-1");
    expect(result.stdout).toContain("unknown-first boundary check");
    expect(result.stdout).toContain("no type weakening");
    expect(result.stdout).toContain("diff risk summary");
    expect(result.stdout).toContain("review-risk notes");
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
      invalidatedBySourceClaimId: rejectedClaim.id,
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

  it("prints evidence capture verification examples in help", async () => {
    const result = await runCli(["--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(
      "krn evidence capture [--run-id <id>] [--verification \"pnpm typecheck=passed\"] [--persist]"
    );
    expect(result.stdout).toContain(
      "example: krn evidence capture --verification \"pnpm typecheck=passed\" --verification \"pnpm test=passed\""
    );
    expect(result.stdout).toContain(
      "evidence capture records outcomes; it does not execute commands"
    );
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

  it("prints DB help as an internal dev surface", async () => {
    const result = await runCli(["db", "--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Internal/dev commands:");
    expect(result.stdout).toContain("krn db readiness");
    expect(result.stdout).toContain("krn db smoke [target]");
    expect(result.stdout).toContain(
      "They are not public operator workflow, product quality authority, or Memory Brain readiness proof."
    );
  });

  it("prints a read-only doctor report", async () => {
    const result = await runCli(["doctor"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Doctor");
    expect(result.stdout).toContain("Postgres config: not configured");
    expect(result.stdout).toContain(
      "Brain store readiness: preview only (set KRN_DATABASE_URL and run migrations for persisted harness state)"
    );
    expect(result.stdout).toContain("pgvector: skipped");
    expect(result.stdout).toContain("Harness persistence schema: skipped (Postgres not configured)");
    expect(result.stdout).toContain("Project repository smoke: available (pnpm db:smoke)");
    expect(result.stdout).toContain("Harness plan smoke: available (pnpm db:smoke:harness-plan)");
    expect(result.stdout).toContain(
      "Evidence persistence smoke: available (pnpm db:smoke:harness-evidence)"
    );
    expect(result.stdout).toContain(
      "Harness persistence readiness: preview only (set KRN_DATABASE_URL and run harness smoke commands for persistence proof)"
    );
    expect(result.stdout).toContain("Source graph smoke: available (pnpm db:smoke:source-graph)");
    expect(result.stdout).toContain(
      "Source graph readiness: preview only (set KRN_DATABASE_URL and run source graph smoke for persistence proof)"
    );
    expect(result.stdout).toContain("Memory governance schema: skipped (Postgres not configured)");
    expect(result.stdout).toContain("MemoryRepository read path: skipped (Postgres not configured)");
    expect(result.stdout).toContain(
      "Memory governance smoke: available (pnpm db:smoke:memory-governance)"
    );
    expect(result.stdout).toContain(
      "Memory governance readiness: preview only (set KRN_DATABASE_URL and run memory governance smoke for persistence proof)"
    );
    expect(result.stdout).toContain("Retrieval substrate schema: skipped (Postgres not configured)");
    expect(result.stdout).toContain(
      "RetrievalRepository read path: skipped (Postgres not configured)"
    );
    expect(result.stdout).toContain(
      "Retrieval substrate smoke: available (pnpm db:smoke:retrieval-substrate)"
    );
    expect(result.stdout).toContain(
      "Retrieval substrate readiness: preview only (set KRN_DATABASE_URL and run retrieval substrate smoke for persistence proof)"
    );
    expect(result.stdout).toContain("Activation domain contracts: present");
    expect(result.stdout).toContain("Activation smoke: available (pnpm db:smoke:activation)");
    expect(result.stdout).toContain("Activation smoke runtime proof: skipped (Postgres not configured)");
    expect(result.stdout).toContain(
      "Activation readiness: preview only (set KRN_DATABASE_URL and run activation smoke for runtime proof)"
    );
    expect(result.stdout).toContain("Codex adapter renderer: present");
    expect(result.stdout).toContain(
      "Execution brief smoke: available (pnpm db:smoke:codex-adapter)"
    );
    expect(result.stdout).toContain("Hook expectation projection: present");
    expect(result.stdout).toContain("Codex execution runner: absent");
    expect(result.stdout).toContain("KRN MCP server: absent");
    expect(result.stdout).toContain(
      "Codex adapter readiness: preview only (set KRN_DATABASE_URL and run codex adapter smoke for proof)"
    );
    expect(result.stdout).toContain("Worker job schema: present");
    expect(result.stdout).toContain("Worker job repository: present");
    expect(result.stdout).toContain("Worker job smoke: available (pnpm db:smoke:worker-jobs)");
    expect(result.stdout).toContain("Redis/Kafka queue: absent");
    expect(result.stdout).toContain("Broad worker daemon: absent");
    expect(result.stdout).toContain(
      "Worker job readiness: preview only (set KRN_DATABASE_URL and run worker job smoke for proof)"
    );
    expect(result.stdout).toContain(
      "Target repo init command: available (krn init --connect --repo <path> --persist)"
    );
    expect(result.stdout).toContain(
      "Target repo fixture smoke: available (tests/fixtures/target-repos/typescript-basic)"
    );
    expect(result.stdout).toContain(
      "Project registration schema: present (Project, RepoInstallation, ProjectKernel)"
    );
    expect(result.stdout).toContain("Init-connect smoke: proven (pnpm db:smoke:init-connect)");
    expect(result.stdout).toContain(
      "Target repo harness smoke: proven (pnpm db:smoke:target-repo-harness)"
    );
    expect(result.stdout).toContain("Cross-project leakage proof: known");
    expect(result.stdout).toContain("Target repo forbidden surfaces: absent");
    expect(result.stdout).toContain(
      "Target repo readiness: preview only (set KRN_DATABASE_URL and run init-connect and target repo harness smokes for proof)"
    );
    expect(result.stdout).toContain("Broad context dump: absent");
    expect(result.stdout).toContain("Core requiredSkills field: absent");
    expect(result.stdout).toContain("Separate vector/search DB: absent");
    expect(result.stdout).toContain("Naive RAG dump command: absent");
    expect(result.stdout).toContain("Runtime markdown memory: absent");
    expect(result.stdout).toContain("Automatic memory mutation: absent");
    expect(result.stdout).toContain("AGENTS.md: present");
    expect(result.stdout).toContain(".krn runtime truth: absent");
    expect(result.stdout).toContain("TypeScript strictness: enabled");
    expect(result.stdout).toContain("Forbidden surfaces: absent");
  });

  it("distinguishes doctor DB readiness blockers", () => {
    expect(
      deriveBrainStoreReadiness([
        { label: "Postgres config", status: "configured and reachable" },
        { label: "pgvector", status: "available" },
        { label: "migrations", status: "unverified (2/3 applied)" }
      ])
    ).toEqual({
      label: "Brain store readiness",
      status: "blocked (migrations unverified)"
    });

    expect(
      deriveBrainStoreReadiness([
        { label: "Postgres config", status: "configured and reachable" },
        { label: "pgvector", status: "missing" },
        { label: "migrations", status: "verified (3/3 applied)" }
      ])
    ).toEqual({
      label: "Brain store readiness",
      status: "blocked (pgvector missing)"
    });
  });

  it("distinguishes doctor harness persistence readiness blockers", () => {
    const postgresReady = [
      { label: "Postgres config", status: "configured and reachable" },
      { label: "pgvector", status: "available" },
      { label: "migrations", status: "verified (3/3 applied)" }
    ];
    const smokeCommandsAvailable = [
      { label: "Harness persistence schema", status: "ready (10/10 tables present)" },
      { label: "Project repository smoke", status: "available (pnpm db:smoke)" },
      { label: "Harness plan smoke", status: "available (pnpm db:smoke:harness-plan)" },
      {
        label: "Evidence persistence smoke",
        status: "available (pnpm db:smoke:harness-evidence)"
      }
    ];

    expect(
      deriveHarnessPersistenceReadiness(postgresReady, smokeCommandsAvailable)
    ).toEqual({
      label: "Harness persistence readiness",
      status: "ready (schema present; smoke commands available)"
    });

    expect(
      deriveHarnessPersistenceReadiness(postgresReady, [
        ...smokeCommandsAvailable.slice(1),
        { label: "Harness persistence schema", status: "missing (feedback_deltas)" }
      ])
    ).toEqual({
      label: "Harness persistence readiness",
      status: "blocked (harness persistence schema missing)"
    });
  });

  it("distinguishes doctor source graph readiness blockers", () => {
    const postgresReady = [
      { label: "Postgres config", status: "configured and reachable" },
      { label: "pgvector", status: "available" },
      { label: "migrations", status: "verified (4/4 applied)" }
    ];
    const sourceGraphReady = [
      { label: "Source graph schema", status: "ready (8/8 tables present)" },
      { label: "SourceRepository read path", status: "reachable" },
      { label: "Source graph smoke", status: "available (pnpm db:smoke:source-graph)" },
      { label: "Source graph runtime proof", status: "ready (claims 1, edges 1, rejections 1)" },
      { label: "Source crawler/research layer", status: "absent" },
      { label: "Separate graph DB", status: "absent" }
    ];

    expect(
      deriveSourceGraphReadiness(postgresReady, sourceGraphReady)
    ).toEqual({
      label: "Source graph readiness",
      status: "ready (schema present; repository reachable; runtime proof present)"
    });

    expect(
      deriveSourceGraphReadiness(postgresReady, [
        ...sourceGraphReady.slice(0, 3),
        { label: "Source graph runtime proof", status: "unverified (run pnpm db:smoke:source-graph)" },
        ...sourceGraphReady.slice(4)
      ])
    ).toEqual({
      label: "Source graph readiness",
      status: "runtime unverified (run pnpm db:smoke:source-graph)"
    });
  });

  it("distinguishes doctor memory governance readiness blockers", () => {
    const postgresReady = [
      { label: "Postgres config", status: "configured and reachable" },
      { label: "pgvector", status: "available" },
      { label: "migrations", status: "verified (5/5 applied)" }
    ];
    const memoryGovernanceReady = [
      { label: "Memory governance schema", status: "ready (7/7 tables present)" },
      { label: "MemoryRepository read path", status: "reachable" },
      { label: "Memory governance smoke", status: "available (pnpm db:smoke:memory-governance)" },
      {
        label: "Memory governance runtime proof",
        status: "ready (candidates 1, records 1, applications 1, anti-memory 1)"
      },
      { label: "Runtime markdown memory", status: "absent" },
      { label: "Automatic memory mutation", status: "absent" }
    ];

    expect(
      deriveMemoryGovernanceReadiness(postgresReady, memoryGovernanceReady)
    ).toEqual({
      label: "Memory governance readiness",
      status: "ready (schema present; repository reachable; runtime proof present)"
    });

    expect(
      deriveMemoryGovernanceReadiness(postgresReady, [
        ...memoryGovernanceReady.slice(0, 3),
        {
          label: "Memory governance runtime proof",
          status: "unverified (run pnpm db:smoke:memory-governance)"
        },
        ...memoryGovernanceReady.slice(4)
      ])
    ).toEqual({
      label: "Memory governance readiness",
      status: "runtime unverified (run pnpm db:smoke:memory-governance)"
    });

    expect(
      deriveMemoryGovernanceReadiness(postgresReady, [
        ...memoryGovernanceReady.slice(0, 4),
        { label: "Runtime markdown memory", status: "present" },
        { label: "Automatic memory mutation", status: "absent" }
      ])
    ).toEqual({
      label: "Memory governance readiness",
      status: "blocked (forbidden memory runtime present)"
    });
  });

  it("distinguishes doctor retrieval substrate readiness blockers", () => {
    const postgresReady = [
      { label: "Postgres config", status: "configured and reachable" },
      { label: "pgvector", status: "available" },
      { label: "migrations", status: "verified (6/6 applied)" }
    ];
    const retrievalReady = [
      { label: "Retrieval substrate schema", status: "ready (8/8 tables present)" },
      { label: "RetrievalRepository read path", status: "reachable" },
      {
        label: "Retrieval substrate smoke",
        status: "available (pnpm db:smoke:retrieval-substrate)"
      },
      {
        label: "Retrieval substrate runtime proof",
        status: "ready (search documents 4, candidates 2, activation decisions 2, exclusions 1)"
      },
      { label: "Separate vector/search DB", status: "absent" },
      { label: "Naive RAG dump command", status: "absent" }
    ];

    expect(
      deriveRetrievalSubstrateReadiness(postgresReady, retrievalReady)
    ).toEqual({
      label: "Retrieval substrate readiness",
      status: "ready (schema present; repository reachable; runtime proof present)"
    });

    expect(
      deriveRetrievalSubstrateReadiness(postgresReady, [
        ...retrievalReady.slice(0, 3),
        {
          label: "Retrieval substrate runtime proof",
          status: "unverified (run pnpm db:smoke:retrieval-substrate)"
        },
        ...retrievalReady.slice(4)
      ])
    ).toEqual({
      label: "Retrieval substrate readiness",
      status: "runtime unverified (run pnpm db:smoke:retrieval-substrate)"
    });

    expect(
      deriveRetrievalSubstrateReadiness(postgresReady, [
        ...retrievalReady.slice(0, 4),
        { label: "Separate vector/search DB", status: "present" },
        { label: "Naive RAG dump command", status: "absent" }
      ])
    ).toEqual({
      label: "Retrieval substrate readiness",
      status: "blocked (forbidden retrieval infrastructure present)"
    });
  });

  it("distinguishes doctor activation readiness blockers", () => {
    const postgresReady = [
      { label: "Postgres config", status: "configured and reachable" },
      { label: "pgvector", status: "available" },
      { label: "migrations", status: "verified (3/3 applied)" }
    ];
    const activationReady = [
      { label: "Activation domain contracts", status: "present" },
      { label: "Activation engine surface", status: "present" },
      { label: "Activation smoke", status: "available (pnpm db:smoke:activation)" },
      {
        label: "Activation smoke runtime proof",
        status: "ready (decisions 6, inclusions 2, exclusions 4)"
      },
      { label: "Broad context dump", status: "absent" },
      { label: "Core requiredSkills field", status: "absent" }
    ];

    expect(
      deriveActivationReadiness(
        postgresReady,
        { label: "Source graph readiness", status: "ready (schema present)" },
        { label: "Memory governance readiness", status: "ready (schema present)" },
        { label: "Retrieval substrate readiness", status: "ready (schema present)" },
        activationReady
      )
    ).toEqual({
      label: "Activation readiness",
      status: "ready (domain contracts, dependencies, and runtime proof present)"
    });

    expect(
      deriveActivationReadiness(
        postgresReady,
        { label: "Source graph readiness", status: "ready (schema present)" },
        { label: "Memory governance readiness", status: "ready (schema present)" },
        { label: "Retrieval substrate readiness", status: "ready (schema present)" },
        [
          ...activationReady.slice(0, 3),
          {
            label: "Activation smoke runtime proof",
            status: "unverified (run pnpm db:smoke:activation)"
          },
          ...activationReady.slice(4)
        ]
      )
    ).toEqual({
      label: "Activation readiness",
      status: "runtime unverified (run pnpm db:smoke:activation)"
    });
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
      { label: "Hook expectation projection", status: "present" },
      { label: "Codex execution runner", status: "absent" },
      { label: "KRN MCP server", status: "absent" }
    ];

    expect(
      deriveCodexAdapterReadiness(postgresReady, codexAdapterReady)
    ).toEqual({
      label: "Codex adapter readiness",
      status: "ready (renderer, hook projection, smoke command, and forbidden surfaces checked)"
    });

    expect(
      deriveCodexAdapterReadiness(postgresReady, [
        ...codexAdapterReady.slice(0, 3),
        { label: "Codex execution runner", status: "present" },
        { label: "KRN MCP server", status: "absent" }
      ])
    ).toEqual({
      label: "Codex adapter readiness",
      status: "blocked (forbidden Codex execution or MCP server present)"
    });
  });

  it("distinguishes doctor worker job readiness blockers", () => {
    const postgresReady = [
      { label: "Postgres config", status: "configured and reachable" },
      { label: "pgvector", status: "available" },
      { label: "migrations", status: "verified (7/7 applied)" }
    ];
    const workerJobReady = [
      { label: "Worker job schema", status: "present" },
      { label: "Worker job repository", status: "present" },
      { label: "Worker job smoke", status: "available (pnpm db:smoke:worker-jobs)" },
      { label: "Redis/Kafka queue", status: "absent" },
      { label: "Broad worker daemon", status: "absent" }
    ];

    expect(
      deriveWorkerJobReadiness(postgresReady, workerJobReady)
    ).toEqual({
      label: "Worker job readiness",
      status: "ready (schema, repository, smoke command, and forbidden runtime checks present)"
    });

    expect(
      deriveWorkerJobReadiness(postgresReady, [
        ...workerJobReady.slice(0, 3),
        { label: "Redis/Kafka queue", status: "present" },
        { label: "Broad worker daemon", status: "absent" }
      ])
    ).toEqual({
      label: "Worker job readiness",
      status: "blocked (forbidden worker runtime present)"
    });
  });

  it("distinguishes doctor target repo readiness states", () => {
    const postgresReady = [
      { label: "Postgres config", status: "configured and reachable" },
      { label: "pgvector", status: "available" },
      { label: "migrations", status: "verified (8/8 applied)" }
    ];
    const targetRepoReady = [
      {
        label: "Target repo init command",
        status: "available (krn init --connect --repo <path> --persist)"
      },
      {
        label: "Target repo fixture smoke",
        status: "available (tests/fixtures/target-repos/typescript-basic)"
      },
      {
        label: "Project registration schema",
        status: "present (Project, RepoInstallation, ProjectKernel)"
      },
      { label: "Init-connect smoke", status: "proven (pnpm db:smoke:init-connect)" },
      {
        label: "Target repo harness smoke",
        status: "proven (pnpm db:smoke:target-repo-harness)"
      },
      { label: "Cross-project leakage proof", status: "known" },
      { label: "Target repo forbidden surfaces", status: "absent" }
    ];

    expect(
      deriveTargetRepoReadiness(postgresReady, targetRepoReady)
    ).toEqual({
      label: "Target repo readiness",
      status: "ready (init-connect smoke proven; target repo harness smoke proven)"
    });

    expect(
      deriveTargetRepoReadiness(postgresReady, [
        ...targetRepoReady.slice(0, 3),
        { label: "Init-connect smoke", status: "unverified (pnpm db:smoke:init-connect missing)" },
        ...targetRepoReady.slice(4)
      ])
    ).toEqual({
      label: "Target repo readiness",
      status: "unverified (init-connect smoke missing)"
    });

    expect(
      deriveTargetRepoReadiness(postgresReady, [
        ...targetRepoReady.slice(0, 4),
        {
          label: "Target repo harness smoke",
          status: "unverified (pnpm db:smoke:target-repo-harness missing)"
        },
        ...targetRepoReady.slice(5)
      ])
    ).toEqual({
      label: "Target repo readiness",
      status: "partially ready (init-connect smoke proven; target repo harness smoke missing)"
    });

    expect(
      deriveTargetRepoReadiness(postgresReady, [
        ...targetRepoReady.slice(0, 6),
        { label: "Target repo forbidden surfaces", status: "present" }
      ])
    ).toEqual({
      label: "Target repo readiness",
      status: "blocked (forbidden target repo surface present)"
    });
  });

  it("reports DB readiness missing configuration", async () => {
    const result = await runCli(["db", "readiness"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN DB Readiness");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Brain store readiness: blocked (database not configured)");
  });

  it("reports DB smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN DB Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Persistence smoke: skipped (database not configured)");
  });

  it("reports harness plan smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "harness-plan"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Harness Plan Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Harness plan smoke: skipped (database not configured)");
  });

  it("reports harness evidence smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "harness-evidence"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Harness Evidence Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Harness evidence smoke: skipped (database not configured)");
  });

  it("reports source graph smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "source-graph"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Source Graph Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Source graph smoke: skipped (database not configured)");
  });

  it("reports memory governance smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "memory-governance"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Memory Governance Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain(
      "Memory governance smoke: skipped (database not configured)"
    );
  });

  it("reports retrieval substrate smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "retrieval-substrate"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Retrieval Substrate Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain(
      "Retrieval substrate smoke: skipped (database not configured)"
    );
  });

  it("reports activation smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "activation"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Activation Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Activation smoke: skipped (database not configured)");
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

  it("reports worker job smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "worker-jobs"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Worker Job Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Worker job smoke: skipped (database not configured)");
  });

  it("previews memory candidate add without DB writes", async () => {
    const result = await runCli(
      [
        "memory",
        "candidate",
        "add",
        "--run-id",
        "execution-run-1",
        "--kind",
        "architecture-boundary",
        "--content",
        "Source graph should use Postgres edge tables first",
        "--source-claim-id",
        "source-claim-1",
        "--confidence",
        "medium",
        "--application-guidance",
        "Use when deciding whether to add a separate graph DB",
        "--invalidation-rule",
        "Revisit when graph traversal exceeds Postgres edge-table performance"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Memory Candidate Add");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("kind: constraint");
    expect(result.stdout).toContain("inputKind: architecture-boundary");
    expect(result.stdout).toContain("confidence: 70");
    expect(result.stdout).toContain("sourceClaimId: source-claim-1");
  });

  it("requires database config for memory candidate add --persist", async () => {
    const result = await runCli(
      [
        "memory",
        "candidate",
        "add",
        "--run-id",
        "execution-run-1",
        "--kind",
        "constraint",
        "--content",
        "Source graph should use Postgres edge tables first",
        "--source-claim-id",
        "source-claim-1",
        "--confidence",
        "medium",
        "--application-guidance",
        "Use when deciding whether to add a separate graph DB",
        "--invalidation-rule",
        "Revisit when graph traversal exceeds Postgres edge-table performance",
        "--persist"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "KRN_DATABASE_URL is required for krn memory candidate add --persist"
    );
  });

  it("persists memory candidate add and prints persisted ID", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedCandidate: CreateMemoryCandidateInput | undefined;
    const result = await runCli(
      [
        "memory",
        "candidate",
        "add",
        "--run-id",
        "execution-run-1",
        "--kind",
        "architecture-boundary",
        "--content",
        "Source graph should use Postgres edge tables first",
        "--source-claim-id",
        "source-claim-1",
        "--confidence",
        "medium",
        "--application-guidance",
        "Use when deciding whether to add a separate graph DB",
        "--candidate-evidence-provenance",
        "operator_reported",
        "--candidate-evidence-ref",
        "raw-evidence:run-event-1",
        "--candidate-evidence-does-not-prove",
        "This does not prove the candidate is approved Memory Core truth.",
        "--invalidation-rule",
        "Revisit when graph traversal exceeds Postgres edge-table performance",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimById(id) {
              return {
                id,
                sourceArtifactId: "source-artifact-1",
                claim: "Source graph should use Postgres edge tables first",
                mechanism: "Postgres stores harness state transactionally",
                krnImplication: "KRN can link memory to source claims",
                doesNotProve: "This does not prove graph retrieval quality",
                trustTier: "project-decision",
                supportType: "implementation-boundary",
                consumer: "M23",
                status: "proposed",
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called");
            },
            async createSourceRejection() {
              throw new Error("createSourceRejection should not be called");
            }
          },
          memoryRepository: {
            async createMemoryCandidate(input) {
              capturedCandidate = input;

              return {
                id: "memory-candidate-1",
                projectId: input.projectId,
                executionRunId: input.executionRunId,
                proposedBy: input.proposedBy,
                kind: input.kind,
                status: input.status ?? "proposed",
                summary: input.summary,
                body: input.body,
                owner: input.owner,
                confidence: input.confidence,
                applicationGuidance: input.applicationGuidance,
                invalidationRule: input.invalidationRule,
                sourceClaimIds: input.sourceClaimIds ?? [],
                sourceLineage: input.sourceLineage,
                isUserPreference: input.isUserPreference,
                validFrom: now,
                metadata: input.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("memoryCandidate: memory-candidate-1");
    expect(result.stdout).toContain("candidateEvidenceProvenance: operator_reported");
    expect(result.stdout).toContain("candidateEvidenceRefs: raw-evidence:run-event-1");
    expect(capturedCandidate).toMatchObject({
      projectId: "project-1",
      executionRunId: "execution-run-1",
      proposedBy: "cli",
      kind: "constraint",
      confidence: 70,
      sourceClaimIds: ["source-claim-1"],
      metadata: {
        reflectionCandidateEvidence: {
          provenance: "operator_reported",
          evidenceRefs: ["raw-evidence:run-event-1"],
          doesNotProve: "This does not prove the candidate is approved Memory Core truth."
        }
      }
    });
  });

  it("previews memory candidate promote without DB writes", async () => {
    const result = await runCli(
      [
        "memory",
        "candidate",
        "promote",
        "--candidate-id",
        "memory-candidate-1",
        "--reviewer",
        "operator",
        "--decision",
        "accepted"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Memory Candidate Promote");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("candidateId: memory-candidate-1");
    expect(result.stdout).toContain("reviewer: operator");
    expect(result.stdout).toContain("decision: accepted");
    expect(result.stdout).toContain("No MemoryRecord created");
    expect(result.stdout).toContain("No memory application recorded");
  });

  it("requires evidence review reference before memory candidate promote --persist", async () => {
    const result = await runCli(
      [
        "memory",
        "candidate",
        "promote",
        "--candidate-id",
        "memory-candidate-1",
        "--reviewer",
        "operator",
        "--decision",
        "accepted",
        "--persist"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("evidenceReviewedRef is required before promoting memory candidates");
    expect(result.stderr).toContain("No MemoryRecord created");
  });

  it("requires evidence review reference before opening DB runtime for memory candidate promote", async () => {
    let createRuntimeCalled = false;
    const result = await runCli(
      [
        "memory",
        "candidate",
        "promote",
        "--candidate-id",
        "memory-candidate-1",
        "--reviewer",
        "operator",
        "--decision",
        "accepted",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => {
          createRuntimeCalled = true;
          throw new Error("createDatabaseRuntime should not be called");
        }
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("evidenceReviewedRef is required before promoting memory candidates");
    expect(result.stderr).toContain("No MemoryRecord created");
    expect(createRuntimeCalled).toBe(false);
  });

  it("persists memory candidate promote through MemoryReviewGate", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedPromotion: PromoteMemoryCandidateInput | undefined;
    const result = await runCli(
      [
        "memory",
        "candidate",
        "promote",
        "--candidate-id",
        "memory-candidate-1",
        "--reviewer",
        "operator",
        "--decision",
        "accepted",
        "--evidence-reviewed-ref",
        "raw-evidence:run-event-1",
        "--metadata",
        "reviewNote=inspected raw run event",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimById(id) {
              return {
                id,
                sourceArtifactId: "source-artifact-1",
                claim: "KRN should model source graph with relational edges first",
                mechanism: "Postgres stores harness state transactionally",
                krnImplication: "KRN can link promoted memory to source claims",
                doesNotProve: "This does not prove graph retrieval quality",
                trustTier: "project-decision",
                supportType: "implementation-boundary",
                consumer: "MM-27",
                status: "accepted",
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called");
            },
            async createSourceRejection() {
              throw new Error("createSourceRejection should not be called");
            }
          },
          memoryRepository: {
            async createMemoryCandidate() {
              throw new Error("createMemoryCandidate should not be called");
            },
            async getMemoryCandidateById(id) {
              return {
                id,
                projectId: "project-1",
                executionRunId: "execution-run-1",
                proposedBy: "cli",
                kind: "constraint",
                status: "candidate",
                summary: "Source graph should use Postgres edge tables first",
                body: "Source graph should use Postgres edge tables first",
                owner: "operator",
                confidence: 70,
                applicationGuidance: "Use when deciding whether to add a separate graph DB",
                invalidationRule: "Revisit when graph traversal exceeds Postgres limits",
                sourceClaimIds: ["source-claim-1"],
                sourceLineage: [{ sourceId: "source-claim-1" }],
                isUserPreference: false,
                validFrom: now,
                metadata: {
                  reflectionCandidateEvidence: {
                    provenance: "operator_reported",
                    evidenceRefs: ["raw-evidence:run-event-1"],
                    doesNotProve: "This does not prove the candidate is approved Memory Core truth."
                  }
                },
                createdAt: now,
                updatedAt: now
              };
            },
            async promoteReviewedMemoryCandidate(input) {
              capturedPromotion = input;

              return {
                id: "memory-record-1",
                projectId: "project-1",
                currentVersionId: "memory-record-version-1",
                key: "memory:memory-candidate-1",
                kind: "constraint",
                status: "active",
                summary: "Source graph should use Postgres edge tables first",
                body: "Source graph should use Postgres edge tables first",
                owner: "operator",
                confidence: 70,
                applicationGuidance: "Use when deciding whether to add a separate graph DB",
                invalidationRule: "Revisit when graph traversal exceeds Postgres limits",
                sourceLineage: [{ sourceId: "source-claim-1" }],
                isUserPreference: false,
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async rejectMemoryCandidate() {
              throw new Error("rejectMemoryCandidate should not be called");
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Review gate: passed");
    expect(result.stdout).toContain("memoryRecord: memory-record-1");
    expect(result.stdout).toContain("evidenceReviewedRef: raw-evidence:run-event-1");
    expect(result.stdout).toContain("sourceClaimId: source-claim-1");
    expect(capturedPromotion).toMatchObject({
      candidateId: "memory-candidate-1",
      reviewer: "operator",
      decision: "accepted",
      metadata: {
        reviewNote: "inspected raw run event",
        reviewGate: {
          candidateEvidence: {
            provenance: "operator_reported",
            evidenceRefs: ["raw-evidence:run-event-1"],
            doesNotProve: "This does not prove the candidate is approved Memory Core truth."
          },
          evidenceReviewedRef: "raw-evidence:run-event-1",
          sourceClaimIds: ["source-claim-1"],
          reviewedSourceClaimIds: ["source-claim-1"]
        }
      }
    });
  });

  it("persists memory candidate reject and stores reason", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedRejection: RejectMemoryCandidateInput | undefined;
    const result = await runCli(
      [
        "memory",
        "candidate",
        "reject",
        "--candidate-id",
        "memory-candidate-1",
        "--reviewer",
        "operator",
        "--reason",
        "No source mechanism tied the claim to a KRN decision",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimById() {
              throw new Error("getSourceClaimById should not be called");
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called");
            },
            async createSourceRejection() {
              throw new Error("createSourceRejection should not be called");
            }
          },
          memoryRepository: {
            async createMemoryCandidate() {
              throw new Error("createMemoryCandidate should not be called");
            },
            async getMemoryCandidateById() {
              throw new Error("getMemoryCandidateById should not be called");
            },
            async promoteReviewedMemoryCandidate() {
              throw new Error("promoteReviewedMemoryCandidate should not be called");
            },
            async rejectMemoryCandidate(input) {
              capturedRejection = input;

              return {
                id: input.candidateId,
                projectId: "project-1",
                executionRunId: "execution-run-1",
                proposedBy: "cli",
                kind: "constraint",
                status: "rejected",
                summary: "Source graph should use Postgres edge tables first",
                body: "Source graph should use Postgres edge tables first",
                owner: "operator",
                confidence: 70,
                applicationGuidance: "Use when deciding whether to add a separate graph DB",
                invalidationRule: "Revisit when graph traversal exceeds Postgres limits",
                sourceClaimIds: ["source-claim-1"],
                sourceLineage: [{ sourceId: "source-claim-1" }],
                isUserPreference: false,
                reviewer: input.reviewer,
                reviewedAt: now,
                rejectionReason: input.reason,
                validFrom: now,
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("memoryCandidate: memory-candidate-1");
    expect(result.stdout).toContain("status: rejected");
    expect(result.stdout).toContain(
      "reason: No source mechanism tied the claim to a KRN decision"
    );
    expect(result.stdout).toContain("No MemoryRecord created");
    expect(capturedRejection).toMatchObject({
      candidateId: "memory-candidate-1",
      reviewer: "operator",
      reason: "No source mechanism tied the claim to a KRN decision"
    });
  });

  it("previews memory record apply without DB writes", async () => {
    const result = await runCli(
      [
        "memory",
        "record",
        "apply",
        "--run-id",
        "execution-run-1",
        "--memory-id",
        "memory-record-1",
        "--outcome",
        "helped",
        "--notes",
        "Guided M23 decision to avoid a separate graph DB"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Memory Record Apply");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("memoryRecordId: memory-record-1");
    expect(result.stdout).toContain("runId: execution-run-1");
    expect(result.stdout).toContain("outcome: helped");
    expect(result.stdout).toContain("Feedback event: none");
  });

  it("requires database config for memory record apply --persist", async () => {
    const result = await runCli(
      [
        "memory",
        "record",
        "apply",
        "--run-id",
        "execution-run-1",
        "--memory-id",
        "memory-record-1",
        "--outcome",
        "helped",
        "--notes",
        "Guided M23 decision to avoid a separate graph DB",
        "--persist"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "KRN_DATABASE_URL is required for krn memory record apply --persist"
    );
  });

  it("persists helped memory record apply without feedback event", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedApplication: RecordMemoryApplicationInput | undefined;
    const result = await runCli(
      [
        "memory",
        "record",
        "apply",
        "--run-id",
        "execution-run-1",
        "--memory-id",
        "memory-record-1",
        "--outcome",
        "helped",
        "--notes",
        "Guided M23 decision to avoid a separate graph DB",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimById() {
              throw new Error("getSourceClaimById should not be called");
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called");
            },
            async createSourceRejection() {
              throw new Error("createSourceRejection should not be called");
            }
          },
          memoryRepository: {
            ...unusedMemoryRepository,
            async getMemoryRecordById(id) {
              return {
                id,
                projectId: "project-1",
                currentVersionId: "memory-record-version-1",
                key: "memory:memory-candidate-1",
                kind: "constraint",
                status: "active",
                summary: "Use Postgres edge tables first",
                body: "Source graph should use Postgres edge tables first",
                owner: "operator",
                confidence: 70,
                applicationGuidance: "Use when deciding whether to add a separate graph DB",
                invalidationRule: "Revisit when graph traversal exceeds Postgres limits",
                sourceLineage: [{ sourceId: "source-claim-1" }],
                isUserPreference: false,
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async recordMemoryApplication(input) {
              capturedApplication = input;

              return {
                id: "memory-application-1",
                memoryRecordId: input.memoryRecordId,
                executionRunId: input.executionRunId,
                expectedUse: input.expectedUse,
                outcome: input.outcome,
                notes: input.notes,
                metadata: input.metadata ?? {},
                createdAt: now
              };
            },
            async createMemoryFeedbackEvent() {
              throw new Error("createMemoryFeedbackEvent should not be called");
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("memoryApplication: memory-application-1");
    expect(result.stdout).toContain("memoryRecord: memory-record-1");
    expect(result.stdout).toContain("outcome: helped");
    expect(result.stdout).toContain("Feedback event: none");
    expect(capturedApplication).toMatchObject({
      memoryRecordId: "memory-record-1",
      executionRunId: "execution-run-1",
      outcome: "helped",
      notes: "Guided M23 decision to avoid a separate graph DB"
    });
  });

  it("persists stale memory record apply and creates feedback event", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedFeedbackEvent: CreateMemoryFeedbackEventInput | undefined;
    const result = await runCli(
      [
        "memory",
        "record",
        "apply",
        "--run-id",
        "execution-run-1",
        "--memory-id",
        "memory-record-1",
        "--outcome",
        "stale",
        "--notes",
        "Graph traversal now exceeds Postgres edge-table performance",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimById() {
              throw new Error("getSourceClaimById should not be called");
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called");
            },
            async createSourceRejection() {
              throw new Error("createSourceRejection should not be called");
            }
          },
          memoryRepository: {
            ...unusedMemoryRepository,
            async getMemoryRecordById(id) {
              return {
                id,
                projectId: "project-1",
                currentVersionId: "memory-record-version-1",
                key: "memory:memory-candidate-1",
                kind: "constraint",
                status: "active",
                summary: "Use Postgres edge tables first",
                body: "Source graph should use Postgres edge tables first",
                owner: "operator",
                confidence: 70,
                applicationGuidance: "Use when deciding whether to add a separate graph DB",
                invalidationRule: "Revisit when graph traversal exceeds Postgres limits",
                sourceLineage: [{ sourceId: "source-claim-1" }],
                isUserPreference: false,
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async recordMemoryApplication(input) {
              return {
                id: "memory-application-1",
                memoryRecordId: input.memoryRecordId,
                executionRunId: input.executionRunId,
                expectedUse: input.expectedUse,
                outcome: input.outcome,
                notes: input.notes,
                metadata: input.metadata ?? {},
                createdAt: now
              };
            },
            async createMemoryFeedbackEvent(input) {
              capturedFeedbackEvent = input;

              return {
                id: "memory-feedback-event-1",
                memoryRecordId: input.memoryRecordId,
                executionRunId: input.executionRunId,
                eventType: input.eventType,
                direction: input.direction,
                note: input.note,
                reason: input.reason,
                evidenceRef: input.evidenceRef,
                metadata: input.metadata ?? {},
                createdAt: now
              };
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("memoryApplication: memory-application-1");
    expect(result.stdout).toContain("memoryFeedbackEvent: memory-feedback-event-1");
    expect(result.stdout).toContain("outcome: stale");
    expect(capturedFeedbackEvent).toMatchObject({
      memoryRecordId: "memory-record-1",
      executionRunId: "execution-run-1",
      eventType: "stale_detected",
      direction: "negative",
      reason: "Graph traversal now exceeds Postgres edge-table performance",
      evidenceRef: "memory-application:memory-application-1"
    });
  });

  it("previews anti-memory add without DB writes", async () => {
    const result = await runCli(
      [
        "memory",
        "anti",
        "add",
        "--run-id",
        "execution-run-1",
        "--rejected-claim",
        "Markdown files are KRN runtime memory",
        "--reason",
        "Files can be export/audit/seed/source bank, not Memory Core",
        "--invalidated-by-source-claim-id",
        "source-claim-1"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Memory Anti Add");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("rejectedClaim: Markdown files are KRN runtime memory");
    expect(result.stdout).toContain(
      "reason: Files can be export/audit/seed/source bank, not Memory Core"
    );
    expect(result.stdout).toContain("invalidatedBySourceClaimId: source-claim-1");
    expect(result.stdout).toContain("No MemoryRecord created");
  });

  it("requires reason for anti-memory add", async () => {
    const result = await runCli(
      [
        "memory",
        "anti",
        "add",
        "--run-id",
        "execution-run-1",
        "--rejected-claim",
        "Markdown files are KRN runtime memory",
        "--invalidated-by-source-claim-id",
        "source-claim-1"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("reason");
  });

  it("requires database config for anti-memory add --persist", async () => {
    const result = await runCli(
      [
        "memory",
        "anti",
        "add",
        "--run-id",
        "execution-run-1",
        "--rejected-claim",
        "Markdown files are KRN runtime memory",
        "--reason",
        "Files can be export/audit/seed/source bank, not Memory Core",
        "--invalidated-by-source-claim-id",
        "source-claim-1",
        "--persist"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "KRN_DATABASE_URL is required for krn memory anti add --persist"
    );
  });

  it("persists anti-memory add and validates invalidating source claim", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedAntiMemory: CreateAntiMemoryRecordInput | undefined;
    const result = await runCli(
      [
        "memory",
        "anti",
        "add",
        "--run-id",
        "execution-run-1",
        "--rejected-claim",
        "Markdown files are KRN runtime memory",
        "--reason",
        "Files can be export/audit/seed/source bank, not Memory Core",
        "--invalidated-by-source-claim-id",
        "source-claim-1",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimById(id) {
              return {
                id,
                sourceArtifactId: "source-artifact-1",
                claim: "Markdown files are audit artifacts, not runtime memory",
                mechanism: "KRN runtime memory is store-backed in Postgres",
                krnImplication: "Do not read markdown as Memory Core",
                doesNotProve: "No markdown can ever be source material",
                trustTier: "project-decision",
                supportType: "implementation-boundary",
                consumer: "M23",
                status: "accepted",
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called");
            },
            async createSourceRejection() {
              throw new Error("createSourceRejection should not be called");
            }
          },
          memoryRepository: {
            ...unusedMemoryRepository,
            async createAntiMemoryRecord(input) {
              capturedAntiMemory = input;

              return {
                id: "anti-memory-1",
                projectId: input.projectId,
                executionRunId: input.executionRunId,
                key: input.key,
                rejectedClaim: input.rejectedClaim,
                reason: input.reason,
                invalidatedBySourceClaimIds: input.invalidatedBySourceClaimIds ?? [],
                invalidatedBySourceClaimId: input.invalidatedBySourceClaimId,
                appliesTo: input.appliesTo,
                mayRevisitWhen: input.mayRevisitWhen,
                summary: input.summary,
                body: input.body,
                owner: input.owner,
                confidence: input.confidence,
                sourceLineage: input.sourceLineage,
                metadata: input.metadata ?? {},
                validFrom: now,
                createdAt: now,
                updatedAt: now
              };
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("antiMemory: anti-memory-1");
    expect(result.stdout).toContain("No MemoryRecord created");
    expect(capturedAntiMemory).toMatchObject({
      projectId: "project-1",
      executionRunId: "execution-run-1",
      rejectedClaim: "Markdown files are KRN runtime memory",
      reason: "Files can be export/audit/seed/source bank, not Memory Core",
      invalidatedBySourceClaimId: "source-claim-1",
      invalidatedBySourceClaimIds: ["source-claim-1"],
      sourceLineage: [{ sourceId: "source-claim-1" }],
      owner: "operator",
      confidence: 90
    });
  });

  it("prints source claim add help", async () => {
    const result = await runCli(["source", "claim", "add", "--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: krn source claim add");
    expect(result.stdout).toContain("--does-not-prove");
  });

  it("previews source claim add without DB writes", async () => {
    const result = await runCli(
      [
        "source",
        "claim",
        "add",
        "--title",
        "Postgres edge table decision",
        "--claim",
        "KRN should model source graph with relational edges first",
        "--mechanism",
        "Postgres already stores canonical harness state transactionally",
        "--does-not-prove",
        "This does not prove graph retrieval quality",
        "--falsifier",
        "Source graph smoke cannot link the claim to any decision support edge",
        "--support-type",
        "implementation-boundary",
        "--trust-tier",
        "project-decision",
        "--consumer",
        "M22 source graph persistence"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Source Claim Add");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("Source claim preview");
    expect(result.stdout).toContain("doesNotProve: This does not prove graph retrieval quality");
  });

  it("requires database config for source claim add --persist", async () => {
    const result = await runCli(
      [
        "source",
        "claim",
        "add",
        "--title",
        "Postgres edge table decision",
        "--claim",
        "KRN should model source graph with relational edges first",
        "--mechanism",
        "Postgres already stores canonical harness state transactionally",
        "--does-not-prove",
        "This does not prove graph retrieval quality",
        "--falsifier",
        "Source graph smoke cannot link the claim to any decision support edge",
        "--support-type",
        "implementation-boundary",
        "--trust-tier",
        "project-decision",
        "--consumer",
        "M22 source graph persistence",
        "--persist"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("KRN_DATABASE_URL is required for krn source claim add --persist");
  });

  it("persists source claim add and prints persisted IDs", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const result = await runCli(
      [
        "source",
        "claim",
        "add",
        "--run-id",
        "execution-run-1",
        "--title",
        "Postgres edge table decision",
        "--claim",
        "KRN should model source graph with relational edges first",
        "--mechanism",
        "Postgres already stores canonical harness state transactionally",
        "--does-not-prove",
        "This does not prove graph retrieval quality",
        "--falsifier",
        "Source graph smoke cannot link the claim to any decision support edge",
        "--support-type",
        "implementation-boundary",
        "--trust-tier",
        "project-decision",
        "--consumer",
        "M22 source graph persistence",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact(input) {
              return {
                id: "source-artifact-1",
                projectId: input.projectId,
                kind: input.kind,
                trustTier: input.trustTier,
                uri: input.uri,
                title: input.title,
                contentHash: input.contentHash,
                capturedAt: now,
                metadata: input.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async createSourceClaim(input) {
              return {
                id: "source-claim-1",
                sourceArtifactId: input.sourceArtifactId,
                ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
                claim: input.claim,
                mechanism: input.mechanism,
                krnImplication: input.krnImplication,
                doesNotProve: input.doesNotProve,
                trustTier: input.trustTier,
                supportType: input.supportType,
                consumer: input.consumer,
                status: input.status ?? "proposed",
                metadata: input.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          memoryRepository: unusedMemoryRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("Persisted IDs:");
    expect(result.stdout).toContain("sourceArtifact: source-artifact-1");
    expect(result.stdout).toContain("sourceClaim: source-claim-1");
    expect(result.stdout).toContain("runId: execution-run-1");
    expect(result.stdout).toContain("doesNotProve: This does not prove graph retrieval quality");
  });

  it("prints source decision link help", async () => {
    const result = await runCli(["source", "decision", "link", "--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: krn source decision link");
    expect(result.stdout).toContain("--source-claim-id");
  });

  it("previews source decision link without DB writes", async () => {
    const result = await runCli(
      [
        "source",
        "decision",
        "link",
        "--source-claim-id",
        "source-claim-1",
        "--target-type",
        "harness_run",
        "--target-id",
        "execution-run-1",
        "--support-type",
        "implementation-boundary",
        "--confidence",
        "medium",
        "--notes",
        "Used to justify M22 Postgres-backed source graph edge"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Source Decision Link");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("sourceClaimId: source-claim-1");
    expect(result.stdout).toContain("target: harness_run/execution-run-1");
  });

  it("requires database config for source decision link --persist", async () => {
    const result = await runCli(
      [
        "source",
        "decision",
        "link",
        "--source-claim-id",
        "source-claim-1",
        "--target-type",
        "harness_run",
        "--target-id",
        "execution-run-1",
        "--support-type",
        "implementation-boundary",
        "--confidence",
        "medium",
        "--notes",
        "Used to justify M22 Postgres-backed source graph edge",
        "--persist"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "KRN_DATABASE_URL is required for krn source decision link --persist"
    );
  });

  it("persists source decision link and prints edge details", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const result = await runCli(
      [
        "source",
        "decision",
        "link",
        "--source-claim-id",
        "source-claim-1",
        "--target-type",
        "harness_run",
        "--target-id",
        "execution-run-1",
        "--support-type",
        "implementation-boundary",
        "--confidence",
        "medium",
        "--notes",
        "Used to justify M22 Postgres-backed source graph edge",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimById(id) {
              return {
                id,
                sourceArtifactId: "source-artifact-1",
                claim: "KRN should model source graph with relational edges first",
                mechanism: "Postgres stores harness state transactionally",
                krnImplication: "KRN can link source decisions to runs",
                doesNotProve: "This does not prove retrieval quality",
                trustTier: "project-decision",
                supportType: "implementation-boundary",
                consumer: "M22",
                status: "proposed",
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async createSourceDecisionEdge(input) {
              return {
                id: "source-decision-edge-1",
                sourceClaimId: input.sourceClaimId,
                targetType: input.targetType,
                targetId: input.targetId,
                supportType: input.supportType,
                confidence: input.confidence,
                notes: input.notes,
                metadata: input.metadata ?? {},
                createdAt: now
              };
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          memoryRepository: unusedMemoryRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("sourceDecisionEdge: source-decision-edge-1");
    expect(result.stdout).toContain("sourceClaimId: source-claim-1");
    expect(result.stdout).toContain("target: harness_run/execution-run-1");
    expect(result.stdout).toContain("supportType: implementation-boundary");
    expect(result.stdout).toContain("confidence: medium");
  });

  it("rejects source decision link when the source claim is rejected", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const result = await runCli(
      [
        "source",
        "decision",
        "link",
        "--source-claim-id",
        "source-claim-1",
        "--target-type",
        "harness_run",
        "--target-id",
        "execution-run-1",
        "--support-type",
        "implementation-boundary",
        "--confidence",
        "medium",
        "--notes",
        "Rejected sources cannot support decisions",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimById(id) {
              return {
                id,
                sourceArtifactId: "source-artifact-1",
                claim: "Decorative source should not support a decision",
                mechanism: "No usable mechanism",
                krnImplication: "KRN must reject this source.",
                doesNotProve: "This does not prove source rejection is enforced.",
                trustTier: "project-decision",
                supportType: "rejection",
                consumer: "MM-35",
                status: "rejected",
                metadata: {},
                createdAt: now,
                updatedAt: now
              };
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called for rejected claim");
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          memoryRepository: unusedMemoryRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("SourceDecisionEdge cannot use rejected SourceClaim");
  });

  it("prints source claim reject help", async () => {
    const result = await runCli(["source", "claim", "reject", "--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: krn source claim reject");
    expect(result.stdout).toContain("--rejected-because");
  });

  it("previews source claim reject without DB writes", async () => {
    const result = await runCli(
      [
        "source",
        "claim",
        "reject",
        "--title",
        "Decorative source example",
        "--attempted-claim",
        "Interesting AI engineering link",
        "--rejected-because",
        "decorative",
        "--reason",
        "No mechanism, consumer, falsifier, or decision support"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Source Claim Reject");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("rejectedBecause: decorative");
    expect(result.stdout).toContain("No SourceClaim created");
  });

  it("requires database config for source claim reject --persist", async () => {
    const result = await runCli(
      [
        "source",
        "claim",
        "reject",
        "--title",
        "Decorative source example",
        "--attempted-claim",
        "Interesting AI engineering link",
        "--rejected-because",
        "decorative",
        "--reason",
        "No mechanism, consumer, falsifier, or decision support",
        "--persist"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("KRN_DATABASE_URL is required for krn source claim reject --persist");
  });

  it("persists source claim rejection without creating a SourceClaim", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const result = await runCli(
      [
        "source",
        "claim",
        "reject",
        "--run-id",
        "execution-run-1",
        "--title",
        "Decorative source example",
        "--attempted-claim",
        "Interesting AI engineering link",
        "--rejected-because",
        "decorative",
        "--reason",
        "No mechanism, consumer, falsifier, or decision support",
        "--persist"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: dependencies,
          sourceRepository: {
            async createSourceArtifact() {
              throw new Error("createSourceArtifact should not be called");
            },
            async createSourceClaim() {
              throw new Error("createSourceClaim should not be called");
            },
            async getSourceClaimById() {
              throw new Error("getSourceClaimById should not be called");
            },
            async createSourceDecisionEdge() {
              throw new Error("createSourceDecisionEdge should not be called");
            },
            async createSourceRejection(input) {
              return {
                id: "source-rejection-1",
                projectId: input.projectId,
                executionRunId: input.executionRunId,
                sourceArtifactId: input.sourceArtifactId,
                sourceClaimId: input.sourceClaimId,
                title: input.title,
                attemptedClaim: input.attemptedClaim,
                rejectedBecause: input.rejectedBecause,
                reason: input.reason,
                doesNotProve: input.doesNotProve,
                consumer: input.consumer,
                metadata: input.metadata ?? {},
                rejectedAt: now
              };
            }
          },
          harnessRunRepository: dependencies.harnessRunRepository,
          async close() {
            return undefined;
          }
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("sourceRejection: source-rejection-1");
    expect(result.stdout).toContain("rejectedBecause: decorative");
    expect(result.stdout).toContain("No SourceClaim created");
  });

  it("prints evidence capture without mutating memory", async () => {
    const result = await runCli(["evidence", "capture"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      readGitStatus: async () => " M packages/cli/src/runCli.ts\n?? notes.md\n"
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Evidence Capture");
    expect(result.stdout).toContain("Persistence: disabled");
    expect(result.stdout).toContain("packages/cli/src/runCli.ts");
    expect(result.stdout).toContain("notes.md");
    expect(result.stdout).toContain("pnpm typecheck: not_run | provenance=default_template");
    expect(result.stdout).toContain("pnpm test: not_run | provenance=default_template");
    expect(result.stdout).toContain("git diff --check: not_run | provenance=default_template");
    expect(result.stdout).toContain(
      "Command provenance is weak: default_template rows are not proof that commands ran."
    );
    expect(result.stdout).toContain("Command execution: none");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("Feedback candidates:");
    expect(result.stdout).toContain("memoryCandidates:");
    expect(result.stdout).toContain("memory-candidate-proposal-1");
    expect(result.stdout).toContain("status: proposed");
    expect(result.stdout).toContain("completeness: incomplete");
    expect(result.stdout).toContain("missing: applicationGuidance, sourceLineage, invalidationRule");
    expect(result.stdout).toContain("No MemoryCandidate row created");
    expect(result.stdout).toContain("sourceDecisionCandidates:\n- none");
  });

  it("surfaces proposal-only source decision candidates from source evidence", async () => {
    const result = await runCli(["evidence", "capture"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      readGitStatus: async () =>
        " M docs/runs/2026-06-21-source-graph-persistence/DECISIONS.md\n" +
        " M packages/cli/src/runSourceClaimAddCommand.ts\n"
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("sourceDecisionCandidates:");
    expect(result.stdout).toContain("source-decision-candidate-1");
    expect(result.stdout).toContain("status: defer");
    expect(result.stdout).toContain("consumer: krn evidence capture");
    expect(result.stdout).toContain("No SourceClaim created");
  });

  it("requires database config for evidence capture --persist", async () => {
    const result = await runCli(
      ["evidence", "capture", "--run-id", "execution-run-1", "--persist"],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => ""
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "KRN_DATABASE_URL is required for krn evidence capture --persist"
    );
  });

  it("requires run id for evidence capture --persist", async () => {
    const result = await runCli(
      ["evidence", "capture", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => ""
      }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("--run-id is required for krn evidence capture --persist");
  });

  it("persists evidence capture for a run id", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedCommands: CreateEvidenceBundleInput["commands"] | undefined;
    let capturedSourceDecisions: CreateFeedbackDeltaInput["sourceDecisions"] | undefined;
    let capturedMemoryCandidates: CreateFeedbackDeltaInput["memoryCandidates"] | undefined;
    const aggregate: HarnessRunAggregate = {
      operatorIntent: {
        id: "operator-intent-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        source: "cli",
        rawIntent: "persist harness run",
        metadata: {},
        createdAt: now
      },
      taskContract: {
        id: "task-contract-1",
        operatorIntentId: "operator-intent-1",
        projectId: "project-1",
        title: "persist harness run",
        objective: "persist harness run",
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
        summary: "persist harness run",
        metadata: {},
        createdAt: now,
        updatedAt: now
      },
      contextAssembly: {
        id: "context-assembly-1",
        harnessPlanId: "harness-plan-1",
        status: "assembled",
        inclusions: [],
        exclusions: [],
        metadata: {},
        createdAt: now
      },
      executionRun: {
        id: "execution-run-1",
        harnessPlanId: "harness-plan-1",
        adapter: "codex",
        status: "planned",
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
        type: "plan.persisted",
        severity: "info",
        message: "plan persisted",
        payload: {},
        occurredAt: now
      }]
    };
    const harnessRunRepository = {
      ...dependencies.harnessRunRepository,
      async createExecutionRun(_input: CreateExecutionRunInput) {
        return aggregate.executionRun;
      },
      async getHarnessRunByExecutionRunId() {
        return aggregate;
      },
      async createEvidenceBundle(input: CreateEvidenceBundleInput) {
        capturedCommands = input.commands;

        return {
          id: "evidence-bundle-1",
          executionRunId: input.executionRunId,
          status: input.status ?? "captured",
          changedFiles: input.changedFiles,
          commands: input.commands,
          diffRisk: input.diffRisk,
          reviewBurden: input.reviewBurden,
          rollbackPath: input.rollbackPath,
          metadata: input.metadata ?? {},
          createdAt: now,
          updatedAt: now
        };
      },
      async createReviewAssessment(input: CreateReviewAssessmentInput) {
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
        capturedMemoryCandidates = input.memoryCandidates;
        capturedSourceDecisions = input.sourceDecisions;

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
      ["evidence", "capture", "--run-id", "execution-run-1", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () =>
          " M docs/runs/2026-06-21-source-graph-persistence/DECISIONS.md\n",
        createDatabaseRuntime: async () => ({
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
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Persistence: enabled (Postgres, explicit --persist)");
    expect(result.stdout).toContain("Run ID: execution-run-1");
    expect(result.stdout).toContain("Persisted IDs:");
    expect(result.stdout).toContain("evidenceBundle: evidence-bundle-1");
    expect(result.stdout).toContain("reviewAssessment: review-assessment-1");
    expect(result.stdout).toContain("feedbackDelta: feedback-delta-1");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("memoryCandidates:");
    expect(result.stdout).toContain("memory-candidate-proposal-1");
    expect(result.stdout).toContain("No MemoryCandidate row created");
    expect(result.stdout).toContain("sourceDecisionCandidates:");
    expect(capturedMemoryCandidates).toHaveLength(1);
    expect(capturedMemoryCandidates?.[0]?.projectId).toBe("project-1");
    expect(capturedMemoryCandidates?.[0]?.executionRunId).toBe("execution-run-1");
    expect(capturedMemoryCandidates?.[0]?.status).toBe("proposed");
    expect(capturedMemoryCandidates?.[0]?.sourceLineage).toEqual([]);
    expect(capturedMemoryCandidates?.[0]?.invalidationRule).toBeUndefined();
    expect(capturedMemoryCandidates?.[0]?.applicationGuidance).toContain("Incomplete");
    expect(capturedMemoryCandidates?.[0]?.metadata).toMatchObject({
      completeness: "incomplete",
      persistence: "feedback-delta-proposal-only"
    });
    expect(capturedSourceDecisions).toHaveLength(1);
    expect(capturedSourceDecisions?.[0]?.status).toBe("defer");
    expect(capturedSourceDecisions?.[0]?.consumer).toBe("krn evidence capture");
    expect(capturedCommands).toEqual([
      {
        command: "pnpm typecheck",
        status: "not_run",
        provenance: "default_template",
        doesNotProve:
          "This command row does not prove the command executed; it is default template evidence only."
      },
      {
        command: "pnpm test",
        status: "not_run",
        provenance: "default_template",
        doesNotProve:
          "This command row does not prove the command executed; it is default template evidence only."
      },
      {
        command: "git diff --check",
        status: "not_run",
        provenance: "default_template",
        doesNotProve:
          "This command row does not prove the command executed; it is default template evidence only."
      }
    ]);
  });

  it("prints supplied evidence command outcomes instead of default skipped rows", async () => {
    const result = await runCli(
      [
        "evidence",
        "capture",
        "--command",
        "pnpm typecheck",
        "--status",
        "passed",
        "--exit-code",
        "0",
        "--output",
        ".local-lab/p7-self-hosting/02-typecheck.txt",
        "--command",
        "pnpm test",
        "--status",
        "failed",
        "--exit-code",
        "1",
        "--output",
        ".local-lab/p7-self-hosting/03-test.txt"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => ""
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(
      "pnpm typecheck: passed | provenance=captured_output_file | exitCode=0 | output=.local-lab/p7-self-hosting/02-typecheck.txt | doesNotProve=This command result does not prove memory quality, source truth, review correctness, or production readiness."
    );
    expect(result.stdout).toContain(
      "pnpm test: failed | provenance=captured_output_file | exitCode=1 | output=.local-lab/p7-self-hosting/03-test.txt | doesNotProve=This command result does not prove memory quality, source truth, review correctness, or production readiness."
    );
    expect(result.stdout).not.toContain("pnpm typecheck: skipped");
  });

  it("prints explicit verification evidence as operator-reported provenance", async () => {
    const result = await runCli(
      [
        "evidence",
        "capture",
        "--verification",
        "pnpm typecheck=passed",
        "--verification=pnpm test=passed"
      ],
      {
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => ""
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(
      "pnpm typecheck: passed | provenance=operator_reported | doesNotProve=This command result does not prove memory quality, source truth, review correctness, or production readiness."
    );
    expect(result.stdout).toContain(
      "pnpm test: passed | provenance=operator_reported | doesNotProve=This command result does not prove memory quality, source truth, review correctness, or production readiness."
    );
    expect(result.stdout).not.toContain(
      "Command provenance is weak: default_template rows are not proof that commands ran."
    );
  });

  it("persists supplied evidence command outcomes for a run id", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    let capturedCommands: CreateEvidenceBundleInput["commands"] | undefined;
    const aggregate: HarnessRunAggregate = {
      operatorIntent: {
        id: "operator-intent-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        source: "cli",
        rawIntent: "persist harness run",
        metadata: {},
        createdAt: now
      },
      taskContract: {
        id: "task-contract-1",
        operatorIntentId: "operator-intent-1",
        projectId: "project-1",
        title: "persist harness run",
        objective: "persist harness run",
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
        summary: "persist harness run",
        metadata: {},
        createdAt: now,
        updatedAt: now
      },
      contextAssembly: {
        id: "context-assembly-1",
        harnessPlanId: "harness-plan-1",
        status: "assembled",
        inclusions: [],
        exclusions: [],
        metadata: {},
        createdAt: now
      },
      executionRun: {
        id: "execution-run-1",
        harnessPlanId: "harness-plan-1",
        adapter: "codex",
        status: "planned",
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
        type: "plan.persisted",
        severity: "info",
        message: "plan persisted",
        payload: {},
        occurredAt: now
      }]
    };
    const harnessRunRepository = {
      ...dependencies.harnessRunRepository,
      async getHarnessRunByExecutionRunId() {
        return aggregate;
      },
      async createEvidenceBundle(input: CreateEvidenceBundleInput) {
        capturedCommands = input.commands;

        return {
          id: "evidence-bundle-1",
          executionRunId: input.executionRunId,
          status: input.status ?? "captured",
          changedFiles: input.changedFiles,
          commands: input.commands,
          diffRisk: input.diffRisk,
          reviewBurden: input.reviewBurden,
          rollbackPath: input.rollbackPath,
          metadata: input.metadata ?? {},
          createdAt: now,
          updatedAt: now
        };
      },
      async createReviewAssessment(input: CreateReviewAssessmentInput) {
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
        "evidence",
        "capture",
        "--run-id",
        "execution-run-1",
        "--persist",
        "--command",
        "pnpm typecheck",
        "--status",
        "passed",
        "--exit-code",
        "0",
        "--output",
        ".local-lab/p7-self-hosting/02-typecheck.txt",
        "--command",
        "pnpm test",
        "--status",
        "passed",
        "--exit-code",
        "0"
      ],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => "",
        createDatabaseRuntime: async () => ({
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
        })
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(capturedCommands).toEqual([
      {
        command: "pnpm typecheck",
        status: "passed",
        provenance: "captured_output_file",
        exitCode: 0,
        outputPath: ".local-lab/p7-self-hosting/02-typecheck.txt",
        outputRef: ".local-lab/p7-self-hosting/02-typecheck.txt",
        doesNotProve:
          "This command result does not prove memory quality, source truth, review correctness, or production readiness."
      },
      {
        command: "pnpm test",
        status: "passed",
        provenance: "operator_reported",
        exitCode: 0,
        doesNotProve:
          "This command result does not prove memory quality, source truth, review correctness, or production readiness."
      }
    ]);
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

  it("prints clean evidence capture when there are no changed files", async () => {
    const result = await runCli(["evidence", "capture"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      readGitStatus: async () => ""
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Changed files:\n- none");
    expect(result.stdout).toContain("Diff risk: low");
    expect(result.stdout).toContain("pnpm typecheck: not_run | provenance=default_template");
    expect(result.stdout).toContain(
      "Command provenance is weak: default_template rows are not proof that commands ran."
    );
    expect(result.stdout).toContain("memoryCandidates:\n- none");
    expect(result.stdout).toContain("No changed files; no feedback candidate proposed.");
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
});
