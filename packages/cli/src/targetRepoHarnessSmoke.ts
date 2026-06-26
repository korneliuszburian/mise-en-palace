import postgres from "postgres";
import type {
  Sql
} from "postgres";
import {
  createExecutionBrief,
  renderExecutionBriefText
} from "@krn/codex-adapter";
import {
  createKrnDatabase
} from "@krn/db";
import {
  DrizzleHarnessRunRepository,
  DrizzleMemoryRepository,
  DrizzleProjectRepository,
  DrizzleRetrievalRepository,
  DrizzleSourceRepository
} from "@krn/db/adapters";
import {
  runMigrationReadinessCheck
} from "@krn/db/dev";
import {
  compileHarnessPlan,
  createCapabilityPlan
} from "@krn/harness";

export interface TargetRepoHarnessSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
  targetRepoPath: string;
}

export interface TargetRepoHarnessSmokeReport {
  workspaceSlug: string;
  projectId: string;
  repoInstallationId: string;
  projectKernelId: string;
  sourceSeedPaths: readonly string[];
  ownerFilePaths: readonly string[];
  trustExclusionPatterns: readonly string[];
  executionRunId: string;
  readBackExecutionRunId: string;
  codexBriefRendered: boolean;
  evidenceBundleId: string;
  reviewAssessmentId: string;
  feedbackDeltaId: string;
  targetProjectLinked: boolean;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

interface CountRow {
  count: number;
}

const targetFixtureSourceSeeds = [
  {
    path: "AGENTS.md",
    kind: "agent_guidance",
    reason: "target-local agent instructions and trust boundary"
  },
  {
    path: "README.md",
    kind: "repo_overview",
    reason: "target fixture purpose and setup overview"
  },
  {
    path: "docs",
    kind: "target_runbook",
    reason: "target operator runbook and planning guidance"
  },
  {
    path: "src",
    kind: "source_root",
    reason: "implementation owner-file root"
  },
  {
    path: "tests",
    kind: "test_root",
    reason: "behavior proof and test owner-file root"
  }
] as const;

const targetFixtureTrustExclusions = [
  {
    pathPattern: ".env*",
    reason: "secret-shaped environment files must not enter planning context"
  },
  {
    pathPattern: ".git/",
    reason: "repository internals are not planning source truth"
  },
  {
    pathPattern: "node_modules/",
    reason: "third-party install output is not target source truth"
  },
  {
    pathPattern: ".muke/",
    reason: "generated target state is not source truth by default"
  },
  {
    pathPattern: ".supersearch/runtime/",
    reason: "runtime search output is generated state"
  },
  {
    pathPattern: "dist/",
    reason: "build output is generated state"
  },
  {
    pathPattern: "build/",
    reason: "build output is generated state"
  }
] as const;

const targetFixtureOwnerFiles = [
  {
    path: "AGENTS.md",
    root: ".",
    kind: "agent_guidance",
    reason: "target-local agent instructions owner file"
  },
  {
    path: "docs/target-runbook.md",
    root: "docs",
    kind: "target_runbook",
    reason: "target planning runbook owner file"
  },
  {
    path: "src/index.ts",
    root: "src",
    kind: "implementation_entry",
    reason: "implementation readiness owner file"
  },
  {
    path: "tests/readiness.test.ts",
    root: "tests",
    kind: "behavior_test",
    reason: "test readiness owner file"
  }
] as const;

const normalizeSlugPart = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalized.length === 0 ? "local" : normalized;
};

const countQuery = async (rowsPromise: Promise<CountRow[]>): Promise<number> => {
  const rows = await rowsPromise;

  return rows[0]?.count ?? 0;
};

const countMarkerRows = async (
  client: Sql,
  marker: string,
  retrievalRunId: string | undefined
): Promise<number> => {
  let count = 0;

  count += await countQuery(
    client<CountRow[]>`select count(*)::int as count from workspaces where metadata->>'fixtureMarker' = ${marker}`
  );
  count += await countQuery(
    client<CountRow[]>`select count(*)::int as count from projects where metadata->>'fixtureMarker' = ${marker}`
  );
  count += await countQuery(
    client<CountRow[]>`select count(*)::int as count from repo_installations where metadata->>'fixtureMarker' = ${marker}`
  );
  count += await countQuery(
    client<CountRow[]>`select count(*)::int as count from project_kernels where metadata->>'fixtureMarker' = ${marker}`
  );
  count += await countQuery(
    client<CountRow[]>`select count(*)::int as count from run_events where payload->>'smokeId' = ${marker}`
  );

  if (retrievalRunId !== undefined) {
    count += await countQuery(
      client<CountRow[]>`select count(*)::int as count from retrieval_runs where id = ${retrievalRunId}`
    );
  }

  return count;
};

const cleanupMarkerRows = async (
  client: Sql,
  marker: string,
  retrievalRunId: string | undefined
): Promise<number> => {
  await client`delete from run_events where payload->>'smokeId' = ${marker}`;

  if (retrievalRunId !== undefined) {
    await client`delete from retrieval_runs where id = ${retrievalRunId}`;
  }

  await client`delete from workspaces where metadata->>'fixtureMarker' = ${marker}`;

  return countMarkerRows(client, marker, retrievalRunId);
};

const reportLines = (report: TargetRepoHarnessSmokeReport): string[] => [
  `Workspace smoke row: ${report.workspaceSlug}`,
  `Project: ${report.projectId}`,
  `Repo installation: ${report.repoInstallationId}`,
  `ProjectKernel: ${report.projectKernelId}`,
  `Target source seeds: ${report.sourceSeedPaths.join(", ")}`,
  `Target owner files: ${report.ownerFilePaths.join(", ")}`,
  `Target trust exclusions: ${report.trustExclusionPatterns.join(", ")}`,
  `Execution run: ${report.executionRunId}`,
  `Readback: ${
    report.readBackExecutionRunId === report.executionRunId ? "matched" : "mismatch"
  }`,
  `Codex brief rendered: ${report.codexBriefRendered ? "yes" : "no"}`,
  `Evidence bundle: ${report.evidenceBundleId}`,
  `Review assessment: ${report.reviewAssessmentId}`,
  `Feedback delta: ${report.feedbackDeltaId}`,
  `Target project linked: ${report.targetProjectLinked ? "yes" : "no"}`,
  `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
  `Cleanup: ${report.cleanedUp ? "completed" : "not completed"}`,
  `Target repo harness smoke: ${report.cleanedUp ? "passed" : "failed"}`
];

export const formatTargetRepoHarnessSmokeReport = (
  report: TargetRepoHarnessSmokeReport
): string =>
  [
    "KRN Target Repo Harness Smoke",
    ...reportLines(report)
  ].join("\n") + "\n";

export const formatTargetRepoHarnessSmokeReportLines = reportLines;

export const runTargetRepoHarnessSmokeCheck = async (
  input: TargetRepoHarnessSmokeInput
): Promise<TargetRepoHarnessSmokeReport> => {
  const readiness = await runMigrationReadinessCheck({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder
  });

  if (!readiness.migrationsVerified || !readiness.pgvectorAvailable) {
    throw new Error("Brain store is not ready for target repo harness smoke");
  }

  const marker = normalizeSlugPart(input.smokeId);
  const workspaceSlug = `krn-target-repo-harness-smoke-${marker}`;
  const projectSlug = `typescript-basic-${marker}`;
  const repoFingerprint = `target-repo-harness:${marker}`;
  const repoPath = `${input.targetRepoPath}#${marker}`;
  const now = "2026-06-22T07:00:00.000Z";
  const client = postgres(input.databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });
  const db = createKrnDatabase(client);
  let retrievalRunId: string | undefined;

  try {
    await cleanupMarkerRows(client, marker, retrievalRunId);

    const projectRepository = new DrizzleProjectRepository(db);
    const harnessRunRepository = new DrizzleHarnessRunRepository(db);
    const sourceRepository = new DrizzleSourceRepository(db);
    const memoryRepository = new DrizzleMemoryRepository(db);
    const retrievalRepository = new DrizzleRetrievalRepository(db);
    const workspace = await projectRepository.createWorkspace({
      slug: workspaceSlug,
      displayName: workspaceSlug,
      metadata: {
        smoke: true,
        fixtureMarker: marker
      }
    });
    const project = await projectRepository.createProject({
      workspaceId: workspace.id,
      slug: projectSlug,
      displayName: "krn-fixture-typescript-basic",
      metadata: {
        smoke: true,
        fixtureMarker: marker,
        repoFingerprint,
        repoPath,
        sourceSeeds: targetFixtureSourceSeeds,
        ownerFiles: targetFixtureOwnerFiles,
        trustExclusions: targetFixtureTrustExclusions
      }
    });
    const repoInstallation = await projectRepository.createRepoInstallation({
      projectId: project.id,
      provider: "local",
      repoUrl: `file://${repoPath}`,
      defaultBranch: "main",
      repoFingerprint,
      localPathHint: repoPath,
      metadata: {
        smoke: true,
        fixtureMarker: marker,
        sourceSeeds: targetFixtureSourceSeeds,
        ownerFiles: targetFixtureOwnerFiles,
        trustExclusions: targetFixtureTrustExclusions
      }
    });
    const projectKernel = await projectRepository.createProjectKernel({
      projectId: project.id,
      version: 1,
      summary: "Fixture target repo connected for full harness smoke",
      activeContextRule: "select project-scoped source, memory, retrieval, and anti-memory only",
      metadata: {
        smoke: true,
        fixtureMarker: marker,
        sourceSeeds: targetFixtureSourceSeeds,
        ownerFiles: targetFixtureOwnerFiles,
        trustExclusions: targetFixtureTrustExclusions
      }
    });
    let idCounter = 0;
    const result = await compileHarnessPlan(
      {
        workspaceId: workspace.id,
        projectId: project.id,
        operatorIntent: {
          rawIntent: "improve test script readiness",
          source: "cli",
          metadata: {
            smokeId: marker
          }
        },
        taskContract: {
          title: "improve test script readiness",
          objective: "improve test script readiness",
          constraints: [
            "use the target repo project scope",
            "do not mutate fixture files"
          ],
          nonGoals: [
            "do not invoke Codex",
            "do not create dashboard"
          ],
          acceptance: [
            "project-scoped plan persisted",
            "Codex brief rendered",
            "evidence captured",
            "cleanup count zero"
          ],
          metadata: {
            smokeId: marker
          }
        },
        tokenBudget: 420,
        metadata: {
          command: "db:smoke:target-repo-harness",
          smokeId: marker,
          projectKernelId: projectKernel.id,
          repoInstallationIds: [repoInstallation.id]
        }
      },
      {
        harnessRunRepository,
        memoryRepository,
        sourceRepository,
        retrievalRepository,
        now: () => now,
        createId: (prefix) => {
          idCounter += 1;
          return `${prefix}-${marker}-${idCounter}`;
        }
      }
    );
    const maybeRetrievalRunId = result.contextAssembly.metadata.retrievalRunId;
    retrievalRunId = typeof maybeRetrievalRunId === "string" ? maybeRetrievalRunId : undefined;

    if (retrievalRunId === undefined) {
      throw new Error("Target repo harness smoke did not create a retrieval run");
    }

    const executionRun = await harnessRunRepository.createExecutionRun({
      harnessPlanId: result.harnessPlan.id,
      adapter: "codex",
      status: "planned",
      initialEvent: {
        sequence: 1,
        type: "smoke.target_repo_harness.persisted",
        message: "Target repo harness smoke persisted run created",
        payload: {
          smokeId: marker,
          projectId: project.id,
          projectKernelId: projectKernel.id,
          repoInstallationId: repoInstallation.id,
          sourceSeeds: targetFixtureSourceSeeds,
          ownerFiles: targetFixtureOwnerFiles,
          trustExclusions: targetFixtureTrustExclusions
        }
      },
      metadata: {
        smokeId: marker,
        command: "db:smoke:target-repo-harness",
        projectKernelId: projectKernel.id,
        repoInstallationIds: [repoInstallation.id],
        sourceSeeds: targetFixtureSourceSeeds,
        ownerFiles: targetFixtureOwnerFiles,
        trustExclusions: targetFixtureTrustExclusions,
        codexAdapterPlanRef: result.codexAdapterPlanRef,
        evidenceContract: result.evidenceContract
      }
    });
    const aggregate = await harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id);

    if (aggregate === undefined || aggregate.contextAssembly === undefined) {
      throw new Error("Target repo harness smoke failed to read back persisted run");
    }

    const capabilityPlan = createCapabilityPlan({
      harnessPlan: aggregate.harnessPlan,
      hasContext: aggregate.contextAssembly.inclusions.length > 0,
      createdAt: now,
      createId: (prefix) => `${prefix}-${marker}-readback`
    });
    const brief = createExecutionBrief({
      taskContract: aggregate.taskContract,
      harnessPlan: aggregate.harnessPlan,
      contextAssembly: aggregate.contextAssembly,
      capabilityPlan,
      evidenceContract: result.evidenceContract,
      nextAction: aggregate.harnessPlan.nextAction ?? "Use this brief as the next Codex input.",
      goalReference: "GOAL.md M27 target repo init-connect dogfood",
      execPlanReference: "PLAN.md M27 Slice 09"
    });
    const renderedBrief = renderExecutionBriefText(brief);
    const codexBriefRendered =
      renderedBrief.includes("KRN Codex Execution Brief") &&
      renderedBrief.includes("Objective: improve test script readiness");
    const targetProjectLinked =
      aggregate.operatorIntent.projectId === project.id &&
      aggregate.taskContract.projectId === project.id;

    if (
      aggregate.executionRun.id !== executionRun.id ||
      !codexBriefRendered ||
      !targetProjectLinked
    ) {
      throw new Error("Target repo harness smoke readback did not match expected project proof");
    }

    const evidenceBundle = await harnessRunRepository.createEvidenceBundle({
      executionRunId: executionRun.id,
      status: "captured",
      changedFiles: [],
      commands: [
        { command: "pnpm typecheck", status: "skipped" },
        { command: "pnpm test", status: "skipped" },
        { command: "git diff --check", status: "skipped" }
      ],
      diffRisk: "low",
      reviewBurden: "Review target repo harness smoke linkage and cleanup proof.",
      rollbackPath: "Revert the target repo harness smoke implementation commit.",
      event: {
        sequence: 2,
        type: "smoke.target_repo_harness.evidence_captured",
        message: "Target repo harness smoke evidence captured",
        payload: {
          smokeId: marker,
          projectId: project.id,
          executionRunId: executionRun.id
        }
      },
      metadata: {
        smokeId: marker,
        projectId: project.id,
        command: "db:smoke:target-repo-harness"
      }
    });
    const reviewAssessment = await harnessRunRepository.createReviewAssessment({
      evidenceBundleId: evidenceBundle.id,
      status: "pending",
      reviewer: "krn-cli-smoke",
      summary: "Target repo harness smoke evidence captured.",
      findings: [],
      metadata: {
        smokeId: marker,
        projectId: project.id
      }
    });
    const feedbackDelta = await harnessRunRepository.createFeedbackDelta({
      reviewAssessmentId: reviewAssessment.id,
      status: "candidate",
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [],
      metadata: {
        smokeId: marker,
        projectId: project.id
      }
    });
    const remainingMarkerCount = await cleanupMarkerRows(client, marker, retrievalRunId);

    return {
      workspaceSlug,
      projectId: project.id,
      repoInstallationId: repoInstallation.id,
      projectKernelId: projectKernel.id,
      sourceSeedPaths: targetFixtureSourceSeeds.map((seed) => seed.path),
      ownerFilePaths: targetFixtureOwnerFiles.map((ownerFile) => ownerFile.path),
      trustExclusionPatterns: targetFixtureTrustExclusions.map((exclusion) => exclusion.pathPattern),
      executionRunId: executionRun.id,
      readBackExecutionRunId: aggregate.executionRun.id,
      codexBriefRendered,
      evidenceBundleId: evidenceBundle.id,
      reviewAssessmentId: reviewAssessment.id,
      feedbackDeltaId: feedbackDelta.id,
      targetProjectLinked,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } catch (error) {
    await cleanupMarkerRows(client, marker, retrievalRunId);
    throw error;
  } finally {
    await client.end();
  }
};
