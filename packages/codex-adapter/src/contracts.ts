import type {
  ContextAssemblyId,
  ContextSubjectType,
  DiffRisk,
  HarnessPlanId,
  IsoTimestamp,
  ObservationConfidence,
  ObservationPriority,
  SourceTrustTier
} from "@krn/core";

export type CodexAdapterPlanStatus = "draft" | "ready" | "superseded";

export const codexHookPhases = [
  "SessionStart",
  "PreToolUse",
  "PostToolUse",
  "PreCompact",
  "Stop"
] as const;

export type CodexHookPhase = (typeof codexHookPhases)[number];

export type CodexHookAction =
  | "inject_pointer"
  | "warn_or_deny"
  | "record_signal"
  | "require_handoff"
  | "suggest_evidence_capture";

export interface CodexHookExpectation {
  phase: CodexHookPhase;
  action: CodexHookAction;
  reason: string;
  required: boolean;
  appliesTo?: string[];
}

export interface CodexHookExpectationProjection {
  title: string;
  expectations: CodexHookExpectation[];
  rules: string[];
  doesNotDo: string[];
}

export type CodexReferenceStatus = "active" | "planned" | "superseded";

export const executionBriefFormatVersion = "krn.executionBrief.v1" as const;

export type ExecutionBriefFormatVersion = typeof executionBriefFormatVersion;

export type ExecutionBriefProfileName = "default";

export type ExecutionBriefSectionKind = "required" | "diagnostic" | "reserved";

export type ExecutionBriefSectionEmptyBehavior = "render_none" | "omit_when_empty";

export type ExecutionBriefProfileBudgetStatus = "within_budget" | "over_budget";

export const executionBriefProfileBudget = {
  maxRenderedSections: 19,
  maxRenderedItems: 80
} as const;

export const executionBriefSectionProfiles = [
  { id: "title", kind: "required", emptyBehavior: "render_none" },
  { id: "format_version", kind: "required", emptyBehavior: "render_none" },
  { id: "objective", kind: "required", emptyBehavior: "render_none" },
  { id: "non_goals", kind: "required", emptyBehavior: "render_none" },
  { id: "current_task_contract", kind: "required", emptyBehavior: "render_none" },
  { id: "context_inclusions", kind: "required", emptyBehavior: "render_none" },
  { id: "observation_prefix", kind: "diagnostic", emptyBehavior: "omit_when_empty" },
  { id: "untrusted_context_warnings", kind: "diagnostic", emptyBehavior: "omit_when_empty" },
  { id: "explicit_exclusions", kind: "required", emptyBehavior: "render_none" },
  { id: "source_claims_used", kind: "diagnostic", emptyBehavior: "omit_when_empty" },
  { id: "memory_records_used", kind: "diagnostic", emptyBehavior: "omit_when_empty" },
  { id: "anti_memory_warnings", kind: "diagnostic", emptyBehavior: "omit_when_empty" },
  { id: "tool_boundaries", kind: "required", emptyBehavior: "render_none" },
  { id: "evidence_contract", kind: "required", emptyBehavior: "render_none" },
  { id: "goal_refs", kind: "diagnostic", emptyBehavior: "omit_when_empty" },
  { id: "exec_plan_refs", kind: "diagnostic", emptyBehavior: "omit_when_empty" },
  { id: "stop_condition", kind: "required", emptyBehavior: "render_none" },
  { id: "rollback_expectation", kind: "required", emptyBehavior: "render_none" },
  { id: "next_action", kind: "required", emptyBehavior: "render_none" },
  { id: "does_not_prove", kind: "required", emptyBehavior: "render_none" }
] as const satisfies readonly {
  id: string;
  kind: ExecutionBriefSectionKind;
  emptyBehavior: ExecutionBriefSectionEmptyBehavior;
}[];

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
    renderedSections: number;
    renderedItems: number;
    status: ExecutionBriefProfileBudgetStatus;
  };
  doesNotProve: string[];
}

export interface CodexGoalRef {
  source: string;
  objective: string;
  status: CodexReferenceStatus;
}

export interface CodexExecPlanRef {
  source: string;
  section: string;
  status: CodexReferenceStatus;
}

export interface ExecutionBriefContextInclusion {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  expectedUse: string;
  trustTier: SourceTrustTier;
}

export interface ExecutionBriefContextExclusion {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  explanation: string;
  trustTier: SourceTrustTier;
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
  commands: string[];
  diffRisk: DiffRisk;
  reviewBurden: string;
  rollbackPath: string;
}

export interface ExecutionBrief {
  formatVersion: ExecutionBriefFormatVersion;
  title: string;
  objective: string;
  nonGoals: string[];
  currentTaskContract: ExecutionBriefTaskContract;
  includedContext: ExecutionBriefContextInclusion[];
  observationPrefix: ExecutionBriefObservationPrefixItem[];
  observationPrefixWarnings: ExecutionBriefObservationPrefixWarning[];
  untrustedContextWarnings: string[];
  explicitExclusions: ExecutionBriefContextExclusion[];
  sourceClaimsUsed: string[];
  memoryRecordsUsed: string[];
  antiMemoryWarnings: string[];
  toolBoundaries: string[];
  evidenceContract: ExecutionBriefEvidenceContract;
  goalRefs: CodexGoalRef[];
  execPlanRefs: CodexExecPlanRef[];
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
