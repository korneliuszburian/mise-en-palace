import {
  access
} from "node:fs/promises";
import path from "node:path";
import {
  runHarnessPlanSmokeCheck,
  runPersistenceSmokeCheck
} from "@krn/db";

export interface DbSmokeRuntime {
  env: Record<string, string | undefined>;
  cwd: string;
  createId(prefix: string): string;
  target: "project" | "harnessPlan";
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

export const runDbSmokeCommand = async (
  runtime: DbSmokeRuntime
): Promise<DbSmokeResult> => {
  const repoRoot = await findRepoRoot(runtime.cwd);
  const migrationsFolder = path.join(repoRoot, "packages", "db", "src", "migrations");
  const relativeMigrationsFolder = path.relative(repoRoot, migrationsFolder);
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();
  const title = runtime.target === "harnessPlan" ? "KRN Harness Plan Smoke" : "KRN DB Smoke";
  const skipped =
    runtime.target === "harnessPlan"
      ? "Harness plan smoke: skipped (database not configured)"
      : "Persistence smoke: skipped (database not configured)";

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
        `${runtime.target === "harnessPlan" ? "Harness plan smoke" : "Persistence smoke"}: failed (${errorMessage(error)})`
      ].join("\n") + "\n"
    };
  }
};
