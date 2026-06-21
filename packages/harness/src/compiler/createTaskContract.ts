import type {
  OperatorIntent,
  TaskContract
} from "@krn/core";
import type {
  CreateTaskContractInput
} from "../repositories/index.js";

export interface TaskContractDraft {
  title: string;
  objective: string;
  constraints: string[];
  nonGoals: string[];
  acceptance: string[];
  metadata?: Record<string, unknown>;
}

const summarizeIntent = (rawIntent: string): string => {
  const normalized = rawIntent.trim().replace(/\s+/g, " ");

  if (normalized.length <= 80) {
    return normalized;
  }

  return `${normalized.slice(0, 77)}...`;
};

export const createTaskContractInput = (
  operatorIntent: OperatorIntent,
  draft: TaskContractDraft | undefined
): CreateTaskContractInput => {
  const title = draft?.title ?? summarizeIntent(operatorIntent.rawIntent);
  const objective = draft?.objective ?? operatorIntent.rawIntent;

  return {
    operatorIntentId: operatorIntent.id,
    ...(operatorIntent.projectId === undefined ? {} : { projectId: operatorIntent.projectId }),
    title,
    objective,
    constraints: draft?.constraints ?? [],
    nonGoals: draft?.nonGoals ?? [],
    acceptance: draft?.acceptance ?? ["Review compiled harness plan before execution."],
    metadata: draft?.metadata ?? {}
  };
};

export const summarizeTaskContract = (taskContract: TaskContract): string =>
  `${taskContract.title}: ${taskContract.objective}`;
