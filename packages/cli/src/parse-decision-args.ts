import type {
  ParseArgsResult
} from "./parse-args.js";

const decisionPacketUsage = "Usage: krn decision packet --run-id <id> [--json]";

export const formatDecisionPacketUsage = (): string => [
  decisionPacketUsage,
  "  note: returns a read-only DecisionPacket contract plus evidence/feedback return channels for headless agents"
].join("\n") + "\n";

const isValue = (value: string | undefined): value is string =>
  value !== undefined && value.trim().length > 0 && !value.startsWith("-");

const decisionPacketHelp = (): ParseArgsResult => ({
  command: {
    kind: "decisionPacketHelp"
  }
});

const decisionPacketUsageError = (): ParseArgsResult => ({
  error: formatDecisionPacketUsage()
});

type DecisionPacketOptionsParseResult =
  | { kind: "parsed"; runId: string }
  | { kind: "error" };

const parseDecisionPacketOptions = (
  rest: readonly string[]
): DecisionPacketOptionsParseResult => {
  let runId: string | undefined;

  for (let index = 1; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--json") {
      continue;
    }

    if (arg === "--run-id") {
      const value = rest[index + 1];

      if (!isValue(value)) {
        return { kind: "error" };
      }

      runId = value;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--run-id=") === true) {
      runId = arg.slice("--run-id=".length);
      continue;
    }

    return { kind: "error" };
  }

  return isValue(runId)
    ? { kind: "parsed", runId: runId.trim() }
    : { kind: "error" };
};

export const parseDecisionArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest[0] === "--help" || rest[0] === "-h") {
    return decisionPacketHelp();
  }

  if (rest[0] !== "packet") {
    return decisionPacketUsageError();
  }

  if (rest[1] === "--help" || rest[1] === "-h") {
    return decisionPacketHelp();
  }

  const options = parseDecisionPacketOptions(rest);

  if (options.kind === "error") {
    return decisionPacketUsageError();
  }

  return {
    command: {
      kind: "decisionPacket",
      runId: options.runId
    }
  };
};
