import { describe, expect, test } from "vitest";

import {
  assessCapabilityBindingCandidatePromotion,
  validateCapabilityBindings,
  type CapabilityBinding,
  type CapabilityBindingCandidate
} from "./capabilityPlan.js";

const bindings = (): CapabilityBinding[] => [
  {
    id: "skill-binding-1",
    kind: "skill",
    requirementKind: "type_safety",
    name: "typescript-type-safety",
    reason: "Review TypeScript boundaries.",
    requiredEvidence: ["pnpm typecheck"],
    priority: "required",
    metadata: {}
  },
  {
    id: "rule-binding-1",
    kind: "rule_pack",
    requirementKind: "test_boundary",
    name: "test-driven-development",
    reason: "Protect behavior before implementation.",
    requiredEvidence: ["focused RED/GREEN test"],
    priority: "required",
    metadata: {}
  },
  {
    id: "policy-binding-1",
    kind: "policy_gate",
    requirementKind: "source_grounding",
    name: "source-to-decision",
    reason: "Source decisions need mechanism and falsifier.",
    requiredEvidence: ["SourceClaim"],
    priority: "required",
    metadata: {}
  },
  {
    id: "tool-binding-1",
    kind: "tool_boundary",
    requirementKind: "evidence_capture",
    name: "git diff --check",
    reason: "Tool output is evidence, not runtime authority.",
    requiredEvidence: ["git diff --check"],
    priority: "recommended",
    metadata: {}
  }
];

describe("capability binding models", () => {
  test("accepts focused skill rule policy and tool bindings", () => {
    expect(validateCapabilityBindings(bindings())).toEqual([]);
  });

  test("rejects invalid binding shapes", () => {
    expect(validateCapabilityBindings([
      {
        id: "invalid-binding",
        kind: "skill",
        requirementKind: "type_safety",
        name: " ",
        reason: "",
        requiredEvidence: [],
        priority: "required",
        metadata: {}
      }
    ])).toEqual(expect.arrayContaining([
      "invalid-binding:name is required",
      "invalid-binding:reason is required",
      "invalid-binding:requiredEvidence is required"
    ]));
  });

  test("requires explicit review before capability binding promotion", () => {
    const candidate: CapabilityBindingCandidate = {
      id: "binding-candidate-1",
      binding: bindings()[0],
      status: "proposed",
      proposalReason: "Compiler suggested TypeScript boundary review.",
      proposedBy: "capability-compiler",
      metadata: {},
      createdAt: "2026-06-23T05:00:00.000Z",
      updatedAt: "2026-06-23T05:00:00.000Z"
    };

    expect(assessCapabilityBindingCandidatePromotion(candidate)).toEqual([
      "binding-candidate-1:review is required before promotion"
    ]);
    expect(assessCapabilityBindingCandidatePromotion({
      ...candidate,
      status: "approved",
      review: {
        reviewer: "operator",
        decision: "approved",
        evidenceReviewedRef: "docs/plans/memory-ideal-state/PLAN.md#MM-49",
        reviewedAt: "2026-06-23T05:10:00.000Z"
      }
    })).toEqual([]);
  });
});
