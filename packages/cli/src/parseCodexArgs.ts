import type {
  ParseArgsResult
} from "./parseArgs.js";

const codexUsage = "Usage: krn codex brief --run-id <id>";

export const parseCodexArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest[0] !== "brief") {
    return {
      error: codexUsage
    };
  }

  let runId: string | undefined;

  for (let index = 1; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--run-id") {
      runId = rest[index + 1];
      index += 1;
      continue;
    }

    if (arg?.startsWith("--run-id=") === true) {
      runId = arg.slice("--run-id=".length);
      continue;
    }

    return {
      error: codexUsage
    };
  }

  if (runId === undefined || runId.trim().length === 0) {
    return {
      error: codexUsage
    };
  }

  return {
    command: {
      kind: "codexBrief",
      runId: runId.trim()
    }
  };
};
