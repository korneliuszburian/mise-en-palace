import type { TaskContract } from "@krn/core";

import type {
  ActivationQuery,
  ActivationQueryBudget,
  ActivationQueryFocus,
  ActivationQueryNeed,
  ActivationQueryRisk
} from "./types.js";

const stopWords = new Set([
  "and",
  "the",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "make",
  "does",
  "not",
  "add",
  "krn"
]);

export const taskActivationText = (task: TaskContract): string =>
  [
    task.title,
    task.objective,
    ...task.constraints,
    ...task.nonGoals,
    ...task.acceptance
  ].join(" ");

export const tokenizeActivationText = (text: string): string[] => {
  const matches = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const terms = new Set(
    matches.filter((term) => term.length > 2 && !stopWords.has(term))
  );

  return [...terms];
};

export interface BuildActivationQueryOptions {
  focus?: ActivationQueryFocus;
  needs?: readonly ActivationQueryNeed[];
  budget?: Partial<ActivationQueryBudget>;
  risk?: ActivationQueryRisk;
  extraTerms?: readonly string[];
}

const defaultBudget: ActivationQueryBudget = {
  maxItems: 6,
  maxTokens: 1200,
  reserveTokens: 0
};

const defaultNeedsForFocus = (focus: ActivationQueryFocus): readonly ActivationQueryNeed[] => {
  if (focus === "memory") {
    return ["memory"];
  }

  if (focus === "source") {
    return ["source", "search"];
  }

  if (focus === "observation") {
    return ["observation"];
  }

  return ["memory", "source", "observation", "search"];
};

const activationTerms = (
  text: string,
  extraTerms: readonly string[] | undefined
): readonly string[] => {
  const terms = new Set(tokenizeActivationText(text));

  for (const term of extraTerms ?? []) {
    for (const token of tokenizeActivationText(term)) {
      terms.add(token);
    }
  }

  return [...terms];
};

export const buildActivationQuery = (
  task: TaskContract,
  options: BuildActivationQueryOptions = {}
): ActivationQuery => {
  const text = taskActivationText(task);
  const focus = options.focus ?? "mixed";
  const budget = {
    ...defaultBudget,
    ...(options.budget ?? {})
  };

  return {
    taskContractId: task.id,
    ...(task.projectId === undefined ? {} : { projectId: task.projectId }),
    text,
    terms: activationTerms(text, options.extraTerms),
    focus,
    needs: [...(options.needs ?? defaultNeedsForFocus(focus))],
    scope: {
      taskContractId: task.id,
      ...(task.projectId === undefined ? {} : { projectId: task.projectId })
    },
    budget,
    risk: options.risk ?? "medium"
  };
};

export const buildMemoryQuery = (task: TaskContract): ActivationQuery => {
  return buildActivationQuery(task, {
    focus: "memory",
    needs: ["memory", "anti_memory"]
  });
};
