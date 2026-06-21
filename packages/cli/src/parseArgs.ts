export type CliCommand =
  | {
      kind: "plan";
      task: string;
    }
  | {
      kind: "help";
    };

export interface ParseArgsResult {
  command?: CliCommand;
  error?: string;
}

const usage = "Usage: krn plan --task \"...\"";

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

  if (command !== "plan") {
    return {
      error: usage
    };
  }

  let task: string | undefined;

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
      task: task.trim()
    }
  };
};
