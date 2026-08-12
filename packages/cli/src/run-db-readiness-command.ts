import {
  inspectMigrationReadiness
} from "@krn/db/dev";
import {
  inspectSqliteMigrationReadiness,
  sqliteStoreIsReady
} from "@krn/db";
import type {
  BackendKind
} from "@krn/db";
import {
  missingDbCommandOutput,
  resolvePostgresDbCommandContext,
  resolveSelectedDbCommandBackend
} from "./db-command-context.js";
import {
  connectedButNotReadyRecovery,
  dbBootstrapDoesNotProve,
  missingDbConfigRecovery,
  unreachablePostgresRecovery
} from "./db-recovery-guidance.js";
import {
  collectEnvironmentFingerprint,
  environmentFingerprintLines
} from "./environment-fingerprint.js";

export interface DbReadinessRuntime {
  env: Record<string, string | undefined>;
  cwd: string;
  backend?: BackendKind;
  dbPath?: string;
}

export interface DbReadinessResult {
  exitCode: number;
  stdout: string;
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "unknown DB readiness error";
const sqliteMigrationAssetLabel = "@krn/db/sqlite-migrations";

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

// fallow-ignore-next-line complexity -- operator-facing SQLite readiness output enumerates every independent store invariant in stable label order
const runSqliteDbReadinessCommand = async (
  targetWorkspace: string,
  dbPath: string
): Promise<DbReadinessResult> => {
  const environmentFingerprint = await collectEnvironmentFingerprint({
    repoRoot: targetWorkspace,
    evaluatorVersion: "db-readiness.v1"
  });
  const attachFingerprint = (stdout: string): string =>
    `${stdout}${environmentFingerprintLines(environmentFingerprint).join("\n")}\n`;

  try {
    const report = await inspectSqliteMigrationReadiness(dbPath);
    const ready = sqliteStoreIsReady(report);
    return {
      exitCode: ready ? 0 : 1,
      stdout: attachFingerprint([
        "KRN DB Readiness",
        `Repo root: ${targetWorkspace}`,
        `Migrations folder: ${sqliteMigrationAssetLabel}`,
        `DB mode: ${ready ? "ready" : "connected but not ready"}`,
        "SQLite config: configured",
        `SQLite path: ${dbPath}`,
        "SQLite: reachable",
        `Migrations expected: ${report.expectedMigrationCount}`,
        `Migrations applied: ${report.appliedMigrationCount}`,
        `Migrations identity: ${report.migrationIdentityStatus}`,
        ...report.migrationIdentityDetails.map((detail) => `Migration detail: ${detail}`),
        `Migrations: ${report.migrationsVerified ? "applied" : "incomplete"}`,
        `SQLite schema: ${report.schemaPresent ? "present" : "incomplete"}`,
        `Repository reachability: ${report.repositoryReachabilityReady ? "ready" : "blocked"}`,
        `SQLite journal mode: ${report.journalMode}`,
        `SQLite foreign keys: ${report.foreignKeysEnabled && report.foreignKeyViolations === 0 ? "enabled" : "blocked"}`,
        `SQLite integrity: ${report.integrityReady ? "ok" : "failed"}`,
        `Memory store readiness: ${ready ? "ready" : "blocked (SQLite store checks must be ready)"}`
      ].join("\n") + "\n")
    };
  } catch (error) {
    return {
      exitCode: 1,
      stdout: attachFingerprint([
        "KRN DB Readiness",
        `Repo root: ${targetWorkspace}`,
        `Migrations folder: ${sqliteMigrationAssetLabel}`,
        "DB mode: configured but unreachable",
        "SQLite config: configured",
        `SQLite path: ${dbPath}`,
        `SQLite/migrations: failed (${errorMessage(error)})`,
        `Does not prove: ${dbBootstrapDoesNotProve}`,
        "Memory store readiness: blocked (migration readiness failed)"
      ].join("\n") + "\n")
    };
  }
};

// fallow-ignore-next-line complexity -- PostgreSQL compatibility keeps the established missing, unreachable, and partial-readiness output matrix explicit and ordered
const runPostgresDbReadinessCommand = async (
  runtime: DbReadinessRuntime
): Promise<DbReadinessResult> => {
  const {
    attachFingerprint,
    databaseUrl,
    migrationsFolder,
    relativeMigrationsFolder,
    repoRoot
  } = await resolvePostgresDbCommandContext(runtime, "db-readiness.v1");

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    return {
      exitCode: 1,
      stdout: attachFingerprint(missingDbCommandOutput({
        title: "KRN DB Readiness",
        repoRoot,
        relativeMigrationsFolder,
        nextAction: missingDbConfigRecovery(),
        doesNotProve: dbBootstrapDoesNotProve,
        extraLines: ["Memory store readiness: blocked (database not configured)"]
      }))
    };
  }

  try {
    const report = await inspectMigrationReadiness({
      databaseUrl,
      migrationsFolder
    });
    const sourceAuthorityIntegrityReady = report.sourceAuthorityIntegrity?.integrityReady === true;
    const ready = report.migrationsVerified && report.pgvectorAvailable && sourceAuthorityIntegrityReady;

    return {
      exitCode: ready ? 0 : 1,
      stdout: attachFingerprint([
        "KRN DB Readiness",
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        `DB mode: ${ready ? "ready" : "connected but not ready"}`,
        "Postgres config: configured",
        `Postgres endpoint: ${redactedPostgresEndpoint(databaseUrl)}`,
        "Postgres: reachable",
        `Postgres server version: ${report.postgresServerVersion}`,
        `Migrations expected: ${report.expectedMigrationCount}`,
        `Migrations applied: ${report.appliedMigrationCount}`,
        `Migrations identity: ${report.migrationIdentityStatus}`,
        ...report.migrationIdentityDetails.map((detail) => `Migration detail: ${detail}`),
        `Migrations: ${report.migrationsVerified ? "applied" : "incomplete"}`,
        `pgvector: ${report.pgvectorAvailable ? "available" : "missing"}`,
        `pgvector version: ${report.pgvectorVersion ?? "not installed"}`,
        `Source authority integrity: ${sourceAuthorityIntegrityReady ? "clean" : "blocked"}`,
        ...(report.sourceAuthorityIntegrity === undefined
          ? []
          : [
              `Source authority violations: ${report.sourceAuthorityIntegrity.violationCount}`,
              ...report.sourceAuthorityIntegrity.violations.map((violation) =>
                `Source authority violation: ${violation.id} (${violation.detail})`
              )
            ]),
        ...(ready
          ? []
          : [
              `Next action: ${connectedButNotReadyRecovery()}`,
              "Does not prove: a reachable database is not ready until migrations, pgvector, and source authority integrity are ready"
            ]),
        `Memory store readiness: ${ready ? "ready" : "blocked (migrations, pgvector, and source authority integrity must be ready)"}`
      ].join("\n") + "\n")
    };
  } catch (error) {
    return {
      exitCode: 1,
      stdout: attachFingerprint([
        "KRN DB Readiness",
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        "DB mode: configured but unreachable",
        "Postgres config: configured",
        `Postgres endpoint: ${redactedPostgresEndpoint(databaseUrl)}`,
        `Postgres/migrations: failed (${errorMessage(error)})`,
        `Next action: ${unreachablePostgresRecovery()}`,
        `Does not prove: ${dbBootstrapDoesNotProve}`,
        "Memory store readiness: blocked (migration readiness failed)"
      ].join("\n") + "\n")
    };
  }
};

export const runDbReadinessCommand = async (
  runtime: DbReadinessRuntime
): Promise<DbReadinessResult> => {
  const selected = await resolveSelectedDbCommandBackend(runtime);

  return selected.kind === "sqlite"
    ? runSqliteDbReadinessCommand(selected.targetWorkspace, selected.dbPath)
    : runPostgresDbReadinessCommand(runtime);
};
