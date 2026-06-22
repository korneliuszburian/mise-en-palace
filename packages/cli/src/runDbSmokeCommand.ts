import {
  access
} from "node:fs/promises";
import path from "node:path";
import {
  runHarnessEvidenceSmokeCheck,
  runHarnessPlanSmokeCheck,
  runMemoryGovernanceSmokeCheck,
  runPersistenceSmokeCheck,
  runRetrievalSubstrateSmokeCheck,
  runSourceGraphSmokeCheck
} from "@krn/db";

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
    | "retrievalSubstrate";
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
