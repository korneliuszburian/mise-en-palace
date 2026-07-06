import type {
  DiffRisk,
  TaskContract
} from "@krn/core";

export interface EvidenceContractCommand {
  command: string;
  required: boolean;
}

export interface EvidenceContract {
  commands: EvidenceContractCommand[];
  diffRisk: DiffRisk;
  reviewBurden: string;
  rollbackPath: string;
  metadata: Record<string, unknown>;
}

const riskFromTask = (taskContract: TaskContract): DiffRisk => {
  const text = [
    taskContract.title,
    taskContract.objective,
    ...taskContract.constraints,
    ...taskContract.acceptance
  ].join(" ").toLowerCase();

  if (text.includes("migration") || text.includes("schema") || text.includes("database")) {
    return "high";
  }

  if (text.includes("doctor") || text.includes("compiler") || text.includes("harness")) {
    return "medium";
  }

  return "low";
};

export const createEvidenceContract = (taskContract: TaskContract): EvidenceContract => ({
  commands: [
    {
      command: "pnpm typecheck",
      required: true
    },
    {
      command: "pnpm test",
      required: true
    },
    {
      command: "git diff --check",
      required: true
    }
  ],
  diffRisk: riskFromTask(taskContract),
  reviewBurden: "Summarize changed files, boundary impact, test coverage, and residual risk.",
  rollbackPath: "Use a focused revert of the implementation commit if the slice regresses.",
  metadata: {
    taskContractId: taskContract.id
  }
});
