import {
  access
} from "node:fs/promises";
import path from "node:path";
import {
  runActivationSmokeCheck,
  runHarnessEvidenceSmokeCheck,
  runHarnessPlanSmokeCheck,
  runInitConnectSmokeCheck,
  runMemoryGovernanceSmokeCheck,
  runPersistenceSmokeCheck,
  runRetrievalSubstrateSmokeCheck,
  runSourceGraphSmokeCheck,
  runWorkerJobSmokeCheck
} from "@krn/db";
import {
  formatCodexAdapterSmokeReportLines,
  runCodexAdapterSmokeCheck
} from "./codexAdapterSmoke.js";
import {
  formatTargetRepoHarnessSmokeReportLines,
  runTargetRepoHarnessSmokeCheck
} from "./targetRepoHarnessSmoke.js";
import {
  formatWorkerJobSmokeReportLines
} from "./workerJobSmoke.js";

export interface DbSmokeRuntime {
  env: Record<string, string | undefined>;
  cwd: string;
  createId(prefix: string): string;
  target:
    | "project"
    | "harnessPlan"
    | "harnessEvidence"
    | "sourceGraph"
    | "memoryGovernance"
    | "retrievalSubstrate"
    | "activation"
    | "codexAdapter"
    | "workerJobs"
    | "initConnect"
    | "targetRepoHarness";
}

export interface DbSmokeResult {
  exitCode: number;
  stdout: string;
}

const localDatabaseUrl = "postgres://krn:krn@localhost:54329/krn";

const pathExists = async (targetPath: string): Promise<boolean> => {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const findRepoRoot = async (startPath: string): Promise<string> => {
  let currentPath = startPath;

  for (;;) {
    if (await pathExists(path.join(currentPath, "pnpm-workspace.yaml"))) {
      return currentPath;
    }

    const parentPath = path.dirname(currentPath);

    if (parentPath === currentPath) {
      return startPath;
    }

    currentPath = parentPath;
  }
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "unknown DB smoke error";

const titleForTarget = (target: DbSmokeRuntime["target"]): string => {
  if (target === "harnessPlan") {
    return "KRN Harness Plan Smoke";
  }

  if (target === "harnessEvidence") {
    return "KRN Harness Evidence Smoke";
  }

  if (target === "sourceGraph") {
    return "KRN Source Graph Smoke";
  }

  if (target === "memoryGovernance") {
    return "KRN Memory Governance Smoke";
  }

  if (target === "retrievalSubstrate") {
    return "KRN Retrieval Substrate Smoke";
  }

  if (target === "activation") {
    return "KRN Activation Smoke";
  }

  if (target === "codexAdapter") {
    return "KRN Codex Adapter Smoke";
  }

  if (target === "workerJobs") {
    return "KRN Worker Job Smoke";
  }

  if (target === "initConnect") {
    return "KRN Target Repo Init-Connect Smoke";
  }

  if (target === "targetRepoHarness") {
    return "KRN Target Repo Harness Smoke";
  }

  return "KRN DB Smoke";
};

const skippedLineForTarget = (target: DbSmokeRuntime["target"]): string => {
  if (target === "harnessPlan") {
    return "Harness plan smoke: skipped (database not configured)";
  }

  if (target === "harnessEvidence") {
    return "Harness evidence smoke: skipped (database not configured)";
  }

  if (target === "sourceGraph") {
    return "Source graph smoke: skipped (database not configured)";
  }

  if (target === "memoryGovernance") {
    return "Memory governance smoke: skipped (database not configured)";
  }

  if (target === "retrievalSubstrate") {
    return "Retrieval substrate smoke: skipped (database not configured)";
  }

  if (target === "activation") {
    return "Activation smoke: skipped (database not configured)";
  }

  if (target === "codexAdapter") {
    return "Codex adapter smoke: skipped (database not configured)";
  }

  if (target === "workerJobs") {
    return "Worker job smoke: skipped (database not configured)";
  }

  if (target === "initConnect") {
    return "Init-connect smoke: skipped (database not configured)";
  }

  if (target === "targetRepoHarness") {
    return "Target repo harness smoke: skipped (database not configured)";
  }

  return "Persistence smoke: skipped (database not configured)";
};

const failureLabelForTarget = (target: DbSmokeRuntime["target"]): string => {
  if (target === "harnessPlan") {
    return "Harness plan smoke";
  }

  if (target === "harnessEvidence") {
    return "Harness evidence smoke";
  }

  if (target === "sourceGraph") {
    return "Source graph smoke";
  }

  if (target === "memoryGovernance") {
    return "Memory governance smoke";
  }

  if (target === "retrievalSubstrate") {
    return "Retrieval substrate smoke";
  }

  if (target === "activation") {
    return "Activation smoke";
  }

  if (target === "codexAdapter") {
    return "Codex adapter smoke";
  }

  if (target === "workerJobs") {
    return "Worker job smoke";
  }

  if (target === "initConnect") {
    return "Init-connect smoke";
  }

  if (target === "targetRepoHarness") {
    return "Target repo harness smoke";
  }

  return "Persistence smoke";
};

export const runDbSmokeCommand = async (
  runtime: DbSmokeRuntime
): Promise<DbSmokeResult> => {
  const repoRoot = await findRepoRoot(runtime.cwd);
  const migrationsFolder = path.join(repoRoot, "packages", "db", "src", "migrations");
  const relativeMigrationsFolder = path.relative(repoRoot, migrationsFolder);
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();
  const title = titleForTarget(runtime.target);
  const skipped = skippedLineForTarget(runtime.target);

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    return {
      exitCode: 1,
      stdout: [
        title,
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        "Postgres config: missing KRN_DATABASE_URL",
        `Next action: export KRN_DATABASE_URL=${localDatabaseUrl} and start docker compose up -d krn-postgres`,
        skipped
      ].join("\n") + "\n"
    };
  }

  try {
    if (runtime.target === "harnessPlan") {
      const report = await runHarnessPlanSmokeCheck({
        databaseUrl,
        migrationsFolder,
        smokeId: runtime.createId("harness-plan-smoke")
      });

      return {
        exitCode: report.cleanedUp ? 0 : 1,
        stdout: [
          "KRN Harness Plan Smoke",
          `Repo root: ${repoRoot}`,
          `Migrations folder: ${relativeMigrationsFolder}`,
          "Postgres config: configured",
          `Workspace smoke row: ${report.workspaceSlug}`,
          `Project smoke row: ${report.projectSlug}`,
          `Execution run: ${report.executionRunId}`,
          `Readback: ${report.readBackExecutionRunId === report.executionRunId ? "matched" : "mismatch"}`,
          `Evidence contract commands: ${report.evidenceCommandCount}`,
          `Run events: ${report.runEventCount}`,
          `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
          `Cleanup: ${report.cleanedUp ? "completed" : "not completed"}`,
          `Harness plan smoke: ${report.cleanedUp ? "passed" : "failed"}`
        ].join("\n") + "\n"
      };
    }

    if (runtime.target === "harnessEvidence") {
      const report = await runHarnessEvidenceSmokeCheck({
        databaseUrl,
        migrationsFolder,
        smokeId: runtime.createId("harness-evidence-smoke")
      });

      return {
        exitCode: report.cleanedUp ? 0 : 1,
        stdout: [
          "KRN Harness Evidence Smoke",
          `Repo root: ${repoRoot}`,
          `Migrations folder: ${relativeMigrationsFolder}`,
          "Postgres config: configured",
          `Workspace smoke row: ${report.workspaceSlug}`,
          `Project smoke row: ${report.projectSlug}`,
          `Execution run: ${report.executionRunId}`,
          `Evidence bundle: ${report.evidenceBundleId}`,
          `Review assessment: ${report.reviewAssessmentId}`,
          `Feedback delta: ${report.feedbackDeltaId}`,
          `Evidence bundles: ${report.evidenceBundleCount}`,
          `Review assessments: ${report.reviewAssessmentCount}`,
          `Feedback deltas: ${report.feedbackDeltaCount}`,
          `Run events: ${report.runEventCount}`,
          `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
          `Cleanup: ${report.cleanedUp ? "completed" : "not completed"}`,
          `Harness evidence smoke: ${report.cleanedUp ? "passed" : "failed"}`
        ].join("\n") + "\n"
      };
    }

    if (runtime.target === "sourceGraph") {
      const report = await runSourceGraphSmokeCheck({
        databaseUrl,
        migrationsFolder,
        smokeId: runtime.createId("source-graph-smoke")
      });

      return {
        exitCode: report.cleanedUp ? 0 : 1,
        stdout: [
          "KRN Source Graph Smoke",
          `Repo root: ${repoRoot}`,
          `Migrations folder: ${relativeMigrationsFolder}`,
          "Postgres config: configured",
          `Workspace smoke row: ${report.workspaceSlug}`,
          `Project smoke row: ${report.projectSlug}`,
          `Execution run: ${report.executionRunId}`,
          `Source artifact: ${report.sourceArtifactId}`,
          `Source claim: ${report.sourceClaimId}`,
          `Source claim readback: ${
            report.readBackSourceClaimId === report.sourceClaimId ? "matched" : "mismatch"
          }`,
          `Source decision edge: ${report.sourceDecisionEdgeId}`,
          `Source rejection: ${report.sourceRejectionId}`,
          `Run source claims: ${report.runClaimCount}`,
          `Run source decision edges: ${report.runDecisionEdgeCount}`,
          `Source rejections: ${report.rejectionCount}`,
          `Outbox events: ${report.outboxEventCount}`,
          `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
          `Cleanup: ${report.cleanedUp ? "completed" : "not completed"}`,
          `Source graph smoke: ${report.cleanedUp ? "passed" : "failed"}`
        ].join("\n") + "\n"
      };
    }

    if (runtime.target === "memoryGovernance") {
      const report = await runMemoryGovernanceSmokeCheck({
        databaseUrl,
        migrationsFolder,
        smokeId: runtime.createId("memory-governance-smoke")
      });

      return {
        exitCode: report.cleanedUp ? 0 : 1,
        stdout: [
          "KRN Memory Governance Smoke",
          `Repo root: ${repoRoot}`,
          `Migrations folder: ${relativeMigrationsFolder}`,
          "Postgres config: configured",
          `Workspace smoke row: ${report.workspaceSlug}`,
          `Project smoke row: ${report.projectSlug}`,
          `Execution run: ${report.executionRunId}`,
          `Source claim: ${report.sourceClaimId}`,
          `Memory candidate: ${report.memoryCandidateId}`,
          `Memory candidate readback: ${
            report.readBackMemoryCandidateId === report.memoryCandidateId ? "matched" : "mismatch"
          }`,
          `Memory candidate reviewed status: ${report.reviewedMemoryCandidateStatus}`,
          `Memory record: ${report.memoryRecordId}`,
          `Memory record readback: ${
            report.readBackMemoryRecordId === report.memoryRecordId ? "matched" : "mismatch"
          }`,
          `Memory record version: ${report.memoryRecordVersionId}`,
          `Memory application: ${report.memoryApplicationId}`,
          `Anti-memory record: ${report.antiMemoryRecordId}`,
          `Run anti-memory records: ${report.runAntiMemoryCount}`,
          `Project memory records: ${report.projectMemoryRecordCount}`,
          `Outbox events: ${report.outboxEventCount}`,
          `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
          `Cleanup: ${report.cleanedUp ? "completed" : "not completed"}`,
          `Memory governance smoke: ${report.cleanedUp ? "passed" : "failed"}`
        ].join("\n") + "\n"
      };
    }

    if (runtime.target === "retrievalSubstrate") {
      const report = await runRetrievalSubstrateSmokeCheck({
        databaseUrl,
        migrationsFolder,
        smokeId: runtime.createId("retrieval-substrate-smoke")
      });

      return {
        exitCode: report.cleanedUp ? 0 : 1,
        stdout: [
          "KRN Retrieval Substrate Smoke",
          `Repo root: ${repoRoot}`,
          `Migrations folder: ${relativeMigrationsFolder}`,
          "Postgres config: configured",
          `Workspace smoke row: ${report.workspaceSlug}`,
          `Project smoke row: ${report.projectSlug}`,
          `Execution run: ${report.executionRunId}`,
          `Source claim: ${report.sourceClaimId}`,
          `Memory record: ${report.memoryRecordId}`,
          `Evidence bundle: ${report.evidenceBundleId}`,
          `Source decision: ${report.sourceDecisionId}`,
          `Search documents: ${report.searchDocumentCount}`,
          `Lexical results: ${report.lexicalResultCount}`,
          `Embedding model: ${report.embeddingModelId}`,
          `Embedding row: ${report.embeddingId}`,
          `Retrieval run: ${report.retrievalRunId}`,
          `Retrieval candidates: ${report.retrievalCandidateCount}`,
          `Activation decisions: ${report.activationDecisionCount}`,
          `Context items: ${report.contextItemCount}`,
          `Context exclusions: ${report.contextExclusionCount}`,
          `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
          `Cleanup: ${report.cleanedUp ? "completed" : "not completed"}`,
          `Retrieval substrate smoke: ${report.cleanedUp ? "passed" : "failed"}`
        ].join("\n") + "\n"
      };
    }

    if (runtime.target === "activation") {
      const report = await runActivationSmokeCheck({
        databaseUrl,
        migrationsFolder,
        smokeId: runtime.createId("activation-smoke")
      });

      return {
        exitCode: report.cleanedUp ? 0 : 1,
        stdout: [
          "KRN Activation Smoke",
          `Repo root: ${repoRoot}`,
          `Migrations folder: ${relativeMigrationsFolder}`,
          "Postgres config: configured",
          `Workspace smoke row: ${report.workspaceSlug}`,
          `Project smoke row: ${report.projectSlug}`,
          `Execution run: ${report.executionRunId}`,
          `Task contract: ${report.taskContractId}`,
          `Harness plan: ${report.harnessPlanId}`,
          `Retrieval run: ${report.retrievalRunId}`,
          `Retrieval run readback: ${
            report.readBackRetrievalRunId === report.retrievalRunId ? "matched" : "mismatch"
          }`,
          `Context assembly: ${report.contextAssemblyId}`,
          `Context assembly readback: ${
            report.readBackContextAssemblyId === report.contextAssemblyId ? "matched" : "mismatch"
          }`,
          `Source claims: ${report.sourceClaimCount}`,
          `Memory records: ${report.memoryRecordCount}`,
          `Anti-memory records: ${report.antiMemoryRecordCount}`,
          `Search documents: ${report.searchDocumentCount}`,
          `Search candidates: ${report.searchCandidateCount}`,
          `Retrieval candidates: ${report.retrievalCandidateCount}`,
          `Activation decisions: ${report.activationDecisionCount}`,
          `Included decisions: ${report.includedDecisionCount}`,
          `Excluded decisions: ${report.excludedDecisionCount}`,
          `Conflict decisions: ${report.conflictDecisionCount}`,
          `Stale decisions: ${report.staleDecisionCount}`,
          `Context items: ${report.contextItemCount}`,
          `Context exclusions: ${report.contextExclusionCount}`,
          `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
          `Cleanup: ${report.cleanedUp ? "completed" : "not completed"}`,
          `Activation smoke: ${report.cleanedUp ? "passed" : "failed"}`
        ].join("\n") + "\n"
      };
    }

    if (runtime.target === "codexAdapter") {
      const report = await runCodexAdapterSmokeCheck({
        databaseUrl,
        migrationsFolder,
        smokeId: runtime.createId("codex-adapter-smoke")
      });

      return {
        exitCode: report.cleanedUp ? 0 : 1,
        stdout: [
          "KRN Codex Adapter Smoke",
          `Repo root: ${repoRoot}`,
          `Migrations folder: ${relativeMigrationsFolder}`,
          "Postgres config: configured",
          ...formatCodexAdapterSmokeReportLines(report)
        ].join("\n") + "\n"
      };
    }

    if (runtime.target === "workerJobs") {
      const report = await runWorkerJobSmokeCheck({
        databaseUrl,
        migrationsFolder,
        smokeId: runtime.createId("worker-job-smoke")
      });

      return {
        exitCode: report.cleanedUp ? 0 : 1,
        stdout: [
          "KRN Worker Job Smoke",
          `Repo root: ${repoRoot}`,
          `Migrations folder: ${relativeMigrationsFolder}`,
          "Postgres config: configured",
          ...formatWorkerJobSmokeReportLines(report)
        ].join("\n") + "\n"
      };
    }

    if (runtime.target === "initConnect") {
      const report = await runInitConnectSmokeCheck({
        databaseUrl,
        migrationsFolder,
        smokeId: runtime.createId("init-connect-smoke"),
        targetRepoPath: path.join(repoRoot, "tests", "fixtures", "target-repos", "typescript-basic")
      });

      return {
        exitCode: report.cleanedUp ? 0 : 1,
        stdout: [
          "KRN Target Repo Init-Connect Smoke",
          `Repo root: ${repoRoot}`,
          `Migrations folder: ${relativeMigrationsFolder}`,
          "Postgres config: configured",
          `Workspace smoke row: ${report.workspaceSlug}`,
          `Project: ${report.projectId}`,
          `Project readback by fingerprint: ${
            report.readBackProjectIdByFingerprint === report.projectId ? "matched" : "mismatch"
          }`,
          `Project readback by path: ${
            report.readBackProjectIdByPath === report.projectId ? "matched" : "mismatch"
          }`,
          `Repo installation: ${report.repoInstallationId}`,
          `Repo installation readback: ${
            report.readBackRepoInstallationId === report.repoInstallationId ? "matched" : "mismatch"
          }`,
          `ProjectKernel: ${report.projectKernelId}`,
          `ProjectKernel readback: ${
            report.readBackProjectKernelId === report.projectKernelId ? "matched" : "mismatch"
          }`,
          `Idempotent project reuse: ${report.reusedProjectId === report.projectId ? "matched" : "mismatch"}`,
          `Idempotent repo installation reuse: ${
            report.reusedRepoInstallationId === report.repoInstallationId ? "matched" : "mismatch"
          }`,
          `Idempotent ProjectKernel reuse: ${
            report.reusedProjectKernelId === report.projectKernelId ? "matched" : "mismatch"
          }`,
          `Repo installations listed: ${report.repoInstallationCount}`,
          `Cleanup remaining marker count: ${report.remainingMarkerCount}`,
          `Cleanup: ${report.cleanedUp ? "completed" : "not completed"}`,
          `Init-connect smoke: ${report.cleanedUp ? "passed" : "failed"}`
        ].join("\n") + "\n"
      };
    }

    if (runtime.target === "targetRepoHarness") {
      const report = await runTargetRepoHarnessSmokeCheck({
        databaseUrl,
        migrationsFolder,
        smokeId: runtime.createId("target-repo-harness-smoke"),
        targetRepoPath: path.join(repoRoot, "tests", "fixtures", "target-repos", "typescript-basic")
      });

      return {
        exitCode: report.cleanedUp ? 0 : 1,
        stdout: [
          "KRN Target Repo Harness Smoke",
          `Repo root: ${repoRoot}`,
          `Migrations folder: ${relativeMigrationsFolder}`,
          "Postgres config: configured",
          ...formatTargetRepoHarnessSmokeReportLines(report)
        ].join("\n") + "\n"
      };
    }

    const report = await runPersistenceSmokeCheck({
      databaseUrl,
      migrationsFolder,
      smokeId: runtime.createId("db-smoke")
    });

    return {
      exitCode: 0,
      stdout: [
        "KRN DB Smoke",
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        "Postgres config: configured",
        `Workspace smoke row: ${report.workspaceSlug}`,
        `Project smoke row: ${report.projectSlug}`,
        `Project readback: ${report.readBackProjectId === report.projectId ? "matched" : "mismatch"}`,
        `Cleanup: ${report.cleanedUp ? "completed" : "not completed"}`,
        "Persistence smoke: passed"
      ].join("\n") + "\n"
    };
  } catch (error) {
    return {
      exitCode: 1,
      stdout: [
        title,
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        "Postgres config: configured",
        `${failureLabelForTarget(runtime.target)}: failed (${errorMessage(error)})`
      ].join("\n") + "\n"
    };
  }
};
