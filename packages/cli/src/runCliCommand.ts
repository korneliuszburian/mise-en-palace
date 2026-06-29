import type {
  CliCommand
} from "./parseArgs.js";
import type {
  CliResult,
  CliRuntime
} from "./runCli.js";
import {
  runDbCliCommand
} from "./runDbCliCommand.js";
import {
  runHarnessCliCommand
} from "./runHarnessCliCommand.js";
import {
  runMemoryCliCommand
} from "./runMemoryCliCommand.js";
import {
  runProjectCliCommand
} from "./runProjectCliCommand.js";
import {
  runSourceCliCommand
} from "./runSourceCliCommand.js";

interface CliCommandDispatchContext {
  cwd: string;
  env: CliRuntime["env"];
  now: () => string;
  createId: (prefix: string) => string;
  readGitStatus?: CliRuntime["readGitStatus"];
  createDatabaseRuntime?: CliRuntime["createDatabaseRuntime"];
  createReviewAssessDatabaseRuntime?: CliRuntime["createReviewAssessDatabaseRuntime"];
  createObserveDatabaseRuntime?: CliRuntime["createObserveDatabaseRuntime"];
  createReflectDatabaseRuntime?: CliRuntime["createReflectDatabaseRuntime"];
  createInitConnectRuntime?: CliRuntime["createInitConnectRuntime"];
  formatCliError(message: string): string;
}

type CliCommandAdapter = (
  command: CliCommand,
  context: CliCommandDispatchContext
) => Promise<CliResult | undefined>;

const runProjectAdapter: CliCommandAdapter = (command, context) =>
  runProjectCliCommand(command, {
    cwd: context.cwd,
    env: context.env,
    ...(context.createInitConnectRuntime === undefined
      ? {}
      : { createInitConnectRuntime: context.createInitConnectRuntime }),
    formatCliError: context.formatCliError
  });

const runSourceAdapter: CliCommandAdapter = (command, context) =>
  runSourceCliCommand(command, {
    cwd: context.cwd,
    env: context.env,
    now: context.now,
    createId: context.createId,
    ...(context.createDatabaseRuntime === undefined
      ? {}
      : { createDatabaseRuntime: context.createDatabaseRuntime }),
    formatCliError: context.formatCliError
  });

const runMemoryAdapter: CliCommandAdapter = (command, context) =>
  runMemoryCliCommand(command, {
    env: context.env,
    now: context.now,
    createId: context.createId,
    ...(context.createDatabaseRuntime === undefined
      ? {}
      : { createDatabaseRuntime: context.createDatabaseRuntime }),
    formatCliError: context.formatCliError
  });

const runHarnessAdapter: CliCommandAdapter = (command, context) =>
  runHarnessCliCommand(command, {
    cwd: context.cwd,
    env: context.env,
    now: context.now,
    createId: context.createId,
    ...(context.readGitStatus === undefined ? {} : { readGitStatus: context.readGitStatus }),
    ...(context.createDatabaseRuntime === undefined
      ? {}
      : { createDatabaseRuntime: context.createDatabaseRuntime }),
    ...(context.createReviewAssessDatabaseRuntime === undefined
      ? {}
      : { createReviewAssessDatabaseRuntime: context.createReviewAssessDatabaseRuntime }),
    ...(context.createObserveDatabaseRuntime === undefined
      ? {}
      : { createObserveDatabaseRuntime: context.createObserveDatabaseRuntime }),
    ...(context.createReflectDatabaseRuntime === undefined
      ? {}
      : { createReflectDatabaseRuntime: context.createReflectDatabaseRuntime }),
    formatCliError: context.formatCliError
  });

const runDbAdapter: CliCommandAdapter = (command, context) =>
  runDbCliCommand(command, {
    cwd: context.cwd,
    env: context.env,
    createId: context.createId,
    formatCliError: context.formatCliError
  });

const cliCommandAdapters: readonly CliCommandAdapter[] = [
  runProjectAdapter,
  runSourceAdapter,
  runMemoryAdapter,
  runHarnessAdapter,
  runDbAdapter
];

export const runCliCommand = async (
  command: CliCommand,
  context: CliCommandDispatchContext
): Promise<CliResult | undefined> => {
  for (const runCommand of cliCommandAdapters) {
    const result = await runCommand(command, context);

    if (result !== undefined) {
      return result;
    }
  }

  return undefined;
};
