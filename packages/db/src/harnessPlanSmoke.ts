import postgres from "postgres";
import { eq, sql } from "drizzle-orm";
import {
  compileHarnessPlan
} from "@krn/harness";

import { createKrnDatabase } from "./database.js";
import { runMigrationReadinessCheck } from "./migrationReadiness.js";
import {
  DrizzleHarnessRunRepository,
  DrizzleMemoryRepository,
  DrizzleProjectRepository,
  DrizzleRetrievalRepository,
  DrizzleSourceRepository
} from "./repositories/index.js";
import {
  retrievalRuns,
  runEvents,
  workspaces
} from "./schema/index.js";

export interface HarnessPlanSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface HarnessPlanSmokeReport {
  workspaceSlug: string;
  projectSlug: string;
  executionRunId: string;
  readBackExecutionRunId: string;
  evidenceCommandCount: number;
  runEventCount: number;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

const normalizeSlugPart = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalized.length === 0 ? "local" : normalized;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const countRows = async (
  db: ReturnType<typeof createKrnDatabase>,
  workspaceSlug: string,
  marker: string,
  retrievalRunId: string | undefined
): Promise<number> => {
  const workspaceRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workspaces)
    .where(eq(workspaces.slug, workspaceSlug));
  const eventRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(runEvents)
    .where(sql`${runEvents.payload}->>'smokeId' = ${marker}`);
  const retrievalRows =
    retrievalRunId === undefined
      ? [{ count: 0 }]
      : await db
          .select({ count: sql<number>`count(*)::int` })
          .from(retrievalRuns)
          .where(eq(retrievalRuns.id, retrievalRunId));

  return (
    (workspaceRows[0]?.count ?? 0) +
    (eventRows[0]?.count ?? 0) +
    (retrievalRows[0]?.count ?? 0)
  );
};

export const runHarnessPlanSmokeCheck = async (
  input: HarnessPlanSmokeInput
): Promise<HarnessPlanSmokeReport> => {
  const readiness = await runMigrationReadinessCheck({
    databaseUrl: input.databaseUrl,
    migrationsFolder: input.migrationsFolder
  });

  if (!readiness.migrationsVerified || !readiness.pgvectorAvailable) {
    throw new Error("Brain store is not ready for harness plan smoke");
  }

  const marker = normalizeSlugPart(input.smokeId);
  const workspaceSlug = `krn-harness-smoke-${marker}`;
  const projectSlug = "persisted-harness-plan";
  const task = `persisted harness plan smoke ${marker}`;
  const client = postgres(input.databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });
  const db = createKrnDatabase(client);
  let retrievalRunId: string | undefined;

  const cleanup = async (): Promise<number> => {
    await db.delete(runEvents).where(sql`${runEvents.payload}->>'smokeId' = ${marker}`);

    if (retrievalRunId !== undefined) {
      await db.delete(retrievalRuns).where(eq(retrievalRuns.id, retrievalRunId));
    }

    await db.delete(workspaces).where(eq(workspaces.slug, workspaceSlug));

    return countRows(db, workspaceSlug, marker, retrievalRunId);
  };

  try {
    await cleanup();

    const projectRepository = new DrizzleProjectRepository(db);
    const harnessRunRepository = new DrizzleHarnessRunRepository(db);
    const workspace = await projectRepository.createWorkspace({
      slug: workspaceSlug,
      displayName: workspaceSlug,
      metadata: {
        smoke: true,
        smokeId: marker
      }
    });
    const project = await projectRepository.createProject({
      workspaceId: workspace.id,
      slug: projectSlug,
      displayName: projectSlug,
      metadata: {
        smoke: true,
        smokeId: marker
      }
    });
    let idCounter = 0;
    const result = await compileHarnessPlan(
      {
        workspaceId: workspace.id,
        projectId: project.id,
        operatorIntent: {
          rawIntent: task,
          source: "cli",
          metadata: {
            smokeId: marker
          }
        },
        taskContract: {
          title: task,
          objective: task,
          constraints: ["preserve strict TypeScript boundaries"],
          nonGoals: ["do not mutate memory"],
          acceptance: ["read back persisted run aggregate"],
          metadata: {
            smokeId: marker
          }
        },
        tokenBudget: 1200,
        metadata: {
          command: "db:smoke:harness-plan",
          smokeId: marker
        }
      },
      {
        harnessRunRepository,
        memoryRepository: new DrizzleMemoryRepository(db),
        sourceRepository: new DrizzleSourceRepository(db),
        retrievalRepository: new DrizzleRetrievalRepository(db),
        now: () => new Date().toISOString(),
        createId: (prefix) => {
          idCounter += 1;
          return `${prefix}-${marker}-${idCounter}`;
        }
      }
    );
    const maybeRetrievalRunId = result.contextAssembly.metadata.retrievalRunId;
    retrievalRunId = typeof maybeRetrievalRunId === "string" ? maybeRetrievalRunId : undefined;
    const executionRun = await harnessRunRepository.createExecutionRun({
      harnessPlanId: result.harnessPlan.id,
      adapter: "codex",
      status: "planned",
      initialEvent: {
        sequence: 1,
        type: "smoke.harness_plan.persisted",
        message: "Persisted harness plan smoke created",
        payload: {
          smokeId: marker,
          operatorIntentId: result.operatorIntent.id,
          taskContractId: result.taskContract.id,
          harnessPlanId: result.harnessPlan.id,
          contextAssemblyId: result.contextAssembly.id
        }
      },
      metadata: {
        smokeId: marker,
        evidenceContract: result.evidenceContract
      }
    });
    const readBack = await harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id);

    if (readBack === undefined) {
      throw new Error("Harness plan smoke failed to read back execution run");
    }

    const evidenceContract = readBack.harnessPlan.metadata.evidenceContract;
    const evidenceCommands = isRecord(evidenceContract)
      ? evidenceContract.commands
      : undefined;

    if (
      readBack.executionRun.id !== executionRun.id ||
      readBack.operatorIntent.id !== result.operatorIntent.id ||
      readBack.taskContract.id !== result.taskContract.id ||
      readBack.harnessPlan.id !== result.harnessPlan.id ||
      readBack.contextAssembly?.id !== result.contextAssembly.id ||
      !Array.isArray(evidenceCommands) ||
      evidenceCommands.length !== result.evidenceContract.commands.length ||
      readBack.runEvents.length === 0
    ) {
      throw new Error("Harness plan smoke readback did not match persisted fields");
    }

    const remainingMarkerCount = await cleanup();

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      readBackExecutionRunId: readBack.executionRun.id,
      evidenceCommandCount: evidenceCommands.length,
      runEventCount: readBack.runEvents.length,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } finally {
    await client.end();
  }
};
