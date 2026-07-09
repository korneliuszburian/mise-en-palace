import type {
  CliCommand
} from "./parse-args.js";
import type {
  CliResult,
  CliRuntime
} from "./run-cli.js";
import {
  runBrainSearchCommand
} from "./run-brain-search-command.js";
import {
  runDbCliCommand
} from "./run-db-cli-command.js";
import {
  runHarnessCliCommand
} from "./run-harness-cli-command.js";
import {
  runMaintenancePreviewCommand
} from "./run-maintenance-preview-command.js";
import {
  runMaintenanceQueueCommand
} from "./run-maintenance-queue-command.js";
import type {
  CreateMaintenanceQueueDatabaseRuntime
} from "./run-maintenance-queue-command.js";
import {
  runMemoryCliCommand
} from "./run-memory-cli-command.js";
import {
  runProjectCliCommand
} from "./run-project-cli-command.js";
import {
  runSourceCliCommand
} from "./run-source-cli-command.js";

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
  createMaintenanceQueueDatabaseRuntime?: CreateMaintenanceQueueDatabaseRuntime;
  formatCliError(message: string): string;
}

type CliCommandAdapter = (
  command: CliCommand,
  context: CliCommandDispatchContext
) => Promise<CliResult | undefined>;

const cliCommandSuccess = (stdout: string): CliResult => ({
  exitCode: 0,
  stdout,
  stderr: ""
});

const cliCommandError = (
  error: unknown,
  fallbackMessage: string,
  context: CliCommandDispatchContext
): CliResult => {
  const message = error instanceof Error ? error.message : fallbackMessage;

  return {
    exitCode: 1,
    stdout: "",
    stderr: context.formatCliError(message)
  };
};

const readbackCommandResult = async (
  run: () => Promise<{ stdout: string }>,
  fallbackMessage: string,
  context: CliCommandDispatchContext
): Promise<CliResult> => {
  try {
    const result = await run();

    return cliCommandSuccess(result.stdout);
  } catch (error) {
    return cliCommandError(error, fallbackMessage, context);
  }
};

const runProjectAdapter: CliCommandAdapter = (command, context) =>
  runProjectCliCommand(command, {
    cwd: context.cwd,
    env: context.env,
    now: context.now,
    createId: context.createId,
    ...(context.createDatabaseRuntime === undefined
      ? {}
      : { createDatabaseRuntime: context.createDatabaseRuntime }),
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

const runMaintenancePreviewAdapter: CliCommandAdapter = async (command, context) => {
  if (command.kind !== "maintenancePreview") {
    return undefined;
  }

  return readbackCommandResult(
    () => runMaintenancePreviewCommand({
      cwd: context.cwd,
      env: context.env,
      now: context.now,
      createId: context.createId,
      command,
      ...(context.createDatabaseRuntime === undefined
        ? {}
        : { createDatabaseRuntime: context.createDatabaseRuntime })
    }),
    "Unknown maintenance preview error",
    context
  );
};

const runMaintenanceQueueAdapter: CliCommandAdapter = async (command, context) => {
  if (command.kind !== "maintenanceRun" && command.kind !== "maintenanceRecover") {
    return undefined;
  }

  return readbackCommandResult(
    () => runMaintenanceQueueCommand({
      env: context.env,
      now: context.now,
      createId: context.createId,
      command,
      ...(context.createMaintenanceQueueDatabaseRuntime === undefined
        ? {}
        : { createMaintenanceQueueDatabaseRuntime: context.createMaintenanceQueueDatabaseRuntime })
    }),
    "Unknown maintenance queue run error",
    context
  );
};

const runBrainAdapter: CliCommandAdapter = async (command, context) => {
  if (command.kind !== "brainSearch") {
    return undefined;
  }

  return readbackCommandResult(
    () => runBrainSearchCommand({
      cwd: context.cwd,
      env: context.env,
      now: context.now,
      createId: context.createId,
      command,
      ...(context.createDatabaseRuntime === undefined
        ? {}
        : { createDatabaseRuntime: context.createDatabaseRuntime })
    }),
    "Unknown brain search error",
    context
  );
};

const cliCommandAdapters: readonly CliCommandAdapter[] = [
  runBrainAdapter,
  runProjectAdapter,
  runSourceAdapter,
  runMemoryAdapter,
  runHarnessAdapter,
  runMaintenancePreviewAdapter,
  runMaintenanceQueueAdapter,
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
