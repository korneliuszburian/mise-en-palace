import { describe, expect, it } from "vitest";

import {
  observedPairedDecisionApplications,
  pairedDecisionApplicationId,
  recordPairedDecisionApplications
} from "../internal/eval/paired-decision-application.js";
import type {
  CommandResult,
  HeldOutArmScore,
  PairedRepairScore
} from "../internal/eval/paired-live-codex-repair.js";

const checksum = "a".repeat(64);
const generatedAt = "2026-07-16T10:00:00.000Z";
const appliedAt = "2026-07-16T10:01:00.000Z";

const command = (name: string): CommandResult => ({
  command: name,
  args: [],
  exitCode: 0,
  stdout: "ok",
  stderr: "",
  startedAt: "2026-07-16T10:02:00.000Z",
  completedAt: "2026-07-16T10:02:01.000Z",
  durationMs: 1_000
});

const arm = (
  checkPassed: boolean,
  changedFiles: readonly string[],
  untrackedFiles: readonly string[] = []
): HeldOutArmScore => ({
  status: "pass",
  score: checkPassed ? 3 : 2,
  checks: [{
    name: "unknown_first",
    passed: checkPassed,
    details: checkPassed ? "observed" : "missing"
  }],
  changedFiles: [...changedFiles],
  changeManifest: {
    status: "known",
    trackedFiles: changedFiles.filter((path) => !untrackedFiles.includes(path)),
    untrackedFiles: [...untrackedFiles],
    changedFiles: [...changedFiles],
    forbiddenFiles: [],
    statusOutput: changedFiles.map((path) => ` M ${path}`).join("\n")
  },
  commands: {
    test: command("pnpm test"),
    typecheck: command("pnpm typecheck"),
    diffCheck: command("git diff --check")
  },
  runtimeCommand: command("held-out runtime")
});

const score = (outcome: "win" | "tie", krnUntracked = false): PairedRepairScore => ({
  outcome,
  baseline: arm(outcome === "tie", ["src/config.ts"]),
  krn: arm(true, ["src/config.ts"], krnUntracked ? ["src/config.ts"] : []),
  reason: outcome
});

const rules = [{
  sourceDecisionId: "decision-unknown-first",
  check: "unknown_first" as const,
  changedFiles: ["src/config.ts"]
}, {
  sourceDecisionId: "decision-unobserved",
  check: "finite_result_state" as const,
  changedFiles: ["src/userService.ts"]
}];

describe("paired decision applications", () => {
  it("requires both a mapped passing check and its owned changed files", () => {
    expect(observedPairedDecisionApplications({ score: score("tie"), rules })).toEqual([{
      sourceDecisionId: "decision-unknown-first",
      check: "unknown_first",
      changedFiles: ["src/config.ts"],
      differential: false
    }]);
  });

  it.each(["tie", "win"] as const)(
    "records application before verification and admits an honest %s outcome",
    async (outcome) => {
      const order: string[] = [];
      const captures: Array<{ sourceUsefulnessOutcomes?: readonly unknown[] }> = [];
      const targetEvidence: unknown[] = [];
      const applicationId = pairedDecisionApplicationId("run-1", "decision-unknown-first");

      const result = await recordPairedDecisionApplications({
        runId: "run-1",
        packet: { packetIdentity: { checksum, generatedAt } },
        score: score(outcome, true),
        rules,
        krnTarget: {
          targetRoot: "/tmp/paired-target",
          checkerRoot: "/tmp/checker",
          initialCommit: "initial"
        },
        databaseUrl: "postgres://test"
      }, {
        now: () => "2026-07-16T10:03:00.000Z",
        captureEvidence: async (runtime) => {
          order.push(captures.length === 0 ? "application" : "outcome");
          captures.push(runtime.sourceUsefulnessOutcomes === undefined
            ? {}
            : { sourceUsefulnessOutcomes: runtime.sourceUsefulnessOutcomes });
          targetEvidence.push(runtime.targetEvidence);
          return captures.length === 1
            ? {
                stdout: "",
                persistence: {
                  feedbackDeltaId: "feedback-application",
                  usefulnessApplications: [{ applicationId, appliedAt }]
                }
              }
            : {
                stdout: "",
                persistence: {
                  feedbackDeltaId: "feedback-outcome",
                  sourceUsefulnessOutcomes: runtime.sourceUsefulnessOutcomes ?? []
                }
              };
        },
        verifyTarget: async () => {
          order.push("verify");
          return arm(true, ["src/config.ts"]);
        }
      });

      expect(order).toEqual(["application", "verify", "outcome"]);
      expect(targetEvidence[0]).toEqual(expect.objectContaining({
        changedFiles: [{
          status: "??",
          path: "src/config.ts",
          ownership: "owned_by_current_krn_run"
        }]
      }));
      expect(captures[0]?.sourceUsefulnessOutcomes).toEqual([
        expect.objectContaining({ applicationId, outcome: "selected" })
      ]);
      expect(captures[1]?.sourceUsefulnessOutcomes).toEqual([
        expect.objectContaining({
          applicationId,
          appliedAt,
          outcome: outcome === "win" ? "helped" : "used"
        })
      ]);
      expect(result).toEqual([{
        sourceDecisionId: "decision-unknown-first",
        applicationId,
        appliedAt,
        outcome: outcome === "win" ? "helped" : "used"
      }]);
    }
  );
});
