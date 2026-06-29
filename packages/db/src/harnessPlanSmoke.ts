import { eq, sql } from "drizzle-orm";
import {
  compileHarnessPlan
} from "@krn/harness";

import type { KrnDatabase } from "./database.js";
import {
  countSmokeRows,
  createSmokeDatabase,
  createSmokeProjectRecords,
  ensureSmokeBrainStoreReady,
  normalizeSmokeSlugPart,
  optionalSmokeCount,
  sumSmokeCountTasks
} from "./dbSmokeSupport.js";
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const countRows = async (
  db: KrnDatabase,
  workspaceSlug: string,
  marker: string,
  retrievalRunId: string | undefined
): Promise<number> => {
  return sumSmokeCountTasks([
    () => countSmokeRows(db, workspaces, eq(workspaces.slug, workspaceSlug)),
    () => countSmokeRows(db, runEvents, sql`${runEvents.payload}->>'smokeId' = ${marker}`),
    optionalSmokeCount(
      retrievalRunId,
      (id) => countSmokeRows(db, retrievalRuns, eq(retrievalRuns.id, id))
    )
  ]);
};

export const runHarnessPlanSmokeCheck = async (
  input: HarnessPlanSmokeInput
): Promise<HarnessPlanSmokeReport> => {
  await ensureSmokeBrainStoreReady(
    input.databaseUrl,
    input.migrationsFolder,
    "harness plan smoke"
  );

  const marker = normalizeSmokeSlugPart(input.smokeId);
  const workspaceSlug = `krn-harness-smoke-${marker}`;
  const projectSlug = "persisted-harness-plan";
  const task = `persisted harness plan smoke ${marker}`;
  const { client, db } = createSmokeDatabase(input.databaseUrl);
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
    const { workspace, project } = await createSmokeProjectRecords(
      projectRepository,
      workspaceSlug,
      projectSlug,
      marker
    );
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
