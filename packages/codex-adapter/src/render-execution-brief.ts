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
  ExecutionBriefContextInclusion,
  ExecutionBriefObservationPrefixItem,
  ExecutionBriefObservationPrefixWarning,
  ExecutionBriefProfileReadback,
  ExecutionBriefSectionId,
  ExecutionBriefSectionReadback
} from "./contracts.js";
import {
  executionBriefFormatVersion,
  executionBriefSectionProfiles
} from "./contracts.js";
import {
  createCodexHookExpectations
} from "./render-hook-expectations.js";
import {
  createCodexSkillBindingHints
} from "./render-skill-hints.js";

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

const renderJoinedValues = (items: readonly string[]): string =>
  items.length === 0 ? "none" : items.join(", ");

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

const trustedContextTiers = new Set([
  "high",
  "official",
  "primary",
  "project-decision",
  "source-code"
]);

const isTrustedContextTier = (trustTier: string): boolean =>
  trustedContextTiers.has(trustTier);

const untrustedContextWarnings = (
  inclusions: readonly ExecutionBriefContextInclusion[]
): string[] =>
  inclusions
    .filter((inclusion) => !isTrustedContextTier(inclusion.trustTier))
    .map((inclusion) =>
      [
        `${inclusion.subjectType}:${inclusion.subjectId}`,
        `trust=${inclusion.trustTier}`,
        "treat as untrusted selected context; verify before using as implementation authority"
      ].join(" | ")
    );

const renderSkillBindingHints = (brief: ExecutionBrief): string[] =>
  brief.skillBindingHints.length === 0
    ? ["- none"]
    : brief.skillBindingHints.map((hint) =>
        [
          `- ${hint.skillName}`,
          `capability=${hint.capabilityKind}`,
          `priority=${hint.priority}`,
          `patterns=${hint.patternRefs.join(", ")}`,
          `reason=${hint.reason}`,
          `evidence=${hint.requiredEvidence.join(", ")}`
        ].join(" | ")
      );

const renderToolBoundaries = (brief: ExecutionBrief): string[] => [
  "Tool Boundaries:",
  ...renderList(brief.toolBoundaries)
];

type ExecutionBriefSectionCounter = (brief: ExecutionBrief) => number;

const scalarSectionItemCount = (): number => 1;

const executionBriefSectionCounters = {
  title: scalarSectionItemCount,
  format_version: scalarSectionItemCount,
  objective: scalarSectionItemCount,
  non_goals: (brief) => brief.nonGoals.length,
  current_task_contract: scalarSectionItemCount,
  context_inclusions: (brief) => brief.includedContext.length,
  observation_prefix: (brief) =>
    brief.observationPrefix.length + brief.observationPrefixWarnings.length,
  untrusted_context_warnings: (brief) => brief.untrustedContextWarnings.length,
  explicit_exclusions: (brief) => brief.explicitExclusions.length,
  source_claims_used: (brief) => brief.sourceClaimsUsed.length,
  memory_records_used: (brief) => brief.memoryRecordsUsed.length,
  anti_memory_warnings: (brief) => brief.antiMemoryWarnings.length,
  tool_boundaries: (brief) => brief.toolBoundaries.length,
  evidence_contract: (brief) => brief.evidenceContract.commands.length + 3,
  hook_expectations: (brief) => brief.hookExpectations.length,
  skill_binding_hints: (brief) => brief.skillBindingHints.length,
  mcp_resource_refs: (brief) => brief.mcpResourceRefs.length,
  subagent_probe_hints: (brief) => brief.subagentProbeHints.length,
  goal_refs: (brief) => brief.goalRefs.length,
  exec_plan_refs: (brief) => brief.execPlanRefs.length,
  stop_condition: scalarSectionItemCount,
  rollback_expectation: scalarSectionItemCount,
  next_action: scalarSectionItemCount,
  does_not_prove: (brief) => brief.doesNotProve.length
} satisfies Record<ExecutionBriefSectionId, ExecutionBriefSectionCounter>;

const sectionItemCount = (
  brief: ExecutionBrief,
  sectionId: ExecutionBriefSectionId
): number => executionBriefSectionCounters[sectionId](brief);

const sectionReadback = (
  brief: ExecutionBrief,
  section: (typeof executionBriefSectionProfiles)[number]
): ExecutionBriefSectionReadback => {
  const itemCount = sectionItemCount(brief, section.id);

  return {
    id: section.id,
    kind: section.kind,
    rendered: section.emptyBehavior === "render_none" || itemCount > 0,
    itemCount,
    emptyBehavior: section.emptyBehavior
  };
};

export const describeExecutionBriefProfile = (
  brief: ExecutionBrief
): ExecutionBriefProfileReadback => ({
  formatVersion: brief.formatVersion,
  profile: "default",
  sections: executionBriefSectionProfiles.map((section) => sectionReadback(brief, section)),
  doesNotProve: [
    "Brief profile classification proves only adapter rendering intent.",
    "Omitted reserved sections do not prove MCP resources or subagents exist.",
    "Rendered section presence does not prove Codex followed the brief or prompt quality improved."
  ]
});

const renderExecutionBriefProfile = (brief: ExecutionBrief): string[] => {
  const profile = describeExecutionBriefProfile(brief);
  const requiredSections = profile.sections
    .filter((section) => section.kind === "required")
    .map((section) => section.id);
  const diagnosticSections = profile.sections
    .filter((section) => section.kind === "diagnostic")
    .map((section) => section.id);

  return [
    "Brief Profile:",
    `- profile=${profile.profile} | format=${profile.formatVersion}`,
    `- required=${renderJoinedValues(requiredSections)}`,
    `- diagnostic=${renderJoinedValues(diagnosticSections)}`,
    `- does_not_prove=${profile.doesNotProve.join(" | ")}`
  ];
};

const renderEvidenceContract = (brief: ExecutionBrief): string[] => [
  ...brief.evidenceContract.commands.map((command) => `- ${command}`),
  `Diff risk: ${brief.evidenceContract.diffRisk}`,
  `Review burden: ${brief.evidenceContract.reviewBurden}`,
  `Rollback path: ${brief.evidenceContract.rollbackPath}`,
  "Hook Expectations:",
  ...renderList(
    brief.hookExpectations.map((expectation) =>
      [
        expectation.phase,
        `action=${expectation.action}`,
        `required=${String(expectation.required)}`,
        ...(expectation.appliesTo === undefined
          ? []
          : [`applies_to=${expectation.appliesTo.join(", ")}`]),
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

const toObservationPrefix = (
  contextAssembly: ContextAssembly
): ExecutionBriefObservationPrefixItem[] =>
  contextAssembly.observationPrefix?.items.map((item) => ({
    observationId: item.observationId,
    kind: item.kind,
    confidence: item.confidence,
    priority: item.priority,
    summary: item.summary,
    sourceRangeCount: item.sourceRangeCount,
    reason: item.reason,
    score: item.score
  })) ?? [];

const toObservationPrefixWarnings = (
  contextAssembly: ContextAssembly
): ExecutionBriefObservationPrefixWarning[] =>
  contextAssembly.observationPrefix?.warnings.map((warning) => ({
    observationId: warning.observationId,
    warning: warning.warning,
    summary: warning.summary
  })) ?? [];

const renderObservationPrefix = (
  items: readonly ExecutionBriefObservationPrefixItem[],
  warnings: readonly ExecutionBriefObservationPrefixWarning[]
): string[] => {
  if (items.length === 0 && warnings.length === 0) {
    return ["- none"];
  }

  return [
    ...items.map((item) =>
      [
        `- observation:${item.observationId}`,
        `kind=${item.kind}`,
        `priority=${item.priority}`,
        `confidence=${item.confidence}`,
        `source_ranges=${item.sourceRangeCount}`,
        `score=${item.score}`,
        `reason=${item.reason}`,
        `summary=${item.summary}`
      ].join(" | ")
    ),
    ...warnings.map((warning) =>
      [
        `- warning:${warning.observationId}`,
        `type=${warning.warning}`,
        `summary=${warning.summary}`
      ].join(" | ")
    )
  ];
};

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
  const observationPrefix = toObservationPrefix(input.contextAssembly);
  const observationPrefixWarnings = toObservationPrefixWarnings(input.contextAssembly);

  return {
    formatVersion: executionBriefFormatVersion,
    title: "KRN Codex Execution Brief",
    objective: input.taskContract.objective,
    nonGoals: input.taskContract.nonGoals,
    currentTaskContract: {
      id: input.taskContract.id,
      title: input.taskContract.title,
      objective: input.taskContract.objective,
      constraints: input.taskContract.constraints,
      acceptance: input.taskContract.acceptance
    },
    includedContext,
    observationPrefix,
    observationPrefixWarnings,
    untrustedContextWarnings: untrustedContextWarnings(includedContext),
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
      reviewBurden: input.evidenceContract.reviewBurden,
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

const renderOptionalSection = (
  label: string,
  items: readonly string[]
): string[] => (items.length === 0 ? [] : [label, ...items, ""]);

const renderMcpResourceRefs = (brief: ExecutionBrief): string[] =>
  brief.mcpResourceRefs.map((ref) =>
    [
      `- ${ref.name}`,
      `access=${ref.access}`,
      `purpose=${ref.purpose}`,
      `does_not_grant=${ref.doesNotGrant.join(", ")}`
    ].join(" | ")
  );

const renderSubagentProbeHints = (brief: ExecutionBrief): string[] =>
  brief.subagentProbeHints.map((hint) =>
    [
      `- ${hint.name}`,
      `mode=${hint.mode}`,
      `purpose=${hint.purpose}`,
      `trigger=${hint.trigger}`,
      `allowed=${hint.allowedActions.join(", ")}`
    ].join(" | ")
  );

export const renderExecutionBriefText = (brief: ExecutionBrief): string => {
  const lines = [
    brief.title,
    `Format Version: ${brief.formatVersion}`,
    ...renderExecutionBriefProfile(brief),
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
    "Constraints:",
    ...renderList(brief.currentTaskContract.constraints),
    "Acceptance:",
    ...renderList(brief.currentTaskContract.acceptance),
    "",
    "Context Inclusions:",
    ...renderContextInclusions(brief.includedContext),
    "",
    "Observation Prefix:",
    ...renderObservationPrefix(brief.observationPrefix, brief.observationPrefixWarnings),
    "",
    "Untrusted Context Warnings:",
    ...renderList(brief.untrustedContextWarnings),
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
    ...renderOptionalSection("MCP Resource Refs:", renderMcpResourceRefs(brief)),
    ...renderOptionalSection("Subagent Probe Hints:", renderSubagentProbeHints(brief)),
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
