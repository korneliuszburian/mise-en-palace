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
    "Usage: krn evidence capture [--run-id <id>|--run <id>] [--persist] [--intended-file <path>] [--verification <command=status>] [--target-repo <path>] [--target-mode observation-only|headless-repair|real-second-operator|unknown] [--target-dirty-before clean|dirty|unknown] [--target-dirty-after clean|dirty|unknown] [--target-owned-changes external|owned-by-current-krn-run|partial|unknown] [--target-status-freshness fresh-current-task|stale-prior-selection|changed-since-selection|unknown] [--target-patch-lifecycle none|accepted-by-target-owner|rejected-by-target-owner|stronger-verification-requested|handed-off-unresolved|unknown] [--target-handoff-artifact <path>] [--target-owner-decision <text>] [--target-changed-file <status path>|none] [--target-command <cmd>] [--command <cmd> --status passed|failed|skipped|missing|not_run [--exit-code <code>] [--output <path>]]",
    "Example: krn evidence capture --intended-file packages/cli/src/runEvidenceCaptureCommand.ts --verification \"pnpm typecheck=passed\" --verification \"pnpm test=passed\"",
    "Target example: krn evidence capture --target-repo ../target --target-mode observation-only --target-dirty-before dirty --target-dirty-after dirty --target-owned-changes external --target-allowed-write none --target-forbidden-write \"target source edits\" --target-changed-file \"M src/app.ts\" --target-command \"target pnpm test\" --verification \"target pnpm test=passed\"",
    "Persisted example: krn evidence capture --run-id <execution-run-id> --intended-file packages/cli/src/runEvidenceCaptureCommand.ts --verification \"git diff --check=passed\" --persist",
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

  it("accepts --run as an alias for evidence capture run id", () => {
    expect(parseEvidenceArgs(["capture", "--run", " run-1 ", "--persist"])).toEqual({
      command: {
        kind: "evidenceCapture",
        persist: true,
        runId: "run-1"
      }
    });
    expect(parseEvidenceArgs(["capture", "--run=run-2"])).toEqual({
      command: {
        kind: "evidenceCapture",
        persist: false,
        runId: "run-2"
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

  it("parses repeatable intended files", () => {
    expect(parseEvidenceArgs([
      "capture",
      "--intended-file",
      " packages/cli/src/runEvidenceCaptureCommand.ts ",
      "--intended-file=./packages/cli/src/parseEvidenceArgs.ts"
    ])).toEqual({
      command: {
        kind: "evidenceCapture",
        persist: false,
        intendedFiles: [
          "packages/cli/src/runEvidenceCaptureCommand.ts",
          "./packages/cli/src/parseEvidenceArgs.ts"
        ]
      }
    });
  });

  it("parses target evidence inputs", () => {
    expect(parseEvidenceArgs([
      "capture",
      "--target-repo",
      "../wilq-seo",
      "--target-mode",
      "observation-only",
      "--target-dirty-before=dirty",
      "--target-dirty-after",
      "dirty",
      "--target-owned-changes",
      "external",
      "--target-status-freshness",
      "changed-since-selection",
      "--target-patch-lifecycle",
      "handed-off-unresolved",
      "--target-handoff-artifact",
      "docs/reviews/target/HANDOFF.md",
      "--target-owner-decision",
      "stronger verification requested",
      "--target-changed-file",
      "M src/app.ts",
      "--target-command",
      "wilq-seo scripts/test.sh",
      "--target-allowed-write",
      "none",
      "--target-forbidden-write",
      "src/**"
    ])).toEqual({
      command: {
        kind: "evidenceCapture",
        persist: false,
        targetEvidence: {
          targetRepo: "../wilq-seo",
          mode: "observation-only",
          dirtyBefore: "dirty",
          dirtyAfter: "dirty",
          ownedChanges: "external",
          targetStatusFreshness: "changed-since-selection",
          targetPatchLifecycle: "handed-off-unresolved",
          handoffArtifact: "docs/reviews/target/HANDOFF.md",
          targetOwnerDecision: "stronger verification requested",
          allowedWrites: ["none"],
          forbiddenWrites: ["src/**"],
          changedFiles: [{
            status: "M",
            path: "src/app.ts"
          }],
          commands: ["wilq-seo scripts/test.sh"]
        }
      }
    });
  });

  it("parses explicit no target changed files without changing evidence semantics", () => {
    expect(parseEvidenceArgs([
      "capture",
      "--target-repo",
      "../wilq-seo",
      "--target-changed-file",
      "none"
    ])).toEqual({
      command: {
        kind: "evidenceCapture",
        persist: false,
        targetEvidence: {
          targetRepo: "../wilq-seo"
        }
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
    expect(parseEvidenceArgs(["capture", "--intended-file", "   "])).toEqual({
      error: "--intended-file requires a non-empty path"
    });
    expect(parseEvidenceArgs(["capture", "--target-mode", "repair"])).toEqual({
      error: "--target-mode must be observation-only, headless-repair, real-second-operator, or unknown"
    });
    expect(parseEvidenceArgs(["capture", "--target-dirty-before", "yes"])).toEqual({
      error: "--target-dirty-before must be clean, dirty, or unknown"
    });
    expect(parseEvidenceArgs(["capture", "--target-owned-changes", "mine"])).toEqual({
      error: "--target-owned-changes must be external, owned-by-current-krn-run, partial, or unknown"
    });
    expect(parseEvidenceArgs(["capture", "--target-status-freshness", "fresh"])).toEqual({
      error: "--target-status-freshness must be fresh-current-task, stale-prior-selection, changed-since-selection, or unknown"
    });
    expect(parseEvidenceArgs(["capture", "--target-patch-lifecycle", "waiting"])).toEqual({
      error: "--target-patch-lifecycle must be none, accepted-by-target-owner, rejected-by-target-owner, stronger-verification-requested, handed-off-unresolved, or unknown"
    });
    expect(parseEvidenceArgs(["capture", "--target-handoff-artifact", "   "])).toEqual({
      error: "--target-handoff-artifact requires a non-empty value"
    });
    expect(parseEvidenceArgs(["capture", "--target-owner-decision", "   "])).toEqual({
      error: "--target-owner-decision requires a non-empty value"
    });
    expect(parseEvidenceArgs(["capture", "--target-changed-file", "M"])).toEqual({
      error: "--target-changed-file requires <status path>"
    });
    expect(parseEvidenceArgs(["capture", "--target-changed-file", "none"])).toEqual({
      error: "--target-repo is required when target evidence flags are supplied"
    });
    expect(parseEvidenceArgs(["capture", "--target-command", "   "])).toEqual({
      error: "--target-command requires a non-empty value"
    });
    expect(parseEvidenceArgs(["capture", "--target-dirty-after", "dirty"])).toEqual({
      error: "--target-repo is required when target evidence flags are supplied"
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
