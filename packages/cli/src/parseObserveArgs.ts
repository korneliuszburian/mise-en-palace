import type {
  ParseArgsResult
} from "./parseArgs.js";
import {
  optionMatches,
  parsedOptionValue
} from "./parseCliOptions.js";

const observeUsage = "Usage: krn observe --run <id>|--run-id <id> [--project <id>] [--persist]";
const observeRunOptions = ["--run-id", "--run"] as const;

export const formatObserveUsage = (): string => `${observeUsage}\n`;

type ObserveParseState = {
  persist: boolean;
  runId: string | undefined;
  projectId: string | undefined;
};

type ObserveOptionResult =
  | {
      ok: true;
      nextIndex: number;
    }
  | {
      ok: false;
      error: string;
    };

const findObserveRunOption = (arg: string): typeof observeRunOptions[number] | undefined =>
  observeRunOptions.find((option) => optionMatches(arg, option));

const parseObserveOption = (
  rest: readonly string[],
  index: number,
  state: ObserveParseState
): ObserveOptionResult => {
  const arg = rest[index];

  if (arg === "--persist") {
    state.persist = true;

    return {
      ok: true,
      nextIndex: index
    };
  }

  const runOption = arg === undefined ? undefined : findObserveRunOption(arg);

  if (runOption !== undefined) {
    const parsed = parsedOptionValue(rest, index, runOption, observeUsage);

    if (!parsed.ok) {
      return parsed;
    }

    state.runId = parsed.value;

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  }

  if (arg !== undefined && optionMatches(arg, "--project")) {
    const parsed = parsedOptionValue(rest, index, "--project", observeUsage);

    if (!parsed.ok) {
      return parsed;
    }

    state.projectId = parsed.value;

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  }

  return {
    ok: false,
    error: observeUsage
  };
};

export const parseObserveArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest[0] === "--help" || rest[0] === "-h") {
    return {
      command: {
        kind: "observeRunHelp"
      }
    };
  }

  const state: ObserveParseState = {
    persist: false,
    runId: undefined,
    projectId: undefined
  };

  for (let index = 0; index < rest.length; index += 1) {
    const parsed = parseObserveOption(rest, index, state);

    if (!parsed.ok) {
      return {
        error: parsed.error
      };
    }

    index = parsed.nextIndex;
  }

  if (state.runId === undefined || state.runId.length === 0) {
    return {
      error: observeUsage
    };
  }

  return {
    command: {
      kind: "observeRun",
      runId: state.runId,
      ...(state.projectId === undefined || state.projectId.length === 0 ? {} : { projectId: state.projectId }),
      persist: state.persist
    }
  };
};
