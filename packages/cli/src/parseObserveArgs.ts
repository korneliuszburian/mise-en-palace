import type {
  ParseArgsResult
} from "./parseArgs.js";
import {
  optionValue
} from "./parseArgHelpers.js";

const observeUsage = "Usage: krn observe --run <id> [--project <id>] [--persist]";

export const parseObserveArgs = (rest: readonly string[]): ParseArgsResult => {
  let persist = false;
  let runId: string | undefined;
  let projectId: string | undefined;

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--persist") {
      persist = true;
      continue;
    }

    if (arg === "--run" || arg?.startsWith("--run=") === true) {
      const valueResult = optionValue(rest, index, "--run");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? observeUsage
        };
      }

      runId = valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--project" || arg?.startsWith("--project=") === true) {
      const valueResult = optionValue(rest, index, "--project");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? observeUsage
        };
      }

      projectId = valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    return {
      error: observeUsage
    };
  }

  if (runId === undefined || runId.length === 0) {
    return {
      error: observeUsage
    };
  }

  return {
    command: {
      kind: "observeRun",
      runId,
      ...(projectId === undefined || projectId.length === 0 ? {} : { projectId }),
      persist
    }
  };
};
