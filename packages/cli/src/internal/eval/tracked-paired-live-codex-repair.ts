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
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep
} from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildPairedRepairPrompts,
  liveCodexObedienceMarker,
  pairedLiveCheckerRevision,
  runCommand,
  runPairedRepairChecker,
  resolvePairedEvalFamily,
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
import {
  capabilityProfileHash,
  capabilityProfileName,
  capabilityUseFalsifierReasons,
  codexCapabilityConfigArgs,
  codexCapabilityProfileConfig,
  hasPacketTransportCapability,
  observeCodexCapabilityUse,
  type CodexCapabilityUseObservation
} from "./tracked-paired-trial-capabilities.js";
import {
  isPairedMemoryTreatment,
  isTrackedTrialCapabilities,
  isTrackedTrialChecker,
  isTrackedTrialContainment,
  parseTrackedTrialManifest,
  type PairedMemoryTreatment,
  type PairedTrialManifest
} from "./tracked-paired-trial-manifest.js";
import {
  isModelUsageObservation,
  observeModelUsage,
  unavailableModelUsageObservation,
  type ModelUsageObservation
} from "./tracked-paired-trial-model-usage.js";

export {
  parseTrackedTrialManifest,
  type PairedDecisionApplicationRule,
  type PairedMemoryTreatment,
  type PairedTrialManifest
} from "./tracked-paired-trial-manifest.js";
export {
  capabilityUseFalsifierReasons,
  codexCapabilityConfigArgs,
  observeCodexCapabilityUse,
  type CodexCapabilityUseObservation
} from "./tracked-paired-trial-capabilities.js";

type JsonRecord = Record<string, unknown>;
type TrialCapabilityProfile = NonNullable<PairedTrialManifest["capabilities"]>["krn"];

export type TrackedTrialStatus = "passed" | "invalid" | "blocked" | "unverified";
export type DecisionApplicationObservation =
  | "not_attempted"
  | "none_observed"
  | "observed"
  | "persistence_failed";

export type { ModelUsageObservation } from "./tracked-paired-trial-model-usage.js";


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
    readonly capabilities?: PairedTrialManifest["capabilities"];
  };
  readonly observed?: {
    readonly containment?: TrialToolObservation;
    readonly codex?: TrialToolObservation;
    readonly authentication?: CommandResult;
    readonly profileHash?: string;
    readonly capabilityProfileHashes?: {
      readonly baseline: string;
      readonly krn: string;
    };
    readonly environmentProfileHash?: string;
    readonly environmentVariableNames?: readonly string[];
    readonly credentialProvided?: boolean;
    readonly environmentAvailability?: {
      readonly databaseConfigured: boolean;
      readonly codexHomeConfigured: boolean;
    };
    readonly sourceCommands?: {
      readonly test: boolean;
      readonly typecheck: boolean;
      readonly css: boolean;
    };
    readonly checkerRuntime?: {
      readonly nodeVersion: string;
      readonly permissionFlag: HeldOutRuntimePermissionFlag | "unsupported";
    };
  };
};

export type TrackedTrialArtifact = {
  readonly kind:
    | "krn.pairedLiveCodexRepairArtifact.v1"
    | "krn.pairedLiveCodexRepairArtifact.v2";
  readonly status: TrackedTrialStatus;
  readonly artifactHash: string;
  readonly manifestHash: string;
  readonly sourceTreeHash: string;
  readonly checkerRevision?: string;
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
    readonly liveOutput?: LiveCodexObedienceOutput;
    readonly liveObedienceStatus?: LiveCodexObedienceStatus;
    readonly liveOutputValidation?: LiveCodexObedienceValidation;
    readonly decisionApplicationObservation?: DecisionApplicationObservation;
    readonly capabilityUseObservation?: {
      readonly baseline: CodexCapabilityUseObservation;
      readonly krn: CodexCapabilityUseObservation;
    };
    readonly modelUsageObservation?: ModelUsageObservation;
    readonly packetContextMode?: "full" | "task-only";
    readonly treatment?: PairedMemoryTreatment;
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

const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (isRecord(value)) {
    const entries = Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  return serializedJson(value);
};

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

const isManifestPermissions = (value: unknown): boolean =>
  isRecord(value) &&
  value["sandbox"] === "workspace-write" &&
  value["approval"] === "never";


export type LiveCodexObedienceOutput = {
  readonly decisionId: string | readonly string[];
  readonly rejectedPath: string;
  readonly staleBoundary: string;
  readonly nonProof: string;
  readonly action: string;
};

export type LiveCodexObedienceStatus =
  | "valid"
  | "missing"
  | "malformed"
  | "packet_mismatch";

export type LiveCodexObedienceCapture = {
  readonly status: LiveCodexObedienceStatus;
  readonly output?: LiveCodexObedienceOutput;
};

/** Parse the bounded JSON contract emitted by a live Codex obedience pilot. */
const parseLiveCodexObedienceOutput = (value: unknown): LiveCodexObedienceOutput => {
  const root = isRecord(value) ? value : undefined;
  const fields = ["decisionId", "rejectedPath", "staleBoundary", "nonProof", "action"] as const;
  if (!root) throw new Error("Invalid live Codex obedience output: required boundary fields are missing");
  const values = fields.map((field) => root[field]);
  const decisionIds = root.decisionId;
  const validDecisionIds = typeof decisionIds === "string"
    ? decisionIds.length > 0
    : Array.isArray(decisionIds) && decisionIds.length > 0 && decisionIds.every(
      (id) => typeof id === "string" && id.length > 0
    );
  if (!validDecisionIds || values.slice(1).some((field) => typeof field !== "string" || field.length === 0)) {
    throw new Error("Invalid live Codex obedience output: required boundary fields are missing");
  }
  return Object.fromEntries(fields.map((field) => [field, root[field]])) as LiveCodexObedienceOutput;
};

export type LiveCodexObedienceValidation = {
  readonly valid: boolean;
  readonly reasons: readonly string[];
};

const outputDecisionIds = (output: LiveCodexObedienceOutput): readonly string[] =>
  typeof output.decisionId === "string" ? [output.decisionId] : output.decisionId;

const packetStringArray = (body: JsonRecord | undefined, key: string): readonly string[] | undefined => {
  const value = body?.[key];
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : undefined;
};

const decisionValidationReasons = (
  output: LiveCodexObedienceOutput,
  governing: readonly string[] | undefined
): readonly string[] => {
  if (governing === undefined) return ["packet governing decision ids are unavailable"];
  return outputDecisionIds(output).some((id) => !governing.includes(id))
    ? ["live output names a decision outside the packet governing authority"]
    : [];
};

const explicitlyNamesNoRejectedPath = (value: string): boolean =>
  /\b(?:no|none)\b(?:\s+[\p{L}\p{N}_-]+){0,4}\s+rejected paths?\b/iu.test(value);

const explicitlyNamesNoStaleBoundary = (value: string): boolean =>
  /\b(?:no|none)\b(?:\s+[\p{L}\p{N}_-]+){0,4}\s+stale\b/iu.test(value);

const rejectedPathValidationReasons = (
  output: LiveCodexObedienceOutput,
  rejected: readonly string[] | undefined
): readonly string[] => {
  if (rejected === undefined) return ["packet rejected-path ids are unavailable"];
  if (rejected.length === 0) {
    return explicitlyNamesNoRejectedPath(output.rejectedPath)
      ? []
      : ["live output does not preserve the packet's explicit no-rejected-path boundary"];
  }
  return rejected.some((id) => output.rejectedPath.includes(id))
    ? []
    : ["live output does not identify a packet rejected path"];
};

const staleBoundaryValidationReasons = (
  output: LiveCodexObedienceOutput,
  stale: readonly string[] | undefined
): readonly string[] => {
  if (stale === undefined) return ["packet stale-boundary ids are unavailable"];
  const reasons: string[] = [];
  if (stale.some((id) => !output.staleBoundary.includes(id))) {
    reasons.push("live output omits a packet stale boundary");
  }
  const uuidTokens = output.staleBoundary.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi) ?? [];
  if (uuidTokens.some((id) => !stale.includes(id))) {
    reasons.push("live output invents a stale boundary id outside packet authority");
  }
  if (stale.length === 0 && uuidTokens.length === 0 && !explicitlyNamesNoStaleBoundary(output.staleBoundary)) {
    reasons.push("live output does not preserve the packet's explicit no-stale boundary");
  }
  return reasons;
};

const nonProofValidationReasons = (
  output: LiveCodexObedienceOutput,
  nonProofs: readonly string[] | undefined
): readonly string[] => {
  if (nonProofs === undefined || nonProofs.length === 0) return ["packet non-proof boundary is unavailable"];
  return /does not prove|do not prove|unknown|quality|truth|correctness|readiness|unproven|not demonstrated/i.test(output.nonProof)
    ? []
    : ["live output does not preserve the packet non-proof or unknown boundary"];
};

/** Validate that a live output refers only to the packet's current authority and proof boundary. */
export const validateLiveCodexObedienceOutputAgainstPacket = (
  output: LiveCodexObedienceOutput,
  packet: unknown
): LiveCodexObedienceValidation => {
  const packetRoot = isRecord(packet) ? packet : undefined;
  const body = packetRoot !== undefined && isRecord(packetRoot.packet) ? packetRoot.packet : undefined;
  const governing = packetStringArray(body, "governingDecisionIds");
  const rejected = packetStringArray(body, "rejectedPathIds");
  const stale = [
    ...(packetStringArray(body, "staleDecisionIds") ?? []),
    ...(packetStringArray(body, "staleKnowledgeIds") ?? [])
  ];
  const nonProofs = packetStringArray(body, "doesNotProve") ?? packetStringArray(body, "nonProofs");
  const reasons = [
    ...decisionValidationReasons(output, governing),
    ...rejectedPathValidationReasons(output, rejected),
    ...staleBoundaryValidationReasons(output, stale),
    ...nonProofValidationReasons(output, nonProofs)
  ];
  return { valid: reasons.length === 0, reasons };
};

export const parseLiveCodexObedienceOutputJson = (raw: string): LiveCodexObedienceOutput => {
  try {
    const parsed: unknown = JSON.parse(raw);
    return parseLiveCodexObedienceOutput(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid live Codex obedience output: expected JSON", { cause: error });
    }
    throw error;
  }
};

export const extractLiveCodexObedienceOutput = (
  stdout: string
): LiveCodexObedienceOutput | undefined => {
  const lines = stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).reverse();
  for (const line of lines) {
    try {
      return parseLiveCodexObedienceOutputJson(line);
    } catch {
      // Codex logs are allowed before the final bounded JSON message.
    }
  }
  return undefined;
};

const codexJsonEventText = (line: string): string | undefined => {
  try {
    const event: unknown = JSON.parse(line);
    if (
      !isRecord(event) ||
      event.type !== "item.completed" ||
      !isRecord(event.item) ||
      event.item.type !== "agent_message" ||
      typeof event.item.text !== "string"
    ) {
      return undefined;
    }
    return event.item.text;
  } catch {
    return undefined;
  }
};

const markedLiveCodexObediencePayloads = (stdout: string): readonly string[] =>
  stdout
    .split(/\r?\n/)
    .flatMap((line) => [line, codexJsonEventText(line)].filter((candidate): candidate is string =>
      candidate !== undefined
    ))
    .flatMap((text) => text.split(/\r?\n/))
    .map((line) => line.trim())
    .filter((line) => line.startsWith(liveCodexObedienceMarker))
    .map((line) => line.slice(liveCodexObedienceMarker.length).trim());

/** Classify only the explicit machine line; ordinary Codex prose is not an envelope. */
export const inspectLiveCodexObedienceOutput = (
  stdout: string
): LiveCodexObedienceCapture => {
  const markerPayloads = markedLiveCodexObediencePayloads(stdout);
  if (markerPayloads.length === 0) return { status: "missing" };
  const markerPayload = markerPayloads.at(-1);
  if (markerPayload === undefined) return { status: "missing" };
  try {
    return {
      status: "valid",
      output: parseLiveCodexObedienceOutputJson(markerPayload)
    };
  } catch {
    return { status: "malformed" };
  }
};

const isLiveCodexObedienceOutput = (value: unknown): value is LiveCodexObedienceOutput => {
  try {
    parseLiveCodexObedienceOutput(value);
    return true;
  } catch {
    return false;
  }
};

const missingReason = (condition: boolean, reason: string): string | undefined =>
  condition ? undefined : reason;

const scenarioBoundToTask = (scenario: string, task: JsonRecord | undefined): boolean => {
  const taskText = `${readString(task?.["title"]) ?? ""} ${readString(task?.["objective"]) ?? ""}`
    .toLowerCase();
  const tokens = scenario.toLowerCase().split(/[^a-z0-9]+/u).filter((token) => token.length > 2);
  return tokens.length > 0 && tokens.every((token) => taskText.includes(token));
};

const packetShapeReasons = (
  root: JsonRecord | undefined,
  manifest: Pick<PairedTrialManifest, "runId" | "projectId" | "taskId" | "scenario">
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
    missingReason(task?.["projectId"] === manifest.projectId, "packet task is not bound to the manifest project"),
    missingReason(scenarioBoundToTask(manifest.scenario, task), "packet task does not describe the manifest scenario")
  ].filter((reason): reason is string => reason !== undefined);

  return { reasons, ...(body === undefined ? {} : { body }), ...(checksum === undefined ? {} : { checksum }) };
};

const packetAuthorityReasons = (
  body: JsonRecord | undefined,
  manifest: Pick<PairedTrialManifest, "requiredDecisionIds" | "decisionApplications" | "packetReadiness">
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
  const packetStatus = readString(abstention?.["status"]);
  const expectedStatus = manifest.packetReadiness ?? "ready";
  return [
    ...(missingRequired.length === 0 ? [] : [`packet lacks task-relevant governing decisions: ${missingRequired.join(", ")}`]),
    ...(missingSourceDecisions.length === 0 ? [] : [
      `packet lacks exact SourceDecision subjects: ${missingSourceDecisions.join(", ")}`
    ]),
    ...(packetStatus === expectedStatus ? [] : [
      `packet readiness ${packetStatus ?? "missing"} does not match manifest expectation ${expectedStatus}`
    ])
  ];
};

export const validateTrialPacket = (
  packet: unknown,
  manifest: Pick<
    PairedTrialManifest,
    "runId" | "projectId" | "taskId" | "scenario" | "requiredDecisionIds" | "decisionApplications"
    | "packetReadiness"
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
  KRN_TRIAL_TARGET_ROOT: targetRoot,
  ...(process.env.KRN_DATABASE_URL === undefined
    ? {}
    : { KRN_DATABASE_URL: process.env.KRN_DATABASE_URL })
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
    ...(manifest.capabilities === undefined
      ? []
      : [
        missingReason(isTrackedTrialCapabilities(manifest.capabilities), "capability profiles are invalid"),
        missingReason(manifest.codex.args.includes("--json"), "capability profiles require structured Codex JSON events"),
        missingReason(
          hasPacketTransportCapability(manifest.capabilities),
          "capability KRN arm cannot satisfy bounded packet-derived obedience without krn_decision_packet"
        )
      ].filter((reason): reason is string => reason !== undefined)),
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
    checker: manifest.checker,
    ...(manifest.capabilities === undefined ? {} : { capabilities: manifest.capabilities })
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
  KRN_DATABASE_URL: environment.KRN_DATABASE_URL === undefined ? "absent" : "configured",
  OPENAI_API_KEY: environment.OPENAI_API_KEY === undefined ? "absent" : "present",
  network: "disabled"
}));

const pathLines = (result: CommandResult): readonly string[] =>
  (result.stdout.includes("\0") ? result.stdout.split("\0") : result.stdout.split("\n"))
    .filter((path) => path.length > 0);

const captureCompleteTargetPatch = async (input: {
  readonly targetRoot: string;
  readonly initialCommit: string;
  readonly environment: NodeJS.ProcessEnv;
  readonly untrackedFiles: readonly string[];
}): Promise<CommandResult> => {
  const tracked = await runProcess("git", ["diff", input.initialCommit, "--binary"], {
    cwd: input.targetRoot,
    env: input.environment,
    timeoutMs: 30_000
  });
  const untracked = await Promise.all([...input.untrackedFiles].sort().map(async (path) => ({
    path,
    result: await runProcess("git", ["diff", "--no-index", "--binary", "--", "/dev/null", path], {
      cwd: input.targetRoot,
      env: input.environment,
      timeoutMs: 30_000
    })
  })));
  const validUntracked = untracked.every(({ result }) =>
    result.exitCode === 0 ||
    (result.exitCode === 1 && result.stdout.length > 0 && result.stderr.length === 0)
  );
  const startedAt = [tracked, ...untracked.map(({ result }) => result)]
    .map((result) => result.startedAt)
    .find((value): value is string => value !== undefined);
  const completedAt = [...untracked.map(({ result }) => result), tracked]
    .reverse()
    .map((result) => result.completedAt)
    .find((value): value is string => value !== undefined);

  return {
    command: "krn-complete-git-patch",
    args: [input.initialCommit, ...input.untrackedFiles.slice().sort()],
    exitCode: tracked.exitCode === 0 && validUntracked ? 0 : 1,
    stdout: canonicalJson({
      tracked: tracked.stdout,
      untracked: untracked.map(({ path, result }) => ({ path, patch: result.stdout }))
    }),
    stderr: [tracked.stderr, ...untracked.map(({ result }) => result.stderr)].filter(Boolean).join("\n"),
    ...(startedAt === undefined ? {} : { startedAt }),
    ...(completedAt === undefined ? {} : { completedAt }),
    durationMs: [tracked, ...untracked.map(({ result }) => result)]
      .reduce((total, result) => total + (result.durationMs ?? 0), 0)
  };
};

const captureTargetState = async (input: {
  readonly targetRoot: string;
  readonly initialCommit: string;
  readonly environment: NodeJS.ProcessEnv;
}): Promise<TrialTargetState> => {
  const [status, tracked, untracked] = await Promise.all([
    runProcess("git", ["status", "--porcelain=v1", "--untracked-files=all"], {
      cwd: input.targetRoot,
      env: input.environment,
      timeoutMs: 30_000
    }),
    runProcess("git", ["diff", input.initialCommit, "--name-only", "-z"], {
      cwd: input.targetRoot,
      env: input.environment,
      timeoutMs: 30_000
    }),
    runProcess("git", ["ls-files", "--others", "--exclude-standard", "-z"], {
      cwd: input.targetRoot,
      env: input.environment,
      timeoutMs: 30_000
    })
  ]);
  const untrackedFiles = untracked.exitCode === 0 ? pathLines(untracked) : [];
  const patch = await captureCompleteTargetPatch({
    ...input,
    untrackedFiles
  });
  const known = [status, tracked, untracked, patch].every((result) => result.exitCode === 0);
  let treeHash: string | undefined;

  try {
    treeHash = await hashTree(input.targetRoot);
  } catch {
    return {
      status: "unknown",
      statusOutput: status.stdout,
      trackedFiles: pathLines(tracked),
      untrackedFiles,
      commands: { status, tracked, untracked, patch }
    };
  }

  return {
    status: known ? "known" : "unknown",
    ...(treeHash === undefined ? {} : { treeHash }),
    statusOutput: status.stdout,
    trackedFiles: pathLines(tracked),
    untrackedFiles,
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
      ? result.timedOut === true
        ? `${arm} arm timed out`
        : `${arm} arm did not complete successfully`
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
    optionalValue(value, "timedOut", (timedOut) => typeof timedOut === "boolean") &&
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
  isTrackedTrialContainment(value);

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
    isTrackedTrialChecker(value["checker"]);
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
    optionalValue(value, "capabilityProfileHashes", (hashes) =>
      isRecord(hashes) && isPresentString(hashes["baseline"]) && isPresentString(hashes["krn"])
    ) &&
    optionalValue(value, "environmentProfileHash", isPresentString) &&
    optionalValue(value, "environmentVariableNames", isStringArray) &&
    optionalValue(value, "credentialProvided", (credential) => typeof credential === "boolean") &&
    optionalValue(value, "environmentAvailability", (availability) =>
      isRecord(availability) &&
      typeof availability["databaseConfigured"] === "boolean" &&
      typeof availability["codexHomeConfigured"] === "boolean"
    ) &&
    optionalValue(value, "sourceCommands", (commands) =>
      isRecord(commands) &&
      typeof commands["test"] === "boolean" &&
      typeof commands["typecheck"] === "boolean" &&
      (commands["css"] === undefined || typeof commands["css"] === "boolean")
    ) &&
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
  optionalValue(value, "headMatchesInitialCommit", (matches) => typeof matches === "boolean") &&
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

const isFocusedTestMutations = (value: unknown): value is readonly {
  readonly name: "invalid_json" | "missing_email" | "invalid_role";
  readonly command: CommandResult;
}[] => {
  if (!Array.isArray(value) || value.length !== 3) return false;
  const names = value.flatMap((entry) =>
    isRecord(entry) &&
    (entry["name"] === "invalid_json" ||
      entry["name"] === "missing_email" ||
      entry["name"] === "invalid_role") &&
    isCommandResult(entry["command"])
      ? [entry["name"]]
      : []
  );
  return names.length === value.length && new Set(names).size === value.length;
};

const focusedTestCheckPassed = (checks: unknown): boolean =>
  Array.isArray(checks) && checks.some((check) =>
    isRecord(check) && check["name"] === "focused_tests" && check["passed"] === true
  );

const focusedTestMutationsPassed = (
  mutations: readonly { readonly command: CommandResult }[]
): boolean => mutations.every((mutation) => mutation.command.exitCode === 0);

const focusedTestStatusMatchesCheck = (scorePassed: boolean, checkPassed: boolean): boolean =>
  scorePassed ? checkPassed : true;

const focusedTestCommandsPassed = (
  control: CommandResult,
  mutations: readonly { readonly command: CommandResult }[]
): boolean => control.exitCode === 0 ? focusedTestMutationsPassed(mutations) : false;

const hasConsistentFocusedTestProof = (value: JsonRecord): boolean => {
  const scorePassed = value["status"] === "pass";
  const checkPassed = focusedTestCheckPassed(value["checks"]);
  if (!focusedTestStatusMatchesCheck(scorePassed, checkPassed)) return false;
  const control = value["focusedTestControl"];
  const mutations = value["focusedTestMutations"];

  if (!isCommandResult(control)) return false;
  if (!isFocusedTestMutations(mutations)) return false;
  return checkPassed ? focusedTestCommandsPassed(control, mutations) : true;
};

const isHeldOutArmBasics = (value: JsonRecord): boolean =>
  isHeldOutArmStatus(value["status"]) &&
  typeof value["score"] === "number" &&
  Number.isFinite(value["score"]) &&
  Array.isArray(value["checks"]) &&
  value["checks"].every(isHeldOutCheck) &&
  isStringArray(value["changedFiles"]);

const isHeldOutArmScore = (value: unknown, focusedProofRequired: boolean): boolean => {
  if (!isRecord(value)) return false;
  return isHeldOutArmBasics(value) &&
    optionalValue(value, "changeManifest", isTargetChangeManifest) &&
    isHeldOutCommands(value["commands"]) &&
    optionalValue(value, "runtimeCommand", isCommandResult) &&
    (!focusedProofRequired || value["status"] !== "pass" || hasConsistentFocusedTestProof(value));
};

const isPairedRepairScore = (
  value: unknown,
  focusedProofRequired = true
): value is PairedRepairScore =>
  isRecord(value) &&
  (value["outcome"] === "win" || value["outcome"] === "tie" || value["outcome"] === "loss" || value["outcome"] === "invalid") &&
  isHeldOutArmScore(value["baseline"], focusedProofRequired) &&
  isHeldOutArmScore(value["krn"], focusedProofRequired) &&
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
  optionalValue(value, "liveOutput", isLiveCodexObedienceOutput) &&
  optionalValue(value, "liveObedienceStatus", (item) =>
    item === "valid" || item === "missing" || item === "malformed" || item === "packet_mismatch"
  ) &&
  optionalValue(value, "liveOutputValidation", (item) =>
    isRecord(item) && typeof item["valid"] === "boolean" && isStringArray(item["reasons"])
  ) &&
  optionalValue(value, "decisionApplicationObservation", (item) =>
    item === "not_attempted" || item === "none_observed" || item === "observed" || item === "persistence_failed"
  ) &&
  optionalValue(value, "capabilityUseObservation", (item) =>
    isRecord(item) &&
    ["baseline", "krn"].every((arm) => {
      const observation = nestedRecord(item, arm);
      return observation !== undefined &&
        typeof observation["mcpToolCallEvents"] === "number" &&
        Number.isInteger(observation["mcpToolCallEvents"]) &&
        observation["mcpToolCallEvents"] >= 0 &&
        typeof observation["skillEvents"] === "number" &&
        Number.isInteger(observation["skillEvents"]) &&
        observation["skillEvents"] >= 0 &&
        optionalValue(observation, "genericMcpToolCallEvents", (count) =>
          typeof count === "number" && Number.isInteger(count) && count >= 0
        ) &&
        optionalValue(observation, "genericSkillEvents", (count) =>
          typeof count === "number" && Number.isInteger(count) && count >= 0
        );
    })
  ) &&
  optionalValue(value, "modelUsageObservation", isModelUsageObservation) &&
  optionalValue(value, "packetContextMode", (item) => item === "full" || item === "task-only") &&
  optionalValue(value, "treatment", isPairedMemoryTreatment) &&
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

const requiresFocusedTestProof = (value: JsonRecord): boolean => {
  if (value["kind"] !== "krn.pairedLiveCodexRepairArtifact.v2") return false;
  const score = nestedRecord(value, "score");
  return [nestedRecord(score, "baseline"), nestedRecord(score, "krn")].some((arm) =>
    Array.isArray(arm?.["checks"]) && arm["checks"].some((check) =>
      isRecord(check) && check["name"] === "focused_tests"
    )
  );
};

const hasPassedScore = (value: JsonRecord, execution: JsonRecord): boolean => {
  const attempt = nestedRecord(execution, "attempt");
  const score = value["score"];
  return isPairedRepairScore(score, requiresFocusedTestProof(value)) &&
    score.outcome !== "invalid" &&
    isTrialAttempt(attempt) &&
    attempt.phases.at(-2)?.name === "checker_scored";
};

const isPassedTrialArtifact = (value: JsonRecord): boolean => {
  const execution = nestedRecord(value, "execution");
  return execution !== undefined &&
    execution["decisionApplicationObservation"] === "observed" &&
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
  optionalValue(
    value,
    "score",
    (score) => isPairedRepairScore(score, requiresFocusedTestProof(value))
  );

const isTrackedTrialArtifactKind = (value: unknown): boolean =>
  value === "krn.pairedLiveCodexRepairArtifact.v1"
    ? true
    : value === "krn.pairedLiveCodexRepairArtifact.v2";

const hasArtifactEnvelope = (value: JsonRecord): boolean =>
  isTrackedTrialStatus(value["status"]) &&
  hasArtifactIdentity(value) &&
  hasArtifactPacket(value) &&
  hasArtifactExecution(value) &&
  hasArtifactProof(value);

const artifactStatusIsConsistent = (value: JsonRecord): boolean =>
  value["status"] === "passed" ? isPassedTrialArtifact(value) : true;

const isTrackedTrialArtifactShape = (value: unknown): value is TrackedTrialArtifact => {
  if (!isRecord(value)) return false;
  return isTrackedTrialArtifactKind(value["kind"]) &&
    hasArtifactEnvelope(value) &&
    artifactStatusIsConsistent(value);
};

const artifactHash = (artifact: object): string => sha256(canonicalJson(artifact));

const legacyArtifactHash = (artifact: object): string => sha256(serializedJson(artifact));

export const buildTrackedTrialArtifact = (
  artifact: Omit<TrackedTrialArtifact, "artifactHash">
): TrackedTrialArtifact => ({ ...artifact, artifactHash: artifactHash(artifact) });

export const verifyTrackedTrialArtifact = (value: unknown): value is TrackedTrialArtifact => {
  if (!isTrackedTrialArtifactShape(value)) return false;
  const { artifactHash: expectedArtifactHash, ...content } = value;
  return artifactHash(content) === expectedArtifactHash ||
    legacyArtifactHash(content) === expectedArtifactHash;
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
  sameJson(detail["environmentAvailability"], artifact.execution.conditions.observed?.environmentAvailability) &&
  sameJson(detail["sourceCommands"], artifact.execution.conditions.observed?.sourceCommands) &&
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
  modelUsageObservation: input.execution?.modelUsageObservation ?? unavailableModelUsageObservation(),
  packetContextMode: context.manifest.packetContextMode ?? "full",
  ...optionalField("treatment", context.manifest.treatment),
  ...optionalField("attempt", input.attempt),
  ...optionalField(
    "liveOutput",
    input.execution?.liveOutput ?? extractLiveCodexObedienceOutput(input.execution?.krn?.stdout ?? "")
  )
});

const buildTrialArtifact = (
  context: TrialContext,
  input: TrialArtifactInput
): TrackedTrialArtifact => buildTrackedTrialArtifact({
  kind: "krn.pairedLiveCodexRepairArtifact.v2",
  status: input.status,
  manifestHash: context.manifestHash,
  sourceTreeHash: context.sourceTreeHash,
  checkerRevision: context.manifest.checkerRevision ?? pairedLiveCheckerRevision,
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

export const observeSourceCommands = async (
  sourceRoot: string
): Promise<{ readonly test: boolean; readonly typecheck: boolean; readonly css: boolean }> => {
  try {
    const packageJson: unknown = JSON.parse(await readFile(join(sourceRoot, "package.json"), "utf8"));
    const scripts = isRecord(packageJson) && isRecord(packageJson["scripts"])
      ? packageJson["scripts"]
      : undefined;
    return {
      test: typeof scripts?.["test"] === "string" && scripts["test"].trim().length > 0,
      typecheck: typeof scripts?.["typecheck"] === "string" && scripts["typecheck"].trim().length > 0,
      css: typeof scripts?.["css"] === "string" && scripts["css"].trim().length > 0
    };
  } catch {
    return { test: false, typecheck: false, css: false };
  }
};

type TrialPreparationObservations = {
  readonly conditions: TrialConditions;
  readonly containment: TrialToolObservation;
  readonly codex: TrialToolObservation;
  readonly authentication: CommandResult;
  readonly runtimePermissionFlag: HeldOutRuntimePermissionFlag | undefined;
  readonly sourceCommands: { readonly test: boolean; readonly typecheck: boolean; readonly css: boolean };
  readonly checkerRuntime: {
    readonly nodeVersion: string;
    readonly permissionFlag: HeldOutRuntimePermissionFlag | "unsupported";
  };
};

const observeTrialPreparation = async (input: {
  readonly context: TrialContext;
  readonly sourceRoot: string;
  readonly sandboxRoot: string;
  readonly trialRoot: string;
}): Promise<TrialPreparationObservations> => {
  const probeEnvironment = allowlistedEnvironment(input.sandboxRoot, input.trialRoot);
  const [containment, codex, authentication, sourceCommands] = await Promise.all([
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
    }),
    observeSourceCommands(input.sourceRoot)
  ]);
  const runtimePermissionFlag = selectHeldOutRuntimePermissionFlag();
  const checkerRuntime = {
    nodeVersion: process.version,
    permissionFlag: runtimePermissionFlag ?? "unsupported"
  } as const;
  return {
    containment,
    codex,
    authentication,
    runtimePermissionFlag,
    sourceCommands,
    checkerRuntime,
    conditions: {
      ...input.context.conditions,
      observed: {
        containment,
        codex,
        authentication,
        capabilityProfileHashes: {
          baseline: capabilityProfileHash(input.context.manifest.capabilities?.baseline),
          krn: capabilityProfileHash(input.context.manifest.capabilities?.krn)
        },
        environmentVariableNames: Object.keys(probeEnvironment).sort(),
        credentialProvided: hasChatGptAuthentication(authentication),
        environmentAvailability: {
          databaseConfigured: typeof process.env.KRN_DATABASE_URL === "string" && process.env.KRN_DATABASE_URL.trim().length > 0,
          codexHomeConfigured: typeof process.env.KRN_TRIAL_CODEX_HOME === "string" && process.env.KRN_TRIAL_CODEX_HOME.trim().length > 0
        },
        sourceCommands,
        checkerRuntime
      }
    }
  };
};

const trialPreparationRejection = (input: {
  readonly observations: TrialPreparationObservations;
  readonly manifest: PairedTrialManifest;
  readonly enforceSourceCommands?: boolean;
}): Extract<TrialPreparation, { readonly kind: "rejected" }> | undefined => {
  const { authentication, containment, codex, runtimePermissionFlag, sourceCommands, conditions } = input.observations;
  if (!hasChatGptAuthentication(authentication)) {
    return { kind: "rejected", status: "blocked", reason: "host Codex ChatGPT authentication is unavailable", conditions };
  }
  if (input.enforceSourceCommands === true) {
    const family = resolvePairedEvalFamily(input.manifest.scenario);
    const commandsAvailable = family === "frontend-course-cards"
      ? sourceCommands.css
      : sourceCommands.test && sourceCommands.typecheck;
    if (!commandsAvailable) {
      return {
        kind: "rejected",
        status: "invalid",
        reason: family === "frontend-course-cards"
          ? "frontend source fixture must define the public css build script"
          : "source fixture must define test and typecheck scripts",
        conditions
      };
    }
  }
  const prerequisite = trialPrerequisiteFailure({ containment, codex, manifest: input.manifest, runtimePermissionFlag });
  return prerequisite === undefined ? undefined : { kind: "rejected", ...prerequisite, conditions };
};

const materializeTrialProfiles = async (input: {
  readonly manifest: PairedTrialManifest;
  readonly sandboxRoot: string;
}): Promise<{
  readonly profileHash: string;
  readonly capabilityProfileHashes: { readonly baseline: string; readonly krn: string };
}> => {
  const profilePath = join(input.sandboxRoot, `${input.manifest.codex.profile.name}.config.toml`);
  await writeFile(profilePath, input.manifest.codex.profile.config, { encoding: "utf8", flag: "wx" });
  if (input.manifest.capabilities !== undefined) {
    await Promise.all((["baseline", "krn"] as const).map(async (arm) => {
      const capabilityPath = join(
        input.sandboxRoot,
        `${capabilityProfileName(input.manifest.codex.profile.name, arm)}.config.toml`
      );
      await writeFile(
        capabilityPath,
        codexCapabilityProfileConfig(input.manifest.codex.profile.config, input.manifest.capabilities?.[arm]),
        { encoding: "utf8", flag: "wx" }
      );
    }));
  }
  return {
    profileHash: sha256(await readFile(profilePath, "utf8")),
    capabilityProfileHashes: {
      baseline: capabilityProfileHash(input.manifest.capabilities?.baseline),
      krn: capabilityProfileHash(input.manifest.capabilities?.krn)
    }
  };
};

const prepareTrackedTrial = async (input: {
  readonly context: TrialContext;
  readonly sourceRoot: string;
  readonly trialRoot: string;
  readonly sandboxRoot: string;
  readonly journal: TrialJournal;
  readonly enforceSourceCommands?: boolean;
}): Promise<TrialPreparation> => {
  const observations = await observeTrialPreparation(input);
  const { authentication, checkerRuntime, codex, containment, sourceCommands } = observations;
  await input.journal.phase("conditions_observed", {
    containment,
    codex,
    authentication: authentication.exitCode === 0 ? "chatgpt" : "unavailable",
    environmentAvailability: observations.conditions.observed?.environmentAvailability,
    sourceCommands,
    checkerRuntime,
    prerequisite: trialPrerequisiteFailure({
      containment,
      codex,
      manifest: input.context.manifest,
      runtimePermissionFlag: observations.runtimePermissionFlag
    })?.reason
  });
  const rejection = trialPreparationRejection({
    observations,
    manifest: input.context.manifest,
    ...(input.enforceSourceCommands === undefined ? {} : { enforceSourceCommands: input.enforceSourceCommands })
  });
  if (rejection !== undefined) return rejection;

  const materializedProfiles = await materializeTrialProfiles({
    manifest: input.context.manifest,
    sandboxRoot: input.sandboxRoot
  });
  const conditions: TrialConditions = {
    ...observations.conditions,
    observed: { ...observations.conditions.observed, ...materializedProfiles }
  };
  if (materializedProfiles.profileHash !== input.context.manifest.codex.profile.hash) {
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

export const promptPacketForContext = (
  packet: unknown,
  mode: "full" | "task-only"
): unknown => {
  if (mode === "full" || !isRecord(packet) || !isRecord(packet["packet"])) return packet;
  const body = { ...packet["packet"] };
  for (const key of [
    "toolBoundaries",
    "nextAction",
    "contextInclusions",
    "contextExclusions",
    "governingDecisionIds",
    "sourceDecisionIds",
    "governingStatements",
    "sourceClaimIds",
    "caveatedSourceClaimIds",
    "sourceDecisionEdgeIds",
    "sourceDecisionTargets",
    "sourceRejectionIds",
    "memoryRefs",
    "caveatedMemoryRefs",
    "staleDecisionIds",
    "staleKnowledgeIds",
    "supersededPathIds",
    "rejectedPathIds",
    "falsifiers",
    "verificationCommands",
    "evidenceGaps",
    "abstentionScore",
    "doesNotProve",
    "nonProofs",
    "severeStaleAuthorityIds",
    "sourceConsensusTimeline",
    "memoryConsensusTimeline",
    "brief",
    "taskStandardDecisions",
    "sourceConsensus"
  ]) delete body[key];
  return { ...packet, packet: body };
};

const materializedDecisionPacketMcpServerSource = (input: {
  readonly packet: unknown;
  readonly runId: string;
}): string => {
  const packetBase64 = Buffer.from(serializedJson(input.packet), "utf8").toString("base64");
  const runId = JSON.stringify(input.runId);
  const toolName = JSON.stringify("krn_decision_packet");
  return [
    "const parseJson = JSON[\"parse\"].bind(JSON);",
    "const packet = parseJson(Buffer.from(",
    JSON.stringify(packetBase64),
    ", \"base64\").toString(\"utf8\"));",
    `const expectedRunId = ${runId};`,
    `const toolName = ${toolName};`,
    "const protocolVersion = \"2025-06-18\";",
    "const write = (message) => process.stdout.write(`${JSON.stringify(message)}\\n`);",
    "const response = (id, result) => ({ jsonrpc: \"2.0\", id: id ?? null, result });",
    "const error = (id, code, message) => ({ jsonrpc: \"2.0\", id: id ?? null, error: { code, message } });",
    "const tool = { name: toolName, title: \"KRN DecisionPacket\", description: \"Return the read-only KRN DecisionPacket contract for the configured trial run.\", inputSchema: { type: \"object\", properties: { runId: { type: \"string\" } }, required: [\"runId\"], additionalProperties: false }, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } };",
    "const handle = (message) => {",
    "  const id = message && Object.hasOwn(message, \"id\") ? message.id : null;",
    "  if (!message || typeof message !== \"object\") return error(id, -32600, \"Invalid request\");",
    "  if (message.method === \"initialize\") return response(id, { protocolVersion, capabilities: { tools: { listChanged: false } }, serverInfo: { name: \"krn_decision_packet\", title: \"KRN DecisionPacket MCP\", version: \"sandbox-materialized\" }, instructions: \"Use krn_decision_packet to fetch the read-only DecisionPacket for this retained paired-live KRN arm.\" });",
    "  if (message.method === \"notifications/initialized\") return undefined;",
    "  if (message.method === \"ping\") return response(id, {});",
    "  if (message.method === \"tools/list\") return response(id, { tools: [tool] });",
    "  if (message.method !== \"tools/call\") return error(id, -32601, `Method not found: ${String(message.method)}`);",
    "  const params = message.params;",
    "  if (!params || typeof params !== \"object\" || params.name !== toolName) return error(id, -32602, \"Unknown tool\");",
    "  const args = params.arguments;",
    "  if (!args || typeof args !== \"object\" || args.runId !== expectedRunId) return error(id, -32602, \"runId does not match the configured retained trial\");",
    "  const checksum = packet && packet.packetIdentity && packet.packetIdentity.checksum;",
    "  const identity = typeof checksum === \"string\" ? ` Checksum: ${checksum}.` : \"\";",
    "  return response(id, { content: [{ type: \"text\", text: `KRN DecisionPacket is available in structuredContent.${identity}` }], structuredContent: packet });",
    "};",
    "let buffer = \"\";",
    "process.stdin.setEncoding(\"utf8\");",
    "process.stdin.on(\"data\", (chunk) => {",
    "  buffer += chunk;",
    "  for (;;) {",
    "    const index = buffer.indexOf(\"\\n\");",
    "    if (index < 0) break;",
    "    const line = buffer.slice(0, index).trim();",
    "    buffer = buffer.slice(index + 1);",
    "    if (line.length === 0) continue;",
    "    try {",
    "      const parsed = parseJson(line);",
    "      const reply = handle(parsed);",
    "      if (reply !== undefined) write(reply);",
    "    } catch {",
    "      write(error(null, -32700, \"Parse error\"));",
    "    }",
    "  }",
    "});"
  ].join("\n");
};

const materializeDecisionPacketMcpServer = async (input: {
  readonly sandboxRoot: string;
  readonly packet: unknown;
  readonly runId: string;
}): Promise<string> => {
  const capabilityRoot = join(input.sandboxRoot, "capabilities");
  await mkdir(capabilityRoot, { recursive: true });
  const serverPath = join(capabilityRoot, "krn-decision-packet-mcp.mjs");
  await writeFile(serverPath, materializedDecisionPacketMcpServerSource(input), {
    encoding: "utf8",
    flag: "wx"
  });
  await chmod(serverPath, 0o600);
  return serverPath;
};

const materializeSkillPath = async (
  sandboxRoot: string,
  skillPath: string
): Promise<string> => {
  const sourceRoot = dirname(skillPath);
  const destinationRoot = join(sandboxRoot, "skills", basename(sourceRoot));
  await cp(sourceRoot, destinationRoot, {
    recursive: true,
    force: true
  });
  return join(destinationRoot, "SKILL.md");
};

const materializeRuntimeCapabilityProfile = async (input: {
  readonly profile: TrialCapabilityProfile;
  readonly arm: "baseline" | "krn";
  readonly sandboxRoot: string;
  readonly packet: unknown;
  readonly runId: string;
}): Promise<TrialCapabilityProfile> => {
  if (input.arm !== "krn") return input.profile;
  const mcpServers = await Promise.all(input.profile.mcpServers.map(async (server) =>
    server.name === "krn_decision_packet"
      ? {
          ...server,
          command: process.execPath,
          args: [await materializeDecisionPacketMcpServer({
            sandboxRoot: input.sandboxRoot,
            packet: input.packet,
            runId: input.runId
          })]
        }
      : server
  ));
  const skillPaths = await Promise.all(input.profile.skillPaths.map((skillPath) =>
    materializeSkillPath(input.sandboxRoot, skillPath)
  ));
  return { ...input.profile, mcpServers, skillPaths };
};

type ComparableTrialExecutionInput = {
  readonly trial: ComparableTrial;
  readonly packet: unknown;
  readonly checkerRoot: string;
  readonly sandboxRoot: string;
  readonly journal: TrialJournal;
  readonly containmentExecutable: string;
  readonly codexExecutable: string;
  readonly recordDecisionApplications: PairedDecisionApplicationRecorder | undefined;
};

const runComparableTrialArm = async (input: {
  readonly execution: ComparableTrialExecutionInput;
  readonly arm: "baseline" | "krn";
  readonly target: MaterializedTrialTarget;
  readonly prompt: string;
  readonly environment: NodeJS.ProcessEnv;
}): Promise<CommandResult> => {
  const manifest = input.execution.trial.context.manifest;
  const capabilityProfile = manifest.capabilities?.[input.arm];
  const profileName = capabilityProfile === undefined
    ? manifest.codex.profile.name
    : capabilityProfileName(manifest.codex.profile.name, input.arm);
  const configuredArgs = manifest.codex.args.map((argument) =>
    replaceArgument(argument, {
      "{prompt}": input.prompt,
      "{targetRoot}": input.target.root,
      [manifest.codex.profile.name]: profileName
    })
  );
  const runtimeCapabilityProfile = capabilityProfile === undefined
    ? undefined
    : await materializeRuntimeCapabilityProfile({
        profile: capabilityProfile,
        arm: input.arm,
        sandboxRoot: input.execution.sandboxRoot,
        packet: input.execution.packet,
        runId: manifest.runId
      });
  // Capability trials use only the isolated sandbox home, so the arm-specific
  // profile must remain visible instead of being suppressed with host config.
  const args = capabilityProfile === undefined
    ? configuredArgs
    : [
        ...codexCapabilityConfigArgs(runtimeCapabilityProfile),
        ...configuredArgs.filter((argument) => argument !== "--ignore-user-config")
      ];
  return runProcess(input.execution.containmentExecutable, [
    "--die-with-parent", "--ro-bind", "/", "/", "--proc", "/proc", "--dev", "/dev",
    "--tmpfs", "/tmp", "--dir", "/tmp/.git",
    "--bind", input.target.root, input.target.root,
    "--bind", input.execution.sandboxRoot, input.execution.sandboxRoot,
    "--", input.execution.codexExecutable, ...args
  ], {
    cwd: input.target.root,
    env: input.environment,
    timeoutMs: manifest.codex.budget.timeoutMs
  });
};

type ExecutedComparableArms = {
  readonly prompts: ReturnType<typeof buildPairedRepairPrompts>;
  readonly baselineResult: CommandResult;
  readonly krnResult: CommandResult;
  readonly baselineAfter: TrialTargetState;
  readonly krnAfter: TrialTargetState;
};

const executeComparableArms = async (
  input: ComparableTrialExecutionInput
): Promise<ExecutedComparableArms> => {
  const manifest = input.trial.context.manifest;
  const prompts = buildPairedRepairPrompts({
    task: manifest.task,
    decisionPacket: promptPacketForContext(input.packet, manifest.packetContextMode ?? "full"),
    family: resolvePairedEvalFamily(manifest.scenario),
    includeDecisionPacket: manifest.capabilities === undefined,
    ...(manifest.capabilities === undefined ? {} : { contextToolRunId: manifest.runId })
  });
  const baselineResult = await runComparableTrialArm({
    execution: input,
    arm: "baseline",
    target: input.trial.baseline,
    prompt: prompts.baseline,
    environment: input.trial.baselineArmEnvironment
  });
  const baselineAfter = await captureTargetState({
    targetRoot: input.trial.baseline.root,
    initialCommit: input.trial.baseline.commit,
    environment: input.trial.baselineObservationEnvironment
  });
  await input.journal.phase("baseline_executed", {
    result: baselineResult,
    before: input.trial.baselineBefore,
    after: baselineAfter
  });
  const krnResult = await runComparableTrialArm({
    execution: input,
    arm: "krn",
    target: input.trial.krn,
    prompt: prompts.krn,
    environment: input.trial.krnArmEnvironment
  });
  const krnAfter = await captureTargetState({
    targetRoot: input.trial.krn.root,
    initialCommit: input.trial.krn.commit,
    environment: input.trial.krnObservationEnvironment
  });
  await input.journal.phase("krn_executed", {
    result: krnResult,
    before: input.trial.krnBefore,
    after: krnAfter
  });
  return { prompts, baselineResult, krnResult, baselineAfter, krnAfter };
};

const observeComparableCapabilities = (
  manifest: PairedTrialManifest,
  arms: Pick<ExecutedComparableArms, "baselineResult" | "krnResult">
): { readonly baseline: CodexCapabilityUseObservation; readonly krn: CodexCapabilityUseObservation } => {
  const profiles = manifest.capabilities;
  return {
    baseline: observeCodexCapabilityUse(
      arms.baselineResult,
      profiles?.baseline.mcpServers.map((server) => server.name),
      profiles?.baseline.skillPaths
    ),
    krn: observeCodexCapabilityUse(
      arms.krnResult,
      profiles?.krn.mcpServers.map((server) => server.name),
      profiles?.krn.skillPaths
    )
  };
};

const validateComparableLiveOutput = (
  capture: LiveCodexObedienceCapture,
  packet: unknown
): { readonly validation: LiveCodexObedienceValidation; readonly status: LiveCodexObedienceStatus } => {
  if (capture.output === undefined) {
    return {
      status: capture.status,
      validation: {
        valid: false,
        reasons: [capture.status === "malformed"
          ? "KRN arm emitted a malformed bounded live obedience JSON"
          : "KRN arm did not emit the bounded live obedience JSON"]
      }
    };
  }
  const validation = validateLiveCodexObedienceOutputAgainstPacket(capture.output, packet);
  return { validation, status: validation.valid ? "valid" : "packet_mismatch" };
};

const comparableInvalidReasons = (input: {
  readonly arms: ExecutedComparableArms;
  readonly liveValidation: LiveCodexObedienceValidation;
  readonly capabilityUse: { readonly baseline: CodexCapabilityUseObservation; readonly krn: CodexCapabilityUseObservation };
  readonly capabilitiesDeclared: boolean;
}): readonly string[] => [
  armFailureReason("baseline", input.arms.baselineResult),
  armFailureReason("krn", input.arms.krnResult),
  targetStateReason("baseline", "after", input.arms.baselineAfter),
  targetStateReason("krn", "after", input.arms.krnAfter),
  ...(input.arms.krnResult.exitCode === 0 ? input.liveValidation.reasons : []),
  ...(input.capabilitiesDeclared ? capabilityUseFalsifierReasons(input.capabilityUse) : [])
].filter((reason): reason is string => reason !== undefined);

const comparableExecutionEvidence = (
  input: ComparableTrialExecutionInput,
  arms: ExecutedComparableArms
): { readonly execution: TrialExecutionDetails; readonly invalidReasons: readonly string[] } => {
  const liveOutputCapture = inspectLiveCodexObedienceOutput(arms.krnResult.stdout);
  const capabilityProfiles = input.trial.context.manifest.capabilities;
  const capabilityUseObservation = observeComparableCapabilities(input.trial.context.manifest, arms);
  const liveOutput = validateComparableLiveOutput(liveOutputCapture, input.packet);
  return {
    invalidReasons: comparableInvalidReasons({
      arms,
      liveValidation: liveOutput.validation,
      capabilityUse: capabilityUseObservation,
      capabilitiesDeclared: capabilityProfiles !== undefined
    }),
    execution: {
      environmentProfileHash: input.trial.environmentHash,
      promptDelta: arms.prompts.delta,
      baseline: arms.baselineResult,
      krn: arms.krnResult,
      modelUsageObservation: observeModelUsage(arms.baselineResult, arms.krnResult),
      ...(capabilityProfiles === undefined ? {} : { capabilityUseObservation }),
      ...(input.recordDecisionApplications === undefined
        ? {}
        : { decisionApplicationObservation: "not_attempted" as const }),
      targets: {
        baseline: { before: input.trial.baselineBefore, after: arms.baselineAfter },
        krn: { before: input.trial.krnBefore, after: arms.krnAfter }
      },
      liveObedienceStatus: liveOutput.status,
      liveOutputValidation: liveOutput.validation,
      ...optionalField("liveOutput", liveOutputCapture.output)
    }
  };
};

type DecisionApplicationPersistence =
  | { readonly kind: "skipped" }
  | { readonly kind: "observed"; readonly observation: "observed" }
  | {
      readonly kind: "unverified";
      readonly observation: "none_observed" | "persistence_failed";
      readonly reason: string;
    };

const persistDecisionApplications = async (input: {
  readonly execution: ComparableTrialExecutionInput;
  readonly score: PairedRepairScore;
}): Promise<DecisionApplicationPersistence> => {
  const recorder = input.execution.recordDecisionApplications;
  if (recorder === undefined || input.score.outcome === "invalid") return { kind: "skipped" };
  try {
    const applications = await recorder({
      runId: input.execution.trial.context.manifest.runId,
      packet: input.execution.packet,
      score: input.score,
      rules: input.execution.trial.context.manifest.decisionApplications,
      krnTarget: {
        targetRoot: input.execution.trial.krn.root,
        checkerRoot: input.execution.checkerRoot,
        initialCommit: input.execution.trial.krn.commit
      }
    });
    return applications.length > 0
      ? { kind: "observed", observation: "observed" }
      : {
          kind: "unverified",
          observation: "none_observed",
          reason: "decision application persistence produced no observed applications"
        };
  } catch (error) {
    const reason = error instanceof Error && error.message.trim().length > 0
      ? `decision application persistence failed: ${error.message.replace(/postgres(?:ql)?:\/\/[^\s]+/giu, "postgres://<redacted>")}`
      : "decision application persistence failed";
    return { kind: "unverified", observation: "persistence_failed", reason };
  }
};

const executeComparableTrial = async (
  input: ComparableTrialExecutionInput,
  checker: PairedTrialChecker
): Promise<TrialArtifactInput> => {
  const arms = await executeComparableArms(input);
  const evidence = comparableExecutionEvidence(input, arms);
  if (evidence.invalidReasons.length > 0) {
    return {
      status: "invalid",
      invalidReasons: evidence.invalidReasons,
      baselineTreeHash: input.trial.baseline.treeHash,
      krnTreeHash: input.trial.krn.treeHash,
      execution: evidence.execution
    };
  }
  const score = await checker({
    baseline: { targetRoot: input.trial.baseline.root, checkerRoot: input.checkerRoot, initialCommit: input.trial.baseline.commit, family: resolvePairedEvalFamily(input.trial.context.manifest.scenario) },
    krn: { targetRoot: input.trial.krn.root, checkerRoot: input.checkerRoot, initialCommit: input.trial.krn.commit, family: resolvePairedEvalFamily(input.trial.context.manifest.scenario) }
  });
  await input.journal.phase("checker_scored", { outcome: score.outcome, reason: score.reason });
  const persistence = await persistDecisionApplications({ execution: input, score });
  if (persistence.kind === "unverified") {
    return {
      status: "unverified",
      invalidReasons: [persistence.reason],
      baselineTreeHash: input.trial.baseline.treeHash,
      krnTreeHash: input.trial.krn.treeHash,
      execution: { ...evidence.execution, decisionApplicationObservation: persistence.observation },
      ...(persistence.observation === "persistence_failed" ? { score } : {})
    };
  }
  const decisionApplicationObservation = persistence.kind === "observed"
    ? persistence.observation
    : undefined;
  return {
    status: score.outcome === "invalid" ? "invalid" : "passed",
    ...optionalField("invalidReasons", score.outcome === "invalid" ? ["held-out checker invalidated the pair"] : undefined),
    baselineTreeHash: input.trial.baseline.treeHash,
    krnTreeHash: input.trial.krn.treeHash,
    execution: { ...evidence.execution, ...(decisionApplicationObservation === undefined ? {} : { decisionApplicationObservation }) },
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
  readonly enforceSourceCommands?: boolean;
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
  readonly enforceSourceCommands?: boolean;
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
      journal: journalResult.journal,
      ...(input.enforceSourceCommands === undefined ? {} : { enforceSourceCommands: input.enforceSourceCommands })
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
      recordDecisionApplications: input.recordDecisionApplications,
      ...(input.enforceSourceCommands === undefined ? {} : { enforceSourceCommands: input.enforceSourceCommands })
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

export const readMcpStructuredContent = (stdout: string, requestId: number): unknown => {
  for (const line of stdout.split("\n").reverse()) {
    if (line.trim().length === 0) continue;
    try {
      const normalizedLine = line.replace(/\u001b\[[0-?]*[ -\/]*[@-~]/gu, "");
      const jsonStart = normalizedLine.indexOf("{");
      if (jsonStart < 0) continue;
      const message: unknown = JSON.parse(normalizedLine.slice(jsonStart));
      if (!isRecord(message) || message["id"] !== requestId || !isRecord(message["result"])) continue;
      const result = message["result"];
      if (isRecord(result) && result["structuredContent"] !== undefined) return result["structuredContent"];
      if (!isRecord(result) || !Array.isArray(result["content"])) continue;
      const textContent = result["content"].find((item): item is JsonRecord =>
        isRecord(item) && item["type"] === "text" && typeof item["text"] === "string"
      );
      if (textContent === undefined) continue;
      try {
        const parsed: unknown = JSON.parse(textContent["text"] as string);
        return parsed;
      } catch {
        continue;
      }
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
      ...(packetResult.failure === undefined ? {} : { packetFetchFailure: packetResult.failure }),
      enforceSourceCommands: true
    });
  }
  return runTrackedPairedTrial({
    manifest,
    sourceRoot,
    checkerRoot,
    fetchPacket: () => fetchDecisionPacketViaMcp(checkerRoot, manifest.runId),
    attemptDirectory,
    enforceSourceCommands: true,
    recordDecisionApplications: (input) => recordPairedDecisionApplications({
      ...input,
      databaseUrl: process.env.KRN_DATABASE_URL ?? "postgres://krn:krn@localhost:54329/krn"
    })
  });
};

export const parseTrackedTrialCommandArguments = (
  rawArgs: readonly string[]
): {
  readonly manifestPath?: string;
  readonly attemptDirectory?: string;
} => {
  const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;
  const [manifestPath, attemptDirectory] = args;

  return {
    ...(manifestPath === undefined ? {} : { manifestPath }),
    ...(attemptDirectory === undefined ? {} : { attemptDirectory })
  };
};
