import { describe, expect, it } from "vitest";

import {
  runCli
} from "./runCli.js";
import {
  createNoStoreCompilerDependencies
} from "./noStoreRepositories.js";
import type {
  CreateEvidenceBundleInput,
  CreateExecutionRunInput,
  CreateFeedbackDeltaInput,
  CreateReviewAssessmentInput,
  HarnessRunAggregate
} from "@krn/harness";
import type {
  DatabaseRuntimeInput
} from "./databaseRuntime.js";
import {
  deriveBrainStoreReadiness,
  deriveHarnessPersistenceReadiness
} from "./runDoctorCommand.js";

const now = "2026-06-21T12:00:00.000Z";

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

  it("returns exit 2 for invalid plan args", async () => {
    const result = await runCli(["plan"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Usage: krn plan --task");
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
    expect(result.stdout).toContain("pnpm typecheck: skipped");
    expect(result.stdout).toContain("pnpm test: skipped");
    expect(result.stdout).toContain("git diff --check: skipped");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("Feedback candidates:");
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
      ["evidence", "capture", "--run-id", "execution-run-1", "--persist"],
      {
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        readGitStatus: async () => " M packages/cli/src/runCli.ts\n",
        createDatabaseRuntime: async () => ({
          workspaceId: "workspace-1",
          projectId: "project-1",
          compilerDependencies: {
            ...dependencies,
            harnessRunRepository
          },
          harnessRunRepository,
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
    expect(result.stdout).toContain("No changed files; no feedback candidate proposed.");
  });
});
