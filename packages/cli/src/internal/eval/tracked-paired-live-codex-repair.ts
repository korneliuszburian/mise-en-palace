import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildPairedRepairPrompts,
  runCommand,
  runPairedRepairChecker,
  type CommandResult,
  type PairedRepairScore
} from "./paired-live-codex-repair.js";

type JsonRecord = Record<string, unknown>;

export type TrackedTrialStatus = "passed" | "invalid" | "blocked" | "unverified";

export type PairedTrialManifest = {
  readonly kind: "krn.pairedLiveCodexRepairManifest.v1";
  readonly scenario: string;
  readonly sourcePath: string;
  readonly projectId: string;
  readonly taskId: string;
  readonly task: string;
  readonly requiredDecisionIds: readonly string[];
  readonly runId: string;
  readonly codex: {
    readonly command: string;
    readonly args: readonly string[];
    readonly cliVersion: string;
    readonly profileHash: string;
    readonly permissions: string;
    readonly networkPolicy: "disabled";
    readonly budget: {
      readonly maxTokens: number;
      readonly timeoutMs: number;
    };
  };
  readonly containment: {
    readonly command: string;
    readonly network: "disabled";
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
    readonly conditions: JsonRecord;
    readonly environmentProfileHash?: string;
    readonly promptDelta?: {
      readonly baselineHash: string;
      readonly krnHash: string;
      readonly deltaHash: string;
      readonly deltaBytes: number;
      readonly packetOnlyByConstruction: true;
    };
    readonly baseline?: CommandResult;
    readonly krn?: CommandResult;
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

const readStringArray = (value: unknown): readonly string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : [];

const nestedRecord = (value: JsonRecord | undefined, key: string): JsonRecord | undefined =>
  value !== undefined && isRecord(value[key]) ? value[key] : undefined;

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
    missingReason(typeof task?.["objective"] === "string" && task["objective"].includes(manifest.projectId), "packet task is not bound to the manifest project")
  ].filter((reason): reason is string => reason !== undefined);

  return { reasons, ...(body === undefined ? {} : { body }), ...(checksum === undefined ? {} : { checksum }) };
};

const packetAuthorityReasons = (
  body: JsonRecord | undefined,
  requiredDecisionIds: readonly string[]
): readonly string[] => {
  const governingDecisionIds = readStringArray(body?.["governingDecisionIds"]);
  const missingRequired = requiredDecisionIds.filter((id) => !governingDecisionIds.includes(id));
  const abstention = nestedRecord(body, "abstentionScore");
  return [
    ...(missingRequired.length === 0 ? [] : [`packet lacks task-relevant governing decisions: ${missingRequired.join(", ")}`]),
    ...(abstention?.["status"] === "ready" ? [] : ["packet abstains or is not ready for the trial"])
  ];
};

export const validateTrialPacket = (
  packet: unknown,
  manifest: Pick<PairedTrialManifest, "runId" | "projectId" | "taskId" | "requiredDecisionIds">
): TrialPacketValidation => {
  const root = isRecord(packet) ? packet : undefined;
  const shape = packetShapeReasons(root, manifest);
  const reasons = [...shape.reasons, ...packetAuthorityReasons(shape.body, manifest.requiredDecisionIds)];
  return {
    valid: reasons.length === 0,
    reasons,
    ...(shape.checksum === undefined ? {} : { checksum: shape.checksum })
  };
};

const treeEntries = async (root: string, current = root): Promise<readonly string[]> => {
  const entries = await readdir(current, { withFileTypes: true });
  const paths: string[] = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolute = join(current, entry.name);
    const path = relative(root, absolute);
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are not allowed in a trial source: ${path}`);
    if (entry.isDirectory()) paths.push(...await treeEntries(root, absolute));
    else if (entry.isFile()) paths.push(path);
    else throw new Error(`Unsupported source entry in trial: ${path}`);
  }

  return paths;
};

export const hashTree = async (root: string): Promise<string> => {
  const hash = createHash("sha256");
  for (const path of await treeEntries(root)) {
    hash.update(path);
    hash.update("\0");
    hash.update(await readFile(join(root, path)));
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

const allowlistedEnvironment = (sandboxRoot: string, targetRoot: string): NodeJS.ProcessEnv => ({
  PATH: process.env.PATH,
  CI: "1",
  NODE_ENV: "test",
  HOME: sandboxRoot,
  TMPDIR: sandboxRoot,
  TMP: sandboxRoot,
  TEMP: sandboxRoot,
  KRN_TRIAL_TARGET_ROOT: targetRoot,
  ...(process.env.KRN_TRIAL_OPENAI_API_KEY === undefined
    ? {}
    : { OPENAI_API_KEY: process.env.KRN_TRIAL_OPENAI_API_KEY })
});

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

const materializeTarget = async (sourceRoot: string, trialRoot: string, env: NodeJS.ProcessEnv): Promise<{ readonly root: string; readonly commit: string; readonly treeHash: string }> => {
  const root = join(trialRoot, "target");
  await mkdir(trialRoot, { recursive: true });
  await cp(sourceRoot, root, { recursive: true, force: false, errorOnExist: true });
  const commit = await gitCommit(root, env);
  return { root, commit, treeHash: await hashTree(root) };
};

const toolAvailable = async (command: string, env: NodeJS.ProcessEnv): Promise<boolean> =>
  (await runProcess(command, ["--version"], { cwd: process.cwd(), env, timeoutMs: 10_000 })).exitCode === 0;

const trialConditions = (manifest: PairedTrialManifest): JsonRecord => ({
  codexCli: manifest.codex.cliVersion,
  model: manifest.codex.args[manifest.codex.args.indexOf("--model") + 1] ?? "unknown",
  profileHash: manifest.codex.profileHash,
  permissions: manifest.codex.permissions,
  networkPolicy: manifest.codex.networkPolicy,
  budget: manifest.codex.budget,
  armOrder: ["baseline", "krn"],
  checker: manifest.checker,
  containment: manifest.containment
});

const environmentProfileHash = (sandboxRoot: string): string => sha256(serializedJson({
  PATH: process.env.PATH ?? "",
  CI: "1",
  NODE_ENV: "test",
  HOME: "{sandboxRoot}",
  TMPDIR: "{sandboxRoot}",
  TMP: "{sandboxRoot}",
  TEMP: "{sandboxRoot}",
  network: "disabled",
  sandboxRootPresent: sandboxRoot.length > 0
}));

const artifactHash = (artifact: Omit<TrackedTrialArtifact, "artifactHash">): string => sha256(serializedJson(artifact));

export const buildTrackedTrialArtifact = (
  artifact: Omit<TrackedTrialArtifact, "artifactHash">
): TrackedTrialArtifact => ({ ...artifact, artifactHash: artifactHash(artifact) });

export const runTrackedPairedTrial = async (input: {
  readonly manifest: PairedTrialManifest;
  readonly sourceRoot: string;
  readonly checkerRoot: string;
  readonly packet: unknown;
  readonly packetFetchFailure?: string;
}): Promise<TrackedTrialArtifact> => {
  const manifestHash = sha256(serializedJson(input.manifest));
  const sourceTreeHash = await hashTree(input.sourceRoot);
  const packetValidation = validateTrialPacket(input.packet, input.manifest);
  const conditions = trialConditions(input.manifest);
  const blocked = async (status: TrackedTrialStatus, reason: string): Promise<TrackedTrialArtifact> =>
    buildTrackedTrialArtifact({
      kind: "krn.pairedLiveCodexRepairArtifact.v1",
      status,
      manifestHash,
      sourceTreeHash,
      runId: input.manifest.runId,
      packet: { ...(packetValidation.checksum === undefined ? {} : { checksum: packetValidation.checksum }), validation: { ...packetValidation, reasons: [...packetValidation.reasons, reason] } },
      execution: { conditions },
      proof: {
        proves: ["the tracked runner refused to claim a live outcome without its prerequisite"],
        doesNotProve: ["a live Codex repair", "a KRN causal win", "product readiness"]
      }
    });

  if (input.packetFetchFailure !== undefined) return blocked("unverified", input.packetFetchFailure);
  if (!packetValidation.valid) return blocked("invalid", "packet validation failed closed");
  if (!await toolAvailable(input.manifest.containment.command, process.env)) return blocked("blocked", "explicit containment command is unavailable");
  if (!await toolAvailable(input.manifest.codex.command, process.env)) return blocked("blocked", "pinned Codex CLI is unavailable");
  if (process.env.KRN_TRIAL_OPENAI_API_KEY === undefined) return blocked("blocked", "explicit trial Codex credentials are unavailable");

  const trialRoot = await mkdtemp(join(tmpdir(), "krn-tracked-paired-trial-"));
  const sandboxRoot = await mkdtemp(join(trialRoot, "sandbox-"));
  try {
    const baseline = await materializeTarget(input.sourceRoot, join(trialRoot, "baseline"), allowlistedEnvironment(sandboxRoot, trialRoot));
    const krn = await materializeTarget(input.sourceRoot, join(trialRoot, "krn"), allowlistedEnvironment(sandboxRoot, trialRoot));
    if (baseline.treeHash !== krn.treeHash) return blocked("invalid", "materialized target trees are not byte-identical");

    const prompts = buildPairedRepairPrompts({ task: input.manifest.task, decisionPacket: input.packet });
    const runArm = async (target: typeof baseline, prompt: string): Promise<CommandResult> => {
      const args = input.manifest.codex.args.map((argument) => replaceArgument(argument, { "{prompt}": prompt, "{targetRoot}": target.root }));
      return runProcess(input.manifest.containment.command, ["--die-with-parent", "--unshare-net", "--bind", target.root, target.root, "--bind", sandboxRoot, sandboxRoot, "--", input.manifest.codex.command, ...args], {
        cwd: target.root,
        env: allowlistedEnvironment(sandboxRoot, target.root),
        timeoutMs: input.manifest.codex.budget.timeoutMs
      });
    };
    const baselineResult = await runArm(baseline, prompts.baseline);
    const krnResult = await runArm(krn, prompts.krn);
    const score = await runPairedRepairChecker({
      baseline: { targetRoot: baseline.root, checkerRoot: input.checkerRoot, initialCommit: baseline.commit },
      krn: { targetRoot: krn.root, checkerRoot: input.checkerRoot, initialCommit: krn.commit }
    });
    const status: TrackedTrialStatus = score.outcome === "invalid" ? "invalid" : "passed";
    return buildTrackedTrialArtifact({
      kind: "krn.pairedLiveCodexRepairArtifact.v1",
      status,
      manifestHash,
      sourceTreeHash,
      baselineTreeHash: baseline.treeHash,
      krnTreeHash: krn.treeHash,
      runId: input.manifest.runId,
      packet: { ...(packetValidation.checksum === undefined ? {} : { checksum: packetValidation.checksum }), validation: packetValidation },
      execution: {
        conditions,
        environmentProfileHash: environmentProfileHash(sandboxRoot),
        promptDelta: prompts.delta,
        baseline: baselineResult,
        krn: krnResult
      },
      score,
      proof: {
        proves: ["both arms were materialized from one source tree", "both arms ran under the manifest containment boundary", "held-out checker produced a mechanical outcome", "the artifact hash binds manifest, packet, execution, and score"],
        doesNotProve: ["arbitrary-repository portability", "broad model obedience", "source truth", "product readiness"]
      }
    });
  } finally {
    await rm(trialRoot, { recursive: true, force: true });
  }
};

const loadTrackedTrialManifest = async (path: string): Promise<PairedTrialManifest> => {
  const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!isRecord(parsed) || parsed["kind"] !== "krn.pairedLiveCodexRepairManifest.v1") throw new Error("Invalid tracked paired-trial manifest");
  return parsed as PairedTrialManifest;
};

export const defaultTrackedTrialManifestPath = (): string =>
  fileURLToPath(new URL("../../../../../tests/fixtures/paired-live-codex-repair/manifest.json", import.meta.url));

const readMcpStructuredContent = (stdout: string): unknown => {
  for (const line of stdout.split("\n").reverse()) {
    if (line.trim().length === 0) continue;
    try {
      const message: unknown = JSON.parse(line);
      if (!isRecord(message) || !isRecord(message["result"])) continue;
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
  const result = await runProcess("pnpm", ["exec", "tsx", serverPath], {
    cwd: checkerRoot,
    env: {
      PATH: process.env.PATH,
      ...(process.env.KRN_DATABASE_URL === undefined ? {} : { KRN_DATABASE_URL: process.env.KRN_DATABASE_URL })
    },
    timeoutMs: 30_000,
    input: [
      JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "krn-tracked-paired-trial", version: "1" } } }),
      JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "krn_decision_packet", arguments: { runId } } })
    ].join("\n") + "\n"
  });
  const packet = readMcpStructuredContent(result.stdout);
  if (result.exitCode !== 0 || packet === undefined) {
    return { failure: `MCP DecisionPacket fetch was unavailable: ${result.stderr.trim() || "no structured packet response"}` };
  }
  return { packet };
};

export const runTrackedTrialCommand = async (manifestPath = defaultTrackedTrialManifestPath()): Promise<TrackedTrialArtifact> => {
  const manifest = await loadTrackedTrialManifest(manifestPath);
  const checkerRoot = resolve(manifestPath, "../../../..");
  const sourceRoot = resolve(checkerRoot, manifest.sourcePath);
  const packetResult = await fetchDecisionPacketViaMcp(checkerRoot, manifest.runId);
  return runTrackedPairedTrial({
    manifest,
    sourceRoot,
    checkerRoot,
    packet: packetResult.packet,
    ...(packetResult.failure === undefined ? {} : { packetFetchFailure: packetResult.failure })
  });
};
