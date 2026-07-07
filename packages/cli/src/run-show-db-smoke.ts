import {
  cleanupHarnessCompilerSmokeRows,
  createCompiledSmokeExecution,
  createHarnessCompilerSmokeRuntime
} from "@krn/db/dev";

import {
  runRunShowCommand
} from "./run-run-show-command.js";

export interface RunShowDbSmokeInput {
  databaseUrl: string;
  migrationsFolder: string;
  smokeId: string;
}

export interface RunShowDbSmokeReport {
  workspaceSlug: string;
  projectSlug: string;
  executionRunId: string;
  textReadbackMatched: boolean;
  jsonReadbackMatched: boolean;
  readbackKind: string;
  readbackMutation: string;
  remainingMarkerCount: number;
  cleanedUp: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (
  value: Record<string, unknown>,
  key: string
): string | undefined => {
  const field = value[key];

  return typeof field === "string" ? field : undefined;
};

const readRunId = (value: Record<string, unknown>): string | undefined => {
  const run = value.run;

  return isRecord(run) ? readString(run, "id") : undefined;
};

const parseJsonReadback = (
  stdout: string
): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(stdout);

  if (!isRecord(parsed)) {
    throw new Error("Run-show DB smoke JSON readback was not an object");
  }

  return parsed;
};

export const runRunShowDbSmokeCheck = async (
  input: RunShowDbSmokeInput
): Promise<RunShowDbSmokeReport> => {
  const { client, db, marker, projectSlug, task, workspaceSlug } =
    await createHarnessCompilerSmokeRuntime({
      databaseUrl: input.databaseUrl,
      migrationsFolder: input.migrationsFolder,
      smokeId: input.smokeId,
      smokeName: "run-show smoke",
      workspacePrefix: "krn-run-show-smoke",
      projectSlug: "run-show",
      taskPrefix: "run show readback smoke"
  });
  let retrievalRunId: string | undefined;
  let cleanedUp = false;

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
      retrievalRunId: compiledRetrievalRunId
    } = await createCompiledSmokeExecution({
      acceptance: "read back persisted run through krn run show",
      command: "db:smoke:run-show",
      db,
      eventMessage: "Run-show smoke created persisted run",
      eventPayload: (compiledResult) => ({
        operatorIntentId: compiledResult.operatorIntent.id,
        taskContractId: compiledResult.taskContract.id,
        harnessPlanId: compiledResult.harnessPlan.id,
        contextAssemblyId: compiledResult.contextAssembly.id
      }),
      eventType: "smoke.run_show.persisted",
      marker,
      projectSlug,
      task,
      workspaceSlug
    });
    retrievalRunId = compiledRetrievalRunId;

    const runtime = {
      env: {
        KRN_DATABASE_URL: input.databaseUrl
      },
      now: () => "2026-07-03T12:00:00.000Z",
      createId: (prefix: string) => `${prefix}-${marker}`,
      runId: executionRun.id
    };
    const textReadback = await runRunShowCommand({
      ...runtime,
      format: "text"
    });
    const jsonReadback = await runRunShowCommand({
      ...runtime,
      format: "json"
    });
    const parsed = parseJsonReadback(jsonReadback.stdout);
    const readbackKind = readString(parsed, "kind") ?? "missing";
    const readbackMutation = readString(parsed, "mutation") ?? "missing";
    const textReadbackMatched =
      textReadback.stdout.includes("KRN Decision Packet Read Model") &&
      textReadback.stdout.includes(`Run ID: ${executionRun.id}`) &&
      textReadback.stdout.includes("Mutation: none");
    const jsonReadbackMatched =
      readbackKind === "krn.decisionPacket.readModel.v1" &&
      readbackMutation === "none" &&
      readRunId(parsed) === executionRun.id;

    if (!textReadbackMatched || !jsonReadbackMatched) {
      throw new Error("Run-show DB smoke readback did not match persisted run");
    }

    const remainingMarkerCount = await cleanup();
    cleanedUp = true;

    return {
      workspaceSlug,
      projectSlug,
      executionRunId: executionRun.id,
      textReadbackMatched,
      jsonReadbackMatched,
      readbackKind,
      readbackMutation,
      remainingMarkerCount,
      cleanedUp: remainingMarkerCount === 0
    };
  } finally {
    try {
      if (!cleanedUp) {
        await cleanup();
      }
    } finally {
      await client.end();
    }
  }
};
