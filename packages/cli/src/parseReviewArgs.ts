import type {
  CliCommand,
  ParseArgsResult
} from "./parseArgs.js";
import {
  metadataEntry,
  optionValue
} from "./parseArgHelpers.js";

export const formatReviewAssessUsage = (): string =>
  [
    "Usage: krn review assess --evidence-bundle-id <id> --reviewer <name> --summary \"...\" [--status accepted|changes_requested|rejected|pending] [--persist]",
    "",
    "Required:",
    "--evidence-bundle-id",
    "--reviewer",
    "--summary",
    "",
    "Optional:",
    "--status <pending|accepted|changes_requested|rejected>",
    "--finding <low|medium|high:message>",
    "--outcome <accepted|changes_requested|rejected|pending|needs_changes>",
    "--review-burden <low|medium|high>",
    "--diff-risk <low|medium|high>",
    "--correction-label <label>",
    "--metadata key=value",
    "--persist"
  ].join("\n") + "\n";

export const parseReviewArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest[0] !== "assess") {
    return {
      error: formatReviewAssessUsage()
    };
  }

  const reviewCommand: Extract<CliCommand, { kind: "reviewAssess" }> = {
    kind: "reviewAssess",
    persist: false,
    findings: [],
    correctionLabels: [],
    metadata: {}
  };

  for (let index = 1; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--persist") {
      reviewCommand.persist = true;
      continue;
    }

    const optionMap = {
      "--evidence-bundle-id": "evidenceBundleId",
      "--reviewer": "reviewer",
      "--status": "status",
      "--summary": "summary",
      "--outcome": "outcome",
      "--review-burden": "reviewBurden",
      "--diff-risk": "diffRisk"
    } as const;
    const option = Object.keys(optionMap).find((candidate) =>
      arg === candidate || arg?.startsWith(`${candidate}=`) === true
    );

    if (option !== undefined) {
      const valueResult = optionValue(rest, index, option);

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatReviewAssessUsage()
        };
      }

      reviewCommand[optionMap[option as keyof typeof optionMap]] =
        valueResult.value.trim();
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--finding" || arg?.startsWith("--finding=") === true) {
      const valueResult = optionValue(rest, index, "--finding");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatReviewAssessUsage()
        };
      }

      reviewCommand.findings.push(valueResult.value.trim());
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--correction-label" || arg?.startsWith("--correction-label=") === true) {
      const valueResult = optionValue(rest, index, "--correction-label");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatReviewAssessUsage()
        };
      }

      reviewCommand.correctionLabels.push(valueResult.value.trim());
      index = valueResult.nextIndex;
      continue;
    }

    if (arg === "--metadata" || arg?.startsWith("--metadata=") === true) {
      const valueResult = optionValue(rest, index, "--metadata");

      if (valueResult.error !== undefined || valueResult.value === undefined) {
        return {
          error: valueResult.error ?? formatReviewAssessUsage()
        };
      }

      const entry = metadataEntry(valueResult.value);

      if (entry.error !== undefined || entry.key === undefined || entry.value === undefined) {
        return {
          error: entry.error ?? formatReviewAssessUsage()
        };
      }

      reviewCommand.metadata[entry.key] = entry.value;
      index = valueResult.nextIndex;
      continue;
    }

    return {
      error: formatReviewAssessUsage()
    };
  }

  return {
    command: reviewCommand
  };
};
