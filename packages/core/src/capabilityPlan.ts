import type {
  CapabilityPlanId,
  HarnessPlanId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type CapabilityRequirementKind =
  | "source_grounding"
  | "type_safety"
  | "schema_design"
  | "test_boundary"
  | "db_migration"
  | "review_capture"
  | "evidence_capture"
  | "policy_gate";

export type CapabilityRequirementPriority = "required" | "recommended";

export type CapabilityBindingKind =
  | "skill"
  | "rule"
  | "policy_gate"
  | "tool_boundary";

export type CapabilityPlanBindingKind =
  | "skill"
  | "rule_pack"
  | "policy_gate"
  | "tool_boundary";

export interface CapabilityRequirement {
  kind: CapabilityRequirementKind;
  priority: CapabilityRequirementPriority;
  bindingKinds: CapabilityBindingKind[];
  reason: string;
  requiredEvidence: string[];
}

export interface BaseCapabilityBinding {
  id: string;
  kind: CapabilityPlanBindingKind;
  requirementKind: CapabilityRequirementKind;
  name: string;
  reason: string;
  requiredEvidence: string[];
  priority: CapabilityRequirementPriority;
  metadata: Record<string, unknown>;
}

export interface SkillBinding extends BaseCapabilityBinding {
  kind: "skill";
}

export interface RulePackBinding extends BaseCapabilityBinding {
  kind: "rule_pack";
}

export interface PolicyGateBinding extends BaseCapabilityBinding {
  kind: "policy_gate";
}

export interface ToolBoundaryBinding extends BaseCapabilityBinding {
  kind: "tool_boundary";
}

export type CapabilityBinding =
  | SkillBinding
  | RulePackBinding
  | PolicyGateBinding
  | ToolBoundaryBinding;

export interface CapabilityPlan {
  id: CapabilityPlanId;
  harnessPlanId: HarnessPlanId;
  requirements: CapabilityRequirement[];
  toolBoundaries: string[];
  policyGateIds: string[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}

const isBlank = (value: string): boolean => value.trim().length === 0;

export const validateCapabilityBindings = (
  bindings: readonly CapabilityBinding[]
): string[] => {
  const findings: string[] = [];

  for (const binding of bindings) {
    if (isBlank(binding.id)) {
      findings.push("binding:id is required");
    }

    const bindingId = isBlank(binding.id) ? "binding" : binding.id;

    if (isBlank(binding.name)) {
      findings.push(`${bindingId}:name is required`);
    }

    if (isBlank(binding.reason)) {
      findings.push(`${bindingId}:reason is required`);
    }

    if (binding.requiredEvidence.length === 0) {
      findings.push(`${bindingId}:requiredEvidence is required`);
    }
  }

  return findings;
};
