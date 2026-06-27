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

export type CodexSkillBindingSource = "capability_plan" | "operator" | "policy";

export interface CodexSkillBindingHint {
  skillName: string;
  capabilityKind: CapabilityRequirementKind;
  reason: string;
  requiredEvidence: string[];
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
