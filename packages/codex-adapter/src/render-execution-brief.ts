import type {
  CapabilityPlan,
  ContextAssembly,
  EvidenceContract,
  TaskContract
} from "@krn/core";
import type {
  ExecutionBrief,
  ExecutionBriefContextExclusion,
  ExecutionBriefContextInclusion,
  ExecutionBriefEvidenceGap,
  ExecutionBriefObservationPrefixItem,
  ExecutionBriefObservationPrefixWarning,
  ExecutionBriefProfileReadback,
  ExecutionBriefSectionId,
  ExecutionBriefSectionReadback
} from "./contracts.js";
import {
  executionBriefProfileBudget,
  executionBriefFormatVersion,
  executionBriefSectionProfiles
} from "./contracts.js";
export interface RenderExecutionBriefInput {
  taskContract: TaskContract;
  contextAssembly: ContextAssembly;
  capabilityPlan: CapabilityPlan;
  evidenceContract: EvidenceContract;
  nextAction: string;
  evidenceGaps?: readonly ExecutionBriefEvidenceGap[];
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
      `authority=${item.sourceAuthority}`
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
      `authority=${item.sourceAuthority}`
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

const isTrustedContextTier = (sourceAuthority: string): boolean =>
  trustedContextTiers.has(sourceAuthority);

const untrustedContextWarnings = (
  inclusions: readonly ExecutionBriefContextInclusion[]
): string[] =>
  inclusions
    .filter((inclusion) => !isTrustedContextTier(inclusion.sourceAuthority))
    .map((inclusion) =>
      [
        `${inclusion.subjectType}:${inclusion.subjectId}`,
        `authority=${inclusion.sourceAuthority}`,
        "treat as untrusted selected context; verify before using as implementation authority"
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
  evidence_gaps: (brief) => brief.evidenceGaps.length,
  tool_boundaries: (brief) => brief.toolBoundaries.length,
  evidence_contract: (brief) => brief.evidenceContract.commands.length + 3,
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
): ExecutionBriefProfileReadback => {
  const sections = executionBriefSectionProfiles.map((section) => sectionReadback(brief, section));
  const renderedSections = sections.filter((section) => section.rendered).length;
  const renderedItems = sections.reduce((sum, section) =>
    section.rendered ? sum + section.itemCount : sum, 0);
  const status =
    renderedSections <= executionBriefProfileBudget.maxRenderedSections &&
    renderedItems <= executionBriefProfileBudget.maxRenderedItems
      ? "within_budget"
      : "over_budget";

  return {
    formatVersion: brief.formatVersion,
    profile: "default",
    sections,
    budget: {
      ...executionBriefProfileBudget,
      renderedSections,
      renderedItems,
      status
    },
    doesNotProve: [
      "Brief profile classification proves only adapter rendering intent.",
      "Omitted optional sections do not prove their underlying resources do not exist.",
      "Rendered section presence does not prove Codex followed the brief or prompt quality improved."
    ]
  };
};

const renderEvidenceContract = (brief: ExecutionBrief): string[] => [
  ...brief.evidenceContract.commands.map((command) => `- ${command}`),
  `Diff risk: ${brief.evidenceContract.diffRisk}`,
  `Review burden: ${brief.evidenceContract.reviewBurden}`,
  `Rollback path: ${brief.evidenceContract.rollbackPath}`
];

const toContextInclusions = (
  contextAssembly: ContextAssembly
): ExecutionBriefContextInclusion[] =>
  contextAssembly.inclusions.map((inclusion) => ({
    subjectType: inclusion.subjectType,
    subjectId: inclusion.subjectId,
    reason: inclusion.reason,
    expectedUse: inclusion.expectedUse,
    sourceAuthority: inclusion.sourceAuthority
  }));

const toContextExclusions = (
  contextAssembly: ContextAssembly
): ExecutionBriefContextExclusion[] =>
  contextAssembly.exclusions.map((exclusion) => ({
    subjectType: exclusion.subjectType,
    subjectId: exclusion.subjectId,
    reason: exclusion.reason,
    explanation: exclusion.explanation,
    sourceAuthority: exclusion.sourceAuthority
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

const renderEvidenceGaps = (
  evidenceGaps: readonly ExecutionBriefEvidenceGap[]
): string[] =>
  evidenceGaps.map((gap) =>
    [
      `- ${gap.id}`,
      `reason=${gap.reason}`,
      `verification_required=${gap.verificationRequired}`
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
    evidenceGaps: [...(input.evidenceGaps ?? [])],
    toolBoundaries: input.capabilityPlan.toolBoundaries,
    evidenceContract: {
      commands: input.evidenceContract.commands.map((command) =>
        command.required ? `${command.command} (required)` : command.command
      ),
      diffRisk: input.evidenceContract.diffRisk,
      reviewBurden: input.evidenceContract.reviewBurden,
      rollbackPath: input.evidenceContract.rollbackPath
    },
    stopCondition: "Stop before Codex execution or hidden state mutation.",
    rollbackExpectation: input.evidenceContract.rollbackPath,
    nextAction: input.nextAction,
    doesNotProve: [
      "Codex executed the work.",
      "Memory was mutated.",
      "Maintenance queue records were processed by a runtime."
    ]
  };
};

const renderOptionalSection = (
  label: string,
  items: readonly string[]
): string[] => (items.length === 0 ? [] : [label, ...items, ""]);

export const renderExecutionBriefText = (brief: ExecutionBrief): string => {
  const observationPrefixLines =
    brief.observationPrefix.length === 0 && brief.observationPrefixWarnings.length === 0
      ? []
      : renderObservationPrefix(brief.observationPrefix, brief.observationPrefixWarnings);
  const lines = [
    brief.title,
    `Format Version: ${brief.formatVersion}`,
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
    ...renderOptionalSection("Observation Prefix:", observationPrefixLines),
    ...renderOptionalSection("Untrusted Context Warnings:", brief.untrustedContextWarnings.map((warning) => `- ${warning}`)),
    "Explicit Exclusions:",
    ...renderContextExclusions(brief.explicitExclusions),
    "",
    ...renderOptionalSection("Source Claims Used:", brief.sourceClaimsUsed.map((claim) => `- ${claim}`)),
    ...renderOptionalSection("Memory Records Used:", brief.memoryRecordsUsed.map((record) => `- ${record}`)),
    ...renderOptionalSection("Anti-memory Warnings:", brief.antiMemoryWarnings.map((warning) => `- ${warning}`)),
    ...renderOptionalSection("Evidence Gaps:", renderEvidenceGaps(brief.evidenceGaps)),
    ...renderToolBoundaries(brief),
    "",
    "Evidence Contract:",
    ...renderEvidenceContract(brief),
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
