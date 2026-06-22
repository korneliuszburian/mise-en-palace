import type {
  CapabilityPlan,
  ContextAssembly,
  HarnessPlan,
  TaskContract
} from "@krn/core";
import type {
  EvidenceContract
} from "@krn/harness";
import type {
  CodexExecPlanRef,
  CodexGoalRef,
  ExecutionBrief,
  ExecutionBriefContextExclusion,
  ExecutionBriefContextInclusion
} from "./contracts.js";
import {
  createCodexHookExpectations
} from "./renderHookExpectations.js";
import {
  createCodexSkillBindingHints
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

const renderContextInclusions = (
  inclusions: readonly ExecutionBriefContextInclusion[]
): string[] => {
  if (inclusions.length === 0) {
    return ["- none"];
  }

  return inclusions.map((item) =>
    [
      `- ${item.subjectType}:${item.subjectId}`,
      `reason=${item.reason}`,
      `expected_use=${item.expectedUse}`,
      `trust=${item.trustTier}`
    ].join(" | ")
  );
};

const renderContextExclusions = (
  exclusions: readonly ExecutionBriefContextExclusion[]
): string[] => {
  if (exclusions.length === 0) {
    return ["- none"];
  }

  return exclusions.map((item) =>
    [
      `- ${item.subjectType}:${item.subjectId}`,
      `reason=${item.reason}`,
      `explanation=${item.explanation}`,
      `trust=${item.trustTier}`
    ].join(" | ")
  );
};

const renderSkillBindingHints = (brief: ExecutionBrief): string[] =>
  brief.skillBindingHints.length === 0
    ? ["- none"]
    : brief.skillBindingHints.map((hint) =>
        [
          `- ${hint.skillName}`,
          `capability=${hint.capabilityKind}`,
          `priority=${hint.priority}`,
          `reason=${hint.reason}`,
          `evidence=${hint.requiredEvidence.join(", ")}`
        ].join(" | ")
      );

const renderToolBoundaries = (brief: ExecutionBrief): string[] => [
  "Tool Boundaries:",
  ...renderList(brief.toolBoundaries)
];

const renderEvidenceContract = (brief: ExecutionBrief): string[] => [
  ...brief.evidenceContract.commands.map((command) => `- ${command}`),
  `Diff risk: ${brief.evidenceContract.diffRisk}`,
  `Rollback path: ${brief.evidenceContract.rollbackPath}`,
  "Hook Expectations:",
  ...renderList(
    brief.hookExpectations.map((expectation) =>
      [
        expectation.phase,
        `action=${expectation.action}`,
        `required=${String(expectation.required)}`,
        `reason=${expectation.reason}`
      ].join(" | ")
    )
  )
];

const toGoalRef = (goalReference: string | undefined): CodexGoalRef[] =>
  goalReference === undefined
    ? []
    : [
        {
          source: goalReference,
          objective: goalReference,
          status: "active"
        }
      ];

const toExecPlanRef = (execPlanReference: string | undefined): CodexExecPlanRef[] =>
  execPlanReference === undefined
    ? []
    : [
        {
          source: execPlanReference,
          section: execPlanReference,
          status: "active"
        }
      ];

const toContextInclusions = (
  contextAssembly: ContextAssembly
): ExecutionBriefContextInclusion[] =>
  contextAssembly.inclusions.map((inclusion) => ({
    subjectType: inclusion.subjectType,
    subjectId: inclusion.subjectId,
    reason: inclusion.reason,
    expectedUse: inclusion.expectedUse,
    trustTier: inclusion.trustTier
  }));

const toContextExclusions = (
  contextAssembly: ContextAssembly
): ExecutionBriefContextExclusion[] =>
  contextAssembly.exclusions.map((exclusion) => ({
    subjectType: exclusion.subjectType,
    subjectId: exclusion.subjectId,
    reason: exclusion.reason,
    explanation: exclusion.explanation,
    trustTier: exclusion.trustTier
  }));

const sourceClaimsUsed = (
  inclusions: readonly ExecutionBriefContextInclusion[]
): string[] =>
  inclusions
    .filter((inclusion) => inclusion.subjectType === "source_claim")
    .map((inclusion) => inclusion.subjectId);

const memoryRecordsUsed = (
  inclusions: readonly ExecutionBriefContextInclusion[]
): string[] =>
  inclusions
    .filter((inclusion) => inclusion.subjectType === "memory_record")
    .map((inclusion) => inclusion.subjectId);

const antiMemoryWarnings = (
  exclusions: readonly ExecutionBriefContextExclusion[]
): string[] =>
  exclusions
    .filter((exclusion) => exclusion.subjectType === "anti_memory_record")
    .map((exclusion) =>
      [
        `${exclusion.subjectType}:${exclusion.subjectId}`,
        exclusion.reason,
        exclusion.explanation
      ].join(" | ")
    );

export const createExecutionBrief = (input: RenderExecutionBriefInput): ExecutionBrief => {
  const includedContext = toContextInclusions(input.contextAssembly);
  const explicitExclusions = toContextExclusions(input.contextAssembly);

  return {
    title: "KRN Codex Execution Brief",
    objective: input.taskContract.objective,
    nonGoals: input.taskContract.nonGoals,
    currentTaskContract: {
      id: input.taskContract.id,
      title: input.taskContract.title,
      objective: input.taskContract.objective
    },
    includedContext,
    explicitExclusions,
    sourceClaimsUsed: sourceClaimsUsed(includedContext),
    memoryRecordsUsed: memoryRecordsUsed(includedContext),
    antiMemoryWarnings: antiMemoryWarnings(explicitExclusions),
    toolBoundaries: input.capabilityPlan.toolBoundaries,
    evidenceContract: {
      commands: input.evidenceContract.commands.map((command) =>
        command.required ? `${command.command} (required)` : command.command
      ),
      diffRisk: input.evidenceContract.diffRisk,
      rollbackPath: input.evidenceContract.rollbackPath
    },
    hookExpectations: createCodexHookExpectations(input.evidenceContract),
    skillBindingHints: createCodexSkillBindingHints(input.capabilityPlan),
    mcpResourceRefs: [],
    goalRefs: toGoalRef(input.goalReference),
    execPlanRefs: toExecPlanRef(input.execPlanReference),
    subagentProbeHints: [],
    stopCondition: "Stop before Codex execution or hidden state mutation.",
    rollbackExpectation: input.evidenceContract.rollbackPath,
    nextAction: input.nextAction,
    doesNotProve: [
      "Codex executed the work.",
      "MCP resources exist.",
      "Memory was mutated.",
      "Worker jobs executed."
    ]
  };
};

const renderRefs = (
  label: string,
  refs: readonly { source: string; status: string; objective?: string; section?: string }[]
): string[] =>
  refs.length === 0
    ? [label, "- none"]
    : [
        label,
        ...refs.map((ref) =>
          [
            `- ${ref.source}`,
            ...(ref.objective === undefined ? [] : [`objective=${ref.objective}`]),
            ...(ref.section === undefined ? [] : [`section=${ref.section}`]),
            `status=${ref.status}`
          ].join(" | ")
        )
      ];

export const renderExecutionBriefText = (brief: ExecutionBrief): string => {
  const lines = [
    brief.title,
    "",
    `Objective: ${brief.objective}`,
    "",
    "Non-goals:",
    ...renderList(brief.nonGoals),
    "",
    "Current Task Contract:",
    `- id=${brief.currentTaskContract.id}`,
    `- title=${brief.currentTaskContract.title}`,
    `- objective=${brief.currentTaskContract.objective}`,
    "",
    "Context Inclusions:",
    ...renderContextInclusions(brief.includedContext),
    "",
    "Explicit Exclusions:",
    ...renderContextExclusions(brief.explicitExclusions),
    "",
    "Source Claims Used:",
    ...renderList(brief.sourceClaimsUsed),
    "",
    "Memory Records Used:",
    ...renderList(brief.memoryRecordsUsed),
    "",
    "Anti-memory Warnings:",
    ...renderList(brief.antiMemoryWarnings),
    "",
    ...renderToolBoundaries(brief),
    "",
    "Evidence Contract:",
    ...renderEvidenceContract(brief),
    "",
    "Skill Binding Hints:",
    ...renderSkillBindingHints(brief),
    "",
    "MCP Resource Refs:",
    ...renderList(
      brief.mcpResourceRefs.map((ref) =>
        [
          ref.name,
          `access=${ref.access}`,
          `purpose=${ref.purpose}`,
          `does_not_grant=${ref.doesNotGrant.join(", ")}`
        ].join(" | ")
      )
    ),
    "",
    "Subagent Probe Hints:",
    ...renderList(
      brief.subagentProbeHints.map((hint) =>
        [
          hint.name,
          `mode=${hint.mode}`,
          `purpose=${hint.purpose}`,
          `trigger=${hint.trigger}`,
          `allowed=${hint.allowedActions.join(", ")}`
        ].join(" | ")
      )
    ),
    "",
    ...renderRefs("Goal References:", brief.goalRefs),
    "",
    ...renderRefs("ExecPlan References:", brief.execPlanRefs),
    "",
    `Stop Condition: ${brief.stopCondition}`,
    `Rollback Expectation: ${brief.rollbackExpectation}`,
    `Next Action: ${brief.nextAction}`,
    "",
    "What This Does Not Prove:",
    ...renderList(brief.doesNotProve)
  ];

  return `${lines.join("\n")}\n`;
};

export const renderExecutionBrief = (input: RenderExecutionBriefInput): string =>
  renderExecutionBriefText(createExecutionBrief(input));
