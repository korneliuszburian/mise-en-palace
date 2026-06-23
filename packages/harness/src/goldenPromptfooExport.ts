import type {
  GoldenCase,
  GoldenTask
} from "@krn/core";

import {
  runGoldenTaskFixtures
} from "./goldenRunner.js";
import type {
  GoldenBehaviorProof
} from "./goldenRunner.js";

export interface PromptfooSnapshotProvider {
  id: "krn-local-proof-snapshot";
  config: {
    mode: "snapshot_only";
    doesNotExecuteModel: true;
    promptfooDependency: "not_required";
  };
}

export interface PromptfooSnapshotPrompt {
  id: "krn-golden-behavior-proof";
  raw: "{{task}}";
}

export type PromptfooSnapshotAssertion = {
  type: "javascript";
  value: string;
};

export interface PromptfooSnapshotTest {
  vars: {
    task: string;
    taskId: string;
    caseId: string;
    title: string;
    expectedOutcome: string;
    expectedSubject: string;
  };
  assert: PromptfooSnapshotAssertion[];
  metadata: {
    behaviorProofStatus: "passed" | "failed" | "missing";
    domains: string[];
    doesNotExecuteModel: true;
    evidenceRefs: string[];
    owner: string;
    protectedFailureModeIds: string[];
    snapshotOnly: true;
    sourceRefs: string[];
  };
}

export interface PromptfooSnapshotConfig {
  description: string;
  prompts: PromptfooSnapshotPrompt[];
  providers: PromptfooSnapshotProvider[];
  tests: PromptfooSnapshotTest[];
  metadata: {
    caseCount: number;
    generatedBy: "krn";
    promptfooDependency: "not_required";
    snapshotOnly: true;
    taskCount: number;
  };
}

export interface ExportGoldenTasksToPromptfooSnapshotInput {
  tasks: readonly GoldenTask[];
  proofs?: readonly GoldenBehaviorProof[];
  description?: string;
}

interface GoldenCaseWithTask {
  task: GoldenTask;
  goldenCase: GoldenCase;
}

const defaultDescription = "KRN golden behavior snapshot";

const byTaskAndCaseId = (left: GoldenCaseWithTask, right: GoldenCaseWithTask): number => {
  const taskOrder = left.task.id.localeCompare(right.task.id);

  if (taskOrder !== 0) {
    return taskOrder;
  }

  return left.goldenCase.id.localeCompare(right.goldenCase.id);
};

const formatTask = (goldenCase: GoldenCase): string => {
  if (typeof goldenCase.input === "string") {
    return goldenCase.input;
  }

  if (
    typeof goldenCase.input === "object" &&
    goldenCase.input !== null &&
    !Array.isArray(goldenCase.input) &&
    "task" in goldenCase.input &&
    typeof goldenCase.input.task === "string"
  ) {
    return goldenCase.input.task;
  }

  return JSON.stringify(goldenCase.input);
};

export const exportGoldenTasksToPromptfooSnapshot = (
  input: ExportGoldenTasksToPromptfooSnapshotInput
): PromptfooSnapshotConfig => {
  const tasks = [...input.tasks].sort((left, right) => left.id.localeCompare(right.id));
  const report = runGoldenTaskFixtures({
    tasks,
    proofs: input.proofs ?? []
  });
  const statusByCaseId = new Map(
    report.caseResults.map((result) => [result.caseId, result.status])
  );
  const cases = tasks
    .flatMap((task) => task.cases.map((goldenCase) => ({ task, goldenCase })))
    .sort(byTaskAndCaseId);

  return {
    description: input.description ?? defaultDescription,
    prompts: [{
      id: "krn-golden-behavior-proof",
      raw: "{{task}}"
    }],
    providers: [{
      id: "krn-local-proof-snapshot",
      config: {
        doesNotExecuteModel: true,
        mode: "snapshot_only",
        promptfooDependency: "not_required"
      }
    }],
    tests: cases.map(({ task, goldenCase }) => ({
      vars: {
        task: formatTask(goldenCase),
        taskId: task.id,
        caseId: goldenCase.id,
        title: goldenCase.title,
        expectedOutcome: goldenCase.expectedBehavior.outcome,
        expectedSubject: goldenCase.expectedBehavior.subject
      },
      assert: [{
        type: "javascript",
        value: `output.includes('${goldenCase.id}')`
      }],
      metadata: {
        behaviorProofStatus: statusByCaseId.get(goldenCase.id) ?? "missing",
        domains: [...task.domains],
        doesNotExecuteModel: true,
        evidenceRefs: [...goldenCase.expectedBehavior.evidenceRefs],
        owner: task.owner,
        protectedFailureModeIds: goldenCase.protectedFailureModes.map((failureMode) =>
          failureMode.id
        ),
        snapshotOnly: true,
        sourceRefs: [...goldenCase.sourceRefs]
      }
    })),
    metadata: {
      caseCount: cases.length,
      generatedBy: "krn",
      promptfooDependency: "not_required",
      snapshotOnly: true,
      taskCount: tasks.length
    }
  };
};
