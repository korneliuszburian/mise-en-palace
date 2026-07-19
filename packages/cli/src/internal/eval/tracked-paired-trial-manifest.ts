import { isAbsolute, sep } from "node:path";

import type { PairedRepairScore } from "./paired-live-codex-repair.js";

type JsonRecord = Record<string, unknown>;

export type PairedDecisionApplicationRule = {
  readonly governingDecisionId: string;
  readonly sourceDecisionId: string;
  readonly check: DecisionApplicationCheckName;
  readonly changedFiles: readonly string[];
};

export type CodexCapabilityMcpServer = {
  readonly name: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly envVars?: readonly string[];
};

export type CodexCapabilityProfile = {
  readonly mode: "baseline" | "krn";
  readonly mcpServers: readonly CodexCapabilityMcpServer[];
  readonly skillPaths: readonly string[];
};

type HeldOutCheckName = NonNullable<PairedRepairScore["krn"]["checks"]>[number]["name"];
type DecisionApplicationCheckName = Exclude<HeldOutCheckName, "focused_test_control">;

/** Preregistered memory treatment labels for paired Codex trials. */
export type PairedMemoryTreatment =
  | "plain"
  | "semantic_governed"
  | "episodic_examples"
  | "procedural_skills"
  | "observational_summary";

export type PairedTrialManifest = {
  readonly kind: "krn.pairedLiveCodexRepairManifest.v1";
  readonly scenario: string;
  readonly sourcePath: string;
  readonly projectId: string;
  readonly taskId: string;
  readonly task: string;
  readonly requiredDecisionIds: readonly string[];
  readonly decisionApplications: readonly PairedDecisionApplicationRule[];
  readonly runId: string;
  readonly codex: {
    readonly command: string;
    readonly args: readonly string[];
    readonly model: string;
    readonly cliVersion: string;
    readonly profile: {
      readonly name: string;
      readonly config: string;
      readonly hash: string;
    };
    readonly permissions: {
      readonly sandbox: "workspace-write";
      readonly approval: "never";
    };
    readonly networkPolicy: "disabled";
    readonly budget: {
      readonly timeoutMs: number;
    };
  };
  readonly capabilities?: {
    readonly baseline: CodexCapabilityProfile;
    readonly krn: CodexCapabilityProfile;
  };
  readonly containment: {
    readonly command: string;
    readonly version: string;
    readonly network: "model_service_egress";
    readonly workspaceWriteRoot: "{targetRoot}";
    readonly homeRoot: "{sandboxRoot}";
  };
  readonly checker: {
    readonly heldOut: true;
    readonly outcome: "win|tie|loss|invalid";
  };
  readonly checkerRevision?: string;
  readonly packetContextMode?: "full" | "task-only";
  readonly packetReadiness?: "ready" | "weak_context" | "abstain";
  readonly treatment?: PairedMemoryTreatment;
};

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const hasRequiredStrings = (value: JsonRecord, keys: readonly string[]): boolean =>
  keys.every((key) => readString(value[key]) !== undefined);

const isStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isPresentStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((item) => readString(item) !== undefined);

const isManifestProfile = (value: unknown): boolean =>
  isRecord(value) && hasRequiredStrings(value, ["name", "config", "hash"]);

const isCapabilityMcpServer = (value: unknown): value is CodexCapabilityMcpServer => {
  if (!isRecord(value)) return false;
  const name = readString(value["name"]);
  if (name === undefined || readString(value["command"]) === undefined || !isStringArray(value["args"])) {
    return false;
  }
  const envVars = value["envVars"];
  return (envVars === undefined || (isStringArray(envVars) && envVars.every((name) => /^[A-Z][A-Z0-9_]*$/u.test(name)))) &&
    /^[A-Za-z0-9_-]+$/u.test(name);
};

const isCapabilityProfile = (
  value: unknown,
  mode: CodexCapabilityProfile["mode"]
): value is CodexCapabilityProfile =>
  isRecord(value) &&
  value["mode"] === mode &&
  Array.isArray(value["mcpServers"]) &&
  value["mcpServers"].every(isCapabilityMcpServer) &&
  isStringArray(value["skillPaths"]) &&
  value["skillPaths"].every(isAbsolute);

export const isTrackedTrialCapabilities = (
  value: unknown
): value is NonNullable<PairedTrialManifest["capabilities"]> => {
  if (!isRecord(value) || !isCapabilityProfile(value["baseline"], "baseline") || !isCapabilityProfile(value["krn"], "krn")) {
    return false;
  }
  return value["baseline"].mcpServers.length === 0 && value["baseline"].skillPaths.length === 0;
};

const isTrackedTrialCodex = (value: unknown): boolean => {
  if (!isRecord(value) || !hasRequiredStrings(value, ["command", "model", "cliVersion"])) return false;
  return isStringArray(value["args"]) &&
    isManifestProfile(value["profile"]) &&
    isManifestPermissions(value["permissions"]) &&
    value["networkPolicy"] === "disabled" &&
    isManifestBudget(value["budget"]);
};

const isManifestPermissions = (value: unknown): boolean =>
  isRecord(value) && value["sandbox"] === "workspace-write" && value["approval"] === "never";

const isManifestBudget = (value: unknown): boolean =>
  isRecord(value) && typeof value["timeoutMs"] === "number" && Number.isFinite(value["timeoutMs"]);

export const isTrackedTrialContainment = (value: unknown): boolean =>
  isRecord(value) &&
  hasRequiredStrings(value, ["command", "version", "workspaceWriteRoot", "homeRoot"]) &&
  value["network"] === "model_service_egress" &&
  value["workspaceWriteRoot"] === "{targetRoot}" &&
  value["homeRoot"] === "{sandboxRoot}";

export const isTrackedTrialChecker = (value: unknown): boolean =>
  isRecord(value) && value["heldOut"] === true && value["outcome"] === "win|tie|loss|invalid";

const decisionApplicationCheckNameValues = [
  "preflight",
  "invalid_json",
  "missing_email",
  "invalid_role",
  "unknown_first",
  "finite_result_state",
  "focused_tests",
  "forbidden_files",
  "target_test",
  "target_typecheck",
  "target_diff_check",
  "held_out_runtime"
] as const satisfies readonly DecisionApplicationCheckName[];

const decisionApplicationCheckNames = new Set<string>(decisionApplicationCheckNameValues);

const isDecisionApplicationCheckName = (value: unknown): value is DecisionApplicationCheckName =>
  typeof value === "string" && decisionApplicationCheckNames.has(value);

const isSafeDecisionApplicationPath = (value: unknown): value is string => {
  const path = readString(value);
  return path !== undefined && !isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`);
};

const hasSafeDecisionApplicationPaths = (value: unknown): value is readonly string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(isSafeDecisionApplicationPath) &&
  new Set(value).size === value.length;

const isDecisionApplicationRule = (value: unknown): value is PairedDecisionApplicationRule => {
  if (!isRecord(value)) return false;
  const governingDecisionId = readString(value["governingDecisionId"]);
  const sourceDecisionId = readString(value["sourceDecisionId"]);
  const check = value["check"];
  return governingDecisionId !== undefined &&
    sourceDecisionId !== undefined &&
    governingDecisionId !== sourceDecisionId &&
    isDecisionApplicationCheckName(check) &&
    hasSafeDecisionApplicationPaths(value["changedFiles"]);
};

const allUnique = (values: readonly string[]): boolean => new Set(values).size === values.length;

const hasCompleteDecisionApplicationRules = (value: JsonRecord): boolean => {
  const requiredDecisionIds = value["requiredDecisionIds"];
  const rules = value["decisionApplications"];
  if (!isPresentStringArray(requiredDecisionIds) || !Array.isArray(rules) || !rules.every(isDecisionApplicationRule)) {
    return false;
  }
  const governingDecisionIds = rules.map((rule) => rule.governingDecisionId);
  return allUnique(requiredDecisionIds) &&
    allUnique(governingDecisionIds) &&
    allUnique(rules.map((rule) => rule.sourceDecisionId)) &&
    allUnique(rules.map((rule) => rule.check)) &&
    allUnique(rules.flatMap((rule) => rule.changedFiles)) &&
    governingDecisionIds.every((id) => requiredDecisionIds.includes(id));
};

export const isPairedMemoryTreatment = (value: unknown): value is PairedMemoryTreatment =>
  value === "plain" ||
  value === "semantic_governed" ||
  value === "episodic_examples" ||
  value === "procedural_skills" ||
  value === "observational_summary";

const optionalValueMatches = (
  value: unknown,
  matches: (candidate: unknown) => boolean
): boolean => value === undefined || matches(value);

const packetReadinessValues = new Set<string>(["ready", "weak_context", "abstain"]);

const hasValidOptionalMetadata = (value: JsonRecord): boolean => [
  optionalValueMatches(value["checkerRevision"], (candidate) => readString(candidate) !== undefined),
  optionalValueMatches(value["packetContextMode"], (candidate) => candidate === "full" || candidate === "task-only"),
  optionalValueMatches(value["packetReadiness"], (candidate) => typeof candidate === "string" && packetReadinessValues.has(candidate)),
  optionalValueMatches(value["treatment"], isPairedMemoryTreatment),
  optionalValueMatches(value["capabilities"], isTrackedTrialCapabilities)
].every(Boolean);

const isPairedTrialManifest = (value: unknown): value is PairedTrialManifest =>
  isRecord(value) &&
  value["kind"] === "krn.pairedLiveCodexRepairManifest.v1" &&
  hasRequiredStrings(value, ["scenario", "sourcePath", "projectId", "taskId", "task", "runId"]) &&
  hasCompleteDecisionApplicationRules(value) &&
  hasValidOptionalMetadata(value) &&
  isTrackedTrialCodex(value["codex"]) &&
  isTrackedTrialContainment(value["containment"]) &&
  isTrackedTrialChecker(value["checker"]);

export const parseTrackedTrialManifest = (value: unknown): PairedTrialManifest => {
  if (!isPairedTrialManifest(value)) throw new Error("Invalid tracked paired-trial manifest");
  return value;
};
