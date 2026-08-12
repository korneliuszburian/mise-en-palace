import type {
  ParseArgsResult,
  TargetOwnerFileInput
} from "./parse-args.js";
import type {
  ParsedDatabaseOptions
} from "./parse-database-options.js";
import {
  parseDatabaseOptions
} from "./parse-database-options.js";

const initUsage =
  "Usage: krn init --dry-run --repo <path> [--backend sqlite|postgres] [--db-path <path>] [--owner-file \"path|root|kind|reason\"]|krn init --connect --repo <path> --persist [--backend sqlite|postgres] [--db-path <path>] [--owner-file \"path|root|kind|reason\"]";

const isOwnerFileParts = (
  parts: readonly string[]
): parts is readonly [string, string, string, string] =>
  parts.length === 4 && parts.every((part) => part.length > 0);

const parseOwnerFile = (value: string): TargetOwnerFileInput | undefined => {
  const parts = value.split("|").map((part) => part.trim());

  if (!isOwnerFileParts(parts)) {
    return undefined;
  }

  const [ownerPath, root, kind, reason] = parts;

  return {
    path: ownerPath,
    root,
    kind,
    reason
  };
};

interface InitParseState {
  dryRun: boolean;
  connect: boolean;
  persist: boolean;
  repo?: string;
  ownerFiles: TargetOwnerFileInput[];
}

type InitTokenParseResult =
  | {
      kind: "next";
      nextIndex: number;
    }
  | {
      kind: "error";
    };

const nextToken = (nextIndex: number): InitTokenParseResult => ({
  kind: "next",
  nextIndex
});

const parseOwnerFileOption = (
  rest: readonly string[],
  index: number,
  arg: string,
  state: InitParseState
): InitTokenParseResult | undefined => {
  if (arg === "--owner-file") {
    const value = rest[index + 1];

    if (value === undefined) {
      return {
        kind: "error"
      };
    }

    const parsed = parseOwnerFile(value);

    if (parsed === undefined) {
      return {
        kind: "error"
      };
    }

    state.ownerFiles.push(parsed);

    return nextToken(index + 1);
  }

  if (!arg.startsWith("--owner-file=")) {
    return undefined;
  }

  const parsed = parseOwnerFile(arg.slice("--owner-file=".length));

  if (parsed === undefined) {
    return {
      kind: "error"
    };
  }

  state.ownerFiles.push(parsed);

  return nextToken(index);
};

const parseRepoOption = (
  rest: readonly string[],
  index: number,
  arg: string,
  state: InitParseState
): InitTokenParseResult | undefined => {
  if (arg === "--repo") {
    const repo = rest[index + 1];

    if (repo === undefined) {
      return {
        kind: "error"
      };
    }

    state.repo = repo;

    return nextToken(index + 1);
  }

  if (!arg.startsWith("--repo=")) {
    return undefined;
  }

  state.repo = arg.slice("--repo=".length);

  return nextToken(index);
};

const parseInitToken = (
  rest: readonly string[],
  index: number,
  state: InitParseState
): InitTokenParseResult => {
  const arg = rest[index];

  if (arg === "--dry-run") {
    state.dryRun = true;

    return nextToken(index);
  }

  if (arg === "--connect") {
    state.connect = true;

    return nextToken(index);
  }

  if (arg === "--persist") {
    state.persist = true;

    return nextToken(index);
  }

  if (arg === undefined) {
    return {
      kind: "error"
    };
  }

  const repo = parseRepoOption(rest, index, arg, state);

  if (repo !== undefined) {
    return repo;
  }

  const ownerFile = parseOwnerFileOption(rest, index, arg, state);

  if (ownerFile !== undefined) {
    return ownerFile;
  }

  return {
    kind: "error"
  };
};

const formatInitResult = (
  state: InitParseState,
  databaseOptions: ParsedDatabaseOptions
): ParseArgsResult => {
  if (state.repo === undefined || state.repo.trim().length === 0 || state.dryRun === state.connect) {
    return {
      error: initUsage
    };
  }

  if (state.connect && !state.persist) {
    return {
      error: initUsage
    };
  }

  const ownerFiles = state.ownerFiles.length === 0 ? {} : { ownerFiles: state.ownerFiles };

  if (state.connect) {
    return {
      command: {
        kind: "init",
        mode: "connect",
        repo: state.repo.trim(),
        persist: state.persist,
        ...databaseOptions,
        ...ownerFiles
      }
    };
  }

  return {
    command: {
      kind: "init",
      mode: "dryRun",
      repo: state.repo.trim(),
      ...databaseOptions,
      ...ownerFiles
    }
  };
};

export const parseInitArgs = (rest: readonly string[]): ParseArgsResult => {
  const databaseOptions = parseDatabaseOptions(rest);

  if (databaseOptions.kind === "error") {
    return { error: initUsage };
  }

  const state: InitParseState = {
    dryRun: false,
    connect: false,
    persist: false,
    ownerFiles: []
  };

  for (let index = 0; index < databaseOptions.positional.length; index += 1) {
    const parsed = parseInitToken(databaseOptions.positional, index, state);

    if (parsed.kind === "error") {
      return {
        error: initUsage
      };
    }

    index = parsed.nextIndex;
  }

  return formatInitResult(state, databaseOptions.options);
};
