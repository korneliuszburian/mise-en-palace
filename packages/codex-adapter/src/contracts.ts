import type {
  ContextAssemblyId,
  ContextSupportingEvidence,
  ContextSubjectType,
  DiffRisk,
  HarnessPlanId,
  IsoTimestamp,
  ObservationConfidence,
  ObservationPriority,
  SourceAuthorityLabel
} from "@krn/core";

export type CodexAdapterPlanStatus = "draft" | "ready" | "superseded";

export const executionBriefFormatVersion = "krn.executionBrief.v1" as const;

export type ExecutionBriefFormatVersion = typeof executionBriefFormatVersion;

export type ExecutionBriefProfileName = "default";

export type ExecutionBriefSectionKind = "required" | "optional";

export type ExecutionBriefSectionEmptyBehavior = "render_none" | "omit_when_empty";

export type ExecutionBriefProfileBudgetStatus = "within_budget" | "over_budget";

export const executionBriefSectionProfiles = [
  { id: "title", kind: "required", emptyBehavior: "render_none" },
  { id: "format_version", kind: "required", emptyBehavior: "render_none" },
  { id: "abstention_reasons", kind: "optional", emptyBehavior: "omit_when_empty" },
  { id: "objective", kind: "required", emptyBehavior: "render_none" },
  { id: "non_goals", kind: "required", emptyBehavior: "render_none" },
  { id: "current_task_contract", kind: "required", emptyBehavior: "render_none" },
  { id: "context_inclusions", kind: "required", emptyBehavior: "render_none" },
  { id: "observation_prefix", kind: "optional", emptyBehavior: "omit_when_empty" },
  { id: "untrusted_context_warnings", kind: "optional", emptyBehavior: "omit_when_empty" },
  { id: "explicit_exclusions", kind: "required", emptyBehavior: "render_none" },
  { id: "anti_memory_warnings", kind: "optional", emptyBehavior: "omit_when_empty" },
  { id: "evidence_gaps", kind: "optional", emptyBehavior: "omit_when_empty" },
  { id: "tool_boundaries", kind: "required", emptyBehavior: "render_none" },
  { id: "evidence_contract", kind: "required", emptyBehavior: "render_none" },
  { id: "stop_condition", kind: "required", emptyBehavior: "render_none" },
  { id: "rollback_expectation", kind: "required", emptyBehavior: "render_none" },
  { id: "next_action", kind: "required", emptyBehavior: "render_none" },
  { id: "does_not_prove", kind: "required", emptyBehavior: "render_none" }
] as const satisfies readonly {
  id: string;
  kind: ExecutionBriefSectionKind;
  emptyBehavior: ExecutionBriefSectionEmptyBehavior;
}[];

export const executionBriefProfileBudget = {
  maxRenderedSections: executionBriefSectionProfiles.length,
  maxRenderedItems: 80,
  maxUtf8Bytes: 32 * 1024
} as const;

export type ExecutionBriefSectionId = (typeof executionBriefSectionProfiles)[number]["id"];

export const executionBriefSectionIds: ExecutionBriefSectionId[] =
  executionBriefSectionProfiles.map((section) => section.id);

export interface ExecutionBriefSectionReadback {
  id: ExecutionBriefSectionId;
  kind: ExecutionBriefSectionKind;
  rendered: boolean;
  itemCount: number;
  emptyBehavior: ExecutionBriefSectionEmptyBehavior;
}

export interface ExecutionBriefProfileReadback {
  formatVersion: ExecutionBriefFormatVersion;
  profile: ExecutionBriefProfileName;
  sections: ExecutionBriefSectionReadback[];
  budget: {
    maxRenderedSections: number;
    maxRenderedItems: number;
    maxUtf8Bytes: number;
    renderedSections: number;
    renderedItems: number;
    utf8Bytes: number;
    status: ExecutionBriefProfileBudgetStatus;
  };
  doesNotProve: string[];
}

export interface ExecutionBriefContextInclusion {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  expectedUse: string;
  sourceAuthority: SourceAuthorityLabel;
  supportingEvidence?: ContextSupportingEvidence | undefined;
}

export interface ExecutionBriefContextExclusion {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  explanation: string;
  sourceAuthority: SourceAuthorityLabel;
}

export interface ExecutionBriefObservationPrefixItem {
  observationId: string;
  kind: string;
  confidence: ObservationConfidence;
  priority: ObservationPriority;
  summary: string;
  sourceRangeCount: number;
  reason: string;
  score: number;
}

export interface ExecutionBriefObservationPrefixWarning {
  observationId: string;
  warning: "contested" | "conflict" | "gap";
  summary: string;
}

export interface ExecutionBriefTaskContract {
  id: string;
  title: string;
  objective: string;
  constraints: string[];
  acceptance: string[];
}

export interface ExecutionBriefEvidenceContract {
  active: boolean;
  commands: string[];
  diffRisk: DiffRisk | "unknown";
  reviewBurden: string;
  rollbackPath: string;
}

export interface ExecutionBriefEvidenceGap {
  id: string;
  reason: string;
  verificationRequired: string;
}

export interface ExecutionBrief {
  formatVersion: ExecutionBriefFormatVersion;
  abstentionStatus: "ready" | "weak_context" | "abstain";
  abstentionReasons: string[];
  title: string;
  objective: string;
  nonGoals: string[];
  currentTaskContract: ExecutionBriefTaskContract;
  includedContext: ExecutionBriefContextInclusion[];
  observationPrefix: ExecutionBriefObservationPrefixItem[];
  observationPrefixWarnings: ExecutionBriefObservationPrefixWarning[];
  untrustedContextWarnings: string[];
  explicitExclusions: ExecutionBriefContextExclusion[];
  sourceClaimsSelected: string[];
  sourceDecisionIds: string[];
  sourceConsensusTimeline: string[];
  memoryRecordsSelected: string[];
  memorySupersessionTimeline: string[];
  antiMemoryWarnings: string[];
  evidenceGaps: ExecutionBriefEvidenceGap[];
  toolBoundaries: string[];
  evidenceContract: ExecutionBriefEvidenceContract;
  stopCondition: string;
  rollbackExpectation: string;
  nextAction: string;
  doesNotProve: string[];
}

export interface CodexAdapterPlan {
  id: string;
  harnessPlanId: HarnessPlanId;
  contextAssemblyId?: ContextAssemblyId;
  status: CodexAdapterPlanStatus;
  executionBrief: ExecutionBrief;
  createdAt: IsoTimestamp;
  metadata: Record<string, unknown>;
}
