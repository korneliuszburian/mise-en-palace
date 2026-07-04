import type {
  CapabilityRequirementKind,
  ContextAssemblyId,
  ContextSubjectType,
  DiffRisk,
  HarnessPlanId,
  IsoTimestamp,
  SourceTrustTier
} from "@krn/core";

export type CodexAdapterPlanStatus = "draft" | "ready" | "superseded";

export type CodexSkillBindingPriority = "required" | "recommended";

export type CodexSkillBindingSource = "capability_plan" | "operator";

export interface CodexSkillBindingHint {
  skillName: string;
  capabilityKind: CapabilityRequirementKind;
  reason: string;
  requiredEvidence: string[];
  patternRefs: string[];
  priority: CodexSkillBindingPriority;
  source: CodexSkillBindingSource;
}

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

export type CodexMcpResourceAccess = "read_only" | "future_reference";

export interface CodexMcpResourceRef {
  name: string;
  purpose: string;
  access: CodexMcpResourceAccess;
  uri?: string;
  doesNotGrant: string[];
}

export type CodexReferenceStatus = "active" | "planned" | "superseded";

export const executionBriefFormatVersion = "krn.executionBrief.v1" as const;

export type ExecutionBriefFormatVersion = typeof executionBriefFormatVersion;

export type ExecutionBriefProfileName = "default";

export type ExecutionBriefSectionKind = "required" | "diagnostic" | "reserved";

export type ExecutionBriefSectionEmptyBehavior = "render_none" | "omit_when_empty";

export const executionBriefSectionProfiles = [
  { id: "title", kind: "required", emptyBehavior: "render_none" },
  { id: "format_version", kind: "required", emptyBehavior: "render_none" },
  { id: "objective", kind: "required", emptyBehavior: "render_none" },
  { id: "non_goals", kind: "required", emptyBehavior: "render_none" },
  { id: "current_task_contract", kind: "required", emptyBehavior: "render_none" },
  { id: "context_inclusions", kind: "required", emptyBehavior: "render_none" },
  { id: "untrusted_context_warnings", kind: "diagnostic", emptyBehavior: "render_none" },
  { id: "explicit_exclusions", kind: "required", emptyBehavior: "render_none" },
  { id: "source_claims_used", kind: "diagnostic", emptyBehavior: "render_none" },
  { id: "memory_records_used", kind: "diagnostic", emptyBehavior: "render_none" },
  { id: "anti_memory_warnings", kind: "diagnostic", emptyBehavior: "render_none" },
  { id: "tool_boundaries", kind: "required", emptyBehavior: "render_none" },
  { id: "evidence_contract", kind: "required", emptyBehavior: "render_none" },
  { id: "hook_expectations", kind: "required", emptyBehavior: "render_none" },
  { id: "skill_binding_hints", kind: "required", emptyBehavior: "render_none" },
  { id: "mcp_resource_refs", kind: "reserved", emptyBehavior: "omit_when_empty" },
  { id: "subagent_probe_hints", kind: "reserved", emptyBehavior: "omit_when_empty" },
  { id: "goal_refs", kind: "diagnostic", emptyBehavior: "render_none" },
  { id: "exec_plan_refs", kind: "diagnostic", emptyBehavior: "render_none" },
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

export type CodexSubagentProbeMode = "read_only" | "proposal_only";

export interface CodexSubagentProbeHint {
  name: string;
  mode: CodexSubagentProbeMode;
  purpose: string;
  trigger: string;
  allowedActions: string[];
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
  untrustedContextWarnings: string[];
  explicitExclusions: ExecutionBriefContextExclusion[];
  sourceClaimsUsed: string[];
  memoryRecordsUsed: string[];
  antiMemoryWarnings: string[];
  toolBoundaries: string[];
  evidenceContract: ExecutionBriefEvidenceContract;
  hookExpectations: CodexHookExpectation[];
  skillBindingHints: CodexSkillBindingHint[];
  mcpResourceRefs: CodexMcpResourceRef[];
  goalRefs: CodexGoalRef[];
  execPlanRefs: CodexExecPlanRef[];
  subagentProbeHints: CodexSubagentProbeHint[];
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
