import { readMigrationFiles } from "drizzle-orm/migrator";
import { migrate as applyMigrations } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { createKrnDatabase } from "./database.js";

export interface MigrationReadinessInput {
  databaseUrl: string;
  migrationsFolder: string;
}

export interface MigrationReadinessReport {
  migrationsFolder: string;
  expectedMigrationCount: number;
  appliedMigrationCount: number;
  migrationsVerified: boolean;
  pgvectorAvailable: boolean;
}

export const runMigrationReadinessCheck = async (
  input: MigrationReadinessInput
): Promise<MigrationReadinessReport> => {
  const databaseUrl = input.databaseUrl.trim();

  if (databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for migration readiness");
  }

  const expectedMigrationCount = readMigrationFiles({
    migrationsFolder: input.migrationsFolder
  }).length;
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

    const migrationRows = await client<{ appliedCount: number }[]>`
      select count(*)::int as "appliedCount"
      from drizzle.__drizzle_migrations
    `;
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
      migrationsFolder: input.migrationsFolder,
      expectedMigrationCount,
      appliedMigrationCount,
      migrationsVerified: appliedMigrationCount === expectedMigrationCount,
      pgvectorAvailable
    };
  } finally {
    await client.end();
  }
};
