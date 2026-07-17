import { createHash } from "node:crypto";
import { constants } from "node:fs";
import {
  access,
  chmod,
  copyFile,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  basename,
  delimiter,
  isAbsolute,
  join,
  relative,
  resolve,
  sep
} from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildPairedRepairPrompts,
  runCommand,
  runPairedRepairChecker,
  selectHeldOutRuntimePermissionFlag,
  type CommandResult,
  type HeldOutRuntimePermissionFlag,
  type PairedRepairScore
} from "./paired-live-codex-repair.js";
import {
  recordPairedDecisionApplications
} from "./paired-decision-application.js";
import type {
  PairedDecisionApplicationRecorderInput,
  PairedDecisionApplicationRecord
} from "./paired-decision-application.js";

type JsonRecord = Record<string, unknown>;

export type TrackedTrialStatus = "passed" | "invalid" | "blocked" | "unverified";

export type PairedDecisionApplicationRule = {
  readonly governingDecisionId: string;
  readonly sourceDecisionId: string;
  readonly check: HeldOutCheckName;
  readonly changedFiles: readonly string[];
};

type HeldOutCheckName = NonNullable<PairedRepairScore["krn"]["checks"]>[number]["name"];

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
};

export type TrialPacketValidation = {
  readonly valid: boolean;
  readonly reasons: readonly string[];
  readonly checksum?: string;
};

type PairedTrialChecker = (
  input: Parameters<typeof runPairedRepairChecker>[0]
) => Promise<PairedRepairScore>;

type PairedDecisionApplicationRecorder = (
  input: Omit<PairedDecisionApplicationRecorderInput, "databaseUrl">
) => Promise<readonly PairedDecisionApplicationRecord[]>;

type TrialToolObservation = {
  readonly command: string;
  readonly executable?: string;
  readonly version: CommandResult;
};

type TrialTargetState = {
  readonly status: "known" | "unknown";
  readonly treeHash?: string;
  readonly statusOutput: string;
  readonly trackedFiles: readonly string[];
  readonly untrackedFiles: readonly string[];
  readonly patchHash?: string;
  readonly commands: {
    readonly status: CommandResult;
    readonly tracked: CommandResult;
    readonly untracked: CommandResult;
    readonly patch: CommandResult;
  };
};

type TrialArmTargetStates = {
  readonly before: TrialTargetState;
  readonly after?: TrialTargetState;
};

type TrialAttemptPhaseName =
  | "claimed"
  | "conditions_observed"
  | "materialized"
  | "baseline_executed"
  | "krn_executed"
  | "checker_scored"
  | "finalized";

const trialAttemptPhaseNames: readonly TrialAttemptPhaseName[] = [
  "claimed",
  "conditions_observed",
  "materialized",
  "baseline_executed",
  "krn_executed",
  "checker_scored",
  "finalized"
];

const trialAttemptProgressPhaseNames: readonly Exclude<TrialAttemptPhaseName, "finalized">[] = [
  "claimed",
  "conditions_observed",
  "materialized",
  "baseline_executed",
  "krn_executed",
  "checker_scored"
];

const isTrialAttemptPhaseName = (value: string): value is TrialAttemptPhaseName =>
  trialAttemptPhaseNames.includes(value as TrialAttemptPhaseName);

const isValidTrialAttemptPhaseSequence = (phases: readonly TrialAttemptPhaseName[]): boolean =>
  phases.length >= 2 &&
  phases.at(-1) === "finalized" &&
  phases.slice(0, -1).every((name, index) => name === trialAttemptProgressPhaseNames[index]);

type TrialAttemptPhase = {
  readonly name: TrialAttemptPhaseName;
  readonly hash: string;
};

type TrialAttempt = {
  readonly directoryHash: string;
  readonly phases: readonly TrialAttemptPhase[];
};

type TrialConditions = {
  readonly requested: {
    readonly codex: {
      readonly command: string;
      readonly model: string;
      readonly cliVersion: string;
      readonly profileName: string;
      readonly profileHash: string;
      readonly permissions: PairedTrialManifest["codex"]["permissions"];
      readonly networkPolicy: "disabled";
      readonly timeoutMs: number;
    };
    readonly containment: PairedTrialManifest["containment"];
    readonly armOrder: readonly ["baseline", "krn"];
    readonly checker: PairedTrialManifest["checker"];
  };
  readonly observed?: {
    readonly containment?: TrialToolObservation;
    readonly codex?: TrialToolObservation;
    readonly authentication?: CommandResult;
    readonly profileHash?: string;
    readonly environmentProfileHash?: string;
    readonly environmentVariableNames?: readonly string[];
    readonly credentialProvided?: boolean;
    readonly checkerRuntime?: {
      readonly nodeVersion: string;
      readonly permissionFlag: HeldOutRuntimePermissionFlag | "unsupported";
    };
  };
};

export type TrackedTrialArtifact = {
  readonly kind: "krn.pairedLiveCodexRepairArtifact.v1";
  readonly status: TrackedTrialStatus;
  readonly artifactHash: string;
  readonly manifestHash: string;
  readonly sourceTreeHash: string;
  readonly baselineTreeHash?: string;
  readonly krnTreeHash?: string;
  readonly runId: string;
  readonly packet: {
    readonly checksum?: string;
    readonly validation: TrialPacketValidation;
  };
  readonly execution: {
    readonly conditions: TrialConditions;
    readonly environmentProfileHash?: string;
    readonly attempt?: TrialAttempt;
    readonly invalidReasons?: readonly string[];
    readonly promptDelta?: {
      readonly baselineHash: string;
      readonly krnHash: string;
      readonly deltaHash: string;
      readonly deltaBytes: number;
      readonly packetOnlyByConstruction: true;
    };
    readonly baseline?: CommandResult;
    readonly krn?: CommandResult;
    readonly targets?: {
      readonly baseline: TrialArmTargetStates;
      readonly krn: TrialArmTargetStates;
    };
  };
  readonly score?: PairedRepairScore;
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
};

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sha256 = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

const serializedJson = (value: unknown): string => JSON.stringify(value) ?? "null";

const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const isPresentString = (value: unknown): boolean =>
  readString(value) !== undefined;

const readStringArray = (value: unknown): readonly string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : [];

const nestedRecord = (value: JsonRecord | undefined, key: string): JsonRecord | undefined =>
  value !== undefined && isRecord(value[key]) ? value[key] : undefined;

const hasRequiredStrings = (value: JsonRecord | undefined, keys: readonly string[]): boolean =>
  value !== undefined && keys.every((key) => readString(value[key]) !== undefined);

const isStringArrayValue = (value: unknown): boolean =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isManifestProfile = (value: unknown): boolean =>
  isRecord(value) && hasRequiredStrings(value, ["name", "config", "hash"]);

const isManifestPermissions = (value: unknown): boolean =>
  isRecord(value) &&
  value["sandbox"] === "workspace-write" &&
  value["approval"] === "never";

const isManifestBudget = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value["timeoutMs"] === "number" &&
  Number.isFinite(value["timeoutMs"]);

const isManifestCodex = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  return hasRequiredStrings(value, ["command", "model", "cliVersion"]) &&
    isStringArrayValue(value["args"]) &&
    isManifestProfile(value["profile"]) &&
    isManifestPermissions(value["permissions"]) &&
    value["networkPolicy"] === "disabled" &&
    isManifestBudget(value["budget"]);
};

const isManifestContainment = (value: unknown): boolean =>
  isRecord(value) &&
  hasRequiredStrings(value, ["command", "version", "workspaceWriteRoot", "homeRoot"]) &&
  value["network"] === "model_service_egress" &&
  value["workspaceWriteRoot"] === "{targetRoot}" &&
  value["homeRoot"] === "{sandboxRoot}";

const isManifestChecker = (value: unknown): boolean =>
  isRecord(value) &&
  value["heldOut"] === true &&
    value["outcome"] === "win|tie|loss|invalid";

const heldOutCheckNames = new Set<string>([
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
]);

const isSafeDecisionApplicationPath = (value: unknown): value is string => {
  const path = readString(value);
  return path !== undefined &&
    !isAbsolute(path) &&
    path !== ".." &&
    !path.startsWith(`..${sep}`);
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
    typeof check === "string" &&
    heldOutCheckNames.has(check) &&
    hasSafeDecisionApplicationPaths(value["changedFiles"]);
};

const hasUnambiguousDecisionApplicationProofs = (
  rules: readonly PairedDecisionApplicationRule[]
): boolean => {
  const governingDecisionIds = rules.map((rule) => rule.governingDecisionId);
  const sourceDecisionIds = rules.map((rule) => rule.sourceDecisionId);
  const checks = rules.map((rule) => rule.check);
  const changedFiles = rules.flatMap((rule) => rule.changedFiles);
  return new Set(governingDecisionIds).size === governingDecisionIds.length &&
    new Set(sourceDecisionIds).size === sourceDecisionIds.length &&
    new Set(checks).size === checks.length &&
    new Set(changedFiles).size === changedFiles.length;
};

const hasCompleteDecisionApplicationRules = (value: JsonRecord): boolean => {
  const requiredDecisionIds = value["requiredDecisionIds"];
  const rules = value["decisionApplications"];
  if (!Array.isArray(requiredDecisionIds) || !Array.isArray(rules) || !rules.every(isDecisionApplicationRule)) {
    return false;
  }
  const governingDecisionIds = rules.map((rule) => rule.governingDecisionId);
  return new Set(requiredDecisionIds).size === requiredDecisionIds.length &&
    hasUnambiguousDecisionApplicationProofs(rules) &&
    requiredDecisionIds.length === governingDecisionIds.length &&
    requiredDecisionIds.every((id) =>
      typeof id === "string" && governingDecisionIds.includes(id)
    );
};

const isPairedTrialManifest = (value: unknown): value is PairedTrialManifest => {
  if (!isRecord(value) || value["kind"] !== "krn.pairedLiveCodexRepairManifest.v1") return false;
  return hasRequiredStrings(value, ["scenario", "sourcePath", "projectId", "taskId", "task", "runId"]) &&
    Array.isArray(value["requiredDecisionIds"]) &&
    value["requiredDecisionIds"].every((id) => readString(id) !== undefined) &&
    hasCompleteDecisionApplicationRules(value) &&
    isManifestCodex(value["codex"]) &&
    isManifestContainment(value["containment"]) &&
    isManifestChecker(value["checker"]);
};

export const parseTrackedTrialManifest = (value: unknown): PairedTrialManifest => {
  if (!isPairedTrialManifest(value)) throw new Error("Invalid tracked paired-trial manifest");
  return value;
};

const missingReason = (condition: boolean, reason: string): string | undefined =>
  condition ? undefined : reason;

const packetShapeReasons = (
  root: JsonRecord | undefined,
  manifest: Pick<PairedTrialManifest, "runId" | "projectId" | "taskId">
): { readonly reasons: readonly string[]; readonly body?: JsonRecord; readonly checksum?: string } => {
  const request = nestedRecord(root, "request");
  const identity = nestedRecord(root, "packetIdentity");
  const body = nestedRecord(root, "packet");
  const task = nestedRecord(body, "task");
  const checksum = readString(identity?.["checksum"]);

  const reasons = [
    missingReason(root?.["kind"] === "krn.decisionPacketReadback.v1", "packet kind is not the bounded DecisionPacket readback"),
    missingReason(request?.["runId"] === manifest.runId, "packet runId does not match the trial manifest"),
    missingReason(checksum !== undefined, "packet checksum is missing"),
    missingReason(task?.["id"] === manifest.taskId, "packet task id does not match the trial manifest"),
    missingReason(task?.["projectId"] === manifest.projectId, "packet task is not bound to the manifest project")
  ].filter((reason): reason is string => reason !== undefined);

  return { reasons, ...(body === undefined ? {} : { body }), ...(checksum === undefined ? {} : { checksum }) };
};

const packetAuthorityReasons = (
  body: JsonRecord | undefined,
  manifest: Pick<PairedTrialManifest, "requiredDecisionIds" | "decisionApplications">
): readonly string[] => {
  const governingDecisionIds = readStringArray(body?.["governingDecisionIds"]);
  const sourceDecisionIds = readStringArray(body?.["sourceDecisionIds"]);
  const missingRequired = manifest.requiredDecisionIds.filter((id) =>
    !governingDecisionIds.includes(id)
  );
  const missingSourceDecisions = manifest.decisionApplications
    .map((rule) => rule.sourceDecisionId)
    .filter((id) => !sourceDecisionIds.includes(id));
  const abstention = nestedRecord(body, "abstentionScore");
  return [
    ...(missingRequired.length === 0 ? [] : [`packet lacks task-relevant governing decisions: ${missingRequired.join(", ")}`]),
    ...(missingSourceDecisions.length === 0 ? [] : [
      `packet lacks exact SourceDecision subjects: ${missingSourceDecisions.join(", ")}`
    ]),
    ...(abstention?.["status"] === "ready" ? [] : ["packet abstains or is not ready for the trial"])
  ];
};

export const validateTrialPacket = (
  packet: unknown,
  manifest: Pick<
    PairedTrialManifest,
    "runId" | "projectId" | "taskId" | "requiredDecisionIds" | "decisionApplications"
  >
): TrialPacketValidation => {
  const root = isRecord(packet) ? packet : undefined;
  const shape = packetShapeReasons(root, manifest);
  const reasons = [...shape.reasons, ...packetAuthorityReasons(shape.body, manifest)];
  return {
    valid: reasons.length === 0,
    reasons,
    ...(shape.checksum === undefined ? {} : { checksum: shape.checksum })
  };
};

type TreeEntry = {
  readonly path: string;
  readonly kind: "directory" | "file";
  readonly mode: number;
};

const treeEntries = async (root: string, current = root): Promise<readonly TreeEntry[]> => {
  const entries = await readdir(current, { withFileTypes: true });
  const paths: TreeEntry[] = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name === ".git") continue;
    const absolute = join(current, entry.name);
    const path = relative(root, absolute);
    const metadata = await lstat(absolute);
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are not allowed in a trial source: ${path}`);
    if (entry.isDirectory()) {
      paths.push({ path, kind: "directory", mode: metadata.mode });
      paths.push(...await treeEntries(root, absolute));
    } else if (entry.isFile()) paths.push({ path, kind: "file", mode: metadata.mode });
    else throw new Error(`Unsupported source entry in trial: ${path}`);
  }

  return paths;
};

export const hashTree = async (root: string): Promise<string> => {
  const hash = createHash("sha256");
  for (const entry of await treeEntries(root)) {
    hash.update(entry.kind);
    hash.update("\0");
    hash.update(entry.path);
    hash.update("\0");
    hash.update(entry.mode.toString(8));
    hash.update("\0");
    if (entry.kind === "file") hash.update(await readFile(join(root, entry.path)));
    hash.update("\0");
  }
  return hash.digest("hex");
};

type ProcessOptions = {
  readonly cwd: string;
  readonly env: NodeJS.ProcessEnv;
  readonly timeoutMs: number;
  readonly input?: string;
};

const runProcess = (
  command: string,
  args: readonly string[],
  options: ProcessOptions
): Promise<CommandResult> => options.input === undefined
  ? runCommand(command, args, options.cwd, { env: options.env, timeoutMs: options.timeoutMs })
  : runCommand(command, args, options.cwd, { env: options.env, timeoutMs: options.timeoutMs, input: options.input });

const allowlistedEnvironment = (
  sandboxRoot: string,
  targetRoot: string
): NodeJS.ProcessEnv => ({
  PATH: process.env.PATH,
  CI: "1",
  NODE_ENV: "test",
  HOME: sandboxRoot,
  CODEX_HOME: sandboxRoot,
  TMPDIR: sandboxRoot,
  TMP: sandboxRoot,
  TEMP: sandboxRoot,
  KRN_TRIAL_TARGET_ROOT: targetRoot
});

const materializeChatGptAuth = async (sandboxRoot: string): Promise<string | undefined> => {
  const hostCodexHome = process.env.KRN_TRIAL_CODEX_HOME?.trim();
  if (hostCodexHome === undefined || hostCodexHome.length === 0) {
    return "explicit host Codex home is unavailable";
  }
  const source = join(hostCodexHome, "auth.json");
  const destination = join(sandboxRoot, "auth.json");
  try {
    const metadata = await lstat(source);
    if (!metadata.isFile() || metadata.isSymbolicLink()) return "host Codex ChatGPT authentication is unavailable";
    await copyFile(source, destination, constants.COPYFILE_EXCL);
    await chmod(destination, 0o600);
    return undefined;
  } catch {
    return "host Codex ChatGPT authentication is unavailable";
  }
};

const replaceArgument = (argument: string, replacements: Readonly<Record<string, string>>): string =>
  Object.entries(replacements).reduce((result, [key, value]) => result.replaceAll(key, value), argument);

const gitCommit = async (root: string, env: NodeJS.ProcessEnv): Promise<string> => {
  const gitEnv = {
    ...env,
    GIT_AUTHOR_NAME: "KRN paired trial",
    GIT_AUTHOR_EMAIL: "krn-paired-trial@example.invalid",
    GIT_COMMITTER_NAME: "KRN paired trial",
    GIT_COMMITTER_EMAIL: "krn-paired-trial@example.invalid"
  };
  for (const args of [["init", "--quiet"], ["add", "--all"], ["commit", "--quiet", "-m", "fixture baseline"]] as const) {
    const result = await runProcess("git", args, { cwd: root, env: gitEnv, timeoutMs: 30_000 });
    if (result.exitCode !== 0) throw new Error(`Cannot materialize target git baseline: ${result.stderr}`);
  }
  const result = await runProcess("git", ["rev-parse", "HEAD"], { cwd: root, env: gitEnv, timeoutMs: 30_000 });
  if (result.exitCode !== 0) throw new Error(`Cannot read target baseline commit: ${result.stderr}`);
  return result.stdout.trim();
};

type MaterializedTrialTarget = {
  readonly root: string;
  readonly commit: string;
  readonly treeHash: string;
};

const materializeTarget = async (
  sourceRoot: string,
  trialRoot: string,
  env: NodeJS.ProcessEnv
): Promise<MaterializedTrialTarget> => {
  const root = join(trialRoot, "target");
  await mkdir(trialRoot, { recursive: true });
  await cp(sourceRoot, root, {
    recursive: true,
    force: false,
    errorOnExist: true,
    filter: (source) => basename(source) !== ".git"
  });
  const commit = await gitCommit(root, env);
  return { root, commit, treeHash: await hashTree(root) };
};

const resolveExecutable = async (
  command: string,
  environment: NodeJS.ProcessEnv
): Promise<string | undefined> => {
  const candidates = isAbsolute(command) || command.includes("/")
    ? [command]
    : (environment.PATH ?? "").split(delimiter).filter(Boolean).map((directory) => join(directory, command));

  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK);
      return await realpath(candidate);
    } catch {
      continue;
    }
  }

  return undefined;
};

const observeTool = async (input: {
  readonly command: string;
  readonly cwd: string;
  readonly environment: NodeJS.ProcessEnv;
}): Promise<TrialToolObservation> => {
  const executable = await resolveExecutable(input.command, input.environment);
  const version = await runProcess(executable ?? input.command, ["--version"], {
    cwd: input.cwd,
    env: input.environment,
    timeoutMs: 10_000
  });

  return {
    command: input.command,
    ...(executable === undefined ? {} : { executable }),
    version
  };
};

const exactFlagValue = (args: readonly string[], flag: string): string | undefined => {
  const indexes = args.flatMap((argument, index) => argument === flag ? [index] : []);
  const index = indexes[0];

  return indexes.length === 1 && index !== undefined ? args[index + 1] : undefined;
};

const hasOwn = (value: object, key: string): boolean => Object.prototype.hasOwnProperty.call(value, key);

const hasAmbiguousCodexArgument = (argument: string): boolean =>
  argument === "--config" ||
  argument.startsWith("--config=") ||
  argument === "-c" ||
  (argument.startsWith("-c") && argument.length > 2) ||
  argument === "--yolo" ||
  argument === "--dangerously-bypass-approvals-and-sandbox" ||
  ["--model", "--profile", "--sandbox", "--ask-for-approval"].some((flag) =>
    argument.startsWith(`${flag}=`)
  );

const manifestConditionReasons = (manifest: PairedTrialManifest): readonly string[] => {
  const profileHash = sha256(manifest.codex.profile.config);
  const execIndex = manifest.codex.args.indexOf("exec");
  const approvalIndex = manifest.codex.args.indexOf("--ask-for-approval");

  return [
    missingReason(manifest.codex.command.trim().length > 0, "Codex command is missing"),
    missingReason(manifest.containment.command.trim().length > 0, "containment command is missing"),
    missingReason(manifest.containment.version.trim().length > 0, "containment version is missing"),
    missingReason(manifest.codex.cliVersion.trim().length > 0, "Codex CLI version is missing"),
    missingReason(manifest.codex.model.trim().length > 0, "Codex model is missing"),
    missingReason(exactFlagValue(manifest.codex.args, "--model") === manifest.codex.model, "Codex --model does not match the manifest"),
    missingReason(exactFlagValue(manifest.codex.args, "--profile") === manifest.codex.profile.name, "Codex --profile does not match the manifest"),
    missingReason(exactFlagValue(manifest.codex.args, "--sandbox") === manifest.codex.permissions.sandbox, "Codex --sandbox does not match the manifest"),
    missingReason(exactFlagValue(manifest.codex.args, "--ask-for-approval") === manifest.codex.permissions.approval, "Codex approval mode does not match the manifest"),
    missingReason(execIndex >= 0 && approvalIndex >= 0 && approvalIndex < execIndex, "Codex approval mode must be configured before exec"),
    missingReason(manifest.codex.args.includes("--ignore-user-config"), "Codex user config must be ignored"),
    missingReason(manifest.codex.args.includes("--ignore-rules"), "Codex user rules must be ignored"),
    missingReason(manifest.codex.args.includes("--ephemeral"), "Codex session persistence must be disabled"),
    missingReason(manifest.codex.args.filter((argument) => argument.includes("{prompt}")).length === 1, "Codex args must contain exactly one prompt placeholder"),
    missingReason(/^[A-Za-z0-9_-]+$/u.test(manifest.codex.profile.name), "Codex profile name is unsafe"),
    missingReason(profileHash === manifest.codex.profile.hash, "Codex profile content does not match its pinned hash"),
    missingReason(Number.isFinite(manifest.codex.budget.timeoutMs) && manifest.codex.budget.timeoutMs > 0, "Codex timeout budget is invalid"),
    missingReason(!hasOwn(manifest.codex.budget, "maxTokens"), "Codex maxTokens is not an enforceable CLI budget"),
    ...(manifest.codex.args.some(hasAmbiguousCodexArgument)
      ? ["Codex args include an unbounded configuration override"]
      : [])
  ].filter((reason): reason is string => reason !== undefined);
};

export const trackedTrialRequestedConditions = (
  manifest: PairedTrialManifest
): TrialConditions["requested"] => ({
    codex: {
      command: manifest.codex.command,
      model: manifest.codex.model,
      cliVersion: manifest.codex.cliVersion,
      profileName: manifest.codex.profile.name,
      profileHash: manifest.codex.profile.hash,
      permissions: manifest.codex.permissions,
      networkPolicy: manifest.codex.networkPolicy,
      timeoutMs: manifest.codex.budget.timeoutMs
    },
    containment: manifest.containment,
    armOrder: ["baseline", "krn"],
    checker: manifest.checker
});

const trialConditions = (manifest: PairedTrialManifest): TrialConditions => ({
  requested: trackedTrialRequestedConditions(manifest)
});

const normalizedEnvironmentPath = (value: string | undefined, expected: string, marker: string): string =>
  value === expected ? marker : "unexpected";

const environmentProfileHash = (
  environment: NodeJS.ProcessEnv,
  sandboxRoot: string,
  targetRoot: string
): string => sha256(serializedJson({
  PATH: environment.PATH ?? "",
  CI: environment.CI ?? "",
  NODE_ENV: environment.NODE_ENV ?? "",
  HOME: normalizedEnvironmentPath(environment.HOME, sandboxRoot, "{sandboxRoot}"),
  CODEX_HOME: normalizedEnvironmentPath(environment.CODEX_HOME, sandboxRoot, "{sandboxRoot}"),
  TMPDIR: normalizedEnvironmentPath(environment.TMPDIR, sandboxRoot, "{sandboxRoot}"),
  TMP: normalizedEnvironmentPath(environment.TMP, sandboxRoot, "{sandboxRoot}"),
  TEMP: normalizedEnvironmentPath(environment.TEMP, sandboxRoot, "{sandboxRoot}"),
  KRN_TRIAL_TARGET_ROOT: normalizedEnvironmentPath(environment.KRN_TRIAL_TARGET_ROOT, targetRoot, "{targetRoot}"),
  OPENAI_API_KEY: environment.OPENAI_API_KEY === undefined ? "absent" : "present",
  network: "disabled"
}));

const pathLines = (result: CommandResult): readonly string[] =>
  result.stdout.split("\n").map((path) => path.trim()).filter(Boolean);

const captureTargetState = async (input: {
  readonly targetRoot: string;
  readonly initialCommit: string;
  readonly environment: NodeJS.ProcessEnv;
}): Promise<TrialTargetState> => {
  const [status, tracked, untracked, patch] = await Promise.all([
    runProcess("git", ["status", "--porcelain=v1", "--untracked-files=all"], {
      cwd: input.targetRoot,
      env: input.environment,
      timeoutMs: 30_000
    }),
    runProcess("git", ["diff", input.initialCommit, "--name-only"], {
      cwd: input.targetRoot,
      env: input.environment,
      timeoutMs: 30_000
    }),
    runProcess("git", ["ls-files", "--others", "--exclude-standard"], {
      cwd: input.targetRoot,
      env: input.environment,
      timeoutMs: 30_000
    }),
    runProcess("git", ["diff", input.initialCommit, "--binary"], {
      cwd: input.targetRoot,
      env: input.environment,
      timeoutMs: 30_000
    })
  ]);
  const known = [status, tracked, untracked, patch].every((result) => result.exitCode === 0);
  let treeHash: string | undefined;

  try {
    treeHash = await hashTree(input.targetRoot);
  } catch {
    return {
      status: "unknown",
      statusOutput: status.stdout,
      trackedFiles: pathLines(tracked),
      untrackedFiles: pathLines(untracked),
      commands: { status, tracked, untracked, patch }
    };
  }

  return {
    status: known ? "known" : "unknown",
    ...(treeHash === undefined ? {} : { treeHash }),
    statusOutput: status.stdout,
    trackedFiles: pathLines(tracked),
    untrackedFiles: pathLines(untracked),
    ...(patch.exitCode === 0 ? { patchHash: sha256(patch.stdout) } : {}),
    commands: { status, tracked, untracked, patch }
  };
};

const targetStateIsClean = (state: TrialTargetState): boolean =>
  state.status === "known" &&
  state.statusOutput.trim().length === 0 &&
  state.trackedFiles.length === 0 &&
  state.untrackedFiles.length === 0;

const targetStateReason = (arm: "baseline" | "krn", phase: "before" | "after", state: TrialTargetState): string | undefined =>
  state.status === "known"
    ? undefined
    : `${arm} target ${phase} state could not be captured`;

const armFailureReason = (arm: "baseline" | "krn", result: CommandResult): string | undefined =>
  result.exitCode === 0
    ? undefined
    : result.exitCode === null
      ? `${arm} arm did not complete successfully`
      : `${arm} arm exited with ${result.exitCode}`;

type TrialJournal = {
  readonly attempt: () => TrialAttempt;
  readonly phase: (name: TrialAttemptPhaseName, detail: unknown) => Promise<void>;
  readonly writeArtifact: (artifact: TrackedTrialArtifact) => Promise<void>;
};

const phaseFileName = (index: number, name: TrialAttemptPhaseName): string =>
  `${String(index + 1).padStart(2, "0")}-${name}.json`;

const createTrialJournal = async (input: {
  readonly directory: string;
  readonly runId: string;
  readonly manifestHash: string;
  readonly sourceTreeHash: string;
}): Promise<
  | { readonly kind: "claimed"; readonly journal: TrialJournal }
  | { readonly kind: "replayed"; readonly reason: string }
  | { readonly kind: "unavailable"; readonly reason: string }
> => {
  try {
    await mkdir(input.directory);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return code === "EEXIST"
      ? { kind: "replayed", reason: "trial attempt directory is already claimed" }
      : { kind: "unavailable", reason: "trial attempt directory could not be created" };
  }

  const phases: TrialAttemptPhase[] = [];
  const directoryHash = sha256(resolve(input.directory));
  const phase = async (name: TrialAttemptPhaseName, detail: unknown): Promise<void> => {
    const record = {
      kind: "krn.pairedLiveCodexRepairAttemptPhase.v1",
      name,
      runId: input.runId,
      manifestHash: input.manifestHash,
      sourceTreeHash: input.sourceTreeHash,
      ...(phases.length === 0 ? {} : { previousHash: phases.at(-1)?.hash }),
      detail
    };
    const serialized = serializedJson(record);
    const hash = sha256(serialized);
    await writeFile(join(input.directory, phaseFileName(phases.length, name)), serialized, {
      encoding: "utf8",
      flag: "wx"
    });
    phases.push({ name, hash });
  };
  const journal: TrialJournal = {
    attempt: () => ({ directoryHash, phases: [...phases] }),
    phase,
    writeArtifact: async (artifact) => {
      await writeFile(join(input.directory, "artifact.json"), serializedJson(artifact), {
        encoding: "utf8",
        flag: "wx"
      });
    }
  };

  await journal.phase("claimed", { directoryHash });
  return { kind: "claimed", journal };
};

const isStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const optionalValue = (
  record: JsonRecord,
  key: string,
  check: (value: unknown) => boolean
): boolean => record[key] === undefined || check(record[key]);

const isCommandResult = (value: unknown): value is CommandResult => {
  if (!isRecord(value)) return false;
  return readString(value["command"]) !== undefined &&
    isStringArray(value["args"]) &&
    (typeof value["exitCode"] === "number" || value["exitCode"] === null) &&
    typeof value["stdout"] === "string" &&
    typeof value["stderr"] === "string" &&
    optionalValue(value, "durationMs", (duration) =>
      typeof duration === "number" && Number.isFinite(duration) && duration >= 0
    );
};

const isTrialToolObservation = (value: unknown): value is TrialToolObservation => {
  if (!isRecord(value)) return false;
  return readString(value["command"]) !== undefined &&
    optionalValue(value, "executable", isPresentString) &&
    isCommandResult(value["version"]);
};

const isTrialPacketValidation = (value: unknown): value is TrialPacketValidation => {
  if (!isRecord(value)) return false;
  return typeof value["valid"] === "boolean" &&
    isStringArray(value["reasons"]) &&
    optionalValue(value, "checksum", isPresentString);
};

const isTargetStateCommands = (value: unknown): boolean =>
  isRecord(value) &&
  ["status", "tracked", "untracked", "patch"].every((name) => isCommandResult(value[name]));

const isTrialTargetState = (value: unknown): value is TrialTargetState => {
  if (!isRecord(value)) return false;
  return (value["status"] === "known" || value["status"] === "unknown") &&
    typeof value["statusOutput"] === "string" &&
    isStringArray(value["trackedFiles"]) &&
    isStringArray(value["untrackedFiles"]) &&
    optionalValue(value, "treeHash", isPresentString) &&
    optionalValue(value, "patchHash", isPresentString) &&
    isTargetStateCommands(value["commands"]);
};

const isTrialArmTargetStates = (value: unknown): value is TrialArmTargetStates => {
  if (!isRecord(value)) return false;
  return isTrialTargetState(value["before"]) &&
    optionalValue(value, "after", isTrialTargetState);
};

const isTrialAttempt = (value: unknown): value is TrialAttempt => {
  if (!isRecord(value) || readString(value["directoryHash"]) === undefined || !Array.isArray(value["phases"])) return false;
  const phases = value["phases"];
  const names: TrialAttemptPhaseName[] = [];
  for (const phase of phases) {
    if (!isRecord(phase)) return false;
    const name = phase["name"];
    if (typeof name !== "string" || !isTrialAttemptPhaseName(name) || readString(phase["hash"]) === undefined) {
      return false;
    }
    names.push(name);
  }
  return isValidTrialAttemptPhaseSequence(names);
};

const isRequestedCodexConditions = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  const permissions = nestedRecord(value, "permissions");
  return hasRequiredStrings(value, ["command", "model", "cliVersion", "profileName", "profileHash"]) &&
    isManifestPermissions(permissions) &&
    value["networkPolicy"] === "disabled" &&
    typeof value["timeoutMs"] === "number" &&
    Number.isFinite(value["timeoutMs"]);
};

const isRequestedContainmentConditions = (value: unknown): boolean =>
  isManifestContainment(value);

const isRequestedArmOrder = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.length === 2 &&
  value[0] === "baseline" &&
  value[1] === "krn";

const isRequestedTrialConditions = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  return isRequestedCodexConditions(value["codex"]) &&
    isRequestedContainmentConditions(value["containment"]) &&
    isRequestedArmOrder(value["armOrder"]) &&
    isManifestChecker(value["checker"]);
};

const isHeldOutRuntimePermissionFlag = (value: unknown): boolean =>
  value === "--permission" ||
  value === "--experimental-permission" ||
  value === "unsupported";

const isObservedCheckerRuntime = (value: unknown): boolean =>
  value === undefined || (
    isRecord(value) &&
    readString(value["nodeVersion"]) !== undefined &&
    isHeldOutRuntimePermissionFlag(value["permissionFlag"])
  );

const isObservedTrialConditions = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  return optionalValue(value, "containment", isTrialToolObservation) &&
    optionalValue(value, "codex", isTrialToolObservation) &&
    optionalValue(value, "profileHash", isPresentString) &&
    optionalValue(value, "environmentProfileHash", isPresentString) &&
    optionalValue(value, "environmentVariableNames", isStringArray) &&
    optionalValue(value, "credentialProvided", (credential) => typeof credential === "boolean") &&
    isObservedCheckerRuntime(value["checkerRuntime"]);
};

const isTrialConditions = (value: unknown): value is TrialConditions => {
  if (!isRecord(value) || !isRequestedTrialConditions(value["requested"])) return false;
  return value["observed"] === undefined || isObservedTrialConditions(value["observed"]);
};

const isHeldOutCheck = (value: unknown): boolean =>
  isRecord(value) &&
  readString(value["name"]) !== undefined &&
  typeof value["passed"] === "boolean" &&
  typeof value["details"] === "string";

const isTargetChangeManifest = (value: unknown): boolean =>
  isRecord(value) &&
  (value["status"] === "known" || value["status"] === "unknown") &&
  isStringArray(value["trackedFiles"]) &&
  isStringArray(value["untrackedFiles"]) &&
  isStringArray(value["changedFiles"]) &&
  isStringArray(value["forbiddenFiles"]) &&
  typeof value["statusOutput"] === "string";

const isHeldOutArmStatus = (value: unknown): boolean =>
  value === "pass" || value === "fail" || value === "invalid";

const isHeldOutCommands = (value: unknown): boolean =>
  value === undefined ||
  (isRecord(value) &&
    ["test", "typecheck", "diffCheck"].every((name) => isCommandResult(value[name])));

const isHeldOutArmBasics = (value: JsonRecord): boolean =>
  isHeldOutArmStatus(value["status"]) &&
  typeof value["score"] === "number" &&
  Number.isFinite(value["score"]) &&
  Array.isArray(value["checks"]) &&
  value["checks"].every(isHeldOutCheck) &&
  isStringArray(value["changedFiles"]);

const isHeldOutArmScore = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  return isHeldOutArmBasics(value) &&
    optionalValue(value, "changeManifest", isTargetChangeManifest) &&
    isHeldOutCommands(value["commands"]) &&
    optionalValue(value, "runtimeCommand", isCommandResult);
};

const isPairedRepairScore = (value: unknown): value is PairedRepairScore =>
  isRecord(value) &&
  (value["outcome"] === "win" || value["outcome"] === "tie" || value["outcome"] === "loss" || value["outcome"] === "invalid") &&
  isHeldOutArmScore(value["baseline"]) &&
  isHeldOutArmScore(value["krn"]) &&
  typeof value["reason"] === "string";

const isTrialPromptDelta = (value: unknown): boolean =>
  isRecord(value) &&
  readString(value["baselineHash"]) !== undefined &&
  readString(value["krnHash"]) !== undefined &&
  readString(value["deltaHash"]) !== undefined &&
  typeof value["deltaBytes"] === "number" &&
  Number.isFinite(value["deltaBytes"]) &&
  value["packetOnlyByConstruction"] === true;

const isTrialExecutionFields = (value: JsonRecord): boolean =>
  optionalValue(value, "environmentProfileHash", isPresentString) &&
  optionalValue(value, "attempt", isTrialAttempt) &&
  optionalValue(value, "invalidReasons", isStringArray) &&
  optionalValue(value, "promptDelta", isTrialPromptDelta) &&
  optionalValue(value, "baseline", isCommandResult) &&
  optionalValue(value, "krn", isCommandResult);

const isTrialExecutionTargets = (value: unknown): boolean =>
  value === undefined ||
  (isRecord(value) &&
    isTrialArmTargetStates(value["baseline"]) &&
    isTrialArmTargetStates(value["krn"]));

const isTrialExecution = (value: unknown): boolean => {
  if (!isRecord(value) || !isTrialConditions(value["conditions"])) return false;
  return isTrialExecutionFields(value) && isTrialExecutionTargets(value["targets"]);
};

const hasPassedPacket = (value: JsonRecord): boolean => {
  const packet = nestedRecord(value, "packet");
  const validation = packet?.["validation"];
  return isTrialPacketValidation(validation) &&
    validation.valid === true &&
    readString(packet?.["checksum"]) !== undefined;
};

const hasPassedObservedTools = (observed: JsonRecord | undefined): boolean =>
  isTrialToolObservation(observed?.["containment"]) &&
  isTrialToolObservation(observed?.["codex"]);

const hasMatchingObservedEnvironment = (
  observed: JsonRecord | undefined,
  execution: JsonRecord
): boolean => {
  const observedEnvironmentHash = readString(observed?.["environmentProfileHash"]);
  const executionEnvironmentHash = readString(execution["environmentProfileHash"]);
  return observedEnvironmentHash !== undefined && observedEnvironmentHash === executionEnvironmentHash;
};

const hasPassedObservedConditions = (execution: JsonRecord): boolean => {
  const conditions = nestedRecord(execution, "conditions");
  const observed = nestedRecord(conditions, "observed");
  return hasPassedObservedTools(observed) &&
    readString(observed?.["profileHash"]) !== undefined &&
    hasMatchingObservedEnvironment(observed, execution) &&
    observed?.["credentialProvided"] === true;
};

const hasPassedTreeIdentity = (value: JsonRecord): boolean =>
  readString(value["baselineTreeHash"]) === value["sourceTreeHash"] &&
  value["krnTreeHash"] === value["baselineTreeHash"];

const isSuccessfulTrialArm = (result: unknown, state: unknown): boolean =>
  isCommandResult(result) &&
  result.exitCode === 0 &&
  isTrialTargetState(state) &&
  state.status === "known";

const hasPassedArmExecution = (execution: JsonRecord): boolean => {
  const targets = nestedRecord(execution, "targets");
  const baselineTargets = nestedRecord(targets, "baseline");
  const krnTargets = nestedRecord(targets, "krn");
  return isTrialPromptDelta(execution["promptDelta"]) &&
    isSuccessfulTrialArm(execution["baseline"], baselineTargets?.["after"]) &&
    isSuccessfulTrialArm(execution["krn"], krnTargets?.["after"]);
};

const hasPassedScore = (value: JsonRecord, execution: JsonRecord): boolean => {
  const attempt = nestedRecord(execution, "attempt");
  const score = value["score"];
  return isPairedRepairScore(score) &&
    score.outcome !== "invalid" &&
    isTrialAttempt(attempt) &&
    attempt.phases.at(-2)?.name === "checker_scored";
};

const isPassedTrialArtifact = (value: JsonRecord): boolean => {
  const execution = nestedRecord(value, "execution");
  return execution !== undefined &&
    hasPassedPacket(value) &&
    hasPassedObservedConditions(execution) &&
    hasPassedTreeIdentity(value) &&
    hasPassedArmExecution(execution) &&
    hasPassedScore(value, execution) &&
    execution["invalidReasons"] === undefined;
};

const isTrackedTrialStatus = (value: unknown): value is TrackedTrialStatus =>
  value === "passed" || value === "invalid" || value === "blocked" || value === "unverified";

const hasArtifactIdentity = (value: JsonRecord): boolean =>
  hasRequiredStrings(value, ["artifactHash", "manifestHash", "sourceTreeHash", "runId"]);

const hasArtifactPacket = (value: JsonRecord): boolean => {
  const packet = nestedRecord(value, "packet");
  return optionalValue(packet ?? {}, "checksum", isPresentString) &&
    isTrialPacketValidation(packet?.["validation"]);
};

const hasArtifactProof = (value: JsonRecord): boolean => {
  const proof = nestedRecord(value, "proof");
  return isStringArray(proof?.["proves"]) &&
    isStringArray(proof?.["doesNotProve"]);
};

const hasArtifactExecution = (value: JsonRecord): boolean =>
  optionalValue(value, "baselineTreeHash", isPresentString) &&
  optionalValue(value, "krnTreeHash", isPresentString) &&
  isTrialExecution(value["execution"]) &&
  optionalValue(value, "score", isPairedRepairScore);

const isTrackedTrialArtifactShape = (value: unknown): value is TrackedTrialArtifact => {
  if (!isRecord(value)) return false;
  return value["kind"] === "krn.pairedLiveCodexRepairArtifact.v1" &&
    isTrackedTrialStatus(value["status"]) &&
    hasArtifactIdentity(value) &&
    hasArtifactPacket(value) &&
    hasArtifactExecution(value) &&
    hasArtifactProof(value) &&
    (value["status"] !== "passed" || isPassedTrialArtifact(value));
};

const artifactHash = (artifact: object): string => sha256(serializedJson(artifact));

export const buildTrackedTrialArtifact = (
  artifact: Omit<TrackedTrialArtifact, "artifactHash">
): TrackedTrialArtifact => ({ ...artifact, artifactHash: artifactHash(artifact) });

export const verifyTrackedTrialArtifact = (value: unknown): value is TrackedTrialArtifact => {
  if (!isTrackedTrialArtifactShape(value)) return false;
  const { artifactHash: expectedArtifactHash, ...content } = value;
  return artifactHash(content) === expectedArtifactHash;
};

const phaseRecordMatchesArtifact = (
  value: unknown,
  artifact: TrackedTrialArtifact,
  name: TrialAttemptPhaseName,
  previousHash: string | undefined
): value is JsonRecord => {
  if (!isRecord(value) || value["kind"] !== "krn.pairedLiveCodexRepairAttemptPhase.v1") return false;
  return value["name"] === name &&
    value["runId"] === artifact.runId &&
    value["manifestHash"] === artifact.manifestHash &&
    value["sourceTreeHash"] === artifact.sourceTreeHash &&
    (previousHash === undefined
      ? !hasOwn(value, "previousHash")
      : value["previousHash"] === previousHash);
};

const sameJson = (left: unknown, right: unknown): boolean =>
  serializedJson(left) === serializedJson(right);

const isClaimedPhaseDetail = (detail: unknown, artifact: TrackedTrialArtifact): boolean =>
  isRecord(detail) && detail["directoryHash"] === artifact.execution.attempt?.directoryHash;

const isObservedConditionsPhaseDetail = (detail: unknown, artifact: TrackedTrialArtifact): boolean =>
  isRecord(detail) &&
  sameJson(detail["containment"], artifact.execution.conditions.observed?.containment) &&
  sameJson(detail["codex"], artifact.execution.conditions.observed?.codex) &&
  sameJson(detail["checkerRuntime"], artifact.execution.conditions.observed?.checkerRuntime);

const isMaterializedPhaseDetail = (detail: unknown, artifact: TrackedTrialArtifact): boolean =>
  isRecord(detail) &&
  detail["baselineTreeHash"] === artifact.baselineTreeHash &&
  detail["krnTreeHash"] === artifact.krnTreeHash;

const isArmPhaseDetail = (
  detail: unknown,
  result: CommandResult | undefined,
  states: TrialArmTargetStates | undefined
): boolean =>
  isRecord(detail) &&
  sameJson(detail["result"], result) &&
  sameJson(detail["before"], states?.before) &&
  sameJson(detail["after"], states?.after);

const isCheckerPhaseDetail = (detail: unknown, artifact: TrackedTrialArtifact): boolean =>
  isRecord(detail) &&
  detail["outcome"] === artifact.score?.outcome &&
  detail["reason"] === artifact.score?.reason;

const isFinalizedPhaseDetail = (detail: unknown, artifact: TrackedTrialArtifact): boolean =>
  isRecord(detail) &&
  detail["status"] === artifact.status &&
  sameJson(detail["invalidReasons"], artifact.execution.invalidReasons);

const phaseDetailChecks: Readonly<Record<
  TrialAttemptPhaseName,
  (detail: unknown, artifact: TrackedTrialArtifact) => boolean
>> = {
  claimed: isClaimedPhaseDetail,
  conditions_observed: isObservedConditionsPhaseDetail,
  materialized: isMaterializedPhaseDetail,
  baseline_executed: (detail, artifact) =>
    isArmPhaseDetail(detail, artifact.execution.baseline, artifact.execution.targets?.baseline),
  krn_executed: (detail, artifact) =>
    isArmPhaseDetail(detail, artifact.execution.krn, artifact.execution.targets?.krn),
  checker_scored: isCheckerPhaseDetail,
  finalized: isFinalizedPhaseDetail
};

const phaseDetailMatchesArtifact = (
  name: TrialAttemptPhaseName,
  detail: unknown,
  artifact: TrackedTrialArtifact
): boolean => phaseDetailChecks[name](detail, artifact);

export const readTrackedTrialArtifact = async (
  directory: string
): Promise<TrackedTrialArtifact | undefined> => {
  try {
    const parsed: unknown = JSON.parse(await readFile(join(directory, "artifact.json"), "utf8"));
    if (!verifyTrackedTrialArtifact(parsed)) return undefined;
    const attempt = parsed.execution.attempt;
    if (attempt === undefined || attempt.directoryHash !== sha256(resolve(directory))) return undefined;
    if (!isValidTrialAttemptPhaseSequence(attempt.phases.map((phase) => phase.name))) return undefined;

    for (const [index, phase] of attempt.phases.entries()) {
      const recorded = await readFile(join(directory, phaseFileName(index, phase.name)), "utf8");
      if (sha256(recorded) !== phase.hash) return undefined;
      const record: unknown = JSON.parse(recorded);
      const previousHash = index === 0 ? undefined : attempt.phases[index - 1]?.hash;
      if (!phaseRecordMatchesArtifact(record, parsed, phase.name, previousHash)) return undefined;
      if (!phaseDetailMatchesArtifact(phase.name, record["detail"], parsed)) return undefined;
    }

    return parsed;
  } catch {
    return undefined;
  }
};

type TrialExecutionDetails = Omit<
  TrackedTrialArtifact["execution"],
  "conditions" | "attempt" | "invalidReasons"
>;

type TrialContext = {
  readonly manifest: PairedTrialManifest;
  readonly manifestHash: string;
  readonly sourceTreeHash: string;
  readonly packetValidation: TrialPacketValidation;
  readonly conditions: TrialConditions;
};

type TrialArtifactInput = {
  readonly status: TrackedTrialStatus;
  readonly invalidReasons?: readonly string[];
  readonly conditions?: TrialConditions;
  readonly baselineTreeHash?: string;
  readonly krnTreeHash?: string;
  readonly execution?: TrialExecutionDetails;
  readonly score?: PairedRepairScore;
  readonly attempt?: TrialAttempt;
};

const optionalField = <Name extends string, Value>(
  name: Name,
  value: Value | undefined
): { readonly [Key in Name]?: Value } => value === undefined
  ? {}
  : { [name]: value } as { readonly [Key in Name]: Value };

const trialProof = (status: TrackedTrialStatus): TrackedTrialArtifact["proof"] => status === "passed"
  ? {
      proves: [
        "both arms were materialized from one source tree",
        "observed executable, profile, environment, and arm results were bound into one artifact",
        "failed, timed-out, and replayed attempts were rejected before checker scoring",
        "held-out checker produced a mechanical outcome"
      ],
      doesNotProve: [
        "a live Codex repair",
        "a model-internal token ceiling",
        "effective containment or credential isolation",
        "tamper resistance against a writer that can replace every artifact and phase hash",
        "arbitrary-repository portability",
        "broad model obedience",
        "source truth",
        "product readiness"
      ]
    }
  : {
      proves: ["the tracked runner refused to claim a valid live outcome after an unmet or invalid prerequisite"],
      doesNotProve: [
        "a live Codex repair",
        "a model-internal token ceiling",
        "effective containment or credential isolation",
        "tamper resistance against a writer that can replace every artifact and phase hash",
        "arbitrary-repository portability",
        "broad model obedience",
        "source truth",
        "product readiness"
      ]
    };

const trialExecution = (
  context: TrialContext,
  input: TrialArtifactInput
): TrackedTrialArtifact["execution"] => ({
  conditions: input.conditions ?? context.conditions,
  ...optionalField(
    "invalidReasons",
    input.invalidReasons === undefined || input.invalidReasons.length === 0
      ? undefined
      : [...input.invalidReasons]
  ),
  ...(input.execution ?? {}),
  ...optionalField("attempt", input.attempt)
});

const buildTrialArtifact = (
  context: TrialContext,
  input: TrialArtifactInput
): TrackedTrialArtifact => buildTrackedTrialArtifact({
  kind: "krn.pairedLiveCodexRepairArtifact.v1",
  status: input.status,
  manifestHash: context.manifestHash,
  sourceTreeHash: context.sourceTreeHash,
  ...optionalField("baselineTreeHash", input.baselineTreeHash),
  ...optionalField("krnTreeHash", input.krnTreeHash),
  runId: context.manifest.runId,
  packet: {
    ...optionalField("checksum", context.packetValidation.checksum),
    validation: context.packetValidation
  },
  execution: trialExecution(context, input),
  ...optionalField("score", input.score),
  proof: trialProof(input.status)
});

const blockedTrialArtifact = (
  context: TrialContext,
  status: TrackedTrialStatus,
  reason: string,
  conditions?: TrialConditions
): TrackedTrialArtifact => buildTrialArtifact(context, {
  status,
  invalidReasons: [reason],
  ...optionalField("conditions", conditions)
});

const initialTrialFailure = (input: {
  readonly packetFetchFailure?: string;
}, context: TrialContext): TrialArtifactInput | undefined => {
  if (input.packetFetchFailure !== undefined) {
    return { status: "unverified", invalidReasons: [input.packetFetchFailure] };
  }
  if (!context.packetValidation.valid) {
    return { status: "invalid", invalidReasons: ["packet validation failed closed"] };
  }
  const configurationReasons = manifestConditionReasons(context.manifest);
  if (configurationReasons.length > 0) {
    return { status: "invalid", invalidReasons: configurationReasons };
  }
  return undefined;
};

const packetFetchFailureInput = (
  failure: string | undefined
): { readonly packetFetchFailure?: string } =>
  failure === undefined ? {} : { packetFetchFailure: failure };

const buildTrialContext = (
  manifest: PairedTrialManifest,
  sourceTreeHash: string,
  packet: unknown
): TrialContext => ({
  manifest,
  manifestHash: sha256(serializedJson(manifest)),
  sourceTreeHash,
  packetValidation: validateTrialPacket(packet, manifest),
  conditions: trialConditions(manifest)
});

const matchesTrialIdentity = (
  artifact: TrackedTrialArtifact,
  context: Pick<TrialContext, "manifestHash" | "sourceTreeHash" | "manifest">
): boolean =>
  artifact.runId === context.manifest.runId &&
  artifact.manifestHash === context.manifestHash &&
  artifact.sourceTreeHash === context.sourceTreeHash;

type TrialPreparation =
  | {
      readonly kind: "ready";
      readonly conditions: TrialConditions;
      readonly journal: TrialJournal;
      readonly containmentExecutable: string;
      readonly codexExecutable: string;
    }
  | {
      readonly kind: "rejected";
      readonly status: TrackedTrialStatus;
      readonly reason: string;
      readonly conditions: TrialConditions;
    };

const unavailableTool = (observation: TrialToolObservation): boolean =>
  observation.executable === undefined || observation.version.exitCode !== 0;

const versionMismatch = (observation: TrialToolObservation, expected: string): boolean =>
  observation.version.stdout.trim() !== expected;

const trialPrerequisiteFailure = (input: {
  readonly containment: TrialToolObservation;
  readonly codex: TrialToolObservation;
  readonly manifest: PairedTrialManifest;
  readonly runtimePermissionFlag: HeldOutRuntimePermissionFlag | undefined;
}): { readonly status: TrackedTrialStatus; readonly reason: string } | undefined => [
  unavailableTool(input.containment)
    ? { status: "blocked" as const, reason: "explicit containment command is unavailable" }
    : undefined,
  unavailableTool(input.codex)
    ? { status: "blocked" as const, reason: "pinned Codex CLI is unavailable" }
    : undefined,
  input.runtimePermissionFlag === undefined
    ? { status: "blocked" as const, reason: "held-out checker runtime does not support Node filesystem permissions" }
    : undefined,
  versionMismatch(input.containment, input.manifest.containment.version)
    ? { status: "invalid" as const, reason: "observed containment version does not match the manifest" }
    : undefined,
  versionMismatch(input.codex, input.manifest.codex.cliVersion)
    ? { status: "invalid" as const, reason: "observed Codex CLI version does not match the manifest" }
    : undefined
].find((candidate) => candidate !== undefined);

const hasChatGptAuthentication = (result: CommandResult): boolean =>
  result.exitCode === 0 &&
  `${result.stdout}\n${result.stderr}`.includes("Logged in using ChatGPT");

const prepareTrackedTrial = async (input: {
  readonly context: TrialContext;
  readonly sourceRoot: string;
  readonly trialRoot: string;
  readonly sandboxRoot: string;
  readonly journal: TrialJournal;
}): Promise<TrialPreparation> => {
  const probeEnvironment = allowlistedEnvironment(input.sandboxRoot, input.trialRoot);
  const [containment, codex, authentication] = await Promise.all([
    observeTool({
      command: input.context.manifest.containment.command,
      cwd: input.sourceRoot,
      environment: probeEnvironment
    }),
    observeTool({
      command: input.context.manifest.codex.command,
      cwd: input.sourceRoot,
      environment: probeEnvironment
    }),
    runProcess(input.context.manifest.codex.command, ["login", "status"], {
      cwd: input.sourceRoot,
      env: probeEnvironment,
      timeoutMs: 10_000
    })
  ]);
  const runtimePermissionFlag = selectHeldOutRuntimePermissionFlag();
  const checkerRuntime = {
    nodeVersion: process.version,
    permissionFlag: runtimePermissionFlag ?? "unsupported"
  } as const;
  let conditions: TrialConditions = {
    ...input.context.conditions,
    observed: {
      containment,
      codex,
      authentication,
      environmentVariableNames: Object.keys(probeEnvironment).sort(),
      credentialProvided: hasChatGptAuthentication(authentication),
      checkerRuntime
    }
  };
  const prerequisite = trialPrerequisiteFailure({
    containment,
    codex,
    manifest: input.context.manifest,
    runtimePermissionFlag
  });
  await input.journal.phase("conditions_observed", {
    containment,
    codex,
    authentication: authentication.exitCode === 0 ? "chatgpt" : "unavailable",
    checkerRuntime,
    prerequisite: prerequisite?.reason
  });
  if (!hasChatGptAuthentication(authentication)) {
    return { kind: "rejected", status: "blocked", reason: "host Codex ChatGPT authentication is unavailable", conditions };
  }
  if (prerequisite !== undefined) return { kind: "rejected", ...prerequisite, conditions };

  const profilePath = join(input.sandboxRoot, `${input.context.manifest.codex.profile.name}.config.toml`);
  await writeFile(profilePath, input.context.manifest.codex.profile.config, { encoding: "utf8", flag: "wx" });
  const observedProfileHash = sha256(await readFile(profilePath, "utf8"));
  conditions = {
    ...conditions,
    observed: { ...conditions.observed, profileHash: observedProfileHash }
  };
  if (observedProfileHash !== input.context.manifest.codex.profile.hash) {
    return { kind: "rejected", status: "invalid", reason: "materialized Codex profile does not match the manifest", conditions };
  }
  return {
    kind: "ready",
    conditions,
    journal: input.journal,
    containmentExecutable: containment.executable!,
    codexExecutable: codex.executable!
  };
};

const finalizeTrackedTrial = async (input: {
  readonly context: TrialContext;
  readonly journal: TrialJournal;
  readonly artifact: TrialArtifactInput;
}): Promise<TrackedTrialArtifact> => {
  await input.journal.phase("finalized", {
    status: input.artifact.status,
    ...optionalField("invalidReasons", input.artifact.invalidReasons)
  });
  const artifact = buildTrialArtifact(input.context, {
    ...input.artifact,
    attempt: input.journal.attempt()
  });
  await input.journal.writeArtifact(artifact);
  return artifact;
};

type ComparableTrial = {
  readonly context: TrialContext;
  readonly baseline: MaterializedTrialTarget;
  readonly krn: MaterializedTrialTarget;
  readonly baselineArmEnvironment: NodeJS.ProcessEnv;
  readonly krnArmEnvironment: NodeJS.ProcessEnv;
  readonly baselineObservationEnvironment: NodeJS.ProcessEnv;
  readonly krnObservationEnvironment: NodeJS.ProcessEnv;
  readonly environmentHash: string;
  readonly baselineBefore: TrialTargetState;
  readonly krnBefore: TrialTargetState;
};

type ComparableTrialPreparation =
  | { readonly kind: "ready"; readonly trial: ComparableTrial }
  | { readonly kind: "invalid"; readonly context: TrialContext; readonly artifact: TrialArtifactInput };

const prepareComparableTrial = async (input: {
  readonly context: TrialContext;
  readonly sourceRoot: string;
  readonly trialRoot: string;
  readonly sandboxRoot: string;
  readonly journal: TrialJournal;
}): Promise<ComparableTrialPreparation> => {
  let context = input.context;
  const materializationEnvironment = allowlistedEnvironment(input.sandboxRoot, input.trialRoot);
  const baseline = await materializeTarget(input.sourceRoot, join(input.trialRoot, "baseline"), materializationEnvironment);
  const krn = await materializeTarget(input.sourceRoot, join(input.trialRoot, "krn"), materializationEnvironment);
  await input.journal.phase("materialized", { baselineTreeHash: baseline.treeHash, krnTreeHash: krn.treeHash });
  if (baseline.treeHash !== krn.treeHash) {
    return {
      kind: "invalid",
      context,
      artifact: {
        status: "invalid",
        invalidReasons: ["materialized target trees are not byte-identical"],
        baselineTreeHash: baseline.treeHash,
        krnTreeHash: krn.treeHash
      }
    };
  }

  const baselineArmEnvironment = allowlistedEnvironment(input.sandboxRoot, baseline.root);
  const krnArmEnvironment = allowlistedEnvironment(input.sandboxRoot, krn.root);
  const baselineObservationEnvironment = allowlistedEnvironment(input.sandboxRoot, baseline.root);
  const krnObservationEnvironment = allowlistedEnvironment(input.sandboxRoot, krn.root);
  const environmentHash = environmentProfileHash(baselineArmEnvironment, input.sandboxRoot, baseline.root);
  context = {
    ...context,
    conditions: {
      ...context.conditions,
      observed: {
        ...context.conditions.observed,
        environmentProfileHash: environmentHash,
        environmentVariableNames: Object.keys(baselineArmEnvironment).sort(),
        credentialProvided: context.conditions.observed?.credentialProvided === true
      }
    }
  };
  if (environmentHash !== environmentProfileHash(krnArmEnvironment, input.sandboxRoot, krn.root)) {
    return {
      kind: "invalid",
      context,
      artifact: {
        status: "invalid",
        invalidReasons: ["arm environments are not identical"],
        baselineTreeHash: baseline.treeHash,
        krnTreeHash: krn.treeHash
      }
    };
  }

  const [baselineBefore, krnBefore] = await Promise.all([
    captureTargetState({ targetRoot: baseline.root, initialCommit: baseline.commit, environment: baselineObservationEnvironment }),
    captureTargetState({ targetRoot: krn.root, initialCommit: krn.commit, environment: krnObservationEnvironment })
  ]);
  const preflightReasons = [
    targetStateIsClean(baselineBefore) ? undefined : "baseline target was not clean before execution",
    targetStateIsClean(krnBefore) ? undefined : "KRN target was not clean before execution"
  ].filter((reason): reason is string => reason !== undefined);
  if (preflightReasons.length > 0) {
    return {
      kind: "invalid",
      context,
      artifact: {
        status: "invalid",
        invalidReasons: preflightReasons,
        baselineTreeHash: baseline.treeHash,
        krnTreeHash: krn.treeHash,
        execution: {
          environmentProfileHash: environmentHash,
          targets: { baseline: { before: baselineBefore }, krn: { before: krnBefore } }
        }
      }
    };
  }
  return {
    kind: "ready",
    trial: {
      context,
      baseline,
      krn,
      baselineArmEnvironment,
      krnArmEnvironment,
      baselineObservationEnvironment,
      krnObservationEnvironment,
      environmentHash,
      baselineBefore,
      krnBefore
    }
  };
};

const executeComparableTrial = async (input: {
  readonly trial: ComparableTrial;
  readonly packet: unknown;
  readonly checkerRoot: string;
  readonly sandboxRoot: string;
  readonly journal: TrialJournal;
  readonly containmentExecutable: string;
  readonly codexExecutable: string;
  readonly recordDecisionApplications: PairedDecisionApplicationRecorder | undefined;
}, checker: PairedTrialChecker): Promise<TrialArtifactInput> => {
  const runArm = async (
    target: MaterializedTrialTarget,
    prompt: string,
    environment: NodeJS.ProcessEnv
  ): Promise<CommandResult> => {
    const args = input.trial.context.manifest.codex.args.map((argument) =>
      replaceArgument(argument, { "{prompt}": prompt, "{targetRoot}": target.root })
    );
    return runProcess(input.containmentExecutable, [
      "--die-with-parent", "--ro-bind", "/", "/", "--proc", "/proc", "--dev", "/dev",
      "--tmpfs", "/tmp", "--dir", "/tmp/.git",
      "--bind", target.root, target.root,
      "--bind", input.sandboxRoot, input.sandboxRoot, "--", input.codexExecutable, ...args
    ], {
      cwd: target.root,
      env: environment,
      timeoutMs: input.trial.context.manifest.codex.budget.timeoutMs
    });
  };
  const prompts = buildPairedRepairPrompts({ task: input.trial.context.manifest.task, decisionPacket: input.packet });
  const baselineResult = await runArm(input.trial.baseline, prompts.baseline, input.trial.baselineArmEnvironment);
  const baselineAfter = await captureTargetState({
    targetRoot: input.trial.baseline.root,
    initialCommit: input.trial.baseline.commit,
    environment: input.trial.baselineObservationEnvironment
  });
  await input.journal.phase("baseline_executed", { result: baselineResult, before: input.trial.baselineBefore, after: baselineAfter });
  const krnResult = await runArm(input.trial.krn, prompts.krn, input.trial.krnArmEnvironment);
  const krnAfter = await captureTargetState({
    targetRoot: input.trial.krn.root,
    initialCommit: input.trial.krn.commit,
    environment: input.trial.krnObservationEnvironment
  });
  await input.journal.phase("krn_executed", { result: krnResult, before: input.trial.krnBefore, after: krnAfter });
  const execution = {
    environmentProfileHash: input.trial.environmentHash,
    promptDelta: prompts.delta,
    baseline: baselineResult,
    krn: krnResult,
    targets: {
      baseline: { before: input.trial.baselineBefore, after: baselineAfter },
      krn: { before: input.trial.krnBefore, after: krnAfter }
    }
  };
  const armReasons = [
    armFailureReason("baseline", baselineResult),
    armFailureReason("krn", krnResult),
    targetStateReason("baseline", "after", baselineAfter),
    targetStateReason("krn", "after", krnAfter)
  ].filter((reason): reason is string => reason !== undefined);
  if (armReasons.length > 0) {
    return {
      status: "invalid",
      invalidReasons: armReasons,
      baselineTreeHash: input.trial.baseline.treeHash,
      krnTreeHash: input.trial.krn.treeHash,
      execution
    };
  }
  const score = await checker({
    baseline: { targetRoot: input.trial.baseline.root, checkerRoot: input.checkerRoot, initialCommit: input.trial.baseline.commit },
    krn: { targetRoot: input.trial.krn.root, checkerRoot: input.checkerRoot, initialCommit: input.trial.krn.commit }
  });
  await input.journal.phase("checker_scored", { outcome: score.outcome, reason: score.reason });
  if (input.recordDecisionApplications !== undefined && score.outcome !== "invalid") {
    try {
      await input.recordDecisionApplications({
        runId: input.trial.context.manifest.runId,
        packet: input.packet,
        score,
        rules: input.trial.context.manifest.decisionApplications,
        krnTarget: {
          targetRoot: input.trial.krn.root,
          checkerRoot: input.checkerRoot,
          initialCommit: input.trial.krn.commit
        }
      });
    } catch {
      return {
        status: "unverified",
        invalidReasons: ["decision application persistence could not be verified"],
        baselineTreeHash: input.trial.baseline.treeHash,
        krnTreeHash: input.trial.krn.treeHash,
        execution,
        score
      };
    }
  }
  return {
    status: score.outcome === "invalid" ? "invalid" : "passed",
    ...optionalField("invalidReasons", score.outcome === "invalid" ? ["held-out checker invalidated the pair"] : undefined),
    baselineTreeHash: input.trial.baseline.treeHash,
    krnTreeHash: input.trial.krn.treeHash,
    execution,
    score
  };
};

const runClaimedTrackedTrial = async (input: {
  readonly context: TrialContext;
  readonly sourceRoot: string;
  readonly checkerRoot: string;
  readonly packet: unknown;
  readonly trialRoot: string;
  readonly sandboxRoot: string;
  readonly conditions: TrialConditions;
  readonly journal: TrialJournal;
  readonly containmentExecutable: string;
  readonly codexExecutable: string;
  readonly recordDecisionApplications: PairedDecisionApplicationRecorder | undefined;
}, checker: PairedTrialChecker): Promise<TrackedTrialArtifact> => {
  const context = { ...input.context, conditions: input.conditions };
  const preparation = await prepareComparableTrial({
    context,
    sourceRoot: input.sourceRoot,
    trialRoot: input.trialRoot,
    sandboxRoot: input.sandboxRoot,
    journal: input.journal
  });
  if (preparation.kind === "invalid") {
    return finalizeTrackedTrial({ context: preparation.context, journal: input.journal, artifact: preparation.artifact });
  }
  const artifact = await executeComparableTrial({
    trial: preparation.trial,
    packet: input.packet,
    checkerRoot: input.checkerRoot,
    sandboxRoot: input.sandboxRoot,
    journal: input.journal,
    containmentExecutable: input.containmentExecutable,
    codexExecutable: input.codexExecutable,
    recordDecisionApplications: input.recordDecisionApplications
  }, checker);
  return finalizeTrackedTrial({ context: preparation.trial.context, journal: input.journal, artifact });
};

type TrackedPairedTrialInput = {
  readonly manifest: PairedTrialManifest;
  readonly sourceRoot: string;
  readonly checkerRoot: string;
  readonly packet?: unknown;
  readonly packetFetchFailure?: string;
  readonly fetchPacket?: () => Promise<{ readonly packet?: unknown; readonly failure?: string }>;
  readonly attemptDirectory?: string;
  readonly recordDecisionApplications?: PairedDecisionApplicationRecorder;
};

const resolveTrialPacket = async (
  input: Pick<TrackedPairedTrialInput, "packet" | "packetFetchFailure" | "fetchPacket">
): Promise<{ readonly packet?: unknown; readonly failure?: string }> => {
  if (input.fetchPacket === undefined) {
    return {
      ...(input.packet === undefined ? {} : { packet: input.packet }),
      ...(input.packetFetchFailure === undefined ? {} : { failure: input.packetFetchFailure })
    };
  }
  try {
    return await input.fetchPacket();
  } catch {
    return { failure: "MCP DecisionPacket fetch could not complete" };
  }
};

export const runTrackedPairedTrial = async (
  input: TrackedPairedTrialInput,
  checker: PairedTrialChecker = runPairedRepairChecker
): Promise<TrackedTrialArtifact> => {
  const sourceTreeHash = await hashTree(input.sourceRoot);
  const provisionalContext = buildTrialContext(input.manifest, sourceTreeHash, undefined);
  const attemptDirectory = input.attemptDirectory?.trim();
  if (attemptDirectory === undefined || attemptDirectory.length === 0) {
    const directContext = buildTrialContext(input.manifest, sourceTreeHash, input.packet);
    const initialFailure = initialTrialFailure(input, directContext);
    return initialFailure === undefined
      ? blockedTrialArtifact(directContext, "blocked", "an empty immutable attempt directory is required before live execution")
      : buildTrialArtifact(directContext, initialFailure);
  }
  const journalResult = await createTrialJournal({
    directory: attemptDirectory,
    runId: provisionalContext.manifest.runId,
    manifestHash: provisionalContext.manifestHash,
    sourceTreeHash: provisionalContext.sourceTreeHash
  });
  if (journalResult.kind !== "claimed") {
    if (journalResult.kind === "replayed") {
      const priorArtifact = await readTrackedTrialArtifact(attemptDirectory);
      if (priorArtifact !== undefined && matchesTrialIdentity(priorArtifact, provisionalContext)) return priorArtifact;
      return blockedTrialArtifact(
        provisionalContext,
        "unverified",
        "trial attempt was already claimed without a matching verifiable artifact"
      );
    }
    return blockedTrialArtifact(provisionalContext, "blocked", journalResult.reason);
  }
  const packetResult = await resolveTrialPacket(input);
  const context = buildTrialContext(input.manifest, sourceTreeHash, packetResult.packet);
  const initialFailure = initialTrialFailure(packetFetchFailureInput(packetResult.failure), context);
  if (initialFailure !== undefined) {
    return finalizeTrackedTrial({ context, journal: journalResult.journal, artifact: initialFailure });
  }
  const trialRoot = await mkdtemp(join(tmpdir(), "krn-tracked-paired-trial-"));
  const sandboxRoot = await mkdtemp(join(trialRoot, "sandbox-"));
  try {
    const authenticationFailure = await materializeChatGptAuth(sandboxRoot);
    if (authenticationFailure !== undefined) {
      return finalizeTrackedTrial({
        context,
        journal: journalResult.journal,
        artifact: {
          status: "blocked",
          invalidReasons: [authenticationFailure]
        }
      });
    }
    const preparation = await prepareTrackedTrial({
      context,
      sourceRoot: input.sourceRoot,
      trialRoot,
      sandboxRoot,
      journal: journalResult.journal
    });
    if (preparation.kind === "rejected") {
      return finalizeTrackedTrial({
        context,
        journal: journalResult.journal,
        artifact: {
          status: preparation.status,
          invalidReasons: [preparation.reason],
          conditions: preparation.conditions
        }
      });
    }
    return await runClaimedTrackedTrial({
      context,
      sourceRoot: input.sourceRoot,
      checkerRoot: input.checkerRoot,
      packet: packetResult.packet,
      trialRoot,
      sandboxRoot,
      ...preparation,
      recordDecisionApplications: input.recordDecisionApplications
    }, checker);
  } catch {
    return finalizeTrackedTrial({
      context,
      journal: journalResult.journal,
      artifact: {
        status: "unverified",
        invalidReasons: ["tracked trial could not complete with a verifiable artifact"]
      }
    });
  } finally {
    await rm(trialRoot, { recursive: true, force: true });
  }
};

const loadTrackedTrialManifest = async (path: string): Promise<PairedTrialManifest> => {
  const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
  return parseTrackedTrialManifest(parsed);
};

const trustedRepositoryRoot = (): string =>
  resolve(fileURLToPath(new URL("../../../../../", import.meta.url)));

const isWithinTrustedRoot = (root: string, candidate: string): boolean => {
  const pathFromRoot = relative(root, candidate);
  return pathFromRoot.length > 0 &&
    pathFromRoot !== ".." &&
    !pathFromRoot.startsWith(`..${sep}`) &&
    !isAbsolute(pathFromRoot);
};

const resolveTrustedRepositoryPath = async (path: string, label: string): Promise<string> => {
  const root = trustedRepositoryRoot();
  const candidate = resolve(root, path);
  if (!isWithinTrustedRoot(root, candidate)) {
    throw new Error(`${label} must stay within the trusted repository root`);
  }
  const [resolvedRoot, resolvedCandidate] = await Promise.all([realpath(root), realpath(candidate)]);
  if (!isWithinTrustedRoot(resolvedRoot, resolvedCandidate)) {
    throw new Error(`${label} must stay within the trusted repository root`);
  }
  return resolvedCandidate;
};

const resolveTrustedRelativeRepositoryPath = async (path: string, label: string): Promise<string> => {
  if (isAbsolute(path)) throw new Error(`${label} must be relative to the trusted repository root`);
  return resolveTrustedRepositoryPath(path, label);
};

const readMcpStructuredContent = (stdout: string, requestId: number): unknown => {
  for (const line of stdout.split("\n").reverse()) {
    if (line.trim().length === 0) continue;
    try {
      const message: unknown = JSON.parse(line);
      if (!isRecord(message) || message["id"] !== requestId || !isRecord(message["result"])) continue;
      const result = message["result"];
      if (isRecord(result) && result["structuredContent"] !== undefined) return result["structuredContent"];
    } catch {
      continue;
    }
  }
  return undefined;
};

const fetchDecisionPacketViaMcp = async (
  checkerRoot: string,
  runId: string
): Promise<{ readonly packet?: unknown; readonly failure?: string }> => {
  const serverPath = fileURLToPath(new URL("../mcp/decision-packet-mcp-server.ts", import.meta.url));
  const result = await runProcess("pnpm", ["--filter", "@krn/cli", "exec", "tsx", serverPath], {
    cwd: checkerRoot,
    env: {
      PATH: process.env.PATH,
      ...(process.env.KRN_DATABASE_URL === undefined ? {} : { KRN_DATABASE_URL: process.env.KRN_DATABASE_URL })
    },
    timeoutMs: 30_000,
    input: [
      JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "krn-tracked-paired-trial", version: "1" } } }),
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
      JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "krn_decision_packet", arguments: { runId } } })
    ].join("\n") + "\n"
  });
  const packet = readMcpStructuredContent(result.stdout, 2);
  if (result.exitCode !== 0 || packet === undefined) {
    return { failure: `MCP DecisionPacket fetch was unavailable: ${result.stderr.trim() || "no structured packet response"}` };
  }
  return { packet };
};

export const runTrackedTrialCommand = async (
  manifestPath: string,
  attemptDirectory?: string
): Promise<TrackedTrialArtifact> => {
  const trustedManifestPath = await resolveTrustedRepositoryPath(manifestPath, "trial manifest path");
  const manifest = await loadTrackedTrialManifest(trustedManifestPath);
  const checkerRoot = trustedRepositoryRoot();
  const sourceRoot = await resolveTrustedRelativeRepositoryPath(manifest.sourcePath, "trial source path");
  if (attemptDirectory === undefined) {
    const packetResult = await fetchDecisionPacketViaMcp(checkerRoot, manifest.runId);
    return runTrackedPairedTrial({
      manifest,
      sourceRoot,
      checkerRoot,
      ...(packetResult.packet === undefined ? {} : { packet: packetResult.packet }),
      ...(packetResult.failure === undefined ? {} : { packetFetchFailure: packetResult.failure })
    });
  }
  return runTrackedPairedTrial({
    manifest,
    sourceRoot,
    checkerRoot,
    fetchPacket: () => fetchDecisionPacketViaMcp(checkerRoot, manifest.runId),
    attemptDirectory,
    recordDecisionApplications: (input) => recordPairedDecisionApplications({
      ...input,
      databaseUrl: process.env.KRN_DATABASE_URL ?? "postgres://krn:krn@localhost:54329/krn"
    })
  });
};
