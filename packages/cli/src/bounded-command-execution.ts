import {
  spawn
} from "node:child_process";
import type {
  ChildProcess
} from "node:child_process";
import {
  commandOutputArtifactStreamByteCap
} from "@krn/core";

const commandTerminationGraceMs = 100;

export const startCommandDeadline = (
  child: ChildProcess,
  timeoutMs: number | undefined,
  onTimeout: () => void
): (() => void) => {
  if (timeoutMs === undefined) {
    return () => undefined;
  }

  let forceKillTimeout: NodeJS.Timeout | undefined;
  const timeout = setTimeout(() => {
    onTimeout();
    child.kill("SIGTERM");
    forceKillTimeout = setTimeout(() => {
      child.kill("SIGKILL");
    }, commandTerminationGraceMs);
  }, timeoutMs);

  return () => {
    clearTimeout(timeout);
    if (forceKillTimeout !== undefined) clearTimeout(forceKillTimeout);
  };
};

export interface BoundedCommandExecution {
  exitCode: number | null;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  timedOut: boolean;
  stdout: Uint8Array;
  stdoutTotalByteCount: number;
  stderr: Uint8Array;
  stderrTotalByteCount: number;
}

export interface BoundedCommandExecutionOptions {
  env?: NodeJS.ProcessEnv;
  input?: string;
  timeoutMs?: number;
}

export interface BoundedStreamCollector {
  append(chunk: Uint8Array): void;
  snapshot(): {
    bytes: Uint8Array;
    totalByteCount: number;
  };
}

export const createBoundedStreamCollector = (): BoundedStreamCollector => {
  const prefix = new Uint8Array(commandOutputArtifactStreamByteCap);
  let storedByteCount = 0;
  let totalByteCount = 0;

  return {
    append(chunk) {
      if (totalByteCount > Number.MAX_SAFE_INTEGER - chunk.byteLength) {
        throw new Error("Command output byte count exceeded the safe integer boundary");
      }

      const remaining = commandOutputArtifactStreamByteCap - storedByteCount;
      const capturedByteCount = Math.min(remaining, chunk.byteLength);

      if (capturedByteCount > 0) {
        prefix.set(chunk.subarray(0, capturedByteCount), storedByteCount);
        storedByteCount += capturedByteCount;
      }

      totalByteCount += chunk.byteLength;
    },
    snapshot() {
      return {
        bytes: prefix.slice(0, storedByteCount),
        totalByteCount
      };
    }
  };
};

export const runBoundedCommand = (
  command: string,
  args: readonly string[],
  cwd: string,
  options: BoundedCommandExecutionOptions = {}
): Promise<BoundedCommandExecution> => new Promise((resolve, reject) => {
  const startedAtMilliseconds = Date.now();
  const startedAt = new Date(startedAtMilliseconds).toISOString();
  const stdout = createBoundedStreamCollector();
  const stderr = createBoundedStreamCollector();
  const child = spawn(command, args, {
    cwd,
    env: options.env,
    stdio: ["pipe", "pipe", "pipe"]
  });
  let settled = false;
  let timedOut = false;
  const clearCommandDeadline = startCommandDeadline(
    child,
    options.timeoutMs,
    () => {
      timedOut = true;
    }
  );

  const fail = (error: Error): void => {
    if (settled) return;
    settled = true;
    clearCommandDeadline();
    child.kill("SIGTERM");
    reject(new Error(`Bounded command execution failed for ${command}: ${error.message}`));
  };

  child.stdout.on("data", (chunk: Buffer) => {
    try {
      stdout.append(chunk);
    } catch (error) {
      fail(error instanceof Error ? error : new Error("Invalid stdout chunk"));
    }
  });
  child.stderr.on("data", (chunk: Buffer) => {
    try {
      stderr.append(chunk);
    } catch (error) {
      fail(error instanceof Error ? error : new Error("Invalid stderr chunk"));
    }
  });
  child.on("error", fail);
  child.on("close", (exitCode) => {
    if (settled) return;
    settled = true;
    clearCommandDeadline();
    const completedAt = new Date().toISOString();
    const stdoutSnapshot = stdout.snapshot();
    const stderrSnapshot = stderr.snapshot();

    resolve({
      exitCode: timedOut ? null : exitCode,
      startedAt,
      completedAt,
      durationMs: Date.now() - startedAtMilliseconds,
      timedOut,
      stdout: stdoutSnapshot.bytes,
      stdoutTotalByteCount: stdoutSnapshot.totalByteCount,
      stderr: stderrSnapshot.bytes,
      stderrTotalByteCount: stderrSnapshot.totalByteCount
    });
  });

  if (options.input === undefined) child.stdin.end();
  else child.stdin.end(options.input);
});
