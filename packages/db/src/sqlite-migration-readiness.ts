import {
  getTableName,
  is,
  Table
} from "drizzle-orm";
import BetterSqlite3 from "better-sqlite3";
import {
  drizzle
} from "drizzle-orm/better-sqlite3";
import {
  readMigrationFiles
} from "drizzle-orm/migrator";
import {
  migrate
} from "drizzle-orm/better-sqlite3/migrator";

import {
  compareMigrationIdentities
} from "./migration-readiness.js";
import type {
  MigrationIdentityStatus
} from "./migration-readiness.js";
import {
  sqliteMigrationsFolder
} from "./migration-assets.js";
import {
  SqliteProjectRepository
} from "./repositories/sqlite-project-repository.js";
import {
  openKrnSqliteDatabase
} from "./sqlite-database.js";
import type {
  KrnSqliteConnection
} from "./sqlite-database.js";
import * as sqliteSchema from "./schema/sqlite/index.js";

const schemaTableNames = Object.values(sqliteSchema)
  .flatMap((value): string[] => is(value, Table) ? [getTableName(value)] : [])
  .filter((name, index, names) => names.indexOf(name) === index)
  .sort();

interface SqliteSchemaEntry {
  readonly name: string;
  readonly sql: string | null;
  readonly tableName: string;
  readonly type: string;
}

const readSchemaEntries = (
  client: BetterSqlite3.Database
): readonly SqliteSchemaEntry[] => client.prepare(`
  select type, name, tbl_name as tableName, sql
  from sqlite_master
  where type in ('table', 'index', 'trigger', 'view')
    and name not like 'sqlite_%'
  order by type, name
`).all() as SqliteSchemaEntry[];

let expectedSchemaEntries: readonly SqliteSchemaEntry[] | undefined;

const packageSchemaEntries = (): readonly SqliteSchemaEntry[] => {
  if (expectedSchemaEntries !== undefined) {
    return expectedSchemaEntries;
  }

  const client = new BetterSqlite3(":memory:");
  try {
    client.pragma("foreign_keys = ON");
    migrate(drizzle(client, { schema: sqliteSchema }), {
      migrationsFolder: sqliteMigrationsFolder
    });
    expectedSchemaEntries = readSchemaEntries(client);
    return expectedSchemaEntries;
  } finally {
    client.close();
  }
};

const sameSchemaEntries = (
  actual: readonly SqliteSchemaEntry[]
): boolean => JSON.stringify(actual) === JSON.stringify(packageSchemaEntries());

export interface SqliteMigrationReadinessReport {
  readonly appliedMigrationCount: number;
  readonly connectivityReady: boolean;
  readonly expectedMigrationCount: number;
  readonly foreignKeysEnabled: boolean;
  readonly foreignKeyViolations: number;
  readonly integrityReady: boolean;
  readonly journalMode: string;
  readonly migrationIdentityDetails: readonly string[];
  readonly migrationIdentityStatus: MigrationIdentityStatus;
  readonly migrationsFolder: string;
  readonly migrationsVerified: boolean;
  readonly migrationTablePresent: boolean;
  readonly repositoryReachabilityReady: boolean;
  readonly schemaPresent: boolean;
}

export const sqliteStoreIsReady = (
  report: SqliteMigrationReadinessReport
): boolean =>
  report.connectivityReady &&
  report.migrationsVerified &&
  report.schemaPresent &&
  report.repositoryReachabilityReady &&
  report.journalMode === "wal" &&
  report.foreignKeysEnabled &&
  report.foreignKeyViolations === 0 &&
  report.integrityReady;

export const assertSqliteStoreReady = (
  report: SqliteMigrationReadinessReport
): void => {
  if (sqliteStoreIsReady(report)) {
    return;
  }

  const failures = [
    ...(report.connectivityReady ? [] : ["connectivity failed"]),
    ...(report.migrationsVerified
      ? []
      : [`migration identity ${report.migrationIdentityStatus}`]),
    ...(report.schemaPresent ? [] : ["schema drift detected"]),
    ...(report.repositoryReachabilityReady ? [] : ["repository reachability failed"]),
    ...(report.journalMode === "wal" ? [] : [`journal mode is ${report.journalMode}`]),
    ...(report.foreignKeysEnabled ? [] : ["foreign keys are disabled"]),
    ...(report.foreignKeyViolations === 0
      ? []
      : [`${report.foreignKeyViolations} foreign key violations`]),
    ...(report.integrityReady ? [] : ["integrity check failed"])
  ];

  throw new Error(`SQLite store is not ready: ${failures.join("; ")}`);
};

const expectedMigrations = () => readMigrationFiles({
  migrationsFolder: sqliteMigrationsFolder
}).map((migration) => ({
  hash: migration.hash,
  createdAt: String(migration.folderMillis)
}));

export const inspectOpenSqliteStore = async (
  connection: KrnSqliteConnection
): Promise<SqliteMigrationReadinessReport> => {
  const expected = expectedMigrations();
  const tableRows = connection.client.prepare(
    "select name from sqlite_master where type = 'table'"
  ).all() as { name: string }[];
  const presentTables = new Set(tableRows.map((row) => row.name));
  const schemaEntries = readSchemaEntries(connection.client);
  const migrationTablePresent = presentTables.has("__drizzle_migrations");
  const applied = migrationTablePresent
    ? (connection.client.prepare(
        "select hash, cast(created_at as text) as createdAt from __drizzle_migrations order by created_at asc"
      ).all() as { hash: string; createdAt: string }[])
    : [];
  const identity = migrationTablePresent
    ? compareMigrationIdentities(expected, applied)
    : { status: "unavailable" as const, details: ["SQLite migration table is missing."] };
  const foreignKeyViolations = (connection.client.pragma("foreign_key_check") as unknown[]).length;
  const integrityRows = connection.client.pragma("integrity_check") as { integrity_check: string }[];
  const journalMode = String(connection.client.pragma("journal_mode", { simple: true }));
  connection.client.pragma("foreign_keys = ON");
  const foreignKeysEnabled = connection.client.pragma("foreign_keys", { simple: true }) === 1;
  let repositoryReachabilityReady = false;
  if (presentTables.has("workspaces")) {
    await new SqliteProjectRepository(connection.db)
      .findWorkspaceBySlug("__krn_doctor_repository_probe__");
    repositoryReachabilityReady = true;
  }

  return {
    appliedMigrationCount: applied.length,
    connectivityReady: true,
    expectedMigrationCount: expected.length,
    foreignKeysEnabled,
    foreignKeyViolations,
    integrityReady: integrityRows.length === 1 && integrityRows[0]?.integrity_check === "ok",
    journalMode,
    migrationIdentityDetails: identity.details,
    migrationIdentityStatus: identity.status,
    migrationsFolder: sqliteMigrationsFolder,
    migrationsVerified: identity.status === "verified",
    migrationTablePresent,
    repositoryReachabilityReady,
    schemaPresent: schemaTableNames.length === 51 &&
      schemaTableNames.every((table) => presentTables.has(table)) &&
      sameSchemaEntries(schemaEntries)
  };
};

export const inspectSqliteMigrationReadiness = async (
  dbPath: string
): Promise<SqliteMigrationReadinessReport> => {
  const connection = await openKrnSqliteDatabase(dbPath, {
    readonly: true,
    fileMustExist: true
  });

  try {
    return await inspectOpenSqliteStore(connection);
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
    return await inspectOpenSqliteStore(connection);
  } finally {
    connection.close();
  }
};
