import type {
  ParseArgsResult
} from "./parseArgs.js";

const evidenceUsage = "Usage: krn evidence capture [--run-id <id>] [--persist]";

export const parseEvidenceArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest[0] !== "capture") {
    return {
      error: evidenceUsage
    };
  }

  let persist = false;
  let runId: string | undefined;

  for (let index = 1; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--persist") {
      persist = true;
      continue;
    }

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
      error: evidenceUsage
    };
  }

  return {
    command: {
      kind: "evidenceCapture",
      persist,
      ...(runId === undefined ? {} : { runId: runId.trim() })
    }
  };
};
