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
      ? execution(graders.map((grader) => checker(grader.id, "failed")), [])
      : execution(graders.map((grader) => checker(grader.id, "passed")), ["krn_decision_packet"])
  );

  assert.equal(summary.outcome, "win");
  assert.equal(summary.invalidReasons.length, 0);
  assert.equal(summary.usageComparable, true);
  assert.equal(summary.arms[0].profileHash, plan.arms[0].profile.hash);
  assert.equal(summary.arms[1].capabilities.mcpServers.length, 1);
  assert.deepEqual(summary.arms[1].capabilityUse.observedMcpServerIds, ["krn_decision_packet"]);

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

test("matched arm execution rejects missing treatment use and baseline KRN leakage", async () => {
  const plan = createCodexCapabilityDryRunPlan(validManifest());
  const checkers = plan.graders.map((grader) => checker(grader.id, "passed"));

  const missingUse = await runCodexCapabilityEval(plan, async (arm) =>
    execution(checkers, arm.arm === "krn" ? ["krn_decision_packet"] : [], false)
  );
  assert.equal(missingUse.outcome, "invalid");
  assert.deepEqual(missingUse.invalidReasons, ["krn: treatment emitted no configured KRN MCP tool-call event"]);

  const leaked = await runCodexCapabilityEval(plan, async (arm) =>
    execution(checkers, arm.arm === "baseline" ? ["krn_decision_packet"] : ["krn_decision_packet"])
  );
  assert.equal(leaked.outcome, "invalid");
  assert.deepEqual(leaked.invalidReasons, ["baseline: baseline emitted a configured KRN MCP tool-call event"]);
});

const execution = (
  checkers: CodexCapabilityArmExecution["checkers"],
  mcpServers: readonly string[],
  successfulMcpCall = true
): CodexCapabilityArmExecution => ({
  commandExecutable: "codex",
  cliVersion: "codex-cli 0.144.6",
  commandStatus: "completed",
  exitCode: 0,
  stdoutJsonl: [
    ...mcpServers.map((server) => JSON.stringify({
      type: "item.completed",
      item: {
        type: "mcp_tool_call",
        server,
        status: "completed",
        error: successfulMcpCall ? null : { message: "transport failed" }
      }
    })),
    JSON.stringify({
      type: "turn.completed",
      usage: {
        input_tokens: 100,
        cached_input_tokens: 40,
        output_tokens: 20,
        reasoning_output_tokens: 5
      }
    })
  ].join("\n"),
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
