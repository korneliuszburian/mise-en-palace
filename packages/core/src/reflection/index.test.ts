import { describe, expect, it } from "vitest";

import {
  REFLECTION_CANDIDATE_OUTPUT_TARGETS,
  isReflectionOutputCandidateOnly,
  type ReflectionOutput
} from "./index.js";

const output: ReflectionOutput = {
  id: "reflection-1",
  scope: {
    projectId: "project-1",
    executionRunId: "run-1",
    taskContractId: "task-1"
  },
  status: "candidate",
  summary: "Reflection produced candidate-only findings.",
  findings: [{
    id: "finding-1",
    kind: "candidate_signal",
    severity: "medium",
    summary: "Observation suggests a memory candidate.",
    observationItemIds: ["observation-1"],
    evidenceRefs: ["observation-1:range-1"],
    metadata: {}
  }],
  contradictions: [{
    id: "contradiction-1",
    summary: "Two observations disagree about source policy.",
    observationItemIds: ["observation-1", "observation-2"],
    conflictingClaims: ["source ranges optional", "source ranges required"],
    evidenceRefs: ["observation-1:range-1", "observation-2:range-1"],
    severity: "high",
    metadata: {}
  }],
  gaps: [{
    id: "gap-1",
    summary: "No raw evidence recall proof exists.",
    missingEvidence: "raw evidence recall sample",
    observationItemIds: ["observation-3"],
    severity: "medium",
    metadata: {}
  }],
  candidateLinks: [{
    targetType: "memory_candidate",
    targetId: "candidate-1",
    summary: "Create candidate, not active memory.",
    evidenceRefs: ["observation-1:range-1"]
  }],
  memoryCandidates: [{
    kind: "procedure",
    summary: "Use source ranges for factual observations.",
    body: "Observation-derived memory candidates require review before promotion.",
    owner: "memory-review",
    confidence: 70,
    applicationGuidance: "Apply only after review gate acceptance.",
    sourceLineage: [{ sourceId: "observation-1" }],
    isUserPreference: false,
    validFrom: "2026-06-22T00:00:00.000Z",
    metadata: {}
  }],
  sourceClaimCandidates: [{
    claim: "Observation source ranges support exact recall.",
    mechanism: "Typed source range links identify raw evidence rows.",
    krnImplication: "Reflection can cite evidence without promoting memory.",
    doesNotProve: "This does not prove the claim is approved truth.",
    trustTier: "project-decision",
    supportType: "mechanism",
    consumer: "reflection candidate generation",
    metadata: {}
  }],
  antiMemoryCandidates: [{
    key: "do-not-promote-unsourced-observations",
    summary: "Unsourced factual observations must not become memory.",
    body: "Review should reject factual candidates without source lineage.",
    owner: "memory-review",
    confidence: 90,
    invalidatedBySourceClaimIds: [],
    sourceLineage: [{ sourceId: "observation-2" }],
    metadata: {}
  }],
  policyCandidates: [{
    key: "reflection-candidate-only",
    summary: "Reflection cannot mutate Memory Core.",
    rationale: "Reflection is a staging layer that produces reviewable candidates.",
    evidenceRefs: ["ADR-0011"],
    metadata: {}
  }],
  evalCandidates: [{
    title: "Reflection output is candidate-only",
    scenario: "A reflection run sees a tempting memory claim.",
    expectedSignal: "It emits MemoryCandidate proposal only.",
    sourceEvidence: ["observation-1"],
    metadata: {}
  }],
  metadata: {},
  createdAt: "2026-06-22T00:00:00.000Z",
  updatedAt: "2026-06-22T00:00:00.000Z"
};

describe("reflection contracts", () => {
  it("exposes candidate output targets only", () => {
    expect(REFLECTION_CANDIDATE_OUTPUT_TARGETS).toEqual([
      "memory_candidate",
      "source_claim_candidate",
      "anti_memory_candidate",
      "policy_candidate",
      "eval_candidate"
    ]);
    expect(REFLECTION_CANDIDATE_OUTPUT_TARGETS).not.toContain("memory_record");
    expect(REFLECTION_CANDIDATE_OUTPUT_TARGETS).not.toContain("source_decision");
  });

  it("accepts candidate-only reflection outputs", () => {
    expect(isReflectionOutputCandidateOnly(output)).toBe(true);
  });

  it("rejects outputs that link to final truth targets", () => {
    expect(isReflectionOutputCandidateOnly({
      ...output,
      candidateLinks: [{
        targetType: "memory_record",
        targetId: "memory-1",
        summary: "This would bypass review.",
        evidenceRefs: []
      }]
    })).toBe(false);

    expect(isReflectionOutputCandidateOnly({
      ...output,
      candidateLinks: [{
        targetType: "source_decision",
        targetId: "decision-1",
        summary: "This would bypass source review.",
        evidenceRefs: []
      }]
    })).toBe(false);
  });
});
