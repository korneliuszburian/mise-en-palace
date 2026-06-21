import type { TaskContract } from "@krn/core";

import type { ActivationQuery } from "./types.js";

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

export const buildMemoryQuery = (task: TaskContract): ActivationQuery => {
  const text = taskActivationText(task);

  return {
    taskContractId: task.id,
    text,
    terms: tokenizeActivationText(text),
    focus: "memory"
  };
};
