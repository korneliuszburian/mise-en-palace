import {
  formatUsage,
  parseArgs
} from "./parseArgs.js";
import {
  runPlanCommand
} from "./runPlanCommand.js";
import type {
  CreateDatabaseRuntime
} from "./runPlanCommand.js";
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

export interface CliRuntime {
  env: Record<string, string | undefined>;
  cwd?: string;
  now?(): string;
  createId?(prefix: string): string;
  readGitStatus?(): Promise<string>;
  createDatabaseRuntime?: CreateDatabaseRuntime;
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

  if (parsed.command.kind === "plan") {
    try {
      const result = await runPlanCommand(parsed.command.task, {
        env: runtime.env,
        now,
        createId,
        persist: parsed.command.persist,
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

  return {
    exitCode: 2,
    stdout: "",
    stderr: formatUsage()
  };
};
