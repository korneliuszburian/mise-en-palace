import {
  parseBackendKind
} from "@krn/db";
import type {
  BackendKind
} from "@krn/db";
import {
  parsedOptionValue
} from "./parse-cli-options.js";

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

// fallow-ignore-next-line complexity -- the shared DB option boundary keeps duplicate, missing, invalid-backend, and cross-option rejection explicit
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

      const parsed = parsedOptionValue(args, index, "--backend", "--backend requires a value");
      if (!parsed.ok || parsed.value.length === 0) {
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

      const parsed = parsedOptionValue(args, index, "--db-path", "--db-path requires a value");
      if (!parsed.ok || parsed.value.length === 0) {
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
