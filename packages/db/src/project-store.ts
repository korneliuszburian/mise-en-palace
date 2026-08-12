import postgres from "postgres";
import type {
  ProjectRepository
} from "@krn/core/repositories/internal";
import { migrate as migrateSqlite } from "drizzle-orm/better-sqlite3/migrator";

import type {
  BackendConfig
} from "./backend-config.js";
import {
  createKrnDatabase
} from "./database.js";
import {
  postgresMigrationsFolder,
  sqliteMigrationsFolder
} from "./migration-assets.js";
import {
  migrateDatabase
} from "./migration-readiness.js";
import {
  DrizzleProjectRepository
} from "./repositories/drizzle-project-repository.js";
import {
  SqliteProjectRepository
} from "./repositories/sqlite-project-repository.js";
import {
  openKrnSqliteDatabase
} from "./sqlite-database.js";
import {
  assertSqliteStoreReady,
  inspectOpenSqliteStore
} from "./sqlite-migration-readiness.js";

export interface ProjectStore {
  readonly backend: BackendConfig["kind"];
  readonly persistenceLabel: string;
  readonly projectRepository: ProjectRepository;
  close(): Promise<void>;
}

const openPostgresProjectStore = async (
  config: Extract<BackendConfig, { kind: "postgres" }>
): Promise<ProjectStore> => {
  if (config.databaseUrl === undefined) {
    throw new Error("KRN_DATABASE_URL is required for krn init --connect --persist");
  }

  const migrationReport = await migrateDatabase({
    databaseUrl: config.databaseUrl,
    migrationsFolder: postgresMigrationsFolder
  });
  if (!migrationReport.migrationsVerified) {
    throw new Error(
      `Postgres store is not ready: migration identity ${migrationReport.migrationIdentityStatus}`
    );
  }

  const client = postgres(config.databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });

  return {
    backend: "postgres",
    persistenceLabel: "Postgres",
    projectRepository: new DrizzleProjectRepository(createKrnDatabase(client)),
    async close(): Promise<void> {
      await client.end();
    }
  };
};

const openSqliteProjectStore = async (
  config: Extract<BackendConfig, { kind: "sqlite" }>
): Promise<ProjectStore> => {
  const connection = await openKrnSqliteDatabase(config.dbPath, { createParent: true });

  try {
    migrateSqlite(connection.db, { migrationsFolder: sqliteMigrationsFolder });
    assertSqliteStoreReady(await inspectOpenSqliteStore(connection));
  } catch (error) {
    connection.close();
    throw error;
  }

  return {
    backend: "sqlite",
    persistenceLabel: "SQLite",
    projectRepository: new SqliteProjectRepository(connection.db),
    async close(): Promise<void> {
      connection.close();
    }
  };
};

export const openProjectStore = async (
  config: BackendConfig
): Promise<ProjectStore> => config.kind === "sqlite"
  ? openSqliteProjectStore(config)
  : openPostgresProjectStore(config);
