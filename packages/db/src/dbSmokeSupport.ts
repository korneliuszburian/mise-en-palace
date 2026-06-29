import {
  eq,
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
import {
  DrizzleProjectRepository
} from "./repositories/index.js";
import {
  antiMemoryRecords,
  contextExclusions,
  contextItems,
  memoryRecords,
  memoryRecordVersions,
  retrievalRuns,
  runEvents,
  searchDocuments,
  sourceArtifacts,
  sourceClaims,
  sourceDecisions,
  workspaces
} from "./schema/index.js";

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

export interface SmokeRuntimeInput {
  databaseUrl: string;
  migrationsFolder: string;
  projectSlug: string;
  smokeId: string;
  smokeName: string;
  workspacePrefix: string;
}

export interface SmokeRuntime {
  client: Sql;
  db: KrnDatabase;
  marker: string;
  projectSlug: string;
  workspaceSlug: string;
}

export interface SmokeContextSelectionCounts {
  contextExclusionCount: number;
  contextItemCount: number;
}

export interface SmokeReadbackCheck {
  label: string;
  passed: boolean;
}

type SmokeCountTask = () => Promise<number>;
type SmokeCleanupTask = () => Promise<void>;

interface SmokeBaseMarkerCountInput {
  contextAssemblyId: string | undefined;
  db: KrnDatabase;
  extraTasks?: readonly SmokeCountTask[];
  marker: string;
  workspaceSlug: string;
}

export interface SmokeCleanupInput {
  beforeSourceClaimDeleteTasks?: readonly SmokeCleanupTask[];
  db: KrnDatabase;
  marker: string;
  workspaceSlug: string;
}

export interface SmokeMarkerRowInput {
  contextAssemblyId: string | undefined;
  db: KrnDatabase;
  marker: string;
  workspaceSlug: string;
}

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

export const createSmokeRuntime = async (
  input: SmokeRuntimeInput
): Promise<SmokeRuntime> => {
  await ensureSmokeBrainStoreReady(
    input.databaseUrl,
    input.migrationsFolder,
    input.smokeName
  );

  const marker = normalizeSmokeSlugPart(input.smokeId);
  const { client, db } = createSmokeDatabase(input.databaseUrl);

  return {
    client,
    db,
    marker,
    projectSlug: input.projectSlug,
    workspaceSlug: `${input.workspacePrefix}-${marker}`
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


const countMemoryRecordVersionsForSmoke = async (
  db: KrnDatabase,
  marker: string
): Promise<number> => {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(memoryRecordVersions)
    .innerJoin(memoryRecords, eq(memoryRecordVersions.memoryRecordId, memoryRecords.id))
    .where(sql`${memoryRecords.metadata}->>'smokeId' = ${marker}`);

  return rows[0]?.count ?? 0;
};

export const countActivationSmokeMarkerRows = async (
  input: SmokeMarkerRowInput
): Promise<number> => countSmokeBaseMarkerRows({
  ...input,
  extraTasks: [
    () => countSmokeRows(input.db, memoryRecords, sql`${memoryRecords.metadata}->>'smokeId' = ${input.marker}`),
    () => countMemoryRecordVersionsForSmoke(input.db, input.marker),
    () => countSmokeRows(input.db, antiMemoryRecords, sql`${antiMemoryRecords.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, searchDocuments, sql`${searchDocuments.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, retrievalRuns, sql`${retrievalRuns.metadata}->>'smokeId' = ${input.marker}`)
  ]
});

export const countRetrievalSubstrateSmokeMarkerRows = async (
  input: SmokeMarkerRowInput
): Promise<number> => countSmokeBaseMarkerRows({
  ...input,
  extraTasks: [
    () => countSmokeRows(input.db, sourceDecisions, sql`${sourceDecisions.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, memoryRecords, sql`${memoryRecords.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, memoryRecordVersions, sql`${memoryRecordVersions.metadata}->>'smokeId' = ${input.marker}`)
  ]
});

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

const countSmokeBaseMarkerRows = async (
  input: SmokeBaseMarkerCountInput
): Promise<number> => sumSmokeCountTasks([
  () => countSmokeRows(input.db, workspaces, eq(workspaces.slug, input.workspaceSlug)),
  () => countSmokeRows(input.db, sourceArtifacts, sql`${sourceArtifacts.metadata}->>'smokeId' = ${input.marker}`),
  () => countSmokeRows(input.db, sourceClaims, sql`${sourceClaims.metadata}->>'smokeId' = ${input.marker}`),
  () => countSmokeRows(input.db, runEvents, sql`${runEvents.payload}->>'smokeId' = ${input.marker}`),
  countOptionalSmokeContextSelectionRows(input.db, input.contextAssemblyId),
  ...(input.extraTasks ?? [])
]);

export const optionalSmokeCount = <Value>(
  value: Value | undefined,
  task: (value: Value) => Promise<number>
): SmokeCountTask => async () => (
  value === undefined ? 0 : task(value)
);

export const countSmokeContextSelectionRows = async (
  db: KrnDatabase,
  contextAssemblyId: string
): Promise<SmokeContextSelectionCounts> => {
  const contextItemRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contextItems)
    .where(eq(contextItems.contextAssemblyId, contextAssemblyId));
  const contextExclusionRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contextExclusions)
    .where(eq(contextExclusions.contextAssemblyId, contextAssemblyId));

  return {
    contextItemCount: contextItemRows[0]?.count ?? 0,
    contextExclusionCount: contextExclusionRows[0]?.count ?? 0
  };
};

const countOptionalSmokeContextSelectionRows = (
  db: KrnDatabase,
  contextAssemblyId: string | undefined
): SmokeCountTask => optionalSmokeCount(
  contextAssemblyId,
  async (id) => {
    const counts = await countSmokeContextSelectionRows(db, id);

    return counts.contextItemCount + counts.contextExclusionCount;
  }
);

export const assertSmokeReadbackChecks = (
  checks: readonly SmokeReadbackCheck[],
  message: string
): void => {
  const failedCheck = checks.find((check) => !check.passed);

  if (failedCheck !== undefined) {
    throw new Error(`${message}: ${failedCheck.label}`);
  }
};

export const requireSmokeReadbackValue = <Value>(
  value: Value | undefined,
  label: string,
  message: string
): Value => {
  if (value === undefined) {
    throw new Error(`${message}: ${label}`);
  }

  return value;
};

const cleanupSmokeBaseRows = async (
  input: SmokeCleanupInput
): Promise<void> => {
  for (const task of input.beforeSourceClaimDeleteTasks ?? []) {
    await task();
  }

  await input.db
    .delete(sourceClaims)
    .where(sql`${sourceClaims.metadata}->>'smokeId' = ${input.marker}`);
  await input.db
    .delete(sourceArtifacts)
    .where(sql`${sourceArtifacts.metadata}->>'smokeId' = ${input.marker}`);
  await input.db
    .delete(runEvents)
    .where(sql`${runEvents.payload}->>'smokeId' = ${input.marker}`);
  await input.db
    .delete(workspaces)
    .where(eq(workspaces.slug, input.workspaceSlug));
};

export const cleanupActivationSmokeRows = async (
  input: Omit<SmokeCleanupInput, "beforeSourceClaimDeleteTasks">
): Promise<void> => {
  await cleanupSmokeBaseRows({
    ...input,
    beforeSourceClaimDeleteTasks: [
      async () => {
        await input.db
          .delete(antiMemoryRecords)
          .where(sql`${antiMemoryRecords.metadata}->>'smokeId' = ${input.marker}`);
      },
      async () => {
        await input.db
          .delete(memoryRecords)
          .where(sql`${memoryRecords.metadata}->>'smokeId' = ${input.marker}`);
      }
    ]
  });
};

export const cleanupRetrievalSubstrateSmokeRows = async (
  input: Omit<SmokeCleanupInput, "beforeSourceClaimDeleteTasks">
): Promise<void> => {
  await cleanupSmokeBaseRows({
    ...input,
    beforeSourceClaimDeleteTasks: [
      async () => {
        await input.db
          .delete(memoryRecordVersions)
          .where(sql`${memoryRecordVersions.metadata}->>'smokeId' = ${input.marker}`);
      },
      async () => {
        await input.db
          .delete(memoryRecords)
          .where(sql`${memoryRecords.metadata}->>'smokeId' = ${input.marker}`);
      },
      async () => {
        await input.db
          .delete(sourceDecisions)
          .where(sql`${sourceDecisions.metadata}->>'smokeId' = ${input.marker}`);
      }
    ]
  });
};

export const sumSmokeCountTasks = async (
  tasks: readonly SmokeCountTask[]
): Promise<number> => {
  let total = 0;

  for (const task of tasks) {
    total += await task();
  }

  return total;
};
