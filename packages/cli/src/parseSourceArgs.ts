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
  if (rest[0] === "claim" && rest[1] === "add") {
    return parseSourceClaimAddArgs(rest);
  }

  if (rest[0] === "claim" && rest[1] === "reject") {
    return parseSourceClaimRejectArgs(rest);
  }

  if (rest[0] === "decision" && rest[1] === "link") {
    return parseSourceDecisionLinkArgs(rest);
  }

  return {
    error: formatSourceClaimAddUsage()
  };
};
