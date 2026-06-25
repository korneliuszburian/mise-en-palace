import type {
  ParseArgsResult
} from "./parseArgs.js";

export const formatRunUsage = (): string =>
  [
    "Usage: krn run show --run-id <execution-run-id> [--json]",
    "",
    "Read-only operator commands:",
    "krn run show --run-id <execution-run-id> [--json]",
    "  note: run show reads persisted state; it does not mutate memory, evidence, or run records"
  ].join("\n") + "\n";

export const parseRunArgs = (rest: readonly string[]): ParseArgsResult => {
  const [action, ...args] = rest;

  if (action === undefined || action === "--help" || action === "-h") {
    return {
      command: {
        kind: "runShowHelp"
      }
    };
  }

  if (action !== "show") {
    return {
      error: `Unsupported run command: ${action}\n${formatRunUsage()}`
    };
  }

  let runId: string | undefined;
  let format: "text" | "json" = "text";

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--run-id" || arg === "--run") {
      runId = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--json") {
      format = "json";
      continue;
    }

    return {
      error: `Unsupported run show argument: ${arg}\n${formatRunUsage()}`
    };
  }

  if (runId === undefined || runId.trim().length === 0) {
    return {
      error: `Missing required --run-id\n${formatRunUsage()}`
    };
  }

  return {
    command: {
      kind: "runShow",
      runId,
      format
    }
  };
};
