import type {
  CliCommand,
  ParseArgsResult
} from "./parseArgs.js";
import {
  optionMatches,
  parsedOptionValue
} from "./parseArgHelpers.js";

const reflectUsage = "Usage: krn reflect --scope run:<id>|project:<id>|topic:<name> [--project <id>] [--persist]";
const topicUsage = "Usage: krn reflect --scope topic:<name> --project <id> [--persist]";

type ReflectScope = Extract<CliCommand, { kind: "reflect" }>["scope"];

type ReflectParseState = {
  persist: boolean;
  scopeValue: string | undefined;
  projectId: string | undefined;
};

type ReflectOptionResult =
  | {
      ok: true;
      nextIndex: number;
    }
  | {
      ok: false;
      error: string;
    };

type ReflectScopeResult =
  | {
      ok: true;
      scope: ReflectScope;
    }
  | {
      ok: false;
      error: string;
    };

const parseReflectOption = (
  rest: readonly string[],
  index: number,
  state: ReflectParseState
): ReflectOptionResult => {
  const arg = rest[index];

  if (arg === "--persist") {
    state.persist = true;

    return {
      ok: true,
      nextIndex: index
    };
  }

  if (arg !== undefined && optionMatches(arg, "--scope")) {
    const parsed = parsedOptionValue(rest, index, "--scope", reflectUsage);

    if (!parsed.ok) {
      return parsed;
    }

    state.scopeValue = parsed.value;

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  }

  if (arg !== undefined && optionMatches(arg, "--project")) {
    const parsed = parsedOptionValue(rest, index, "--project", reflectUsage);

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
    error: reflectUsage
  };
};

const parseIdScope = (
  scopeValue: string,
  prefix: "run:" | "project:",
  kind: "run" | "project"
): ReflectScopeResult => {
  if (!scopeValue.startsWith(prefix)) {
    return {
      ok: false,
      error: reflectUsage
    };
  }

  const id = scopeValue.slice(prefix.length).trim();

  if (id.length === 0) {
    return {
      ok: false,
      error: reflectUsage
    };
  }

  return {
    ok: true,
    scope: {
      kind,
      id
    }
  };
};

const parseTopicScope = (
  scopeValue: string,
  projectId: string | undefined
): ReflectScopeResult => {
  if (!scopeValue.startsWith("topic:")) {
    return {
      ok: false,
      error: reflectUsage
    };
  }

  const name = scopeValue.slice("topic:".length).trim();

  if (name.length === 0 || projectId === undefined || projectId.length === 0) {
    return {
      ok: false,
      error: topicUsage
    };
  }

  return {
    ok: true,
    scope: {
      kind: "topic",
      name,
      projectId
    }
  };
};

const parseReflectScope = (
  scopeValue: string | undefined,
  projectId: string | undefined
): ReflectScopeResult => {
  if (scopeValue === undefined || scopeValue.length === 0) {
    return {
      ok: false,
      error: reflectUsage
    };
  }

  if (scopeValue.startsWith("run:")) {
    return parseIdScope(scopeValue, "run:", "run");
  }

  if (scopeValue.startsWith("project:")) {
    return parseIdScope(scopeValue, "project:", "project");
  }

  return parseTopicScope(scopeValue, projectId);
};

export const parseReflectArgs = (rest: readonly string[]): ParseArgsResult => {
  const state: ReflectParseState = {
    persist: false,
    scopeValue: undefined,
    projectId: undefined
  };

  for (let index = 0; index < rest.length; index += 1) {
    const parsed = parseReflectOption(rest, index, state);

    if (!parsed.ok) {
      return {
        error: parsed.error
      };
    }

    index = parsed.nextIndex;
  }

  const scope = parseReflectScope(state.scopeValue, state.projectId);

  if (!scope.ok) {
    return {
      error: scope.error
    };
  }

  return {
    command: {
      kind: "reflect",
      scope: scope.scope,
      persist: state.persist
    }
  };
};
