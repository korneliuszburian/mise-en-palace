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
} from "@krn/db/dev";
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
import {
  findRepoRoot
} from "./cliFileBoundary.js";

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

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "unknown DB smoke error";

interface DbSmokeTargetMetadata {
  title: string;
  skippedLine: string;
  failureLabel: string;
}

const dbSmokeTargetMetadata = {
  project: {
    title: "KRN DB Smoke",
    skippedLine: "Persistence smoke: skipped (database not configured)",
    failureLabel: "Persistence smoke"
  },
  harnessPlan: {
    title: "KRN Harness Plan Smoke",
    skippedLine: "Harness plan smoke: skipped (database not configured)",
    failureLabel: "Harness plan smoke"
  },
  harnessEvidence: {
    title: "KRN Harness Evidence Smoke",
    skippedLine: "Harness evidence smoke: skipped (database not configured)",
    failureLabel: "Harness evidence smoke"
  },
  sourceGraph: {
    title: "KRN Source Graph Smoke",
    skippedLine: "Source graph smoke: skipped (database not configured)",
    failureLabel: "Source graph smoke"
  },
  memoryGovernance: {
    title: "KRN Memory Governance Smoke",
    skippedLine: "Memory governance smoke: skipped (database not configured)",
    failureLabel: "Memory governance smoke"
  },
  retrievalSubstrate: {
    title: "KRN Retrieval Substrate Smoke",
    skippedLine: "Retrieval substrate smoke: skipped (database not configured)",
    failureLabel: "Retrieval substrate smoke"
  },
  activation: {
    title: "KRN Activation Smoke",
    skippedLine: "Activation smoke: skipped (database not configured)",
    failureLabel: "Activation smoke"
  },
  codexAdapter: {
    title: "KRN Codex Adapter Smoke",
    skippedLine: "Codex adapter smoke: skipped (database not configured)",
    failureLabel: "Codex adapter smoke"
  },
  workerJobs: {
    title: "KRN Worker Job Smoke",
    skippedLine: "Worker job smoke: skipped (database not configured)",
    failureLabel: "Worker job smoke"
  },
  initConnect: {
    title: "KRN Target Repo Init-Connect Smoke",
    skippedLine: "Init-connect smoke: skipped (database not configured)",
    failureLabel: "Init-connect smoke"
  },
  targetRepoHarness: {
    title: "KRN Target Repo Harness Smoke",
    skippedLine: "Target repo harness smoke: skipped (database not configured)",
    failureLabel: "Target repo harness smoke"
  }
} satisfies Record<DbSmokeRuntime["target"], DbSmokeTargetMetadata>;

export const runDbSmokeCommand = async (
  runtime: DbSmokeRuntime
): Promise<DbSmokeResult> => {
  const repoRoot = await findRepoRoot(runtime.cwd);
  const migrationsFolder = path.join(repoRoot, "packages", "db", "src", "migrations");
  const relativeMigrationsFolder = path.relative(repoRoot, migrationsFolder);
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();
  const targetMetadata = dbSmokeTargetMetadata[runtime.target];

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    return {
      exitCode: 1,
      stdout: [
        targetMetadata.title,
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        "Postgres config: missing KRN_DATABASE_URL",
        `Next action: export KRN_DATABASE_URL=${localDatabaseUrl} and start docker compose up -d krn-postgres`,
        targetMetadata.skippedLine
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
          `Temporal source claim: ${report.temporalSourceClaimId}`,
          `Source claim readback: ${
            report.readBackSourceClaimId === report.sourceClaimId ? "matched" : "mismatch"
          }`,
          `Source claim edge: ${report.sourceClaimEdgeId}`,
          `Source decision: ${report.sourceDecisionId}`,
          `Source decision edge: ${report.sourceDecisionEdgeId}`,
          `Source rejection: ${report.sourceRejectionId}`,
          `Run source claims: ${report.runClaimCount}`,
          `Source claim edges: ${report.sourceClaimEdgeCount}`,
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
          `Memory record invalidated status: ${report.invalidatedMemoryRecordStatus}`,
          `Active memory after invalidation: ${report.activeMemoryAfterInvalidationCount}`,
          `Memory application: ${report.memoryApplicationId}`,
          `Anti-memory candidate: ${report.antiMemoryCandidateId}`,
          `Anti-memory candidate reviewed status: ${report.reviewedAntiMemoryCandidateStatus}`,
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
          `Observation prefix items: ${report.observationPrefixItemCount}`,
          `Raw evidence recall triggers: ${report.rawEvidenceRecallTriggerCount}`,
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
          `Refreshed ProjectKernel: ${report.refreshedProjectKernelId}`,
          `Refreshed ProjectKernel version: ${report.refreshedProjectKernelVersion}`,
          `Refreshed owner files: ${report.refreshedOwnerFilePaths.join(", ")}`,
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
        targetMetadata.title,
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        "Postgres config: configured",
        `${targetMetadata.failureLabel}: failed (${errorMessage(error)})`
      ].join("\n") + "\n"
    };
  }
};
