import {
  formatUsage,
  parseArgs
} from "./parseArgs.js";
import {
  runPlanCommand
} from "./runPlanCommand.js";

export interface CliRuntime {
  env: Record<string, string | undefined>;
  now?(): string;
  createId?(prefix: string): string;
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
        createId
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

  return {
    exitCode: 2,
    stdout: "",
    stderr: formatUsage()
  };
};
