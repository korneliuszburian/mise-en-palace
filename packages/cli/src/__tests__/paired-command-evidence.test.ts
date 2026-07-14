import {
  describe,
  expect,
  it
} from "vitest";
import type {
  CommandResult,
  HeldOutArmScore
} from "../internal/eval/paired-live-codex-repair.js";
import {
  pairedArmScoreSummary,
  pairedCommandEvidence
} from "../internal/eval/paired-command-evidence.js";

const outputMarker = "PAIR_EVAL_SECRET_SENTINEL";

const commandResult = (overrides: Partial<CommandResult> = {}): CommandResult => ({
  command: "pnpm",
  args: ["test"],
  exitCode: 0,
  stdout: `${outputMarker}:stdout`,
  stderr: `${outputMarker}:stderr`,
  startedAt: "2026-07-14T20:00:00.000Z",
  completedAt: "2026-07-14T20:00:01.000Z",
  durationMs: 1000,
  ...overrides
});

describe("paired command evidence", () => {
  it("summarizes command and status output without rendering raw text", () => {
    const result = commandResult();
    const arm: HeldOutArmScore = {
      status: "pass",
      score: 1,
      checks: [],
      changedFiles: ["src/index.ts"],
      changeManifest: {
        status: "known",
        trackedFiles: ["src/index.ts"],
        untrackedFiles: [],
        changedFiles: ["src/index.ts"],
        forbiddenFiles: [],
        statusOutput: `${outputMarker}:status`
      },
      commands: {
        test: result,
        typecheck: result,
        diffCheck: result
      }
    };

    const summary = pairedArmScoreSummary(arm);
    const rendered = JSON.stringify(summary);

    expect(rendered).not.toContain(outputMarker);
    expect(summary.commands?.test.stdout).toMatchObject({
      storedByteCount: Buffer.byteLength(result.stdout),
      totalByteCount: Buffer.byteLength(result.stdout),
      storedBytesSha256: expect.stringMatching(/^[a-f0-9]{64}$/u)
    });
    expect(summary.changeManifest?.statusOutput).toMatchObject({
      storedBytesSha256: expect.stringMatching(/^[a-f0-9]{64}$/u)
    });
  });

  it("uses runner provenance only when exact executed bytes and times exist", () => {
    const executed = commandResult({
      stdoutStoredBytes: new TextEncoder().encode(`${outputMarker}:stdout`),
      stdoutTotalByteCount: Buffer.byteLength(`${outputMarker}:stdout`),
      stderrStoredBytes: new TextEncoder().encode(`${outputMarker}:stderr`),
      stderrTotalByteCount: Buffer.byteLength(`${outputMarker}:stderr`)
    });
    const runner = pairedCommandEvidence("krn", "test", executed);
    const skipped = pairedCommandEvidence("baseline", "test", commandResult({
      exitCode: null,
      stderr: "skipped because preflight failed"
    }));

    expect(runner.command).toMatchObject({
      provenance: "command_runner",
      outputRef: runner.commandOutputArtifact?.outputRef,
      capturedAt: runner.commandOutputArtifact?.completedAt
    });
    expect(skipped).toEqual({
      command: expect.objectContaining({
        status: "skipped",
        provenance: "operator_reported"
      })
    });
  });
});
