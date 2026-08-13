import type {
  MemoryRepository,
  ProjectRepository,
  SourceRepository
} from "@krn/core/repositories/internal";
import {
  migrate as migrateSqlite
} from "drizzle-orm/better-sqlite3/migrator";
import {
  eq
} from "drizzle-orm";

import type {
  BackendConfig
} from "./backend-config.js";
import {
  sqliteMigrationsFolder
} from "./migration-assets.js";
import {
  SqliteMemoryLifecycleRepository
} from "./repositories/sqlite-memory-lifecycle-repository.js";
import type {
  SqliteMemoryLifecycleRepositoryPort
} from "./repositories/sqlite-memory-lifecycle-repository.js";
import {
  SqliteProjectRepository
} from "./repositories/sqlite-project-repository.js";
import {
  SqliteSourceClaimRepository
} from "./repositories/sqlite-source-claim-repository.js";
import {
  executionRuns,
  harnessPlans,
  operatorIntents,
  taskContracts
} from "./schema/sqlite/harness.js";
import {
  openKrnSqliteDatabase
} from "./sqlite-database.js";
import {
  assertSqliteStoreReady,
  inspectOpenSqliteStore
} from "./sqlite-migration-readiness.js";
import {
  openPostgresRuntime
} from "./postgres-memory-store.js";

export interface MemoryLifecycleStore {
  readonly backend: BackendConfig["kind"];
  readonly persistenceLabel: string;
  readonly projectRepository: Pick<ProjectRepository, "getProjectByRepoPath">;
  readonly memoryRepository: SqliteMemoryLifecycleRepositoryPort | Pick<
    MemoryRepository,
    | "createMemoryCandidate"
    | "getMemoryCandidateById"
    | "promoteReviewedMemoryCandidate"
    | "listActiveMemory"
    | "recordMemoryFeedbackWithPacketBinding"
  >;
  readonly sourceRepository: Pick<SourceRepository, "getSourceClaimById"> & {
    getSourceClaimForProject: NonNullable<SourceRepository["getSourceClaimForProject"]>;
  };
  resolveExecutionRunProjectId(executionRunId: string): Promise<string | undefined>;
  /** Run repository reads under a connection-local write guard. */
  withReadOnly<T>(operation: () => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

const openSqliteMemoryLifecycleStore = async (
  config: Extract<BackendConfig, { kind: "sqlite" }>,
  options: { readonly readonly?: boolean }
): Promise<MemoryLifecycleStore> => {
  const readonly = options.readonly === true;
  const connection = await openKrnSqliteDatabase(config.dbPath, readonly
    ? { readonly: true, fileMustExist: true }
    : { createParent: true });
  try {
    if (!readonly) {
      migrateSqlite(connection.db, { migrationsFolder: sqliteMigrationsFolder });
    }
    assertSqliteStoreReady(await inspectOpenSqliteStore(connection));
  } catch (error) {
    connection.close();
    throw error;
  }
  const projectRepository = new SqliteProjectRepository(connection.db);
  let readOnlyTail = Promise.resolve();
  return {
    backend: "sqlite",
    persistenceLabel: "SQLite",
    projectRepository,
    memoryRepository: new SqliteMemoryLifecycleRepository(connection.db, connection),
    sourceRepository: new SqliteSourceClaimRepository(connection.db),
    async resolveExecutionRunProjectId(executionRunId: string): Promise<string | undefined> {
      const row = connection.db.select({
        taskProjectId: taskContracts.projectId,
        intentProjectId: operatorIntents.projectId
      }).from(executionRuns)
        .innerJoin(harnessPlans, eq(executionRuns.harnessPlanId, harnessPlans.id))
        .innerJoin(taskContracts, eq(harnessPlans.taskContractId, taskContracts.id))
        .innerJoin(operatorIntents, eq(taskContracts.operatorIntentId, operatorIntents.id))
        .where(eq(executionRuns.id, executionRunId))
        .get();
      return row?.taskProjectId ?? row?.intentProjectId ?? undefined;
    },
    async withReadOnly<T>(operation: () => Promise<T>): Promise<T> {
      const predecessor = readOnlyTail;
      let release!: () => void;
      readOnlyTail = new Promise<void>((resolve) => {
        release = resolve;
      });
      await predecessor;
      let prior: number | undefined;
      try {
        prior = Number(connection.client.pragma("query_only", { simple: true }));
        if (prior !== 0 && prior !== 1) {
          throw new Error(`SQLite query_only returned an invalid value: ${String(prior)}`);
        }
        connection.client.pragma("query_only = ON");
        return await operation();
      } finally {
        try {
          if (prior !== undefined) {
            connection.client.pragma(`query_only = ${prior === 1 ? "ON" : "OFF"}`);
          }
        } finally {
          release();
        }
      }
    },
    async close(): Promise<void> {
      connection.close();
    }
  };
};

const openPostgresMemoryLifecycleStore = async (
  config: Extract<BackendConfig, { kind: "postgres" }>
): Promise<MemoryLifecycleStore> => {
  if (config.databaseUrl === undefined) {
    throw new Error("KRN_DATABASE_URL is required for persisted memory commands");
  }
  const runtime = await openPostgresRuntime(config.databaseUrl);
  const sourceRepository = runtime.sourceRepository;
  if (sourceRepository.getSourceClaimForProject === undefined) {
    await runtime.close();
    throw new Error("Project-scoped SourceClaim lookup is unavailable");
  }
  const scopedReader = sourceRepository.getSourceClaimForProject.bind(sourceRepository);
  return {
    backend: "postgres",
    persistenceLabel: "Postgres",
    projectRepository: runtime.projectRepository,
    memoryRepository: runtime.memoryRepository,
    sourceRepository: {
      getSourceClaimById: sourceRepository.getSourceClaimById.bind(sourceRepository),
      getSourceClaimForProject: scopedReader
    },
    async resolveExecutionRunProjectId(executionRunId: string): Promise<string | undefined> {
      const run = await runtime.harnessRunRepository.getHarnessRunByExecutionRunId(executionRunId);
      return run?.taskContract.projectId ?? run?.operatorIntent.projectId;
    },
    async withReadOnly<T>(operation: () => Promise<T>): Promise<T> {
      return operation();
    },
    close: runtime.close
  };
};

export const openMemoryLifecycleStore = async (
  config: BackendConfig,
  options: { readonly readonly?: boolean } = {}
): Promise<MemoryLifecycleStore> => config.kind === "sqlite"
  ? openSqliteMemoryLifecycleStore(config, options)
  : openPostgresMemoryLifecycleStore(config);
