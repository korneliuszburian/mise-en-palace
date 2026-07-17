import { stat } from "node:fs/promises";

import {
  aggregatePairedEvalArtifactDirectories,
  aggregatePairedEvalResultFiles
} from "./paired-live-aggregation.js";
import type { PairedEvalFamily } from "./paired-live-codex-repair.js";

const families: readonly PairedEvalFamily[] = ["env-config", "async-job", "weak-json"];

const usage = "Usage: run-paired-live-aggregate <family=artifact-directory> [...]";

const parseInput = (value: string): { readonly family: PairedEvalFamily; readonly directory: string } => {
  const separator = value.indexOf("=");
  const family = separator < 0 ? undefined : value.slice(0, separator);
  const directory = separator < 0 ? "" : value.slice(separator + 1);
  if (!families.includes(family as PairedEvalFamily) || directory.length === 0) {
    throw new Error(`${usage}\nInvalid input: ${value}`);
  }
  return { family: family as PairedEvalFamily, directory };
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  if (args.length === 0) throw new Error(usage);
  const inputs = args.map(parseInput);
  const files = [] as typeof inputs;
  const directories = [] as typeof inputs;
  for (const input of inputs) {
    (await stat(input.directory)).isFile() ? files.push(input) : directories.push(input);
  }
  if (files.length > 0 && directories.length > 0) {
    throw new Error("Use either artifact directories or generic result files in one report, not both.");
  }
  const report = files.length > 0
    ? await aggregatePairedEvalResultFiles(files.map(({ family, directory: file }) => ({ family, file })))
    : await aggregatePairedEvalArtifactDirectories(directories);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
};

if (process.argv[1]?.endsWith("run-paired-live-aggregate.ts") === true) {
  await main();
}
