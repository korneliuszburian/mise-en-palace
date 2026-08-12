import type {
  ParseArgsResult
} from "./parse-args.js";
import {
  parseDatabaseOptions
} from "./parse-database-options.js";

export const parseDoctorArgs = (rest: readonly string[]): ParseArgsResult => {
  const parsed = parseDatabaseOptions(rest);

  if (parsed.kind === "error" || parsed.positional.length > 0) {
    return {
      error: "Usage: krn doctor [--backend sqlite|postgres] [--db-path <path>]"
    };
  }

  return {
    command: {
      kind: "doctor",
      ...parsed.options
    }
  };
};
