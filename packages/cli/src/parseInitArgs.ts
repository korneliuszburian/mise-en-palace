import type {
  ParseArgsResult,
  TargetOwnerFileInput
} from "./parseArgs.js";

const initUsage =
  "Usage: krn init --dry-run --repo <path> [--owner-file \"path|root|kind|reason\"]|krn init --connect --repo <path> --persist [--owner-file \"path|root|kind|reason\"]";

const parseOwnerFile = (value: string): TargetOwnerFileInput | undefined => {
  const parts = value.split("|").map((part) => part.trim());

  if (parts.length !== 4) {
    return undefined;
  }

  const [ownerPath, root, kind, reason] = parts;

  if (
    ownerPath === undefined ||
    ownerPath.length === 0 ||
    root === undefined ||
    root.length === 0 ||
    kind === undefined ||
    kind.length === 0 ||
    reason === undefined ||
    reason.length === 0
  ) {
    return undefined;
  }

  return {
    path: ownerPath,
    root,
    kind,
    reason
  };
};

export const parseInitArgs = (rest: readonly string[]): ParseArgsResult => {
  let dryRun = false;
  let connect = false;
  let persist = false;
  let repo: string | undefined;
  const ownerFiles: TargetOwnerFileInput[] = [];

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

    if (arg === "--owner-file") {
      const value = rest[index + 1];

      if (value === undefined) {
        return {
          error: initUsage
        };
      }

      const parsed = parseOwnerFile(value);

      if (parsed === undefined) {
        return {
          error: initUsage
        };
      }

      ownerFiles.push(parsed);
      index += 1;
      continue;
    }

    if (arg?.startsWith("--owner-file=") === true) {
      const parsed = parseOwnerFile(arg.slice("--owner-file=".length));

      if (parsed === undefined) {
        return {
          error: initUsage
        };
      }

      ownerFiles.push(parsed);
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
        persist,
        ...(ownerFiles.length === 0 ? {} : { ownerFiles })
      }
    };
  }

  return {
    command: {
      kind: "init",
      mode: "dryRun",
      repo: repo.trim(),
      ...(ownerFiles.length === 0 ? {} : { ownerFiles })
    }
  };
};
