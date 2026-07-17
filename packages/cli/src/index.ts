import {
  runCli
} from "./run-cli.js";
import type {
  CliResult,
  CliRuntime
} from "./run-cli.js";

export {
  runCli
} from "./run-cli.js";
export type {
  CliResult,
  CliRuntime
} from "./run-cli.js";

interface CliWriteStream {
  write(chunk: string): void;
}

interface CliProcessStreams {
  stdout: CliWriteStream;
  stderr: CliWriteStream;
}

type CliRunner = (
  args: readonly string[],
  runtime: CliRuntime
) => Promise<CliResult>;

const formatEntrypointError = (error: unknown): string => {
  if (error instanceof Error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "candidate_project_scope") {
    return `candidate_project_scope (non-retryable): ${error.message}. Remediation: align candidate project scope with the execution project; do not retry unchanged input.`;
  }
  return error instanceof Error ? error.message : "Unknown CLI error";
};

const writeCliResult = (
  result: CliResult,
  streams: CliProcessStreams
): void => {
  if (result.stdout.length > 0) {
    streams.stdout.write(result.stdout);
    if (!result.stdout.endsWith("\n")) {
      streams.stdout.write("\n");
    }
  }

  if (result.stderr.length > 0) {
    streams.stderr.write(result.stderr);
  }
};

export const runCliEntrypoint = async (
  args: readonly string[],
  runtime: CliRuntime,
  streams: CliProcessStreams,
  runner: CliRunner = runCli
): Promise<number> => {
  try {
    const result = await runner(args, runtime);
    writeCliResult(result, streams);
    return result.exitCode;
  } catch (error: unknown) {
    streams.stderr.write(`KRN CLI failed: ${formatEntrypointError(error)}\n`);
    return 1;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = await runCliEntrypoint(
    process.argv.slice(2),
    { env: process.env },
    {
      stdout: process.stdout,
      stderr: process.stderr
    }
  );
}
