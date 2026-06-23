import type {
  CapabilityBindingKind,
  CapabilityPlan,
  CapabilityRequirement,
  CapabilityRequirementKind,
  HarnessPlan
} from "@krn/core";

export interface CreateCapabilityPlanInput {
  harnessPlan: HarnessPlan;
  hasContext: boolean;
  createdAt: string;
  createId(prefix: string): string;
}

const bindingKindsByRequirement = {
  source_grounding: ["skill", "policy_gate"],
  type_safety: ["skill", "rule"],
  schema_design: ["skill", "rule"],
  test_boundary: ["skill", "rule"],
  db_migration: ["skill", "policy_gate"],
  review_capture: ["skill", "policy_gate"],
  evidence_capture: ["skill", "tool_boundary"],
  policy_gate: ["policy_gate", "tool_boundary"]
} as const satisfies Record<CapabilityRequirementKind, readonly CapabilityBindingKind[]>;

const requirement = (
  input: Omit<CapabilityRequirement, "priority" | "bindingKinds">
): CapabilityRequirement => ({
  ...input,
  priority: "required",
  bindingKinds: [...bindingKindsByRequirement[input.kind]]
});

export const createCapabilityPlan = (input: CreateCapabilityPlanInput): CapabilityPlan => {
  const requirements: CapabilityRequirement[] = [
    requirement({
      kind: "source_grounding",
      reason: "Compiled work must use selected source and memory context, or record abstention.",
      requiredEvidence: ["context inclusions", "context exclusions"]
    }),
    requirement({
      kind: "type_safety",
      reason: "KRN TypeScript boundaries stay strict across core, schema, harness, and adapters.",
      requiredEvidence: ["pnpm typecheck"]
    }),
    requirement({
      kind: "test_boundary",
      reason: "Compiler output must remain protected by behavior tests.",
      requiredEvidence: ["pnpm test"]
    }),
    requirement({
      kind: "evidence_capture",
      reason: "Execution should be reviewable through explicit commands and diff-risk evidence.",
      requiredEvidence: ["git diff --check", "changed files summary"]
    }),
    requirement({
      kind: "review_capture",
      reason: "Feedback must become candidates, not automatic memory mutation.",
      requiredEvidence: ["review assessment", "feedback delta candidates"]
    })
  ];

  if (!input.hasContext) {
    requirements.push(requirement({
      kind: "policy_gate",
      reason: "Weak context requires an abstention path instead of broad rereads.",
      requiredEvidence: ["context abstention", "context exclusions"]
    }));
  }

  return {
    id: input.createId("capability-plan"),
    harnessPlanId: input.harnessPlan.id,
    requirements,
    toolBoundaries: [
      "Do not invoke Codex from the harness compiler.",
      "Do not mutate memory automatically.",
      "Do not write runtime markdown memory.",
      "Do not spawn agents from the compiler."
    ],
    policyGateIds: input.hasContext ? [] : ["weak-context-abstention"],
    metadata: {
      harnessPlanStatus: input.harnessPlan.status
    },
    createdAt: input.createdAt
  };
};
