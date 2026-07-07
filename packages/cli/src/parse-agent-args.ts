import type {
  ParseArgsResult
} from "./parse-args.js";

const agentPacketUsage = "Usage: krn agent packet --run-id <id> [--json]";

export const formatAgentPacketUsage = (): string => [
  agentPacketUsage,
  "  note: returns a read-only DecisionPacket contract plus evidence/feedback return channels for headless agents"
].join("\n") + "\n";

const isValue = (value: string | undefined): value is string =>
  value !== undefined && value.trim().length > 0 && !value.startsWith("-");

export const parseAgentArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest[0] === "--help" || rest[0] === "-h") {
    return {
      command: {
        kind: "agentPacketHelp"
      }
    };
  }

  if (rest[0] !== "packet") {
    return {
      error: formatAgentPacketUsage()
    };
  }

  if (rest[1] === "--help" || rest[1] === "-h") {
    return {
      command: {
        kind: "agentPacketHelp"
      }
    };
  }

  let runId: string | undefined;

  for (let index = 1; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--json") {
      continue;
    }

    if (arg === "--run-id") {
      const value = rest[index + 1];

      if (!isValue(value)) {
        return {
          error: formatAgentPacketUsage()
        };
      }

      runId = value;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--run-id=") === true) {
      runId = arg.slice("--run-id=".length);
      continue;
    }

    return {
      error: formatAgentPacketUsage()
    };
  }

  if (!isValue(runId)) {
    return {
      error: formatAgentPacketUsage()
    };
  }

  return {
    command: {
      kind: "agentPacket",
      runId: runId.trim()
    }
  };
};
