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
    "krn run eval-evidence --project-id <project-id> [--run-id <execution-run-id>] [--json]",
    "  note: eval-evidence reads durable paired-live eval evidence; it does not mutate memory, source, evidence, or run records",
    "  requires: KRN_DATABASE_URL and persisted paired_live_eval_evidence rows; retained project/run rows may already be cleaned",
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
  scenario?: string;
  outcome?: typeof pairedOutcomes[number];
  usefulnessOutcome?: typeof pairedUsefulnessOutcomes[number];
  limit?: number;
}

interface RunEvalEvidenceOptionalCommandFields {
  readonly runId?: string;
  readonly scenario?: string;
  readonly outcome?: typeof pairedOutcomes[number];
  readonly usefulnessOutcome?: typeof pairedUsefulnessOutcomes[number];
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

type EvalEvidenceStringField = "projectId" | "runId" | "scenario";

const evalEvidenceStringFieldFor = (
  arg: string | undefined
): EvalEvidenceStringField | undefined => {
  if (arg === "--project-id" || arg === "--project") return "projectId";
  if (arg === "--run-id" || arg === "--run") return "runId";
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
    scenario?: string;
    outcome?: typeof pairedOutcomes[number];
    usefulnessOutcome?: typeof pairedUsefulnessOutcomes[number];
    limit?: number;
  } = {};

  if (parsed.runId !== undefined) fields.runId = parsed.runId;
  if (parsed.scenario !== undefined) fields.scenario = parsed.scenario;
  if (parsed.outcome !== undefined) fields.outcome = parsed.outcome;
  if (parsed.usefulnessOutcome !== undefined) {
    fields.usefulnessOutcome = parsed.usefulnessOutcome;
  }
  if (parsed.limit !== undefined) fields.limit = parsed.limit;

  return fields;
};

const parseRunEvalEvidenceArgs = (args: readonly string[]): ParseArgsResult => {
  let parsed: RunEvalEvidenceArgs = { format: "text" };
  for (let index = 0; index < args.length; index += 1) {
    const result = parseRunEvalEvidenceOption(parsed, args, index);
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
    command: {
      kind: "runEvalEvidence",
      projectId: parsed.projectId,
      ...runEvalEvidenceOptionalCommandFields(parsed),
      format: parsed.format
    }
  };
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
    default:
      return {
        error: `Unsupported run command: ${action}\n${formatRunUsage()}`
      };
  }
};
