import {
  parseBackendKind
} from "@krn/db";
import type {
  BackendKind
} from "@krn/db";

export interface ParsedDatabaseOptions {
  backend?: BackendKind;
  dbPath?: string;
}

export type ParseDatabaseOptionsResult =
  | {
      kind: "parsed";
      options: ParsedDatabaseOptions;
      positional: readonly string[];
    }
  | {
      kind: "error";
    };

const optionValue = (
  args: readonly string[],
  index: number,
  option: "--backend" | "--db-path"
): { value: string; nextIndex: number } | undefined => {
  const arg = args[index];

  if (arg === option) {
    const value = args[index + 1]?.trim();
    return value === undefined || value.length === 0
      ? undefined
      : { value, nextIndex: index + 1 };
  }

  const prefix = `${option}=`;
  if (arg?.startsWith(prefix) !== true) {
    return undefined;
  }

  const value = arg.slice(prefix.length).trim();
  return value.length === 0 ? undefined : { value, nextIndex: index };
};

export const parseDatabaseOptions = (
  args: readonly string[]
): ParseDatabaseOptionsResult => {
  const positional: string[] = [];
  let backend: BackendKind | undefined;
  let dbPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--backend" || arg?.startsWith("--backend=") === true) {
      if (backend !== undefined) {
        return { kind: "error" };
      }

      const parsed = optionValue(args, index, "--backend");
      if (parsed === undefined) {
        return { kind: "error" };
      }

      try {
        backend = parseBackendKind(parsed.value);
      } catch {
        return { kind: "error" };
      }

      index = parsed.nextIndex;
      continue;
    }

    if (arg === "--db-path" || arg?.startsWith("--db-path=") === true) {
      if (dbPath !== undefined) {
        return { kind: "error" };
      }

      const parsed = optionValue(args, index, "--db-path");
      if (parsed === undefined) {
        return { kind: "error" };
      }

      dbPath = parsed.value;
      index = parsed.nextIndex;
      continue;
    }

    if (arg === undefined) {
      return { kind: "error" };
    }

    positional.push(arg);
  }

  if (backend === "postgres" && dbPath !== undefined) {
    return { kind: "error" };
  }

  return {
    kind: "parsed",
    options: {
      ...(backend === undefined ? {} : { backend }),
      ...(dbPath === undefined ? {} : { dbPath })
    },
    positional
  };
};
