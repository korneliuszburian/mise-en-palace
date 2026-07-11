import { readMigrationFiles } from "drizzle-orm/migrator";
import { migrate as applyMigrations } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import type { Sql } from "postgres";

import { createKrnDatabase } from "./database.js";
import {
  inspectSourceAuthorityIntegrity,
  type SourceAuthorityIntegrityReadinessReport
} from "./source-authority-integrity-readiness.js";

export interface MigrationReadinessInput {
  databaseUrl: string;
  migrationsFolder: string;
}

export interface MigrationIdentity {
  hash: string;
  createdAt: string;
}

export type MigrationIdentityStatus =
  | "verified"
  | "missing"
  | "extra"
  | "reordered"
  | "mismatched"
  | "unavailable";

export interface MigrationIdentityComparison {
  status: MigrationIdentityStatus;
  details: readonly string[];
}

export interface MigrationReadinessReport {
  migrationsFolder: string;
  expectedMigrationCount: number;
  appliedMigrationCount: number;
  migrationTablePresent: boolean;
  migrationIdentityStatus: MigrationIdentityStatus;
  migrationIdentityDetails: readonly string[];
  migrationsVerified: boolean;
  pgvectorAvailable: boolean;
  postgresServerVersion: string;
  pgvectorVersion?: string;
  sourceAuthorityIntegrity?: SourceAuthorityIntegrityReadinessReport;
}

const migrationIdentityKey = (identity: MigrationIdentity): string =>
  `${identity.hash}@${identity.createdAt}`;

const sameSequence = (
  left: readonly string[],
  right: readonly string[]
): boolean => left.length === right.length && left.every((value, index) => value === right[index]);

const containsAll = (
  values: readonly string[],
  expected: readonly string[]
): boolean => expected.every((value) => values.includes(value));

export const compareMigrationIdentities = (
  expected: readonly MigrationIdentity[],
  applied: readonly MigrationIdentity[]
): MigrationIdentityComparison => {
  const expectedKeys = expected.map(migrationIdentityKey);
  const appliedKeys = applied.map(migrationIdentityKey);

  if (sameSequence(expectedKeys, appliedKeys)) {
    return {
      status: "verified",
      details: []
    };
  }

  if (
    appliedKeys.length < expectedKeys.length &&
    (sameSequence(appliedKeys, expectedKeys.slice(0, appliedKeys.length)) ||
      containsAll(expectedKeys, appliedKeys))
  ) {
    return {
      status: "missing",
      details: [`Missing applied migration identities: ${expectedKeys.filter((key) => !appliedKeys.includes(key)).join(", ")}`]
    };
  }

  if (
    appliedKeys.length > expectedKeys.length &&
    (sameSequence(expectedKeys, appliedKeys.slice(0, expectedKeys.length)) ||
      containsAll(appliedKeys, expectedKeys))
  ) {
    return {
      status: "extra",
      details: [`Extra applied migration identities: ${appliedKeys.filter((key) => !expectedKeys.includes(key)).join(", ")}`]
    };
  }

  if (
    expectedKeys.length === appliedKeys.length &&
    containsAll(expectedKeys, appliedKeys) &&
    containsAll(appliedKeys, expectedKeys)
  ) {
    return {
      status: "reordered",
      details: ["Applied migration identities contain the expected set in a different order."]
    };
  }

  return {
    status: "mismatched",
    details: [
      `Expected migration identities: ${expectedKeys.join(", ")}`,
      `Applied migration identities: ${appliedKeys.join(", ")}`
    ]
  };
};

const inspectMigrationState = async (
  client: Sql,
  migrationsFolder: string
): Promise<MigrationReadinessReport> => {
  const expectedMigrations = readMigrationFiles({ migrationsFolder }).map((migration) => ({
    hash: migration.hash,
    createdAt: String(migration.folderMillis)
  }));
  const expectedMigrationCount = expectedMigrations.length;
  const migrationTableRows = await client<{ present: boolean }[]>`
    select to_regclass('drizzle.__drizzle_migrations') is not null as present
  `;
  const migrationTablePresent = migrationTableRows[0]?.present === true;
  const migrationRows = migrationTablePresent
    ? await client<{ hash: string; createdAt: string }[]>`
        select hash, created_at::text as "createdAt"
        from drizzle.__drizzle_migrations
        order by id
      `
    : [];
  const runtimeRows = await client<{
    serverVersion: string;
    pgvectorAvailable: boolean;
    pgvectorVersion: string | null;
  }[]>`
    select
      current_setting('server_version') as "serverVersion",
      exists (
        select 1
        from pg_extension
        where extname = 'vector'
      ) as "pgvectorAvailable",
      (
        select extversion
        from pg_extension
        where extname = 'vector'
      ) as "pgvectorVersion"
  `;
  const appliedMigrationCount = migrationRows.length;
  const runtime = runtimeRows[0];
  const pgvectorAvailable = runtime?.pgvectorAvailable === true;
  const migrationIdentity = migrationTablePresent
    ? compareMigrationIdentities(expectedMigrations, migrationRows)
    : {
        status: "unavailable" as const,
        details: ["drizzle.__drizzle_migrations is missing"]
      };

  return {
    migrationsFolder,
    expectedMigrationCount,
    appliedMigrationCount,
    migrationTablePresent,
    migrationIdentityStatus: migrationIdentity.status,
    migrationIdentityDetails: migrationIdentity.details,
    migrationsVerified: migrationIdentity.status === "verified",
    pgvectorAvailable,
    postgresServerVersion: runtime?.serverVersion ?? "unknown",
    ...(runtime?.pgvectorVersion === null || runtime?.pgvectorVersion === undefined
      ? {}
      : { pgvectorVersion: runtime.pgvectorVersion })
  };
};

const withSourceAuthorityIntegrity = async (
  input: MigrationReadinessInput,
  report: MigrationReadinessReport
): Promise<MigrationReadinessReport> => ({
  ...report,
  sourceAuthorityIntegrity: await inspectSourceAuthorityIntegrity({
    databaseUrl: input.databaseUrl,
    storeName: "postgres",
    schemaIdentity: `${report.migrationIdentityStatus}:${report.appliedMigrationCount}/${report.expectedMigrationCount}`
  })
});

const withMigrationClient = async (
  input: MigrationReadinessInput,
  task: (client: Sql) => Promise<MigrationReadinessReport>
): Promise<MigrationReadinessReport> => {
  const databaseUrl = input.databaseUrl.trim();

  if (databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for migration readiness");
  }

  const client = postgres(databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });

  try {
    await client`select 1`;
    return await task(client);
  } finally {
    await client.end();
  }
};

export const inspectMigrationReadiness = (
  input: MigrationReadinessInput
): Promise<MigrationReadinessReport> => withMigrationClient(
  input,
  async (client) => {
    const report = await inspectMigrationState(client, input.migrationsFolder);
    return withSourceAuthorityIntegrity(input, report);
  }
);

export const runMigrationReadinessCheck = async (
  input: MigrationReadinessInput
): Promise<MigrationReadinessReport> => withMigrationClient(
  input,
  async (client) => {
    const db = createKrnDatabase(client);
    await applyMigrations(db, {
      migrationsFolder: input.migrationsFolder
    });

    const report = await inspectMigrationState(client, input.migrationsFolder);
    return withSourceAuthorityIntegrity(input, report);
  }
);
