import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { EvalCandidateProposal } from "@krn/core";

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
};

export type HeldOutCheck = {
  readonly name:
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
  readonly commands: {
    readonly test: CommandResult;
    readonly typecheck: CommandResult;
    readonly diffCheck: CommandResult;
  };
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
  "Repair the weak JSON input and typed result boundary in this controlled TypeScript target.",
  "Read AGENTS.md and docs/repair-contract.md first. Work only in the allowed target files and do not touch the parent repository, other repos, generated caches, secrets, or network.",
  "Use the task and target contract to make the smallest surgical repair. The repair must cover invalid JSON, missing email, invalid role, unknown-first narrowing, finite result states, focused tests, and typecheck. Preserve the existing package shape; do not add frameworks or unrelated cleanup.",
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
      : "JSON.parse output is not proven unknown-first."
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

const checkFocusedTests = (files: TargetSourceFiles): HeldOutCheck => {
  const tests = source(files, "tests/userService.test.ts");
  const hasInvalidJson = tests.includes("invalid_json");
  const hasMissingEmail = tests.includes("missing_email") || tests.includes("invalid_shape");
  const hasInvalidRole = tests.includes("invalid_role");
  const isPassed = hasInvalidJson && hasMissingEmail && hasInvalidRole;

  return {
    name: "focused_tests",
    passed: isPassed,
    details: isPassed
      ? "Focused tests name malformed JSON, missing email, and invalid role."
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

export const scoreTargetRepair = (
  input: TargetRepairScoreInput
): HeldOutArmScore => {
  const checks: HeldOutCheck[] = [
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
    checkFocusedTests(input.sourceFiles),
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
    "forbidden_files",
    "target_test",
    "target_typecheck",
    "target_diff_check",
    "held_out_runtime"
  ]);
  const invalid = checks.some((check) =>
    requiredForValidity.has(check.name) && !check.passed
  );
  const score = checks.filter((check) => check.passed).length;

  return {
    status: invalid ? "invalid" : score === checks.length ? "pass" : "fail",
    score,
    checks,
    changedFiles: [...input.changedFiles]
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

const runCommand = (
  command: string,
  args: readonly string[],
  cwd: string
): Promise<CommandResult> => new Promise((resolve) => {
  const child = spawn(command, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (chunk: Buffer) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });
  child.on("error", (error: Error) => {
    resolve({
      command,
      args: [...args],
      exitCode: null,
      stdout,
      stderr: `${stderr}${error.message}`
    });
  });
  child.on("close", (exitCode) => {
    resolve({
      command,
      args: [...args],
      exitCode,
      stdout,
      stderr
    });
  });
});

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

const isFunction = (value: unknown): value is (...args: unknown[]) => unknown =>
  typeof value === "function";

const observeInput = (
  createUser: (...args: unknown[]) => unknown,
  listUsers: (...args: unknown[]) => unknown,
  raw: string,
  env: Record<string, string | undefined>
): HeldOutObservation => {
  const before = listUsers();
  const beforeCount = Array.isArray(before) ? before.length : 0;

  try {
    const result = createUser(raw, env);
    const after = listUsers();
    const afterCount = Array.isArray(after) ? after.length : beforeCount;
    const resultRecord = isRecord(result) ? result : undefined;
    const accepted =
      resultRecord?.["ok"] === true ||
      resultRecord?.["kind"] === "created" ||
      resultRecord?.["status"] === "created";
    const state = resultRecord === undefined
      ? String(result)
      : typeof resultRecord["ok"] === "boolean"
        ? `ok:${String(resultRecord["ok"])}`
        : typeof resultRecord["kind"] === "string"
          ? `kind:${resultRecord["kind"]}`
          : typeof resultRecord["status"] === "string"
            ? `status:${resultRecord["status"]}`
            : "object";

    return {
      threw: false,
      accepted,
      savedUserDelta: afterCount - beforeCount,
      resultState: state
    };
  } catch {
    return {
      threw: true,
      accepted: false,
      savedUserDelta: 0,
      resultState: "thrown"
    };
  }
};

export const runHeldOutTargetRepairChecker = async (
  input: HeldOutCheckerInput
): Promise<HeldOutArmScore> => {
  const sourceFiles = await readTargetSourceFiles(input.targetRoot);
  const [test, typecheck, diffCheck, changedFilesResult] = await Promise.all([
    runCommand("pnpm", ["test"], input.targetRoot),
    runCommand("pnpm", ["exec", "tsc", "-p", "tsconfig.json", "--noEmit"], input.targetRoot),
    runCommand("git", ["diff", input.initialCommit, "--check"], input.targetRoot),
    runCommand("git", ["diff", input.initialCommit, "--name-only"], input.targetRoot)
  ]);
  const changedFiles = changedFilesResult.stdout
    .split("\n")
    .map((path) => path.trim())
    .filter((path) => path.length > 0);
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
    input.checkerRoot
  );
  let runtimeAvailable = false;
  let observations = {
    invalidJson: unknownObservation(),
    missingEmail: unknownObservation(),
    invalidRole: unknownObservation()
  };

  if (compile.exitCode === 0) {
    try {
      const moduleValue: unknown = await import(
        `${pathToFileURL(join(compileRoot, "src/userService.js")).href}?checker=${Date.now()}`
      );
      const service = isRecord(moduleValue) ? moduleValue : {};
      const createUser = service["createUserFromJson"];
      const listUsers = service["listSavedUsers"];

      if (isFunction(createUser) && isFunction(listUsers)) {
        runtimeAvailable = true;
        observations = {
          invalidJson: observeInput(createUser, listUsers, "{", {}),
          missingEmail: observeInput(createUser, listUsers, JSON.stringify({ role: "admin" }), {}),
          invalidRole: observeInput(
            createUser,
            listUsers,
            JSON.stringify({ email: "held-out@example.com", role: "owner" }),
            {}
          )
        };
      }
    } catch {
      runtimeAvailable = false;
    }
  }

  await rm(compileRoot, { recursive: true, force: true });

  return scoreTargetRepair({
    sourceFiles,
    changedFiles,
    commands: { test, typecheck, diffCheck },
    runtimeAvailable,
    observations
  });
};
