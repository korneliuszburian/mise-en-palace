import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { EvalCandidateProposal } from "@krn/core";
import {
  createBoundedStreamCollector,
  startCommandDeadline
} from "../../bounded-command-execution.js";

export type PairedRepairOutcome = "win" | "tie" | "loss" | "invalid";
export type PairedRepairUsefulnessOutcome = "helped" | "neutral" | "hurt" | "unknown";
export type HeldOutObservation = {
  readonly threw: boolean;
  readonly accepted: boolean;
  readonly savedUserDelta: number;
  readonly resultState: string;
};

export type CommandResult = {
  readonly command: string;
  readonly args: readonly string[];
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly stdoutStoredBytes?: Uint8Array;
  readonly stdoutTotalByteCount?: number;
  readonly stderrStoredBytes?: Uint8Array;
  readonly stderrTotalByteCount?: number;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly durationMs?: number;
};

export type TargetChangeManifest = {
  readonly status: "known" | "unknown";
  readonly trackedFiles: readonly string[];
  readonly untrackedFiles: readonly string[];
  readonly changedFiles: readonly string[];
  readonly forbiddenFiles: readonly string[];
  readonly statusOutput: string;
};

export type HeldOutCheck = {
  readonly name:
  | "preflight"
  | "invalid_json"
  | "missing_email"
  | "invalid_role"
  | "unknown_first"
  | "finite_result_state"
  | "focused_tests"
  | "forbidden_files"
  | "target_test"
  | "target_typecheck"
  | "target_diff_check"
  | "held_out_runtime";
  readonly passed: boolean;
  readonly details: string;
};

export type HeldOutArmScore = {
  readonly status: "pass" | "fail" | "invalid";
  readonly score: number;
  readonly checks: readonly HeldOutCheck[];
  readonly changedFiles: readonly string[];
  readonly changeManifest?: TargetChangeManifest;
  readonly commands?: {
    readonly test: CommandResult;
    readonly typecheck: CommandResult;
    readonly diffCheck: CommandResult;
  };
  readonly runtimeCommand?: CommandResult;
};

export type PairedRepairScore = {
  readonly outcome: PairedRepairOutcome;
  readonly baseline: HeldOutArmScore;
  readonly krn: HeldOutArmScore;
  readonly reason: string;
};

export const pairedRepairUsefulnessOutcome = (
  outcome: PairedRepairOutcome
): PairedRepairUsefulnessOutcome => {
  switch (outcome) {
    case "win":
      return "helped";
    case "tie":
      return "neutral";
    case "loss":
      return "hurt";
    case "invalid":
      return "unknown";
  }
};

export const pairedRepairEvalCandidate = (input: {
  readonly score: PairedRepairScore;
  readonly runId: string;
  readonly packetChecksum: string;
  readonly evidenceRefs: readonly string[];
  readonly createdAt: string;
  readonly projectId?: string;
}): EvalCandidateProposal => ({
  id: `paired-target-repair:${input.runId}`,
  ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
  status: "candidate",
  title: `Paired target repair outcome: ${input.score.outcome}`,
  scenario: "weak-json-boundary-typescript current-shell Codex repair",
  expectedSignal: "Only a predeclared KRN win may be classified as helped.",
  sourceEvidence: [...input.evidenceRefs],
  metadata: {
    evaluationKind: "paired_live_codex_repair",
    outcome: input.score.outcome,
    usefulnessOutcome: pairedRepairUsefulnessOutcome(input.score.outcome),
    baselineScore: input.score.baseline.score,
    krnScore: input.score.krn.score,
    baselineStatus: input.score.baseline.status,
    krnStatus: input.score.krn.status,
    packetChecksum: input.packetChecksum,
    packetEvidenceRef: `packet:${input.packetChecksum}`,
    evidenceRefs: [...input.evidenceRefs],
    doesNotProve: [
      "A single paired trial does not prove arbitrary-repository portability.",
      "A tie, loss, or invalid trial does not prove memory usefulness.",
      "The candidate is reviewable evidence and does not mutate MemoryRecord or SourceClaim truth."
    ]
  },
  createdAt: input.createdAt
});

export type PairedRepairPrompts = {
  readonly baseline: string;
  readonly krn: string;
  readonly delta: {
    readonly generated: true;
    readonly baselineHash: string;
    readonly krnHash: string;
    readonly deltaHash: string;
    readonly deltaBytes: number;
    readonly packetOnlyByConstruction: true;
  };
};

type TargetSourceFiles = Readonly<Record<string, string | undefined>>;

export type TargetRepairScoreInput = {
  readonly sourceFiles: TargetSourceFiles;
  readonly changedFiles: readonly string[];
  readonly changeManifest?: TargetChangeManifest;
  readonly commands: {
    readonly test: CommandResult;
    readonly typecheck: CommandResult;
    readonly diffCheck: CommandResult;
  };
  readonly runtimeCommand?: CommandResult;
  readonly runtimeAvailable: boolean;
  readonly observations: {
    readonly invalidJson: HeldOutObservation;
    readonly missingEmail: HeldOutObservation;
    readonly invalidRole: HeldOutObservation;
  };
};

export type HeldOutCheckerInput = {
  readonly targetRoot: string;
  readonly checkerRoot: string;
  readonly initialCommit: string;
};

const basePrompt = (task: string): string => [
  "Repair the externally observable user-creation boundary in this controlled TypeScript target.",
  "Read AGENTS.md and docs/repair-contract.md first. Work only in the allowed target files and do not touch the parent repository, other repos, generated caches, secrets, or network.",
  "Use the task and target contract to make the smallest surgical repair. Meet every observable acceptance requirement without assuming an implementation shape. Preserve the existing package shape; do not add frameworks or unrelated cleanup.",
  "Run the target test command and TypeScript typecheck before finishing. Do not commit or push.",
  "At the end, report changed files, commands and outcomes, what the checks prove, and what they do not prove. Do not claim product readiness.",
  `Task: ${task}`
].join("\n");

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

export const buildPairedRepairPrompts = (input: {
  readonly task: string;
  readonly decisionPacket: unknown;
}): PairedRepairPrompts => {
  const baseline = basePrompt(input.task);
  const krn = [
    baseline,
    "",
    "The KRN arm receives this read-only DecisionPacket through the krn_decision_packet MCP transport. Treat it as bounded context only; obey its abstention/evidence-gap and non-proof fields. Do not infer authority from packet receipt.",
    "BEGIN KRN DECISION PACKET",
    JSON.stringify(input.decisionPacket),
    "END KRN DECISION PACKET"
  ].join("\n");

  return {
    baseline,
    krn,
    delta: {
      generated: true,
      baselineHash: sha256(baseline),
      krnHash: sha256(krn),
      deltaHash: sha256(krn.slice(baseline.length)),
      deltaBytes: Buffer.byteLength(krn) - Buffer.byteLength(baseline),
      packetOnlyByConstruction: true
    }
  };
};

const passed = (result: CommandResult): boolean => result.exitCode === 0;

const observationPassed = (observation: HeldOutObservation): boolean =>
  !observation.threw &&
  !observation.accepted &&
  observation.savedUserDelta === 0 &&
  observation.resultState !== "null" &&
  observation.resultState !== "undefined";

const source = (files: TargetSourceFiles, path: string): string => files[path] ?? "";

const checkUnknownFirst = (files: TargetSourceFiles): HeldOutCheck => {
  const config = source(files, "src/config.ts");
  const hasUnknownBoundary =
    /parseJsonConfig\s*\([^)]*\)\s*:\s*unknown/.test(config) ||
    /value\s*:\s*unknown/.test(config);
  const hasAnyBoundary = /parseJsonConfig\s*\([^)]*\)\s*:\s*any/.test(config);

  return {
    name: "unknown_first",
    passed: hasUnknownBoundary && !hasAnyBoundary,
    details: hasUnknownBoundary && !hasAnyBoundary
      ? "JSON boundary is unknown-first."
      : "External JSON output is not proven unknown-first."
  };
};

const checkFiniteResult = (files: TargetSourceFiles): HeldOutCheck => {
  const service = source(files, "src/userService.ts");
  const hasNamedResult = /(?:export\s+)?type\s+CreateUserResult\b/.test(service);
  const hasNullableReturn = /CreatedUser\s*\|\s*null/.test(service);
  const hasDiscriminator = /\b(?:ok|kind|status)\s*[:?]/.test(service);
  const isPassed = hasNamedResult && hasDiscriminator && !hasNullableReturn;

  return {
    name: "finite_result_state",
    passed: isPassed,
    details: isPassed
      ? "Create-user output has a named finite result state."
      : "Create-user output still relies on an unproven nullable or implicit state."
  };
};

const stringifiedObjectBodies = (sourceText: string): readonly string[] =>
  [...sourceText.matchAll(/JSON\.stringify\s*\(\s*\{([\s\S]*?)\}\s*\)/g)]
    .map((match) => match[1] ?? "");

const checkFocusedTests = (
  files: TargetSourceFiles,
  changedFiles: readonly string[]
): HeldOutCheck => {
  const tests = source(files, "tests/userService.test.ts");
  const objectBodies = stringifiedObjectBodies(tests);
  const hasBoundaryCall = /\bcreateUserFromJson\s*\(/.test(tests);
  const hasMalformedJson = /(["'`])\{\1/.test(tests);
  const hasMissingEmail = objectBodies.some((body) => !/\bemail\s*:/.test(body));
  const hasUnsupportedRole = objectBodies.some((body) => {
    const role = body.match(/\brole\s*:\s*(["'`])([^"'`]+)\1/);
    return role !== null && role[2] !== "admin" && role[2] !== "member";
  });
  const changedFocusedTest = changedFiles.includes("tests/userService.test.ts");
  const isPassed = changedFocusedTest && hasBoundaryCall &&
    hasMalformedJson && hasMissingEmail && hasUnsupportedRole;

  return {
    name: "focused_tests",
    passed: isPassed,
    details: isPassed
      ? "Focused tests exercise malformed JSON, missing email, and unsupported role inputs."
      : "Focused invalid-input test coverage is incomplete."
  };
};

const checkAllowedFiles = (changedFiles: readonly string[]): HeldOutCheck => {
  const forbidden = changedFiles.filter((path) =>
    !path.startsWith("src/") &&
    !path.startsWith("tests/") &&
    !path.startsWith("docs/")
  );

  return {
    name: "forbidden_files",
    passed: forbidden.length === 0,
    details: forbidden.length === 0
      ? "All changed files are inside the target write boundary."
      : `Forbidden changed files: ${forbidden.join(", ")}`
  };
};

const knownChangeManifest = (changedFiles: readonly string[]): TargetChangeManifest => {
  const uniqueFiles = [...new Set(changedFiles)];
  const forbiddenFiles = uniqueFiles.filter((path) =>
    !path.startsWith("src/") &&
    !path.startsWith("tests/") &&
    !path.startsWith("docs/")
  );

  return {
    status: "known",
    trackedFiles: uniqueFiles,
    untrackedFiles: [],
    changedFiles: uniqueFiles,
    forbiddenFiles,
    statusOutput: "synthetic test manifest"
  };
};

const checkPreflight = (manifest: TargetChangeManifest): HeldOutCheck => {
  const isPassed = manifest.status === "known" && manifest.forbiddenFiles.length === 0;

  return {
    name: "preflight",
    passed: isPassed,
    details: isPassed
      ? "Target change manifest was captured before target execution."
      : manifest.status === "unknown"
        ? "Target change manifest could not be captured before target execution."
        : `Forbidden target changes were detected before execution: ${manifest.forbiddenFiles.join(", ")}`
  };
};

export const scoreTargetRepair = (
  input: TargetRepairScoreInput
): HeldOutArmScore => {
  const changeManifest = input.changeManifest ?? knownChangeManifest(input.changedFiles);
  const checks: HeldOutCheck[] = [
    checkPreflight(changeManifest),
    {
      name: "invalid_json",
      passed: observationPassed(input.observations.invalidJson),
      details: observationPassed(input.observations.invalidJson)
        ? "Malformed JSON is rejected without saving a user."
        : "Malformed JSON was thrown, accepted, or produced a non-finite result."
    },
    {
      name: "missing_email",
      passed: observationPassed(input.observations.missingEmail),
      details: observationPassed(input.observations.missingEmail)
        ? "Missing email is rejected without saving a user."
        : "Missing email was accepted, thrown, or produced a non-finite result."
    },
    {
      name: "invalid_role",
      passed: observationPassed(input.observations.invalidRole),
      details: observationPassed(input.observations.invalidRole)
        ? "Invalid role is rejected without saving a user."
        : "Invalid role was accepted, thrown, or produced a non-finite result."
    },
    checkUnknownFirst(input.sourceFiles),
    checkFiniteResult(input.sourceFiles),
    checkFocusedTests(input.sourceFiles, input.changedFiles),
    checkAllowedFiles(input.changedFiles),
    {
      name: "target_test",
      passed: passed(input.commands.test),
      details: passed(input.commands.test) ? "Target test command passed." : "Target test command failed."
    },
    {
      name: "target_typecheck",
      passed: passed(input.commands.typecheck),
      details: passed(input.commands.typecheck) ? "Target typecheck passed." : "Target typecheck failed."
    },
    {
      name: "target_diff_check",
      passed: passed(input.commands.diffCheck),
      details: passed(input.commands.diffCheck) ? "Target diff check passed." : "Target diff check failed."
    },
    {
      name: "held_out_runtime",
      passed: input.runtimeAvailable,
      details: input.runtimeAvailable
        ? "Held-out checker compiled and exercised the target outside its root."
        : "Held-out checker could not compile and exercise the target."
    }
  ];
  const requiredForValidity = new Set<HeldOutCheck["name"]>([
    "preflight",
    "forbidden_files",
    "target_test",
    "target_typecheck",
    "target_diff_check",
    "held_out_runtime"
  ]);
  const behaviorChecks = new Set<HeldOutCheck["name"]>([
    "invalid_json",
    "missing_email",
    "invalid_role"
  ]);
  const repairContractChecks = new Set<HeldOutCheck["name"]>([
    ...behaviorChecks,
    "unknown_first",
    "finite_result_state",
    "focused_tests"
  ]);
  const invalid = checks.some((check) =>
    requiredForValidity.has(check.name) && !check.passed
  );
  const satisfiesRepairContract = checks.every((check) =>
    !repairContractChecks.has(check.name) || check.passed
  );
  const score = checks.filter((check) =>
    behaviorChecks.has(check.name) && check.passed
  ).length;

  return {
    status: invalid
      ? "invalid"
      : satisfiesRepairContract ? "pass" : "fail",
    score,
    checks,
    changedFiles: [...input.changedFiles],
    changeManifest,
    commands: input.commands,
    ...(input.runtimeCommand === undefined ? {} : { runtimeCommand: input.runtimeCommand })
  };
};

export const scorePairedRepairs = (input: {
  readonly baseline: HeldOutArmScore;
  readonly krn: HeldOutArmScore;
}): PairedRepairScore => {
  if (input.baseline.status === "invalid" || input.krn.status === "invalid") {
    return {
      outcome: "invalid",
      baseline: input.baseline,
      krn: input.krn,
      reason: "At least one arm failed the checker validity boundary."
    };
  }

  if (input.baseline.status === "fail" && input.krn.status === "pass") {
    return {
      outcome: "win",
      baseline: input.baseline,
      krn: input.krn,
      reason: "KRN satisfied the repair contract while the equal-contract baseline did not."
    };
  }

  if (input.baseline.status === "pass" && input.krn.status === "fail") {
    return {
      outcome: "loss",
      baseline: input.baseline,
      krn: input.krn,
      reason: "KRN failed the repair contract while the equal-contract baseline satisfied it."
    };
  }

  if (input.baseline.status === "fail" && input.krn.status === "fail") {
    return {
      outcome: "invalid",
      baseline: input.baseline,
      krn: input.krn,
      reason: "Neither arm satisfied the repair contract."
    };
  }

  if (input.krn.score > input.baseline.score) {
    return {
      outcome: "win",
      baseline: input.baseline,
      krn: input.krn,
      reason: "KRN passed more held-out checks than the equal-contract baseline."
    };
  }

  if (input.krn.score < input.baseline.score) {
    return {
      outcome: "loss",
      baseline: input.baseline,
      krn: input.krn,
      reason: "KRN passed fewer held-out checks than the equal-contract baseline."
    };
  }

  return {
    outcome: "tie",
    baseline: input.baseline,
    krn: input.krn,
    reason: "Both arms passed the same number of held-out checks."
  };
};

export type RunCommandOptions = {
  readonly env?: NodeJS.ProcessEnv;
  readonly timeoutMs?: number;
  readonly input?: string;
};

export const runCommand = (
  command: string,
  args: readonly string[],
  cwd: string,
  options: RunCommandOptions = {}
): Promise<CommandResult> => new Promise((resolve) => {
  const startedAtMilliseconds = Date.now();
  const startedAt = new Date(startedAtMilliseconds).toISOString();
  const child = spawn(command, args, {
    cwd,
    env: options.env,
    stdio: ["pipe", "pipe", "pipe"]
  });
  const stdoutCapture = createBoundedStreamCollector();
  const stderrCapture = createBoundedStreamCollector();
  let stdout = "";
  let stderr = "";
  let settled = false;
  let timedOut = false;
  const clearCommandDeadline = startCommandDeadline(
    child,
    options.timeoutMs,
    () => {
      timedOut = true;
    }
  );

  const finish = (exitCode: number | null): void => {
    if (settled) return;
    settled = true;
    clearCommandDeadline();
    const stdoutSnapshot = stdoutCapture.snapshot();
    const stderrSnapshot = stderrCapture.snapshot();
    const commandResult: CommandResult = {
      command,
      args: [...args],
      exitCode: timedOut ? null : exitCode,
      stdout,
      stderr: timedOut ? `${stderr}command timed out` : stderr,
      stdoutTotalByteCount: stdoutSnapshot.totalByteCount,
      stderrTotalByteCount: stderrSnapshot.totalByteCount,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAtMilliseconds
    };

    Object.defineProperties(commandResult, {
      stdoutStoredBytes: {
        value: stdoutSnapshot.bytes,
        enumerable: false
      },
      stderrStoredBytes: {
        value: stderrSnapshot.bytes,
        enumerable: false
      }
    });

    resolve(commandResult);
  };

  if (options.input === undefined) child.stdin.end();
  else child.stdin.end(options.input);

  child.stdout.on("data", (chunk: Buffer) => {
    stdoutCapture.append(chunk);
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk: Buffer) => {
    stderrCapture.append(chunk);
    stderr += chunk.toString();
  });
  child.on("error", (error: Error) => {
    stderr = `${stderr}${error.message}`;
    finish(null);
  });
  child.on("close", finish);
});

const targetEnvironment = (sandboxRoot: string): NodeJS.ProcessEnv => ({
  PATH: process.env.PATH,
  CI: process.env.CI ?? "1",
  NODE_ENV: "test",
  HOME: sandboxRoot,
  TMPDIR: sandboxRoot,
  TMP: sandboxRoot,
  TEMP: sandboxRoot
});

const targetCommandTimeoutMs = 120_000;

const targetPreflight = async (input: HeldOutCheckerInput): Promise<TargetChangeManifest> => {
  const [status, tracked, untracked] = await Promise.all([
    runCommand("git", ["status", "--short", "--untracked-files=all"], input.targetRoot),
    runCommand("git", ["diff", input.initialCommit, "--name-only"], input.targetRoot),
    runCommand("git", ["ls-files", "--others", "--exclude-standard"], input.targetRoot)
  ]);
  const trackedFiles = tracked.exitCode === 0
    ? tracked.stdout.split("\n").map((path) => path.trim()).filter(Boolean)
    : [];
  const untrackedFiles = untracked.exitCode === 0
    ? untracked.stdout.split("\n").map((path) => path.trim()).filter(Boolean)
    : [];
  const changedFiles = [...new Set([...trackedFiles, ...untrackedFiles])];
  const forbiddenFiles = changedFiles.filter((path) =>
    !path.startsWith("src/") &&
    !path.startsWith("tests/") &&
    !path.startsWith("docs/")
  );
  const statusKnown = status.exitCode === 0 && tracked.exitCode === 0 && untracked.exitCode === 0;

  return {
    status: statusKnown ? "known" : "unknown",
    trackedFiles,
    untrackedFiles,
    changedFiles,
    forbiddenFiles,
    statusOutput: status.stdout
  };
};

const readTargetSourceFiles = async (
  targetRoot: string
): Promise<TargetSourceFiles> => Object.fromEntries(
  await Promise.all([
    "src/config.ts",
    "src/userService.ts",
    "tests/userService.test.ts"
  ].map(async (path) => {
    try {
      return [path, await readFile(join(targetRoot, path), "utf8")] as const;
    } catch {
      return [path, undefined] as const;
    }
  }))
);

const unknownObservation = (): HeldOutObservation => ({
  threw: true,
  accepted: false,
  savedUserDelta: 0,
  resultState: "unavailable"
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const runtimeWorkerMarker = "KRN_HELD_OUT_RUNTIME:";

export type HeldOutRuntimePermissionFlag = "--permission" | "--experimental-permission";

export const selectHeldOutRuntimePermissionFlag = (
  flags: ReadonlySet<string> = process.allowedNodeEnvironmentFlags
): HeldOutRuntimePermissionFlag | undefined => {
  if (flags.has("--permission")) return "--permission";
  if (flags.has("--experimental-permission")) return "--experimental-permission";
  return undefined;
};

const runtimeWorkerSource = `
const marker = "KRN_HELD_OUT_RUNTIME:";
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const observeInput = (createUser, listUsers, raw) => {
  const before = listUsers();
  const beforeCount = Array.isArray(before) ? before.length : 0;
  try {
    const result = createUser(raw, {});
    const after = listUsers();
    const afterCount = Array.isArray(after) ? after.length : beforeCount;
    const resultRecord = isRecord(result) ? result : undefined;
    const accepted = resultRecord?.ok === true || resultRecord?.kind === "created" || resultRecord?.status === "created";
    const resultState = resultRecord === undefined
      ? String(result)
      : typeof resultRecord.ok === "boolean"
        ? "ok:" + String(resultRecord.ok)
        : typeof resultRecord.kind === "string"
          ? "kind:" + resultRecord.kind
          : typeof resultRecord.status === "string"
            ? "status:" + resultRecord.status
            : "object";
    return { threw: false, accepted, savedUserDelta: afterCount - beforeCount, resultState };
  } catch {
    return { threw: true, accepted: false, savedUserDelta: 0, resultState: "thrown" };
  }
};
try {
  const moduleValue = await import(process.argv[2]);
  const service = isRecord(moduleValue) ? moduleValue : {};
  const createUser = service.createUserFromJson;
  const listUsers = service.listSavedUsers;
  if (typeof createUser !== "function" || typeof listUsers !== "function") {
    throw new Error("held-out target exports are unavailable");
  }
  const observations = {
    invalidJson: observeInput(createUser, listUsers, "{"),
    missingEmail: observeInput(createUser, listUsers, JSON.stringify({ role: "admin" })),
    invalidRole: observeInput(createUser, listUsers, JSON.stringify({ email: "held-out@example.com", role: "owner" }))
  };
  process.stdout.write(marker + JSON.stringify({ runtimeAvailable: true, observations }) + "\\n");
} catch {
  process.stdout.write(marker + JSON.stringify({ runtimeAvailable: false }) + "\\n");
  process.exitCode = 1;
}
`;

type RuntimeObservations = {
  readonly invalidJson: HeldOutObservation;
  readonly missingEmail: HeldOutObservation;
  readonly invalidRole: HeldOutObservation;
};

const unknownRuntimeObservations = (): RuntimeObservations => ({
  invalidJson: unknownObservation(),
  missingEmail: unknownObservation(),
  invalidRole: unknownObservation()
});

export const runHeldOutRuntimeWorker = async (
  compileRoot: string,
  checkerRoot: string,
  sandboxRoot: string
): Promise<{
  readonly command: CommandResult;
  readonly runtimeAvailable: boolean;
  readonly observations: RuntimeObservations;
}> => {
  const permissionFlag = selectHeldOutRuntimePermissionFlag();
  if (permissionFlag === undefined) {
    const now = new Date().toISOString();
    return {
      command: {
        command: process.execPath,
        args: [],
        exitCode: null,
        stdout: "",
        stderr: "held-out runtime unavailable: Node filesystem permissions are unsupported",
        startedAt: now,
        completedAt: now,
        durationMs: 0
      },
      runtimeAvailable: false,
      observations: unknownRuntimeObservations()
    };
  }
  const workerPath = join(sandboxRoot, "held-out-runtime-worker.mjs");
  await writeFile(workerPath, runtimeWorkerSource, { encoding: "utf8", flag: "wx", mode: 0o600 });
  const [canonicalCompileRoot, canonicalWorkerPath] = await Promise.all([
    realpath(compileRoot),
    realpath(workerPath)
  ]);
  const targetModuleUrl = `${pathToFileURL(join(canonicalCompileRoot, "src/userService.js")).href}?checker=${Date.now()}`;
  const command = await runCommand(
    process.execPath,
    [
      permissionFlag,
      `--allow-fs-read=${canonicalCompileRoot}`,
      `--allow-fs-read=${canonicalWorkerPath}`,
      canonicalWorkerPath,
      targetModuleUrl
    ],
    checkerRoot,
    {
      env: targetEnvironment(sandboxRoot),
      timeoutMs: targetCommandTimeoutMs
    }
  );
  const outputLines = command.stdout.split("\n");
  let markerLine: string | undefined;
  for (const line of outputLines.reverse()) {
    if (line.startsWith(runtimeWorkerMarker)) {
      markerLine = line;
      break;
    }
  }

  if (command.exitCode !== 0 || markerLine === undefined) {
    return { command, runtimeAvailable: false, observations: unknownRuntimeObservations() };
  }

  try {
    const parsed: unknown = JSON.parse(markerLine.slice(runtimeWorkerMarker.length));
    if (!isRecord(parsed) || parsed["runtimeAvailable"] !== true || !isRecord(parsed["observations"])) {
      throw new Error("Malformed held-out runtime envelope");
    }
    const observations = parsed["observations"];
    if (!isRecord(observations) ||
      !isRecord(observations["invalidJson"]) ||
      !isRecord(observations["missingEmail"]) ||
      !isRecord(observations["invalidRole"])) {
      throw new Error("Malformed held-out observations");
    }

    return {
      command,
      runtimeAvailable: true,
      observations: {
        invalidJson: observations["invalidJson"] as HeldOutObservation,
        missingEmail: observations["missingEmail"] as HeldOutObservation,
        invalidRole: observations["invalidRole"] as HeldOutObservation
      }
    };
  } catch {
    return { command, runtimeAvailable: false, observations: unknownRuntimeObservations() };
  }
};

export const runHeldOutTargetRepairChecker = async (
  input: HeldOutCheckerInput
): Promise<HeldOutArmScore> => {
  const preflight = await targetPreflight(input);
  const sourceFiles = await readTargetSourceFiles(input.targetRoot);
  const skipped = (command: string): CommandResult => ({
    command,
    args: [],
    exitCode: null,
    stdout: "",
    stderr: "skipped because target preflight was invalid",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: 0
  });

  if (preflight.status === "unknown" || preflight.forbiddenFiles.length > 0) {
    return scoreTargetRepair({
      sourceFiles,
      changedFiles: preflight.changedFiles,
      changeManifest: preflight,
      commands: {
        test: skipped("pnpm test"),
        typecheck: skipped("pnpm exec tsc"),
        diffCheck: skipped("git diff --check")
      },
      runtimeAvailable: false,
      observations: unknownRuntimeObservations()
    });
  }

  const sandboxRoot = await mkdtemp(join(tmpdir(), "krn-paired-sandbox-"));
  const environment = targetEnvironment(sandboxRoot);
  const [test, typecheck, diffCheck] = await Promise.all([
    runCommand("pnpm", ["test"], input.targetRoot, {
      env: environment,
      timeoutMs: targetCommandTimeoutMs
    }),
    runCommand("pnpm", ["exec", "tsc", "-p", "tsconfig.json", "--noEmit"], input.targetRoot, {
      env: environment,
      timeoutMs: targetCommandTimeoutMs
    }),
    runCommand("git", ["diff", input.initialCommit, "--check"], input.targetRoot, {
      env: environment,
      timeoutMs: targetCommandTimeoutMs
    })
  ]);
  const compileRoot = await mkdtemp(join(tmpdir(), "krn-paired-repair-"));
  const compile = await runCommand(
    "pnpm",
    [
      "exec",
      "tsc",
      "-p",
      join(input.targetRoot, "tsconfig.json"),
      "--outDir",
      compileRoot,
      "--noEmit",
      "false"
    ],
    input.checkerRoot,
    {
      env: environment,
      timeoutMs: targetCommandTimeoutMs
    }
  );
  let runtimeAvailable = false;
  let observations = unknownRuntimeObservations();
  let runtimeCommand = skipped("held-out runtime");

  if (compile.exitCode === 0) {
    const runtime = await runHeldOutRuntimeWorker(
      compileRoot,
      input.checkerRoot,
      sandboxRoot
    );
    runtimeAvailable = runtime.runtimeAvailable;
    runtimeCommand = runtime.command;
    observations = runtime.observations;
  }

  await rm(compileRoot, { recursive: true, force: true });
  await rm(sandboxRoot, { recursive: true, force: true });
  const postflight = await targetPreflight(input);
  const finalManifest: TargetChangeManifest = {
    ...postflight,
    changedFiles: [...new Set([...preflight.changedFiles, ...postflight.changedFiles])],
    forbiddenFiles: [...new Set([...preflight.forbiddenFiles, ...postflight.forbiddenFiles])]
  };

  return scoreTargetRepair({
    sourceFiles,
    changedFiles: finalManifest.changedFiles,
    changeManifest: finalManifest,
    commands: { test, typecheck, diffCheck },
    runtimeCommand,
    runtimeAvailable,
    observations
  });
};

export const runPairedRepairChecker = async (input: {
  readonly baseline: HeldOutCheckerInput;
  readonly krn: HeldOutCheckerInput;
}): Promise<PairedRepairScore> => {
  const [baseline, krn] = await Promise.all([
    runHeldOutTargetRepairChecker(input.baseline),
    runHeldOutTargetRepairChecker(input.krn)
  ]);

  return scorePairedRepairs({ baseline, krn });
};
