import { readMigrationFiles } from "drizzle-orm/migrator";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { sqliteMigrationsFolder } from "./migration-assets.js";
import { workspaces as schemaProbe } from "./schema/sqlite/harness.js";
import { openKrnSqliteDatabase } from "./sqlite-database.js";

const requiredTables = [
  "workspaces",
  "projects",
  "memory_candidates",
  "memory_records",
  "source_claims",
  "embedding_models",
  "embeddings"
] as const;

export interface SqliteMigrationReadinessReport {
  readonly appliedMigrationCount: number;
  readonly connectivityReady: boolean;
  readonly expectedMigrationCount: number;
  readonly foreignKeyViolations: number;
  readonly integrityReady: boolean;
  readonly migrationsFolder: string;
  readonly migrationsVerified: boolean;
  readonly repositoryReachabilityReady: boolean;
  readonly schemaPresent: boolean;
}

const inspectOpenStore = (
  connection: Awaited<ReturnType<typeof openKrnSqliteDatabase>>
): SqliteMigrationReadinessReport => {
  const expectedMigrationCount = readMigrationFiles({
    migrationsFolder: sqliteMigrationsFolder
  }).length;
  const appliedMigrationCount = connection.client
    .prepare("select count(*) as count from __drizzle_migrations")
    .get() as { count: number } | undefined;
  const presentTables = new Set(
    (connection.client.prepare(
      "select name from sqlite_master where type = 'table'"
    ).all() as { name: string }[]).map((row) => row.name)
  );
  const foreignKeyViolations = (connection.client.pragma("foreign_key_check") as unknown[]).length;
  const integrityRows = connection.client.pragma("integrity_check") as { integrity_check: string }[];
  const repositoryProbe = connection.db.select().from(schemaProbe).limit(1).all();
  const appliedCount = appliedMigrationCount?.count ?? 0;

  return {
    appliedMigrationCount: appliedCount,
    connectivityReady: true,
    expectedMigrationCount,
    foreignKeyViolations,
    integrityReady: integrityRows.length === 1 && integrityRows[0]?.integrity_check === "ok",
    migrationsFolder: sqliteMigrationsFolder,
    migrationsVerified: appliedCount === expectedMigrationCount,
    repositoryReachabilityReady: Array.isArray(repositoryProbe),
    schemaPresent: requiredTables.every((table) => presentTables.has(table))
  };
};

export const inspectSqliteMigrationReadiness = async (
  dbPath: string
): Promise<SqliteMigrationReadinessReport> => {
  const connection = await openKrnSqliteDatabase(dbPath);

  try {
    return inspectOpenStore(connection);
  } finally {
    connection.close();
  }
};

export const migrateSqliteDatabase = async (
  dbPath: string
): Promise<SqliteMigrationReadinessReport> => {
  const connection = await openKrnSqliteDatabase(dbPath, { createParent: true });

  try {
    migrate(connection.db, { migrationsFolder: sqliteMigrationsFolder });
    return inspectOpenStore(connection);
  } finally {
    connection.close();
  }
};
