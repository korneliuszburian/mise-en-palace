import {
  optionValue
} from "./parse-cli-options.js";
import {
  parseBrainKnowledgeArgs
} from "./parse-brain-knowledge-args.js";
import type {
  ParseArgsResult
} from "./parse-args.js";

const brainSearchUsage = [
  "Usage: krn brain search --query \"...\" [--catalog-file <path>|--store-only] [--project <project-id>] [--limit <positive-integer>] [--max-inclusions <positive-integer>] [--json]",
  "Usage: krn brain knowledge [--card-file <path>|--pattern-file <path>|--catalog-file <path>] [--kind <kind>] [--status <status>] [--reviewability <reviewability>] [--usefulness-outcome <outcome|none>] [--text <query>] [--limit <positive-integer>] [--json|--html]",
  "",
  "Read-only preview commands:",
  "krn brain search --query \"unknown-first TypeScript boundary\"",
  "krn brain knowledge --text \"unknown-first\"",
  "krn brain search --query \"source-to-decision\" --project project-explicit --json",
  "  note: brain search defaults to DB-backed MemoryRecord readback plus source-search. --catalog-file is an explicit legacy catalog preview mode; --store-only keeps file catalog readback disabled. It does not scan, rank, persist, mutate Memory Core, or start a product server"
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
  storeOnlyExplicit: boolean;
  projectId: string | undefined;
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

type BrainSearchOptionParser = (
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

const brainSearchOptionParsers: Record<string, BrainSearchOptionParser> = {
  "--query": (args, index, state) =>
    assignStringOption(args, index, "--query", (value) => {
      state.query = value;
    }),
  "--catalog-file": (args, index, state) =>
    assignStringOption(args, index, "--catalog-file", (value) => {
      state.catalogFiles.push(value);
      state.storeOnly = false;
    }),
  "--project": (args, index, state) => {
    const parsed = parseRequiredValue(args, index, "--project");

    if (!parsed.ok) {
      return parsed;
    }

    if (parsed.value.length === 0) {
      return {
        ok: false,
        error: `--project requires a non-empty project id\n${formatBrainSearchUsage()}`
      };
    }
    state.projectId = parsed.value;

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  },
  "--store-only": (_args, index, state) => {
    state.storeOnly = true;
    state.storeOnlyExplicit = true;

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
  const parser = brainSearchOptionParsers[optionName(arg)];

  return parser === undefined
    ? {
        ok: false,
        error: `Unsupported brain search argument: ${arg}\n${formatBrainSearchUsage()}`
      }
    : parser(args, index, state);
};

const brainSearchHelp = (): ParseArgsResult => ({
  command: {
    kind: "brainSearchHelp"
  }
});

const createBrainSearchParseState = (): BrainSearchParseState => ({
  query: undefined,
  catalogFiles: [],
  storeOnly: true,
  storeOnlyExplicit: false,
  projectId: undefined,
  limit: undefined,
  maxInclusions: undefined,
  format: "text"
});

const parseBrainSearchOptions = (
  args: readonly string[],
  state: BrainSearchParseState
): { ok: true } | { ok: false; error: string } => {
  for (let index = 0; index < args.length; index += 1) {
    const parsed = parseBrainSearchOption(args, index, state);

    if (!parsed.ok) {
      return {
        ok: false,
        error: parsed.error
      };
    }

    index = parsed.nextIndex;
  }

  return {
    ok: true
  };
};

const validateBrainSearchState = (
  state: BrainSearchParseState
): { ok: true; query: string } | { ok: false; error: string } => {
  const query = state.query?.trim();

  if (query === undefined || query.length === 0) {
    return {
      ok: false,
      error: `Missing required --query\n${formatBrainSearchUsage()}`
    };
  }

  if (state.storeOnlyExplicit && state.catalogFiles.length > 0) {
    return {
      ok: false,
      error: `--store-only cannot be combined with --catalog-file\n${formatBrainSearchUsage()}`
    };
  }

  return {
    ok: true,
    query
  };
};

const buildBrainSearchCommand = (
  state: BrainSearchParseState,
  query: string
): ParseArgsResult => {
  return {
    command: {
      kind: "brainSearch",
      query,
      catalogFiles: state.catalogFiles,
      storeOnly: state.storeOnly,
      format: state.format,
      ...(state.projectId === undefined ? {} : { projectId: state.projectId }),
      ...(state.limit === undefined ? {} : { limit: state.limit }),
      ...(state.maxInclusions === undefined ? {} : { maxInclusions: state.maxInclusions })
    }
  };
};

const parseBrainSearchArgs = (args: readonly string[]): ParseArgsResult => {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return brainSearchHelp();
  }

  const state = createBrainSearchParseState();
  const parsed = parseBrainSearchOptions(args, state);

  if (!parsed.ok) {
    return {
      error: parsed.error
    };
  }

  const validation = validateBrainSearchState(state);

  return validation.ok
    ? buildBrainSearchCommand(state, validation.query)
    : { error: validation.error };
};

export const parseBrainArgs = (rest: readonly string[]): ParseArgsResult => {
  const [action, ...args] = rest;

  if (action === undefined || action === "--help" || action === "-h") {
    return brainSearchHelp();
  }

  if (action === "knowledge") {
    return parseBrainKnowledgeArgs(args);
  }

  return action === "search"
    ? parseBrainSearchArgs(args)
    : {
        error: `Unsupported brain command: ${action}\n${formatBrainSearchUsage()}`
      };
};
