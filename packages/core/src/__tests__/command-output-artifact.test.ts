import { createHash } from "node:crypto";

import { describe, expect, test } from "vitest";

import {
  assessCommandOutputArtifactIntegrity,
  commandOutputArtifactStreamByteCap,
  createCommandOutputArtifact
} from "../command-output-artifact.js";

const sha256Hex = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

const createArtifact = (input: {
  startedAt?: string;
  completedAt?: string;
  stdout?: Uint8Array;
  stderr?: Uint8Array;
} = {}) => createCommandOutputArtifact({
  command: "pnpm test",
  exitCode: 0,
  startedAt: input.startedAt ?? "2026-06-23T07:09:00.000Z",
  completedAt: input.completedAt ?? "2026-06-23T07:10:00.000Z",
  stdout: input.stdout ?? new Uint8Array(),
  stderr: input.stderr ?? new Uint8Array()
}, sha256Hex);

describe("command output artifacts", () => {
  test("caps each stream at exactly 64 KiB with explicit truncation", () => {
    const stdout = new Uint8Array(commandOutputArtifactStreamByteCap + 17).fill(97);
    const stderr = new Uint8Array(commandOutputArtifactStreamByteCap).fill(98);
    const artifact = createArtifact({ stdout, stderr });

    expect(artifact.stdout.bytes).toEqual(stdout.slice(0, commandOutputArtifactStreamByteCap));
    expect(artifact.stdout).toMatchObject({
      storedByteCount: commandOutputArtifactStreamByteCap,
      totalByteCount: commandOutputArtifactStreamByteCap + 17,
      truncated: true,
      sha256: sha256Hex(stdout.slice(0, commandOutputArtifactStreamByteCap))
    });
    expect(artifact.stderr.bytes).toEqual(stderr);
    expect(artifact.stderr).toMatchObject({
      storedByteCount: commandOutputArtifactStreamByteCap,
      totalByteCount: commandOutputArtifactStreamByteCap,
      truncated: false,
      sha256: sha256Hex(stderr)
    });
    expect(assessCommandOutputArtifactIntegrity(artifact, sha256Hex)).toEqual({
      status: "valid"
    });
  });

  test("accepts only an exact capped prefix when the complete stream stays outside memory", () => {
    const prefix = new Uint8Array(commandOutputArtifactStreamByteCap).fill(97);
    const artifact = createCommandOutputArtifact({
      command: "pnpm test",
      exitCode: 0,
      startedAt: "2026-06-23T07:09:00.000Z",
      completedAt: "2026-06-23T07:10:00.000Z",
      stdout: prefix,
      stdoutTotalByteCount: commandOutputArtifactStreamByteCap + 17,
      stderr: new Uint8Array(),
      stderrTotalByteCount: 0
    }, sha256Hex);

    expect(artifact.stdout).toMatchObject({
      storedByteCount: commandOutputArtifactStreamByteCap,
      totalByteCount: commandOutputArtifactStreamByteCap + 17,
      truncated: true
    });
    expect(() => createCommandOutputArtifact({
      command: "pnpm test",
      exitCode: 0,
      startedAt: "2026-06-23T07:09:00.000Z",
      completedAt: "2026-06-23T07:10:00.000Z",
      stdout: prefix.slice(0, commandOutputArtifactStreamByteCap - 1),
      stdoutTotalByteCount: commandOutputArtifactStreamByteCap + 17,
      stderr: new Uint8Array()
    }, sha256Hex)).toThrow("exact capped prefix");
  });

  test("owns stored bytes instead of retaining a mutable Buffer view", () => {
    const source = Buffer.from("command passed\n");
    const artifact = createArtifact({ stdout: source });
    const storedBeforeMutation = artifact.stdout.bytes.slice();

    source.fill(120);

    expect(artifact.stdout.bytes).toEqual(storedBeforeMutation);
    expect(artifact.stdout.bytes.buffer).not.toBe(source.buffer);
    expect(assessCommandOutputArtifactIntegrity(artifact, sha256Hex)).toEqual({
      status: "valid"
    });
  });

  test("canonicalizes timestamps before content addressing for stable database readback", () => {
    const artifact = createArtifact({
      startedAt: "2026-06-23T09:09:00+02:00",
      completedAt: "2026-06-23T09:10:00+02:00"
    });

    expect(artifact).toMatchObject({
      startedAt: "2026-06-23T07:09:00.000Z",
      completedAt: "2026-06-23T07:10:00.000Z"
    });
    expect(assessCommandOutputArtifactIntegrity(artifact, sha256Hex)).toEqual({
      status: "valid"
    });
    expect(assessCommandOutputArtifactIntegrity({
      ...artifact,
      startedAt: "2026-06-23T09:09:00+02:00"
    }, sha256Hex)).toEqual({
      status: "invalid",
      reason: "noncanonical_started_at"
    });
  });
});
