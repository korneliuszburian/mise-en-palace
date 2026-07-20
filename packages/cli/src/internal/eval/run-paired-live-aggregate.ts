import { stat } from "node:fs/promises";

import {
  aggregatePairedEvalMixedInputs,
  isPairedEvalEvidenceFamily,
  type PairedEvalEvidenceFamily
} from "./paired-live-aggregation.js";

const usage = "Usage: run-paired-live-aggregate <family=artifact-directory> [...]";

const parseInput = (value: string): { readonly family: PairedEvalEvidenceFamily; readonly directory: string } => {
  const separator = value.indexOf("=");
  const family = separator < 0 ? undefined : value.slice(0, separator);
  const directory = separator < 0 ? "" : value.slice(separator + 1);
  if (family === undefined || !isPairedEvalEvidenceFamily(family) || directory.length === 0) {
    throw new Error(`${usage}\nInvalid input: ${value}`);
  }
  return { family, directory };
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
  const report = await aggregatePairedEvalMixedInputs({
    artifactDirectories: directories,
    resultFiles: files.map(({ family, directory: file }) => ({ family, file }))
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
};

if (process.argv[1]?.endsWith("run-paired-live-aggregate.ts") === true) {
  await main();
}
