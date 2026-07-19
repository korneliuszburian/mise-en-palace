import type {
  ParseArgsResult
} from "./parse-args.js";

export const formatRunUsage = (): string =>
  [
    "Usage: krn run <command>",
    "",
    "Read-only operator commands:",
    "krn run show --run-id <execution-run-id> [--json]",
    "  note: run show reads persisted state; it does not mutate memory, evidence, or run records",
    "  requires: KRN_DATABASE_URL and a persisted execution run",
    "krn run eval-evidence --project-id <project-id> [--run-id <execution-run-id>] [--candidate-id <id>] [--json]",
    "  note: eval-evidence reads durable paired-live eval evidence; it does not mutate memory, source, evidence, or run records",
    "  requires: KRN_DATABASE_URL and persisted paired_live_eval_evidence rows; retained project/run rows may already be cleaned",
    "krn run eval-promotion-eligibility --project-id <project-id> [--run-id <execution-run-id>] [--candidate-id <id>] [--json]",
    "  note: eval-promotion-eligibility reads paired-live eval evidence and reviewed-helped authority; it does not propose or promote memory",
    "  output: ready_to_propose includes exact krn memory learn propose arguments; blocked states write nothing",
    "  verify DB first: pnpm db:migrate && pnpm db:ready"
  ].join("\n") + "\n";

const pairedOutcomes = ["win", "tie", "loss", "invalid", "unknown"] as const;
const pairedUsefulnessOutcomes = ["helped", "neutral", "hurt", "unknown"] as const;

const oneOf = <TValue extends string>(
  value: string | undefined,
  allowed: readonly TValue[]
): TValue | undefined => allowed.find((item) => item === value);

const parsePositiveInteger = (
  value: string | undefined
): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0 && String(parsed) === value
    ? parsed
    : undefined;
};

type RunFormat = "text" | "json";

interface RunShowArgs {
  runId?: string;
  format: RunFormat;
}

interface RunEvalEvidenceArgs extends RunShowArgs {
  projectId?: string;
  candidateId?: string;
  scenario?: string;
  outcome?: typeof pairedOutcomes[number];
  usefulnessOutcome?: typeof pairedUsefulnessOutcomes[number];
  limit?: number;
}

interface RunEvalPromotionEligibilityArgs extends RunShowArgs {
  projectId?: string;
  runId?: string;
  candidateId?: string;
  sourceDecisionId?: string;
  reviewAssessmentId?: string;
  limit?: number;
}

interface RunEvalEvidenceOptionalCommandFields {
  readonly runId?: string;
  readonly candidateId?: string;
  readonly scenario?: string;
  readonly outcome?: typeof pairedOutcomes[number];
  readonly usefulnessOutcome?: typeof pairedUsefulnessOutcomes[number];
  readonly limit?: number;
}

interface RunEvalPromotionEligibilityOptionalCommandFields {
  readonly runId?: string;
  readonly candidateId?: string;
  readonly sourceDecisionId?: string;
  readonly reviewAssessmentId?: string;
  readonly limit?: number;
}

type ParseRunOptionResult<TArgs> =
  | { readonly args: TArgs; readonly index: number }
  | { readonly error: string };

const optionError = (message: string): { readonly error: string } => ({
  error: `${message}\n${formatRunUsage()}`
});

const optionValue = (
  args: readonly string[],
  index: number
): string | undefined => {
  const value = args[index + 1];

  return value === undefined || value.trim().length === 0 || value.startsWith("--")
    ? undefined
    : value;
};

const parseRunShowOption = (
  current: RunShowArgs,
  args: readonly string[],
  index: number
): ParseRunOptionResult<RunShowArgs> => {
  const arg = args[index];

  switch (arg) {
    case "--run-id":
    case "--run": {
      const runId = optionValue(args, index);

      return runId === undefined
        ? optionError(`Missing value for ${arg}`)
        : { args: { ...current, runId }, index: index + 1 };
    }
    case "--json":
      return { args: { ...current, format: "json" }, index };
    default:
      return optionError(`Unsupported run show argument: ${arg ?? ""}`);
  }
};

type EvalEvidenceStringField = "projectId" | "runId" | "candidateId" | "scenario";

const evalEvidenceStringFieldFor = (
  arg: string | undefined
): EvalEvidenceStringField | undefined => {
  if (arg === "--project-id" || arg === "--project") return "projectId";
  if (arg === "--run-id" || arg === "--run") return "runId";
  if (arg === "--candidate-id" || arg === "--candidate") return "candidateId";
  if (arg === "--scenario") return "scenario";

  return undefined;
};

const parseRunEvalEvidenceStringOption = (
  current: RunEvalEvidenceArgs,
  args: readonly string[],
  index: number,
  arg: string,
  field: EvalEvidenceStringField
): ParseRunOptionResult<RunEvalEvidenceArgs> => {
  const value = optionValue(args, index);

  return value === undefined
    ? optionError(`Missing value for ${arg}`)
    : { args: { ...current, [field]: value }, index: index + 1 };
};

const parseRunEvalEvidenceOutcomeOption = (
  current: RunEvalEvidenceArgs,
  args: readonly string[],
  index: number
): ParseRunOptionResult<RunEvalEvidenceArgs> => {
  const value = optionValue(args, index);
  const outcome = oneOf(value, pairedOutcomes);

  return outcome === undefined
    ? optionError(`Unsupported paired-live eval outcome: ${value ?? ""}`)
    : { args: { ...current, outcome }, index: index + 1 };
};

const parseRunEvalEvidenceUsefulnessOption = (
  current: RunEvalEvidenceArgs,
  args: readonly string[],
  index: number
): ParseRunOptionResult<RunEvalEvidenceArgs> => {
  const value = optionValue(args, index);
  const usefulnessOutcome = oneOf(value, pairedUsefulnessOutcomes);

  return usefulnessOutcome === undefined
    ? optionError(`Unsupported paired-live eval usefulness outcome: ${value ?? ""}`)
    : { args: { ...current, usefulnessOutcome }, index: index + 1 };
};

const parseRunEvalEvidenceLimitOption = (
  current: RunEvalEvidenceArgs,
  args: readonly string[],
  index: number
): ParseRunOptionResult<RunEvalEvidenceArgs> => {
  const value = optionValue(args, index);
  const limit = parsePositiveInteger(value);

  return limit === undefined
    ? optionError(`Invalid --limit for run eval-evidence: ${value ?? ""}`)
    : { args: { ...current, limit }, index: index + 1 };
};

type EvalPromotionEligibilityStringField =
  | "projectId"
  | "runId"
  | "candidateId"
  | "sourceDecisionId"
  | "reviewAssessmentId";

const evalPromotionEligibilityStringFieldFor = (
  arg: string | undefined
): EvalPromotionEligibilityStringField | undefined => {
  if (arg === "--project-id" || arg === "--project") return "projectId";
  if (arg === "--run-id" || arg === "--run") return "runId";
  if (arg === "--candidate-id" || arg === "--candidate") return "candidateId";
  if (arg === "--source-decision-id") return "sourceDecisionId";
  if (arg === "--review-assessment-id") return "reviewAssessmentId";

  return undefined;
};

const parseRunEvalPromotionEligibilityStringOption = (
  current: RunEvalPromotionEligibilityArgs,
  args: readonly string[],
  index: number,
  arg: string,
  field: EvalPromotionEligibilityStringField
): ParseRunOptionResult<RunEvalPromotionEligibilityArgs> => {
  const value = optionValue(args, index);

  return value === undefined
    ? optionError(`Missing value for ${arg}`)
    : { args: { ...current, [field]: value }, index: index + 1 };
};

const parseRunEvalPromotionEligibilityLimitOption = (
  current: RunEvalPromotionEligibilityArgs,
  args: readonly string[],
  index: number
): ParseRunOptionResult<RunEvalPromotionEligibilityArgs> => {
  const value = optionValue(args, index);
  const limit = parsePositiveInteger(value);

  return limit === undefined
    ? optionError(`Invalid --limit for run eval-promotion-eligibility: ${value ?? ""}`)
    : { args: { ...current, limit }, index: index + 1 };
};

const parseRunEvalEvidenceOption = (
  current: RunEvalEvidenceArgs,
  args: readonly string[],
  index: number
): ParseRunOptionResult<RunEvalEvidenceArgs> => {
  const arg = args[index];
  const stringField = evalEvidenceStringFieldFor(arg);

  if (arg === undefined) {
    return optionError("Unsupported run eval-evidence argument: ");
  }
  if (stringField !== undefined) {
    return parseRunEvalEvidenceStringOption(current, args, index, arg, stringField);
  }
  if (arg === "--outcome") {
    return parseRunEvalEvidenceOutcomeOption(current, args, index);
  }
  if (arg === "--usefulness-outcome") {
    return parseRunEvalEvidenceUsefulnessOption(current, args, index);
  }
  if (arg === "--limit") {
    return parseRunEvalEvidenceLimitOption(current, args, index);
  }
  if (arg === "--json") {
    return { args: { ...current, format: "json" }, index };
  }

  return optionError(`Unsupported run eval-evidence argument: ${arg}`);
};

const parseRunEvalPromotionEligibilityOption = (
  current: RunEvalPromotionEligibilityArgs,
  args: readonly string[],
  index: number
): ParseRunOptionResult<RunEvalPromotionEligibilityArgs> => {
  const arg = args[index];
  const stringField = evalPromotionEligibilityStringFieldFor(arg);

  if (arg === undefined) {
    return optionError("Unsupported run eval-promotion-eligibility argument: ");
  }
  if (stringField !== undefined) {
    return parseRunEvalPromotionEligibilityStringOption(
      current,
      args,
      index,
      arg,
      stringField
    );
  }
  if (arg === "--limit") {
    return parseRunEvalPromotionEligibilityLimitOption(current, args, index);
  }
  if (arg === "--json") {
    return { args: { ...current, format: "json" }, index };
  }

  return optionError(`Unsupported run eval-promotion-eligibility argument: ${arg}`);
};

const parseRunShowArgs = (args: readonly string[]): ParseArgsResult => {
  let parsed: RunShowArgs = { format: "text" };
  for (let index = 0; index < args.length; index += 1) {
    const result = parseRunShowOption(parsed, args, index);
    if ("error" in result) return result;
    parsed = result.args;
    index = result.index;
  }

  if (parsed.runId === undefined || parsed.runId.trim().length === 0) {
    return {
      error: `Missing required --run-id\n${formatRunUsage()}`
    };
  }

  return {
    command: {
      kind: "runShow",
      runId: parsed.runId,
      format: parsed.format
    }
  };
};

const runEvalEvidenceOptionalCommandFields = (
  parsed: RunEvalEvidenceArgs
): RunEvalEvidenceOptionalCommandFields => {
  const fields: {
    runId?: string;
    candidateId?: string;
    scenario?: string;
    outcome?: typeof pairedOutcomes[number];
    usefulnessOutcome?: typeof pairedUsefulnessOutcomes[number];
    limit?: number;
  } = {};

  if (parsed.runId !== undefined) fields.runId = parsed.runId;
  if (parsed.candidateId !== undefined) fields.candidateId = parsed.candidateId;
  if (parsed.scenario !== undefined) fields.scenario = parsed.scenario;
  if (parsed.outcome !== undefined) fields.outcome = parsed.outcome;
  if (parsed.usefulnessOutcome !== undefined) {
    fields.usefulnessOutcome = parsed.usefulnessOutcome;
  }
  if (parsed.limit !== undefined) fields.limit = parsed.limit;

  return fields;
};

const runEvalPromotionEligibilityOptionalCommandFields = (
  parsed: RunEvalPromotionEligibilityArgs
): RunEvalPromotionEligibilityOptionalCommandFields => {
  const fields: {
    runId?: string;
    candidateId?: string;
    sourceDecisionId?: string;
    reviewAssessmentId?: string;
    limit?: number;
  } = {};

  if (parsed.runId !== undefined) fields.runId = parsed.runId;
  if (parsed.candidateId !== undefined) fields.candidateId = parsed.candidateId;
  if (parsed.sourceDecisionId !== undefined) {
    fields.sourceDecisionId = parsed.sourceDecisionId;
  }
  if (parsed.reviewAssessmentId !== undefined) {
    fields.reviewAssessmentId = parsed.reviewAssessmentId;
  }
  if (parsed.limit !== undefined) fields.limit = parsed.limit;

  return fields;
};

const parseProjectScopedRunArgs = <TArgs extends { projectId?: string; format: RunFormat }>(
  args: readonly string[],
  initial: TArgs,
  parseOption: (
    current: TArgs,
    args: readonly string[],
    index: number
  ) => ParseRunOptionResult<TArgs>,
  commandFor: (
    parsed: TArgs & { projectId: string }
  ) => NonNullable<ParseArgsResult["command"]>
): ParseArgsResult => {
  let parsed = initial;
  for (let index = 0; index < args.length; index += 1) {
    const result = parseOption(parsed, args, index);
    if ("error" in result) return result;
    parsed = result.args;
    index = result.index;
  }

  if (parsed.projectId === undefined || parsed.projectId.trim().length === 0) {
    return {
      error: `Missing required --project-id\n${formatRunUsage()}`
    };
  }

  return {
    command: commandFor({ ...parsed, projectId: parsed.projectId })
  };
};

const runEvalEvidenceCommand = (
  parsed: RunEvalEvidenceArgs & { projectId: string }
): NonNullable<ParseArgsResult["command"]> => ({
  kind: "runEvalEvidence",
  projectId: parsed.projectId,
  ...runEvalEvidenceOptionalCommandFields(parsed),
  format: parsed.format
});

const runEvalPromotionEligibilityCommand = (
  parsed: RunEvalPromotionEligibilityArgs & { projectId: string }
): NonNullable<ParseArgsResult["command"]> => ({
  kind: "runEvalPromotionEligibility",
  projectId: parsed.projectId,
  ...runEvalPromotionEligibilityOptionalCommandFields(parsed),
  format: parsed.format
});

const parseRunEvalEvidenceArgs = (args: readonly string[]): ParseArgsResult => {
  return parseProjectScopedRunArgs(
    args,
    { format: "text" },
    parseRunEvalEvidenceOption,
    runEvalEvidenceCommand
  );
};

const parseRunEvalPromotionEligibilityArgs = (
  args: readonly string[]
): ParseArgsResult => {
  return parseProjectScopedRunArgs(
    args,
    { format: "text" },
    parseRunEvalPromotionEligibilityOption,
    runEvalPromotionEligibilityCommand
  );
};

export const parseRunArgs = (rest: readonly string[]): ParseArgsResult => {
  const [action, ...args] = rest;

  if (action === undefined || action === "--help" || action === "-h") {
    return {
      command: {
        kind: "runShowHelp"
      }
    };
  }

  switch (action) {
    case "show":
      return parseRunShowArgs(args);
    case "eval-evidence":
      return parseRunEvalEvidenceArgs(args);
    case "eval-promotion-eligibility":
      return parseRunEvalPromotionEligibilityArgs(args);
    default:
      return {
        error: `Unsupported run command: ${action}\n${formatRunUsage()}`
      };
  }
};
