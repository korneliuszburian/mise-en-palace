import type {
  CodexCapabilityEvalArm,
  CodexCapabilityEvalArmName,
  CodexCapabilityEvalManifest,
  CodexCapabilityManifest,
  CodexCapabilityProfileEvidence,
  CodexCapabilityProfileRef
} from "./contracts.js";

export type CodexCapabilityPlannedArm = {
  readonly arm: CodexCapabilityEvalArmName;
  readonly cwd: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly prompt: string;
  readonly timeoutMs: number;
  readonly profile: CodexCapabilityProfileEvidence;
  readonly capabilities: CodexCapabilityManifest;
};

export type CodexCapabilityDryRunPlan = {
  readonly kind: "krn.codexCapabilityDryRunPlan.v1";
  readonly manifestId: string;
  readonly question: string;
  readonly target: CodexCapabilityEvalManifest["target"];
  readonly codex: {
    readonly command: string;
    readonly model: string;
    readonly execBaseArgs: readonly string[];
  };
  readonly arms: readonly [CodexCapabilityPlannedArm, CodexCapabilityPlannedArm];
  readonly graders: CodexCapabilityEvalManifest["graders"];
  readonly usage: CodexCapabilityEvalManifest["usage"];
  readonly proves: readonly string[];
  readonly doesNotProve: readonly string[];
};

export type CodexCapabilityDryRunPlanOptions = {
  readonly baseDirectory?: string;
  readonly readProfileConfig?: (absolutePath: string) => string | Uint8Array;
};

export const createCodexCapabilityDryRunPlan = (
  manifest: CodexCapabilityEvalManifest,
  options: CodexCapabilityDryRunPlanOptions = {}
): CodexCapabilityDryRunPlan => {
  const baseline = plannedArm("baseline", manifest.arms.baseline, manifest, options);
  const krn = plannedArm("krn", manifest.arms.krn, manifest, options);

  return {
    kind: "krn.codexCapabilityDryRunPlan.v1",
    manifestId: manifest.id,
    question: manifest.question,
    target: manifest.target,
    codex: {
      command: manifest.codex.command,
      model: manifest.codex.model,
      execBaseArgs: [...manifest.codex.execBaseArgs]
    },
    arms: [baseline, krn],
    graders: [...manifest.graders],
    usage: manifest.usage,
    proves: [
      "baseline and KRN arms use the same model, prompt, target repository, target commit, timeout, and grader list",
      "baseline and KRN arms use distinct Codex profiles",
      "baseline has no KRN MCP or skill capability manifest while KRN exposes at least one declared capability"
    ],
    doesNotProve: [
      "dry-run planning does not invoke live Codex",
      "dry-run planning does not prove a KRN quality win",
      "configured token usage remains unavailable until codex exec JSON or rollout-budget output is parsed"
    ]
  };
};

const plannedArm = (
  arm: CodexCapabilityEvalArmName,
  config: CodexCapabilityEvalArm,
  manifest: CodexCapabilityEvalManifest,
  options: CodexCapabilityDryRunPlanOptions
): CodexCapabilityPlannedArm => ({
  arm,
  cwd: manifest.target.repoPath,
  command: manifest.codex.command,
  args: [
    ...manifest.codex.execBaseArgs,
    "--profile",
    config.profile.name,
    "--model",
    manifest.codex.model,
    manifest.target.prompt
  ],
  prompt: manifest.target.prompt,
  timeoutMs: manifest.target.timeoutMs,
  profile: profileEvidence(config.profile, options),
  capabilities: {
    mcpServers: [...config.capabilities.mcpServers],
    skills: [...config.capabilities.skills]
  }
});

const profileEvidence = (profile: CodexCapabilityProfileRef, options: CodexCapabilityDryRunPlanOptions): CodexCapabilityProfileEvidence => {
  const absolutePath = resolve(options.baseDirectory ?? process.cwd(), profile.configPath);
  const bytes = (options.readProfileConfig ?? readFileSync)(absolutePath);
  return { ...profile, hash: createHash("sha256").update(bytes).digest("hex"), hashAlgorithm: "sha256", source: "checked_in_profile_config" };
};
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
