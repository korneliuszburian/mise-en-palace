import type {
  ParseArgsResult
} from "./parseArgs.js";

const initUsage = "Usage: krn init --dry-run --repo <path>|krn init --connect --repo <path> --persist";

export const parseInitArgs = (rest: readonly string[]): ParseArgsResult => {
  let dryRun = false;
  let connect = false;
  let persist = false;
  let repo: string | undefined;

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--connect") {
      connect = true;
      continue;
    }

    if (arg === "--persist") {
      persist = true;
      continue;
    }

    if (arg === "--repo") {
      repo = rest[index + 1];
      index += 1;
      continue;
    }

    if (arg?.startsWith("--repo=") === true) {
      repo = arg.slice("--repo=".length);
      continue;
    }

    return {
      error: initUsage
    };
  }

  if (repo === undefined || repo.trim().length === 0 || dryRun === connect) {
    return {
      error: initUsage
    };
  }

  if (connect && !persist) {
    return {
      error: initUsage
    };
  }

  if (connect) {
    return {
      command: {
        kind: "init",
        mode: "connect",
        repo: repo.trim(),
        persist
      }
    };
  }

  return {
    command: {
      kind: "init",
      mode: "dryRun",
      repo: repo.trim()
    }
  };
};
