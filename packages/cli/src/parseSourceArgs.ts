import type {
  SourceClaimEdgeKind
} from "@krn/core";
import type {
  CliCommand,
  ParseArgsResult
} from "./parseArgs.js";
import {
  metadataEntry,
  optionValue
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
    "Usage: krn source search --query \"...\" [--limit <n>] [--max-inclusions <n>]",
    "",
    "Required:",
    "--query",
    "",
    "Optional:",
    "--limit <positive-integer>",
    "--max-inclusions <positive-integer>",
    "",
    "Note: read-only Postgres readback over persisted SourceClaim/SearchDocument candidates. It does not crawl, embed, mutate Memory Core, or prove product search quality."
  ].join("\n") + "\n";

export const formatSourceArtifactPreviewUsage = (): string =>
  [
    "Usage: krn source artifact preview --file <path> [--chunk-lines <n>] [--limit-chunks <n>] [--extract-candidates] [--reviewed-extraction-claim-candidate-id <id> --mechanism \"...\" --krn-implication \"...\" --does-not-prove \"...\" --support-type <type> --trust-tier <tier> --consumer \"...\" --falsifier \"...\" --persist] [--claim \"...\" --mechanism \"...\" --krn-implication \"...\" --does-not-prove \"...\" --support-type <type> --trust-tier <tier> --consumer \"...\" --falsifier \"...\"] [--graph-edge-to-source-claim-id <id> --graph-edge-kind <kind> --graph-edge-consumer \"...\" --graph-edge-does-not-prove \"...\"] [--persist]",
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

const parseMetadataOption = (
  rest: readonly string[],
  index: number,
  fallbackUsage: string
): {
  entry?: {
    key: string;
    value: string;
  };
  error?: string;
  nextIndex: number;
} => {
  const valueResult = optionValue(rest, index, "--metadata");

  if (valueResult.error !== undefined || valueResult.value === undefined) {
    return {
      error: valueResult.error ?? fallbackUsage,
      nextIndex: index
    };
  }

  const entry = metadataEntry(valueResult.value);

  if (entry.error !== undefined || entry.key === undefined || entry.value === undefined) {
    return {
      error: entry.error ?? fallbackUsage,
      nextIndex: valueResult.nextIndex
    };
  }

  return {
    entry: {
      key: entry.key,
      value: entry.value
    },
    nextIndex: valueResult.nextIndex
  };
};

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
    const arg = rest[index];

    if (arg === "--help" || arg === "-h") {
      return {
        command: {
          kind: "sourceArtifactPreviewHelp"
        }
      };
    }

    if (arg === "--persist") {
      sourceCommand.persist = true;
      continue;
    }

    if (arg === "--extract-candidates") {
      sourceCommand.extractCandidates = true;
      continue;
    }

    if (
      arg === "--reviewed-extraction-claim-candidate-id" ||
      arg?.startsWith("--reviewed-extraction-claim-candidate-id=") === true
    ) {
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
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--file" || arg?.startsWith("--file=") === true) {
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
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--chunk-lines" || arg?.startsWith("--chunk-lines=") === true) {
      const parsed = parsePositiveIntegerOption(rest, index, "--chunk-lines", formatSourceArtifactPreviewUsage());

      if (parsed.error !== undefined || parsed.value === undefined) {
        return {
          error: parsed.error ?? formatSourceArtifactPreviewUsage()
        };
      }

      sourceCommand.chunkLines = parsed.value;
      index = parsed.nextIndex;
      continue;
    }

    if (arg === "--limit-chunks" || arg?.startsWith("--limit-chunks=") === true) {
      const parsed = parsePositiveIntegerOption(rest, index, "--limit-chunks", formatSourceArtifactPreviewUsage());

      if (parsed.error !== undefined || parsed.value === undefined) {
        return {
          error: parsed.error ?? formatSourceArtifactPreviewUsage()
        };
      }

      sourceCommand.limitChunks = parsed.value;
      index = parsed.nextIndex;
      continue;
    }

    const optionMap = {
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
    const option = Object.keys(optionMap).find((candidate) =>
      arg === candidate || arg?.startsWith(`${candidate}=`) === true
    );

    if (option !== undefined) {
      const valueResult = optionValue(rest, index, option);

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatSourceArtifactPreviewUsage()
        };
      }

      sourceCommand[optionMap[option as keyof typeof optionMap]] =
        valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--graph-edge-kind" || arg?.startsWith("--graph-edge-kind=") === true) {
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
      index = valueResult.nextIndex;
      continue;
    }

    return {
      error: formatSourceArtifactPreviewUsage()
    };
  }

  if (sourceCommand.reviewedExtractionClaimCandidateId !== undefined) {
    if (sourceCommand.extractCandidates !== true) {
      return {
        error: "--reviewed-extraction-claim-candidate-id requires --extract-candidates"
      };
    }

    if (sourceCommand.persist !== true) {
      return {
        error: "--reviewed-extraction-claim-candidate-id requires --persist"
      };
    }

    if (sourceCommand.claim !== undefined) {
      return {
        error: "--reviewed-extraction-claim-candidate-id cannot be combined with --claim"
      };
    }
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
    const arg = rest[index];

    if (arg === "--persist") {
      sourceCommand.persist = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return {
        command: {
          kind: "sourceClaimAddHelp"
        }
      };
    }

    const optionMap = {
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
    const option = Object.keys(optionMap).find((candidate) =>
      arg === candidate || arg?.startsWith(`${candidate}=`) === true
    );

    if (option !== undefined) {
      const valueResult = optionValue(rest, index, option);

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatSourceClaimAddUsage()
        };
      }

      sourceCommand[optionMap[option as keyof typeof optionMap]] =
        valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
      const metadata = parseMetadataOption(rest, index, formatSourceClaimAddUsage());

      if (metadata.error !== undefined || metadata.entry === undefined) {
        return {
          error: metadata.error ?? formatSourceClaimAddUsage()
        };
      }

      sourceCommand.metadata[metadata.entry.key] = metadata.entry.value;
      index = metadata.nextIndex;
      continue;
    }

    return {
      error: formatSourceClaimAddUsage()
    };
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
    const arg = rest[index];

    if (arg === "--help" || arg === "-h") {
      return {
        command: {
          kind: "sourceClaimEdgesHelp"
        }
      };
    }

    if (arg === "--source-claim-id" || arg?.startsWith("--source-claim-id=") === true) {
      const valueResult = optionValue(rest, index, "--source-claim-id");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatSourceClaimEdgesUsage()
        };
      }

      const sourceClaimId = valueResult.value.trim();

      if (sourceClaimId.length === 0) {
        return {
          error: "--source-claim-id requires a non-empty id"
        };
      }

      sourceCommand.sourceClaimId = sourceClaimId;
      index = valueResult.nextIndex;
      continue;
    }

    return {
      error: formatSourceClaimEdgesUsage()
    };
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
    const arg = rest[index];

    if (arg === "--help" || arg === "-h") {
      return {
        command: {
          kind: "sourceSearchHelp"
        }
      };
    }

    if (arg === "--query" || arg?.startsWith("--query=") === true) {
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
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--limit" || arg?.startsWith("--limit=") === true) {
      const parsed = parsePositiveIntegerOption(rest, index, "--limit", formatSourceSearchUsage());

      if (parsed.error !== undefined || parsed.value === undefined) {
        return {
          error: parsed.error ?? formatSourceSearchUsage()
        };
      }

      sourceCommand.limit = parsed.value;
      index = parsed.nextIndex;
      continue;
    }

    if (arg === "--max-inclusions" || arg?.startsWith("--max-inclusions=") === true) {
      const parsed = parsePositiveIntegerOption(rest, index, "--max-inclusions", formatSourceSearchUsage());

      if (parsed.error !== undefined || parsed.value === undefined) {
        return {
          error: parsed.error ?? formatSourceSearchUsage()
        };
      }

      sourceCommand.maxInclusions = parsed.value;
      index = parsed.nextIndex;
      continue;
    }

    return {
      error: formatSourceSearchUsage()
    };
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
    const arg = rest[index];

    if (arg === "--persist") {
      sourceCommand.persist = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return {
        command: {
          kind: "sourceClaimRejectHelp"
        }
      };
    }

    const optionMap = {
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
    const option = Object.keys(optionMap).find((candidate) =>
      arg === candidate || arg?.startsWith(`${candidate}=`) === true
    );

    if (option !== undefined) {
      const valueResult = optionValue(rest, index, option);

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatSourceClaimRejectUsage()
        };
      }

      sourceCommand[optionMap[option as keyof typeof optionMap]] =
        valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
      const metadata = parseMetadataOption(rest, index, formatSourceClaimRejectUsage());

      if (metadata.error !== undefined || metadata.entry === undefined) {
        return {
          error: metadata.error ?? formatSourceClaimRejectUsage()
        };
      }

      sourceCommand.metadata[metadata.entry.key] = metadata.entry.value;
      index = metadata.nextIndex;
      continue;
    }

    return {
      error: formatSourceClaimRejectUsage()
    };
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
    const arg = rest[index];

    if (arg === "--persist") {
      sourceCommand.persist = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      return {
        command: {
          kind: "sourceDecisionLinkHelp"
        }
      };
    }

    const optionMap = {
      "--source-claim-id": "sourceClaimId",
      "--target-type": "targetType",
      "--target-id": "targetId",
      "--support-type": "supportType",
      "--confidence": "confidence",
      "--notes": "notes"
    } as const;
    const option = Object.keys(optionMap).find((candidate) =>
      arg === candidate || arg?.startsWith(`${candidate}=`) === true
    );

    if (option !== undefined) {
      const valueResult = optionValue(rest, index, option);

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatSourceDecisionLinkUsage()
        };
      }

      sourceCommand[optionMap[option as keyof typeof optionMap]] =
        valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
      const metadata = parseMetadataOption(rest, index, formatSourceDecisionLinkUsage());

      if (metadata.error !== undefined || metadata.entry === undefined) {
        return {
          error: metadata.error ?? formatSourceDecisionLinkUsage()
        };
      }

      sourceCommand.metadata[metadata.entry.key] = metadata.entry.value;
      index = metadata.nextIndex;
      continue;
    }

    return {
      error: formatSourceDecisionLinkUsage()
    };
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
