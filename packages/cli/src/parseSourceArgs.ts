import type {
  SourceClaimEdgeKind
} from "@krn/core";
import type {
  CliCommand,
  ParseArgsResult
} from "./parseArgs.js";
import {
  type CliOptionParseResult,
  type CliTokenParseResult,
  optionMatches,
  optionValue,
  parseMappedStringOption,
  parsePersistedMetadataToken
} from "./parseArgHelpers.js";

export const formatSourceClaimAddUsage = (): string =>
  [
    "Usage: krn source claim add --title \"...\" --claim \"...\" --mechanism \"...\" --does-not-prove \"...\" --falsifier \"...\" --support-type <type> --trust-tier <tier> --consumer \"...\" [--persist]",
    "",
    "Required:",
    "--title",
    "--claim",
    "--mechanism",
    "--does-not-prove",
    "--support-type",
    "--trust-tier",
    "--consumer",
    "",
    "Optional:",
    "--run-id <execution-run-id>",
    "--uri <uri>",
    "--type <artifact-kind-or-source-type>",
    "--krn-implication <text>",
    "--falsifier <text>",
    "--revisit-when <text>",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatSourceClaimEdgesUsage = (): string =>
  [
    "Usage: krn source claim edges --source-claim-id <id>",
    "",
    "Required:",
    "--source-claim-id",
    "",
    "Note: read-only Postgres readback for governed SourceClaimEdge rows. It does not rank, extract, crawl, mutate Memory Core, or prove graph truth."
  ].join("\n") + "\n";

export const formatSourceSearchUsage = (): string =>
  [
    "Usage: krn source search --query \"...\" [--limit <n>] [--max-inclusions <n>] [--json]",
    "",
    "Required:",
    "--query",
    "",
    "Optional:",
    "--limit <positive-integer>",
    "--max-inclusions <positive-integer>",
    "--json",
    "",
    "Note: read-only Postgres readback over persisted SourceClaim/SearchDocument candidates. It does not crawl, embed, mutate Memory Core, or prove product search quality."
  ].join("\n") + "\n";

export const formatSourceArtifactPreviewUsage = (): string =>
  [
    "Usage: krn source artifact preview --file <path> [--chunk-lines <n>] [--limit-chunks <n>] [--extract-candidates] [--reviewed-extraction-claim-candidate-id <id> --mechanism \"...\" --krn-implication \"...\" --does-not-prove \"...\" --support-type <type> --trust-tier <tier> --consumer \"...\" --falsifier \"...\" --persist] [--claim \"...\" --mechanism \"...\" --krn-implication \"...\" --does-not-prove \"...\" --support-type <type> --trust-tier <tier> --consumer \"...\" --falsifier \"...\"] [--graph-edge-to-source-claim-id <id> --graph-edge-kind <kind> --graph-edge-consumer \"...\" --graph-edge-does-not-prove \"...\"] [--persist] [--json]",
    "",
    "Required:",
    "--file",
    "",
    "Optional:",
    "--chunk-lines <positive-integer>",
    "--limit-chunks <positive-integer>",
    "--extract-candidates",
    "--reviewed-extraction-claim-candidate-id <id>",
    "--claim <text>",
    "--mechanism <text>",
    "--krn-implication <text>",
    "--does-not-prove <text>",
    "--support-type <type>",
    "--trust-tier <tier>",
    "--consumer <text>",
    "--falsifier <text>",
    "--graph-edge-to-source-claim-id <source-claim-id>",
    "--graph-edge-kind <supports|contradicts|qualifies|depends_on|supersedes|duplicates|narrows|invalidates|expires>",
    "--graph-edge-consumer <text>",
    "--graph-edge-does-not-prove <text>",
    "--graph-edge-evidence-ref <ref>",
    "--graph-edge-source-decision-ref <ref>",
    "--graph-edge-scope <text>",
    "--graph-edge-valid-from <iso-or-text>",
    "--graph-edge-valid-until <iso-or-text>",
    "--graph-edge-invalidated-at <iso-or-text>",
    "--persist",
    "--json",
    "",
    "Note: preview reads one local file, computes hashes, and renders chunk source ranges. --extract-candidates renders candidate-only deterministic local extraction output. --reviewed-extraction-claim-candidate-id persists only a selected ready extraction candidate when explicit review fields and --persist are supplied. It does not crawl, embed, rank, or mutate Memory Core."
  ].join("\n") + "\n";

export const formatSourceDecisionLinkUsage = (): string =>
  [
    "Usage: krn source decision link --source-claim-id <id> --target-type <type> --target-id <id> --support-type <type> --confidence <low|medium|high> --notes \"...\" [--persist]",
    "",
    "Required:",
    "--source-claim-id",
    "--target-type",
    "--target-id",
    "--support-type",
    "--confidence",
    "--notes",
    "",
    "Optional:",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const formatSourceClaimRejectUsage = (): string =>
  [
    "Usage: krn source claim reject --title \"...\" --rejected-because <reason> [--attempted-claim \"...\"|--reason \"...\"] [--persist]",
    "",
    "Required:",
    "--title",
    "--rejected-because",
    "--attempted-claim or --reason",
    "",
    "Optional:",
    "--does-not-prove <text>",
    "--consumer <text>",
    "--run-id <execution-run-id>",
    "--source-artifact-id <id>",
    "--source-claim-id <id>",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

const parsePositiveIntegerOption = (
  rest: readonly string[],
  index: number,
  option: string,
  fallbackUsage: string
): {
  value?: number;
  error?: string;
  nextIndex: number;
} => {
  const valueResult = optionValue(rest, index, option);

  if (valueResult.error !== undefined || valueResult.value === undefined) {
    return {
      error: valueResult.error ?? fallbackUsage,
      nextIndex: index
    };
  }

  const parsed = Number.parseInt(valueResult.value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed.toString() !== valueResult.value.trim()) {
    return {
      error: `${option} must be a positive integer`,
      nextIndex: valueResult.nextIndex
    };
  }

  return {
    value: parsed,
    nextIndex: valueResult.nextIndex
  };
};

const sourceClaimEdgeKinds = [
  "supports",
  "contradicts",
  "qualifies",
  "depends_on",
  "supersedes",
  "duplicates",
  "narrows",
  "invalidates",
  "expires"
] as const satisfies readonly SourceClaimEdgeKind[];

const isSourceClaimEdgeKind = (value: string): value is SourceClaimEdgeKind =>
  sourceClaimEdgeKinds.some((kind) => kind === value);

type SourceOptionParseResult = CliOptionParseResult;

type SourceArtifactPreviewCommand = Extract<CliCommand, { kind: "sourceArtifactPreview" }>;
type SourceSearchCommand = Extract<CliCommand, { kind: "sourceSearch" }>;
type SourceClaimAddCommand = Extract<CliCommand, { kind: "sourceClaimAdd" }>;
type SourceClaimRejectCommand = Extract<CliCommand, { kind: "sourceClaimReject" }>;
type SourceDecisionLinkCommand = Extract<CliCommand, { kind: "sourceDecisionLink" }>;

type SourceTokenParseResult = CliTokenParseResult;

const sourceClaimAddStringOptions = {
  "--title": "title",
  "--claim": "claim",
  "--mechanism": "mechanism",
  "--does-not-prove": "doesNotProve",
  "--support-type": "supportType",
  "--trust-tier": "trustTier",
  "--consumer": "consumer",
  "--uri": "uri",
  "--type": "type",
  "--run-id": "runId",
  "--falsifier": "falsifier",
  "--revisit-when": "revisitWhen",
  "--krn-implication": "krnImplication"
} as const;

const sourceClaimRejectStringOptions = {
  "--title": "title",
  "--attempted-claim": "attemptedClaim",
  "--rejected-because": "rejectedBecause",
  "--reason": "reason",
  "--does-not-prove": "doesNotProve",
  "--consumer": "consumer",
  "--run-id": "runId",
  "--source-artifact-id": "sourceArtifactId",
  "--source-claim-id": "sourceClaimId"
} as const;

const sourceDecisionLinkStringOptions = {
  "--source-claim-id": "sourceClaimId",
  "--target-type": "targetType",
  "--target-id": "targetId",
  "--support-type": "supportType",
  "--confidence": "confidence",
  "--notes": "notes"
} as const;

type SourceClaimAddStringKey = typeof sourceClaimAddStringOptions[keyof typeof sourceClaimAddStringOptions];
type SourceClaimRejectStringKey = typeof sourceClaimRejectStringOptions[keyof typeof sourceClaimRejectStringOptions];
type SourceDecisionLinkStringKey = typeof sourceDecisionLinkStringOptions[keyof typeof sourceDecisionLinkStringOptions];

const sourceHelp = (): SourceTokenParseResult => ({
  kind: "help"
});

const sourceNext = (nextIndex: number): SourceTokenParseResult => ({
  kind: "next",
  nextIndex
});

const sourceError = (error: string): SourceTokenParseResult => ({
  kind: "error",
  error
});

const sourceArtifactPreviewStringOptions = {
  "--claim": "claim",
  "--mechanism": "mechanism",
  "--krn-implication": "krnImplication",
  "--does-not-prove": "doesNotProve",
  "--support-type": "supportType",
  "--trust-tier": "trustTier",
  "--consumer": "consumer",
  "--falsifier": "falsifier",
  "--graph-edge-to-source-claim-id": "graphEdgeToSourceClaimId",
  "--graph-edge-consumer": "graphEdgeConsumer",
  "--graph-edge-does-not-prove": "graphEdgeDoesNotProve",
  "--graph-edge-evidence-ref": "graphEdgeEvidenceRef",
  "--graph-edge-source-decision-ref": "graphEdgeSourceDecisionRef",
  "--graph-edge-scope": "graphEdgeScope",
  "--graph-edge-valid-from": "graphEdgeValidFrom",
  "--graph-edge-valid-until": "graphEdgeValidUntil",
  "--graph-edge-invalidated-at": "graphEdgeInvalidatedAt"
} as const;

const parseReviewedExtractionCandidateIdOption = (
  rest: readonly string[],
  index: number,
  arg: string,
  sourceCommand: SourceArtifactPreviewCommand
): SourceOptionParseResult => {
  if (!optionMatches(arg, "--reviewed-extraction-claim-candidate-id")) {
    return {
      matched: false
    };
  }

  const valueResult = optionValue(rest, index, "--reviewed-extraction-claim-candidate-id");

  if (valueResult.error !== undefined || valueResult.value === undefined) {
    return {
      error: valueResult.error ?? formatSourceArtifactPreviewUsage()
    };
  }

  const candidateId = valueResult.value.trim();

  if (candidateId.length === 0) {
    return {
      error: "--reviewed-extraction-claim-candidate-id requires a non-empty id"
    };
  }

  sourceCommand.reviewedExtractionClaimCandidateId = candidateId;

  return {
    matched: true,
    nextIndex: valueResult.nextIndex
  };
};

const parseSourceArtifactFileOption = (
  rest: readonly string[],
  index: number,
  arg: string,
  sourceCommand: SourceArtifactPreviewCommand
): SourceOptionParseResult => {
  if (!optionMatches(arg, "--file")) {
    return {
      matched: false
    };
  }

  const valueResult = optionValue(rest, index, "--file");

  if (valueResult.error !== undefined || valueResult.value === undefined) {
    return {
      error: valueResult.error ?? formatSourceArtifactPreviewUsage()
    };
  }

  const file = valueResult.value.trim();

  if (file.length === 0) {
    return {
      error: "--file requires a non-empty path"
    };
  }

  sourceCommand.file = file;

  return {
    matched: true,
    nextIndex: valueResult.nextIndex
  };
};

const parseSourceArtifactPositiveIntegerOption = (
  rest: readonly string[],
  index: number,
  arg: string,
  sourceCommand: SourceArtifactPreviewCommand
): SourceOptionParseResult => {
  const option = optionMatches(arg, "--chunk-lines")
    ? "--chunk-lines"
    : optionMatches(arg, "--limit-chunks")
      ? "--limit-chunks"
      : undefined;

  if (option === undefined) {
    return {
      matched: false
    };
  }

  const parsed = parsePositiveIntegerOption(rest, index, option, formatSourceArtifactPreviewUsage());

  if (parsed.error !== undefined || parsed.value === undefined) {
    return {
      error: parsed.error ?? formatSourceArtifactPreviewUsage()
    };
  }

  if (option === "--chunk-lines") {
    sourceCommand.chunkLines = parsed.value;
  } else {
    sourceCommand.limitChunks = parsed.value;
  }

  return {
    matched: true,
    nextIndex: parsed.nextIndex
  };
};

const parseSourceArtifactStringOption = (
  rest: readonly string[],
  index: number,
  arg: string,
  sourceCommand: SourceArtifactPreviewCommand
): SourceOptionParseResult => {
  const option = parseMappedStringOption(
    rest,
    index,
    arg,
    sourceArtifactPreviewStringOptions,
    formatSourceArtifactPreviewUsage()
  );

  if ("error" in option) {
    return {
      error: option.error
    };
  }

  if (!option.matched) {
    return {
      matched: false
    };
  }

  sourceCommand[option.key] = option.value;

  return {
    matched: true,
    nextIndex: option.nextIndex
  };
};

const parseSourceArtifactGraphEdgeKindOption = (
  rest: readonly string[],
  index: number,
  arg: string,
  sourceCommand: SourceArtifactPreviewCommand
): SourceOptionParseResult => {
  if (!optionMatches(arg, "--graph-edge-kind")) {
    return {
      matched: false
    };
  }

  const valueResult = optionValue(rest, index, "--graph-edge-kind");

  if (valueResult.error !== undefined || valueResult.value === undefined) {
    return {
      error: valueResult.error ?? formatSourceArtifactPreviewUsage()
    };
  }

  const graphEdgeKind = valueResult.value.trim();

  if (!isSourceClaimEdgeKind(graphEdgeKind)) {
    return {
      error: `Unsupported --graph-edge-kind: ${graphEdgeKind}`
    };
  }

  sourceCommand.graphEdgeKind = graphEdgeKind;

  return {
    matched: true,
    nextIndex: valueResult.nextIndex
  };
};

type SourceArtifactOptionParser = (
  rest: readonly string[],
  index: number,
  arg: string,
  sourceCommand: SourceArtifactPreviewCommand
) => SourceOptionParseResult;

const sourceArtifactOptionParsers: readonly SourceArtifactOptionParser[] = [
  parseReviewedExtractionCandidateIdOption,
  parseSourceArtifactFileOption,
  parseSourceArtifactPositiveIntegerOption,
  parseSourceArtifactStringOption,
  parseSourceArtifactGraphEdgeKindOption
];

const parseSourceArtifactPreviewOption = (
  rest: readonly string[],
  index: number,
  arg: string,
  sourceCommand: SourceArtifactPreviewCommand
): SourceOptionParseResult => {
  for (const parseOption of sourceArtifactOptionParsers) {
    const parsed = parseOption(rest, index, arg, sourceCommand);

    if ("error" in parsed || parsed.matched) {
      return parsed;
    }
  }

  return {
    matched: false
  };
};

const parseSourceArtifactPreviewToken = (
  rest: readonly string[],
  index: number,
  sourceCommand: SourceArtifactPreviewCommand
): SourceTokenParseResult => {
  const arg = rest[index];

  if (arg === undefined) {
    return sourceError(formatSourceArtifactPreviewUsage());
  }

  if (arg === "--help" || arg === "-h") {
    return sourceHelp();
  }

  if (arg === "--persist") {
    sourceCommand.persist = true;

    return sourceNext(index);
  }

  if (arg === "--json") {
    sourceCommand.json = true;

    return sourceNext(index);
  }

  if (arg === "--extract-candidates") {
    sourceCommand.extractCandidates = true;

    return sourceNext(index);
  }

  const parsed = parseSourceArtifactPreviewOption(rest, index, arg, sourceCommand);

  if ("error" in parsed) {
    return sourceError(parsed.error);
  }

  if (parsed.matched) {
    return sourceNext(parsed.nextIndex);
  }

  return sourceError(formatSourceArtifactPreviewUsage());
};

const validateReviewedExtractionClaimCandidate = (
  sourceCommand: SourceArtifactPreviewCommand
): string | undefined => {
  if (sourceCommand.reviewedExtractionClaimCandidateId === undefined) {
    return undefined;
  }

  if (sourceCommand.extractCandidates !== true) {
    return "--reviewed-extraction-claim-candidate-id requires --extract-candidates";
  }

  if (sourceCommand.persist !== true) {
    return "--reviewed-extraction-claim-candidate-id requires --persist";
  }

  if (sourceCommand.claim !== undefined) {
    return "--reviewed-extraction-claim-candidate-id cannot be combined with --claim";
  }

  return undefined;
};

const parseSourceSearchQueryOption = (
  rest: readonly string[],
  index: number,
  arg: string,
  sourceCommand: SourceSearchCommand
): SourceOptionParseResult => {
  if (!optionMatches(arg, "--query")) {
    return {
      matched: false
    };
  }

  const valueResult = optionValue(rest, index, "--query");

  if (valueResult.error !== undefined || valueResult.value === undefined) {
    return {
      error: valueResult.error ?? formatSourceSearchUsage()
    };
  }

  const query = valueResult.value.trim();

  if (query.length === 0) {
    return {
      error: "--query requires non-empty text"
    };
  }

  sourceCommand.query = query;

  return {
    matched: true,
    nextIndex: valueResult.nextIndex
  };
};

const parseSourceSearchPositiveIntegerOption = (
  rest: readonly string[],
  index: number,
  arg: string,
  sourceCommand: SourceSearchCommand
): SourceOptionParseResult => {
  const option = optionMatches(arg, "--limit")
    ? "--limit"
    : optionMatches(arg, "--max-inclusions")
      ? "--max-inclusions"
      : undefined;

  if (option === undefined) {
    return {
      matched: false
    };
  }

  const parsed = parsePositiveIntegerOption(rest, index, option, formatSourceSearchUsage());

  if (parsed.error !== undefined || parsed.value === undefined) {
    return {
      error: parsed.error ?? formatSourceSearchUsage()
    };
  }

  if (option === "--limit") {
    sourceCommand.limit = parsed.value;
  } else {
    sourceCommand.maxInclusions = parsed.value;
  }

  return {
    matched: true,
    nextIndex: parsed.nextIndex
  };
};

type SourceSearchOptionParser = (
  rest: readonly string[],
  index: number,
  arg: string,
  sourceCommand: SourceSearchCommand
) => SourceOptionParseResult;

const sourceSearchOptionParsers: readonly SourceSearchOptionParser[] = [
  parseSourceSearchQueryOption,
  parseSourceSearchPositiveIntegerOption
];

const parseSourceSearchOption = (
  rest: readonly string[],
  index: number,
  arg: string,
  sourceCommand: SourceSearchCommand
): SourceOptionParseResult => {
  for (const parseOption of sourceSearchOptionParsers) {
    const parsed = parseOption(rest, index, arg, sourceCommand);

    if ("error" in parsed || parsed.matched) {
      return parsed;
    }
  }

  return {
    matched: false
  };
};

const parseSourceSearchToken = (
  rest: readonly string[],
  index: number,
  sourceCommand: SourceSearchCommand
): SourceTokenParseResult => {
  const arg = rest[index];

  if (arg === undefined) {
    return sourceError(formatSourceSearchUsage());
  }

  if (arg === "--help" || arg === "-h") {
    return sourceHelp();
  }

  if (arg === "--json") {
    sourceCommand.json = true;

    return sourceNext(index);
  }

  const parsed = parseSourceSearchOption(rest, index, arg, sourceCommand);

  if ("error" in parsed) {
    return sourceError(parsed.error);
  }

  if (parsed.matched) {
    return sourceNext(parsed.nextIndex);
  }

  return sourceError(formatSourceSearchUsage());
};

const parseSourceClaimAddToken = (
  rest: readonly string[],
  index: number,
  sourceCommand: SourceClaimAddCommand
): SourceTokenParseResult =>
  parsePersistedMetadataToken(rest, index, sourceCommand, {
    fallbackUsage: formatSourceClaimAddUsage(),
    optionMap: sourceClaimAddStringOptions,
    assignOption: (key, value) => {
      sourceCommand[key as SourceClaimAddStringKey] = value;
    }
  });

const parseSourceClaimEdgesToken = (
  rest: readonly string[],
  index: number,
  sourceCommand: Extract<CliCommand, { kind: "sourceClaimEdges" }>
): SourceTokenParseResult => {
  const arg = rest[index];

  if (arg === undefined) {
    return sourceError(formatSourceClaimEdgesUsage());
  }

  if (arg === "--help" || arg === "-h") {
    return sourceHelp();
  }

  if (!optionMatches(arg, "--source-claim-id")) {
    return sourceError(formatSourceClaimEdgesUsage());
  }

  const valueResult = optionValue(rest, index, "--source-claim-id");

  if (valueResult.error !== undefined || valueResult.value === undefined) {
    return sourceError(valueResult.error ?? formatSourceClaimEdgesUsage());
  }

  const sourceClaimId = valueResult.value.trim();

  if (sourceClaimId.length === 0) {
    return sourceError("--source-claim-id requires a non-empty id");
  }

  sourceCommand.sourceClaimId = sourceClaimId;

  return sourceNext(valueResult.nextIndex);
};

const parseSourceClaimRejectToken = (
  rest: readonly string[],
  index: number,
  sourceCommand: SourceClaimRejectCommand
): SourceTokenParseResult =>
  parsePersistedMetadataToken(rest, index, sourceCommand, {
    fallbackUsage: formatSourceClaimRejectUsage(),
    optionMap: sourceClaimRejectStringOptions,
    assignOption: (key, value) => {
      sourceCommand[key as SourceClaimRejectStringKey] = value;
    }
  });

const parseSourceDecisionLinkToken = (
  rest: readonly string[],
  index: number,
  sourceCommand: SourceDecisionLinkCommand
): SourceTokenParseResult =>
  parsePersistedMetadataToken(rest, index, sourceCommand, {
    fallbackUsage: formatSourceDecisionLinkUsage(),
    optionMap: sourceDecisionLinkStringOptions,
    assignOption: (key, value) => {
      sourceCommand[key as SourceDecisionLinkStringKey] = value;
    }
  });

const parseSourceArtifactPreviewArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
    return {
      command: {
        kind: "sourceArtifactPreviewHelp"
      }
    };
  }

  const sourceCommand: Extract<CliCommand, { kind: "sourceArtifactPreview" }> = {
    kind: "sourceArtifactPreview",
    persist: false
  };

  for (let index = 2; index < rest.length; index += 1) {
    const parsed = parseSourceArtifactPreviewToken(rest, index, sourceCommand);

    if (parsed.kind === "help") {
      return {
        command: {
          kind: "sourceArtifactPreviewHelp"
        }
      };
    }

    if (parsed.kind === "error") {
      return {
        error: parsed.error
      };
    }

    index = parsed.nextIndex;
  }

  const reviewedExtractionError = validateReviewedExtractionClaimCandidate(sourceCommand);

  if (reviewedExtractionError !== undefined) {
    return {
      error: reviewedExtractionError
    };
  }

  return {
    command: sourceCommand
  };
};

const parseSourceClaimAddArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
    return {
      command: {
        kind: "sourceClaimAddHelp"
      }
    };
  }

  const sourceCommand: Extract<CliCommand, { kind: "sourceClaimAdd" }> = {
    kind: "sourceClaimAdd",
    persist: false,
    metadata: {}
  };

  for (let index = 2; index < rest.length; index += 1) {
    const parsed = parseSourceClaimAddToken(rest, index, sourceCommand);

    if (parsed.kind === "help") {
      return {
        command: {
          kind: "sourceClaimAddHelp"
        }
      };
    }

    if (parsed.kind === "error") {
      return {
        error: parsed.error
      };
    }

    index = parsed.nextIndex;
  }

  return {
    command: sourceCommand
  };
};

const parseSourceClaimEdgesArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
    return {
      command: {
        kind: "sourceClaimEdgesHelp"
      }
    };
  }

  const sourceCommand: Extract<CliCommand, { kind: "sourceClaimEdges" }> = {
    kind: "sourceClaimEdges"
  };

  for (let index = 2; index < rest.length; index += 1) {
    const parsed = parseSourceClaimEdgesToken(rest, index, sourceCommand);

    if (parsed.kind === "help") {
      return {
        command: {
          kind: "sourceClaimEdgesHelp"
        }
      };
    }

    if (parsed.kind === "error") {
      return {
        error: parsed.error
      };
    }

    index = parsed.nextIndex;
  }

  return {
    command: sourceCommand
  };
};

const parseSourceSearchArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 1 || rest[1] === "--help" || rest[1] === "-h") {
    return {
      command: {
        kind: "sourceSearchHelp"
      }
    };
  }

  const sourceCommand: Extract<CliCommand, { kind: "sourceSearch" }> = {
    kind: "sourceSearch"
  };

  for (let index = 1; index < rest.length; index += 1) {
    const parsed = parseSourceSearchToken(rest, index, sourceCommand);

    if (parsed.kind === "help") {
      return {
        command: {
          kind: "sourceSearchHelp"
        }
      };
    }

    if (parsed.kind === "error") {
      return {
        error: parsed.error
      };
    }

    index = parsed.nextIndex;
  }

  return {
    command: sourceCommand
  };
};

const parseSourceClaimRejectArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
    return {
      command: {
        kind: "sourceClaimRejectHelp"
      }
    };
  }

  const sourceCommand: Extract<CliCommand, { kind: "sourceClaimReject" }> = {
    kind: "sourceClaimReject",
    persist: false,
    metadata: {}
  };

  for (let index = 2; index < rest.length; index += 1) {
    const parsed = parseSourceClaimRejectToken(rest, index, sourceCommand);

    if (parsed.kind === "help") {
      return {
        command: {
          kind: "sourceClaimRejectHelp"
        }
      };
    }

    if (parsed.kind === "error") {
      return {
        error: parsed.error
      };
    }

    index = parsed.nextIndex;
  }

  return {
    command: sourceCommand
  };
};

const parseSourceDecisionLinkArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest.length === 3 && (rest[2] === "--help" || rest[2] === "-h")) {
    return {
      command: {
        kind: "sourceDecisionLinkHelp"
      }
    };
  }

  const sourceCommand: Extract<CliCommand, { kind: "sourceDecisionLink" }> = {
    kind: "sourceDecisionLink",
    persist: false,
    metadata: {}
  };

  for (let index = 2; index < rest.length; index += 1) {
    const parsed = parseSourceDecisionLinkToken(rest, index, sourceCommand);

    if (parsed.kind === "help") {
      return {
        command: {
          kind: "sourceDecisionLinkHelp"
        }
      };
    }

    if (parsed.kind === "error") {
      return {
        error: parsed.error
      };
    }

    index = parsed.nextIndex;
  }

  return {
    command: sourceCommand
  };
};

export const parseSourceArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest[0] === "search") {
    return parseSourceSearchArgs(rest);
  }

  if (rest[0] === "artifact" && rest[1] === "preview") {
    return parseSourceArtifactPreviewArgs(rest);
  }

  if (rest[0] === "claim" && rest[1] === "add") {
    return parseSourceClaimAddArgs(rest);
  }

  if (rest[0] === "claim" && rest[1] === "edges") {
    return parseSourceClaimEdgesArgs(rest);
  }

  if (rest[0] === "claim" && rest[1] === "reject") {
    return parseSourceClaimRejectArgs(rest);
  }

  if (rest[0] === "decision" && rest[1] === "link") {
    return parseSourceDecisionLinkArgs(rest);
  }

  return {
    error: formatSourceArtifactPreviewUsage()
  };
};
