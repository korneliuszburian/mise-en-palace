import { describe, expect, it } from "vitest";
import path from "node:path";

import {
  runCli
} from "../run-cli.js";
import {
  createNoStoreCompilerDependencies
} from "../no-store-repositories.js";
import type {
  AntiMemoryRecord,
  FeedbackDelta,
  MemoryRecord,
  SourceClaim
} from "@krn/core";
import type {
  CreateEvidenceBundleInput,
  CreateFeedbackDeltaInput,
  CreateExecutionRunInput,
  CreateReviewAssessmentInput,
  SearchDocumentSearchResult
} from "@krn/core/repositories/internal";
import type {
  DatabaseRuntimeInput
} from "../database-runtime.js";
import {
  now,
  runPersistedPlanWithCapturedMetadata,
  brainRecallMemoryRepository,
  unusedMemoryRepository
} from "./helpers/test-runtime.js";

const shouldNotBeCalled = (method: string): never => {
  throw new Error(`Plan test runtime method should not be called: ${method}`);
};

const knowledgeFeedbackDelta = (
  knowledgeId: string,
  outcome: "noise" | "stale" | "hurt" | "rejected"
): FeedbackDelta => ({
  id: "feedback-delta-1" as FeedbackDelta["id"],
  reviewAssessmentId: "review-assessment-1" as FeedbackDelta["reviewAssessmentId"],
  status: "accepted",
  memoryCandidates: [],
  sourceDecisions: [],
  evalCandidates: [],
  metadata: {
    knowledgeUsefulnessOutcomes: [{
      knowledgeId,
      outcome,
      reason: "The knowledge was selected for a previous plan and proved stale for this task class.",
      evidenceRefs: ["test:plan knowledge usefulness feedback"],
      doesNotProve: "One feedback delta does not prove broad knowledge ranking quality."
    }]
  },
  createdAt: now,
  updatedAt: now
});

describe("runCli", () => {
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
    expect(result.stdout).toContain("- searchMode: lexical");
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
      "Next action: export KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn; docker compose up -d krn-postgres; pnpm db:migrate; pnpm db:ready"
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
                lifecycleRevision: 1,
                ...(runInput.startedAt === undefined ? {} : { startedAt: runInput.startedAt }),
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            },
            async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<never> {
              return shouldNotBeCalled("createEvidenceBundle");
            },
            async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<never> {
              return shouldNotBeCalled("createReviewAssessment");
            },
            async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<never> {
              return shouldNotBeCalled("createFeedbackDelta");
            }
          };
          const sourceRepository = {
            ...dependencies.sourceRepository,
            async createSourceArtifact() {
              return shouldNotBeCalled("createSourceArtifact");
            },
            async createSourceClaim() {
              return shouldNotBeCalled("createSourceClaim");
            },
            async getSourceClaimById() {
              return shouldNotBeCalled("getSourceClaimById");
            },
            async createSourceClaimEdge() {
              return shouldNotBeCalled("createSourceClaimEdge");
            },
            async createSourceDecisionEdge() {
              return shouldNotBeCalled("createSourceDecisionEdge");
            },
            async getSourceDecisionEdgeById() {
              return shouldNotBeCalled("getSourceDecisionEdgeById");
            },
            async createSourceRejection() {
              return shouldNotBeCalled("createSourceRejection");
            }
          };
          return {
            workspaceId: "workspace-1",
            projectId: "project-1",
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository,
              memoryRepository: brainRecallMemoryRepository
            },
            harnessRunRepository,
            sourceRepository,
            memoryRepository: brainRecallMemoryRepository,
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

  it("persists selected knowledge IDs for plan --persist", async () => {
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
                lifecycleRevision: 1,
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            },
            async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<never> {
              return shouldNotBeCalled("createEvidenceBundle");
            },
            async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<never> {
              return shouldNotBeCalled("createReviewAssessment");
            },
            async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<never> {
              return shouldNotBeCalled("createFeedbackDelta");
            }
          };
          const sourceRepository = {
            ...dependencies.sourceRepository,
            async createSourceArtifact() {
              return shouldNotBeCalled("createSourceArtifact");
            },
            async createSourceClaim() {
              return shouldNotBeCalled("createSourceClaim");
            },
            async getSourceClaimById() {
              return shouldNotBeCalled("getSourceClaimById");
            },
            async createSourceClaimEdge() {
              return shouldNotBeCalled("createSourceClaimEdge");
            },
            async createSourceDecisionEdge() {
              return shouldNotBeCalled("createSourceDecisionEdge");
            },
            async getSourceDecisionEdgeById() {
              return shouldNotBeCalled("getSourceDecisionEdgeById");
            },
            async createSourceRejection() {
              return shouldNotBeCalled("createSourceRejection");
            }
          };
          return {
            workspaceId: "workspace-1",
            projectId: "project-1",
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository,
              memoryRepository: brainRecallMemoryRepository
            },
            harnessRunRepository,
            sourceRepository,
            memoryRepository: brainRecallMemoryRepository,
            async close() {
              return undefined;
            }
          };
        }
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Selected KRN context: selected");
    expect(result.stdout).toContain("Selected KRN context IDs: ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain(
      "Selected KRN context reason: Store-backed knowledge read model matched the pre-coding plan query."
    );
    expect(result.stdout).toContain("Selected KRN context targetFit: target_specific_selected_knowledge");
    expect(result.stdout).toContain("Selected KRN context recommended use: Use target-specific selectedKnowledge");
    expect(result.stdout).toContain(
      "- knowledge=ts-boundary-unknown-first-result-state | readModel=knowledge:ts-boundary-unknown-first-result-state"
    );
    expect(executionRunMetadata).toMatchObject({
      knowledgeSelection: {
        status: "selected",
        source: "memory_store",
        reason:
          "Store-backed knowledge read model matched the pre-coding plan query.",
        selectedKnowledgeIds: ["ts-boundary-unknown-first-result-state"]
      }
    });
  });

  it("applies store-backed usefulness feedback before selecting plan knowledge", async () => {
    const { result, executionRunMetadata } = await runPersistedPlanWithCapturedMetadata(
      "TypeScript",
      {
        feedbackDeltas: [
          knowledgeFeedbackDelta("knowledge:ts-boundary-knowledge-parser-exemplar", "stale")
        ]
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Selected KRN context: selected");
    expect(result.stdout).toContain("Selected KRN context IDs: ts-boundary-unknown-first-result-state");
    expect(result.stdout).not.toContain("Selected KRN context IDs: ts-boundary-knowledge-parser-exemplar");
    expect(executionRunMetadata).toMatchObject({
      knowledgeSelection: {
        status: "selected",
        selectedKnowledgeIds: ["ts-boundary-unknown-first-result-state"],
        proof: {
          proves: [
            "plan knowledge selection read active MemoryRecord rows from the resolved DB project",
            "plan knowledge selection applied store-backed usefulness feedback before selecting knowledge"
          ],
          doesNotProve: [
            "DB-backed knowledge selection proves source truth",
            "Codex used the selected memory",
            "store-backed usefulness feedback proves broad ranking quality"
          ]
        }
      }
    });
  });

  it("retries memory recall planning with compact mechanism terms", async () => {
    const { result, executionRunMetadata } = await runPersistedPlanWithCapturedMetadata(
      "Use the retained consensus relation maintenance review boundary in a bounded mini Brain-QA or consensus-lane readback; verify whether knowledge:consensus-relation-maintenance-review-boundary is selected or classify the miss; record whether it changes the next source-to-decision decision; no runtime schema dashboard API MCP worker daemon crawler graph ranking rewrite or Memory Core mutation work"
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Selected KRN context: selected");
    expect(result.stdout).toContain("Selected KRN context IDs: consensus-relation-maintenance-review-boundary");
    expect(executionRunMetadata).toMatchObject({
      knowledgeSelection: {
        status: "selected",
        selectedKnowledgeIds: ["consensus-relation-maintenance-review-boundary"]
      }
    });
  });

  it("retries memory recall planning with parser exemplar mechanism terms", async () => {
    const { result, executionRunMetadata } = await runPersistedPlanWithCapturedMetadata(
      "Improve knowledge plan query shaping so long TypeScript parser exemplar metadata-boundary tasks select knowledge:ts-boundary-knowledge-parser-exemplar without ranking, schema, or Memory Core changes"
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Selected KRN context: selected");
    expect(result.stdout).toContain("Selected KRN context query: typescript parser exemplar");
    expect(result.stdout).toContain("Selected KRN context IDs: ts-boundary-knowledge-parser-exemplar");
    expect(executionRunMetadata).toMatchObject({
      knowledgeSelection: {
        status: "selected",
        query: "typescript parser exemplar",
        selectedKnowledgeIds: ["ts-boundary-knowledge-parser-exemplar"]
      }
    });
  });

  it("selects reference implementation recipe knowledge for exemplar tasks", async () => {
    const { result, executionRunMetadata } = await runPersistedPlanWithCapturedMetadata(
      "Prove the retained reference-implementation recipe through one executable/readback brain surface so future KRN work can retrieve and apply a local code exemplar without building a clone runtime or more markdown instructions"
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Selected KRN context: selected");
    expect(result.stdout).toContain("Selected KRN context query: prove reference implementation recipe");
    expect(result.stdout).toContain("Selected KRN context IDs: reference-implementation-recipe-clone-boundary");
    expect(executionRunMetadata).toMatchObject({
      knowledgeSelection: {
        status: "selected",
        query: "prove reference implementation recipe",
        selectedKnowledgeIds: ["reference-implementation-recipe-clone-boundary"]
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
                lifecycleRevision: 1,
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            },
            async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<never> {
              return shouldNotBeCalled("createEvidenceBundle");
            },
            async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<never> {
              return shouldNotBeCalled("createReviewAssessment");
            },
            async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<never> {
              return shouldNotBeCalled("createFeedbackDelta");
            }
          };
          const sourceRepository = {
            ...dependencies.sourceRepository,
            async createSourceArtifact() {
              return shouldNotBeCalled("createSourceArtifact");
            },
            async createSourceClaim() {
              return shouldNotBeCalled("createSourceClaim");
            },
            async getSourceClaimById() {
              return shouldNotBeCalled("getSourceClaimById");
            },
            async createSourceClaimEdge() {
              return shouldNotBeCalled("createSourceClaimEdge");
            },
            async createSourceDecisionEdge() {
              return shouldNotBeCalled("createSourceDecisionEdge");
            },
            async getSourceDecisionEdgeById() {
              return shouldNotBeCalled("getSourceDecisionEdgeById");
            },
            async createSourceRejection() {
              return shouldNotBeCalled("createSourceRejection");
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
                      path: "packages/cli/src/run-plan-command.ts",
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
            sourceRepository,
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
    expect(result.stdout).toContain("Target owner files: packages/cli/src/run-plan-command.ts");
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
                lifecycleRevision: 1,
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            },
            async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<never> {
              return shouldNotBeCalled("createEvidenceBundle");
            },
            async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<never> {
              return shouldNotBeCalled("createReviewAssessment");
            },
            async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<never> {
              return shouldNotBeCalled("createFeedbackDelta");
            }
          };
          const sourceRepository = {
            ...dependencies.sourceRepository,
            async createSourceArtifact() {
              return shouldNotBeCalled("createSourceArtifact");
            },
            async createSourceClaim() {
              return shouldNotBeCalled("createSourceClaim");
            },
            async getSourceClaimById() {
              return shouldNotBeCalled("getSourceClaimById");
            },
            async createSourceClaimEdge() {
              return shouldNotBeCalled("createSourceClaimEdge");
            },
            async createSourceDecisionEdge() {
              return shouldNotBeCalled("createSourceDecisionEdge");
            },
            async getSourceDecisionEdgeById() {
              return shouldNotBeCalled("getSourceDecisionEdgeById");
            },
            async createSourceRejection() {
              return shouldNotBeCalled("createSourceRejection");
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
            sourceRepository,
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
                lifecycleRevision: 1,
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            },
            async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<never> {
              return shouldNotBeCalled("createEvidenceBundle");
            },
            async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<never> {
              return shouldNotBeCalled("createReviewAssessment");
            },
            async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<never> {
              return shouldNotBeCalled("createFeedbackDelta");
            }
          };
          const sourceRepository = {
            ...dependencies.sourceRepository,
            async createSourceArtifact() {
              return shouldNotBeCalled("createSourceArtifact");
            },
            async createSourceClaim() {
              return shouldNotBeCalled("createSourceClaim");
            },
            async getSourceClaimById() {
              return shouldNotBeCalled("getSourceClaimById");
            },
            async createSourceClaimEdge() {
              return shouldNotBeCalled("createSourceClaimEdge");
            },
            async createSourceDecisionEdge() {
              return shouldNotBeCalled("createSourceDecisionEdge");
            },
            async getSourceDecisionEdgeById() {
              return shouldNotBeCalled("getSourceDecisionEdgeById");
            },
            async createSourceRejection() {
              return shouldNotBeCalled("createSourceRejection");
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
            sourceRepository,
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
      sourceAuthority: "high",
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
      sourceAuthority: "project-decision",
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
                lifecycleRevision: 1,
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            },
            async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<never> {
              return shouldNotBeCalled("createEvidenceBundle");
            },
            async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<never> {
              return shouldNotBeCalled("createReviewAssessment");
            },
            async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<never> {
              return shouldNotBeCalled("createFeedbackDelta");
            }
          };
          const sourceRepository = {
            ...dependencies.sourceRepository,
            async createSourceArtifact() {
              return shouldNotBeCalled("createSourceArtifact");
            },
            async createSourceClaim() {
              return shouldNotBeCalled("createSourceClaim");
            },
            async getSourceClaimById() {
              return shouldNotBeCalled("getSourceClaimById");
            },
            async createSourceClaimEdge() {
              return shouldNotBeCalled("createSourceClaimEdge");
            },
            async createSourceDecisionEdge() {
              return shouldNotBeCalled("createSourceDecisionEdge");
            },
            async getSourceDecisionEdgeById() {
              return shouldNotBeCalled("getSourceDecisionEdgeById");
            },
            async createSourceRejection() {
              return shouldNotBeCalled("createSourceRejection");
            }
          };

          return {
            workspaceId: "workspace-1",
            projectId: "project-1",
            compilerDependencies: {
              ...dependencies,
              harnessRunRepository,
              memoryRepository: {
                async listActiveMemory(_projectId, _limit, options) {
                  expect(options?.terms).toContain("activation");
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
                },
                async listSourceDecisionEdgesForClaim() {
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
            sourceRepository,
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
      sourceLineage: [{ sourceId: "KRN_ROADMAP.md#P2-00" }],
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
      sourceLineage: [{ sourceId: "KRN_ROADMAP.md#P2-01" }],
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
                lifecycleRevision: 1,
                metadata: runInput.metadata ?? {},
                createdAt: now,
                updatedAt: now
              };
            },
            async getHarnessRunByExecutionRunId() {
              return undefined;
            },
            async createEvidenceBundle(_input: CreateEvidenceBundleInput): Promise<never> {
              return shouldNotBeCalled("createEvidenceBundle");
            },
            async createReviewAssessment(_input: CreateReviewAssessmentInput): Promise<never> {
              return shouldNotBeCalled("createReviewAssessment");
            },
            async createFeedbackDelta(_input: CreateFeedbackDeltaInput): Promise<never> {
              return shouldNotBeCalled("createFeedbackDelta");
            }
          };
          const sourceRepository = {
            ...dependencies.sourceRepository,
            async createSourceArtifact() {
              return shouldNotBeCalled("createSourceArtifact");
            },
            async createSourceClaim() {
              return shouldNotBeCalled("createSourceClaim");
            },
            async getSourceClaimById() {
              return shouldNotBeCalled("getSourceClaimById");
            },
            async createSourceClaimEdge() {
              return shouldNotBeCalled("createSourceClaimEdge");
            },
            async createSourceDecisionEdge() {
              return shouldNotBeCalled("createSourceDecisionEdge");
            },
            async getSourceDecisionEdgeById() {
              return shouldNotBeCalled("getSourceDecisionEdgeById");
            },
            async createSourceRejection() {
              return shouldNotBeCalled("createSourceRejection");
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
                },
                async listSourceDecisionEdgesForClaim() {
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
            sourceRepository,
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
});
