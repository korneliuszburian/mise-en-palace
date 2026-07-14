import { describe, expect, it } from "vitest";

import {
  decideEvidenceContractActivation,
  parseEvidenceContract
} from "../evidence-contract.js";
import {
  executionRunStatuses,
  type ExecutionRunStatus
} from "../execution-run.js";
import {
  taskContractStatuses,
  type TaskContractStatus
} from "../task-contract.js";

const evidenceContract = {
  taskContractId: "task-1",
  commands: [{
    command: "pnpm typecheck",
    required: true
  }],
  diffRisk: "medium" as const,
  reviewBurden: "Review the task-bound verification evidence.",
  rollbackPath: "Revert the implementation commit.",
  metadata: {}
};

const activationDecision = (input: {
  taskContractStatus?: TaskContractStatus;
  executionRunStatus?: ExecutionRunStatus;
  contract?: unknown;
  harnessPlanTaskContractId?: string;
  executionRunHarnessPlanId?: string;
}) => decideEvidenceContractActivation({
  evidenceContract: Object.hasOwn(input, "contract") ? input.contract : evidenceContract,
  taskContract: {
    id: "task-1",
    status: input.taskContractStatus ?? "active"
  },
  harnessPlan: {
    id: "plan-1",
    taskContractId: input.harnessPlanTaskContractId ?? "task-1"
  },
  executionRun: {
    id: "run-1",
    harnessPlanId: input.executionRunHarnessPlanId ?? "plan-1",
    status: input.executionRunStatus ?? "running"
  }
});

describe("EvidenceContract activation", () => {
  it("parses a top-level task binding and rejects the legacy metadata-only binding", () => {
    expect(parseEvidenceContract(evidenceContract)).toEqual(evidenceContract);
    expect(parseEvidenceContract({
      ...evidenceContract,
      taskContractId: undefined,
      metadata: {
        taskContractId: "task-1"
      }
    })).toBeUndefined();
  });

  it.each(taskContractStatuses.flatMap((taskContractStatus) =>
    executionRunStatuses.map((executionRunStatus) => ({
      taskContractStatus,
      executionRunStatus
    }))
  ))(
    "classifies task=$taskContractStatus and run=$executionRunStatus",
    ({ taskContractStatus, executionRunStatus }) => {
      const decision = activationDecision({
        taskContractStatus,
        executionRunStatus
      });
      const expectedActive = taskContractStatus === "active" &&
        (executionRunStatus === "planned" || executionRunStatus === "running");

      expect(decision).toMatchObject({
        status: expectedActive ? "active" : "inactive",
        taskContractId: "task-1",
        harnessPlanId: "plan-1",
        executionRunId: "run-1",
        taskContractStatus,
        executionRunStatus
      });

      if (expectedActive) {
        expect(decision).toMatchObject({
          evidenceContract
        });
        expect("reason" in decision).toBe(false);
        return;
      }

      expect(decision).toMatchObject({
        reason: taskContractStatus === "active"
          ? "execution_run_terminal"
          : "task_contract_not_active",
        evidenceContract
      });
    }
  );

  it.each([{
    label: "missing contract",
    contract: undefined,
    reason: "missing_evidence_contract"
  }, {
    label: "missing task binding",
    contract: {
      ...evidenceContract,
      taskContractId: undefined
    },
    reason: "missing_task_contract_binding"
  }, {
    label: "blank task binding",
    contract: {
      ...evidenceContract,
      taskContractId: "  "
    },
    reason: "missing_task_contract_binding"
  }, {
    label: "invalid contract shape",
    contract: {
      ...evidenceContract,
      commands: []
    },
    reason: "invalid_evidence_contract"
  }, {
    label: "wrong contract task binding",
    contract: {
      ...evidenceContract,
      taskContractId: "task-other"
    },
    reason: "task_contract_binding_mismatch"
  }, {
    label: "wrong plan task binding",
    harnessPlanTaskContractId: "task-other",
    reason: "harness_plan_task_contract_mismatch"
  }, {
    label: "wrong run plan binding",
    executionRunHarnessPlanId: "plan-other",
    reason: "execution_run_harness_plan_mismatch"
  }] as const)("fails closed for $label", (testCase) => {
    const decision = activationDecision({
      taskContractStatus: "closed",
      executionRunStatus: "succeeded",
      ...(Object.hasOwn(testCase, "contract") ? { contract: testCase.contract } : {}),
      ...("harnessPlanTaskContractId" in testCase
        ? { harnessPlanTaskContractId: testCase.harnessPlanTaskContractId }
        : {}),
      ...("executionRunHarnessPlanId" in testCase
        ? { executionRunHarnessPlanId: testCase.executionRunHarnessPlanId }
        : {})
    });

    expect(decision).toMatchObject({
      status: "inactive",
      reason: testCase.reason,
      taskContractId: "task-1",
      harnessPlanId: "plan-1",
      executionRunId: "run-1"
    });
  });
});
