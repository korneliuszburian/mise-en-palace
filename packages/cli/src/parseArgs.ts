export type CliCommand =
  | {
      kind: "plan";
      task: string;
      persist: boolean;
    }
  | {
      kind: "doctor";
    }
  | {
      kind: "dbReadiness";
    }
  | {
      kind: "dbSmoke";
      target: "project" | "harnessPlan" | "harnessEvidence" | "sourceGraph";
    }
  | {
      kind: "evidenceCapture";
      persist: boolean;
      runId?: string;
    }
  | {
      kind: "help";
    };

export interface ParseArgsResult {
  command?: CliCommand;
  error?: string;
}

const usage = [
  "Usage: krn plan --task \"...\" [--persist]",
  "",
  "Other commands:",
  "krn doctor",
  "krn db readiness",
  "krn db smoke [harness-plan|harness-evidence|source-graph]",
  "krn evidence capture [--run-id <id>] [--persist]"
].join("\n");

export const formatUsage = (): string => `${usage}\n`;

export const parseArgs = (args: readonly string[]): ParseArgsResult => {
  const [command, ...rest] = args;

  if (command === undefined || command === "--help" || command === "-h") {
    return {
      command: {
        kind: "help"
      }
    };
  }

  if (command === "doctor") {
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
  }

  if (command === "db") {
    if (rest.length === 1 && rest[0] === "readiness") {
      return {
        command: {
          kind: "dbReadiness"
        }
      };
    }

    if (rest.length === 1 && rest[0] === "smoke") {
      return {
        command: {
          kind: "dbSmoke",
          target: "project"
        }
      };
    }

    if (rest.length === 2 && rest[0] === "smoke" && rest[1] === "harness-plan") {
      return {
        command: {
          kind: "dbSmoke",
          target: "harnessPlan"
        }
      };
    }

    if (rest.length === 2 && rest[0] === "smoke" && rest[1] === "harness-evidence") {
      return {
        command: {
          kind: "dbSmoke",
          target: "harnessEvidence"
        }
      };
    }

    if (rest.length === 2 && rest[0] === "smoke" && rest[1] === "source-graph") {
      return {
        command: {
          kind: "dbSmoke",
          target: "sourceGraph"
        }
      };
    }

    return {
      error: "Usage: krn db readiness|smoke [harness-plan|harness-evidence|source-graph]"
    };
  }

  if (command === "evidence") {
    if (rest[0] === "capture") {
      let persist = false;
      let runId: string | undefined;

      for (let index = 1; index < rest.length; index += 1) {
        const arg = rest[index];

        if (arg === "--persist") {
          persist = true;
          continue;
        }

        if (arg === "--run-id") {
          runId = rest[index + 1];
          index += 1;
          continue;
        }

        if (arg?.startsWith("--run-id=") === true) {
          runId = arg.slice("--run-id=".length);
          continue;
        }

        return {
          error: "Usage: krn evidence capture [--run-id <id>] [--persist]"
        };
      }

      return {
        command: {
          kind: "evidenceCapture",
          persist,
          ...(runId === undefined ? {} : { runId: runId.trim() })
        }
      };
    }

    return {
      error: "Usage: krn evidence capture [--run-id <id>] [--persist]"
    };
  }

  if (command !== "plan") {
    return {
      error: "Usage: krn plan --task \"...\""
    };
  }

  let task: string | undefined;
  let persist = false;

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

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
      persist
    }
  };
};
