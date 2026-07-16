import {
  decisionPacketMissingActiveEvidenceContractGapId
} from "@krn/core";
import type {
  DecisionPacket
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
  packet: DecisionPacket;
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
  source_claims_selected: (brief) => brief.sourceClaimsSelected.length,
  source_decision_ids: (brief) => brief.sourceDecisionIds.length,
  memory_records_selected: (brief) => brief.memoryRecordsSelected.length,
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

const missingEvidenceContractGap: ExecutionBriefEvidenceGap = {
  id: decisionPacketMissingActiveEvidenceContractGapId,
  reason: "The DecisionPacket has no active task-bound EvidenceContract.",
  verificationRequired: "Bind a current EvidenceContract before treating any command as required verification."
};

export const createExecutionBrief = (input: RenderExecutionBriefInput): ExecutionBrief => {
  const { packet } = input;
  const abstentionStatus = packet.evidenceContract === undefined
    ? "abstain"
    : packet.abstentionScore.status;
  const includedContext = packet.contextInclusions.map((inclusion) => ({ ...inclusion }));
  const explicitExclusions = packet.contextExclusions.map((exclusion) => ({ ...exclusion }));
  const sourceClaimsSelected = includedContext
    .filter((inclusion) => inclusion.subjectType === "source_claim")
    .map((inclusion) => inclusion.subjectId);
  const memoryRecordsSelected = includedContext
    .filter((inclusion) => inclusion.subjectType === "memory_record")
    .map((inclusion) => inclusion.subjectId);
  const evidenceContract = packet.evidenceContract === undefined
    ? {
        active: false,
        commands: [],
        diffRisk: "unknown" as const,
        reviewBurden: "unknown: no active EvidenceContract was supplied.",
        rollbackPath: "unknown: no active EvidenceContract was supplied."
      }
    : {
        active: true,
        commands: packet.evidenceContract.commands.map((command) =>
          command.required ? `${command.command} (required)` : command.command
        ),
        diffRisk: packet.evidenceContract.diffRisk,
        reviewBurden: packet.evidenceContract.reviewBurden,
        rollbackPath: packet.evidenceContract.rollbackPath
      };
  const evidenceGaps = [
    ...packet.evidenceGaps,
    ...(packet.evidenceContract === undefined && !packet.evidenceGaps.some(
      (gap) => gap.id === decisionPacketMissingActiveEvidenceContractGapId
    )
      ? [missingEvidenceContractGap]
      : [])
  ];
  const doesNotProve = [...new Set([
    ...packet.doesNotProve,
    ...packet.nonProofs,
    "Codex executed the work.",
    "Memory was mutated.",
    "Maintenance queue records were processed by a runtime."
  ])];

  return {
    formatVersion: executionBriefFormatVersion,
    abstentionStatus,
    title: "KRN Codex Execution Brief",
    objective: packet.task.objective,
    nonGoals: [...packet.task.nonGoals],
    currentTaskContract: {
      id: packet.task.id,
      title: packet.task.title,
      objective: packet.task.objective,
      constraints: [...packet.task.constraints],
      acceptance: [...packet.task.acceptance]
    },
    includedContext,
    observationPrefix: [],
    observationPrefixWarnings: [],
    untrustedContextWarnings: untrustedContextWarnings(includedContext),
    explicitExclusions,
    sourceClaimsSelected,
    sourceDecisionIds: [...packet.sourceDecisionIds],
    memoryRecordsSelected,
    antiMemoryWarnings: antiMemoryWarnings(explicitExclusions),
    evidenceGaps,
    toolBoundaries: [...packet.toolBoundaries],
    evidenceContract,
    stopCondition: abstentionStatus === "abstain"
      ? "Do not execute; the DecisionPacket abstains until its evidence gaps are resolved."
      : "Stop before Codex execution or hidden state mutation.",
    rollbackExpectation: evidenceContract.rollbackPath,
    nextAction: packet.nextAction,
    doesNotProve
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
    `Packet Status: ${brief.abstentionStatus}`,
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
    ...renderOptionalSection("Source Claims Selected:", brief.sourceClaimsSelected.map((claim) => `- ${claim}`)),
    ...renderOptionalSection("Canonical SourceDecision IDs:", brief.sourceDecisionIds.map((id) => `- ${id}`)),
    ...renderOptionalSection("Memory Records Selected:", brief.memoryRecordsSelected.map((record) => `- ${record}`)),
    ...renderOptionalSection("Anti-memory Warnings:", brief.antiMemoryWarnings.map((warning) => `- ${warning}`)),
    ...renderOptionalSection("Evidence Gaps:", renderEvidenceGaps(brief.evidenceGaps)),
    ...renderToolBoundaries(brief),
    "",
    "Evidence Contract:",
    `Active: ${brief.evidenceContract.active ? "yes" : "no (unverified)"}`,
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
