import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createCodexCapabilityDryRunPlan } from "../dry-run-plan.js";
import {
  runCodexCapabilityEval,
  writeCodexCapabilityEvalArtifacts,
  type CodexCapabilityArmExecution
} from "../run-eval.js";
import { validManifest } from "./manifest-fixture.js";

test("matched arm execution records a bounded KRN win and durable JSON artifacts", async () => {
  const plan = createCodexCapabilityDryRunPlan(validManifest());
  const summary = await runCodexCapabilityEval(plan, async (arm, graders) =>
    arm.arm === "baseline"
      ? execution(graders.map((grader) => checker(grader.id, "failed")))
      : execution(graders.map((grader) => checker(grader.id, "passed")))
  );

  assert.equal(summary.outcome, "win");
  assert.equal(summary.invalidReasons.length, 0);
  assert.equal(summary.usageComparable, true);
  assert.equal(summary.arms[0].profileHash, plan.arms[0].profile.hash);
  assert.equal(summary.arms[1].capabilities.mcpServers.length, 1);

  const outputDirectory = mkdtempSync(join(tmpdir(), "krn-codex-capability-"));
  try {
    writeCodexCapabilityEvalArtifacts(outputDirectory, summary);
    const persisted = JSON.parse(readFileSync(join(outputDirectory, "summary.json"), "utf8")) as unknown;
    assert.deepEqual(persisted, summary);
    assert.equal(readFileSync(join(outputDirectory, "krn.diff"), "utf8"), "diff --git a/x b/x\n");
  } finally {
    rmSync(outputDirectory, { recursive: true, force: true });
  }
});

const execution = (
  checkers: CodexCapabilityArmExecution["checkers"]
): CodexCapabilityArmExecution => ({
  cliVersion: "codex-cli 0.144.6",
  commandStatus: "completed",
  exitCode: 0,
  stdoutJsonl: JSON.stringify({
    type: "turn.completed",
    usage: {
      input_tokens: 100,
      cached_input_tokens: 40,
      output_tokens: 20,
      reasoning_output_tokens: 5
    }
  }),
  stderr: "",
  finalDiff: "diff --git a/x b/x\n",
  checkers
});

const checker = (
  graderId: string,
  status: "passed" | "failed"
): CodexCapabilityArmExecution["checkers"][number] => ({
  graderId,
  status,
  exitCode: status === "passed" ? 0 : 1,
  stdout: "",
  stderr: ""
});
