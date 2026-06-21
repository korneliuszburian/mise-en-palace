import type {
  CapabilityPlan,
  CapabilityRequirement,
  HarnessPlan
} from "@krn/core";

export interface CreateCapabilityPlanInput {
  harnessPlan: HarnessPlan;
  hasContext: boolean;
  createdAt: string;
  createId(prefix: string): string;
}

export const createCapabilityPlan = (input: CreateCapabilityPlanInput): CapabilityPlan => {
  const requirements: CapabilityRequirement[] = [
    {
      kind: "source_grounding",
      reason: "Compiled work must use selected source and memory context, or record abstention.",
      requiredEvidence: ["context inclusions", "context exclusions"]
    },
    {
      kind: "type_safety",
      reason: "KRN TypeScript boundaries stay strict across core, schema, harness, and adapters.",
      requiredEvidence: ["pnpm typecheck"]
    },
    {
      kind: "test_boundary",
      reason: "Compiler output must remain protected by behavior tests.",
      requiredEvidence: ["pnpm test"]
    },
    {
      kind: "evidence_capture",
      reason: "Execution should be reviewable through explicit commands and diff-risk evidence.",
      requiredEvidence: ["git diff --check", "changed files summary"]
    },
    {
      kind: "review_capture",
      reason: "Feedback must become candidates, not automatic memory mutation.",
      requiredEvidence: ["review assessment", "feedback delta candidates"]
    }
  ];

  if (!input.hasContext) {
    requirements.push({
      kind: "policy_gate",
      reason: "Weak context requires an abstention path instead of broad rereads.",
      requiredEvidence: ["context abstention", "context exclusions"]
    });
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
