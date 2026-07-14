import { isIsoTimestamp } from "./time.js";
import type { IsoTimestamp } from "./time.js";

export const commandOutputArtifactStreamByteCap = 64 * 1024;

export type CommandOutputArtifactSha256Hex = (
  value: string | Uint8Array
) => string;

export interface CommandOutputStreamArtifact {
  bytes: Uint8Array;
  storedByteCount: number;
  totalByteCount: number;
  truncated: boolean;
  sha256: string;
}

export interface CommandOutputArtifact {
  outputRef: string;
  command: string;
  exitCode: number;
  startedAt: IsoTimestamp;
  completedAt: IsoTimestamp;
  stdout: CommandOutputStreamArtifact;
  stderr: CommandOutputStreamArtifact;
}

export type ResolveCommandOutputArtifact = (
  outputRef: string
) => CommandOutputArtifact | undefined;

export interface CreateCommandOutputArtifactInput {
  command: string;
  exitCode: number;
  startedAt: IsoTimestamp;
  completedAt: IsoTimestamp;
  stdout: Uint8Array;
  stdoutTotalByteCount?: number;
  stderr: Uint8Array;
  stderrTotalByteCount?: number;
}

type CommandOutputStreamName = "stdout" | "stderr";
type CommandOutputStreamIntegrityFailure =
  | "invalid_bytes"
  | "stored_byte_count_mismatch"
  | "total_byte_count_invalid"
  | "truncation_mismatch"
  | "sha256_mismatch";

export type CommandOutputArtifactIntegrityFailureReason =
  | "invalid_output_ref"
  | "invalid_command"
  | "invalid_exit_code"
  | "invalid_started_at"
  | "noncanonical_started_at"
  | "invalid_completed_at"
  | "noncanonical_completed_at"
  | "completed_before_started"
  | `${CommandOutputStreamName}_${CommandOutputStreamIntegrityFailure}`
  | "output_ref_mismatch";

export type CommandOutputArtifactIntegrityAssessment =
  | { status: "valid" }
  | {
      status: "invalid";
      reason: CommandOutputArtifactIntegrityFailureReason;
    };

const sha256HexPattern = /^[a-f0-9]{64}$/u;
const commandOutputRefPattern = /^command-output:sha256:[a-f0-9]{64}$/u;

const normalizedSha256Hex = (
  value: string | Uint8Array,
  sha256Hex: CommandOutputArtifactSha256Hex
): string | undefined => {
  try {
    const digest = sha256Hex(value).trim().toLowerCase();

    return sha256HexPattern.test(digest) ? digest : undefined;
  } catch {
    return undefined;
  }
};

const commandOutputStreamArtifact = (
  bytes: Uint8Array,
  suppliedTotalByteCount: number | undefined,
  sha256Hex: CommandOutputArtifactSha256Hex
): CommandOutputStreamArtifact => {
  const totalByteCount = suppliedTotalByteCount ?? bytes.byteLength;
  const expectedPrefixByteCount = Math.min(
    totalByteCount,
    commandOutputArtifactStreamByteCap
  );

  if (
    !Number.isSafeInteger(totalByteCount) ||
    totalByteCount < 0 ||
    (bytes.byteLength !== totalByteCount && bytes.byteLength !== expectedPrefixByteCount)
  ) {
    throw new Error(
      "Command output artifact stream must contain either all bytes or the exact capped prefix"
    );
  }

  const storedBytes = Uint8Array.from(
    bytes.subarray(0, commandOutputArtifactStreamByteCap)
  );
  const sha256 = normalizedSha256Hex(storedBytes, sha256Hex);

  if (sha256 === undefined) {
    throw new Error("Command output artifact SHA-256 function returned an invalid digest");
  }

  return {
    bytes: storedBytes,
    storedByteCount: storedBytes.byteLength,
    totalByteCount,
    truncated: totalByteCount > storedBytes.byteLength,
    sha256
  };
};

type CommandOutputArtifactEnvelope = Omit<CommandOutputArtifact, "outputRef">;

const canonicalCommandOutputArtifactEnvelope = (
  artifact: CommandOutputArtifactEnvelope
): string => JSON.stringify({
  kind: "krn.commandOutputArtifact.v1",
  command: artifact.command,
  exitCode: artifact.exitCode,
  startedAt: artifact.startedAt,
  completedAt: artifact.completedAt,
  stdout: {
    storedByteCount: artifact.stdout.storedByteCount,
    totalByteCount: artifact.stdout.totalByteCount,
    truncated: artifact.stdout.truncated,
    sha256: artifact.stdout.sha256
  },
  stderr: {
    storedByteCount: artifact.stderr.storedByteCount,
    totalByteCount: artifact.stderr.totalByteCount,
    truncated: artifact.stderr.truncated,
    sha256: artifact.stderr.sha256
  }
});

const commandOutputRefFor = (
  artifact: CommandOutputArtifactEnvelope,
  sha256Hex: CommandOutputArtifactSha256Hex
): string | undefined => {
  const digest = normalizedSha256Hex(
    canonicalCommandOutputArtifactEnvelope(artifact),
    sha256Hex
  );

  return digest === undefined ? undefined : `command-output:sha256:${digest}`;
};

const canonicalIsoTimestamp = (value: IsoTimestamp): IsoTimestamp =>
  isIsoTimestamp(value) ? new Date(value).toISOString() : value;

const invalidIntegrity = (
  reason: CommandOutputArtifactIntegrityFailureReason
): CommandOutputArtifactIntegrityAssessment => ({
  status: "invalid",
  reason
});

const streamIntegrityFailureReason = (
  stream: CommandOutputStreamName,
  failure: CommandOutputStreamIntegrityFailure
): CommandOutputArtifactIntegrityFailureReason => `${stream}_${failure}`;

const storedByteCountMatches = (stream: CommandOutputStreamArtifact): boolean =>
  Number.isSafeInteger(stream.storedByteCount) &&
  stream.storedByteCount >= 0 &&
  stream.storedByteCount === stream.bytes.byteLength;

const totalByteCountIsValid = (stream: CommandOutputStreamArtifact): boolean =>
  Number.isSafeInteger(stream.totalByteCount) &&
  stream.totalByteCount >= stream.storedByteCount;

const storedPrefixLengthMatches = (stream: CommandOutputStreamArtifact): boolean =>
  stream.storedByteCount === Math.min(
    stream.totalByteCount,
    commandOutputArtifactStreamByteCap
  );

const truncationMatches = (stream: CommandOutputStreamArtifact): boolean =>
  stream.truncated === (stream.totalByteCount > commandOutputArtifactStreamByteCap);

const streamSha256Matches = (
  stream: CommandOutputStreamArtifact,
  sha256Hex: CommandOutputArtifactSha256Hex
): boolean => normalizedSha256Hex(stream.bytes, sha256Hex) === stream.sha256;

const assessCommandOutputStreamArtifactIntegrity = (
  streamName: CommandOutputStreamName,
  stream: CommandOutputStreamArtifact,
  sha256Hex: CommandOutputArtifactSha256Hex
): CommandOutputArtifactIntegrityAssessment => {
  if (!(stream.bytes instanceof Uint8Array)) {
    return invalidIntegrity(streamIntegrityFailureReason(streamName, "invalid_bytes"));
  }

  if (!storedByteCountMatches(stream)) {
    return invalidIntegrity(
      streamIntegrityFailureReason(streamName, "stored_byte_count_mismatch")
    );
  }

  if (!totalByteCountIsValid(stream)) {
    return invalidIntegrity(
      streamIntegrityFailureReason(streamName, "total_byte_count_invalid")
    );
  }

  if (!storedPrefixLengthMatches(stream)) {
    return invalidIntegrity(
      streamIntegrityFailureReason(streamName, "stored_byte_count_mismatch")
    );
  }

  if (!truncationMatches(stream)) {
    return invalidIntegrity(
      streamIntegrityFailureReason(streamName, "truncation_mismatch")
    );
  }

  if (!streamSha256Matches(stream, sha256Hex)) {
    return invalidIntegrity(streamIntegrityFailureReason(streamName, "sha256_mismatch"));
  }

  return { status: "valid" };
};

export const assessCommandOutputArtifactIntegrity = (
  artifact: CommandOutputArtifact,
  sha256Hex: CommandOutputArtifactSha256Hex
): CommandOutputArtifactIntegrityAssessment => {
  if (!commandOutputRefPattern.test(artifact.outputRef)) {
    return invalidIntegrity("invalid_output_ref");
  }

  if (artifact.command.trim().length === 0) {
    return invalidIntegrity("invalid_command");
  }

  if (!Number.isSafeInteger(artifact.exitCode)) {
    return invalidIntegrity("invalid_exit_code");
  }

  if (!isIsoTimestamp(artifact.startedAt)) {
    return invalidIntegrity("invalid_started_at");
  }

  if (canonicalIsoTimestamp(artifact.startedAt) !== artifact.startedAt) {
    return invalidIntegrity("noncanonical_started_at");
  }

  if (!isIsoTimestamp(artifact.completedAt)) {
    return invalidIntegrity("invalid_completed_at");
  }

  if (canonicalIsoTimestamp(artifact.completedAt) !== artifact.completedAt) {
    return invalidIntegrity("noncanonical_completed_at");
  }

  if (Date.parse(artifact.completedAt) < Date.parse(artifact.startedAt)) {
    return invalidIntegrity("completed_before_started");
  }

  const stdoutIntegrity = assessCommandOutputStreamArtifactIntegrity(
    "stdout",
    artifact.stdout,
    sha256Hex
  );
  if (stdoutIntegrity.status === "invalid") {
    return stdoutIntegrity;
  }

  const stderrIntegrity = assessCommandOutputStreamArtifactIntegrity(
    "stderr",
    artifact.stderr,
    sha256Hex
  );
  if (stderrIntegrity.status === "invalid") {
    return stderrIntegrity;
  }

  const expectedOutputRef = commandOutputRefFor(artifact, sha256Hex);

  return expectedOutputRef === artifact.outputRef
    ? { status: "valid" }
    : invalidIntegrity("output_ref_mismatch");
};

export const createCommandOutputArtifact = (
  input: CreateCommandOutputArtifactInput,
  sha256Hex: CommandOutputArtifactSha256Hex
): CommandOutputArtifact => {
  if (!(input.stdout instanceof Uint8Array) || !(input.stderr instanceof Uint8Array)) {
    throw new Error("Command output artifact streams must be Uint8Array values");
  }

  const envelope: CommandOutputArtifactEnvelope = {
    command: input.command,
    exitCode: input.exitCode,
    startedAt: canonicalIsoTimestamp(input.startedAt),
    completedAt: canonicalIsoTimestamp(input.completedAt),
    stdout: commandOutputStreamArtifact(
      input.stdout,
      input.stdoutTotalByteCount,
      sha256Hex
    ),
    stderr: commandOutputStreamArtifact(
      input.stderr,
      input.stderrTotalByteCount,
      sha256Hex
    )
  };
  const outputRef = commandOutputRefFor(envelope, sha256Hex);

  if (outputRef === undefined) {
    throw new Error("Command output artifact SHA-256 function returned an invalid digest");
  }

  const artifact: CommandOutputArtifact = {
    outputRef,
    ...envelope
  };
  const integrity = assessCommandOutputArtifactIntegrity(artifact, sha256Hex);

  if (integrity.status === "invalid") {
    throw new Error(`Invalid command output artifact: ${integrity.reason}`);
  }

  return artifact;
};
