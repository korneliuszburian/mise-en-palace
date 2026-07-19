import {
  mkdtemp,
  rm,
  writeFile
} from "node:fs/promises";
import {
  tmpdir
} from "node:os";
import path from "node:path";
import {
  afterEach,
  describe,
  expect,
  it
} from "vitest";
import {
  commandOutputArtifactStreamByteCap,
  createCommandOutputArtifact,
  assessEvidenceCommandHelpedProof
} from "@krn/core";
import {
  commandOutputArtifactSha256Hex,
  prepareEvidenceCommandArtifacts
} from "../evidence-command-artifacts.js";

const temporaryDirectories: string[] = [];

const temporaryDirectory = async (): Promise<string> => {
  const directory = await mkdtemp(path.join(tmpdir(), "krn-cli-command-artifact-"));
  temporaryDirectories.push(directory);
  return directory;
};

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })
  ));
});

describe("prepareEvidenceCommandArtifacts", () => {
  it("captures bounded file prefixes with exact totals and generated references", async () => {
    const cwd = await temporaryDirectory();
    const stdout = Buffer.alloc(commandOutputArtifactStreamByteCap + 17, "o");
    const stderr = Buffer.from("warning\n");
    await writeFile(path.join(cwd, "stdout.log"), stdout);
    await writeFile(path.join(cwd, "stderr.log"), stderr);

    const prepared = await prepareEvidenceCommandArtifacts({
      cwd,
      commands: [{
        command: "pnpm typecheck",
        status: "passed",
        exitCode: 0,
        startedAt: "2026-07-14T20:00:00.000Z",
        capturedAt: "2026-07-14T20:00:01.000Z",
        stdoutFile: "stdout.log",
        stderrFile: "stderr.log"
      }]
    });

    expect(prepared.commandOutputArtifacts).toHaveLength(1);
    expect(prepared.commandOutputArtifacts[0]).toMatchObject({
      command: "pnpm typecheck",
      exitCode: 0,
      startedAt: "2026-07-14T20:00:00.000Z",
      completedAt: "2026-07-14T20:00:01.000Z",
      stdout: {
        storedByteCount: commandOutputArtifactStreamByteCap,
        totalByteCount: commandOutputArtifactStreamByteCap + 17,
        truncated: true
      },
      stderr: {
        storedByteCount: stderr.byteLength,
        totalByteCount: stderr.byteLength,
        truncated: false
      }
    });
    expect(prepared.commands).toEqual([{
      kind: "captured_output_file",
      command: "pnpm typecheck",
      status: "passed",
      provenance: "captured_output_file",
      exitCode: 0,
      capturedAt: "2026-07-14T20:00:01.000Z",
      outputRef: prepared.commandOutputArtifacts[0]!.outputRef,
      doesNotProve:
        "This command result does not prove memory quality, source truth, review correctness, or production readiness."
    }]);
    expect(assessEvidenceCommandHelpedProof({
      command: prepared.commands[0]!,
      packetGeneratedAt: "2026-07-14T20:00:00.000Z",
      resolveCommandOutputArtifact: (outputRef) =>
        prepared.commandOutputArtifacts.find((artifact) => artifact.outputRef === outputRef),
      sha256Hex: commandOutputArtifactSha256Hex
    })).toEqual({
      status: "eligible"
    });
  });

  it("fails before returning when an explicit output file cannot be read", async () => {
    const cwd = await temporaryDirectory();
    await writeFile(path.join(cwd, "stderr.log"), "");

    await expect(prepareEvidenceCommandArtifacts({
      cwd,
      commands: [{
        command: "pnpm test",
        status: "failed",
        exitCode: 1,
        startedAt: "2026-07-14T20:00:00.000Z",
        capturedAt: "2026-07-14T20:00:01.000Z",
        stdoutFile: "missing.log",
        stderrFile: "stderr.log"
      }]
    })).rejects.toThrow('Unable to capture --stdout-file "missing.log"');
  });

  it("validates runner artifacts and attaches their references before readback", async () => {
    const artifact = createCommandOutputArtifact({
      command: "pnpm test",
      exitCode: 0,
      startedAt: "2026-07-14T20:00:00.000Z",
      completedAt: "2026-07-14T20:00:01.000Z",
      stdout: new TextEncoder().encode("ok\n"),
      stderr: new Uint8Array()
    }, commandOutputArtifactSha256Hex);

    const prepared = await prepareEvidenceCommandArtifacts({
      cwd: process.cwd(),
      commands: [{
        command: artifact.command,
        status: "passed",
        provenance: "command_runner",
        exitCode: artifact.exitCode,
        capturedAt: artifact.completedAt
      }],
      commandOutputArtifacts: [artifact]
    });

    expect(prepared.commands[0]).toMatchObject({
      kind: "command_runner",
      outputRef: artifact.outputRef,
      capturedAt: artifact.completedAt
    });
    expect(prepared.commandOutputArtifacts).toEqual([artifact]);
  });

  it("rejects a runner row whose reference has no matching artifact", async () => {
    await expect(prepareEvidenceCommandArtifacts({
      cwd: process.cwd(),
      commands: [{
        command: "pnpm test",
        status: "passed",
        provenance: "command_runner",
        exitCode: 0,
        capturedAt: "2026-07-14T20:00:01.000Z",
        outputRef: `command-output:sha256:${"0".repeat(64)}`
      }]
    })).rejects.toThrow("command_runner evidence requires a matching command output artifact");
  });

  it("rejects two runner rows that reuse one artifact", async () => {
    const artifact = createCommandOutputArtifact({
      command: "pnpm test",
      exitCode: 0,
      startedAt: "2026-07-14T20:00:00.000Z",
      completedAt: "2026-07-14T20:00:01.000Z",
      stdout: new TextEncoder().encode("ok\n"),
      stderr: new Uint8Array()
    }, commandOutputArtifactSha256Hex);
    const command = {
      command: artifact.command,
      status: "passed" as const,
      provenance: "command_runner" as const,
      exitCode: artifact.exitCode,
      capturedAt: artifact.completedAt,
      outputRef: artifact.outputRef
    };

    await expect(prepareEvidenceCommandArtifacts({
      cwd: process.cwd(),
      commands: [command, command],
      commandOutputArtifacts: [artifact]
    })).rejects.toThrow("already attached to command evidence");
  });
});
