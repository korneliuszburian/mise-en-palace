import path from "node:path";
import {
  runMigrationReadinessCheck
} from "@krn/db/dev";
import {
  findRepoRoot
} from "./cliFileBoundary.js";
import {
  connectedButNotReadyRecovery,
  dbBootstrapDoesNotProve,
  missingDbConfigRecovery,
  unreachablePostgresRecovery
} from "./dbRecoveryGuidance.js";

export interface DbReadinessRuntime {
  env: Record<string, string | undefined>;
  cwd: string;
}

export interface DbReadinessResult {
  exitCode: number;
  stdout: string;
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "unknown DB readiness error";

export const redactedPostgresEndpoint = (databaseUrl: string): string => {
  try {
    const parsed = new URL(databaseUrl);
    parsed.username = "";
    parsed.password = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "unparseable KRN_DATABASE_URL";
  }
};

export const runDbReadinessCommand = async (
  runtime: DbReadinessRuntime
): Promise<DbReadinessResult> => {
  const repoRoot = await findRepoRoot(runtime.cwd);
  const migrationsFolder = path.join(repoRoot, "packages", "db", "src", "migrations");
  const relativeMigrationsFolder = path.relative(repoRoot, migrationsFolder);
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    return {
      exitCode: 1,
      stdout: [
        "KRN DB Readiness",
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        "DB mode: preview/no-DB",
        "Postgres config: missing KRN_DATABASE_URL",
        `Next action: ${missingDbConfigRecovery()}`,
        `Does not prove: ${dbBootstrapDoesNotProve}`,
        "Brain store readiness: blocked (database not configured)"
      ].join("\n") + "\n"
    };
  }

  try {
    const report = await runMigrationReadinessCheck({
      databaseUrl,
      migrationsFolder
    });
    const ready = report.migrationsVerified && report.pgvectorAvailable;

    return {
      exitCode: ready ? 0 : 1,
      stdout: [
        "KRN DB Readiness",
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        `DB mode: ${ready ? "ready" : "connected but not ready"}`,
        "Postgres config: configured",
        `Postgres endpoint: ${redactedPostgresEndpoint(databaseUrl)}`,
        "Postgres: reachable",
        `Migrations expected: ${report.expectedMigrationCount}`,
        `Migrations applied: ${report.appliedMigrationCount}`,
        `Migrations: ${report.migrationsVerified ? "applied" : "incomplete"}`,
        `pgvector: ${report.pgvectorAvailable ? "available" : "missing"}`,
        ...(ready
          ? []
          : [
              `Next action: ${connectedButNotReadyRecovery()}`,
              "Does not prove: a reachable database is not ready until migrations and pgvector are ready"
            ]),
        `Brain store readiness: ${ready ? "ready" : "blocked (pgvector and migrations must be ready)"}`
      ].join("\n") + "\n"
    };
  } catch (error) {
    return {
      exitCode: 1,
      stdout: [
        "KRN DB Readiness",
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        "DB mode: configured but unreachable",
        "Postgres config: configured",
        `Postgres endpoint: ${redactedPostgresEndpoint(databaseUrl)}`,
        `Postgres/migrations: failed (${errorMessage(error)})`,
        `Next action: ${unreachablePostgresRecovery()}`,
        `Does not prove: ${dbBootstrapDoesNotProve}`,
        "Brain store readiness: blocked (migration readiness failed)"
      ].join("\n") + "\n"
    };
  }
};
