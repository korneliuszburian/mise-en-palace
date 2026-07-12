import path from "node:path";

import {
  migrateDatabase
} from "@krn/db/dev";

import {
  findRepoRoot
} from "./cli-file-boundary.js";
import {
  missingDbConfigRecovery,
  unreachablePostgresRecovery
} from "./db-recovery-guidance.js";
import {
  collectEnvironmentFingerprint,
  environmentFingerprintLines
} from "./environment-fingerprint.js";
import {
  redactedPostgresEndpoint
} from "./run-db-readiness-command.js";

export interface DbMigrateRuntime {
  env: Record<string, string | undefined>;
  cwd: string;
}

export interface DbMigrateResult {
  exitCode: number;
  stdout: string;
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "unknown DB migration error";

const migrationDoesNotProve =
  "applying migrations does not prove source authority integrity, data correctness, backups, or product readiness";

export const runDbMigrateCommand = async (
  runtime: DbMigrateRuntime
): Promise<DbMigrateResult> => {
  const repoRoot = await findRepoRoot(runtime.cwd);
  const migrationsFolder = path.join(repoRoot, "packages", "db", "src", "migrations");
  const relativeMigrationsFolder = path.relative(repoRoot, migrationsFolder);
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();
  const environmentFingerprint = await collectEnvironmentFingerprint({
    repoRoot,
    databaseUrl,
    evaluatorVersion: "db-migrate.v1"
  });
  const attachFingerprint = (stdout: string): string =>
    `${stdout}${environmentFingerprintLines(environmentFingerprint).join("\n")}\n`;

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    return {
      exitCode: 1,
      stdout: attachFingerprint([
        "KRN DB Migrate",
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        "DB mode: preview/no-DB",
        "Postgres config: missing KRN_DATABASE_URL",
        `Next action: ${missingDbConfigRecovery()}`,
        `Does not prove: ${migrationDoesNotProve}`
      ].join("\n") + "\n")
    };
  }

  try {
    const report = await migrateDatabase({
      databaseUrl,
      migrationsFolder
    });
    const migrated = report.migrationsVerified && report.pgvectorAvailable;

    return {
      exitCode: migrated ? 0 : 1,
      stdout: attachFingerprint([
        "KRN DB Migrate",
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        `DB mode: ${migrated ? "migrations applied" : "connected but migration incomplete"}`,
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
        `Does not prove: ${migrationDoesNotProve}`
      ].join("\n") + "\n")
    };
  } catch (error) {
    return {
      exitCode: 1,
      stdout: attachFingerprint([
        "KRN DB Migrate",
        `Repo root: ${repoRoot}`,
        `Migrations folder: ${relativeMigrationsFolder}`,
        "DB mode: configured but migration failed",
        "Postgres config: configured",
        `Postgres endpoint: ${redactedPostgresEndpoint(databaseUrl)}`,
        `Postgres/migrate: failed (${errorMessage(error)})`,
        `Next action: ${unreachablePostgresRecovery()}`,
        `Does not prove: ${migrationDoesNotProve}`
      ].join("\n") + "\n")
    };
  }
};
