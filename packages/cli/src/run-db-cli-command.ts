import type {
  CliCommand
} from "./parse-args.js";
import type {
  CliResult,
  CliRuntime
} from "./run-cli.js";
import {
  runDbMigrateCommand
} from "./run-db-migrate-command.js";
import {
  runDbReadinessCommand
} from "./run-db-readiness-command.js";
import {
  runDbSmokeCommand
} from "./run-db-smoke-command.js";
import {
  runDoctorCommand
} from "./run-doctor-command.js";

type DbCliCommand = Extract<
  CliCommand,
  | { kind: "doctor" }
  | { kind: "dbMigrate" }
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

type ConfiguredDbCliCommand = Exclude<DbCliCommand, { kind: "dbSmoke" }>;

const configuredDbRuntime = (
  command: ConfiguredDbCliCommand,
  context: DbCliCommandContext
) => ({
  env: context.env,
  cwd: context.cwd,
  ...(command.backend === undefined ? {} : { backend: command.backend }),
  ...(command.dbPath === undefined ? {} : { dbPath: command.dbPath })
});

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
  command.kind === "dbMigrate" ||
  command.kind === "dbReadiness" ||
  command.kind === "dbSmoke"
);

const dbFallbackMessages = {
  doctor: "Unknown doctor error",
  dbMigrate: "Unknown DB migrate error",
  dbReadiness: "Unknown DB readiness error",
  dbSmoke: "Unknown DB smoke error"
} satisfies Record<DbCliCommand["kind"], string>;

const runSelectedDbCommand = async (
  command: DbCliCommand,
  context: DbCliCommandContext
): Promise<DbCommandOutput> => {
  if (command.kind === "doctor") {
    return runDoctorCommand(configuredDbRuntime(command, context));
  }

  if (command.kind === "dbReadiness") {
    return runDbReadinessCommand(configuredDbRuntime(command, context));
  }

  if (command.kind === "dbMigrate") {
    return runDbMigrateCommand(configuredDbRuntime(command, context));
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
