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
import {
  runPlanCommand
} from "./runPlanCommand.js";
import type {
  CreateDatabaseRuntime
} from "./runPlanCommand.js";
import {
  runInitCommand
} from "./runInitCommand.js";
import type {
  CreateInitConnectRuntime
} from "./runInitCommand.js";
import {
  runDoctorCommand
} from "./runDoctorCommand.js";
import {
  runDbReadinessCommand
} from "./runDbReadinessCommand.js";
import {
  runDbSmokeCommand
} from "./runDbSmokeCommand.js";
import {
  runEvidenceCaptureCommand
} from "./runEvidenceCaptureCommand.js";
import {
  runReviewAssessCommand
} from "./runReviewAssessCommand.js";
import {
  runRunShowCommand
} from "./runRunShowCommand.js";
import {
  runKnowledgeCardsCommand
} from "./runKnowledgeCardsCommand.js";
import type {
  CreateReviewAssessDatabaseRuntime
} from "./runReviewAssessCommand.js";
import {
  runObserveCommand
} from "./runObserveCommand.js";
import type {
  CreateObserveDatabaseRuntime
} from "./runObserveCommand.js";
import {
  runReflectCommand
} from "./runReflectCommand.js";
import type {
  CreateReflectDatabaseRuntime
} from "./runReflectCommand.js";
import {
  runCodexBriefCommand
} from "./runCodexBriefCommand.js";
import {
  runSourceCliCommand
} from "./runSourceCliCommand.js";
import {
  runMemoryCliCommand
} from "./runMemoryCliCommand.js";
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

  if (command.kind === "init") {
    try {
      const result = await runInitCommand({
        cwd: runtime.cwd ?? process.cwd(),
        env: runtime.env,
        mode: command.mode,
        repo: command.repo,
        ...(command.ownerFiles === undefined ? {} : { ownerFiles: command.ownerFiles }),
        ...(command.mode === "connect" ? { persist: command.persist } : {}),
        ...(runtime.createInitConnectRuntime === undefined
          ? {}
          : { createInitConnectRuntime: runtime.createInitConnectRuntime })
      });

      return {
        exitCode: 0,
        stdout: result.stdout,
        stderr: ""
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown init error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: formatCliError(message)
      };
    }
  }

  if (command.kind === "reviewAssess") {
    try {
      const result = await runReviewAssessCommand({
        env: runtime.env,
        now,
        createId,
        command: command,
        ...(runtime.createReviewAssessDatabaseRuntime === undefined
          ? {}
          : { createDatabaseRuntime: runtime.createReviewAssessDatabaseRuntime })
      });

      return {
        exitCode: 0,
        stdout: result.stdout,
        stderr: ""
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown review assess error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: formatCliError(message)
      };
    }
  }

  if (command.kind === "runShow") {
    try {
      const result = await runRunShowCommand({
        env: runtime.env,
        now,
        createId,
        runId: command.runId,
        format: command.format,
        ...(runtime.createDatabaseRuntime === undefined
          ? {}
          : { createDatabaseRuntime: runtime.createDatabaseRuntime })
      });

      return {
        exitCode: 0,
        stdout: result.stdout,
        stderr: ""
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown run show error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: formatCliError(message)
      };
    }
  }

  if (command.kind === "knowledgeCards") {
    try {
      const result = await runKnowledgeCardsCommand({
        cwd: runtime.cwd ?? process.cwd(),
        cardFiles: command.cardFiles,
        patternFiles: command.patternFiles,
        catalogFiles: command.catalogFiles,
        filter: command.filter,
        format: command.format,
        ...(command.limit === undefined ? {} : { limit: command.limit })
      });

      return {
        exitCode: 0,
        stdout: result.stdout,
        stderr: ""
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown knowledge cards error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: formatCliError(message)
      };
    }
  }

  const sourceResult = await runSourceCliCommand(command, {
    cwd: runtime.cwd ?? process.cwd(),
    env: runtime.env,
    now,
    createId,
    ...(runtime.createDatabaseRuntime === undefined
      ? {}
      : { createDatabaseRuntime: runtime.createDatabaseRuntime }),
    formatCliError
  });
  if (sourceResult !== undefined) {
    return sourceResult;
  }

  const memoryResult = await runMemoryCliCommand(command, {
    env: runtime.env,
    now,
    createId,
    ...(runtime.createDatabaseRuntime === undefined
      ? {}
      : { createDatabaseRuntime: runtime.createDatabaseRuntime }),
    formatCliError
  });
  if (memoryResult !== undefined) {
    return memoryResult;
  }

  if (command.kind === "plan") {
    try {
      const result = await runPlanCommand(command.task, {
        env: runtime.env,
        cwd: runtime.cwd ?? process.cwd(),
        now,
        createId,
        persist: command.persist,
        ...(command.projectId === undefined ? {} : { projectId: command.projectId }),
        ...(runtime.createDatabaseRuntime === undefined
          ? {}
          : { createDatabaseRuntime: runtime.createDatabaseRuntime })
      });

      return {
        exitCode: 0,
        stdout: result.stdout,
        stderr: ""
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown CLI error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: formatCliError(message)
      };
    }
  }

  if (command.kind === "doctor") {
    try {
      const result = await runDoctorCommand({
        env: runtime.env,
        cwd: runtime.cwd ?? process.cwd()
      });

      return {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: ""
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown doctor error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: formatCliError(message)
      };
    }
  }

  if (command.kind === "dbReadiness") {
    try {
      const result = await runDbReadinessCommand({
        env: runtime.env,
        cwd: runtime.cwd ?? process.cwd()
      });

      return {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: ""
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown DB readiness error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: formatCliError(message)
      };
    }
  }

  if (command.kind === "dbSmoke") {
    try {
      const result = await runDbSmokeCommand({
        env: runtime.env,
        cwd: runtime.cwd ?? process.cwd(),
        createId,
        target: command.target
      });

      return {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: ""
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown DB smoke error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: formatCliError(message)
      };
    }
  }

  if (command.kind === "codexBrief") {
    try {
      const result = await runCodexBriefCommand({
        env: runtime.env,
        now,
        createId,
        runId: command.runId,
        ...(runtime.createDatabaseRuntime === undefined
          ? {}
          : { createDatabaseRuntime: runtime.createDatabaseRuntime })
      });

      return {
        exitCode: 0,
        stdout: result.stdout,
        stderr: ""
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Codex brief error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: formatCliError(message)
      };
    }
  }

  if (command.kind === "evidenceCapture") {
    try {
      const result = await runEvidenceCaptureCommand({
        env: runtime.env,
        cwd: runtime.cwd ?? process.cwd(),
        now,
        createId,
        persist: command.persist,
        ...(command.runId === undefined ? {} : { runId: command.runId }),
        ...(command.intendedFiles === undefined
          ? {}
          : { intendedFiles: command.intendedFiles }),
        ...(command.commandOutcomes === undefined
          ? {}
          : { commandOutcomes: command.commandOutcomes }),
        ...(command.targetEvidence === undefined
          ? {}
          : { targetEvidence: command.targetEvidence }),
        ...(command.sourceUsefulnessOutcomes === undefined
          ? {}
          : { sourceUsefulnessOutcomes: command.sourceUsefulnessOutcomes }),
        ...(runtime.createDatabaseRuntime === undefined
          ? {}
          : { createDatabaseRuntime: runtime.createDatabaseRuntime }),
        ...(runtime.readGitStatus === undefined ? {} : { readGitStatus: runtime.readGitStatus })
      });

      return {
        exitCode: 0,
        stdout: result.stdout,
        stderr: ""
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown evidence capture error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: formatCliError(message)
      };
    }
  }

  if (command.kind === "observeRun") {
    try {
      const result = await runObserveCommand({
        env: runtime.env,
        now,
        command: command,
        ...(runtime.createObserveDatabaseRuntime === undefined
          ? {}
          : { createObserveDatabaseRuntime: runtime.createObserveDatabaseRuntime })
      });

      return {
        exitCode: 0,
        stdout: result.stdout,
        stderr: ""
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown observe error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: formatCliError(message)
      };
    }
  }

  if (command.kind === "reflect") {
    try {
      const result = await runReflectCommand({
        env: runtime.env,
        now,
        createId,
        command: command,
        ...(runtime.createReflectDatabaseRuntime === undefined
          ? {}
          : { createReflectDatabaseRuntime: runtime.createReflectDatabaseRuntime })
      });

      return {
        exitCode: 0,
        stdout: result.stdout,
        stderr: ""
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown reflect error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: formatCliError(message)
      };
    }
  }

  return {
    exitCode: 2,
    stdout: "",
    stderr: formatUsage()
  };
};
