import type {
  DiffRisk
} from "./evidence-bundle.js";
import type {
  ExecutionRun,
  ExecutionRunStatus
} from "./execution-run.js";
import type { HarnessPlan } from "./harness-plan.js";
import type {
  ExecutionRunId,
  HarnessPlanId,
  TaskContractId
} from "./ids.js";
import type {
  TaskContract,
  TaskContractStatus
} from "./task-contract.js";

export interface EvidenceContractCommand {
  command: string;
  required: boolean;
}

export interface EvidenceContract {
  taskContractId: TaskContractId;
  commands: EvidenceContractCommand[];
  diffRisk: DiffRisk;
  reviewBurden: string;
  rollbackPath: string;
  metadata: Record<string, unknown>;
}

export const evidenceContractInactiveReasons = [
  "missing_evidence_contract",
  "missing_task_contract_binding",
  "invalid_evidence_contract",
  "task_contract_binding_mismatch",
  "harness_plan_task_contract_mismatch",
  "execution_run_harness_plan_mismatch",
  "task_contract_not_active",
  "execution_run_terminal"
] as const;

export type EvidenceContractInactiveReason =
  typeof evidenceContractInactiveReasons[number];

export type EvidenceContractActiveExecutionRunStatus =
  Extract<ExecutionRunStatus, "planned" | "running">;

interface EvidenceContractActivationIdentity {
  taskContractId: TaskContractId;
  harnessPlanId: HarnessPlanId;
  executionRunId: ExecutionRunId;
}

export type EvidenceContractActivationDecision =
  | (EvidenceContractActivationIdentity & {
      status: "active";
      evidenceContract: EvidenceContract;
      taskContractStatus: Extract<TaskContractStatus, "active">;
      executionRunStatus: EvidenceContractActiveExecutionRunStatus;
    })
  | (EvidenceContractActivationIdentity & {
      status: "inactive";
      reason: EvidenceContractInactiveReason;
      evidenceContract?: EvidenceContract;
      taskContractStatus: TaskContractStatus;
      executionRunStatus: ExecutionRunStatus;
    });

export interface EvidenceContractActivationInput {
  evidenceContract: unknown;
  taskContract: Pick<TaskContract, "id" | "status">;
  harnessPlan: Pick<HarnessPlan, "id" | "taskContractId">;
  executionRun: Pick<ExecutionRun, "id" | "harnessPlanId" | "status">;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isDiffRisk = (value: unknown): value is DiffRisk =>
  value === "low" || value === "medium" || value === "high";

export const parseEvidenceContract = (value: unknown): EvidenceContract | undefined => {
  if (!isRecord(value) || !Array.isArray(value.commands)) {
    return undefined;
  }

  const commands = value.commands.map((item): EvidenceContractCommand | undefined => {
    if (!isRecord(item) || typeof item.command !== "string" || typeof item.required !== "boolean") {
      return undefined;
    }

    return {
      command: item.command,
      required: item.required
    };
  });

  if (
    commands.length === 0 ||
    commands.some((command) => command === undefined) ||
    typeof value.taskContractId !== "string" ||
    value.taskContractId.trim().length === 0 ||
    !isDiffRisk(value.diffRisk) ||
    typeof value.reviewBurden !== "string" ||
    typeof value.rollbackPath !== "string"
  ) {
    return undefined;
  }

  const validCommands = commands.filter(
    (command): command is EvidenceContractCommand => command !== undefined
  );

  return {
    taskContractId: value.taskContractId,
    commands: validCommands,
    diffRisk: value.diffRisk,
    reviewBurden: value.reviewBurden,
    rollbackPath: value.rollbackPath,
    metadata: isRecord(value.metadata) ? value.metadata : {}
  };
};

const isActiveExecutionRunStatus = (
  status: ExecutionRunStatus
): status is EvidenceContractActiveExecutionRunStatus =>
  status === "planned" || status === "running";

const inactiveEvidenceContractDecision = (
  input: EvidenceContractActivationInput,
  reason: EvidenceContractInactiveReason,
  evidenceContract?: EvidenceContract
): EvidenceContractActivationDecision => ({
  status: "inactive",
  reason,
  taskContractId: input.taskContract.id,
  harnessPlanId: input.harnessPlan.id,
  executionRunId: input.executionRun.id,
  taskContractStatus: input.taskContract.status,
  executionRunStatus: input.executionRun.status,
  ...(evidenceContract === undefined ? {} : { evidenceContract })
});

export const decideEvidenceContractActivation = (
  input: EvidenceContractActivationInput
): EvidenceContractActivationDecision => {
  if (input.evidenceContract === undefined) {
    return inactiveEvidenceContractDecision(input, "missing_evidence_contract");
  }

  if (
    isRecord(input.evidenceContract) &&
    (
      input.evidenceContract.taskContractId === undefined ||
      (
        typeof input.evidenceContract.taskContractId === "string" &&
        input.evidenceContract.taskContractId.trim().length === 0
      )
    )
  ) {
    return inactiveEvidenceContractDecision(input, "missing_task_contract_binding");
  }

  const evidenceContract = parseEvidenceContract(input.evidenceContract);

  if (evidenceContract === undefined) {
    return inactiveEvidenceContractDecision(input, "invalid_evidence_contract");
  }

  if (evidenceContract.taskContractId !== input.taskContract.id) {
    return inactiveEvidenceContractDecision(
      input,
      "task_contract_binding_mismatch",
      evidenceContract
    );
  }

  if (input.harnessPlan.taskContractId !== input.taskContract.id) {
    return inactiveEvidenceContractDecision(
      input,
      "harness_plan_task_contract_mismatch",
      evidenceContract
    );
  }

  if (input.executionRun.harnessPlanId !== input.harnessPlan.id) {
    return inactiveEvidenceContractDecision(
      input,
      "execution_run_harness_plan_mismatch",
      evidenceContract
    );
  }

  if (input.taskContract.status !== "active") {
    return inactiveEvidenceContractDecision(
      input,
      "task_contract_not_active",
      evidenceContract
    );
  }

  if (!isActiveExecutionRunStatus(input.executionRun.status)) {
    return inactiveEvidenceContractDecision(
      input,
      "execution_run_terminal",
      evidenceContract
    );
  }

  return {
    status: "active",
    evidenceContract,
    taskContractId: input.taskContract.id,
    harnessPlanId: input.harnessPlan.id,
    executionRunId: input.executionRun.id,
    taskContractStatus: input.taskContract.status,
    executionRunStatus: input.executionRun.status
  };
};
