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

export type CodexCapabilityLiveExecutorOptions = {
  readonly sourceRoot: string;
  readonly outputRoot: string;
  readonly codexHome: string;
  readonly databaseUrl: string;
  readonly codexExecutable?: string;
  readonly runCommand?: (input: CommandInput) => Promise<CommandResult>;
};

export const prepareCodexCapabilityLiveExecutor = async (
  options: CodexCapabilityLiveExecutorOptions,
  targetCommit: string,
  scenario: string
): Promise<CodexCapabilityArmExecutor> => {
  const runCommand = options.runCommand ?? runProcessCommand;
  const snapshotRoot = join(options.outputRoot, "source");
  const scenarioConfig = liveScenarioConfig(scenario);
  await materializeSourceSnapshot(options.sourceRoot, snapshotRoot, targetCommit, scenarioConfig.fixturePath, runCommand);
  const workspaces = await Promise.all([
    prepareArmWorkspace("baseline", options, snapshotRoot, scenarioConfig, runCommand),
    prepareArmWorkspace("krn", options, snapshotRoot, scenarioConfig, runCommand)
  ]);
  const workspaceByArm = new Map(workspaces);
  return async (arm, graders) => executeArm(arm, graders, workspaceByArm, options, runCommand);
};

const materializeSourceSnapshot = async (
  sourceRoot: string,
  snapshotRoot: string,
  commit: string,
  fixturePath: string,
  runCommand: (input: CommandInput) => Promise<CommandResult>
): Promise<void> => {
  mkdirSync(snapshotRoot, { recursive: true });
  const archivePath = join(dirname(snapshotRoot), "source.tar");
  await requireSuccess(await runCommand({
    command: "git",
    args: ["archive", "--format=tar", `--output=${archivePath}`, commit, "--", fixturePath],
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
  options: CodexCapabilityLiveExecutorOptions,
  snapshotRoot: string,
  scenario: LiveScenarioConfig,
  runCommand: (input: CommandInput) => Promise<CommandResult>
): Promise<readonly [CodexCapabilityEvalArmName, string]> => {
  const workspace = join(options.outputRoot, arm, "workspace");
  const fixtureRoot = join(snapshotRoot, scenario.fixturePath);
  await materializeTarget(arm, fixtureRoot, workspace, scenario, snapshotRoot, runCommand);
  await initializeWorkspace(workspace, runCommand);
  prepareTargetDependencies(workspace, options.sourceRoot);
  return [arm, workspace];
};

type LiveScenarioConfig = {
  readonly fixturePath: string;
  readonly overlay?: string;
};

const liveScenarioConfig = (scenario: string): LiveScenarioConfig => {
  if (scenario === "weak-json-boundary") {
    return {
      fixturePath: "tests/fixtures/target-repos/weak-json-boundary-typescript",
      overlay: scenario
    };
  }
  if (scenario === "temporal-policy-hidden-source-typescript") {
    return { fixturePath: "tests/fixtures/target-repos/temporal-policy-drift-typescript" };
  }
  throw new Error(`unsupported live eval scenario: ${scenario}`);
};

const materializeTarget = async (
  arm: CodexCapabilityEvalArmName,
  fixtureRoot: string,
  workspace: string,
  scenario: LiveScenarioConfig,
  snapshotRoot: string,
  runCommand: (input: CommandInput) => Promise<CommandResult>
): Promise<void> => {
  if (scenario.overlay === undefined) {
    cpSync(fixtureRoot, workspace, { recursive: true });
    return;
  }
  await requireSuccess(await runCommand({
    command: "node",
    args: [join(fixtureRoot, "scripts/materialize-scenario.mjs"), scenario.overlay, workspace],
    cwd: snapshotRoot,
    timeoutMs: 30_000
  }), `materialize ${arm} target`);
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
  cpSync(resolve(sourceRoot, "node_modules/typescript"), join(nodeModules, "typescript"), {
    recursive: true,
    dereference: true
  });
  symlinkSync("../typescript/bin/tsc", join(binaries, "tsc"));
};

const prepareCodexHome = (
  arm: CodexCapabilityPlannedArm,
  options: CodexCapabilityLiveExecutorOptions
): void => {
  const home = join(options.outputRoot, arm.arm, "codex-home");
  mkdirSync(home, { recursive: true });
  symlinkSync(join(options.codexHome, "auth.json"), join(home, "auth.json"));
  const profileSource = resolve(options.sourceRoot, arm.profile.configPath);
  cpSync(profileSource, join(home, basename(profileSource)));
  cpSync(profileSource, join(home, "config.toml"));
  if (arm.arm === "krn") {
    const skillTarget = join(home, "skills", "krn-memory-core");
    mkdirSync(dirname(skillTarget), { recursive: true });
    cpSync(resolve(options.sourceRoot, ".agents/skills/krn-memory-core"), skillTarget, { recursive: true });
  }
};

const executeArm = async (
  arm: CodexCapabilityPlannedArm,
  graders: readonly CodexCapabilityEvalGrader[],
  workspaces: ReadonlyMap<CodexCapabilityEvalArmName, string>,
  options: CodexCapabilityLiveExecutorOptions,
  runCommand: (input: CommandInput) => Promise<CommandResult>
): Promise<CodexCapabilityArmExecution> => {
  const workspace = workspaces.get(arm.arm);
  if (workspace === undefined) throw new Error(`missing ${arm.arm} workspace`);
  prepareCodexHome(arm, options);
  const env = liveEnvironment(arm.arm, options);
  const commandExecutable = options.codexExecutable ?? arm.command;
  const version = await runCommand({ command: commandExecutable, args: ["--version"], cwd: workspace, env, timeoutMs: 30_000 });
  await requireSuccess(version, `${arm.arm} codex version`);
  const execution = await runCommand({ command: commandExecutable, args: arm.args, cwd: workspace, env, timeoutMs: arm.timeoutMs });
  const checkers = await Promise.all(graders.map((grader) => runGrader(grader, workspace, graderEnvironment(options), runCommand)));
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
  options: CodexCapabilityLiveExecutorOptions
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
    ...(arm === "krn" ? { KRN_SOURCE_ROOT: options.sourceRoot, KRN_DATABASE_URL: options.databaseUrl } : {}),
    CI: "1"
  };
};

const graderEnvironment = (
  options: CodexCapabilityLiveExecutorOptions
): NodeJS.ProcessEnv => ({
  ...process.env,
  KRN_SOURCE_ROOT: options.sourceRoot,
  CI: "1"
});

const requireSuccess = async (result: CommandResult, operation: string): Promise<void> => {
  if (!result.timedOut && result.exitCode === 0) return;
  throw new Error(`${operation} failed (exit ${String(result.exitCode)}): ${result.stderr || result.stdout}`);
};
