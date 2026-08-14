import type {
  ParseArgsResult
} from "./parse-args.js";

const defaultPlanUsage =
  "Usage: krn plan [--project <project-id>|--repo <path>] --task \"...\" [--verification <command>]... [--persist] [--backend sqlite|postgres] [--json]";

export const formatPlanUsage = (): string => `${defaultPlanUsage}\n`;

const parsedOptionValue = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();

  if (trimmed === undefined || trimmed.length === 0 || trimmed.startsWith("--")) {
    return undefined;
  }

  return trimmed;
};

interface PlanArgsState {
  task?: string;
  persist: boolean;
  projectId?: string;
  repo?: string;
  verificationCommands: string[];
  format: "text" | "json";
  backend?: "sqlite" | "postgres";
}

type PlanStringField = "projectId" | "repo" | "task" | "verificationCommand";

type PlanParseStep =
  | {
      kind: "parsed";
      nextIndex: number;
    }
  | {
      kind: "unmatched";
    }
  | {
      kind: "error";
      error: string;
    };

const planParseError = (usage: string): PlanParseStep => ({
  kind: "error",
  error: usage
});

const setPlanStringField = (
  state: PlanArgsState,
  field: PlanStringField,
  value: string
): void => {
  if (field === "projectId") {
    state.projectId = value;
    return;
  }

  if (field === "repo") {
    state.repo = value;
    return;
  }

  if (field === "verificationCommand") {
    state.verificationCommands.push(value);
    return;
  }

  state.task = value;
};

const parseStringOptionStep = (
  rest: readonly string[],
  index: number,
  option: string,
  field: PlanStringField,
  state: PlanArgsState,
  usage: string
): PlanParseStep => {
  const arg = rest[index];
  const inlinePrefix = `${option}=`;
  const value =
    arg === option
      ? parsedOptionValue(rest[index + 1])
      : arg?.startsWith(inlinePrefix) === true
        ? parsedOptionValue(arg.slice(inlinePrefix.length))
        : undefined;

  if (value === undefined) {
    return arg === option || arg?.startsWith(inlinePrefix) === true
      ? planParseError(usage)
      : { kind: "unmatched" };
  }

  setPlanStringField(state, field, value);

  return {
    kind: "parsed",
    nextIndex: arg === option ? index + 1 : index
  };
};

// fallow-ignore-next-line complexity -- the closed plan argv grammar keeps backend, persistence, and repeated verification options fail-closed in one parser
const parsePlanArgStep = (
  rest: readonly string[],
  index: number,
  state: PlanArgsState,
  usage: string
): PlanParseStep => {
  if (rest[index] === "--persist") {
    state.persist = true;

    return {
      kind: "parsed",
      nextIndex: index
    };
  }

  if (rest[index] === "--json") {
    state.format = "json";

    return {
      kind: "parsed",
      nextIndex: index
    };
  }

  if (rest[index] === "--backend" || rest[index]?.startsWith("--backend=") === true) {
    const arg = rest[index];
    const inline = arg?.startsWith("--backend=") === true ? arg.slice("--backend=".length) : undefined;
    const value = parsedOptionValue(inline ?? rest[index + 1]);
    if (value !== "sqlite" && value !== "postgres") {
      return planParseError(usage);
    }
    state.backend = value;
    return { kind: "parsed", nextIndex: inline === undefined ? index + 1 : index };
  }

  const verificationStep = parseStringOptionStep(
    rest,
    index,
    "--verification",
    "verificationCommand",
    state,
    usage
  );

  if (verificationStep.kind !== "unmatched") {
    return verificationStep;
  }

  const projectStep = parseStringOptionStep(rest, index, "--project", "projectId", state, usage);

  if (projectStep.kind !== "unmatched") {
    return projectStep;
  }

  const repoStep = parseStringOptionStep(rest, index, "--repo", "repo", state, usage);

  if (repoStep.kind !== "unmatched") {
    return repoStep;
  }

  const taskStep = parseStringOptionStep(rest, index, "--task", "task", state, usage);

  return taskStep.kind === "unmatched" ? planParseError(usage) : taskStep;
};

export const parsePlanArgs = (
  rest: readonly string[],
  usage = defaultPlanUsage
): ParseArgsResult => {
  if (rest[0] === "--help" || rest[0] === "-h") {
    return {
      command: {
        kind: "planHelp"
      }
    };
  }

  const state: PlanArgsState = {
    persist: false,
    verificationCommands: [],
    format: "text"
  };

  for (let index = 0; index < rest.length; index += 1) {
    const step = parsePlanArgStep(rest, index, state, usage);

    if (step.kind === "error") {
      return {
        error: step.error
      };
    }

    if (step.kind === "parsed") {
      index = step.nextIndex;
      continue;
    }

    return {
      error: usage
    };
  }

  if (state.task === undefined) {
    return {
      error: usage
    };
  }
  if (state.projectId !== undefined && state.repo !== undefined) {
    return { error: usage };
  }

  return {
    command: {
      kind: "plan",
      task: state.task,
      persist: state.persist,
      verificationCommands: state.verificationCommands,
      format: state.format,
      ...(state.backend === undefined ? {} : { backend: state.backend }),
      ...(state.projectId === undefined ? {} : { projectId: state.projectId }),
      ...(state.repo === undefined ? {} : { repo: state.repo })
    }
  };
};
