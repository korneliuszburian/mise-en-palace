import {
  optionValue
} from "./parseArgHelpers.js";
import type {
  ParseArgsResult
} from "./parseArgs.js";

const brainSearchUsage = [
  "Usage: krn brain search --query \"...\" [--catalog-file <path>|--store-only] [--limit <positive-integer>] [--max-inclusions <positive-integer>] [--json]",
  "Usage: krn brain knowledge [--card-file <path>|--pattern-file <path>|--catalog-file <path>] [--kind <kind>] [--status <status>] [--reviewability <reviewability>] [--usefulness-outcome <outcome|none>] [--text <query>] [--limit <positive-integer>] [--json|--html]",
  "",
  "Read-only preview commands:",
  "krn brain search --query \"unknown-first TypeScript boundary\"",
  "krn brain search --query \"source-to-decision\" --catalog-file docs/brain-knowledge/catalog.json --json",
  "krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text unknown-first",
  "  note: brain search composes existing source-search and brain-knowledge readbacks; --store-only skips file catalog readback. It does not scan, rank, persist, mutate Memory Core, or start a product server"
].join("\n");

export const formatBrainSearchUsage = (): string => `${brainSearchUsage}\n`;

const parsePositiveInteger = (
  value: string,
  label: string
): { ok: true; value: number } | { ok: false; error: string } => {
  const trimmed = value.trim();

  if (!/^[1-9]\d*$/u.test(trimmed)) {
    return {
      ok: false,
      error: `Unsupported brain search ${label}: ${value}`
    };
  }

  const parsed = Number(trimmed);

  if (!Number.isSafeInteger(parsed)) {
    return {
      ok: false,
      error: `Unsupported brain search ${label}: ${value}`
    };
  }

  return {
    ok: true,
    value: parsed
  };
};

type BrainSearchParseState = {
  query: string | undefined;
  catalogFiles: string[];
  storeOnly: boolean;
  limit: number | undefined;
  maxInclusions: number | undefined;
  format: "text" | "json";
};

type BrainSearchOptionResult =
  | {
      ok: true;
      nextIndex: number;
    }
  | {
      ok: false;
      error: string;
    };

const parseRequiredValue = (
  args: readonly string[],
  index: number,
  optionName: string
): { ok: true; value: string; nextIndex: number } | { ok: false; error: string } => {
  const parsed = optionValue(args, index, optionName);

  if (parsed.error !== undefined || parsed.value === undefined) {
    return {
      ok: false,
      error: `${parsed.error ?? `${optionName} requires a value`}\n${formatBrainSearchUsage()}`
    };
  }

  return {
    ok: true,
    value: parsed.value.trim(),
    nextIndex: parsed.nextIndex
  };
};

type BrainSearchOptionHandler = (
  args: readonly string[],
  index: number,
  state: BrainSearchParseState
 ) => BrainSearchOptionResult;

const assignStringOption = (
  args: readonly string[],
  index: number,
  optionName: string,
  assign: (value: string) => void
): BrainSearchOptionResult => {
  const parsed = parseRequiredValue(args, index, optionName);

  if (!parsed.ok) {
    return parsed;
  }

  assign(parsed.value);

  return {
    ok: true,
    nextIndex: parsed.nextIndex
  };
};

const assignPositiveIntegerOption = (
  args: readonly string[],
  index: number,
  optionName: string,
  label: string,
  assign: (value: number) => void
): BrainSearchOptionResult => {
  const parsed = parseRequiredValue(args, index, optionName);

  if (!parsed.ok) {
    return parsed;
  }

  const integer = parsePositiveInteger(parsed.value, label);

  if (!integer.ok) {
    return {
      ok: false,
      error: `${integer.error}\n${formatBrainSearchUsage()}`
    };
  }

  assign(integer.value);

  return {
    ok: true,
    nextIndex: parsed.nextIndex
  };
};

const brainSearchOptionHandlers: Record<string, BrainSearchOptionHandler> = {
  "--query": (args, index, state) =>
    assignStringOption(args, index, "--query", (value) => {
      state.query = value;
    }),
  "--catalog-file": (args, index, state) =>
    assignStringOption(args, index, "--catalog-file", (value) => {
      state.catalogFiles.push(value);
    }),
  "--store-only": (_args, index, state) => {
    state.storeOnly = true;

    return {
      ok: true,
      nextIndex: index
    };
  },
  "--limit": (args, index, state) =>
    assignPositiveIntegerOption(args, index, "--limit", "limit", (value) => {
      state.limit = value;
    }),
  "--max-inclusions": (args, index, state) =>
    assignPositiveIntegerOption(args, index, "--max-inclusions", "max inclusions", (value) => {
      state.maxInclusions = value;
    }),
  "--json": (_args, index, state) => {
    state.format = "json";

    return {
      ok: true,
      nextIndex: index
    };
  }
};

const optionName = (arg: string): string =>
  arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg;

const parseBrainSearchOption = (
  args: readonly string[],
  index: number,
  state: BrainSearchParseState
): BrainSearchOptionResult => {
  const arg = args[index]!;
  const handler = brainSearchOptionHandlers[optionName(arg)];

  return handler === undefined
    ? {
        ok: false,
        error: `Unsupported brain search argument: ${arg}\n${formatBrainSearchUsage()}`
      }
    : handler(args, index, state);
};

export const parseBrainArgs = (rest: readonly string[]): ParseArgsResult => {
  const [action, ...args] = rest;

  if (action === undefined || action === "--help" || action === "-h") {
    return {
      command: {
        kind: "brainSearchHelp"
      }
    };
  }

  if (action !== "search") {
    return {
      error: `Unsupported brain command: ${action}\n${formatBrainSearchUsage()}`
    };
  }

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return {
      command: {
        kind: "brainSearchHelp"
      }
    };
  }

  const state: BrainSearchParseState = {
    query: undefined,
    catalogFiles: [],
    storeOnly: false,
    limit: undefined,
    maxInclusions: undefined,
    format: "text"
  };

  for (let index = 0; index < args.length; index += 1) {
    const parsed = parseBrainSearchOption(args, index, state);

    if (!parsed.ok) {
      return {
        error: parsed.error
      };
    }

    index = parsed.nextIndex;
  }

  if (state.query === undefined || state.query.trim().length === 0) {
    return {
      error: `Missing required --query\n${formatBrainSearchUsage()}`
    };
  }

  if (state.storeOnly && state.catalogFiles.length > 0) {
    return {
      error: `--store-only cannot be combined with --catalog-file\n${formatBrainSearchUsage()}`
    };
  }

  return {
    command: {
      kind: "brainSearch",
      query: state.query.trim(),
      catalogFiles: state.catalogFiles,
      storeOnly: state.storeOnly,
      format: state.format,
      ...(state.limit === undefined ? {} : { limit: state.limit }),
      ...(state.maxInclusions === undefined ? {} : { maxInclusions: state.maxInclusions })
    }
  };
};
