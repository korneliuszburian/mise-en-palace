import {
  sql
} from "drizzle-orm";
import type {
  SQL
} from "drizzle-orm";
import type {
  AnyPgTable
} from "drizzle-orm/pg-core";
import postgres from "postgres";
import type { Sql } from "postgres";

import type { KrnDatabase } from "./database.js";
import { createKrnDatabase } from "./database.js";
import { runMigrationReadinessCheck } from "./migrationReadiness.js";
import type { DrizzleProjectRepository } from "./repositories/index.js";

type SmokeWorkspaceRecord = Awaited<
  ReturnType<DrizzleProjectRepository["createWorkspace"]>
>;
type SmokeProjectRecord = Awaited<
  ReturnType<DrizzleProjectRepository["createProject"]>
>;

export interface SmokeDatabase {
  client: Sql;
  db: KrnDatabase;
}

export interface SmokeProjectRecords {
  workspace: SmokeWorkspaceRecord;
  project: SmokeProjectRecord;
}

type SmokeCountTask = () => Promise<number>;

const smokeSlugPartLimit = 48;

export const normalizeSmokeSlugPart = (value: string): string => {
  const slug = Array.from(value.trim().toLowerCase())
    .map((character) => (
      /[a-z0-9-]/.test(character) ? character : "-"
    ))
    .join("")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, smokeSlugPartLimit);

  return slug || "local";
};

const smokeMetadata = (marker: string): Record<string, unknown> => ({
  smoke: true,
  smokeId: marker
});

export const ensureSmokeBrainStoreReady = async (
  databaseUrl: string,
  migrationsFolder: string,
  smokeName: string
): Promise<void> => {
  const readiness = await runMigrationReadinessCheck({
    databaseUrl,
    migrationsFolder
  });

  if (!readiness.migrationsVerified || !readiness.pgvectorAvailable) {
    throw new Error(`Brain store is not ready for ${smokeName}`);
  }
};

export const createSmokeDatabase = (databaseUrl: string): SmokeDatabase => {
  const client = postgres(databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });

  return {
    client,
    db: createKrnDatabase(client)
  };
};

export const createSmokeProjectRecords = async (
  projectRepository: DrizzleProjectRepository,
  workspaceSlug: string,
  projectSlug: string,
  marker: string
): Promise<SmokeProjectRecords> => {
  const workspace = await projectRepository.createWorkspace({
    slug: workspaceSlug,
    displayName: workspaceSlug,
    metadata: smokeMetadata(marker)
  });
  const project = await projectRepository.createProject({
    workspaceId: workspace.id,
    slug: projectSlug,
    displayName: projectSlug,
    metadata: smokeMetadata(marker)
  });

  return {
    workspace,
    project
  };
};

export const countSmokeRows = async (
  db: KrnDatabase,
  table: AnyPgTable,
  where: SQL
): Promise<number> => {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(table)
    .where(where);

  return rows[0]?.count ?? 0;
};

export const optionalSmokeCount = <Value>(
  value: Value | undefined,
  task: (value: Value) => Promise<number>
): SmokeCountTask => async () => (
  value === undefined ? 0 : task(value)
);

export const sumSmokeCountTasks = async (
  tasks: readonly SmokeCountTask[]
): Promise<number> => {
  let total = 0;

  for (const task of tasks) {
    total += await task();
  }

  return total;
};
