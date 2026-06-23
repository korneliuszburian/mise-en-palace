import { describe, expect, it } from "vitest";

import {
  REFLECTION_CANDIDATE_OUTPUT_TARGETS,
  assessReflectionMemoryCandidateEvidence,
  assessReflectionOutputContract,
  buildReflectionCandidateGenerationPlan,
  buildReflectionIssueReports,
  isReflectionOutputCandidateOnly,
  type ReflectionOutput
} from "./index.js";
import type { ObservationItem } from "../observations/index.js";

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
    evidence: {
      provenance: "operator_reported",
      evidenceRefs: ["observation-1:range-1"],
      doesNotProve: "This does not prove the candidate is approved Memory Core truth."
    },
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
    evidence: {
      provenance: "run_event",
      evidenceRefs: ["observation-1:range-1"],
      doesNotProve: "This does not prove the source claim is approved truth."
    },
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
    evidence: {
      provenance: "run_event",
      evidenceRefs: ["observation-2:range-1"],
      doesNotProve: "This does not prove the anti-memory candidate is reviewed."
    },
    metadata: {}
  }],
  policyCandidates: [{
    key: "reflection-candidate-only",
    summary: "Reflection cannot mutate Memory Core.",
    rationale: "Reflection is a staging layer that produces reviewable candidates.",
    evidenceRefs: ["ADR-0011"],
    evidence: {
      provenance: "source_claim",
      evidenceRefs: ["ADR-0011"],
      doesNotProve: "This does not prove the policy candidate is accepted."
    },
    metadata: {}
  }],
  evalCandidates: [{
    title: "Reflection output is candidate-only",
    scenario: "A reflection run sees a tempting memory claim.",
    expectedSignal: "It emits MemoryCandidate proposal only.",
    sourceEvidence: ["observation-1"],
    evidence: {
      provenance: "run_event",
      evidenceRefs: ["observation-1:range-1"],
      doesNotProve: "This does not prove the eval candidate protects production behavior."
    },
    metadata: {}
  }],
  metadata: {},
  createdAt: "2026-06-22T00:00:00.000Z",
  updatedAt: "2026-06-22T00:00:00.000Z"
};

const sourcedRange = {
  id: "range-1",
  sourceType: "run_event",
  sourceId: "run-1",
  locator: "run_events:1",
  capturedAt: "2026-06-22T00:00:00.000Z"
} as const;

const observation = (overrides: Partial<ObservationItem>): ObservationItem => ({
  id: "observation-1",
  groupId: "group-1",
  scope: {
    projectId: "project-1"
  },
  kind: "fact",
  status: "candidate",
  priority: "medium",
  confidence: "medium",
  provenanceKind: "run_event",
  subject: "source policy",
  summary: "Source ranges are required.",
  body: "Source-ranged observations preserve raw recall.",
  temporalScope: {
    observedAt: "2026-06-22T00:00:00.000Z",
    ingestedAt: "2026-06-22T00:00:00.000Z"
  },
  sourceRanges: [sourcedRange],
  entityLinks: [],
  claimLinks: [],
  metadata: {},
  createdAt: "2026-06-22T00:00:00.000Z",
  updatedAt: "2026-06-22T00:00:00.000Z",
  ...overrides
});

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
    const assessment = assessReflectionOutputContract({
      ...output,
      candidateLinks: [{
        targetType: "memory_record",
        targetId: "memory-1",
        summary: "This would bypass review.",
        evidenceRefs: []
      }]
    });

    expect(assessment).toEqual({
      candidateOnly: false,
      violations: [{
        path: "candidateLinks.0.targetType",
        reason: "final_truth_target",
        value: "memory_record"
      }]
    });

    expect(assessReflectionOutputContract({
      ...output,
      candidateLinks: [{
        targetType: "source_decision",
        targetId: "decision-1",
        summary: "This would bypass source review.",
        evidenceRefs: []
      }]
    }).candidateOnly).toBe(false);
  });

  it("rejects promotion semantics hidden in metadata", () => {
    const assessment = assessReflectionOutputContract({
      ...output,
      metadata: {
        createActiveMemory: true,
        nested: {
          source_decision: "decision-1"
        }
      }
    });

    expect(isReflectionOutputCandidateOnly({
      ...output,
      metadata: {
        createActiveMemory: true
      }
    })).toBe(false);
    expect(assessment.violations).toEqual([
      {
        path: "metadata.createActiveMemory",
        reason: "final_truth_metadata",
        value: "createActiveMemory"
      },
      {
        path: "metadata.nested.source_decision",
        reason: "final_truth_metadata",
        value: "source_decision"
      }
    ]);
  });

  it("builds a deterministic candidate generation plan without final truth writes", () => {
    const plan = buildReflectionCandidateGenerationPlan(output);

    expect(plan).toEqual({
      status: "ready",
      counts: {
        memoryCandidates: 1,
        sourceClaimCandidates: 1,
        antiMemoryCandidates: 1,
        policyCandidates: 1,
        evalCandidates: 1
      },
      candidateLinks: output.candidateLinks,
      blockedReasons: []
    });
  });

  it("blocks candidate generation when output violates candidate-only contract", () => {
    const plan = buildReflectionCandidateGenerationPlan({
      ...output,
      metadata: {
        createActiveMemory: true
      }
    });

    expect(plan.status).toBe("blocked");
    expect(plan.blockedReasons).toEqual([
      "metadata.createActiveMemory:final_truth_metadata"
    ]);
  });

  it("blocks high-confidence memory candidates backed only by weak command evidence", () => {
    const proposal = {
      ...output.memoryCandidates[0],
      confidence: 90,
      evidence: {
        provenance: "default_template",
        evidenceRefs: ["evidence-bundle-1:commands"],
        doesNotProve: "This default command template does not prove verification ran."
      }
    };

    expect(assessReflectionMemoryCandidateEvidence(proposal)).toEqual({
      ok: false,
      blockedReasons: ["weak_command_evidence_high_confidence"]
    });

    expect(buildReflectionCandidateGenerationPlan({
      ...output,
      memoryCandidates: [proposal]
    })).toMatchObject({
      status: "blocked",
      blockedReasons: ["memoryCandidates.0.evidence:weak_command_evidence_high_confidence"]
    });
  });

  it("reports contested and conflict observations as contradictions", () => {
    const reports = buildReflectionIssueReports({
      now: "2026-06-22T01:00:00.000Z",
      observations: [
        observation({
          id: "observation-contested",
          status: "contested",
          summary: "Observation source policy is disputed."
        }),
        observation({
          id: "observation-conflict",
          kind: "conflict",
          summary: "Two observations disagree."
        })
      ]
    });

    expect(reports.contradictions.map((report) => report.metadata.reason)).toEqual([
      "conflict_observation",
      "contested_observation"
    ]);
    expect(reports.findings.filter((finding) => finding.kind === "contradiction")).toHaveLength(2);
  });

  it("reports observations that require but lack source ranges", () => {
    const reports = buildReflectionIssueReports({
      now: "2026-06-22T01:00:00.000Z",
      observations: [
        observation({
          id: "observation-unsourced",
          sourceRanges: []
        }),
        observation({
          id: "observation-local-note",
          kind: "operator_note",
          provenanceKind: "local_operator_note",
          subject: "local operator note",
          summary: "Local operator note may omit source range.",
          sourceRanges: []
        })
      ]
    });

    expect(reports.gaps).toEqual([expect.objectContaining({
      id: "gap-missing-source-range-observation-unsourced",
      missingEvidence: "source range",
      metadata: expect.objectContaining({
        reason: "missing_source_range"
      })
    })]);
  });

  it("reports stale and duplicate observations as gaps", () => {
    const reports = buildReflectionIssueReports({
      now: "2026-06-22T01:00:00.000Z",
      observations: [
        observation({
          id: "observation-a",
          summary: "Same repeated observation.",
          temporalScope: {
            observedAt: "2026-06-22T00:00:00.000Z",
            ingestedAt: "2026-06-22T00:00:00.000Z",
            validUntil: "2026-06-22T00:30:00.000Z"
          }
        }),
        observation({
          id: "observation-b",
          summary: "Same repeated observation."
        })
      ]
    });

    expect(reports.gaps.map((gap) => gap.metadata.reason)).toEqual([
      "duplicate_observations",
      "stale_observation"
    ]);
  });

  it("reports unsupported decisions without source claim links", () => {
    const reports = buildReflectionIssueReports({
      now: "2026-06-22T01:00:00.000Z",
      observations: [],
      decisions: [{
        id: "decision-1",
        status: "adopt",
        decision: "Adopt observation source policy."
      }, {
        id: "decision-2",
        sourceClaimId: "source-claim-1",
        status: "adopt",
        decision: "Adopt sourced policy."
      }]
    });

    expect(reports.gaps).toEqual([expect.objectContaining({
      id: "gap-unsupported-decision-decision-1",
      severity: "high",
      metadata: expect.objectContaining({
        reason: "unsupported_decision"
      })
    })]);
  });
});
