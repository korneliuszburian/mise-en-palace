import type {
  ParseArgsResult
} from "./parseArgs.js";

export const formatHeartbeatUsage = (): string =>
  [
    "Usage: krn heartbeat preview [--project <project-id>] [--memory-limit <n>] [--source-claim-limit <n>] [--near-expiry-days <n>] [--max-candidates <n>] [--evidence-ref <ref>] [--json]",
    "",
    "Read-only operator commands:",
    "krn heartbeat preview",
    "",
    "Optional:",
    "--project <project-id>",
    "--memory-limit <positive-integer>",
    "--source-claim-limit <positive-integer>",
    "--near-expiry-days <positive-integer>",
    "--max-candidates <positive-integer>",
    "--evidence-ref <ref>",
    "--json",
    "",
    "Note: heartbeat preview reads current Postgres memory/source state and renders candidate-only maintenance output. It does not mutate Memory Core, source truth, source decisions, worker runtime state, or DB schema."
  ].join("\n") + "\n";

const parsePositiveInteger = (
  value: string,
  option: string
): { ok: true; value: number } | { ok: false; error: string } => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed.toString() !== value.trim()) {
    return {
      ok: false,
      error: `${option} must be a positive integer`
    };
  }

  return {
    ok: true,
    value: parsed
  };
};

type HeartbeatParseState = {
  projectId: string | undefined;
  memoryLimit: number | undefined;
  sourceClaimLimit: number | undefined;
  nearExpiryDays: number | undefined;
  maxCandidates: number | undefined;
  evidenceRef: string | undefined;
  format: "text" | "json";
};

type ParseHeartbeatOptionResult =
  | {
      ok: true;
      nextIndex: number;
    }
  | {
      ok: false;
      error: string;
    };

type HeartbeatOptionHandler = (
  args: readonly string[],
  index: number,
  state: HeartbeatParseState
) => ParseHeartbeatOptionResult;

const requiredOption = (
  args: readonly string[],
  index: number,
  option: string
): { ok: true; value: string } | { ok: false; error: string } => {
  const value = args[index + 1];

  if (value === undefined || value.trim().length === 0) {
    return {
      ok: false,
      error: `${option} cannot be empty`
    };
  }

  return {
    ok: true,
    value: value.trim()
  };
};

const assignTextOption = (
  args: readonly string[],
  index: number,
  option: string,
  assign: (value: string) => void
): ParseHeartbeatOptionResult => {
  const required = requiredOption(args, index, option);

  if (!required.ok) {
    return {
      ok: false,
      error: `${required.error}\n${formatHeartbeatUsage()}`
    };
  }

  assign(required.value);

  return {
    ok: true,
    nextIndex: index + 1
  };
};

const assignPositiveIntegerOption = (
  args: readonly string[],
  index: number,
  option: string,
  assign: (value: number) => void
): ParseHeartbeatOptionResult => {
  const required = requiredOption(args, index, option);

  if (!required.ok) {
    return {
      ok: false,
      error: `${required.error}\n${formatHeartbeatUsage()}`
    };
  }

  const parsed = parsePositiveInteger(required.value, option);

  if (!parsed.ok) {
    return {
      ok: false,
      error: `${parsed.error}\n${formatHeartbeatUsage()}`
    };
  }

  assign(parsed.value);

  return {
    ok: true,
    nextIndex: index + 1
  };
};

const heartbeatOptionHandlers: Record<string, HeartbeatOptionHandler> = {
  "--project": (args, index, state) =>
    assignTextOption(args, index, "--project", (value) => {
      state.projectId = value;
    }),
  "--memory-limit": (args, index, state) =>
    assignPositiveIntegerOption(args, index, "--memory-limit", (value) => {
      state.memoryLimit = value;
    }),
  "--source-claim-limit": (args, index, state) =>
    assignPositiveIntegerOption(args, index, "--source-claim-limit", (value) => {
      state.sourceClaimLimit = value;
    }),
  "--near-expiry-days": (args, index, state) =>
    assignPositiveIntegerOption(args, index, "--near-expiry-days", (value) => {
      state.nearExpiryDays = value;
    }),
  "--max-candidates": (args, index, state) =>
    assignPositiveIntegerOption(args, index, "--max-candidates", (value) => {
      state.maxCandidates = value;
    }),
  "--evidence-ref": (args, index, state) =>
    assignTextOption(args, index, "--evidence-ref", (value) => {
      state.evidenceRef = value;
    }),
  "--json": (_args, index, state) => {
    state.format = "json";

    return {
      ok: true,
      nextIndex: index
    };
  }
};

const buildHeartbeatPreviewCommand = (state: HeartbeatParseState): ParseArgsResult => ({
  command: {
    kind: "heartbeatPreview",
    ...(state.projectId === undefined ? {} : { projectId: state.projectId }),
    ...(state.memoryLimit === undefined ? {} : { memoryLimit: state.memoryLimit }),
    ...(state.sourceClaimLimit === undefined ? {} : { sourceClaimLimit: state.sourceClaimLimit }),
    ...(state.nearExpiryDays === undefined ? {} : { nearExpiryDays: state.nearExpiryDays }),
    ...(state.maxCandidates === undefined ? {} : { maxCandidates: state.maxCandidates }),
    ...(state.evidenceRef === undefined ? {} : { evidenceRef: state.evidenceRef }),
    format: state.format
  }
});

export const parseHeartbeatArgs = (rest: readonly string[]): ParseArgsResult => {
  const [action, ...args] = rest;

  if (action === undefined || action === "--help" || action === "-h") {
    return {
      command: {
        kind: "heartbeatPreviewHelp"
      }
    };
  }

  if (action !== "preview") {
    return {
      error: `Unsupported heartbeat command: ${action}\n${formatHeartbeatUsage()}`
    };
  }

  const state: HeartbeatParseState = {
    projectId: undefined,
    memoryLimit: undefined,
    sourceClaimLimit: undefined,
    nearExpiryDays: undefined,
    maxCandidates: undefined,
    evidenceRef: undefined,
    format: "text"
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;
    const handler = heartbeatOptionHandlers[arg];

    if (handler === undefined) {
      return {
        error: `Unsupported heartbeat preview argument: ${arg}\n${formatHeartbeatUsage()}`
      };
    }

    const parsed = handler(args, index, state);

    if (!parsed.ok) {
      return {
        error: parsed.error
      };
    }

    index = parsed.nextIndex;
  }

  return buildHeartbeatPreviewCommand(state);
};
