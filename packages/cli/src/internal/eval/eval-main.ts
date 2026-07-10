import { pathToFileURL } from "node:url";
import {
  collectEnvironmentFingerprint
} from "../../environment-fingerprint.js";

interface EvalMainResult {
  readonly status: string;
}

export const isCliEntrypoint = (
  metaUrl: string,
  argvEntry = process.argv[1]
): boolean => argvEntry !== undefined && metaUrl === pathToFileURL(argvEntry).href;

export const writeJsonEvalResult = async (
  run: () => Promise<EvalMainResult>
): Promise<void> => {
  const result = await run();
  const environmentFingerprint = await collectEnvironmentFingerprint({
    evaluatorVersion: "krn-evaluator.v1"
  });

  process.stdout.write(`${JSON.stringify({ ...result, environmentFingerprint }, null, 2)}\n`);

  if (result.status !== "pass") {
    process.exitCode = 1;
  }
};
