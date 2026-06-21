import type {
  CapabilityPlan
} from "@krn/core";

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

export const renderSkillHints = (capabilityPlan: CapabilityPlan): string[] => {
  const hints = new Set<string>();

  for (const requirement of capabilityPlan.requirements) {
    hints.add(skillByRequirement[requirement.kind]);
  }

  return [...hints];
};
