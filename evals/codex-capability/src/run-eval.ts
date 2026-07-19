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
  readonly commandExecutable: string;
  readonly cliVersion: string;
  readonly commandStatus: "completed" | "failed" | "timed_out";
  readonly exitCode: number | null;
  readonly stdoutJsonl: string;
  readonly stderr: string;
  readonly finalDiff: string;
  readonly checkers: readonly CodexCapabilityCheckerResult[];
};

export type CodexCapabilityUseObservation = {
  readonly configuredMcpToolCallEvents: number;
  readonly observedMcpServerIds: readonly string[];
  readonly genericMcpToolCallEvents: number;
};

export type CodexCapabilityArmArtifact = CodexCapabilityArmExecution & {
  readonly arm: CodexCapabilityEvalArmName;
  readonly profileHash: string;
  readonly capabilities: CodexCapabilityPlannedArm["capabilities"];
  readonly capabilityUse: CodexCapabilityUseObservation;
  readonly usage: CodexExecUsageObservation;
  readonly invalidReasons: readonly string[];
};

export type CodexCapabilityEvalSummary = {
  readonly kind: "krn.codexCapabilityEvalSummary.v1";
  readonly manifestId: string;
  readonly target: CodexCapabilityDryRunPlan["target"];
  readonly codex: CodexCapabilityDryRunPlan["codex"];
  readonly graders: CodexCapabilityDryRunPlan["graders"];
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
    runArm(plan.arms[0], plan.graders, plan.usage.source, plan.arms[1].capabilities.mcpServers.map(({ id }) => id), executeArm),
    runArm(plan.arms[1], plan.graders, plan.usage.source, plan.arms[1].capabilities.mcpServers.map(({ id }) => id), executeArm)
  ]);
  const usageComparable = baseline.usage.status === "available" && krn.usage.status === "available";
  const invalidReasons = summaryInvalidReasons(baseline, krn, plan.usage.requireComparable, usageComparable);

  return {
    kind: "krn.codexCapabilityEvalSummary.v1",
    manifestId: plan.manifestId,
    target: plan.target,
    codex: plan.codex,
    graders: plan.graders,
    outcome: invalidReasons.length > 0 ? "invalid" : compareQuality(baseline, krn),
    invalidReasons,
    arms: [baseline, krn],
    usageComparable,
    proves: [
      "both matched arms returned command, diff, checker, capability, and usage evidence",
      "win, tie, or loss reflects only the declared deterministic checker outcomes",
      "structured Codex events prove the configured KRN MCP was used only in the treatment arm"
    ],
    doesNotProve: [
      "one task does not prove broad KRN advantage",
      "a quality win does not prove lower token cost",
      "observed capability use does not prove the DecisionPacket caused the resulting implementation quality",
      "the v1 runner does not independently prove causal use of the declared skill"
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
  configuredMcpServerIds: readonly string[],
  executeArm: CodexCapabilityArmExecutor
): Promise<CodexCapabilityArmArtifact> => {
  const execution = await executeArm(arm, graders);
  const usage = usageSource === "codex_exec_json"
    ? extractCodexExecUsageFromJsonLines(execution.stdoutJsonl)
    : unavailableUsage(usageSource);
  const capabilityUse = observeCapabilityUse(execution.stdoutJsonl, configuredMcpServerIds);
  return {
    arm: arm.arm,
    profileHash: arm.profile.hash,
    capabilities: arm.capabilities,
    ...execution,
    capabilityUse,
    usage,
    invalidReasons: invalidReasonsForArm(arm.arm, execution, graders, capabilityUse, configuredMcpServerIds.length > 0)
  };
};

const invalidReasonsForArm = (
  arm: CodexCapabilityEvalArmName,
  execution: CodexCapabilityArmExecution,
  graders: readonly CodexCapabilityEvalGrader[],
  capabilityUse: CodexCapabilityUseObservation,
  configuredMcpRequired: boolean
): readonly string[] => [
  ...commandInvalidReasons(execution),
  ...graders.flatMap((grader) => checkerInvalidReasons(execution, grader)),
  ...capabilityInvalidReasons(arm, capabilityUse, configuredMcpRequired)
];

const capabilityInvalidReasons = (
  arm: CodexCapabilityEvalArmName,
  capabilityUse: CodexCapabilityUseObservation,
  configuredMcpRequired: boolean
): readonly string[] => {
  if (arm === "baseline") return baselineCapabilityInvalidReasons(capabilityUse);
  return treatmentCapabilityInvalidReasons(capabilityUse, configuredMcpRequired);
};

const baselineCapabilityInvalidReasons = (
  capabilityUse: CodexCapabilityUseObservation
): readonly string[] => {
  if (capabilityUse.configuredMcpToolCallEvents === 0) return [];
  return ["baseline emitted a configured KRN MCP tool-call event"];
};

const treatmentCapabilityInvalidReasons = (
  capabilityUse: CodexCapabilityUseObservation,
  configuredMcpRequired: boolean
): readonly string[] => {
  if (!configuredMcpRequired) return [];
  if (capabilityUse.configuredMcpToolCallEvents > 0) return [];
  return ["treatment emitted no configured KRN MCP tool-call event"];
};

const observeCapabilityUse = (
  output: string,
  configuredMcpServerIds: readonly string[]
): CodexCapabilityUseObservation => {
  let configuredMcpToolCallEvents = 0;
  let genericMcpToolCallEvents = 0;
  const observedMcpServerIds = new Set<string>();

  for (const rawLine of output.split(/\r?\n/u)) {
    const parsed = parseJsonLine(rawLine);
    walkJson(parsed, (record) => {
      const server = successfulMcpServer(record);
      if (server === undefined) return;
      if (configuredMcpServerIds.includes(server)) {
        configuredMcpToolCallEvents += 1;
        observedMcpServerIds.add(server);
        return;
      }
      genericMcpToolCallEvents += 1;
    });
  }

  return {
    configuredMcpToolCallEvents,
    observedMcpServerIds: [...observedMcpServerIds].sort(),
    genericMcpToolCallEvents
  };
};

const successfulMcpServer = (record: Record<string, unknown>): string | undefined => {
  if (!isSuccessfulMcpCall(record)) return undefined;
  const server = record["server"];
  if (typeof server !== "string") return undefined;
  return server;
};

const isSuccessfulMcpCall = (record: Record<string, unknown>): boolean => {
  if (record["type"] !== "mcp_tool_call") return false;
  if (record["status"] !== "completed") return false;
  if (record["error"] !== null) return false;
  return true;
};

const walkJson = (value: unknown, visit: (record: Record<string, unknown>) => void): void => {
  if (Array.isArray(value)) {
    value.forEach((entry) => walkJson(entry, visit));
    return;
  }
  if (!isRecord(value)) return;
  visit(value);
  Object.values(value).forEach((entry) => walkJson(entry, visit));
};

const parseJsonLine = (rawLine: string): unknown => {
  try {
    return rawLine.trim().length === 0 ? undefined : JSON.parse(rawLine);
  } catch {
    return undefined;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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
