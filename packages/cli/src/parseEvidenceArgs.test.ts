import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseEvidenceArgs
} from "./parseEvidenceArgs.js";

const evidenceUsage =
  [
    "Usage: krn evidence capture [--run-id <id>] [--persist] [--verification <command=status>] [--command <cmd> --status passed|failed|skipped|missing|not_run [--exit-code <code>] [--output <path>]]",
    "Example: krn evidence capture --verification \"pnpm typecheck=passed\" --verification \"pnpm test=passed\"",
    "Persisted example: krn evidence capture --run-id <execution-run-id> --verification \"git diff --check=passed\" --persist",
    "Note: evidence capture records operator/captured evidence; it does not run commands."
  ].join("\n");

describe("parseEvidenceArgs", () => {
  it("parses evidence capture preview", () => {
    expect(parseEvidenceArgs(["capture"])).toEqual({
      command: {
        kind: "evidenceCapture",
        persist: false
      }
    });
  });

  it("parses evidence capture persist with a run id", () => {
    expect(parseEvidenceArgs(["capture", "--run-id= run-1 ", "--persist"])).toEqual({
      command: {
        kind: "evidenceCapture",
        persist: true,
        runId: "run-1"
      }
    });
  });

  it("parses supplied command outcomes", () => {
    expect(parseEvidenceArgs([
      "capture",
      "--command",
      "pnpm typecheck",
      "--status",
      "passed",
      "--exit-code",
      "0",
      "--output",
      ".local-lab/typecheck.txt",
      "--command=pnpm test",
      "--status=failed",
      "--exit-code=1"
    ])).toEqual({
      command: {
        kind: "evidenceCapture",
        persist: false,
        commandOutcomes: [
          {
            command: "pnpm typecheck",
            status: "passed",
            exitCode: 0,
            outputPath: ".local-lab/typecheck.txt"
          },
          {
            command: "pnpm test",
            status: "failed",
            exitCode: 1
          }
        ]
      }
    });
  });

  it("parses explicit verification evidence", () => {
    expect(parseEvidenceArgs([
      "capture",
      "--verification",
      "pnpm typecheck=passed",
      "--verification=pnpm test=failed"
    ])).toEqual({
      command: {
        kind: "evidenceCapture",
        persist: false,
        commandOutcomes: [
          {
            command: "pnpm typecheck",
            status: "passed",
            provenance: "operator_reported"
          },
          {
            command: "pnpm test",
            status: "failed",
            provenance: "operator_reported"
          }
        ]
      }
    });
  });

  it("rejects unsupported evidence command shapes", () => {
    expect(parseEvidenceArgs([])).toEqual({
      error: evidenceUsage
    });
    expect(parseEvidenceArgs(["show"])).toEqual({
      error: evidenceUsage
    });
    expect(parseEvidenceArgs(["capture", "--unknown"])).toEqual({
      error: evidenceUsage
    });
    expect(parseEvidenceArgs(["capture", "--command", "pnpm test"])).toEqual({
      error: "--command requires --status passed|failed|skipped|missing|not_run"
    });
    expect(parseEvidenceArgs(["capture", "--status", "passed"])).toEqual({
      error: "--status requires a preceding --command"
    });
    expect(parseEvidenceArgs(["capture", "--command", "pnpm test", "--status", "done"])).toEqual({
      error: "--status must be passed, failed, skipped, missing, or not_run"
    });
    expect(parseEvidenceArgs(["capture", "--verification", "=passed"])).toEqual({
      error: "--verification requires a non-empty command"
    });
    expect(parseEvidenceArgs(["capture", "--verification", "pnpm test=done"])).toEqual({
      error: "--verification status must be passed, failed, skipped, missing, or not_run"
    });
    expect(parseEvidenceArgs([
      "capture",
      "--command",
      "pnpm test",
      "--status",
      "passed",
      "--exit-code",
      "zero"
    ])).toEqual({
      error: "--exit-code must be an integer"
    });
  });
});
