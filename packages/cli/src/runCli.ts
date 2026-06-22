import {
  formatUsage,
  formatSourceClaimRejectUsage,
  formatSourceDecisionLinkUsage,
  formatSourceClaimAddUsage,
  formatMemoryCandidateAddUsage,
  formatMemoryCandidatePromoteUsage,
  formatMemoryCandidateRejectUsage,
  formatMemoryRecordApplyUsage,
  formatMemoryAntiAddUsage,
  parseArgs
} from "./parseArgs.js";
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
  runSourceClaimAddCommand
} from "./runSourceClaimAddCommand.js";
import {
  runSourceClaimRejectCommand
} from "./runSourceClaimRejectCommand.js";
import {
  runSourceDecisionLinkCommand
} from "./runSourceDecisionLinkCommand.js";
import {
  runMemoryCandidateAddCommand
} from "./runMemoryCandidateAddCommand.js";
import {
  runMemoryCandidateReviewCommand
} from "./runMemoryCandidateReviewCommand.js";
import {
  runMemoryRecordApplyCommand
} from "./runMemoryRecordApplyCommand.js";
import {
  runMemoryAntiAddCommand
} from "./runMemoryAntiAddCommand.js";
import {
  runAuditCommand
} from "./runAuditCommand.js";

export interface CliRuntime {
  env: Record<string, string | undefined>;
  cwd?: string;
  now?(): string;
  createId?(prefix: string): string;
  readGitStatus?(): Promise<string>;
  readGitChangedFiles?(since: string, repoPath: string): Promise<string>;
  createDatabaseRuntime?: CreateDatabaseRuntime;
  createObserveDatabaseRuntime?: CreateObserveDatabaseRuntime;
  createReflectDatabaseRuntime?: CreateReflectDatabaseRuntime;
  createInitConnectRuntime?: CreateInitConnectRuntime;
}

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

const createDefaultIdFactory = (): ((prefix: string) => string) => {
  let counter = 0;

  return (prefix: string): string => {
    counter += 1;
    return `${prefix}-${Date.now()}-${counter}`;
  };
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

  if (parsed.command === undefined || parsed.command.kind === "help") {
    return {
      exitCode: 0,
      stdout: formatUsage(),
      stderr: ""
    };
  }

  if (parsed.command.kind === "audit") {
    try {
      const result = await runAuditCommand({
        cwd: runtime.cwd ?? process.cwd(),
        now,
        command: parsed.command,
        ...(runtime.readGitChangedFiles === undefined
          ? {}
          : { readGitChangedFiles: runtime.readGitChangedFiles })
      });

      return {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: ""
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown audit error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: `${message}\n`
      };
    }
  }

  if (parsed.command.kind === "sourceClaimAddHelp") {
    return {
      exitCode: 0,
      stdout: formatSourceClaimAddUsage(),
      stderr: ""
    };
  }

  if (parsed.command.kind === "init") {
    try {
      const result = await runInitCommand({
        cwd: runtime.cwd ?? process.cwd(),
        env: runtime.env,
        mode: parsed.command.mode,
        repo: parsed.command.repo,
        ...(parsed.command.mode === "connect" ? { persist: parsed.command.persist } : {}),
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
        stderr: `${message}\n`
      };
    }
  }

  if (parsed.command.kind === "sourceDecisionLinkHelp") {
    return {
      exitCode: 0,
      stdout: formatSourceDecisionLinkUsage(),
      stderr: ""
    };
  }

  if (parsed.command.kind === "sourceClaimRejectHelp") {
    return {
      exitCode: 0,
      stdout: formatSourceClaimRejectUsage(),
      stderr: ""
    };
  }

  if (parsed.command.kind === "memoryCandidateAddHelp") {
    return {
      exitCode: 0,
      stdout: formatMemoryCandidateAddUsage(),
      stderr: ""
    };
  }

  if (parsed.command.kind === "memoryCandidatePromoteHelp") {
    return {
      exitCode: 0,
      stdout: formatMemoryCandidatePromoteUsage(),
      stderr: ""
    };
  }

  if (parsed.command.kind === "memoryCandidateRejectHelp") {
    return {
      exitCode: 0,
      stdout: formatMemoryCandidateRejectUsage(),
      stderr: ""
    };
  }

  if (parsed.command.kind === "memoryRecordApplyHelp") {
    return {
      exitCode: 0,
      stdout: formatMemoryRecordApplyUsage(),
      stderr: ""
    };
  }

  if (parsed.command.kind === "memoryAntiAddHelp") {
    return {
      exitCode: 0,
      stdout: formatMemoryAntiAddUsage(),
      stderr: ""
    };
  }

  if (parsed.command.kind === "sourceClaimAdd") {
    try {
      const result = await runSourceClaimAddCommand({
        env: runtime.env,
        now,
        createId,
        command: parsed.command,
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
      const message = error instanceof Error ? error.message : "Unknown source claim error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: `${message}\n`
      };
    }
  }

  if (parsed.command.kind === "sourceDecisionLink") {
    try {
      const result = await runSourceDecisionLinkCommand({
        env: runtime.env,
        now,
        createId,
        command: parsed.command,
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
      const message = error instanceof Error ? error.message : "Unknown source decision link error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: `${message}\n`
      };
    }
  }

  if (parsed.command.kind === "sourceClaimReject") {
    try {
      const result = await runSourceClaimRejectCommand({
        env: runtime.env,
        now,
        createId,
        command: parsed.command,
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
      const message = error instanceof Error ? error.message : "Unknown source claim reject error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: `${message}\n`
      };
    }
  }

  if (parsed.command.kind === "memoryCandidateAdd") {
    try {
      const result = await runMemoryCandidateAddCommand({
        env: runtime.env,
        now,
        createId,
        command: parsed.command,
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
      const message = error instanceof Error ? error.message : "Unknown memory candidate add error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: `${message}\n`
      };
    }
  }

  if (
    parsed.command.kind === "memoryCandidatePromote" ||
    parsed.command.kind === "memoryCandidateReject"
  ) {
    try {
      const result = await runMemoryCandidateReviewCommand({
        env: runtime.env,
        now,
        createId,
        command: parsed.command,
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
      const message =
        error instanceof Error ? error.message : "Unknown memory candidate review error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: `${message}\n`
      };
    }
  }

  if (parsed.command.kind === "memoryRecordApply") {
    try {
      const result = await runMemoryRecordApplyCommand({
        env: runtime.env,
        now,
        createId,
        command: parsed.command,
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
      const message =
        error instanceof Error ? error.message : "Unknown memory record apply error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: `${message}\n`
      };
    }
  }

  if (parsed.command.kind === "memoryAntiAdd") {
    try {
      const result = await runMemoryAntiAddCommand({
        env: runtime.env,
        now,
        createId,
        command: parsed.command,
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
      const message =
        error instanceof Error ? error.message : "Unknown memory anti add error";

      return {
        exitCode: 1,
        stdout: "",
        stderr: `${message}\n`
      };
    }
  }

  if (parsed.command.kind === "plan") {
    try {
      const result = await runPlanCommand(parsed.command.task, {
        env: runtime.env,
        now,
        createId,
        persist: parsed.command.persist,
        ...(parsed.command.projectId === undefined ? {} : { projectId: parsed.command.projectId }),
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
        stderr: `${message}\n`
      };
    }
  }

  if (parsed.command.kind === "doctor") {
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
        stderr: `${message}\n`
      };
    }
  }

  if (parsed.command.kind === "dbReadiness") {
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
        stderr: `${message}\n`
      };
    }
  }

  if (parsed.command.kind === "dbSmoke") {
    try {
      const result = await runDbSmokeCommand({
        env: runtime.env,
        cwd: runtime.cwd ?? process.cwd(),
        createId,
        target: parsed.command.target
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
        stderr: `${message}\n`
      };
    }
  }

  if (parsed.command.kind === "codexBrief") {
    try {
      const result = await runCodexBriefCommand({
        env: runtime.env,
        now,
        createId,
        runId: parsed.command.runId,
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
        stderr: `${message}\n`
      };
    }
  }

  if (parsed.command.kind === "evidenceCapture") {
    try {
      const result = await runEvidenceCaptureCommand({
        env: runtime.env,
        cwd: runtime.cwd ?? process.cwd(),
        now,
        createId,
        persist: parsed.command.persist,
        ...(parsed.command.runId === undefined ? {} : { runId: parsed.command.runId }),
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
        stderr: `${message}\n`
      };
    }
  }

  if (parsed.command.kind === "observeRun") {
    try {
      const result = await runObserveCommand({
        env: runtime.env,
        now,
        command: parsed.command,
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
        stderr: `${message}\n`
      };
    }
  }

  if (parsed.command.kind === "reflect") {
    try {
      const result = await runReflectCommand({
        env: runtime.env,
        now,
        createId,
        command: parsed.command,
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
        stderr: `${message}\n`
      };
    }
  }

  return {
    exitCode: 2,
    stdout: "",
    stderr: formatUsage()
  };
};
