import type {
  CliCommand
} from "./parse-args.js";
import type {
  CreateDatabaseRuntime
} from "./run-plan-command.js";
import type {
  CliResult,
  CliRuntime
} from "./run-cli.js";
import {
  runSourceArtifactPreviewCommand
} from "./run-source-artifact-preview-command.js";
import {
  runSourceClaimAddCommand
} from "./run-source-claim-add-command.js";
import {
  runSourceClaimEdgesCommand
} from "./run-source-claim-edges-command.js";
import {
  runSourceClaimRejectCommand
} from "./run-source-claim-reject-command.js";
import {
  runSourceDecisionLinkCommand
} from "./run-source-decision-link-command.js";
import {
  runSourceDecisionAdoptCommand
} from "./run-source-decision-adopt-command.js";
import {
  runSourceDecisionGapsCommand
} from "./run-source-decision-gaps-command.js";
import {
  runSourceSearchCommand
} from "./run-source-search-command.js";

type SourceCliCommand = Extract<
  CliCommand,
  | { kind: "sourceClaimAdd" }
  | { kind: "sourceArtifactPreview" }
  | { kind: "sourceClaimEdges" }
  | { kind: "sourceSearch" }
  | { kind: "sourceDecisionLink" }
  | { kind: "sourceDecisionAdopt" }
  | { kind: "sourceDecisionGaps" }
  | { kind: "sourceClaimReject" }
>;

interface SourceCliCommandContext {
  cwd: string;
  env: CliRuntime["env"];
  now: () => string;
  createId: (prefix: string) => string;
  createDatabaseRuntime?: CreateDatabaseRuntime;
  formatCliError(message: string): string;
}

type SourceCommandOutput = {
  stdout: string;
};

const sourceCommandResult = (stdout: string): CliResult => ({
  exitCode: 0,
  stdout,
  stderr: ""
});

const sourceCommandError = (
  error: unknown,
  fallbackMessage: string,
  context: SourceCliCommandContext
): CliResult => {
  const message = error instanceof Error ? error.message : fallbackMessage;

  return {
    exitCode: 1,
    stdout: "",
    stderr: context.formatCliError(message)
  };
};

const databaseRuntimeOption = (
  context: SourceCliCommandContext
): { createDatabaseRuntime?: CreateDatabaseRuntime } => (
  context.createDatabaseRuntime === undefined
    ? {}
    : { createDatabaseRuntime: context.createDatabaseRuntime }
);

const standardSourceInput = (context: SourceCliCommandContext) => ({
  env: context.env,
  now: context.now,
  createId: context.createId,
  ...databaseRuntimeOption(context)
});

const isSourceCliCommand = (command: CliCommand): command is SourceCliCommand => (
  command.kind === "sourceClaimAdd" ||
  command.kind === "sourceArtifactPreview" ||
  command.kind === "sourceClaimEdges" ||
    command.kind === "sourceSearch" ||
    command.kind === "sourceDecisionLink" ||
    command.kind === "sourceDecisionAdopt" ||
    command.kind === "sourceDecisionGaps" ||
    command.kind === "sourceClaimReject"
);

const sourceFallbackMessages = {
  sourceClaimAdd: "Unknown source claim error",
  sourceArtifactPreview: "Unknown source artifact preview error",
  sourceClaimEdges: "Unknown source claim edges error",
  sourceSearch: "Unknown source search error",
  sourceDecisionLink: "Unknown source decision link error",
  sourceDecisionAdopt: "Unknown source decision adopt error",
  sourceDecisionGaps: "Unknown source decision gaps error",
  sourceClaimReject: "Unknown source claim reject error"
} satisfies Record<SourceCliCommand["kind"], string>;

const runSelectedSourceCommand = async (
  command: SourceCliCommand,
  context: SourceCliCommandContext
): Promise<SourceCommandOutput> => {
  if (command.kind === "sourceClaimAdd") {
    return runSourceClaimAddCommand({
      ...standardSourceInput(context),
      cwd: context.cwd,
      command
    });
  }

  if (command.kind === "sourceArtifactPreview") {
    return runSourceArtifactPreviewCommand({
      cwd: context.cwd,
      env: context.env,
      now: context.now,
      ...databaseRuntimeOption(context),
      command
    });
  }

  if (command.kind === "sourceClaimEdges") {
    return runSourceClaimEdgesCommand({
      ...standardSourceInput(context),
      command
    });
  }

  if (command.kind === "sourceSearch") {
    return runSourceSearchCommand({
      cwd: context.cwd,
      ...standardSourceInput(context),
      command
    });
  }

  if (command.kind === "sourceDecisionLink") {
    return runSourceDecisionLinkCommand({
      ...standardSourceInput(context),
      command
    });
  }

  if (command.kind === "sourceDecisionAdopt") {
    return runSourceDecisionAdoptCommand({
      ...standardSourceInput(context),
      command
    });
  }

  if (command.kind === "sourceDecisionGaps") {
    return runSourceDecisionGapsCommand({
      ...standardSourceInput(context),
      cwd: context.cwd,
      command
    });
  }

  return runSourceClaimRejectCommand({
    ...standardSourceInput(context),
    cwd: context.cwd,
    command
  });
};

export const runSourceCliCommand = async (
  command: CliCommand,
  context: SourceCliCommandContext
): Promise<CliResult | undefined> => {
  if (!isSourceCliCommand(command)) {
    return undefined;
  }

  try {
    const result = await runSelectedSourceCommand(command, context);
    return sourceCommandResult(result.stdout);
  } catch (error) {
    return sourceCommandError(error, sourceFallbackMessages[command.kind], context);
  }
};
