import postgres from "postgres";
import {
  createKrnDatabase
} from "@krn/db";
import {
  DrizzleHarnessRunRepository
} from "@krn/db/adapters";
import type {
  HarnessRunRepository
} from "@krn/harness/repositories";

import type {
  DatabaseRuntimeInput
} from "./database-runtime.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import {
  buildRunReadbackResource,
  renderRunReadbackAggregate
} from "./run-show-readback.js";
import type {
  RunReadbackOutputFormat
} from "./run-show-readback.js";

export type {
  RunReadbackOutputFormat,
  RunReadbackResource
} from "./run-show-readback.js";
import { defaultWorkspaceSlug, defaultProjectSlug } from "./database-runtime.js";

export interface RunShowCommandRuntime extends BaseCommandRuntime {
  runId: string;
  format: RunReadbackOutputFormat;
  createDatabaseRuntime?: CreateRunShowDatabaseRuntime;
}

export interface RunShowCommandResult {
  stdout: string;
}

interface ReadOnlyHarnessRuntime {
  harnessRunRepository: Pick<HarnessRunRepository, "getHarnessRunByExecutionRunId">;
  close(): Promise<void>;
}

export type CreateRunShowDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<ReadOnlyHarnessRuntime>;

const localDatabaseUrl = "postgres://krn:krn@localhost:54329/krn";

const missingRunShowDatabaseUrlMessage = [
  "KRN_DATABASE_URL is required for krn run show",
  `Next action: export KRN_DATABASE_URL=${localDatabaseUrl} and run pnpm db:ready before readback`,
  "Does not prove: setting KRN_DATABASE_URL does not prove the requested run exists, commands executed, or Memory Core mutated"
].join("\n");

const createReadOnlyHarnessRuntime = async (
  databaseUrl: string
): Promise<ReadOnlyHarnessRuntime> => {
  const client = postgres(databaseUrl, { max: 1 });
  const db = createKrnDatabase(client);

  return {
    harnessRunRepository: new DrizzleHarnessRunRepository(db),
    async close(): Promise<void> {
      await client.end();
    }
  };
};

const resolveReadOnlyRuntime = async (
  runtime: RunShowCommandRuntime,
  databaseUrl: string
): Promise<ReadOnlyHarnessRuntime> => {
  if (runtime.createDatabaseRuntime === undefined) {
    return createReadOnlyHarnessRuntime(databaseUrl);
  }

  return runtime.createDatabaseRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    now: runtime.now,
    createId: runtime.createId
  });
};

export const runRunShowCommand = async (
  runtime: RunShowCommandRuntime
): Promise<RunShowCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error(missingRunShowDatabaseUrlMessage);
  }

  const readRuntime = await resolveReadOnlyRuntime(runtime, databaseUrl);

  try {
    const aggregate = await readRuntime.harnessRunRepository.getHarnessRunByExecutionRunId(
      runtime.runId
    );

    if (aggregate === undefined) {
      throw new Error(`Execution run not found: ${runtime.runId}`);
    }

    if (runtime.format === "json") {
      return {
        stdout: `${JSON.stringify(buildRunReadbackResource(aggregate), null, 2)}\n`
      };
    }

    return {
      stdout: `${renderRunReadbackAggregate(aggregate)}\n`
    };
  } finally {
    await readRuntime.close();
  }
};
