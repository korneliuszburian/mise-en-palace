import type {
  MemoryRecord,
  MemoryRecordId,
  ProjectId,
  SourceArtifactId,
  SourceClaim,
  SourceClaimEdge,
  SourceClaimId
} from "@krn/core";
import { describe, expect, test } from "vitest";

import {
  buildMaintenancePreview
} from "../maintenance-preview.js";

const now = "2026-06-30T11:30:00.000Z";
const evidenceRef =
  "review-evidence/controlled-dogfood/2026-06-30-v363-maintenance-preview-candidate-generator/REPORT.md";

const memoryRecord = (
  id: string,
  overrides: Partial<MemoryRecord> = {}
): MemoryRecord => ({
  id: id as MemoryRecordId,
  projectId: "project-1" as ProjectId,
  key: id,
  kind: "procedure",
  status: "active",
  summary: `Memory ${id}`,
  body: "A bounded memory record for brain maintenance preview tests.",
  owner: "krn",
  confidence: 90,
  applicationGuidance: "Use only while current evidence still supports this memory.",
  invalidationRule: "Revisit when current evidence supersedes this memory.",
  sourceLineage: [{ sourceId: evidenceRef }],
  isUserPreference: false,
  positiveFeedbackCount: 1,
  negativeFeedbackCount: 0,
  metadata: {},
  validFrom: "2026-06-01T00:00:00.000Z",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  ...overrides
});

const sourceClaim = (
  id: string,
  overrides: Partial<SourceClaim> = {}
): SourceClaim => ({
  id: id as SourceClaimId,
  sourceArtifactId: "source-artifact-1" as SourceArtifactId,
  claim: `Claim ${id}`,
  mechanism: "A bounded source claim carries mechanism for brain maintenance preview tests.",
  krnImplication: "Use this claim only as maintenance preview input.",
  doesNotProve: "This source claim does not prove source truth.",
  sourceAuthority: "project-decision",
  supportType: "mechanism",
  consumer: "brain maintenance preview test",
  status: "accepted",
  metadata: {},
  createdAt: "2026-06-30T10:00:00.000Z",
  updatedAt: "2026-06-30T10:00:00.000Z",
  ...overrides
});

const sourceClaimEdge = (
  overrides: Partial<SourceClaimEdge> = {}
): SourceClaimEdge => ({
  id: "source-claim-edge-1",
  fromSourceClaimId: "source-claim-1" as SourceClaimId,
  toSourceClaimId: "source-claim-2" as SourceClaimId,
  kind: "duplicates",
  metadata: {
    consumer: "brain maintenance preview test",
    doesNotProve: "This edge does not prove source truth.",
    evidenceRefs: [evidenceRef]
  },
  createdAt: "2026-06-30T10:10:00.000Z",
  ...overrides
});

describe("brain maintenance preview", () => {
  test("guards review eval closure behavior proof without mutation", () => {
    const result = buildMaintenancePreview({
      now,
      evidenceRef,
      memoryRecords: [
        memoryRecord("memory-expired", {
          validUntil: "2026-06-29T00:00:00.000Z"
        })
      ],
      sourceClaims: [
        sourceClaim("source-claim-1"),
        sourceClaim("source-claim-2")
      ],
      sourceClaimEdges: [sourceClaimEdge()]
    });

    expect(result.reviewEvalClosure).toEqual({
      kind: "maintenance_preview_review_eval_closure",
      decision: "ready_for_behavior_proof",
      nextAction: "add_golden_behavior_case",
      summary:
        "Maintenance preview emitted review-ready candidate output that can be protected by a bounded behavior proof before any automated maintenance path.",
      candidateIds: [
        "memory-staleness-maintenance:memory-expired:expired_memory",
        "source-relation-maintenance:source-claim-edge-1:relation_needs_review"
      ],
      evidenceRefs: [evidenceRef],
      mutation: "none",
      doesNotProve:
        "Maintenance preview review/eval closure does not prove candidate truth, review correctness, production usefulness, scheduler readiness, autonomous maintenance execution, or Memory Core mutation.",
      forbiddenWrites: [
        "memory_records",
        "anti_memory_records",
        "source_claims",
        "source_decisions",
        "source_claim_edges",
        "eval_candidates"
      ]
    });
    expect(result.manualCandidateRouting).toEqual({
      kind: "maintenance_candidate_routing",
      mode: "manual_candidate_only",
      status: "ready_for_operator_review",
      nextAction: "review_candidates_and_capture_evidence",
      summary:
        "Maintenance candidate routing can hand review-ready maintenance candidates to an operator, then capture evidence before any promotion or mutation.",
      inspectedCandidates: 2,
      reviewableCandidates: 2,
      mutation: "none",
      doesNotProve:
        "Maintenance candidate routing readback does not prove candidate truth, review correctness, autonomous execution, scheduling readiness, maintenance daemon readiness, or Memory Core mutation.",
      forbiddenWrites: [
        "memory_records",
        "anti_memory_records",
        "source_claims",
        "source_decisions",
        "source_claim_edges",
        "eval_candidates",
        "maintenance_queue_records"
      ]
    });
    expect(result.candidates).toHaveLength(2);
    for (const candidate of result.candidates) {
      expect(candidate.reviewability).toBe("ready");
      expect(candidate.reviewabilityReasons.length).toBeGreaterThan(0);
      expect(candidate.action.length).toBeGreaterThan(0);
      expect(candidate.evidenceRefs).toContain(evidenceRef);
      expect(candidate.doesNotProve.length).toBeGreaterThan(0);
      expect(candidate.mutation).toBe("none");
    }
    expect(result.candidates[0]).toMatchObject({
      kind: "memory_staleness_maintenance_candidate",
      maintenanceWriteBoundary: {
        jobType: "expire_stale_memory",
        memoryBoundary: "must_create_reviewed_invalidation_candidate",
        status: "passed",
        queueRecordKeyTemplate: "expire_stale_memory:{projectId}:{olderThan}",
        allowedWrites: [
          "maintenance_queue_records",
          "outbox_events",
          "anti_memory_candidates"
        ],
        forbiddenWrites: [
          "memory_records",
          "anti_memory_records",
          "source_claims",
          "source_decisions"
        ]
      }
    });
    expect(result.candidates[1]).toMatchObject({
      kind: "source_relation_maintenance_candidate",
      edgeKind: "duplicates",
      relationReviewFocus: "duplicate",
      relationReviewQuestion:
        "Review whether these claims are true duplicates before consolidation, suppression, or source truth changes."
    });
    expect(result.mutation).toBe("none");
  });

  test("guards activation utility acquisition eval proof without mutation", () => {
    const result = buildMaintenancePreview({
      now,
      evidenceRef,
      memoryRecords: [],
      sourceClaims: [],
      sourceClaimEdges: [],
      knowledgeAcquisitionRequests: [
        {
          id: "activation-utility-exploration",
          source: "memory_search",
          query: "Autonomous Memory Agents exploration",
          missingEvidence: [
            "selected knowledge is missing while source/link/graph evidence is useful"
          ],
          activationUtilityEvidence: {
            verdict: "linked_evidence_exploration_candidate",
            selectedKnowledge: {
              signal: "selected_knowledge",
              strength: "missing",
              reasons: ["selectedKnowledge returned no packets."]
            },
            sourceLinkGraph: {
              signal: "source_link_graph",
              strength: "useful",
              reasons: [
                "answerUsefulness is partly_useful_missing_document.",
                "source/link/graph evidence count is 29."
              ]
            },
            recommendedNextAction:
              "Review linked source/graph evidence as exploration context before treating missing selected knowledge as low utility; do not change production ranking without a bounded eval.",
            doesNotProve:
              "Activation utility lab readback does not prove source truth, ranking quality, semantic-aware Thompson sampling, or product readiness."
          },
          evidenceRefs: [
            "review-evidence/controlled-dogfood/2026-07-01-imr-35-activation-utility-heartbeat-routing/REPORT.md"
          ],
          consumer: "maintenance preview and future bounded eval/golden candidates",
          falsifier:
            "Maintenance preview drops activationUtilityEvidence or performs direct writes.",
          doesNotProve:
            "This candidate does not prove source truth, ranking quality, semantic-aware Thompson sampling, autonomous maintenance execution, or Memory Core mutation safety."
        }
      ]
    });

    expect(result.reviewEvalClosure).toMatchObject({
      kind: "maintenance_preview_review_eval_closure",
      decision: "ready_for_behavior_proof",
      nextAction: "add_golden_behavior_case",
      mutation: "none"
    });
    expect(result.manualCandidateRouting).toMatchObject({
      kind: "maintenance_candidate_routing",
      mode: "manual_candidate_only",
      status: "ready_for_operator_review",
      nextAction: "review_candidates_and_capture_evidence",
      inspectedCandidates: 1,
      reviewableCandidates: 1,
      mutation: "none"
    });
    expect(result.candidateCounts).toEqual({
      memoryStaleness: 0,
      sourceRelation: 0,
      knowledgeAcquisition: 1,
      consensusEvaluation: 0
    });
    expect(result.candidates).toEqual([
      expect.objectContaining({
        id: "knowledge-acquisition-maintenance:activation-utility-exploration:missing_evidence",
        kind: "knowledge_acquisition_candidate",
        action: "propose_knowledge_acquisition",
        reviewability: "ready",
        activationUtilityEvidence: expect.objectContaining({
          verdict: "linked_evidence_exploration_candidate",
          selectedKnowledge: expect.objectContaining({
            signal: "selected_knowledge",
            strength: "missing"
          }),
          sourceLinkGraph: expect.objectContaining({
            signal: "source_link_graph",
            strength: "useful"
          }),
          doesNotProve:
            "Activation utility lab readback does not prove source truth, ranking quality, semantic-aware Thompson sampling, or product readiness."
        }),
        evidenceRefs: expect.arrayContaining([
          evidenceRef,
          "review-evidence/controlled-dogfood/2026-07-01-imr-35-activation-utility-heartbeat-routing/REPORT.md"
        ]),
        doesNotProve: expect.stringContaining("semantic-aware Thompson sampling"),
        mutation: "none",
        forbiddenWrites: [
          "memory_records",
          "anti_memory_records",
          "source_claims",
          "source_decisions",
          "source_claim_edges",
          "eval_candidates",
          "maintenance_queue_records"
        ]
      })
    ]);
    expect(result.reviewEvalClosure.candidateIds).toEqual([
      "knowledge-acquisition-maintenance:activation-utility-exploration:missing_evidence"
    ]);
    expect(result.reviewEvalClosure.evidenceRefs).toEqual([
      evidenceRef,
      "review-evidence/controlled-dogfood/2026-07-01-imr-35-activation-utility-heartbeat-routing/REPORT.md"
    ]);
    expect(result.reviewEvalClosure.forbiddenWrites).toContain("eval_candidates");
    expect(result.manualCandidateRouting.forbiddenWrites).toContain("maintenance_queue_records");
    expect(result.mutation).toBe("none");
  });

  test("routes consensus relation review through candidate-only maintenance readback", () => {
    const result = buildMaintenancePreview({
      now,
      evidenceRef,
      memoryRecords: [],
      sourceClaims: [],
      sourceClaimEdges: [],
      consensusCandidates: [
        {
          candidateId: "consensus-duplicate-source-relation",
          candidateKind: "source_decision_candidate",
          summary: "Duplicate source relation should stay reviewable before consolidation.",
          applicationGuidance:
            "Review the duplicate relation before suppressing either source claim.",
          relationReview: {
            sourceClaimEdgeId: "source-claim-edge-1",
            edgeKind: "duplicates",
            relationReviewFocus: "duplicate",
            relationReviewQuestion:
              "Review whether these claims are true duplicates before consolidation."
          },
          evidence: [
            {
              id: "support-1",
              position: "support",
              summary: "The source edge carries reviewed duplicate focus.",
              evidenceRef,
              doesNotProve: "This does not prove source truth."
            },
            {
              id: "dissent-1",
              position: "dissent",
              summary: "The claims may only partially overlap.",
              evidenceRef: "review-evidence/controlled-dogfood/relation-dissent.md",
              doesNotProve: "This does not prove the relation is wrong."
            }
          ]
        }
      ]
    });

    expect(result.candidateCounts).toEqual({
      memoryStaleness: 0,
      sourceRelation: 0,
      knowledgeAcquisition: 0,
      consensusEvaluation: 1
    });
    expect(result.skippedCounts.consensusCandidates).toBe(0);
    expect(result.reviewEvalClosure).toMatchObject({
      decision: "ready_for_behavior_proof",
      candidateIds: ["consensus-candidate-evaluation:consensus-duplicate-source-relation"],
      mutation: "none"
    });
    expect(result.manualCandidateRouting).toMatchObject({
      status: "ready_for_operator_review",
      inspectedCandidates: 1,
      reviewableCandidates: 1,
      mutation: "none"
    });
    expect(result.consensusEvaluation?.evaluations[0]?.relationReview).toMatchObject({
      sourceClaimEdgeId: "source-claim-edge-1",
      edgeKind: "duplicates",
      relationReviewFocus: "duplicate",
      consumedBy: "consensus_candidate_evaluation_preview",
      reviewUsefulness: "used"
    });
    expect(result.candidates[0]).toMatchObject({
      kind: "consensus_candidate_evaluation_preview",
      reviewability: "ready",
      mutation: "none"
    });
  });

  test("aggregates memory staleness and source relation candidates without mutation", () => {
    const result = buildMaintenancePreview({
      now,
      evidenceRef,
      memoryRecords: [
        memoryRecord("memory-expired", {
          validUntil: "2026-06-29T00:00:00.000Z"
        })
      ],
      sourceClaims: [
        sourceClaim("source-claim-1"),
        sourceClaim("source-claim-2")
      ],
      sourceClaimEdges: [sourceClaimEdge()]
    });

    expect(result.mutation).toBe("none");
    expect(result.doesNotProve).toContain("Memory Core mutation");
    expect(result.proof).toContain("candidate-only maintenance previews");
    expect(result.priorityOrder).toEqual([
      "memory_staleness",
      "source_relation",
      "knowledge_acquisition",
      "consensus_evaluation"
    ]);
    expect(result.forbiddenWrites).toEqual([
      "memory_records",
      "anti_memory_records",
      "source_claims",
      "source_decisions",
      "source_claim_edges"
    ]);
    expect(result.candidateCounts).toEqual({
      memoryStaleness: 1,
      sourceRelation: 1,
      knowledgeAcquisition: 0,
      consensusEvaluation: 0
    });
    expect(result.reviewEvalClosure).toMatchObject({
      decision: "ready_for_behavior_proof",
      nextAction: "add_golden_behavior_case",
      mutation: "none"
    });
    expect(result.reviewEvalClosure.candidateIds).toEqual([
      `memory-staleness-maintenance:memory-expired:expired_memory`,
      "source-relation-maintenance:source-claim-edge-1:relation_needs_review"
    ]);
    expect(result.reviewEvalClosure.evidenceRefs).toEqual([evidenceRef]);
    expect(result.reviewEvalClosure.doesNotProve).toContain("scheduler readiness");
    expect(result.reviewEvalClosure.forbiddenWrites).toEqual([
      "memory_records",
      "anti_memory_records",
      "source_claims",
      "source_decisions",
      "source_claim_edges",
      "eval_candidates"
    ]);
    expect(result.candidates.map((candidate) => candidate.kind)).toEqual([
      "memory_staleness_maintenance_candidate",
      "source_relation_maintenance_candidate"
    ]);
    expect(result.candidates).toEqual([
      expect.objectContaining({
        reviewability: "ready",
        mutation: "none",
        evidenceRefs: expect.arrayContaining([evidenceRef])
      }),
      expect.objectContaining({
        reviewability: "ready",
        mutation: "none",
        evidenceRefs: expect.arrayContaining([evidenceRef])
      })
    ]);
  });

  test("records one manual maintenance candidate review result without mutation", () => {
    const candidateId = "source-relation-maintenance:source-claim-edge-1:relation_needs_review";
    const result = buildMaintenancePreview({
      now,
      evidenceRef,
      memoryRecords: [],
      sourceClaims: [
        sourceClaim("source-claim-1"),
        sourceClaim("source-claim-2")
      ],
      sourceClaimEdges: [sourceClaimEdge()],
      candidateReview: {
        candidateId,
        decision: "defer_pending_evidence",
        reason: "Relation evidence refs are empty in the current maintenance candidate.",
        evidenceRef:
          "review-evidence/controlled-dogfood/2026-06-30-v373-heartbeat-runtime-candidate-review-result/REPORT.md",
        reviewer: "krn-operator"
      }
    });

    expect(result.candidateReviewResult).toEqual({
      kind: "maintenance_candidate_review_result",
      candidateId,
      candidateFound: true,
      decision: "defer_pending_evidence",
      nextAction: "request_more_candidate_evidence",
      reason: "Relation evidence refs are empty in the current maintenance candidate.",
      reviewer: "krn-operator",
      evidenceRefs: [
        "review-evidence/controlled-dogfood/2026-06-30-v373-heartbeat-runtime-candidate-review-result/REPORT.md"
      ],
      candidateReviewability: "ready",
      mutation: "none",
      doesNotProve:
        "Maintenance candidate review result does not prove candidate truth, source truth, promotion readiness, scheduler readiness, maintenance daemon readiness, or Memory Core mutation.",
      forbiddenWrites: [
        "memory_records",
        "anti_memory_records",
        "source_claims",
        "source_decisions",
        "source_claim_edges",
        "eval_candidates",
        "maintenance_queue_records"
      ]
    });
    expect(result.mutation).toBe("none");
  });

  test("applies one global candidate budget with memory staleness first", () => {
    const result = buildMaintenancePreview({
      now,
      evidenceRef,
      maxCandidates: 1,
      memoryRecords: [
        memoryRecord("memory-expired", {
          validUntil: "2026-06-29T00:00:00.000Z"
        })
      ],
      sourceClaims: [
        sourceClaim("source-claim-1"),
        sourceClaim("source-claim-2")
      ],
      sourceClaimEdges: [sourceClaimEdge()]
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.kind).toBe("memory_staleness_maintenance_candidate");
    expect(result.candidateCounts).toEqual({
      memoryStaleness: 1,
      sourceRelation: 0,
      knowledgeAcquisition: 0,
      consensusEvaluation: 0
    });
    expect(result.skippedCounts).toEqual({
      memoryRecords: 0,
      sourceClaimEdges: 1,
      knowledgeAcquisitionRequests: 0,
      consensusCandidates: 0
    });
  });

  test("aggregates missing-evidence acquisition candidates without mutation", () => {
    const result = buildMaintenancePreview({
      now,
      evidenceRef,
      memoryRecords: [],
      sourceClaims: [],
      sourceClaimEdges: [],
      knowledgeAcquisitionRequests: [
        {
          id: "ama-missing-evidence",
          source: "memory_search",
          query: "Autonomous Memory Agents acquisition escalation",
          missingEvidence: ["candidate-only acquisition lane"],
          evidenceRefs: ["KRN_ROADMAP.md#research-intake"],
          consumer: "maintenance preview candidate review loop",
          falsifier: "Missing-evidence readback cannot create a reviewable candidate.",
          doesNotProve:
            "This does not prove autonomous maintenance execution or Memory Core mutation safety."
        }
      ]
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        id: "knowledge-acquisition-maintenance:ama-missing-evidence:missing_evidence",
        kind: "knowledge_acquisition_candidate",
        action: "propose_knowledge_acquisition",
        reviewability: "ready",
        mutation: "none"
      })
    ]);
    expect(result.candidateCounts).toEqual({
      memoryStaleness: 0,
      sourceRelation: 0,
      knowledgeAcquisition: 1,
      consensusEvaluation: 0
    });
    expect(result.skippedCounts).toEqual({
      memoryRecords: 0,
      sourceClaimEdges: 0,
      knowledgeAcquisitionRequests: 0,
      consensusCandidates: 0
    });
    expect(result.reviewEvalClosure).toMatchObject({
      decision: "ready_for_behavior_proof",
      nextAction: "add_golden_behavior_case",
      mutation: "none"
    });
    expect(result.manualCandidateRouting).toMatchObject({
      mode: "manual_candidate_only",
      status: "ready_for_operator_review",
      reviewableCandidates: 1,
      mutation: "none"
    });
  });

  test("returns an empty candidate-only preview for healthy inputs", () => {
    const result = buildMaintenancePreview({
      now,
      evidenceRef,
      memoryRecords: [
        memoryRecord("memory-healthy", {
          validUntil: "2026-08-01T00:00:00.000Z"
        })
      ],
      sourceClaims: [
        sourceClaim("source-claim-1"),
        sourceClaim("source-claim-2")
      ],
      sourceClaimEdges: [
        sourceClaimEdge({
          kind: "supports"
        })
      ]
    });

    expect(result.candidates).toEqual([]);
    expect(result.candidateCounts).toEqual({
      memoryStaleness: 0,
      sourceRelation: 0,
      knowledgeAcquisition: 0,
      consensusEvaluation: 0
    });
    expect(result.skippedCounts).toEqual({
      memoryRecords: 1,
      sourceClaimEdges: 1,
      knowledgeAcquisitionRequests: 0,
      consensusCandidates: 0
    });
    expect(result.mutation).toBe("none");
    expect(result.reviewEvalClosure).toMatchObject({
      decision: "no_reviewable_candidates",
      nextAction: "seed_or_select_maintenance_candidate_state",
      mutation: "none"
    });
    expect(result.manualCandidateRouting).toMatchObject({
      mode: "manual_candidate_only",
      status: "no_candidates",
      nextAction: "seed_or_select_maintenance_candidate_state",
      inspectedCandidates: 0,
      reviewableCandidates: 0,
      mutation: "none"
    });
    expect(result.manualCandidateRouting.forbiddenWrites).toContain("maintenance_queue_records");
  });
});
