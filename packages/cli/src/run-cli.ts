import {
  formatUsage,
  parseArgs
} from "./parse-args.js";
import type {
  CliCommand
} from "./parse-args.js";
import {
  formatBrainSearchUsage
} from "./parse-brain-args.js";
import {
  formatDbUsage
} from "./parse-db-args.js";
import {
  formatEvidenceCaptureUsage
} from "./parse-evidence-args.js";
import {
  formatBrainKnowledgeUsage
} from "./parse-brain-knowledge-args.js";
import {
  formatAgentPacketUsage
} from "./parse-agent-args.js";
import {
  formatObserveUsage
} from "./parse-observe-args.js";
import {
  formatPlanUsage
} from "./parse-plan-args.js";
import {
  formatReflectUsage
} from "./parse-reflect-args.js";
import {
  formatReviewAssessUsage
} from "./parse-review-args.js";
import {
  formatMaintenancePreviewUsage
} from "./parse-maintenance-preview-args.js";
import {
  formatMemoryCandidateAddUsage,
  formatMemoryCandidatePromoteUsage,
  formatMemoryCandidateRejectUsage,
  formatMemoryRecordApplyUsage,
  formatMemoryKnowledgeSeedUsage,
  formatMemoryAntiAddUsage,
  formatMemoryAntiPromoteUsage,
  formatMemoryAntiRejectUsage
} from "./parse-memory-args.js";
import {
  formatSourceClaimAddUsage,
  formatSourceArtifactPreviewUsage,
  formatSourceClaimEdgesUsage,
  formatSourceSearchUsage,
  formatSourceClaimRejectUsage,
  formatSourceDecisionAdoptUsage,
  formatSourceDecisionGapsUsage,
  formatSourceDecisionLinkUsage
} from "./parse-source-args.js";
import type {
  CreateDatabaseRuntime
} from "./run-plan-command.js";
import type {
  CreateInitConnectRuntime
} from "./run-init-command.js";
import type {
  CreateReviewAssessDatabaseRuntime
} from "./run-review-assess-command.js";
import type {
  CreateObserveDatabaseRuntime
} from "./run-observe-command.js";
import type {
  CreateReflectDatabaseRuntime
} from "./run-reflect-command.js";
import {
  runCliCommand
} from "./run-cli-command.js";
import {
  missingDbConfigRecovery
} from "./db-recovery-guidance.js";
import {
  formatRegisteredCommandHelp,
  isRegisteredHelpCommandKind,
  type RegisteredHelpCommandKind
} from "./cli-command-registry.js";

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
type LegacyHelpCommandKind = Exclude<HelpCommandKind, RegisteredHelpCommandKind>;

const helpRenderers = {
  brainSearchHelp: formatBrainSearchUsage,
  dbHelp: formatDbUsage,
  evidenceCaptureHelp: formatEvidenceCaptureUsage,
  observeRunHelp: formatObserveUsage,
  planHelp: formatPlanUsage,
  reflectHelp: formatReflectUsage,
  reviewAssessHelp: formatReviewAssessUsage,
  sourceClaimAddHelp: formatSourceClaimAddUsage,
  sourceClaimEdgesHelp: formatSourceClaimEdgesUsage,
  sourceSearchHelp: formatSourceSearchUsage,
  sourceArtifactPreviewHelp: formatSourceArtifactPreviewUsage,
  sourceDecisionAdoptHelp: formatSourceDecisionAdoptUsage,
  sourceDecisionGapsHelp: formatSourceDecisionGapsUsage,
  sourceDecisionLinkHelp: formatSourceDecisionLinkUsage,
  sourceClaimRejectHelp: formatSourceClaimRejectUsage,
  brainKnowledgeHelp: formatBrainKnowledgeUsage,
  agentPacketHelp: formatAgentPacketUsage,
  maintenancePreviewHelp: formatMaintenancePreviewUsage,
  memoryCandidateAddHelp: formatMemoryCandidateAddUsage,
  memoryCandidatePromoteHelp: formatMemoryCandidatePromoteUsage,
  memoryCandidateRejectHelp: formatMemoryCandidateRejectUsage,
  memoryRecordApplyHelp: formatMemoryRecordApplyUsage,
  memoryKnowledgeSeedHelp: formatMemoryKnowledgeSeedUsage,
  memoryAntiAddHelp: formatMemoryAntiAddUsage,
  memoryAntiPromoteHelp: formatMemoryAntiPromoteUsage,
  memoryAntiRejectHelp: formatMemoryAntiRejectUsage
} satisfies Record<LegacyHelpCommandKind, () => string>;

const isLegacyHelpCommandKind = (
  kind: CliCommand["kind"]
): kind is LegacyHelpCommandKind =>
  Object.prototype.hasOwnProperty.call(helpRenderers, kind);

const formatHelpForCommand = (command: CliCommand): string | undefined => {
  if (command.kind === "help") {
    return formatUsage();
  }

  if (isRegisteredHelpCommandKind(command.kind)) {
    return formatRegisteredCommandHelp(command.kind);
  }

  if (!isLegacyHelpCommandKind(command.kind)) {
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
