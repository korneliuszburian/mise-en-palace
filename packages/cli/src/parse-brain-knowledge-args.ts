import type {
  KnowledgeKind,
  KnowledgeReviewability,
  KnowledgeStatus,
  KnowledgeUsefulnessOutcomeFilter
} from "@krn/harness";
import {
  knowledgeKindValues,
  knowledgeReviewabilityValues,
  knowledgeStatusValues,
  knowledgeUsefulnessOutcomeFilterValues
} from "@krn/harness";
import {
  optionValue
} from "./parse-cli-options.js";
import type {
  ParseArgsResult
} from "./parse-args.js";

const brainKnowledgeUsage = [
  "Usage: krn brain knowledge [--store-only|--read-model-file <path>|--knowledge-file <path>|--catalog-file <path>] [--project <project-id>] [--kind <kind>] [--status <status>] [--reviewability <reviewability>] [--usefulness-outcome <outcome|none>] [--text <query>] [--limit <positive-integer>] [--json|--html]",
  "",
  "Read-only preview commands:",
  "krn brain knowledge [--text unknown-first]",
  "krn brain knowledge --store-only [--text unknown-first]",
  "krn brain knowledge --read-model-file docs-or-fixture-read-model.json [--text unknown-first]",
  "krn brain knowledge --knowledge-file brain-knowledge-decision.json [--text unknown-first]",
  "krn brain knowledge --catalog-file brain-knowledge-catalog.json [--text unknown-first]",
  "  note: no file source defaults to DB-backed MemoryRecord read models plus feedback_delta usefulness outcomes and requires KRN_DATABASE_URL; file options are explicit legacy fixture/seed previews",
  "  proof boundary: valid output proves only that the selected read source parsed and local filters were applied"
].join("\n");

export const formatBrainKnowledgeUsage = (): string => `${brainKnowledgeUsage}\n`;

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
      error: `${valueResult.error}\n${formatBrainKnowledgeUsage()}`
    };
  }

  return requiredOption(valueResult.value, formatBrainKnowledgeUsage());
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
      error: `Unsupported knowledge ${label}: ${required.value}\n${formatBrainKnowledgeUsage()}`
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
      error: `Unsupported knowledge limit: ${value}`
    };
  }

  const parsed = Number(trimmed);

  if (!Number.isSafeInteger(parsed)) {
    return {
      ok: false,
      error: `Unsupported knowledge limit: ${value}`
    };
  }

  return {
    ok: true,
    value: parsed
  };
};

type BrainKnowledgeParseState = {
  readModelFiles: string[];
  knowledgeFiles: string[];
  catalogFiles: string[];
  storeOnly: boolean;
  projectId: string | undefined;
  kind: KnowledgeKind | undefined;
  status: KnowledgeStatus | undefined;
  reviewability: KnowledgeReviewability | undefined;
  usefulnessOutcome: KnowledgeUsefulnessOutcomeFilter | undefined;
  text: string | undefined;
  format: "text" | "json" | "html";
  limit: number | undefined;
};

type ParseBrainKnowledgeOptionResult =
  | {
      ok: true;
      nextIndex: number;
    }
  | {
      ok: false;
      error: string;
    };

type BrainKnowledgeOptionParser = (
  args: readonly string[],
  index: number,
  state: BrainKnowledgeParseState
) => ParseBrainKnowledgeOptionResult;

const pushPathOption = (
  args: readonly string[],
  index: number,
  optionName: string,
  target: string[]
): ParseBrainKnowledgeOptionResult => {
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

const brainKnowledgeOptionParsers: Record<string, BrainKnowledgeOptionParser> = {
  "--read-model-file": (args, index, state) =>
    pushPathOption(args, index, "--read-model-file", state.readModelFiles),
  "--knowledge-file": (args, index, state) =>
    pushPathOption(args, index, "--knowledge-file", state.knowledgeFiles),
  "--catalog-file": (args, index, state) =>
    pushPathOption(args, index, "--catalog-file", state.catalogFiles),
  "--store-only": (_args, index, state) => {
    state.storeOnly = true;

    return {
      ok: true,
      nextIndex: index
    };
  },
  "--project": (args, index, state) => {
    const required = parseRequiredOption(args, index, "--project");

    if (!required.ok) {
      return required;
    }

    if (required.value.trim().length === 0) {
      return {
        ok: false,
        error: `--project requires a non-empty project id\n${formatBrainKnowledgeUsage()}`
      };
    }

    state.projectId = required.value.trim();

    return {
      ok: true,
      nextIndex: index + 1
    };
  },
  "--kind": (args, index, state) => {
    const parsed = parseAllowedOption(args, index, "--kind", knowledgeKindValues, "kind");

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
      knowledgeStatusValues,
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
      knowledgeReviewabilityValues,
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
      knowledgeUsefulnessOutcomeFilterValues,
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
        error: `${parsedLimit.error}\n${formatBrainKnowledgeUsage()}`
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

const validateBrainKnowledgeSources = (
  state: BrainKnowledgeParseState
): ParseOptionResult<undefined> => {
  if (state.storeOnly && hasExplicitBrainKnowledgeSource(state)) {
    return {
      ok: false,
      error: `--store-only cannot be combined with --read-model-file, --knowledge-file, or --catalog-file\n${formatBrainKnowledgeUsage()}`
    };
  }

  if (hasEmptyBrainKnowledgeSourcePath(state)) {
    return {
      ok: false,
      error: `Knowledge file source options require non-empty paths\n${formatBrainKnowledgeUsage()}`
    };
  }

  return {
    ok: true,
    value: undefined
  };
};

const hasExplicitBrainKnowledgeSource = (state: BrainKnowledgeParseState): boolean =>
  state.readModelFiles.length > 0 ||
  state.knowledgeFiles.length > 0 ||
  state.catalogFiles.length > 0;

const hasEmptyBrainKnowledgeSourcePath = (state: BrainKnowledgeParseState): boolean =>
  state.readModelFiles.some((readModelFile) => readModelFile.length === 0) ||
  state.knowledgeFiles.some((knowledgeFile) => knowledgeFile.length === 0) ||
  state.catalogFiles.some((catalogFile) => catalogFile.length === 0);

const buildBrainKnowledgeCommand = (
  state: BrainKnowledgeParseState
): ParseArgsResult => ({
  command: {
    kind: "brainKnowledge",
    readModelFiles: state.readModelFiles,
    knowledgeFiles: state.knowledgeFiles,
    catalogFiles: state.catalogFiles,
    storeOnly: state.storeOnly,
    ...(state.projectId === undefined ? {} : { projectId: state.projectId }),
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

export const parseBrainKnowledgeArgs = (args: readonly string[]): ParseArgsResult => {
  if (args[0] === "--help" || args[0] === "-h") {
    return {
      command: {
        kind: "brainKnowledgeHelp"
      }
    };
  }

  const state: BrainKnowledgeParseState = {
    readModelFiles: [],
    knowledgeFiles: [],
    catalogFiles: [],
    storeOnly: false,
    projectId: undefined,
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

    const parser = brainKnowledgeOptionParsers[arg];

    if (parser === undefined) {
      return {
        error: `Unsupported knowledge argument: ${arg}\n${formatBrainKnowledgeUsage()}`
      };
    }

    const parsed = parser(args, index, state);

    if (!parsed.ok) {
      return {
        error: parsed.error
      };
    }

    index = parsed.nextIndex;
  }

  const sourceValidation = validateBrainKnowledgeSources(state);

  if (!sourceValidation.ok) {
    return {
      error: sourceValidation.error
    };
  }

  if (!hasExplicitBrainKnowledgeSource(state)) {
    state.storeOnly = true;
  }

  return buildBrainKnowledgeCommand(state);
};
