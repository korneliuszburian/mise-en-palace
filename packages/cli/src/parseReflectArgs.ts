import type {
  ParseArgsResult
} from "./parseArgs.js";
import {
  optionValue
} from "./parseArgHelpers.js";

const reflectUsage = "Usage: krn reflect --scope run:<id>|project:<id>|topic:<name> [--project <id>] [--persist]";
const topicUsage = "Usage: krn reflect --scope topic:<name> --project <id> [--persist]";

export const parseReflectArgs = (rest: readonly string[]): ParseArgsResult => {
  let persist = false;
  let scopeValue: string | undefined;
  let projectId: string | undefined;

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--persist") {
      persist = true;
      continue;
    }

    if (arg === "--scope" || arg?.startsWith("--scope=") === true) {
      const valueResult = optionValue(rest, index, "--scope");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? reflectUsage
        };
      }

      scopeValue = valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--project" || arg?.startsWith("--project=") === true) {
      const valueResult = optionValue(rest, index, "--project");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? reflectUsage
        };
      }

      projectId = valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    return {
      error: reflectUsage
    };
  }

  if (scopeValue === undefined || scopeValue.length === 0) {
    return {
      error: reflectUsage
    };
  }

  if (scopeValue.startsWith("run:")) {
    const id = scopeValue.slice("run:".length).trim();

    if (id.length === 0) {
      return {
        error: reflectUsage
      };
    }

    return {
      command: {
        kind: "reflect",
        scope: {
          kind: "run",
          id
        },
        persist
      }
    };
  }

  if (scopeValue.startsWith("project:")) {
    const id = scopeValue.slice("project:".length).trim();

    if (id.length === 0) {
      return {
        error: reflectUsage
      };
    }

    return {
      command: {
        kind: "reflect",
        scope: {
          kind: "project",
          id
        },
        persist
      }
    };
  }

  if (scopeValue.startsWith("topic:")) {
    const name = scopeValue.slice("topic:".length).trim();

    if (name.length === 0 || projectId === undefined || projectId.length === 0) {
      return {
        error: topicUsage
      };
    }

    return {
      command: {
        kind: "reflect",
        scope: {
          kind: "topic",
          name,
          projectId
        },
        persist
      }
    };
  }

  return {
    error: reflectUsage
  };
};
