import type {
  ParseArgsResult
} from "./parse-args.js";

const defaultPlanUsage = "Usage: krn plan --task \"...\"";

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
}

type PlanStringField = "projectId" | "task";

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

  const projectStep = parseStringOptionStep(rest, index, "--project", "projectId", state, usage);

  if (projectStep.kind !== "unmatched") {
    return projectStep;
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
    persist: false
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

  return {
    command: {
      kind: "plan",
      task: state.task,
      persist: state.persist,
      ...(state.projectId === undefined ? {} : { projectId: state.projectId })
    }
  };
};
