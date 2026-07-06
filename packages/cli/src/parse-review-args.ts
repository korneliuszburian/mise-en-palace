import type {
  CliCommand,
  ParseArgsResult
} from "./parse-args.js";
import {
  metadataEntry,
  optionValue
} from "./parse-cli-options.js";

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

type ReviewAssessCommand = Extract<CliCommand, { kind: "reviewAssess" }>;

type ReviewOptionResult =
  | {
      ok: true;
      nextIndex: number;
    }
  | {
      ok: false;
      error: string;
    };

type ReviewValueOptionResult =
  | {
      ok: true;
      nextIndex: number;
      value: string;
    }
  | {
      ok: false;
      error: string;
    };

type ReviewOptionHandler = (
  rest: readonly string[],
  index: number,
  command: ReviewAssessCommand
) => ReviewOptionResult;

type ReviewScalarField =
  | "evidenceBundleId"
  | "reviewer"
  | "status"
  | "summary"
  | "outcome"
  | "reviewBurden"
  | "diffRisk";

const reviewOptionNames = [
  "--persist",
  "--evidence-bundle-id",
  "--reviewer",
  "--status",
  "--summary",
  "--outcome",
  "--review-burden",
  "--diff-risk",
  "--finding",
  "--correction-label",
  "--metadata"
] as const;

type ReviewOptionName = typeof reviewOptionNames[number];

const optionMatches = (arg: string, optionName: ReviewOptionName): boolean =>
  optionName === "--persist"
    ? arg === optionName
    : arg === optionName || arg.startsWith(`${optionName}=`);

const findReviewOption = (arg: string): ReviewOptionName | undefined =>
  reviewOptionNames.find((optionName) => optionMatches(arg, optionName));

const parseReviewOptionValue = (
  rest: readonly string[],
  index: number,
  optionName: ReviewOptionName
): ReviewValueOptionResult => {
  const valueResult = optionValue(rest, index, optionName);

  if (valueResult.error !== undefined || valueResult.value === undefined) {
    return {
      ok: false,
      error: valueResult.error ?? formatReviewAssessUsage()
    };
  }

  return {
    ok: true,
    nextIndex: valueResult.nextIndex,
    value: valueResult.value.trim()
  };
};

const scalarReviewOptionHandler = (
  optionName: ReviewOptionName,
  field: ReviewScalarField
): ReviewOptionHandler =>
  (rest, index, command) => {
    const parsed = parseReviewOptionValue(rest, index, optionName);

    if (!parsed.ok) {
      return parsed;
    }

    command[field] = parsed.value;

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  };

const reviewOptionHandlers: Record<ReviewOptionName, ReviewOptionHandler> = {
  "--persist": (_rest, index, command) => {
    command.persist = true;

    return {
      ok: true,
      nextIndex: index
    };
  },
  "--evidence-bundle-id": scalarReviewOptionHandler(
    "--evidence-bundle-id",
    "evidenceBundleId"
  ),
  "--reviewer": scalarReviewOptionHandler("--reviewer", "reviewer"),
  "--status": scalarReviewOptionHandler("--status", "status"),
  "--summary": scalarReviewOptionHandler("--summary", "summary"),
  "--outcome": scalarReviewOptionHandler("--outcome", "outcome"),
  "--review-burden": scalarReviewOptionHandler("--review-burden", "reviewBurden"),
  "--diff-risk": scalarReviewOptionHandler("--diff-risk", "diffRisk"),
  "--finding": (rest, index, command) => {
    const parsed = parseReviewOptionValue(rest, index, "--finding");

    if (!parsed.ok) {
      return parsed;
    }

    command.findings.push(parsed.value);

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  },
  "--correction-label": (rest, index, command) => {
    const parsed = parseReviewOptionValue(rest, index, "--correction-label");

    if (!parsed.ok) {
      return parsed;
    }

    command.correctionLabels.push(parsed.value);

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  },
  "--metadata": (rest, index, command) => {
    const parsed = parseReviewOptionValue(rest, index, "--metadata");

    if (!parsed.ok) {
      return parsed;
    }

    const entry = metadataEntry(parsed.value);

    if (entry.error !== undefined || entry.key === undefined || entry.value === undefined) {
      return {
        ok: false,
        error: entry.error ?? formatReviewAssessUsage()
      };
    }

    command.metadata[entry.key] = entry.value;

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  }
};

export const parseReviewArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest[0] === "--help" || rest[0] === "-h") {
    return {
      command: {
        kind: "reviewAssessHelp"
      }
    };
  }

  if (rest[0] !== "assess") {
    return {
      error: formatReviewAssessUsage()
    };
  }

  const reviewCommand: ReviewAssessCommand = {
    kind: "reviewAssess",
    persist: false,
    findings: [],
    correctionLabels: [],
    metadata: {}
  };

  for (let index = 1; index < rest.length; index += 1) {
    const arg = rest[index]!;
    const option = findReviewOption(arg);

    if (option === undefined) {
      return {
        error: formatReviewAssessUsage()
      };
    }

    const parsed = reviewOptionHandlers[option](rest, index, reviewCommand);

    if (!parsed.ok) {
      return {
        error: parsed.error
      };
    }

    index = parsed.nextIndex;
  }

  return {
    command: reviewCommand
  };
};
