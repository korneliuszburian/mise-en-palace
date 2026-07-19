import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  extractCodexExecUsageFromJsonLines,
  type CodexExecUsageObservation
} from "./codex-json-usage.js";
import type {
  CodexCapabilityEvalArmName,
  CodexCapabilityEvalGrader
} from "./contracts.js";
import type {
  CodexCapabilityDryRunPlan,
  CodexCapabilityPlannedArm
} from "./dry-run-plan.js";

export type CodexCapabilityCheckerResult = {
  readonly graderId: string;
  readonly status: "passed" | "failed" | "not_run";
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
};

export type CodexCapabilityArmExecution = {
  readonly cliVersion: string;
  readonly commandStatus: "completed" | "failed" | "timed_out";
  readonly exitCode: number | null;
  readonly stdoutJsonl: string;
  readonly stderr: string;
  readonly finalDiff: string;
  readonly checkers: readonly CodexCapabilityCheckerResult[];
};

export type CodexCapabilityArmArtifact = CodexCapabilityArmExecution & {
  readonly arm: CodexCapabilityEvalArmName;
  readonly profileHash: string;
  readonly capabilities: CodexCapabilityPlannedArm["capabilities"];
  readonly usage: CodexExecUsageObservation;
  readonly invalidReasons: readonly string[];
};

export type CodexCapabilityEvalSummary = {
  readonly kind: "krn.codexCapabilityEvalSummary.v1";
  readonly manifestId: string;
  readonly outcome: "win" | "tie" | "loss" | "invalid";
  readonly invalidReasons: readonly string[];
  readonly arms: readonly [CodexCapabilityArmArtifact, CodexCapabilityArmArtifact];
  readonly usageComparable: boolean;
  readonly proves: readonly string[];
  readonly doesNotProve: readonly string[];
};

export type CodexCapabilityArmExecutor = (
  arm: CodexCapabilityPlannedArm,
  graders: readonly CodexCapabilityEvalGrader[]
) => Promise<CodexCapabilityArmExecution>;

export const runCodexCapabilityEval = async (
  plan: CodexCapabilityDryRunPlan,
  executeArm: CodexCapabilityArmExecutor
): Promise<CodexCapabilityEvalSummary> => {
  const [baseline, krn] = await Promise.all([
    runArm(plan.arms[0], plan.graders, plan.usage.source, executeArm),
    runArm(plan.arms[1], plan.graders, plan.usage.source, executeArm)
  ]);
  const usageComparable = baseline.usage.status === "available" && krn.usage.status === "available";
  const invalidReasons = summaryInvalidReasons(baseline, krn, plan.usage.requireComparable, usageComparable);

  return {
    kind: "krn.codexCapabilityEvalSummary.v1",
    manifestId: plan.manifestId,
    outcome: invalidReasons.length > 0 ? "invalid" : compareQuality(baseline, krn),
    invalidReasons,
    arms: [baseline, krn],
    usageComparable,
    proves: [
      "both matched arms returned command, diff, checker, capability, and usage evidence",
      "win, tie, or loss reflects only the declared deterministic checker outcomes"
    ],
    doesNotProve: [
      "one task does not prove broad KRN advantage",
      "a quality win does not prove lower token cost",
      "declared capabilities do not prove the agent used them causally"
    ]
  };
};

export const writeCodexCapabilityEvalArtifacts = (
  outputDirectory: string,
  summary: CodexCapabilityEvalSummary
): void => {
  mkdirSync(outputDirectory, { recursive: true });
  for (const arm of summary.arms) {
    writeJson(join(outputDirectory, `${arm.arm}.json`), arm);
    writeFileSync(join(outputDirectory, `${arm.arm}.diff`), arm.finalDiff, "utf8");
  }
  writeJson(join(outputDirectory, "summary.json"), summary);
};

const runArm = async (
  arm: CodexCapabilityPlannedArm,
  graders: readonly CodexCapabilityEvalGrader[],
  usageSource: CodexCapabilityDryRunPlan["usage"]["source"],
  executeArm: CodexCapabilityArmExecutor
): Promise<CodexCapabilityArmArtifact> => {
  const execution = await executeArm(arm, graders);
  const usage = usageSource === "codex_exec_json"
    ? extractCodexExecUsageFromJsonLines(execution.stdoutJsonl)
    : unavailableUsage(usageSource);
  return {
    arm: arm.arm,
    profileHash: arm.profile.hash,
    capabilities: arm.capabilities,
    ...execution,
    usage,
    invalidReasons: invalidReasonsForArm(execution, graders)
  };
};

const invalidReasonsForArm = (
  execution: CodexCapabilityArmExecution,
  graders: readonly CodexCapabilityEvalGrader[]
): readonly string[] => [
  ...commandInvalidReasons(execution),
  ...graders.flatMap((grader) => checkerInvalidReasons(execution, grader))
];

const commandInvalidReasons = (
  execution: CodexCapabilityArmExecution
): readonly string[] =>
  execution.commandStatus === "completed" && execution.exitCode === 0
    ? []
    : [`Codex command did not complete successfully (${execution.commandStatus}, exit ${String(execution.exitCode)})`];

const checkerInvalidReasons = (
  execution: CodexCapabilityArmExecution,
  grader: CodexCapabilityEvalGrader
): readonly string[] => {
  const checker = execution.checkers.find((candidate) => candidate.graderId === grader.id);
  if (checker === undefined) return [`missing checker output for ${grader.id}`];
  return checker.status === "not_run" ? [`checker ${grader.id} was not run`] : [];
};

const summaryInvalidReasons = (
  baseline: CodexCapabilityArmArtifact,
  krn: CodexCapabilityArmArtifact,
  requireComparableUsage: boolean,
  usageComparable: boolean
): readonly string[] => [
  ...baseline.invalidReasons.map((reason) => `baseline: ${reason}`),
  ...krn.invalidReasons.map((reason) => `krn: ${reason}`),
  ...(requireComparableUsage && !usageComparable
    ? ["comparable token usage was required but unavailable for one or both arms"]
    : [])
];

const compareQuality = (
  baseline: CodexCapabilityArmArtifact,
  krn: CodexCapabilityArmArtifact
): "win" | "tie" | "loss" => {
  const baselinePasses = passedCheckerCount(baseline);
  const krnPasses = passedCheckerCount(krn);
  return krnPasses > baselinePasses ? "win" : krnPasses < baselinePasses ? "loss" : "tie";
};

const passedCheckerCount = (artifact: CodexCapabilityArmArtifact): number =>
  artifact.checkers.filter((checker) => checker.status === "passed").length;

const unavailableUsage = (
  source: Exclude<CodexCapabilityDryRunPlan["usage"]["source"], "codex_exec_json">
): CodexExecUsageObservation => ({
  status: "unavailable",
  source,
  reason: `usage source ${source} is not implemented by the v1 runner`
});

const writeJson = (path: string, value: unknown): void => {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};
