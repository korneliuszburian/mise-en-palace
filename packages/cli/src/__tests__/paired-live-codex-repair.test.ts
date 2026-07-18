import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildPairedRepairPrompts,
  pairedRepairEvalCandidate,
  pairedRepairUsefulnessOutcome,
  scorePairedRepairs,
  scoreTargetRepair,
  runCommand,
  runFocusedTestMutationSuite,
  runHeldOutTargetRepairChecker,
  runHeldOutRuntimeWorker,
  pairedEvalFamilyContract,
  resolvePairedEvalFamily,
  selectHeldOutRuntimePermissionFlag,
  type CommandResult,
  type FocusedTestMutationName,
  type HeldOutObservation
} from "../internal/eval/paired-live-codex-repair.js";

const command = (exitCode = 0): CommandResult => ({
  command: "fixture",
  args: [],
  exitCode,
  stdout: "",
  stderr: ""
});

const observation = (overrides: Partial<HeldOutObservation> = {}): HeldOutObservation => ({
  threw: false,
  accepted: false,
  savedUserDelta: 0,
  resultState: "ok:false",
  ...overrides
});

const focusedMutationProofs = (
  failed?: FocusedTestMutationName
) => (["invalid_json", "missing_email", "invalid_role"] as const).map((name) => ({
  name,
  command: command(name === failed ? 1 : 0)
}));

const focusedTestControl = (): CommandResult => command();

const sourceFiles = {
  "src/config.ts": [
    "export function parseJsonConfig(raw: string): unknown {",
    "  return JSON.parse(raw);",
    "}"
  ].join("\n"),
  "src/userService.ts": [
    "export type CreateUserResult = { ok: true } | { ok: false; error: string };",
    "export function createUserFromJson(): CreateUserResult { return { ok: false, error: \"x\" }; }"
  ].join("\n"),
  "tests/userService.test.ts": [
    "createUserFromJson(JSON.stringify({ email: 'ok@example.com' }), {});",
    "createUserFromJson('{', {});",
    "createUserFromJson(JSON.stringify({ role: 'admin' }), {});",
    "createUserFromJson(JSON.stringify({ email: 'x@example.com', role: 'owner' }), {});"
  ].join("\n")
};

const focusedVectorExpressions = {
  invalid_json: JSON.stringify("["),
  missing_email: "JSON.stringify({ role: 'admin' })",
  invalid_role: "JSON.stringify({ email: 'x@example.com', role: 'owner' })"
} as const;

const focusedTestSource = (
  style: "direct" | "helper" | "table",
  names: readonly FocusedTestMutationName[]
): string => {
  const expressions = names.map((name) => focusedVectorExpressions[name]);
  const assertion = [
    "const assertRejected = (raw) => {",
    "  const savedBefore = listSavedUsers().length;",
    "  const result = createUserFromJson(raw, {});",
    "  if (result.status !== 'invalid_input') throw new Error('expected rejection');",
    "  if (listSavedUsers().length !== savedBefore) throw new Error('unexpected save');",
    "};"
  ].join("\n");
  const body = style === "table"
    ? `for (const raw of [${expressions.join(", ")}]) assertRejected(raw);`
    : expressions.map((expression) => `assertRejected(${expression});`).join("\n");
  return [
    "import { createUserFromJson, listSavedUsers } from '../src/index.js';",
    ...(style === "direct" ? [] : ["const reject = (raw) => assertRejected(raw);"]),
    assertion,
    style === "helper" ? body.replaceAll("assertRejected", "reject") : body
  ].join("\n");
};

const writeCompiledMutationTarget = async (
  root: string,
  tests: string
): Promise<void> => {
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, "tests"), { recursive: true });
  await writeFile(join(root, "package.json"), JSON.stringify({ type: "module" }), "utf8");
  await writeFile(join(root, "src/index.js"), [
    "export { createUserFromJson, listSavedUsers } from './userService.js';"
  ].join("\n"), "utf8");
  await writeFile(join(root, "src/userService.js"), [
    "const users = [];",
    "export const listSavedUsers = () => users;",
    "export const createUserFromJson = (raw) => {",
    "  let input;",
    "  try { input = JSON.parse(raw); } catch { return { status: 'invalid_input' }; }",
    "  if (typeof input?.email !== 'string' || input.email.trim().length === 0) return { status: 'invalid_input' };",
    "  const role = input.role ?? 'admin';",
    "  if (role !== 'admin' && role !== 'member') return { status: 'invalid_input' };",
    "  const user = { id: '1', email: input.email, role };",
    "  users.push(user);",
    "  return { status: 'created', user };",
    "};"
  ].join("\n"), "utf8");
  await writeFile(join(root, "tests/userService.test.js"), tests, "utf8");
};

describe("paired live Codex repair eval", () => {
  it("routes scenarios to one explicit family contract", () => {
    expect(resolvePairedEvalFamily("env-config-contract-typescript held-out")).toBe("env-config");
    expect(resolvePairedEvalFamily("async-job-boundary-typescript held-out")).toBe("async-job");
    expect(resolvePairedEvalFamily("user-create-boundary-typescript held-out")).toBe("user-create");
    expect(pairedEvalFamilyContract("env-config").sourcePaths).toContain("src/configReadback.ts");
    expect(pairedEvalFamilyContract("async-job").sourcePaths).toContain("src/jobQueue.ts");
    expect(pairedEvalFamilyContract("user-create").sourcePaths).toContain("src/userService.ts");
  });

  it("requires finite user creation and supported default/role behavior", () => {
    const score = scoreTargetRepair({
      family: "user-create",
      sourceFiles: {
        "src/config.ts": "export const supported = ['admin', 'member'];",
        "src/userService.ts": "export type CreateUserResult = { status: 'created' | 'invalid_input'; user?: { role: string } }; export function createUserFromJson() { return { status: 'created' }; }",
        "tests/userService.test.ts": "admin member"
      },
      changedFiles: ["src/userService.ts"],
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: true,
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation(),
        validCreation: false
      }
    });

    expect(score.status).toBe("fail");
    expect(score.checks).toContainEqual(expect.objectContaining({ name: "family_contract", passed: false }));
  });

  it("accepts the user-create family when its held-out creation and rejection gates pass", () => {
    const score = scoreTargetRepair({
      family: "user-create",
      sourceFiles: {
        "src/config.ts": "export const supported = ['admin', 'member'];",
        "src/userService.ts": "export type CreateUserResult = { state: 'created' | 'rejected'; user?: { role: 'admin' | 'member' } }; export function createUserFromJson() { return { state: 'created' }; }",
        "tests/userService.test.ts": "admin member malformed missing unsupported"
      },
      changedFiles: ["src/userService.ts"],
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: true,
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation(),
        validCreation: true
      }
    });

    expect(score.status).toBe("pass");
    expect(score.checks).toContainEqual(expect.objectContaining({ name: "family_contract", passed: true }));
  });

  it("does not require a ceremonial result type name for user-create", () => {
    const score = scoreTargetRepair({
      family: "user-create",
      sourceFiles: {
        "src/config.ts": "export const supported = ['admin', 'member'];",
        "src/userService.ts": "type UserCreationOutcome = { state: 'created' | 'rejected'; user?: { role: 'admin' | 'member' } }; export function createUserFromJson(): UserCreationOutcome { return { state: 'created' }; }",
        "tests/userService.test.ts": "rejected"
      },
      changedFiles: ["src/userService.ts"],
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: true,
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation(),
        validCreation: true
      }
    });

    expect(score.checks).toContainEqual(expect.objectContaining({ name: "family_contract", passed: true }));
  });

  it("fails a family contract when an env boundary leaks the guarded behavior", () => {
    const score = scoreTargetRepair({
      family: "env-config",
      sourceFiles: {
        "src/config.ts": "export type RuntimeMode = 'development' | 'staging' | 'production';",
        "src/configReadback.ts": "export const redactConfigReadback = (env: Record<string, unknown>) => env;",
        "tests/config.test.ts": "assert.equal(result.kind, 'invalid_config');"
      },
      changedFiles: ["src/config.ts"],
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: true,
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation(),
        redactionSafe: true
      }
    });

    expect(score.status).toBe("fail");
    expect(score.checks).toContainEqual(expect.objectContaining({ name: "family_contract", passed: false }));
  });

  it("fails an async-job family contract when finite clock/state seams are absent", () => {
    const score = scoreTargetRepair({
      family: "async-job",
      sourceFiles: { "src/jobQueue.ts": "export interface JobEnvelope { readonly idempotencyKey: string; }" },
      changedFiles: ["src/jobQueue.ts"],
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: true,
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation(),
        enqueueAccepted: true
      }
    });

    expect(score.status).toBe("fail");
    expect(score.checks).toContainEqual(expect.objectContaining({ name: "family_contract", passed: false }));
  });

  it("records env-config runtime contract failure when redaction is unsafe", () => {
    const score = scoreTargetRepair({
      family: "env-config",
      sourceFiles: {
        "src/config.ts": "mode !== 'development' && mode !== 'staging' && mode !== 'production';",
        "src/configReadback.ts": "const secretKeyPattern = /secret/i; export const redactConfigReadback = (env) => Object.fromEntries(Object.keys(env).map((key) => [key, '[redacted]']));",
        "tests/config.test.ts": "invalid_config"
      },
      changedFiles: ["src/config.ts"],
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: true,
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation(),
        redactionSafe: false
      }
    });

    expect(score.status).toBe("fail");
    expect(score.checks).toContainEqual(expect.objectContaining({ name: "held_out_runtime", passed: true, details: expect.stringContaining("contract failure") }));
  });

  it("records async-job runtime contract failure when enqueue is rejected", () => {
    const score = scoreTargetRepair({
      family: "async-job",
      sourceFiles: {
        "src/jobQueue.ts": "const idempotencyKey = ''; const retryBudget = 1; const leaseTimeoutMs = 1; const state = 'dead_lettered'; interface Clock { now(): number; }"
      },
      changedFiles: ["src/jobQueue.ts"],
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: true,
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation(),
        enqueueAccepted: false
      }
    });

    expect(score.status).toBe("fail");
    expect(score.checks).toContainEqual(expect.objectContaining({ name: "held_out_runtime", passed: true, details: expect.stringContaining("contract failure") }));
  });

  it("accepts an explicit alternate clock seam in the async family contract", () => {
    const score = scoreTargetRepair({
      family: "async-job",
      sourceFiles: {
        "src/jobQueue.ts": [
          "type Clock = { nowMs: () => number };",
          "type Job = { idempotencyKey: string; retryBudget: number; leaseTimeoutMs: number; state: 'dead_lettered' };"
        ].join("\n")
      },
      changedFiles: ["src/jobQueue.ts"],
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: true,
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation(),
        enqueueAccepted: true
      }
    });

    expect(score.checks).toContainEqual(expect.objectContaining({ name: "family_contract", passed: true }));
  });

  it("accepts a method-based Clock seam used with lease expiry readback", () => {
    const score = scoreTargetRepair({
      family: "async-job",
      sourceFiles: {
        "src/jobQueue.ts": [
          "interface Clock { now(): number; }",
          "type Job = { idempotencyKey: string; retryBudget: number; leaseTimeoutMs: number; state: 'leased' | 'dead_lettered'; leaseExpiresAt: number };"
        ].join("\n")
      },
      changedFiles: ["src/jobQueue.ts"],
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: true,
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation(),
        enqueueAccepted: true
      }
    });

    expect(score.checks).toContainEqual(expect.objectContaining({ name: "family_contract", passed: true }));
    expect(score.status).toBe("pass");
  });

  it("invalidates a family arm when its independent runtime observer is unavailable", () => {
    const score = scoreTargetRepair({
      family: "env-config",
      sourceFiles: {
        "src/config.ts": "mode !== 'development' && mode !== 'staging' && mode !== 'production';",
        "src/configReadback.ts": "const secretKeyPattern = /secret/i; export const redactConfigReadback = (env) => Object.fromEntries(Object.keys(env).map((key) => [key, secretKeyPattern.test(key) ? '[redacted]' : env[key]]));",
        "tests/config.test.ts": "invalid_config"
      },
      changedFiles: ["src/config.ts"],
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: false,
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation()
      }
    });

    expect(score.status).toBe("invalid");
    expect(score.checks).toContainEqual(expect.objectContaining({ name: "held_out_runtime", passed: false }));
  });

  it("keeps skipped preflight command identities aligned with the issued contract", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-missing-paired-target-"));

    try {
      const score = await runHeldOutTargetRepairChecker({
        targetRoot: join(root, "missing"),
        checkerRoot: process.cwd(),
        initialCommit: "missing"
      });

      expect(score.status).toBe("invalid");
      expect(score.commands).toEqual(expect.objectContaining({
        test: expect.objectContaining({ command: "pnpm test", exitCode: null }),
        typecheck: expect.objectContaining({ command: "pnpm typecheck", exitCode: null }),
        diffCheck: expect.objectContaining({ command: "git diff --check", exitCode: null })
      }));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("invalidates a staged patch that the exact diff command cannot inspect", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-staged-paired-target-"));

    try {
      await mkdir(join(root, "src"));
      await writeFile(join(root, "src/config.ts"), "export const value = 1;\n", "utf8");
      for (const args of [
        ["init", "--quiet"],
        ["config", "user.email", "paired-test@example.invalid"],
        ["config", "user.name", "KRN paired test"],
        ["add", "src/config.ts"],
        ["commit", "--quiet", "-m", "baseline"]
      ]) {
        expect((await runCommand("git", args, root)).exitCode).toBe(0);
      }
      const initialCommit = await runCommand("git", ["rev-parse", "HEAD"], root);
      expect(initialCommit.exitCode).toBe(0);
      await writeFile(join(root, "src/config.ts"), "export const value = 2; \n", "utf8");
      expect((await runCommand("git", ["add", "src/config.ts"], root)).exitCode).toBe(0);

      const score = await runHeldOutTargetRepairChecker({
        targetRoot: root,
        checkerRoot: process.cwd(),
        initialCommit: initialCommit.stdout.trim()
      });

      expect(score.status).toBe("invalid");
      expect(score.checks).toContainEqual(expect.objectContaining({
        name: "preflight",
        passed: false,
        details: expect.stringContaining("staged changes")
      }));
      expect(score.commands?.diffCheck).toEqual(expect.objectContaining({
        command: "git diff --check",
        exitCode: null
      }));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("invalidates a committed patch that the worktree-only diff command cannot inspect", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-committed-paired-target-"));

    try {
      await mkdir(join(root, "src"));
      await writeFile(join(root, "src/config.ts"), "export const value = 1;\n", "utf8");
      for (const args of [
        ["init", "--quiet"],
        ["config", "user.email", "paired-test@example.invalid"],
        ["config", "user.name", "KRN paired test"],
        ["add", "src/config.ts"],
        ["commit", "--quiet", "-m", "baseline"]
      ]) {
        expect((await runCommand("git", args, root)).exitCode).toBe(0);
      }
      const initialCommit = await runCommand("git", ["rev-parse", "HEAD"], root);
      expect(initialCommit.exitCode).toBe(0);
      await writeFile(join(root, "src/config.ts"), "export const value = 2; \n", "utf8");
      expect((await runCommand("git", ["add", "src/config.ts"], root)).exitCode).toBe(0);
      expect((await runCommand("git", ["commit", "--quiet", "-m", "forbidden repair commit"], root)).exitCode).toBe(0);

      const score = await runHeldOutTargetRepairChecker({
        targetRoot: root,
        checkerRoot: process.cwd(),
        initialCommit: initialCommit.stdout.trim()
      });

      expect(score.status).toBe("invalid");
      expect(score.checks).toContainEqual(expect.objectContaining({
        name: "preflight",
        passed: false,
        details: expect.stringContaining("HEAD changed")
      }));
      expect(score.commands?.diffCheck).toEqual(expect.objectContaining({
        command: "git diff --check",
        exitCode: null
      }));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("revalidates ownership after target tests mutate the Git index", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-runtime-staged-paired-target-"));

    try {
      await mkdir(join(root, "src"));
      await writeFile(join(root, "src/config.ts"), "export const value = 1;\n", "utf8");
      await writeFile(join(root, "package.json"), JSON.stringify({
        scripts: {
          test: "git add src/config.ts",
          typecheck: "true"
        }
      }), "utf8");
      await writeFile(join(root, "tsconfig.json"), JSON.stringify({
        compilerOptions: { noEmit: true },
        include: ["src/**/*.ts"]
      }), "utf8");
      for (const args of [
        ["init", "--quiet"],
        ["config", "user.email", "paired-test@example.invalid"],
        ["config", "user.name", "KRN paired test"],
        ["add", "."],
        ["commit", "--quiet", "-m", "baseline"]
      ]) {
        expect((await runCommand("git", args, root)).exitCode).toBe(0);
      }
      const initialCommit = await runCommand("git", ["rev-parse", "HEAD"], root);
      expect(initialCommit.exitCode).toBe(0);
      await writeFile(join(root, "src/config.ts"), "export const value = 2;\n", "utf8");

      const score = await runHeldOutTargetRepairChecker({
        targetRoot: root,
        checkerRoot: process.cwd(),
        initialCommit: initialCommit.stdout.trim()
      });

      expect(score.status).toBe("invalid");
      expect(score.checks).toContainEqual(expect.objectContaining({
        name: "preflight",
        passed: false,
        details: expect.stringContaining("staged changes")
      }));
      expect(score.commands?.test).toEqual(expect.objectContaining({
        command: "pnpm",
        args: ["test"],
        exitCode: 0
      }));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("classifies a color-configured untracked patch without inventing staged proof", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-color-status-paired-target-"));

    try {
      await mkdir(join(root, "src"));
      await writeFile(join(root, "src/config.ts"), "export const value = 1;\n", "utf8");
      for (const args of [
        ["init", "--quiet"],
        ["config", "user.email", "paired-test@example.invalid"],
        ["config", "user.name", "KRN paired test"],
        ["add", "src/config.ts"],
        ["commit", "--quiet", "-m", "baseline"],
        ["config", "color.status", "always"]
      ]) {
        expect((await runCommand("git", args, root)).exitCode).toBe(0);
      }
      const initialCommit = await runCommand("git", ["rev-parse", "HEAD"], root);
      expect(initialCommit.exitCode).toBe(0);
      await writeFile(join(root, "src/extra.ts"), "export const extra = true;\n", "utf8");

      const score = await runHeldOutTargetRepairChecker({
        targetRoot: root,
        checkerRoot: process.cwd(),
        initialCommit: initialCommit.stdout.trim()
      });

      expect(score.checks).toContainEqual(expect.objectContaining({
        name: "preflight",
        passed: false,
        details: expect.stringContaining("untracked files")
      }));
      expect(score.commands?.diffCheck).toEqual(expect.objectContaining({
        command: "git diff --check",
        exitCode: null
      }));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("selects the stable Node permission flag before the legacy alias and fails closed without either", () => {
    expect(selectHeldOutRuntimePermissionFlag(new Set([
      "--experimental-permission",
      "--permission"
    ]))).toBe("--permission");
    expect(selectHeldOutRuntimePermissionFlag(new Set([
      "--experimental-permission"
    ]))).toBe("--experimental-permission");
    expect(selectHeldOutRuntimePermissionFlag(new Set())).toBeUndefined();
  });

  it("forces a timed-out command to settle when it ignores SIGTERM", async () => {
    const result = await runCommand(process.execPath, [
      "-e",
      "process.on('SIGTERM',()=>{});setTimeout(()=>process.exit(0),500);"
    ], process.cwd(), { timeoutMs: 150 });

    expect(result.exitCode).toBeNull();
    expect(result.stderr).toContain("command timed out");
    expect(result.durationMs).toBeLessThan(400);
  });

  it("generates a packet-only prompt delta and stable hashes", () => {
    const first = buildPairedRepairPrompts({
      task: "repair the boundary",
      decisionPacket: { packetIdentity: { checksum: "abc" } }
    });
    const second = buildPairedRepairPrompts({
      task: "repair the boundary",
      decisionPacket: { packetIdentity: { checksum: "abc" } }
    });

    expect(first).toEqual(second);
    expect(first.baseline).not.toContain("packetIdentity");
    expect(first.baseline).toContain("contract documentation present in the target");
    expect(first.baseline).not.toContain("docs/repair-contract.md");
    expect(first.krn).toContain("packetIdentity");
    expect(first.delta).toMatchObject({
      generated: true,
      packetOnlyByConstruction: true,
      deltaBytes: expect.any(Number)
    });
  });

  it("requires the KRN arm to emit a bounded obedience record", () => {
    const prompts = buildPairedRepairPrompts({
      task: "repair the boundary",
      decisionPacket: { packetIdentity: { checksum: "abc" } }
    });

    expect(prompts.baseline).not.toContain("emit one final line of JSON");
    expect(prompts.krn).toContain("emit one final line of JSON");
    expect(prompts.krn).toContain("decisionId");
    expect(prompts.krn).toContain("nonProof");
  });

  it("can remove packet injection when capabilities are the experiment variable", () => {
    const prompts = buildPairedRepairPrompts({
      task: "repair the boundary",
      decisionPacket: { packetIdentity: { checksum: "private-packet-marker" } },
      includeDecisionPacket: false
    });
    expect(prompts.krn).toBe(prompts.baseline);
    expect(prompts.krn).not.toContain("private-packet-marker");
    expect(prompts.delta.deltaBytes).toBe(0);
  });

  it("keeps capability-tool discovery instructions identical across arms", () => {
    const prompts = buildPairedRepairPrompts({
      task: "repair the boundary",
      decisionPacket: { packetIdentity: { checksum: "private-packet-marker" } },
      includeDecisionPacket: false,
      contextToolRunId: "run-123"
    });
    expect(prompts.krn).toBe(prompts.baseline);
    expect(prompts.baseline).toContain("krn_decision_packet tool is available");
    expect(prompts.baseline).toContain("run-123");
  });

  it("keeps private repair mechanisms out of baseline participant inputs", async () => {
    const targetRoot = await mkdtemp(join(tmpdir(), "krn-blind-paired-target-"));
    const fixtureRoot = resolve(
      process.cwd(),
      "../../tests/fixtures/target-repos/weak-json-boundary-typescript"
    );
    const scenarioRoot = join(fixtureRoot, "scenarios/weak-json-boundary/files");
    const task = "Make the controlled user-creation boundary satisfy its observable invalid-input contract.";
    const prompts = buildPairedRepairPrompts({
      task,
      decisionPacket: { packetIdentity: { checksum: "private-packet-marker" } }
    });

    try {
      const materialized = await runCommand(process.execPath, [
        join(fixtureRoot, "scripts/materialize-scenario.mjs"),
        "weak-json-boundary",
        targetRoot
      ], fixtureRoot);
      expect(materialized.exitCode).toBe(0);

      expect(prompts.baseline).toContain(`Task: ${task}`);
      expect(prompts.baseline).not.toContain("private-packet-marker");
      expect(prompts.krn).toContain("private-packet-marker");

      for (const participantPath of [
        "AGENTS.md",
        "README.md",
        "docs/repair-contract.md"
      ]) {
        const materializedInput = await readFile(join(targetRoot, participantPath), "utf8");
        const blindInput = await readFile(join(scenarioRoot, participantPath), "utf8");
        const operatorInput = await readFile(join(fixtureRoot, participantPath), "utf8");

        expect(materializedInput).toBe(blindInput);
        expect(materializedInput).not.toBe(operatorInput);
      }
    } finally {
      await rm(targetRoot, { recursive: true, force: true });
    }
  });

  it("scores held-out behavior independently of target prose", () => {
    const result = scoreTargetRepair({
      sourceFiles,
      changedFiles: ["src/config.ts", "src/userService.ts", "tests/userService.test.ts"],
      commands: {
        test: command(),
        typecheck: command(),
        diffCheck: command()
      },
      runtimeAvailable: true,
      focusedTestControl: focusedTestControl(),
      focusedTestMutations: focusedMutationProofs(),
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation()
      }
    });

    expect(result.status).toBe("pass");
    expect(result.score).toBe(3);
    expect(result.checks.every((check) => check.passed)).toBe(true);
  });

  it("does not award advantage for static tokens without held-out behavior", () => {
    const result = scoreTargetRepair({
      sourceFiles: {
        "src/config.ts": "const prose = 'unknown';",
        "src/userService.ts": "const prose = 'CreateUserResult';",
        "tests/userService.test.ts": "invalid_json missing_email invalid_role"
      },
      changedFiles: ["src/config.ts", "src/userService.ts", "tests/userService.test.ts"],
      commands: {
        test: command(),
        typecheck: command(),
        diffCheck: command()
      },
      runtimeAvailable: true,
      focusedTestControl: focusedTestControl(),
      focusedTestMutations: focusedMutationProofs(),
      observations: {
        invalidJson: observation({ accepted: true, savedUserDelta: 1 }),
        missingEmail: observation({ accepted: true, savedUserDelta: 1 }),
        invalidRole: observation({ accepted: true, savedUserDelta: 1 })
      }
    });

    expect(result.status).toBe("fail");
    expect(result.score).toBe(0);
  });

  it("does not report a contract pass from runtime behavior alone", () => {
    const result = scoreTargetRepair({
      sourceFiles: {
        "src/config.ts": "export const parseJsonConfig = JSON.parse;",
        "src/userService.ts": "export const createUserFromJson = () => false;",
        "tests/userService.test.ts": "happy path only"
      },
      changedFiles: ["src/config.ts", "src/userService.ts", "tests/userService.test.ts"],
      commands: {
        test: command(),
        typecheck: command(),
        diffCheck: command()
      },
      runtimeAvailable: true,
      focusedTestControl: focusedTestControl(),
      focusedTestMutations: focusedMutationProofs(),
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation()
      }
    });

    expect(result.score).toBe(3);
    expect(result.status).toBe("fail");
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "unknown_first", passed: false }),
      expect.objectContaining({ name: "finite_result_state", passed: false })
    ]));
  });

  it.each(["direct", "helper", "table"] as const)(
    "proves focused invalid-input coverage for %s test structure",
    async (style) => {
      const root = await mkdtemp(join(tmpdir(), "krn-focused-mutation-"));
      const compileRoot = join(root, "compiled");
      const sandboxRoot = join(root, "sandbox");
      await writeCompiledMutationTarget(
        compileRoot,
        focusedTestSource(style, ["invalid_json", "missing_email", "invalid_role"])
      );
      await mkdir(sandboxRoot);

      try {
        const suite = await runFocusedTestMutationSuite(
          compileRoot,
          process.cwd(),
          sandboxRoot
        );
        expect(suite.control.exitCode).toBe(0);
        const proofs = suite.mutations;
        expect(proofs.map((proof) => [proof.name, proof.command.exitCode])).toEqual([
          ["invalid_json", 0],
          ["missing_email", 0],
          ["invalid_role", 0]
        ]);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  );

  it("preserves injected clock arguments through focused mutation wrappers", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-focused-mutation-clock-"));
    const compileRoot = join(root, "compiled");
    const sandboxRoot = join(root, "sandbox");
    await mkdir(join(compileRoot, "src"), { recursive: true });
    await mkdir(join(compileRoot, "tests"), { recursive: true });
    await writeFile(join(compileRoot, "src/index.js"),
      "export { createUserFromJson, listSavedUsers } from './userService.js';\n",
      "utf8");
    await writeFile(join(compileRoot, "src/userService.js"), [
      "const users = [];",
      "export const listSavedUsers = () => users;",
      "export const createUserFromJson = (raw, _env, now) => {",
      "  let input;",
      "  try { input = JSON.parse(raw); } catch { return { status: 'invalid_input' }; }",
      "  if (typeof input?.email !== 'string' || input.email.length === 0) return { status: 'invalid_input' };",
      "  if (input.role !== undefined && input.role !== 'admin' && input.role !== 'member') return { status: 'invalid_input' };",
      "  const user = { id: String(now()), email: input.email, role: 'admin' };",
      "  users.push(user);",
      "  return { status: 'created', user };",
      "};"
    ].join("\n"), "utf8");
    await writeFile(join(compileRoot, "tests/userService.test.js"), [
      "import { createUserFromJson, listSavedUsers } from '../src/index.js';",
      "const clock = () => 1;",
      "const created = createUserFromJson(JSON.stringify({ email: 'ok@example.com' }), {}, clock);",
      "if (created.status !== 'created' || created.user.id !== '1') throw new Error('create failed');",
      "for (const raw of ['{', JSON.stringify({}), JSON.stringify({ email: 'bad@example.com', role: 'owner' })]) {",
      "  const before = listSavedUsers().length;",
      "  const result = createUserFromJson(raw, {}, clock);",
      "  if (result.status !== 'invalid_input' || listSavedUsers().length !== before) throw new Error('invalid input accepted');",
      "}"
    ].join("\n"), "utf8");
    await mkdir(sandboxRoot);

    try {
      const suite = await runFocusedTestMutationSuite(compileRoot, process.cwd(), sandboxRoot);
      expect(suite.control.exitCode).toBe(0);
      expect(suite.mutations.map((proof) => [proof.name, proof.command.exitCode])).toEqual([
        ["invalid_json", 0],
        ["missing_email", 0],
        ["invalid_role", 0]
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it.each(["invalid_json", "missing_email", "invalid_role"] as const)(
    "fails only the %s mutation proof when that vector is absent",
    async (missingName) => {
      const root = await mkdtemp(join(tmpdir(), "krn-focused-mutation-missing-"));
      const compileRoot = join(root, "compiled");
      const sandboxRoot = join(root, "sandbox");
      const included = (["invalid_json", "missing_email", "invalid_role"] as const)
        .filter((name) => name !== missingName);
      await writeCompiledMutationTarget(compileRoot, focusedTestSource("table", included));
      await mkdir(sandboxRoot);

      try {
        const suite = await runFocusedTestMutationSuite(
          compileRoot,
          process.cwd(),
          sandboxRoot
        );
        expect(suite.control.exitCode).toBe(0);
        const proofs = suite.mutations;
        expect(Object.fromEntries(
          proofs.map((proof) => [proof.name, proof.command.exitCode])
        )).toEqual({
          invalid_json: missingName === "invalid_json" ? 1 : 0,
          missing_email: missingName === "missing_email" ? 1 : 0,
          invalid_role: missingName === "invalid_role" ? 1 : 0
        });
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  );

  it("does not count a mutant failure when the identical unmutated control also fails", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-focused-mutation-control-"));
    const compileRoot = join(root, "compiled");
    const sandboxRoot = join(root, "sandbox");
    await writeCompiledMutationTarget(compileRoot, [
      "import { writeFile } from 'node:fs/promises';",
      focusedTestSource("table", ["invalid_json", "missing_email", "invalid_role"]),
      `await writeFile(${JSON.stringify(join(root, "forbidden-write"))}, 'x');`
    ].join("\n"));
    await mkdir(sandboxRoot);

    try {
      const suite = await runFocusedTestMutationSuite(
        compileRoot,
        process.cwd(),
        sandboxRoot
      );
      expect(suite.control.exitCode).not.toBe(0);
      expect(suite.mutations.map((proof) => proof.command.exitCode)).toEqual([1, 1, 1]);
      expect(suite.mutations.every((proof) =>
        proof.command.stdout.includes("unmutatedControlPassed=false")
      )).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("returns failed mutation proofs when a compilable target omits the public index module", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-focused-mutation-no-index-"));
    const compileRoot = join(root, "compiled");
    const sandboxRoot = join(root, "sandbox");
    await writeCompiledMutationTarget(
      compileRoot,
      focusedTestSource("table", ["invalid_json", "missing_email", "invalid_role"])
        .replace("../src/index.js", "../src/userService.js")
    );
    await rm(join(compileRoot, "src/index.js"));
    await mkdir(sandboxRoot);

    try {
      const suite = await runFocusedTestMutationSuite(
        compileRoot,
        process.cwd(),
        sandboxRoot
      );
      expect(suite.control.exitCode).toBe(0);
      expect(suite.mutations.map((proof) => proof.command.exitCode)).toEqual([1, 1, 1]);
      expect(suite.mutations.every((proof) =>
        proof.command.stdout.includes("mutationMarkerObserved=false") &&
        proof.command.stderr.length > 0
      )).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("does not let one compound invalid input prove two validation rules", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-focused-mutation-compound-"));
    const compileRoot = join(root, "compiled");
    const sandboxRoot = join(root, "sandbox");
    await writeCompiledMutationTarget(compileRoot, [
      focusedTestSource("direct", ["invalid_json"]),
      "assertRejected(JSON.stringify({ role: 'owner' }));"
    ].join("\n"));
    await mkdir(sandboxRoot);

    try {
      const suite = await runFocusedTestMutationSuite(
        compileRoot,
        process.cwd(),
        sandboxRoot
      );
      expect(Object.fromEntries(
        suite.mutations.map((proof) => [proof.name, proof.command.exitCode])
      )).toEqual({ invalid_json: 0, missing_email: 1, invalid_role: 1 });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("does not treat a blank email test as proof of the missing-property vector", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-focused-mutation-blank-email-"));
    const compileRoot = join(root, "compiled");
    const sandboxRoot = join(root, "sandbox");
    await writeCompiledMutationTarget(compileRoot, [
      focusedTestSource("direct", ["invalid_json", "invalid_role"]),
      "assertRejected(JSON.stringify({ email: '', role: 'admin' }));"
    ].join("\n"));
    await mkdir(sandboxRoot);

    try {
      const suite = await runFocusedTestMutationSuite(
        compileRoot,
        process.cwd(),
        sandboxRoot
      );
      expect(Object.fromEntries(
        suite.mutations.map((proof) => [proof.name, proof.command.exitCode])
      )).toEqual({ invalid_json: 0, missing_email: 1, invalid_role: 0 });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("does not treat a malformed-email rejection as proof of the invalid-role vector", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-focused-mutation-malformed-email-"));
    const compileRoot = join(root, "compiled");
    const sandboxRoot = join(root, "sandbox");
    await writeCompiledMutationTarget(compileRoot, [
      focusedTestSource("direct", ["invalid_json", "missing_email"]),
      "assertRejected(JSON.stringify({ email: 'not-an-email', role: 'owner' }));"
    ].join("\n"));
    const userServicePath = join(compileRoot, "src/userService.js");
    const userService = await readFile(userServicePath, "utf8");
    await writeFile(
      userServicePath,
      userService.replace(
        "input.email.trim().length === 0",
        "input.email.trim().length === 0 || !input.email.includes('@')"
      ),
      "utf8"
    );
    await mkdir(sandboxRoot);

    try {
      const suite = await runFocusedTestMutationSuite(
        compileRoot,
        process.cwd(),
        sandboxRoot
      );
      expect(Object.fromEntries(
        suite.mutations.map((proof) => [proof.name, proof.command.exitCode])
      )).toEqual({ invalid_json: 0, missing_email: 0, invalid_role: 1 });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("credits an invalid-role test with any non-empty email allowed by the contract", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-focused-mutation-nonempty-email-"));
    const compileRoot = join(root, "compiled");
    const sandboxRoot = join(root, "sandbox");
    await writeCompiledMutationTarget(compileRoot, [
      focusedTestSource("direct", []),
      "assertRejected(JSON.stringify({ email: 'x', role: 'owner' }));"
    ].join("\n"));
    await mkdir(sandboxRoot);

    try {
      const suite = await runFocusedTestMutationSuite(
        compileRoot,
        process.cwd(),
        sandboxRoot
      );
      expect(Object.fromEntries(
        suite.mutations.map((proof) => [proof.name, proof.command.exitCode])
      )).toEqual({ invalid_json: 1, missing_email: 1, invalid_role: 0 });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it.each(["invalid_json", "missing_email", "invalid_role"] as const)(
    "requires every distinct %s mutation proof for the focused-test contract",
    (failedName) => {
      const result = scoreTargetRepair({
        sourceFiles,
        changedFiles: ["src/config.ts", "src/userService.ts", "tests/userService.test.ts"],
        commands: { test: command(), typecheck: command(), diffCheck: command() },
        runtimeAvailable: true,
        focusedTestControl: focusedTestControl(),
        focusedTestMutations: focusedMutationProofs(failedName),
        observations: {
          invalidJson: observation(),
          missingEmail: observation(),
          invalidRole: observation()
        }
      });

      expect(result.checks).toContainEqual(expect.objectContaining({
        name: "focused_tests",
        passed: false,
        details: expect.stringContaining(failedName)
      }));
    }
  );

  it("does not count validity gates as paired advantage", () => {
    const result = scoreTargetRepair({
      sourceFiles,
      changedFiles: ["src/config.ts", "src/userService.ts", "tests/userService.test.ts"],
      commands: {
        test: command(1),
        typecheck: command(),
        diffCheck: command()
      },
      runtimeAvailable: true,
      focusedTestControl: focusedTestControl(),
      focusedTestMutations: focusedMutationProofs(),
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation()
      }
    });

    expect(result.status).toBe("invalid");
    expect(result.score).toBe(3);
  });

  it("invalidates an arm when the unmutated focused-test control fails", () => {
    const result = scoreTargetRepair({
      sourceFiles,
      changedFiles: ["src/config.ts", "src/userService.ts", "tests/userService.test.ts"],
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: true,
      focusedTestControl: command(1),
      focusedTestMutations: focusedMutationProofs("invalid_json"),
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation()
      }
    });

    expect(result.status).toBe("invalid");
    expect(result.checks).toContainEqual(expect.objectContaining({
      name: "focused_test_control",
      passed: false
    }));
  });

  it("invalidates an untracked forbidden file from the preflight manifest", () => {
    const result = scoreTargetRepair({
      sourceFiles,
      changedFiles: ["src/config.ts", "package.json"],
      changeManifest: {
        status: "known",
        trackedFiles: ["src/config.ts"],
        untrackedFiles: ["package.json"],
        changedFiles: ["src/config.ts", "package.json"],
        forbiddenFiles: ["package.json"],
        statusOutput: "?? package.json"
      },
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: true,
      focusedTestControl: focusedTestControl(),
      focusedTestMutations: focusedMutationProofs(),
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation()
      }
    });

    expect(result.status).toBe("invalid");
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "preflight", passed: false }),
      expect.objectContaining({ name: "forbidden_files", passed: false })
    ]));
  });

  it("fails closed when target code attempts to read a host sentinel", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-live-containment-test-"));
    const compileRoot = await mkdtemp(join(root, "compiled-"));
    const sandboxRoot = await mkdtemp(join(root, "sandbox-"));
    const sentinel = join(root, "host-secret.txt");
    const moduleRoot = join(compileRoot, "src");
    await writeFile(sentinel, "must-not-be-read", "utf8");
    await mkdir(moduleRoot, { recursive: true });
    await writeFile(join(moduleRoot, "userService.js"), [
      "import { readFileSync } from 'node:fs';",
      `readFileSync(${JSON.stringify(sentinel)}, 'utf8');`,
      "export const createUserFromJson = () => ({ kind: 'invalid_input' });",
      "export const listSavedUsers = () => [];"
    ].join("\n"), "utf8");

    try {
      const result = await runHeldOutRuntimeWorker(
        compileRoot,
        process.cwd(),
        sandboxRoot,
        "user-create"
      );

      expect(result.runtimeAvailable).toBe(false);
      expect(result.failureReason).toBe("runtime_observer_failed");
      expect(await readFile(sentinel, "utf8")).toBe("must-not-be-read");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("executes the held-out worker with the permission flag supported by the current Node runtime", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-live-permission-test-"));
    const realCompileRoot = join(root, "compiled");
    const realSandboxRoot = join(root, "sandbox");
    const compileRoot = join(root, "compiled-link");
    const sandboxRoot = join(root, "sandbox-link");
    await mkdir(join(realCompileRoot, "src"), { recursive: true });
    await mkdir(realSandboxRoot, { recursive: true });
    await symlink(realCompileRoot, compileRoot, "dir");
    await symlink(realSandboxRoot, sandboxRoot, "dir");
    await writeFile(join(realCompileRoot, "package.json"), JSON.stringify({ type: "module" }), "utf8");
    await writeFile(join(realCompileRoot, "src/userService.js"), [
      "const users = [];",
      "export const listSavedUsers = () => users;",
      "export const createUserFromJson = () => ({ kind: 'invalid_input' });"
    ].join("\n"), "utf8");

    try {
      const result = await runHeldOutRuntimeWorker(compileRoot, process.cwd(), sandboxRoot, "user-create");

      expect(result.runtimeAvailable, JSON.stringify(result.command)).toBe(true);
      expect(result.command.exitCode).toBe(0);
      expect(result.command.args[0]).toBe(selectHeldOutRuntimePermissionFlag());
      expect(result.observations).toEqual({
        invalidJson: observation({ resultState: "kind:invalid_input" }),
        missingEmail: observation({ resultState: "kind:invalid_input" }),
        invalidRole: observation({ resultState: "kind:invalid_input" }),
        redactionSafe: false,
        enqueueAccepted: false,
        validCreation: false
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it.each([
    ["env-config", "src/configReadback.js", "export const redactConfigReadback = (env) => Object.fromEntries(Object.entries(env));"],
    ["async-job", "src/jobQueue.js", "export const unrelated = true;"],
  ] as const)("treats %s target rejection as observed runtime failure", async (family, modulePath, source) => {
    const root = await mkdtemp(join(tmpdir(), "krn-family-observed-failure-"));
    const compileRoot = join(root, "compiled");
    const sandboxRoot = join(root, "sandbox");
    await mkdir(join(compileRoot, "src"), { recursive: true });
    await mkdir(sandboxRoot);
    await writeFile(join(compileRoot, "package.json"), JSON.stringify({ type: "module" }), "utf8");
    await writeFile(join(compileRoot, modulePath), source, "utf8");

    try {
      const result = await runHeldOutRuntimeWorker(compileRoot, process.cwd(), sandboxRoot, family);
      expect(result.runtimeAvailable, JSON.stringify(result.command)).toBe(true);
      expect(result.command.exitCode).toBe(0);
      expect(result.failureReason).toBeUndefined();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("retains env-config runtime evidence when guarded redaction succeeds", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-env-runtime-success-"));
    const compileRoot = join(root, "compiled");
    const sandboxRoot = join(root, "sandbox");
    await mkdir(join(compileRoot, "src"), { recursive: true });
    await mkdir(sandboxRoot);
    await writeFile(join(compileRoot, "package.json"), JSON.stringify({ type: "module" }), "utf8");
    await writeFile(join(compileRoot, "src/configReadback.js"), "export const redactConfigReadback = () => ({ CLIENT_SECRET: '[redacted]' });", "utf8");

    try {
      const result = await runHeldOutRuntimeWorker(compileRoot, process.cwd(), sandboxRoot, "env-config");
      expect(result.runtimeAvailable).toBe(true);
      expect(result.observations.redactionSafe).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("retains async-job runtime evidence when enqueue and lease readback succeed", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-async-runtime-success-"));
    const compileRoot = join(root, "compiled");
    const sandboxRoot = join(root, "sandbox");
    await mkdir(join(compileRoot, "src"), { recursive: true });
    await mkdir(sandboxRoot);
    await writeFile(join(compileRoot, "package.json"), JSON.stringify({ type: "module" }), "utf8");
    await writeFile(join(compileRoot, "src/jobQueue.js"), [
      "export const enqueueJob = (input) => ({ ...input });",
      "export const leaseJob = (job) => ({ ...job, leaseExpiresAt: 1123 });"
    ].join("\n"), "utf8");

    try {
      const result = await runHeldOutRuntimeWorker(compileRoot, process.cwd(), sandboxRoot, "async-job");
      expect(result.runtimeAvailable).toBe(true);
      expect(result.observations.enqueueAccepted).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("accepts semantic async lease readback when fields use an Ms suffix", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-async-runtime-ms-success-"));
    const compileRoot = join(root, "compiled");
    const sandboxRoot = join(root, "sandbox");
    await mkdir(join(compileRoot, "src"), { recursive: true });
    await mkdir(sandboxRoot);
    await writeFile(join(compileRoot, "package.json"), JSON.stringify({ type: "module" }), "utf8");
    await writeFile(join(compileRoot, "src/jobQueue.js"), [
      "export const enqueueJob = (input) => ({ ...input });",
      "export const leaseJob = (job) => ({ ...job, leasedAtMs: 123, leaseExpiresAtMs: 1123 });"
    ].join("\n"), "utf8");

    try {
      const result = await runHeldOutRuntimeWorker(compileRoot, process.cwd(), sandboxRoot, "async-job");
      expect(result.runtimeAvailable).toBe(true);
      expect(result.observations.enqueueAccepted).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects async lease readback when the clock value is not observed", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-async-runtime-wrong-clock-"));
    const compileRoot = join(root, "compiled");
    const sandboxRoot = join(root, "sandbox");
    await mkdir(join(compileRoot, "src"), { recursive: true });
    await mkdir(sandboxRoot);
    await writeFile(join(compileRoot, "package.json"), JSON.stringify({ type: "module" }), "utf8");
    await writeFile(join(compileRoot, "src/jobQueue.js"), [
      "export const enqueueJob = (input) => ({ ...input });",
      "export const leaseJob = (job) => ({ ...job, leasedAtMs: 999, leaseExpiresAtMs: 1999 });"
    ].join("\n"), "utf8");

    try {
      const result = await runHeldOutRuntimeWorker(compileRoot, process.cwd(), sandboxRoot, "async-job");
      expect(result.runtimeAvailable).toBe(true);
      expect(result.observations.enqueueAccepted).toBe(false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("invalidates an arm when the target test or forbidden-file boundary fails", () => {
    const result = scoreTargetRepair({
      sourceFiles,
      changedFiles: ["src/config.ts", "package.json"],
      commands: {
        test: command(1),
        typecheck: command(),
        diffCheck: command()
      },
      runtimeAvailable: true,
      focusedTestControl: focusedTestControl(),
      focusedTestMutations: focusedMutationProofs(),
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation()
      }
    });

    expect(result.status).toBe("invalid");
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "target_test", passed: false }),
      expect.objectContaining({ name: "forbidden_files", passed: false })
    ]));
  });

  it("classifies equal valid arms as tie and rejects invalid comparison", () => {
    const pass = scoreTargetRepair({
      sourceFiles,
      changedFiles: ["src/config.ts", "src/userService.ts", "tests/userService.test.ts"],
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: true,
      focusedTestControl: focusedTestControl(),
      focusedTestMutations: focusedMutationProofs(),
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation()
      }
    });

    expect(scorePairedRepairs({ baseline: pass, krn: pass })).toMatchObject({
      outcome: "tie",
      reason: "Both arms passed the same number of held-out checks."
    });
    expect(scorePairedRepairs({
      baseline: pass,
      krn: { ...pass, status: "invalid" }
    }).outcome).toBe("invalid");
    expect(scorePairedRepairs({
      baseline: { ...pass, status: "fail" },
      krn: pass
    })).toMatchObject({
      outcome: "win",
      reason: "KRN satisfied the repair contract while the equal-contract baseline did not."
    });
    expect(scorePairedRepairs({
      baseline: { ...pass, status: "fail", score: 0 },
      krn: { ...pass, status: "fail", score: 1 }
    })).toMatchObject({
      outcome: "invalid",
      reason: "Neither arm satisfied the repair contract."
    });
  });

  it("maps only a measured win to helped and preserves neutral, hurt, and unknown", () => {
    expect(pairedRepairUsefulnessOutcome("win")).toBe("helped");
    expect(pairedRepairUsefulnessOutcome("tie")).toBe("neutral");
    expect(pairedRepairUsefulnessOutcome("loss")).toBe("hurt");
    expect(pairedRepairUsefulnessOutcome("invalid")).toBe("unknown");
  });

  it("creates a reviewable eval candidate without mutating durable truth", () => {
    const score = scoreTargetRepair({
      sourceFiles,
      changedFiles: ["src/config.ts", "src/userService.ts", "tests/userService.test.ts"],
      commands: { test: command(), typecheck: command(), diffCheck: command() },
      runtimeAvailable: true,
      focusedTestControl: focusedTestControl(),
      focusedTestMutations: focusedMutationProofs(),
      observations: {
        invalidJson: observation(),
        missingEmail: observation(),
        invalidRole: observation()
      }
    });
    const candidate = pairedRepairEvalCandidate({
      score: scorePairedRepairs({ baseline: score, krn: score }),
      runId: "run-1",
      packetChecksum: "a".repeat(64),
      evidenceRefs: ["packet:" + "a".repeat(64), "checker:live-score"],
      createdAt: "2026-07-10T00:00:00.000Z"
    });

    expect(candidate).toMatchObject({
      id: "paired-target-repair:run-1",
      status: "candidate",
      metadata: {
        outcome: "tie",
        usefulnessOutcome: "neutral",
        packetChecksum: "a".repeat(64)
      }
    });
    expect(candidate.metadata.doesNotProve).toEqual(expect.arrayContaining([
      expect.stringContaining("does not mutate MemoryRecord")
    ]));
  });
});
