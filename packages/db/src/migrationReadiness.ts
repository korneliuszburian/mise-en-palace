import { readMigrationFiles } from "drizzle-orm/migrator";
import { migrate as applyMigrations } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import type { Sql } from "postgres";

import { createKrnDatabase } from "./database.js";

export interface MigrationReadinessInput {
  databaseUrl: string;
  migrationsFolder: string;
}

export interface MigrationReadinessReport {
  migrationsFolder: string;
  expectedMigrationCount: number;
  appliedMigrationCount: number;
  migrationTablePresent: boolean;
  migrationsVerified: boolean;
  pgvectorAvailable: boolean;
}

const inspectMigrationState = async (
  client: Sql,
  migrationsFolder: string
): Promise<MigrationReadinessReport> => {
  const expectedMigrationCount = readMigrationFiles({
    migrationsFolder
  }).length;
  const migrationTableRows = await client<{ present: boolean }[]>`
    select to_regclass('drizzle.__drizzle_migrations') is not null as present
  `;
  const migrationTablePresent = migrationTableRows[0]?.present === true;
  const migrationRows = migrationTablePresent
    ? await client<{ appliedCount: number }[]>`
        select count(*)::int as "appliedCount"
        from drizzle.__drizzle_migrations
      `
    : [];
  const vectorRows = await client<{ available: boolean }[]>`
    select exists (
      select 1
      from pg_extension
      where extname = 'vector'
    ) as available
  `;
  const appliedMigrationCount = migrationRows[0]?.appliedCount ?? 0;
  const pgvectorAvailable = vectorRows[0]?.available === true;

  return {
    migrationsFolder,
    expectedMigrationCount,
    appliedMigrationCount,
    migrationTablePresent,
    migrationsVerified:
      migrationTablePresent && appliedMigrationCount === expectedMigrationCount,
    pgvectorAvailable
  };
};

export const inspectMigrationReadiness = async (
  input: MigrationReadinessInput
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
    return await inspectMigrationState(client, input.migrationsFolder);
  } finally {
    await client.end();
  }
};

export const runMigrationReadinessCheck = async (
  input: MigrationReadinessInput
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

    const db = createKrnDatabase(client);
    await applyMigrations(db, {
      migrationsFolder: input.migrationsFolder
    });

    return await inspectMigrationState(client, input.migrationsFolder);
  } finally {
    await client.end();
  }
};
