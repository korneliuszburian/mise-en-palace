import type {
  CapabilityPlan
} from "@krn/core";

const skillByRequirement = {
  source_grounding: "source-to-decision",
  type_safety: "typescript-type-safety",
  schema_design: "typescript-type-safety",
  test_boundary: "test-driven-development",
  db_migration: "typescript-type-safety",
  review_capture: "source-to-decision",
  evidence_capture: "verification-before-completion",
  policy_gate: "select-kernel-patterns"
} as const satisfies Record<CapabilityPlan["requirements"][number]["kind"], string>;

export const renderSkillHints = (capabilityPlan: CapabilityPlan): string[] => {
  const hints = new Set<string>();

  for (const requirement of capabilityPlan.requirements) {
    hints.add(skillByRequirement[requirement.kind]);
  }

  return [...hints];
};
