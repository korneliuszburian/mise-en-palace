import type {
  ParseArgsResult
} from "./parseArgs.js";

export const parseDoctorArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length > 0) {
    return {
      error: "Usage: krn doctor"
    };
  }

  return {
    command: {
      kind: "doctor"
    }
  };
};
