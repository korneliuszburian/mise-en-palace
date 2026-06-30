import {
  formatUsage,
  parseArgs
} from "./parseArgs.js";
import type {
  CliCommand
} from "./parseArgs.js";
import {
  formatDbUsage
} from "./parseDbArgs.js";
import {
  formatKnowledgeUsage
} from "./parseKnowledgeArgs.js";
import {
  formatHeartbeatUsage
} from "./parseHeartbeatArgs.js";
import {
  formatRunUsage
} from "./parseRunArgs.js";
import {
  formatMemoryCandidateAddUsage,
  formatMemoryCandidatePromoteUsage,
  formatMemoryCandidateRejectUsage,
  formatMemoryRecordApplyUsage,
  formatMemoryAntiAddUsage,
  formatMemoryAntiPromoteUsage,
  formatMemoryAntiRejectUsage
} from "./parseMemoryArgs.js";
import {
  formatSourceClaimAddUsage,
  formatSourceArtifactPreviewUsage,
  formatSourceClaimEdgesUsage,
  formatSourceSearchUsage,
  formatSourceClaimRejectUsage,
  formatSourceDecisionLinkUsage
} from "./parseSourceArgs.js";
import type {
  CreateDatabaseRuntime
} from "./runPlanCommand.js";
import type {
  CreateInitConnectRuntime
} from "./runInitCommand.js";
import type {
  CreateReviewAssessDatabaseRuntime
} from "./runReviewAssessCommand.js";
import type {
  CreateObserveDatabaseRuntime
} from "./runObserveCommand.js";
import type {
  CreateReflectDatabaseRuntime
} from "./runReflectCommand.js";
import {
  runCliCommand
} from "./runCliCommand.js";
import {
  missingDbConfigRecovery
} from "./dbRecoveryGuidance.js";

export interface CliRuntime {
  env: Record<string, string | undefined>;
  cwd?: string;
  now?(): string;
  createId?(prefix: string): string;
  readGitStatus?(): Promise<string>;
  readGitChangedFiles?(since: string, repoPath: string): Promise<string>;
  createDatabaseRuntime?: CreateDatabaseRuntime;
  createReviewAssessDatabaseRuntime?: CreateReviewAssessDatabaseRuntime;
  createObserveDatabaseRuntime?: CreateObserveDatabaseRuntime;
  createReflectDatabaseRuntime?: CreateReflectDatabaseRuntime;
  createInitConnectRuntime?: CreateInitConnectRuntime;
}

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

const dbConfigRequiredPrefix = "KRN_DATABASE_URL is required";

const formatCliError = (message: string): string => {
  if (!message.startsWith(dbConfigRequiredPrefix)) {
    return `${message}\n`;
  }

  if (message.includes("Next action:")) {
    return `${message}\n`;
  }

  return [
    message,
    `Next action: ${missingDbConfigRecovery()}`,
    "Does not prove: setting KRN_DATABASE_URL does not prove the requested persisted command is valid, commands executed, or Memory Core mutated"
  ].join("\n") + "\n";
};

const createDefaultIdFactory = (): ((prefix: string) => string) => {
  let counter = 0;

  return (prefix: string): string => {
    counter += 1;
    return `${prefix}-${Date.now()}-${counter}`;
  };
};

type HelpCommandKind = Extract<CliCommand, { kind: `${string}Help` }>["kind"];

const helpRenderers = {
  dbHelp: formatDbUsage,
  sourceClaimAddHelp: formatSourceClaimAddUsage,
  sourceClaimEdgesHelp: formatSourceClaimEdgesUsage,
  sourceSearchHelp: formatSourceSearchUsage,
  sourceArtifactPreviewHelp: formatSourceArtifactPreviewUsage,
  sourceDecisionLinkHelp: formatSourceDecisionLinkUsage,
  sourceClaimRejectHelp: formatSourceClaimRejectUsage,
  runShowHelp: formatRunUsage,
  knowledgeCardsHelp: formatKnowledgeUsage,
  heartbeatPreviewHelp: formatHeartbeatUsage,
  memoryCandidateAddHelp: formatMemoryCandidateAddUsage,
  memoryCandidatePromoteHelp: formatMemoryCandidatePromoteUsage,
  memoryCandidateRejectHelp: formatMemoryCandidateRejectUsage,
  memoryRecordApplyHelp: formatMemoryRecordApplyUsage,
  memoryAntiAddHelp: formatMemoryAntiAddUsage,
  memoryAntiPromoteHelp: formatMemoryAntiPromoteUsage,
  memoryAntiRejectHelp: formatMemoryAntiRejectUsage
} satisfies Record<HelpCommandKind, () => string>;

const isHelpCommandKind = (kind: CliCommand["kind"]): kind is HelpCommandKind =>
  Object.prototype.hasOwnProperty.call(helpRenderers, kind);

const formatHelpForCommand = (command: CliCommand): string | undefined => {
  if (command.kind === "help") {
    return formatUsage();
  }

  if (!isHelpCommandKind(command.kind)) {
    return undefined;
  }

  return helpRenderers[command.kind]();
};

export const runCli = async (
  args: readonly string[],
  runtime: CliRuntime
): Promise<CliResult> => {
  const parsed = parseArgs(args);
  const now = runtime.now ?? (() => new Date().toISOString());
  const createId = runtime.createId ?? createDefaultIdFactory();

  if (parsed.error !== undefined) {
    return {
      exitCode: 2,
      stdout: "",
      stderr: `${parsed.error}\n`
    };
  }

  const command = parsed.command;
  if (command === undefined) {
    return {
      exitCode: 0,
      stdout: formatUsage(),
      stderr: ""
    };
  }

  const helpOutput = formatHelpForCommand(command);
  if (helpOutput !== undefined) {
    return {
      exitCode: 0,
      stdout: helpOutput,
      stderr: ""
    };
  }

  const commandResult = await runCliCommand(command, {
    cwd: runtime.cwd ?? process.cwd(),
    env: runtime.env,
    now,
    createId,
    ...(runtime.createInitConnectRuntime === undefined
      ? {}
      : { createInitConnectRuntime: runtime.createInitConnectRuntime }),
    ...(runtime.readGitStatus === undefined ? {} : { readGitStatus: runtime.readGitStatus }),
    ...(runtime.createDatabaseRuntime === undefined
      ? {}
      : { createDatabaseRuntime: runtime.createDatabaseRuntime }),
    ...(runtime.createReviewAssessDatabaseRuntime === undefined
      ? {}
      : { createReviewAssessDatabaseRuntime: runtime.createReviewAssessDatabaseRuntime }),
    ...(runtime.createObserveDatabaseRuntime === undefined
      ? {}
      : { createObserveDatabaseRuntime: runtime.createObserveDatabaseRuntime }),
    ...(runtime.createReflectDatabaseRuntime === undefined
      ? {}
      : { createReflectDatabaseRuntime: runtime.createReflectDatabaseRuntime }),
    formatCliError
  });
  if (commandResult !== undefined) {
    return commandResult;
  }

  return {
    exitCode: 2,
    stdout: "",
    stderr: formatUsage()
  };
};
