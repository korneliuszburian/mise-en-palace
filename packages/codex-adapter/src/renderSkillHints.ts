import type {
  CapabilityPlan
} from "@krn/core";
import type {
  CodexSkillBindingHint
} from "./contracts.js";

const skillByRequirement = {
  source_grounding: "source-to-decision",
  type_safety: "typescript-type-safety",
  schema_design: "brain-store-schema",
  test_boundary: "test-driven-development",
  db_migration: "brain-store-schema",
  review_capture: "evidence-review-loop",
  evidence_capture: "evidence-review-loop",
  policy_gate: "activation-engine"
} as const satisfies Record<CapabilityPlan["requirements"][number]["kind"], string>;

export const createCodexSkillBindingHints = (
  capabilityPlan: CapabilityPlan
): CodexSkillBindingHint[] =>
  capabilityPlan.requirements.map((requirement) => ({
    skillName: skillByRequirement[requirement.kind],
    capabilityKind: requirement.kind,
    reason: requirement.reason,
    requiredEvidence: requirement.requiredEvidence,
    priority: "required",
    source: "capability_plan"
  }));

export const renderSkillHints = (capabilityPlan: CapabilityPlan): string[] => {
  const hints = new Set<string>();

  for (const hint of createCodexSkillBindingHints(capabilityPlan)) {
    hints.add(hint.skillName);
  }

  return [...hints];
};
