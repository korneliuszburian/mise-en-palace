import type {
  CommandOutputArtifact,
  EvidenceCommand,
  EvidenceCommandStatus
} from "@krn/core";
import {
  commandOutputArtifactStreamByteCap,
  createCommandOutputArtifact
} from "@krn/core";
import {
  commandOutputArtifactSha256Hex
} from "../../command-output-artifact-hash.js";
import type {
  CommandResult,
  HeldOutArmScore
} from "./paired-live-codex-repair.js";

export interface PairedCommandEvidence {
  command: EvidenceCommand;
  commandOutputArtifact?: CommandOutputArtifact;
}

interface CapturedStream {
  bytes: Uint8Array;
  totalByteCount: number;
  exact: boolean;
}

const capturedStream = (
  value: string,
  storedBytes: Uint8Array | undefined,
  suppliedTotalByteCount: number | undefined
): CapturedStream => {
  const encoded = new TextEncoder().encode(value);
  const bytes = storedBytes ?? encoded;
  const totalByteCount = suppliedTotalByteCount ?? bytes.byteLength;

  return {
    bytes,
    totalByteCount,
    exact: storedBytes !== undefined || totalByteCount === encoded.byteLength
  };
};

const commandStatus = (result: CommandResult): EvidenceCommandStatus => {
  if (result.stderr.includes("skipped")) return "skipped";
  return result.exitCode === 0 ? "passed" : "failed";
};

export const executedCommandIdentity = (result: CommandResult): string =>
  `${result.command} ${result.args.join(" ")}`.trim();

const pairedCommandLabel = (
  arm: "baseline" | "krn",
  label: string,
  result: CommandResult
): string => `${arm}:${label} ${executedCommandIdentity(result)}`;

const commandDoesNotProve = (result: CommandResult): string =>
  `Command outcome (${result.durationMs ?? "unknown"}ms) does not prove arbitrary-repository portability or product readiness.`;

const operatorReportedCommand = (
  command: string,
  result: CommandResult
): EvidenceCommand => ({
  command,
  status: commandStatus(result),
  provenance: "operator_reported",
  ...(result.exitCode === null ? {} : { exitCode: result.exitCode }),
  ...(result.completedAt === undefined ? {} : { capturedAt: result.completedAt }),
  assertedBy: "krn-paired-live-codex-repair",
  doesNotProve: commandDoesNotProve(result)
});

const commandRunnerArtifact = (
  command: string,
  result: CommandResult
): CommandOutputArtifact | undefined => {
  if (result.exitCode === null || result.stderr.includes("skipped")) return undefined;
  if (result.startedAt === undefined || result.completedAt === undefined) return undefined;

  const stdout = capturedStream(
    result.stdout,
    result.stdoutStoredBytes,
    result.stdoutTotalByteCount
  );
  const stderr = capturedStream(
    result.stderr,
    result.stderrStoredBytes,
    result.stderrTotalByteCount
  );

  if (!stdout.exact || !stderr.exact) return undefined;
  if (
    stdout.totalByteCount !== stdout.bytes.byteLength ||
    stderr.totalByteCount !== stderr.bytes.byteLength
  ) return undefined;

  return createCommandOutputArtifact({
    command,
    exitCode: result.exitCode,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    stdout: stdout.bytes,
    stdoutTotalByteCount: stdout.totalByteCount,
    stderr: stderr.bytes,
    stderrTotalByteCount: stderr.totalByteCount
  }, commandOutputArtifactSha256Hex);
};

const commandEvidence = (
  command: string,
  result: CommandResult
): PairedCommandEvidence => {
  const commandOutputArtifact = commandRunnerArtifact(command, result);

  if (commandOutputArtifact === undefined) {
    return { command: operatorReportedCommand(command, result) };
  }

  return {
    commandOutputArtifact,
    command: {
      command,
      status: result.exitCode === 0 ? "passed" : "failed",
      provenance: "command_runner",
      exitCode: commandOutputArtifact.exitCode,
      capturedAt: commandOutputArtifact.completedAt,
      outputRef: commandOutputArtifact.outputRef,
      doesNotProve: commandDoesNotProve(result)
    }
  };
};

export const executedCommandEvidence = (
  result: CommandResult
): PairedCommandEvidence => commandEvidence(executedCommandIdentity(result), result);

export const pairedCommandEvidence = (
  arm: "baseline" | "krn",
  label: string,
  result: CommandResult
): PairedCommandEvidence => commandEvidence(pairedCommandLabel(arm, label, result), result);

const streamSummary = (
  value: string,
  storedBytes: Uint8Array | undefined,
  suppliedTotalByteCount: number | undefined
) => {
  const encoded = new TextEncoder().encode(value);
  const availableBytes = storedBytes ?? encoded;
  const bytes = availableBytes.slice(0, commandOutputArtifactStreamByteCap);

  return {
    storedByteCount: bytes.byteLength,
    totalByteCount: suppliedTotalByteCount ?? encoded.byteLength,
    storedBytesSha256: commandOutputArtifactSha256Hex(bytes)
  };
};

const commandResultSummary = (result: CommandResult) => ({
  command: result.command,
  argCount: result.args.length,
  status: commandStatus(result),
  exitCode: result.exitCode,
  ...(result.startedAt === undefined ? {} : { startedAt: result.startedAt }),
  ...(result.completedAt === undefined ? {} : { completedAt: result.completedAt }),
  ...(result.durationMs === undefined ? {} : { durationMs: result.durationMs }),
  stdout: streamSummary(
    result.stdout,
    result.stdoutStoredBytes,
    result.stdoutTotalByteCount
  ),
  stderr: streamSummary(
    result.stderr,
    result.stderrStoredBytes,
    result.stderrTotalByteCount
  )
});

const statusOutputSummary = (value: string) =>
  streamSummary(value, undefined, undefined);

export const pairedArmScoreSummary = (arm: HeldOutArmScore) => ({
  status: arm.status,
  score: arm.score,
  checks: arm.checks,
  changedFiles: arm.changedFiles,
  ...(arm.changeManifest === undefined
    ? {}
    : {
        changeManifest: {
          ...arm.changeManifest,
          statusOutput: statusOutputSummary(arm.changeManifest.statusOutput)
        }
      }),
  ...(arm.commands === undefined
    ? {}
    : {
        commands: {
          test: commandResultSummary(arm.commands.test),
          typecheck: commandResultSummary(arm.commands.typecheck),
          diffCheck: commandResultSummary(arm.commands.diffCheck)
        }
      }),
  ...(arm.runtimeCommand === undefined
    ? {}
    : { runtimeCommand: commandResultSummary(arm.runtimeCommand) })
});
