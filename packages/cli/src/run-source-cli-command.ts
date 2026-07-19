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
  runSourceDecisionImportCommand
} from "./run-source-decision-import-command.js";
import {
  runSourceDecisionReconcileCommand
} from "./run-source-decision-reconcile-command.js";
import {
  runSourceSearchCommand
} from "./run-source-search-command.js";
import {
  runSourceQuarantineListCommand
} from "./run-source-quarantine-list-command.js";

type SourceCliCommand = Exclude<
  Extract<CliCommand, { kind: `source${string}` }>,
  { kind: `${string}Help` }
>;

type SourceDecisionCliCommand = Extract<
  SourceCliCommand,
  { kind: `sourceDecision${string}` }
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
  cwd: context.cwd,
  now: context.now,
  createId: context.createId,
  ...databaseRuntimeOption(context)
});

const unreachableSourceCommand = (command: never): never => {
  throw new Error(`Unreachable source command: ${JSON.stringify(command)}`);
};

// fallow-ignore-next-line complexity -- exhaustive discriminant selection keeps source routing compiler-checked
const selectSourceCliCommand = (
  command: CliCommand
): SourceCliCommand | undefined => {
  switch (command.kind) {
    case "sourceClaimAdd":
    case "sourceArtifactPreview":
    case "sourceClaimEdges":
    case "sourceSearch":
    case "sourceDecisionLink":
    case "sourceDecisionAdopt":
    case "sourceDecisionGaps":
    case "sourceDecisionReconcile":
    case "sourceDecisionImport":
    case "sourceQuarantineList":
    case "sourceClaimReject":
      return command;
    default:
      return undefined;
  }
};

const sourceFallbackMessages = {
  sourceClaimAdd: "Unknown source claim error",
  sourceArtifactPreview: "Unknown source artifact preview error",
  sourceClaimEdges: "Unknown source claim edges error",
  sourceSearch: "Unknown source search error",
  sourceDecisionLink: "Unknown source decision link error",
  sourceDecisionAdopt: "Unknown source decision adopt error",
  sourceDecisionGaps: "Unknown source decision gaps error",
  sourceDecisionReconcile: "Unknown source decision reconcile error",
  sourceDecisionImport: "Unknown source decision import error",
  sourceQuarantineList: "Unknown source quarantine list error",
  sourceClaimReject: "Unknown source claim reject error"
} satisfies Record<SourceCliCommand["kind"], string>;

const runSourceDecisionCommand = async (
  command: SourceDecisionCliCommand,
  context: SourceCliCommandContext
): Promise<SourceCommandOutput> => {
  switch (command.kind) {
    case "sourceDecisionLink":
      return runSourceDecisionLinkCommand({
        ...standardSourceInput(context),
        cwd: context.cwd,
        command
      });
    case "sourceDecisionAdopt":
      return runSourceDecisionAdoptCommand({
        ...standardSourceInput(context),
        command
      });
    case "sourceDecisionGaps":
      return runSourceDecisionGapsCommand({
        ...standardSourceInput(context),
        cwd: context.cwd,
        command
      });
    case "sourceDecisionReconcile":
      return runSourceDecisionReconcileCommand({
        ...standardSourceInput(context),
        cwd: context.cwd,
        command
      });
    case "sourceDecisionImport":
      return runSourceDecisionImportCommand({
        ...standardSourceInput(context),
        cwd: context.cwd,
        command
      });
    default:
      return unreachableSourceCommand(command);
  }
};

// fallow-ignore-next-line complexity -- exhaustive source command dispatch preserves compiler-checked handler coverage
const runSelectedSourceCommand = async (
  command: SourceCliCommand,
  context: SourceCliCommandContext
): Promise<SourceCommandOutput> => {
  switch (command.kind) {
    case "sourceClaimAdd":
      return runSourceClaimAddCommand({
        ...standardSourceInput(context),
        cwd: context.cwd,
        command
      });
    case "sourceArtifactPreview":
      return runSourceArtifactPreviewCommand({
        cwd: context.cwd,
        env: context.env,
        now: context.now,
        ...databaseRuntimeOption(context),
        command
      });
    case "sourceClaimEdges":
      return runSourceClaimEdgesCommand({
        ...standardSourceInput(context),
        command
      });
    case "sourceSearch":
      return runSourceSearchCommand({
        ...standardSourceInput(context),
        command
      });
    case "sourceDecisionLink":
    case "sourceDecisionAdopt":
    case "sourceDecisionGaps":
    case "sourceDecisionReconcile":
    case "sourceDecisionImport":
      return runSourceDecisionCommand(command, context);
    case "sourceClaimReject":
      return runSourceClaimRejectCommand({
        ...standardSourceInput(context),
        cwd: context.cwd,
        command
      });
    case "sourceQuarantineList":
      return runSourceQuarantineListCommand({
        env: context.env,
        command
      });
    default:
      return unreachableSourceCommand(command);
  }
};

export const runSourceCliCommand = async (
  command: CliCommand,
  context: SourceCliCommandContext
): Promise<CliResult | undefined> => {
  const sourceCommand = selectSourceCliCommand(command);

  if (sourceCommand === undefined) {
    return undefined;
  }

  try {
    const result = await runSelectedSourceCommand(sourceCommand, context);
    return sourceCommandResult(result.stdout);
  } catch (error) {
    return sourceCommandError(error, sourceFallbackMessages[sourceCommand.kind], context);
  }
};
