import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const targetRoot = process.cwd();
const outputRoot = resolve(targetRoot, ".tmp-hidden-eval");

rmSync(outputRoot, { recursive: true, force: true });
const compilation = spawnSync(resolve(targetRoot, "node_modules/.bin/tsc"), [
  "-p", "tsconfig.json", "--outDir", outputRoot, "--noEmit", "false"
], { cwd: targetRoot, encoding: "utf8" });

try {
  if (compilation.status !== 0) {
    throw new Error(compilation.stderr || compilation.stdout || "hidden grader compilation failed");
  }
  const service = await import(`${pathToFileURL(resolve(outputRoot, "src/payoutPolicy.js")).href}?eval=${Date.now()}`);
  const decide = service.decidePayoutPolicy;
  if (typeof decide !== "function") throw new Error("decidePayoutPolicy export is unavailable");

  assertDecision(decide({ region: "EU", riskScore: 95, requestedAt: "2026-06-15" }), "hold_for_policy_review", "2026-06-01");
  assertDecision(decide({ region: "EU", riskScore: 80, requestedAt: "2026-06-15" }), "hold_for_policy_review", "2026-06-01");
  assertAction(decide({ region: "EU", riskScore: 79, requestedAt: "2026-06-15" }), "manual_review");
  assertAction(decide({ region: "US", riskScore: 95, requestedAt: "2026-06-15" }), "manual_review");
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  rmSync(outputRoot, { recursive: true, force: true });
}

function assertDecision(value, expectedAction, expectedValidFrom) {
  assertAction(value, expectedAction);
  if (!isRecord(value) || value.validFrom !== expectedValidFrom) {
    throw new Error(`expected validFrom ${expectedValidFrom}`);
  }
}

function assertAction(value, expectedAction) {
  if (!isRecord(value) || value.action !== expectedAction) {
    throw new Error(`expected action ${expectedAction}`);
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
