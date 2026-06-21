import type { TaskContract } from "@krn/core";

import {
  taskActivationText,
  tokenizeActivationText
} from "./memoryQuery.js";
import type { ActivationQuery } from "./types.js";

export const buildSourceQuery = (task: TaskContract): ActivationQuery => {
  const text = taskActivationText(task);

  return {
    taskContractId: task.id,
    text,
    terms: tokenizeActivationText(text),
    focus: "source"
  };
};
