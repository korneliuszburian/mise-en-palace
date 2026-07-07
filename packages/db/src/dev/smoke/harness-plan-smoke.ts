import {
  cleanupHarnessCompilerSmokeRows,
  createCompiledSmokeExecution,
  createHarnessCompilerSmokeRuntime
} from "./db-smoke-support.js";
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

export const runHarnessPlanSmokeCheck = async (
  input: HarnessPlanSmokeInput
): Promise<HarnessPlanSmokeReport> => {
  const { client, db, marker, projectSlug, task, workspaceSlug } =
    await createHarnessCompilerSmokeRuntime({
      databaseUrl: input.databaseUrl,
      migrationsFolder: input.migrationsFolder,
      smokeId: input.smokeId,
      smokeName: "harness plan smoke",
      workspacePrefix: "krn-harness-smoke",
      projectSlug: "persisted-harness-plan",
      taskPrefix: "persisted harness plan smoke"
    });
  let retrievalRunId: string | undefined;

  const cleanup = (): Promise<number> => cleanupHarnessCompilerSmokeRows({
    db,
    feedbackDeltaId: undefined,
    marker,
    retrievalRunId,
    workspaceSlug
  });

  try {
    await cleanup();

    const {
      executionRun,
      harnessRunRepository,
      result,
      retrievalRunId: compiledRetrievalRunId
    } = await createCompiledSmokeExecution({
      acceptance: "read back persisted run aggregate",
      command: "db:smoke:harness-plan",
      db,
      eventMessage: "Persisted harness plan smoke created",
      eventPayload: (compiledResult) => ({
        operatorIntentId: compiledResult.operatorIntent.id,
        taskContractId: compiledResult.taskContract.id,
        harnessPlanId: compiledResult.harnessPlan.id,
        contextAssemblyId: compiledResult.contextAssembly.id
      }),
      eventType: "smoke.harness_plan.persisted",
      marker,
      projectSlug,
      task,
      workspaceSlug
    });
    retrievalRunId = compiledRetrievalRunId;
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
