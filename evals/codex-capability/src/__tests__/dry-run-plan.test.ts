import assert from "node:assert/strict";
import test from "node:test";

import {
  createCodexCapabilityDryRunPlan
} from "../dry-run-plan.js";
import {
  validManifest
} from "./manifest-fixture.js";

test("Codex capability dry-run plan uses different profiles with same task conditions", () => {
  const manifest = validManifest();
  const plan = createCodexCapabilityDryRunPlan(manifest);

  const [baseline, krn] = plan.arms;

  assert.equal(plan.kind, "krn.codexCapabilityDryRunPlan.v1");
  assert.equal(baseline.arm, "baseline");
  assert.equal(krn.arm, "krn");
  assert.equal(baseline.cwd, manifest.target.repoPath);
  assert.equal(krn.cwd, manifest.target.repoPath);
  assert.equal(baseline.timeoutMs, manifest.target.timeoutMs);
  assert.equal(krn.timeoutMs, manifest.target.timeoutMs);
  assert.equal(baseline.prompt, krn.prompt);
  assert.equal(baseline.args.at(-1), manifest.target.prompt);
  assert.equal(krn.args.at(-1), manifest.target.prompt);
  assert.ok(baseline.args.includes("--profile"));
  assert.ok(baseline.args.includes("plain-codex-eval"));
  assert.ok(krn.args.includes("--profile"));
  assert.ok(krn.args.includes("krn-codex-eval"));
  assert.ok(baseline.args.includes("--model"));
  assert.ok(baseline.args.includes(manifest.codex.model));
  assert.ok(krn.args.includes("--model"));
  assert.ok(krn.args.includes(manifest.codex.model));
  assert.match(baseline.profile.hash, /^[0-9a-f]{64}$/u);
  assert.match(krn.profile.hash, /^[0-9a-f]{64}$/u);
  assert.equal(baseline.profile.source, "checked_in_profile_config");
  assert.equal(krn.profile.source, "checked_in_profile_config");
  assert.equal(baseline.capabilities.mcpServers.length, 0);
  assert.equal(baseline.capabilities.skills.length, 0);
  assert.equal(krn.capabilities.mcpServers.length, 1);
  assert.equal(krn.capabilities.skills.length, 1);
});
