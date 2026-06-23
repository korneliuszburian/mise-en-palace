import type {
  ParseArgsResult
} from "./parseArgs.js";

const defaultPlanUsage = "Usage: krn plan --task \"...\"";

export const parsePlanArgs = (
  rest: readonly string[],
  usage = defaultPlanUsage
): ParseArgsResult => {
  let task: string | undefined;
  let persist = false;
  let projectId: string | undefined;

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--project") {
      projectId = rest[index + 1];
      index += 1;
      continue;
    }

    if (arg?.startsWith("--project=") === true) {
      projectId = arg.slice("--project=".length);
      continue;
    }

    if (arg === "--task") {
      task = rest[index + 1];
      index += 1;
      continue;
    }

    if (arg?.startsWith("--task=") === true) {
      task = arg.slice("--task=".length);
      continue;
    }

    if (arg === "--persist") {
      persist = true;
      continue;
    }

    return {
      error: usage
    };
  }

  if (task === undefined || task.trim().length === 0) {
    return {
      error: usage
    };
  }

  return {
    command: {
      kind: "plan",
      task: task.trim(),
      persist,
      ...(projectId === undefined || projectId.trim().length === 0
        ? {}
        : { projectId: projectId.trim() })
    }
  };
};
