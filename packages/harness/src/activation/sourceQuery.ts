import type { TaskContract } from "@krn/core";

import {
  buildActivationQuery
} from "./memoryQuery.js";
import type { ActivationQuery } from "./types.js";

export const buildSourceQuery = (task: TaskContract): ActivationQuery => {
  return buildActivationQuery(task, {
    focus: "source",
    needs: ["source", "search"]
  });
};
