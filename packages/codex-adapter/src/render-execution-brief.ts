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

export class ExecutionBriefRenderBudgetError extends Error {
  readonly utf8Bytes: number;
  readonly maxUtf8Bytes: number;

  constructor(utf8Bytes: number, maxUtf8Bytes: number) {
    super(`ExecutionBrief render is ${utf8Bytes} UTF-8 bytes; maximum is ${maxUtf8Bytes}.`);
    this.name = "ExecutionBriefRenderBudgetError";
    this.utf8Bytes = utf8Bytes;
    this.maxUtf8Bytes = maxUtf8Bytes;
  }
}
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
      `- ${item.expectedUse}`,
      `authority=${item.sourceAuthority}`
    ].join(" | ")
  );
};

const renderContextExclusion = (item: ExecutionBriefContextExclusion): string =>
  [
    `- ${item.explanation}`,
    `reason=${item.reason}`,
    `authority=${item.sourceAuthority}`
  ].join(" | ");

const rankingDiagnosticExclusionReasons = new Set([
  "low_context_roi",
  "over_budget"
]);

const directiveContextExclusions = (
  exclusions: readonly ExecutionBriefContextExclusion[]
): readonly ExecutionBriefContextExclusion[] =>
  exclusions.filter((exclusion) => !rankingDiagnosticExclusionReasons.has(exclusion.reason));

const isHistoricalSupersessionDiagnostic = (
  exclusion: ExecutionBriefContextExclusion
): boolean => exclusion.subjectType === "source_claim" && exclusion.reason === "superseded";

const historicalSupersessionKey = (
  exclusion: ExecutionBriefContextExclusion
): string => [exclusion.subjectType, exclusion.reason, exclusion.sourceAuthority].join(":");

const renderDirectiveContextExclusions = (
  exclusions: readonly ExecutionBriefContextExclusion[]
): string[] => {
  const directives = directiveContextExclusions(exclusions);
  const supersessionCounts = new Map<string, number>();

  for (const exclusion of directives) {
    if (isHistoricalSupersessionDiagnostic(exclusion)) {
      const key = historicalSupersessionKey(exclusion);
      supersessionCounts.set(key, (supersessionCounts.get(key) ?? 0) + 1);
    }
  }

  const renderedSupersessionKeys = new Set<string>();

  return directives.flatMap((exclusion) => {
    if (!isHistoricalSupersessionDiagnostic(exclusion)) {
      return [renderContextExclusion(exclusion)];
    }

    const key = historicalSupersessionKey(exclusion);
    if (renderedSupersessionKeys.has(key)) {
      return [];
    }

    renderedSupersessionKeys.add(key);
    const count = supersessionCounts.get(key) ?? 1;
    return [[
      `- ${count} historical source claims are superseded by selected current authority; use the current authority and do not recover predecessor versions.`,
      `reason=${exclusion.reason}`,
      `authority=${exclusion.sourceAuthority}`
    ].join(" | ")];
  });
};

const renderCurrentTaskContract = (brief: ExecutionBrief): string[] => {
  const lines = [
    ...(brief.currentTaskContract.title === brief.objective
      ? []
      : [`- ${brief.currentTaskContract.title}`]),
    ...renderOptionalSection(
      "Constraints:",
      brief.currentTaskContract.constraints.map((item) => `- ${item}`)
    ),
    ...renderOptionalSection(
      "Acceptance:",
      brief.currentTaskContract.acceptance.map((item) => `- ${item}`)
    )
  ];

  return lines.length === 0 ? [] : ["Current Task Contract:", ...lines];
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
  abstention_reasons: (brief) => brief.abstentionReasons.length,
  objective: scalarSectionItemCount,
  non_goals: (brief) => brief.nonGoals.length,
  current_task_contract: (brief) =>
    Number(brief.currentTaskContract.title !== brief.objective) +
    brief.currentTaskContract.constraints.length +
    brief.currentTaskContract.acceptance.length,
  context_inclusions: (brief) => brief.includedContext.length,
  observation_prefix: (brief) =>
    brief.observationPrefix.length + brief.observationPrefixWarnings.length,
  untrusted_context_warnings: (brief) => brief.untrustedContextWarnings.length,
  explicit_exclusions: (brief) => renderDirectiveContextExclusions(brief.explicitExclusions).length,
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
  const utf8Bytes = Buffer.byteLength(renderExecutionBriefTextUnchecked(brief), "utf8");
  const status =
    renderedSections <= executionBriefProfileBudget.maxRenderedSections &&
    renderedItems <= executionBriefProfileBudget.maxRenderedItems &&
    utf8Bytes <= executionBriefProfileBudget.maxUtf8Bytes
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
      utf8Bytes,
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
      `- ${gap.reason}`,
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
  const promotedSourceClaimIds = new Set(packet.taskStandardDecisions.flatMap(
    (standard) => standard.memoryRecordId === undefined ? [] : standard.sourceClaimIds ?? []
  ));
  const includedContext = packet.contextInclusions
    .filter((inclusion) =>
      inclusion.subjectType !== "source_claim" || !promotedSourceClaimIds.has(inclusion.subjectId)
    )
    .map((inclusion) => ({ ...inclusion }));
  const explicitExclusions = packet.contextExclusions.map((exclusion) => ({ ...exclusion }));
  const sourceClaimsSelected = includedContext
    .filter((inclusion) => inclusion.subjectType === "source_claim")
    .map((inclusion) => inclusion.subjectId);
  const memoryRecordsSelected = includedContext
    .filter((inclusion) => inclusion.subjectType === "memory_record")
    .map((inclusion) => inclusion.subjectId);
  const sourceConsensusTimeline = (packet.sourceConsensus.timeline?.entries ?? []).map((entry) =>
    [
      `- ${entry.sourceClaimId}`,
      `state=${entry.state}`,
      `authority_state=${entry.authorityState}`,
      `claim=${entry.claim}`,
      `superseded_by=${entry.supersededBySourceClaimIds.join(",") || "none"}`,
      `supersedes=${entry.supersedesSourceClaimIds.join(",") || "none"}`,
      `supporting_claims=${entry.supportingSourceClaimIds.join(",") || "none"}`,
      `dissenting_claims=${entry.dissentingSourceClaimIds.join(",") || "none"}`,
      `decision_edges=${entry.decisionSupportEdgeIds.join(",") || "none"}`,
      `evidence_refs=${entry.evidenceRefs.join(",") || "none"}`,
      `raw_evidence_refs=${entry.rawEvidenceCitationRefs.join(",") || "none"}`,
      `relation_evidence_gaps=${entry.relationEvidence.flatMap((relation) => relation.evidenceGaps).join(",") || "none"}`,
      `caveats=${entry.caveats.join(";") || "none"}`
    ].join(" | ")
  );
  const memorySupersessionTimeline = (packet.memorySupersessionTimeline?.entries ?? []).map((entry) =>
    [
      `- ${entry.predecessorMemoryRecordId} -> ${entry.replacementMemoryRecordId}`,
      `predecessor_status=${entry.predecessorStatus}`,
      `replacement_status=${entry.replacementStatus}`,
      `reviewer=${entry.transition.reviewer}`,
      `superseded_at=${entry.transition.supersededAt}`,
      `reason=${entry.transition.reason}`,
      `evidence_status=${entry.evidence.status}`,
      `source_claim_ids=${entry.evidence.sourceClaimIds.join(",") || "none"}`,
      `evidence_refs=${entry.evidence.evidenceRefs.join(",") || "none"}`
    ].join(" | ")
  );
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
    ...(packet.sourceConsensus.timeline === undefined
      ? []
      : [packet.sourceConsensus.timeline.doesNotProve]),
    ...(packet.memorySupersessionTimeline === undefined
      ? []
      : [packet.memorySupersessionTimeline.doesNotProve]),
    "Codex executed the work.",
    "Memory was mutated.",
    "Maintenance queue records were processed by a runtime."
  ])];

  return {
    formatVersion: executionBriefFormatVersion,
    abstentionStatus,
    abstentionReasons: [...packet.abstentionScore.reasons],
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
    sourceConsensusTimeline,
    memoryRecordsSelected,
    memorySupersessionTimeline,
    antiMemoryWarnings: antiMemoryWarnings(explicitExclusions),
    evidenceGaps,
    toolBoundaries: [...packet.toolBoundaries],
    evidenceContract,
    stopCondition: abstentionStatus === "abstain"
      ? "Do not execute; the DecisionPacket abstains until its evidence gaps are resolved."
      : abstentionStatus === "weak_context"
        ? "Proceed only with bounded Codex execution while preserving the packet readiness caveats; stop before hidden state mutation."
        : "Proceed with Codex execution within the packet tool and evidence boundaries; stop before hidden state mutation.",
    rollbackExpectation: evidenceContract.rollbackPath,
    nextAction: packet.nextAction,
    doesNotProve
  };
};

const renderOptionalSection = (
  label: string,
  items: readonly string[]
): string[] => (items.length === 0 ? [] : [label, ...items, ""]);

const renderExecutionBriefTextUnchecked = (brief: ExecutionBrief): string => {
  const observationPrefixLines =
    brief.observationPrefix.length === 0 && brief.observationPrefixWarnings.length === 0
      ? []
      : renderObservationPrefix(brief.observationPrefix, brief.observationPrefixWarnings);
  const lines = [
    brief.title,
    `Format Version: ${brief.formatVersion}`,
    `Packet Status: ${brief.abstentionStatus}`,
    ...renderOptionalSection(
      "Packet Readiness Reasons:",
      brief.abstentionReasons.map((reason) => `- ${reason}`)
    ),
    "",
    `Objective: ${brief.objective}`,
    "",
    ...renderOptionalSection("Non-goals:", brief.nonGoals.map((item) => `- ${item}`)),
    ...renderCurrentTaskContract(brief),
    "Context Inclusions:",
    ...renderContextInclusions(brief.includedContext),
    "",
    ...renderOptionalSection("Observation Prefix:", observationPrefixLines),
    ...renderOptionalSection("Untrusted Context Warnings:", brief.untrustedContextWarnings.map((warning) => `- ${warning}`)),
    ...renderOptionalSection(
      "Explicit Exclusions:",
      renderDirectiveContextExclusions(brief.explicitExclusions)
    ),
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

export const renderExecutionBriefText = (brief: ExecutionBrief): string => {
  const rendered = renderExecutionBriefTextUnchecked(brief);
  const utf8Bytes = Buffer.byteLength(rendered, "utf8");

  if (utf8Bytes > executionBriefProfileBudget.maxUtf8Bytes) {
    throw new ExecutionBriefRenderBudgetError(
      utf8Bytes,
      executionBriefProfileBudget.maxUtf8Bytes
    );
  }

  return rendered;
};

export const renderExecutionBrief = (input: RenderExecutionBriefInput): string =>
  renderExecutionBriefText(createExecutionBrief(input));
