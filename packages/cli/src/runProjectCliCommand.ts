import type {
  CliCommand
} from "./parseArgs.js";
import type {
  CliResult,
  CliRuntime
} from "./runCli.js";
import {
  runInitCommand
} from "./runInitCommand.js";
import type {
  CreateInitConnectRuntime
} from "./runInitCommand.js";
import {
  runKnowledgeCardsCommand
} from "./runKnowledgeCardsCommand.js";

type ProjectCliCommand = Extract<
  CliCommand,
  | { kind: "init" }
  | { kind: "knowledgeCards" }
>;

interface ProjectCliCommandContext {
  cwd: string;
  env: CliRuntime["env"];
  createInitConnectRuntime?: CreateInitConnectRuntime;
  formatCliError(message: string): string;
}

type ProjectCommandOutput = {
  stdout: string;
};

const projectCommandResult = (stdout: string): CliResult => ({
  exitCode: 0,
  stdout,
  stderr: ""
});

const projectCommandError = (
  error: unknown,
  fallbackMessage: string,
  context: ProjectCliCommandContext
): CliResult => {
  const message = error instanceof Error ? error.message : fallbackMessage;

  return {
    exitCode: 1,
    stdout: "",
    stderr: context.formatCliError(message)
  };
};

const isProjectCliCommand = (command: CliCommand): command is ProjectCliCommand => (
  command.kind === "init" ||
  command.kind === "knowledgeCards"
);

const projectFallbackMessages = {
  init: "Unknown init error",
  knowledgeCards: "Unknown brain knowledge error"
} satisfies Record<ProjectCliCommand["kind"], string>;

const runSelectedProjectCommand = async (
  command: ProjectCliCommand,
  context: ProjectCliCommandContext
): Promise<ProjectCommandOutput> => {
  if (command.kind === "init") {
    return runInitCommand({
      cwd: context.cwd,
      env: context.env,
      mode: command.mode,
      repo: command.repo,
      ...(command.ownerFiles === undefined ? {} : { ownerFiles: command.ownerFiles }),
      ...(command.mode === "connect" ? { persist: command.persist } : {}),
      ...(context.createInitConnectRuntime === undefined
        ? {}
        : { createInitConnectRuntime: context.createInitConnectRuntime })
    });
  }

  return runKnowledgeCardsCommand({
    cwd: context.cwd,
    cardFiles: command.cardFiles,
    patternFiles: command.patternFiles,
    catalogFiles: command.catalogFiles,
    filter: command.filter,
    format: command.format,
    ...(command.limit === undefined ? {} : { limit: command.limit })
  });
};

export const runProjectCliCommand = async (
  command: CliCommand,
  context: ProjectCliCommandContext
): Promise<CliResult | undefined> => {
  if (!isProjectCliCommand(command)) {
    return undefined;
  }

  try {
    const result = await runSelectedProjectCommand(command, context);
    return projectCommandResult(result.stdout);
  } catch (error) {
    return projectCommandError(error, projectFallbackMessages[command.kind], context);
  }
};
