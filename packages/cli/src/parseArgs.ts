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
    }
  | {
      kind: "evidenceCapture";
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
  "krn db smoke",
  "krn evidence capture"
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
          kind: "dbSmoke"
        }
      };
    }

    return {
      error: "Usage: krn db readiness|smoke"
    };
  }

  if (command === "evidence") {
    if (rest.length === 1 && rest[0] === "capture") {
      return {
        command: {
          kind: "evidenceCapture"
        }
      };
    }

    return {
      error: "Usage: krn evidence capture"
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
