import { pathToFileURL } from "node:url";

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

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

  if (result.status !== "pass") {
    process.exitCode = 1;
  }
};
