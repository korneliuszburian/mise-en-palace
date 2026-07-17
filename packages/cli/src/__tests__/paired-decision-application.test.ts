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
    headMatchesInitialCommit: true,
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

const score = (outcome: "win" | "tie"): PairedRepairScore => ({
  outcome,
  baseline: arm(outcome === "tie", ["src/config.ts"]),
  krn: arm(true, ["src/config.ts"]),
  reason: outcome
});

const stagedInvalidVerification = (): HeldOutArmScore => {
  const verification = arm(true, ["src/config.ts"]);
  const manifest = verification.changeManifest;
  if (manifest === undefined) throw new Error("test verification requires a change manifest");
  return {
    ...verification,
    status: "invalid",
    changeManifest: {
      ...manifest,
      statusOutput: "M  src/config.ts\n"
    }
  };
};

const rules = [{
  governingDecisionId: "governing-unknown-first",
  sourceDecisionId: "decision-unknown-first",
  check: "unknown_first" as const,
  changedFiles: ["src/config.ts"]
}, {
  governingDecisionId: "governing-unobserved",
  sourceDecisionId: "decision-unobserved",
  check: "finite_result_state" as const,
  changedFiles: ["src/userService.ts"]
}];

describe("paired decision applications", () => {
  it("requires both a mapped passing check and its owned changed files", () => {
    expect(observedPairedDecisionApplications({ score: score("tie"), rules })).toEqual([{
      governingDecisionId: "governing-unknown-first",
      sourceDecisionId: "decision-unknown-first",
      check: "unknown_first",
      changedFiles: ["src/config.ts"],
      differential: false
    }]);
  });

  it("does not record an application from a staged target patch", () => {
    const pairedScore = score("win");
    const manifest = pairedScore.krn.changeManifest;
    if (manifest === undefined) throw new Error("test score requires a change manifest");
    const stagedScore: PairedRepairScore = {
      ...pairedScore,
      krn: {
        ...pairedScore.krn,
        changeManifest: {
          ...manifest,
          statusOutput: "M  src/config.ts\n"
        }
      }
    };

    expect(observedPairedDecisionApplications({ score: stagedScore, rules })).toEqual([]);
  });

  it("does not record an application from an untracked target patch", () => {
    const pairedScore: PairedRepairScore = {
      ...score("win"),
      krn: arm(true, ["src/config.ts"], ["src/config.ts"])
    };

    expect(observedPairedDecisionApplications({ score: pairedScore, rules })).toEqual([]);
  });

  it.each([
    { outcome: "tie", verificationInvalid: false, admittedOutcome: "used" },
    { outcome: "win", verificationInvalid: false, admittedOutcome: "helped" },
    { outcome: "win", verificationInvalid: true, admittedOutcome: "used" }
  ] as const)(
    "records application before verification and admits $admittedOutcome for $outcome with invalid=$verificationInvalid",
    async ({ outcome, verificationInvalid, admittedOutcome }) => {
      const order: string[] = [];
      const captures: Array<{
        commandOutcomes?: readonly { readonly command: string }[];
        sourceUsefulnessOutcomes?: readonly unknown[];
      }> = [];
      const targetEvidence: unknown[] = [];
      const applicationId = pairedDecisionApplicationId("run-1", "decision-unknown-first");

      const result = await recordPairedDecisionApplications({
        runId: "run-1",
        packet: { packetIdentity: { checksum, generatedAt } },
        score: score(outcome),
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
          captures.push({
            ...(runtime.commandOutcomes === undefined
              ? {}
              : { commandOutcomes: runtime.commandOutcomes }),
            ...(runtime.sourceUsefulnessOutcomes === undefined
              ? {}
              : { sourceUsefulnessOutcomes: runtime.sourceUsefulnessOutcomes })
          });
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
          return verificationInvalid
            ? stagedInvalidVerification()
            : arm(true, ["src/config.ts"]);
        }
      });

      expect(order).toEqual(["application", "verify", "outcome"]);
      expect(targetEvidence[0]).toEqual(expect.objectContaining({
        commands: ["pnpm test", "pnpm typecheck", "git diff --check"],
        changedFiles: [{
          status: "modified",
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
          outcome: admittedOutcome
        })
      ]);
      expect(captures[1]?.commandOutcomes?.map((command) => command.command)).toEqual([
        "pnpm test",
        "pnpm typecheck",
        "git diff --check",
        "held-out runtime"
      ]);
      expect(result).toEqual([{
        sourceDecisionId: "decision-unknown-first",
        applicationId,
        appliedAt,
        outcome: admittedOutcome
      }]);
    }
  );
});
