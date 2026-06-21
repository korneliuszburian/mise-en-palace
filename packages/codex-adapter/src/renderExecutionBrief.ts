import type {
  CapabilityPlan,
  ContextAssembly,
  HarnessPlan,
  TaskContract
} from "@krn/core";
import type {
  EvidenceContract
} from "@krn/harness";
import {
  renderHookExpectations
} from "./renderHookExpectations.js";
import {
  renderSkillHints
} from "./renderSkillHints.js";

export interface RenderExecutionBriefInput {
  taskContract: TaskContract;
  harnessPlan: HarnessPlan;
  contextAssembly: ContextAssembly;
  capabilityPlan: CapabilityPlan;
  evidenceContract: EvidenceContract;
  nextAction: string;
  goalReference?: string;
  execPlanReference?: string;
}

const renderList = (items: readonly string[]): string[] =>
  items.length === 0 ? ["- none"] : items.map((item) => `- ${item}`);

const renderContextInclusions = (contextAssembly: ContextAssembly): string[] => {
  if (contextAssembly.inclusions.length === 0) {
    return ["- none"];
  }

  return contextAssembly.inclusions.map((item) =>
    [
      `- ${item.subjectType}:${item.subjectId}`,
      `reason=${item.reason}`,
      `expected_use=${item.expectedUse}`,
      `trust=${item.trustTier}`
    ].join(" | ")
  );
};

const renderContextExclusions = (contextAssembly: ContextAssembly): string[] => {
  if (contextAssembly.exclusions.length === 0) {
    return ["- none"];
  }

  return contextAssembly.exclusions.map((item) =>
    [
      `- ${item.subjectType}:${item.subjectId}`,
      `reason=${item.reason}`,
      `explanation=${item.explanation}`,
      `trust=${item.trustTier}`
    ].join(" | ")
  );
};

const renderCapabilityPlan = (capabilityPlan: CapabilityPlan): string[] => [
  ...capabilityPlan.requirements.map((requirement) =>
    [
      `- ${requirement.kind}`,
      `reason=${requirement.reason}`,
      `evidence=${requirement.requiredEvidence.join(", ")}`
    ].join(" | ")
  ),
  "Tool Boundaries:",
  ...renderList(capabilityPlan.toolBoundaries),
  "Skill Hints:",
  ...renderList(renderSkillHints(capabilityPlan))
];

const renderEvidenceContract = (evidenceContract: EvidenceContract): string[] => [
  ...evidenceContract.commands.map((command) =>
    `- ${command.command}${command.required ? " (required)" : ""}`
  ),
  `Diff risk: ${evidenceContract.diffRisk}`,
  `Review burden: ${evidenceContract.reviewBurden}`,
  `Rollback path: ${evidenceContract.rollbackPath}`,
  "Hook Expectations:",
  ...renderList(renderHookExpectations(evidenceContract))
];

export const renderExecutionBrief = (input: RenderExecutionBriefInput): string => {
  const lines = [
    "KRN Codex Execution Brief",
    "",
    `Task: ${input.taskContract.title}`,
    `Objective: ${input.taskContract.objective}`,
    `Harness Plan: ${input.harnessPlan.summary}`,
    "",
    "Constraints:",
    ...renderList(input.taskContract.constraints),
    "",
    "Non-goals:",
    ...renderList(input.taskContract.nonGoals),
    "",
    "Acceptance:",
    ...renderList(input.taskContract.acceptance),
    "",
    "Context Inclusions:",
    ...renderContextInclusions(input.contextAssembly),
    "",
    "Context Exclusions:",
    ...renderContextExclusions(input.contextAssembly),
    "",
    "Capability Plan:",
    ...renderCapabilityPlan(input.capabilityPlan),
    "",
    "Evidence Contract:",
    ...renderEvidenceContract(input.evidenceContract),
    "",
    `Next Action: ${input.nextAction}`
  ];

  if (input.goalReference !== undefined) {
    lines.push("", "Goal Reference:", input.goalReference);
  }

  if (input.execPlanReference !== undefined) {
    lines.push("", "ExecPlan Reference:", input.execPlanReference);
  }

  return `${lines.join("\n")}\n`;
};
