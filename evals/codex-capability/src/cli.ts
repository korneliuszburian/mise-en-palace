import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { parseCodexCapabilityEvalManifest } from "./contracts.js";
import { createCodexCapabilityDryRunPlan } from "./dry-run-plan.js";
import { runCodexCapabilityEval, writeCodexCapabilityEvalArtifacts } from "./run-eval.js";
import { prepareCodexCapabilityLiveExecutor } from "./live-executor.js";

export type CodexCapabilityEvalCliResult =
  | {
      readonly status: "ok";
      readonly output: unknown;
    }
  | {
      readonly status: "error";
      readonly message: string;
    };

export const runCodexCapabilityEvalCli = async (
  args: readonly string[]
): Promise<CodexCapabilityEvalCliResult> => {
  const parsed = parseArgs(args);
  if (parsed.status === "error") return parsed;

  const manifestText = readFileSync(parsed.manifestPath, "utf8");
  const manifestJson: unknown = JSON.parse(manifestText);
  const manifest = parseCodexCapabilityEvalManifest(manifestJson);
  const plan = createCodexCapabilityDryRunPlan(manifest);

  if (parsed.mode === "live") {
    return runLiveEval(parsed.outputPath, manifest.target.commit, manifest.target.taskId, plan);
  }

  return {
    status: "ok",
    output: plan
  };
};

const runLiveEval = async (
  outputPath: string,
  targetCommit: string,
  scenario: string,
  plan: ReturnType<typeof createCodexCapabilityDryRunPlan>
): Promise<CodexCapabilityEvalCliResult> => {
  const sourceRoot = process.cwd();
  const outputRoot = resolve(sourceRoot, outputPath);
  const codexExecutable = process.env["KRN_CAPABILITY_CODEX_EXECUTABLE"];
  const executeArm = await prepareCodexCapabilityLiveExecutor({
    sourceRoot,
    outputRoot,
    codexHome: process.env["CODEX_HOME"] ?? resolve(homedir(), ".codex"),
    databaseUrl: process.env["KRN_DATABASE_URL"] ?? "postgres://krn:krn@localhost:54329/krn",
    ...(codexExecutable === undefined ? {} : { codexExecutable })
  }, targetCommit, scenario);
  const summary = await runCodexCapabilityEval(plan, executeArm);
  writeCodexCapabilityEvalArtifacts(outputRoot, summary);
  return { status: "ok", output: summary };
};

const parseArgs = (
  args: readonly string[]
): { readonly status: "ok"; readonly manifestPath: string; readonly mode: "dry-run" } | { readonly status: "ok"; readonly manifestPath: string; readonly mode: "live"; readonly outputPath: string } | { readonly status: "error"; readonly message: string } => {
  const manifestPath = readManifestPath(args);
  if (manifestPath === undefined) return parseArgsError();
  return readMode(args, manifestPath) ?? parseArgsError();
};

const readMode = (
  args: readonly string[],
  manifestPath: string
): Exclude<ReturnType<typeof parseArgs>, { readonly status: "error" }> | undefined => {
  if (args.includes("--dry-run")) return { status: "ok", manifestPath, mode: "dry-run" };
  if (!args.includes("--live")) return undefined;
  const outputPath = readFlagValue(args, "--output");
  return outputPath === undefined ? undefined : { status: "ok", manifestPath, mode: "live", outputPath };
};

const readManifestPath = (args: readonly string[]): string | undefined => {
  return readFlagValue(args, "--manifest");
};

const readFlagValue = (args: readonly string[], flag: string): string | undefined => {
  const flagIndex = args.indexOf(flag);
  const value = flagIndex >= 0 ? args[flagIndex + 1] : undefined;
  return value === undefined || value.trim().length === 0
    ? undefined
    : value;
};

const parseArgsError = (): { readonly status: "error"; readonly message: string } => ({
  status: "error",
  message: "Usage: codex-capability-eval (--dry-run | --live --output <path>) --manifest <path>"
});

const isCliEntrypoint = (): boolean => {
  const entrypoint = process.argv[1];
  return entrypoint !== undefined && import.meta.url === pathToFileURL(entrypoint).href;
};

if (isCliEntrypoint()) {
  try {
    const result = await runCodexCapabilityEvalCli(process.argv.slice(2));
    if (result.status === "ok") {
      process.stdout.write(`${JSON.stringify(result.output, null, 2)}\n`);
    } else {
      process.stderr.write(`${result.message}\n`);
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}
