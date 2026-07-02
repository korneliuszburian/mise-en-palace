import type {
  BrainKnowledgeKind,
  BrainKnowledgeReviewability,
  BrainKnowledgeStatus,
  BrainKnowledgeUsefulnessOutcomeFilter
} from "@krn/harness";
import {
  brainKnowledgeKindValues,
  brainKnowledgeReviewabilityValues,
  brainKnowledgeStatusValues,
  brainKnowledgeUsefulnessOutcomeFilterValues
} from "@krn/harness";
import {
  optionValue
} from "./parseArgHelpers.js";
import type {
  ParseArgsResult
} from "./parseArgs.js";

const knowledgeUsage = [
  "Usage: krn brain knowledge [--card-file <path>|--pattern-file <path>|--catalog-file <path>] [--kind <kind>] [--status <status>] [--reviewability <reviewability>] [--usefulness-outcome <outcome|none>] [--text <query>] [--limit <positive-integer>] [--json|--html]",
  "Legacy alias: krn knowledge cards [same options]",
  "",
  "Read-only preview commands:",
  "krn brain knowledge --card-file docs-or-fixture-card.json [--text unknown-first]",
  "krn brain knowledge --pattern-file docs/patterns/retained-patterns/pattern.json [--text unknown-first]",
  "krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json [--text unknown-first]",
  "  note: brain knowledge readback reads explicit card or retained-pattern files only; it does not scan, rank, persist, or mutate Memory Core",
  "  proof boundary: valid output proves only that supplied files match known read-model inputs and local filters"
].join("\n");

export const formatKnowledgeUsage = (): string => `${knowledgeUsage}\n`;

const isAllowed = <T extends string>(
  value: string,
  allowed: readonly T[]
): value is T =>
  allowed.some((item) => item === value);

const requiredOption = (
  value: string | undefined,
  usage: string
): { ok: true; value: string } | { ok: false; error: string } =>
  value === undefined ? { ok: false, error: usage } : { ok: true, value };

type ParseOptionResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      error: string;
    };

const parseRequiredOption = (
  args: readonly string[],
  index: number,
  optionName: string
): ParseOptionResult<string> => {
  const valueResult = optionValue(args, index, optionName);

  if (valueResult.error !== undefined) {
    return {
      ok: false,
      error: `${valueResult.error}\n${formatKnowledgeUsage()}`
    };
  }

  return requiredOption(valueResult.value, formatKnowledgeUsage());
};

const parseAllowedOption = <T extends string>(
  args: readonly string[],
  index: number,
  optionName: string,
  allowed: readonly T[],
  label: string
): ParseOptionResult<T> => {
  const required = parseRequiredOption(args, index, optionName);

  if (!required.ok) {
    return required;
  }

  if (!isAllowed(required.value, allowed)) {
    return {
      ok: false,
      error: `Unsupported knowledge ${label}: ${required.value}\n${formatKnowledgeUsage()}`
    };
  }

  return {
    ok: true,
    value: required.value
  };
};

const parsePositiveInteger = (
  value: string
): { ok: true; value: number } | { ok: false; error: string } => {
  const trimmed = value.trim();

  if (!/^[1-9]\d*$/u.test(trimmed)) {
    return {
      ok: false,
      error: `Unsupported brain knowledge limit: ${value}`
    };
  }

  const parsed = Number(trimmed);

  if (!Number.isSafeInteger(parsed)) {
    return {
      ok: false,
      error: `Unsupported brain knowledge limit: ${value}`
    };
  }

  return {
    ok: true,
    value: parsed
  };
};

type KnowledgeParseState = {
  cardFiles: string[];
  patternFiles: string[];
  catalogFiles: string[];
  kind: BrainKnowledgeKind | undefined;
  status: BrainKnowledgeStatus | undefined;
  reviewability: BrainKnowledgeReviewability | undefined;
  usefulnessOutcome: BrainKnowledgeUsefulnessOutcomeFilter | undefined;
  text: string | undefined;
  format: "text" | "json" | "html";
  limit: number | undefined;
};

type ParseKnowledgeOptionResult =
  | {
      ok: true;
      nextIndex: number;
    }
  | {
      ok: false;
      error: string;
    };

type KnowledgeOptionHandler = (
  args: readonly string[],
  index: number,
  state: KnowledgeParseState
) => ParseKnowledgeOptionResult;

const pushPathOption = (
  args: readonly string[],
  index: number,
  optionName: string,
  target: string[]
): ParseKnowledgeOptionResult => {
  const required = parseRequiredOption(args, index, optionName);

  if (!required.ok) {
    return required;
  }

  target.push(required.value.trim());

  return {
    ok: true,
    nextIndex: index + 1
  };
};

const knowledgeOptionHandlers: Record<string, KnowledgeOptionHandler> = {
  "--card-file": (args, index, state) =>
    pushPathOption(args, index, "--card-file", state.cardFiles),
  "--pattern-file": (args, index, state) =>
    pushPathOption(args, index, "--pattern-file", state.patternFiles),
  "--catalog-file": (args, index, state) =>
    pushPathOption(args, index, "--catalog-file", state.catalogFiles),
  "--kind": (args, index, state) => {
    const parsed = parseAllowedOption(args, index, "--kind", brainKnowledgeKindValues, "kind");

    if (!parsed.ok) {
      return parsed;
    }

    state.kind = parsed.value;

    return {
      ok: true,
      nextIndex: index + 1
    };
  },
  "--status": (args, index, state) => {
    const parsed = parseAllowedOption(
      args,
      index,
      "--status",
      brainKnowledgeStatusValues,
      "status"
    );

    if (!parsed.ok) {
      return parsed;
    }

    state.status = parsed.value;

    return {
      ok: true,
      nextIndex: index + 1
    };
  },
  "--reviewability": (args, index, state) => {
    const parsed = parseAllowedOption(
      args,
      index,
      "--reviewability",
      brainKnowledgeReviewabilityValues,
      "reviewability"
    );

    if (!parsed.ok) {
      return parsed;
    }

    state.reviewability = parsed.value;

    return {
      ok: true,
      nextIndex: index + 1
    };
  },
  "--usefulness-outcome": (args, index, state) => {
    const parsed = parseAllowedOption(
      args,
      index,
      "--usefulness-outcome",
      brainKnowledgeUsefulnessOutcomeFilterValues,
      "usefulness outcome"
    );

    if (!parsed.ok) {
      return parsed;
    }

    state.usefulnessOutcome = parsed.value;

    return {
      ok: true,
      nextIndex: index + 1
    };
  },
  "--text": (args, index, state) => {
    const required = parseRequiredOption(args, index, "--text");

    if (!required.ok) {
      return required;
    }

    state.text = required.value.trim();

    return {
      ok: true,
      nextIndex: index + 1
    };
  },
  "--limit": (args, index, state) => {
    const required = parseRequiredOption(args, index, "--limit");

    if (!required.ok) {
      return required;
    }

    const parsedLimit = parsePositiveInteger(required.value);

    if (!parsedLimit.ok) {
      return {
        ok: false,
        error: `${parsedLimit.error}\n${formatKnowledgeUsage()}`
      };
    }

    state.limit = parsedLimit.value;

    return {
      ok: true,
      nextIndex: index + 1
    };
  },
  "--json": (_args, index, state) => {
    state.format = "json";

    return {
      ok: true,
      nextIndex: index
    };
  },
  "--html": (_args, index, state) => {
    state.format = "html";

    return {
      ok: true,
      nextIndex: index
    };
  }
};

const validateKnowledgeSources = (
  state: KnowledgeParseState
): ParseOptionResult<undefined> => {
  if (
    state.cardFiles.length === 0 &&
    state.patternFiles.length === 0 &&
    state.catalogFiles.length === 0
  ) {
    return {
      ok: false,
      error: `Missing required --card-file, --pattern-file, or --catalog-file\n${formatKnowledgeUsage()}`
    };
  }

  if (
    state.cardFiles.some((cardFile) => cardFile.length === 0) ||
    state.patternFiles.some((patternFile) => patternFile.length === 0) ||
    state.catalogFiles.some((catalogFile) => catalogFile.length === 0)
  ) {
    return {
      ok: false,
      error: `Missing required --card-file, --pattern-file, or --catalog-file\n${formatKnowledgeUsage()}`
    };
  }

  return {
    ok: true,
    value: undefined
  };
};

const buildKnowledgeCardsCommand = (
  state: KnowledgeParseState
): ParseArgsResult => ({
  command: {
    kind: "knowledgeCards",
    cardFiles: state.cardFiles,
    patternFiles: state.patternFiles,
    catalogFiles: state.catalogFiles,
    filter: {
      ...(state.kind === undefined ? {} : { kind: state.kind }),
      ...(state.status === undefined ? {} : { status: state.status }),
      ...(state.reviewability === undefined ? {} : { reviewability: state.reviewability }),
      ...(state.usefulnessOutcome === undefined ? {} : { usefulnessOutcome: state.usefulnessOutcome }),
      ...(state.text === undefined || state.text.length === 0 ? {} : { text: state.text })
    },
    format: state.format,
    ...(state.limit === undefined ? {} : { limit: state.limit })
  }
});

export const parseKnowledgeArgs = (rest: readonly string[]): ParseArgsResult => {
  const [action, ...args] = rest;

  if (action === undefined || action === "--help" || action === "-h") {
    return {
      command: {
        kind: "knowledgeCardsHelp"
      }
    };
  }

  if (action !== "cards") {
    return {
      error: `Unsupported knowledge command: ${action}\n${formatKnowledgeUsage()}`
    };
  }

  const state: KnowledgeParseState = {
    cardFiles: [],
    patternFiles: [],
    catalogFiles: [],
    kind: undefined,
    status: undefined,
    reviewability: undefined,
    usefulnessOutcome: undefined,
    text: undefined,
    format: "text",
    limit: undefined
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;

    const handler = knowledgeOptionHandlers[arg];

    if (handler === undefined) {
      return {
        error: `Unsupported brain knowledge argument: ${arg}\n${formatKnowledgeUsage()}`
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

  const sourceValidation = validateKnowledgeSources(state);

  if (!sourceValidation.ok) {
    return {
      error: sourceValidation.error
    };
  }

  return buildKnowledgeCardsCommand(state);
};
