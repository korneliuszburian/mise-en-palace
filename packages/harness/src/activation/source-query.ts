import type { TaskContract } from "@krn/core";

import {
  buildActivationQuery
} from "./memory-query.js";
import type { ActivationQuery } from "./types.js";

const sourceToDecisionQueryTerms = [
  "source mechanism krn implication decision rejection consumer falsifier does-not-prove boundary",
  "retained knowledge pattern reviewable decision chain",
  "preserve research local evidence decorative source notes reuse"
] as const;

const sourceQueryExtraTerms = (task: TaskContract): readonly string[] => {
  const text = [
    task.title,
    task.objective,
    ...task.constraints,
    ...task.acceptance
  ].join(" ").toLowerCase();

  if (text.includes("source-to-decision")) {
    return sourceToDecisionQueryTerms;
  }

  return [];
};

export const buildSourceQuery = (task: TaskContract): ActivationQuery => {
  return buildActivationQuery(task, {
    focus: "source",
    needs: ["source", "search"],
    extraTerms: sourceQueryExtraTerms(task)
  });
};
