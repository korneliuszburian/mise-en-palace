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

const brainRecallUsage = [
  "Usage: krn brain recall [--store-only|--read-model-file <path>|--decision-file <path>|--catalog-file <path>] [--project <project-id>] [--kind <kind>] [--status <status>] [--reviewability <reviewability>] [--usefulness-outcome <outcome|none>] [--text <query>] [--limit <positive-integer>] [--json|--html]",
  "",
  "Read-only preview commands:",
  "krn brain recall [--text unknown-first]",
  "krn brain recall --store-only [--text unknown-first]",
  "krn brain recall --read-model-file docs-or-fixture-read-model.json [--text unknown-first]",
  "krn brain recall --decision-file brain-decision.json [--text unknown-first]",
  "krn brain recall --catalog-file brain-recall-catalog.json [--text unknown-first]",
  "  note: no file source defaults to DB-backed MemoryRecord read models plus feedback_delta usefulness outcomes and requires KRN_DATABASE_URL; file options are explicit legacy fixture/seed previews",
  "  proof boundary: valid output proves only that the selected read source parsed and local filters were applied"
].join("\n");

export const formatBrainRecallUsage = (): string => `${brainRecallUsage}\n`;

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
      error: `${valueResult.error}\n${formatBrainRecallUsage()}`
    };
  }

  return requiredOption(valueResult.value, formatBrainRecallUsage());
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
        error: `Unsupported brain recall ${label}: ${required.value}\n${formatBrainRecallUsage()}`
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
      error: `Unsupported brain recall limit: ${value}`
    };
  }

  const parsed = Number(trimmed);

  if (!Number.isSafeInteger(parsed)) {
    return {
      ok: false,
      error: `Unsupported brain recall limit: ${value}`
    };
  }

  return {
    ok: true,
    value: parsed
  };
};

type BrainRecallParseState = {
  readModelFiles: string[];
  decisionFiles: string[];
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

type ParseBrainRecallOptionResult =
  | {
      ok: true;
      nextIndex: number;
    }
  | {
      ok: false;
      error: string;
    };

type BrainRecallOptionParser = (
  args: readonly string[],
  index: number,
  state: BrainRecallParseState
) => ParseBrainRecallOptionResult;

const pushPathOption = (
  args: readonly string[],
  index: number,
  optionName: string,
  target: string[]
): ParseBrainRecallOptionResult => {
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

const brainRecallOptionParsers: Record<string, BrainRecallOptionParser> = {
  "--read-model-file": (args, index, state) =>
    pushPathOption(args, index, "--read-model-file", state.readModelFiles),
  "--decision-file": (args, index, state) =>
    pushPathOption(args, index, "--decision-file", state.decisionFiles),
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
        error: `--project requires a non-empty project id\n${formatBrainRecallUsage()}`
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
        error: `${parsedLimit.error}\n${formatBrainRecallUsage()}`
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

const validateBrainRecallSources = (
  state: BrainRecallParseState
): ParseOptionResult<undefined> => {
  if (state.storeOnly && hasExplicitBrainRecallSource(state)) {
    return {
      ok: false,
      error: `--store-only cannot be combined with --read-model-file, --decision-file, or --catalog-file\n${formatBrainRecallUsage()}`
    };
  }

  if (hasEmptyBrainRecallSourcePath(state)) {
    return {
      ok: false,
      error: `Brain recall source options require non-empty paths\n${formatBrainRecallUsage()}`
    };
  }

  return {
    ok: true,
    value: undefined
  };
};

const hasExplicitBrainRecallSource = (state: BrainRecallParseState): boolean =>
  state.readModelFiles.length > 0 ||
  state.decisionFiles.length > 0 ||
  state.catalogFiles.length > 0;

const hasEmptyBrainRecallSourcePath = (state: BrainRecallParseState): boolean =>
  state.readModelFiles.some((readModelFile) => readModelFile.length === 0) ||
  state.decisionFiles.some((decisionFile) => decisionFile.length === 0) ||
  state.catalogFiles.some((catalogFile) => catalogFile.length === 0);

const buildBrainRecallCommand = (
  state: BrainRecallParseState
): ParseArgsResult => ({
  command: {
    kind: "brainRecall",
    readModelFiles: state.readModelFiles,
    decisionFiles: state.decisionFiles,
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

export const parseBrainRecallArgs = (args: readonly string[]): ParseArgsResult => {
  if (args[0] === "--help" || args[0] === "-h") {
    return {
      command: {
        kind: "brainRecallHelp"
      }
    };
  }

  const state: BrainRecallParseState = {
    readModelFiles: [],
    decisionFiles: [],
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

    const parser = brainRecallOptionParsers[arg];

    if (parser === undefined) {
      return {
        error: `Unsupported brain recall argument: ${arg}\n${formatBrainRecallUsage()}`
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

  const sourceValidation = validateBrainRecallSources(state);

  if (!sourceValidation.ok) {
    return {
      error: sourceValidation.error
    };
  }

  if (!hasExplicitBrainRecallSource(state)) {
    state.storeOnly = true;
  }

  return buildBrainRecallCommand(state);
};
