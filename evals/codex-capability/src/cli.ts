import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { parseCodexCapabilityEvalManifest } from "./contracts.js";
import { createCodexCapabilityDryRunPlan } from "./dry-run-plan.js";

export type CodexCapabilityEvalCliResult =
  | {
      readonly status: "ok";
      readonly output: unknown;
    }
  | {
      readonly status: "error";
      readonly message: string;
    };

export const runCodexCapabilityEvalCli = (
  args: readonly string[]
): CodexCapabilityEvalCliResult => {
  const parsed = parseArgs(args);
  if (parsed.status === "error") return parsed;

  const manifestText = readFileSync(parsed.manifestPath, "utf8");
  const manifestJson: unknown = JSON.parse(manifestText);
  const manifest = parseCodexCapabilityEvalManifest(manifestJson);
  const plan = createCodexCapabilityDryRunPlan(manifest);

  return {
    status: "ok",
    output: plan
  };
};

const parseArgs = (
  args: readonly string[]
): { readonly status: "ok"; readonly manifestPath: string } | { readonly status: "error"; readonly message: string } => {
  const manifestPath = readManifestPath(args);
  return args.includes("--dry-run") && manifestPath !== undefined
    ? { status: "ok", manifestPath }
    : parseArgsError();
};

const readManifestPath = (args: readonly string[]): string | undefined => {
  const manifestFlagIndex = args.indexOf("--manifest");
  const manifestPath = manifestFlagIndex >= 0 ? args[manifestFlagIndex + 1] : undefined;
  return manifestPath === undefined || manifestPath.trim().length === 0
    ? undefined
    : manifestPath;
};

const parseArgsError = (): { readonly status: "error"; readonly message: string } => ({
  status: "error",
  message: "Usage: codex-capability-eval --dry-run --manifest <path>"
});

const isCliEntrypoint = (): boolean => {
  const entrypoint = process.argv[1];
  return entrypoint !== undefined && import.meta.url === pathToFileURL(entrypoint).href;
};

if (isCliEntrypoint()) {
  try {
    const result = runCodexCapabilityEvalCli(process.argv.slice(2));
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
