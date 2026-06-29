import type {
  CliCommand
} from "./parseArgs.js";
import type {
  CreateDatabaseRuntime
} from "./runPlanCommand.js";
import type {
  CliResult,
  CliRuntime
} from "./runCli.js";
import {
  runMemoryAntiAddCommand
} from "./runMemoryAntiAddCommand.js";
import {
  runMemoryAntiReviewCommand
} from "./runMemoryAntiReviewCommand.js";
import {
  runMemoryCandidateAddCommand
} from "./runMemoryCandidateAddCommand.js";
import {
  runMemoryCandidateReviewCommand
} from "./runMemoryCandidateReviewCommand.js";
import {
  runMemoryRecordApplyCommand
} from "./runMemoryRecordApplyCommand.js";

type MemoryCliCommand = Extract<
  CliCommand,
  | { kind: "memoryCandidateAdd" }
  | { kind: "memoryCandidatePromote" }
  | { kind: "memoryCandidateReject" }
  | { kind: "memoryRecordApply" }
  | { kind: "memoryAntiAdd" }
  | { kind: "memoryAntiPromote" }
  | { kind: "memoryAntiReject" }
>;

interface MemoryCliCommandContext {
  env: CliRuntime["env"];
  now: () => string;
  createId: (prefix: string) => string;
  createDatabaseRuntime?: CreateDatabaseRuntime;
  formatCliError(message: string): string;
}

type MemoryCommandOutput = {
  stdout: string;
};

const memoryCommandResult = (stdout: string): CliResult => ({
  exitCode: 0,
  stdout,
  stderr: ""
});

const memoryCommandError = (
  error: unknown,
  fallbackMessage: string,
  context: MemoryCliCommandContext
): CliResult => {
  const message = error instanceof Error ? error.message : fallbackMessage;

  return {
    exitCode: 1,
    stdout: "",
    stderr: context.formatCliError(message)
  };
};

const databaseRuntimeOption = (
  context: MemoryCliCommandContext
): { createDatabaseRuntime?: CreateDatabaseRuntime } => (
  context.createDatabaseRuntime === undefined
    ? {}
    : { createDatabaseRuntime: context.createDatabaseRuntime }
);

const standardMemoryInput = (context: MemoryCliCommandContext) => ({
  env: context.env,
  now: context.now,
  createId: context.createId,
  ...databaseRuntimeOption(context)
});

const isMemoryCliCommand = (command: CliCommand): command is MemoryCliCommand => (
  command.kind === "memoryCandidateAdd" ||
  command.kind === "memoryCandidatePromote" ||
  command.kind === "memoryCandidateReject" ||
  command.kind === "memoryRecordApply" ||
  command.kind === "memoryAntiAdd" ||
  command.kind === "memoryAntiPromote" ||
  command.kind === "memoryAntiReject"
);

const memoryFallbackMessages = {
  memoryCandidateAdd: "Unknown memory candidate add error",
  memoryCandidatePromote: "Unknown memory candidate review error",
  memoryCandidateReject: "Unknown memory candidate review error",
  memoryRecordApply: "Unknown memory record apply error",
  memoryAntiAdd: "Unknown memory anti add error",
  memoryAntiPromote: "Unknown memory anti review error",
  memoryAntiReject: "Unknown memory anti review error"
} satisfies Record<MemoryCliCommand["kind"], string>;

const runSelectedMemoryCommand = async (
  command: MemoryCliCommand,
  context: MemoryCliCommandContext
): Promise<MemoryCommandOutput> => {
  if (command.kind === "memoryCandidateAdd") {
    return runMemoryCandidateAddCommand({
      ...standardMemoryInput(context),
      command
    });
  }

  if (
    command.kind === "memoryCandidatePromote" ||
    command.kind === "memoryCandidateReject"
  ) {
    return runMemoryCandidateReviewCommand({
      ...standardMemoryInput(context),
      command
    });
  }

  if (command.kind === "memoryRecordApply") {
    return runMemoryRecordApplyCommand({
      ...standardMemoryInput(context),
      command
    });
  }

  if (command.kind === "memoryAntiAdd") {
    return runMemoryAntiAddCommand({
      ...standardMemoryInput(context),
      command
    });
  }

  return runMemoryAntiReviewCommand({
    ...standardMemoryInput(context),
    command
  });
};

export const runMemoryCliCommand = async (
  command: CliCommand,
  context: MemoryCliCommandContext
): Promise<CliResult | undefined> => {
  if (!isMemoryCliCommand(command)) {
    return undefined;
  }

  try {
    const result = await runSelectedMemoryCommand(command, context);
    return memoryCommandResult(result.stdout);
  } catch (error) {
    return memoryCommandError(error, memoryFallbackMessages[command.kind], context);
  }
};
