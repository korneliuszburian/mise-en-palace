import { cpSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

import {
  runCommand as runProcessCommand,
  type CommandInput,
  type CommandResult
} from "./command-runner.js";
import type { CodexCapabilityEvalArmName, CodexCapabilityEvalGrader } from "./contracts.js";
import type { CodexCapabilityPlannedArm } from "./dry-run-plan.js";
import type { CodexCapabilityArmExecution, CodexCapabilityArmExecutor, CodexCapabilityCheckerResult } from "./run-eval.js";

export type WeakJsonLiveExecutorOptions = {
  readonly sourceRoot: string;
  readonly outputRoot: string;
  readonly codexHome: string;
  readonly databaseUrl: string;
  readonly codexExecutable?: string;
  readonly runCommand?: (input: CommandInput) => Promise<CommandResult>;
};

export const prepareWeakJsonLiveExecutor = async (
  options: WeakJsonLiveExecutorOptions,
  targetCommit: string,
  scenario: string
): Promise<CodexCapabilityArmExecutor> => {
  const runCommand = options.runCommand ?? runProcessCommand;
  const snapshotRoot = join(options.outputRoot, "source");
  await materializeSourceSnapshot(options.sourceRoot, snapshotRoot, targetCommit, runCommand);
  const workspaces = await Promise.all([
    prepareArmWorkspace("baseline", options, snapshotRoot, scenario, runCommand),
    prepareArmWorkspace("krn", options, snapshotRoot, scenario, runCommand)
  ]);
  const workspaceByArm = new Map(workspaces);
  return async (arm, graders) => executeArm(arm, graders, workspaceByArm, options, runCommand);
};

const materializeSourceSnapshot = async (
  sourceRoot: string,
  snapshotRoot: string,
  commit: string,
  runCommand: (input: CommandInput) => Promise<CommandResult>
): Promise<void> => {
  mkdirSync(snapshotRoot, { recursive: true });
  const archivePath = join(dirname(snapshotRoot), "source.tar");
  await requireSuccess(await runCommand({
    command: "git",
    args: ["archive", "--format=tar", `--output=${archivePath}`, commit, "--", "tests/fixtures/target-repos/weak-json-boundary-typescript"],
    cwd: sourceRoot,
    timeoutMs: 30_000
  }), "git archive target fixture");
  await requireSuccess(await runCommand({
    command: "tar",
    args: ["-xf", archivePath, "-C", snapshotRoot],
    cwd: sourceRoot,
    timeoutMs: 30_000
  }), "extract target fixture");
};

const prepareArmWorkspace = async (
  arm: CodexCapabilityEvalArmName,
  options: WeakJsonLiveExecutorOptions,
  snapshotRoot: string,
  scenario: string,
  runCommand: (input: CommandInput) => Promise<CommandResult>
): Promise<readonly [CodexCapabilityEvalArmName, string]> => {
  const workspace = join(options.outputRoot, arm, "workspace");
  const fixtureRoot = join(snapshotRoot, "tests/fixtures/target-repos/weak-json-boundary-typescript");
  await requireSuccess(await runCommand({
    command: "node",
    args: [join(fixtureRoot, "scripts/materialize-scenario.mjs"), scenario, workspace],
    cwd: snapshotRoot,
    timeoutMs: 30_000
  }), `materialize ${arm} target`);
  await initializeWorkspace(workspace, runCommand);
  prepareTargetDependencies(workspace, options.sourceRoot);
  prepareCodexHome(arm, options);
  return [arm, workspace];
};

const initializeWorkspace = async (
  workspace: string,
  runCommand: (input: CommandInput) => Promise<CommandResult>
): Promise<void> => {
  for (const args of [
    ["init", "--quiet"],
    ["config", "user.name", "KRN Eval"],
    ["config", "user.email", "eval@krn.invalid"],
    ["add", "."],
    ["commit", "--quiet", "-m", "fixture baseline"]
  ]) {
    await requireSuccess(await runCommand({ command: "git", args, cwd: workspace, timeoutMs: 30_000 }), `git ${args[0]}`);
  }
  writeFileSync(
    join(workspace, ".git", "info", "exclude"),
    "node_modules/\npnpm-lock.yaml\n.tmp-test/\n",
    "utf8"
  );
};

const prepareTargetDependencies = (workspace: string, sourceRoot: string): void => {
  const nodeModules = join(workspace, "node_modules");
  const binaries = join(nodeModules, ".bin");
  mkdirSync(binaries, { recursive: true });
  symlinkSync(resolve(sourceRoot, "node_modules/typescript"), join(nodeModules, "typescript"));
  symlinkSync(resolve(sourceRoot, "node_modules/.bin/tsc"), join(binaries, "tsc"));
};

const prepareCodexHome = (
  arm: CodexCapabilityEvalArmName,
  options: WeakJsonLiveExecutorOptions
): void => {
  const home = join(options.outputRoot, arm, "codex-home");
  mkdirSync(home, { recursive: true });
  symlinkSync(join(options.codexHome, "auth.json"), join(home, "auth.json"));
  const profileSource = resolve(options.sourceRoot, `evals/codex-capability/profiles/${arm === "baseline" ? "plain-codex-eval" : "krn-codex-eval"}.config.toml`);
  cpSync(profileSource, join(home, basename(profileSource)));
  cpSync(profileSource, join(home, "config.toml"));
  if (arm === "krn") {
    const skillTarget = join(home, "skills", "krn-memory-core");
    mkdirSync(dirname(skillTarget), { recursive: true });
    cpSync(resolve(options.sourceRoot, ".agents/skills/krn-memory-core"), skillTarget, { recursive: true });
  }
};

const executeArm = async (
  arm: CodexCapabilityPlannedArm,
  graders: readonly CodexCapabilityEvalGrader[],
  workspaces: ReadonlyMap<CodexCapabilityEvalArmName, string>,
  options: WeakJsonLiveExecutorOptions,
  runCommand: (input: CommandInput) => Promise<CommandResult>
): Promise<CodexCapabilityArmExecution> => {
  const workspace = workspaces.get(arm.arm);
  if (workspace === undefined) throw new Error(`missing ${arm.arm} workspace`);
  const env = liveEnvironment(arm.arm, options);
  const commandExecutable = options.codexExecutable ?? arm.command;
  const version = await runCommand({ command: commandExecutable, args: ["--version"], cwd: workspace, env, timeoutMs: 30_000 });
  await requireSuccess(version, `${arm.arm} codex version`);
  const execution = await runCommand({ command: commandExecutable, args: arm.args, cwd: workspace, env, timeoutMs: arm.timeoutMs });
  const checkers = await Promise.all(graders.map((grader) => runGrader(grader, workspace, env, runCommand)));
  await requireSuccess(await runCommand({ command: "git", args: ["add", "--intent-to-add", "."], cwd: workspace, timeoutMs: 30_000 }), `${arm.arm} untracked diff admission`);
  const diff = await runCommand({ command: "git", args: ["diff", "--binary"], cwd: workspace, timeoutMs: 30_000 });
  await requireSuccess(diff, `${arm.arm} diff capture`);
  return {
    commandExecutable,
    cliVersion: version.stdout.trim(),
    commandStatus: commandStatus(execution),
    exitCode: execution.exitCode,
    stdoutJsonl: execution.stdout,
    stderr: execution.stderr,
    finalDiff: diff.stdout,
    checkers
  };
};

const commandStatus = (
  result: CommandResult
): CodexCapabilityArmExecution["commandStatus"] => {
  if (result.timedOut) return "timed_out";
  return result.exitCode === 0 ? "completed" : "failed";
};

const runGrader = async (
  grader: CodexCapabilityEvalGrader,
  workspace: string,
  env: NodeJS.ProcessEnv,
  runCommand: (input: CommandInput) => Promise<CommandResult>
): Promise<CodexCapabilityCheckerResult> => {
  const command = grader.command;
  if (grader.kind !== "deterministic_command" || command === undefined) {
    return { graderId: grader.id, status: "not_run", exitCode: null, stdout: "", stderr: "grader requires model or human review" };
  }
  const result = await runCommand({ command, args: grader.args ?? [], cwd: workspace, env, timeoutMs: 120_000 });
  return { graderId: grader.id, status: checkerStatus(result), exitCode: result.exitCode, stdout: result.stdout, stderr: result.stderr };
};

const checkerStatus = (result: CommandResult): "passed" | "failed" =>
  result.exitCode === 0 ? "passed" : "failed";

const liveEnvironment = (
  arm: CodexCapabilityEvalArmName,
  options: WeakJsonLiveExecutorOptions
): NodeJS.ProcessEnv => {
  const isolatedHome = join(options.outputRoot, arm, "codex-home");
  return {
    ...process.env,
    HOME: isolatedHome,
    CODEX_HOME: isolatedHome,
    XDG_CACHE_HOME: join(isolatedHome, ".cache"),
    XDG_CONFIG_HOME: join(isolatedHome, ".config"),
    XDG_DATA_HOME: join(isolatedHome, ".local", "share"),
    XDG_STATE_HOME: join(isolatedHome, ".local", "state"),
    KRN_SOURCE_ROOT: options.sourceRoot,
    KRN_DATABASE_URL: options.databaseUrl,
    CI: "1"
  };
};

const requireSuccess = async (result: CommandResult, operation: string): Promise<void> => {
  if (!result.timedOut && result.exitCode === 0) return;
  throw new Error(`${operation} failed (exit ${String(result.exitCode)}): ${result.stderr || result.stdout}`);
};
