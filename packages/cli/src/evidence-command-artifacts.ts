import {
  open
} from "node:fs/promises";
import path from "node:path";
import type {
  CommandOutputArtifact,
  EvidenceCommand
} from "@krn/core";
import {
  assessCommandOutputArtifactIntegrity,
  commandOutputArtifactStreamByteCap,
  createCommandOutputArtifact,
  toEvidenceCommandReadback
} from "@krn/core";
import type {
  EvidenceCommandReadback
} from "@krn/core";
import {
  commandOutputArtifactSha256Hex
} from "./command-output-artifact-hash.js";

export {
  commandOutputArtifactSha256Hex
} from "./command-output-artifact-hash.js";

export interface EvidenceCommandCaptureInput extends EvidenceCommand {
  startedAt?: string;
  stdoutFile?: string;
  stderrFile?: string;
}

interface CapturedFilePrefix {
  bytes: Uint8Array;
  totalByteCount: number;
}

const captureFilePrefix = async (
  cwd: string,
  optionName: "--stdout-file" | "--stderr-file",
  filePath: string
): Promise<CapturedFilePrefix> => {
  const resolvedPath = path.resolve(cwd, filePath);
  let fileHandle: Awaited<ReturnType<typeof open>> | undefined;

  try {
    fileHandle = await open(resolvedPath, "r");
    const before = await fileHandle.stat();

    if (!before.isFile() || !Number.isSafeInteger(before.size)) {
      throw new Error("Output capture source is not a finite regular file");
    }

    const prefixByteCount = Math.min(
      before.size,
      commandOutputArtifactStreamByteCap
    );
    const bytes = new Uint8Array(prefixByteCount);
    let offset = 0;

    while (offset < prefixByteCount) {
      const readResult = await fileHandle.read(
        bytes,
        offset,
        prefixByteCount - offset,
        offset
      );

      if (readResult.bytesRead === 0) {
        throw new Error("Output capture source changed while it was read");
      }

      offset += readResult.bytesRead;
    }

    const after = await fileHandle.stat();

    if (after.size !== before.size) {
      throw new Error("Output capture source changed while it was read");
    }

    return {
      bytes,
      totalByteCount: before.size
    };
  } catch {
    throw new Error(`Unable to capture ${optionName} "${filePath}"`);
  } finally {
    await fileHandle?.close();
  }
};

const fileCaptureRequested = (command: EvidenceCommandCaptureInput): boolean =>
  command.startedAt !== undefined ||
  command.stdoutFile !== undefined ||
  command.stderrFile !== undefined;

const commandWithoutCaptureFields = (
  command: EvidenceCommandCaptureInput
): EvidenceCommand => {
  const {
    startedAt: _startedAt,
    stderrFile: _stderrFile,
    stdoutFile: _stdoutFile,
    ...evidenceCommand
  } = command;

  return evidenceCommand;
};

const assertCoherentExecution = (
  command: EvidenceCommandCaptureInput
): void => {
  if (command.status !== "passed" && command.status !== "failed") {
    throw new Error("Command output artifacts require passed or failed status");
  }

  if (!Number.isSafeInteger(command.exitCode)) {
    throw new Error("Command output artifacts require an integer exit code");
  }

  if (command.status === "passed" && command.exitCode !== 0) {
    throw new Error("Passed command output artifacts require exit code 0");
  }

  if (command.status === "failed" && command.exitCode === 0) {
    throw new Error("Failed command output artifacts require a non-zero exit code");
  }
};

const assertValidArtifact = (artifact: CommandOutputArtifact): void => {
  const integrity = assessCommandOutputArtifactIntegrity(
    artifact,
    commandOutputArtifactSha256Hex
  );

  if (integrity.status === "invalid") {
    throw new Error(
      `Invalid command output artifact ${artifact.outputRef}: ${integrity.reason}`
    );
  }
};

const matchingRunnerArtifacts = (
  command: EvidenceCommandCaptureInput,
  artifacts: readonly CommandOutputArtifact[]
): CommandOutputArtifact[] => command.outputRef === undefined
  ? artifacts.filter((artifact) =>
      artifact.command === command.command &&
      artifact.exitCode === command.exitCode &&
      artifact.completedAt === command.capturedAt
    )
  : [];

const assertRunnerArtifactMatches = (
  command: EvidenceCommandCaptureInput,
  artifact: CommandOutputArtifact
): void => {
  if (
    artifact.command !== command.command ||
    artifact.exitCode !== command.exitCode ||
    artifact.completedAt !== command.capturedAt ||
    (command.outputRef !== undefined && artifact.outputRef !== command.outputRef)
  ) {
    throw new Error("command_runner evidence does not match its command output artifact");
  }
};

const artifactForRunnerCommand = (
  command: EvidenceCommandCaptureInput,
  artifactsByRef: ReadonlyMap<string, CommandOutputArtifact>,
  artifacts: readonly CommandOutputArtifact[]
): CommandOutputArtifact => {
  const referencedArtifact = command.outputRef === undefined
    ? undefined
    : artifactsByRef.get(command.outputRef);
  const matchingArtifacts = referencedArtifact === undefined
    ? matchingRunnerArtifacts(command, artifacts)
    : [];
  const artifact = referencedArtifact ?? (
    matchingArtifacts.length === 1 ? matchingArtifacts[0] : undefined
  );

  if (artifact === undefined) {
    throw new Error(
      "command_runner evidence requires a matching command output artifact"
    );
  }

  assertRunnerArtifactMatches(command, artifact);

  return artifact;
};

const captureFileCommand = async (
  cwd: string,
  command: EvidenceCommandCaptureInput
): Promise<{
  artifact: CommandOutputArtifact;
  command: EvidenceCommandReadback;
}> => {
  assertCoherentExecution(command);

  if (
    command.startedAt === undefined ||
    command.capturedAt === undefined ||
    command.exitCode === undefined ||
    command.stdoutFile === undefined ||
    command.stderrFile === undefined
  ) {
    throw new Error(
      "File output capture requires startedAt, capturedAt, stdoutFile, and stderrFile"
    );
  }

  const exitCode = command.exitCode;
  const startedAt = command.startedAt;
  const completedAt = command.capturedAt;
  const stdoutFile = command.stdoutFile;
  const stderrFile = command.stderrFile;

  const [stdout, stderr] = await Promise.all([
    captureFilePrefix(cwd, "--stdout-file", stdoutFile),
    captureFilePrefix(cwd, "--stderr-file", stderrFile)
  ]);
  const artifact = createCommandOutputArtifact({
    command: command.command,
    exitCode,
    startedAt,
    completedAt,
    stdout: stdout.bytes,
    stdoutTotalByteCount: stdout.totalByteCount,
    stderr: stderr.bytes,
    stderrTotalByteCount: stderr.totalByteCount
  }, commandOutputArtifactSha256Hex);

  assertValidArtifact(artifact);

  return {
    artifact,
    command: toEvidenceCommandReadback({
      ...commandWithoutCaptureFields(command),
      provenance: "captured_output_file",
      outputRef: artifact.outputRef,
      capturedAt: artifact.completedAt
    })
  };
};

export interface PrepareEvidenceCommandArtifactsInput {
  cwd: string;
  commands: readonly EvidenceCommandCaptureInput[];
  commandOutputArtifacts?: readonly CommandOutputArtifact[];
}

export interface PreparedEvidenceCommandArtifacts {
  commands: EvidenceCommandReadback[];
  commandOutputArtifacts: CommandOutputArtifact[];
}

const registerArtifact = (
  artifact: CommandOutputArtifact,
  artifactsByRef: Map<string, CommandOutputArtifact>,
  artifacts: CommandOutputArtifact[]
): void => {
  if (artifactsByRef.has(artifact.outputRef)) {
    throw new Error(`Duplicate command output artifact: ${artifact.outputRef}`);
  }

  artifactsByRef.set(artifact.outputRef, artifact);
  artifacts.push(artifact);
};

const useArtifact = (
  artifact: CommandOutputArtifact,
  usedArtifactRefs: Set<string>
): void => {
  if (usedArtifactRefs.has(artifact.outputRef)) {
    throw new Error(
      `Command output artifact is already attached to command evidence: ${artifact.outputRef}`
    );
  }

  usedArtifactRefs.add(artifact.outputRef);
};

export const prepareEvidenceCommandArtifacts = async (
  input: PrepareEvidenceCommandArtifactsInput
): Promise<PreparedEvidenceCommandArtifacts> => {
  const commandOutputArtifacts = [...(input.commandOutputArtifacts ?? [])];
  const artifactsByRef = new Map<string, CommandOutputArtifact>();

  for (const artifact of commandOutputArtifacts) {
    assertValidArtifact(artifact);

    if (artifactsByRef.has(artifact.outputRef)) {
      throw new Error(`Duplicate command output artifact: ${artifact.outputRef}`);
    }

    artifactsByRef.set(artifact.outputRef, artifact);
  }

  const commands: EvidenceCommandReadback[] = [];
  const usedArtifactRefs = new Set<string>();

  for (const command of input.commands) {
    if (command.outputPath !== undefined) {
      throw new Error(
        "outputPath is not accepted for new evidence capture; use stdoutFile and stderrFile"
      );
    }

    if (fileCaptureRequested(command)) {
      const captured = await captureFileCommand(input.cwd, command);

      registerArtifact(captured.artifact, artifactsByRef, commandOutputArtifacts);
      useArtifact(captured.artifact, usedArtifactRefs);
      commands.push(captured.command);
      continue;
    }

    if (command.provenance === "command_runner") {
      assertCoherentExecution(command);
      const artifact = artifactForRunnerCommand(
        command,
        artifactsByRef,
        commandOutputArtifacts
      );

      useArtifact(artifact, usedArtifactRefs);
      commands.push(toEvidenceCommandReadback({
        ...commandWithoutCaptureFields(command),
        outputRef: artifact.outputRef,
        capturedAt: artifact.completedAt
      }));
      continue;
    }

    commands.push(toEvidenceCommandReadback(commandWithoutCaptureFields(command)));
  }

  const unusedArtifact = commandOutputArtifacts.find(
    (artifact) => !usedArtifactRefs.has(artifact.outputRef)
  );

  if (unusedArtifact !== undefined) {
    throw new Error(
      `Command output artifact is not attached to command evidence: ${unusedArtifact.outputRef}`
    );
  }

  return {
    commands,
    commandOutputArtifacts
  };
};
