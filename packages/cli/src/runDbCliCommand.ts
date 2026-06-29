import type {
  CliCommand
} from "./parseArgs.js";
import type {
  CliResult,
  CliRuntime
} from "./runCli.js";
import {
  runDbReadinessCommand
} from "./runDbReadinessCommand.js";
import {
  runDbSmokeCommand
} from "./runDbSmokeCommand.js";
import {
  runDoctorCommand
} from "./runDoctorCommand.js";

type DbCliCommand = Extract<
  CliCommand,
  | { kind: "doctor" }
  | { kind: "dbReadiness" }
  | { kind: "dbSmoke" }
>;

interface DbCliCommandContext {
  cwd: string;
  env: CliRuntime["env"];
  createId: (prefix: string) => string;
  formatCliError(message: string): string;
}

type DbCommandOutput = {
  exitCode: number;
  stdout: string;
};

const dbCommandResult = (result: DbCommandOutput): CliResult => ({
  exitCode: result.exitCode,
  stdout: result.stdout,
  stderr: ""
});

const dbCommandError = (
  error: unknown,
  fallbackMessage: string,
  context: DbCliCommandContext
): CliResult => {
  const message = error instanceof Error ? error.message : fallbackMessage;

  return {
    exitCode: 1,
    stdout: "",
    stderr: context.formatCliError(message)
  };
};

const isDbCliCommand = (command: CliCommand): command is DbCliCommand => (
  command.kind === "doctor" ||
  command.kind === "dbReadiness" ||
  command.kind === "dbSmoke"
);

const dbFallbackMessages = {
  doctor: "Unknown doctor error",
  dbReadiness: "Unknown DB readiness error",
  dbSmoke: "Unknown DB smoke error"
} satisfies Record<DbCliCommand["kind"], string>;

const runSelectedDbCommand = async (
  command: DbCliCommand,
  context: DbCliCommandContext
): Promise<DbCommandOutput> => {
  if (command.kind === "doctor") {
    return runDoctorCommand({
      env: context.env,
      cwd: context.cwd
    });
  }

  if (command.kind === "dbReadiness") {
    return runDbReadinessCommand({
      env: context.env,
      cwd: context.cwd
    });
  }

  return runDbSmokeCommand({
    env: context.env,
    cwd: context.cwd,
    createId: context.createId,
    target: command.target
  });
};

export const runDbCliCommand = async (
  command: CliCommand,
  context: DbCliCommandContext
): Promise<CliResult | undefined> => {
  if (!isDbCliCommand(command)) {
    return undefined;
  }

  try {
    const result = await runSelectedDbCommand(command, context);
    return dbCommandResult(result);
  } catch (error) {
    return dbCommandError(error, dbFallbackMessages[command.kind], context);
  }
};
