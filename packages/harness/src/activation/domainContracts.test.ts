import { describe, expect, it } from "vitest";
import {
  activationCandidateKinds,
  activationDecisionStatuses,
  activationExclusionReasons,
  createActivationAbstention
} from "@krn/core";
import type {
  ActivationInput,
  ActivationPolicy,
  ActivationResult,
  ActivationTrace,
  ConflictSet,
  ContextBudget,
  ContextROI,
  TrustAssessment
} from "@krn/core";

describe("activation domain contracts", () => {
  it("exports adapter-independent activation contracts from core", () => {
    const budget: ContextBudget = {
      maxItems: 6,
      maxTokens: 1200
    };
    const policy: ActivationPolicy = {
      id: "policy-1",
      minimumTrustTier: "medium",
      budget,
      allowStale: false,
      requireSourceDoesNotProve: true
    };
    const trust: TrustAssessment = {
      accepted: true,
      trustTier: "project-decision",
      reason: "Project decisions are trusted enough for activation."
    };
    const contextROI: ContextROI = {
      score: 88,
      tokenEstimate: 180,
      expectedUse: "Guide activation readiness implementation.",
      expectedDecisionImpact: "Prevents broad context dumping."
    };
    const conflictSet: ConflictSet = {
      id: "conflict-1",
      candidateIds: ["source-1", "source-2"],
      reason: "contradictory_source_claims",
      resolution: "defer"
    };
    const trace: ActivationTrace = {
      taskContractId: "task-1",
      policy,
      candidateCount: 2,
      includedCount: 0,
      excludedCount: 2,
      conflictSets: [conflictSet],
      metadata: {
        trust,
        contextROI
      }
    };
    const abstention = createActivationAbstention({
      reason: "weak_context",
      explanation: "No candidate survived trust, temporal, and ROI filters."
    });
    const result: ActivationResult = {
      status: "abstained",
      inclusions: [],
      exclusions: [],
      trace,
      abstention,
      metadata: {}
    };
    const input: ActivationInput = {
      taskContractId: "task-1",
      query: "improve KRN doctor activation readiness",
      candidates: [],
      policy,
      metadata: {}
    };

    expect(activationCandidateKinds).toEqual(["memory", "anti_memory", "source", "search"]);
    expect(activationDecisionStatuses).toContain("conflict");
    expect(activationExclusionReasons).toContain("low_context_roi");
    expect(input.policy).toBe(policy);
    expect(result.abstention).toMatchObject({
      reason: "weak_context",
      explanation: "No candidate survived trust, temporal, and ROI filters."
    });
  });
});
