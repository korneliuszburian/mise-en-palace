import { describe, expect, test } from "vitest";

import {
  buildKnowledgeAcquisitionMaintenancePreview
} from "../knowledge-acquisition-maintenance-preview.js";

const now = "2026-06-30T21:10:00.000Z";
const evidenceRef =
  "review-evidence/controlled-dogfood/2026-06-30-imr-05-store-backed-pattern-gate-ama/REPORT.md";

describe("knowledge acquisition maintenance preview", () => {
  test("turns missing-evidence readback into a reviewable candidate without mutation", () => {
    const result = buildKnowledgeAcquisitionMaintenancePreview({
      now,
      evidenceRef,
      requests: [
        {
          id: "ama-missing-evidence",
          source: "brain_search",
          query: "Autonomous Memory Agents acquisition escalation",
          missingEvidence: [
            "source-search missing evidence should produce acquisition candidates",
            "candidate-only maintenance/dreaming behavior needs a local falsifier"
          ],
          evidenceRefs: [
            "KRN_ROADMAP.md#research-intake"
          ],
          consumer: "maintenance/dreaming candidate runtime",
          falsifier:
            "A missing-evidence run cannot create a reviewable acquisition candidate.",
          doesNotProve:
            "This candidate does not prove source truth, autonomous maintenance runtime readiness, or Memory Core mutation safety."
        }
      ]
    });

    expect(result.mutation).toBe("none");
    expect(result.proof).toContain("candidate-only acquisition work");
    expect(result.doesNotProve).toContain("crawler readiness");
    expect(result.candidates).toEqual([
      expect.objectContaining({
        id: "knowledge-acquisition-maintenance:ama-missing-evidence:missing_evidence",
        kind: "knowledge_acquisition_candidate",
        action: "propose_knowledge_acquisition",
        reason: "missing_evidence",
        requestId: "ama-missing-evidence",
        source: "brain_search",
        reviewability: "ready",
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
    expect(result.candidates[0]?.missingEvidence).toEqual([
      "source-search missing evidence should produce acquisition candidates",
      "candidate-only maintenance/dreaming behavior needs a local falsifier"
    ]);
    expect(result.candidates[0]?.reviewabilityReasons).toEqual([
      "Candidate has review evidence, application guidance, and doesNotProve boundary."
    ]);
    expect(result.candidates[0]?.evidenceRefs).toEqual([
      evidenceRef,
      "KRN_ROADMAP.md#research-intake"
    ]);
    expect(result.candidates[0]?.applicationGuidance).toContain(
      "before creating source claims"
    );
    expect(result.candidates[0]?.acquisitionEvidenceRequest).toContain(
      "Preserve source, mechanism, KRN implication, consumer, falsifier, and doesNotProve"
    );
    expect(result.candidates[0]?.acquisitionEscalationPreview).toEqual([
      expect.objectContaining({
        order: 1,
        source: "source_search_review",
        cost: "low"
      }),
      expect.objectContaining({
        order: 2,
        source: "bounded_external_research",
        cost: "medium"
      }),
      expect.objectContaining({
        order: 3,
        source: "human_review",
        cost: "high"
      })
    ]);
  });

  test("carries query diagnostics and recommended follow-up into acquisition candidates", () => {
    const result = buildKnowledgeAcquisitionMaintenancePreview({
      now,
      evidenceRef,
      requests: [
        {
          id: "diagnostic-request",
          source: "source_search",
          query: "broad graph query",
          missingEvidence: ["included SearchDocument evidence"],
          queryShapeDiagnostics: [
            "split broad queries into narrower topic-specific searches before changing ranking"
          ],
          recommendedFollowUp: [
            "run source search against the narrower acquisition topic"
          ],
          evidenceRefs: [evidenceRef],
          consumer: "maintenance/dreaming candidate runtime",
          falsifier: "Diagnostics should be visible on the candidate.",
          doesNotProve: "This does not prove acquisition quality."
        }
      ]
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        queryShapeDiagnostics: [
          "split broad queries into narrower topic-specific searches before changing ranking"
        ],
        recommendedFollowUp: [
          "run source search against the narrower acquisition topic"
        ],
        acquisitionEvidenceRequest: expect.stringContaining(
          "run source search against the narrower acquisition topic"
        ),
        mutation: "none"
      })
    ]);
  });

  test("preserves source artifact preview acquisition source", () => {
    const result = buildKnowledgeAcquisitionMaintenancePreview({
      now,
      evidenceRef,
      requests: [
        {
          id: "source-artifact-preview",
          source: "source_artifact_preview",
          query: "docs/source.md",
          missingEvidence: [
            "persisted source/search readback for source artifact preview docs/source.md"
          ],
          queryShapeDiagnostics: [
            "access: local_preview",
            "chunks: 1",
            "searchDocumentCandidate: candidate"
          ],
          evidenceRefs: [
            "docs/source.md",
            "sha256:source-artifact"
          ],
          consumer: "maintenance knowledge acquisition preview",
          falsifier:
            "A source artifact preview JSON file without artifact/chunk/candidate/readback state should not produce a reviewable acquisition request.",
          doesNotProve:
            "source artifact preview does not prove source truth or Memory Core mutation"
        }
      ]
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        source: "source_artifact_preview",
        query: "docs/source.md",
        queryShapeDiagnostics: [
          "access: local_preview",
          "chunks: 1",
          "searchDocumentCandidate: candidate"
        ],
        reviewability: "ready",
        mutation: "none"
      })
    ]);
  });

  test("preserves linked document evidence in acquisition candidates", () => {
    const result = buildKnowledgeAcquisitionMaintenancePreview({
      now,
      evidenceRef,
      requests: [
        {
          id: "linked-document-request",
          source: "brain_search",
          query: "artifact-linked source claims",
          missingEvidence: ["included SearchDocument evidence"],
          linkedDocumentEvidence: {
            sourceClaimDocumentLinks: 5,
            linkedSearchDocuments: 5,
            caveats: [
              "artifact-linked SearchDocuments were visible but not included by lexical retrieval"
            ]
          },
          evidenceRefs: [evidenceRef],
          consumer: "maintenance/dreaming candidate runtime",
          falsifier: "Linked document evidence should be visible on the acquisition candidate.",
          doesNotProve: "This does not prove source truth."
        }
      ]
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        linkedDocumentEvidence: {
          sourceClaimDocumentLinks: 5,
          linkedSearchDocuments: 5,
          caveats: [
            "artifact-linked SearchDocuments were visible but not included by lexical retrieval"
          ]
        },
        acquisitionEvidenceRequest: expect.stringContaining(
          "Review linked document evidence before opening new acquisition: 5 source-claim document link(s), 5 linked SearchDocument(s)."
        ),
        acquisitionEscalationPreview: [
          expect.objectContaining({
            order: 1,
            source: "linked_document_review",
            cost: "low"
          }),
          expect.objectContaining({
            order: 2,
            source: "source_search_review",
            cost: "low"
          }),
          expect.objectContaining({
            order: 3,
            source: "bounded_external_research",
            cost: "medium"
          }),
          expect.objectContaining({
            order: 4,
            source: "human_review",
            cost: "high"
          })
        ],
        mutation: "none"
      })
    ]);
  });

  test("preserves activation utility evidence in acquisition candidates", () => {
    const result = buildKnowledgeAcquisitionMaintenancePreview({
      now,
      evidenceRef,
      requests: [
        {
          id: "activation-utility-request",
          source: "brain_search",
          query: "Autonomous Memory Agents exploration",
          missingEvidence: ["selected knowledge is missing while linked evidence is useful"],
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
                "answerUsefulness is useful.",
                "source/link/graph evidence count is 12."
              ]
            },
            recommendedNextAction:
              "Review linked source/graph evidence as exploration context before treating missing selected knowledge as low utility.",
            doesNotProve:
              "Activation utility readback does not prove ranking quality or product readiness."
          },
          evidenceRefs: [evidenceRef],
          consumer: "maintenance/dreaming candidate runtime",
          falsifier: "Activation utility exploration evidence should be visible on the candidate.",
          doesNotProve: "This does not prove source truth."
        }
      ]
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
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
              "answerUsefulness is useful.",
              "source/link/graph evidence count is 12."
            ]
          },
          recommendedNextAction:
            "Review linked source/graph evidence as exploration context before treating missing selected knowledge as low utility.",
          doesNotProve:
            "Activation utility readback does not prove ranking quality or product readiness."
        },
        acquisitionEvidenceRequest: expect.stringContaining(
          "Activation utility readback: linked_evidence_exploration_candidate; selectedKnowledge=missing; sourceLinkGraph=useful."
        ),
        reviewability: "ready",
        mutation: "none"
      })
    ]);
  });

  test("keeps weak acquisition requests as needs_more_evidence", () => {
    const result = buildKnowledgeAcquisitionMaintenancePreview({
      now,
      evidenceRef,
      requests: [
        {
          id: "weak-request",
          source: "source_search",
          query: "weak source search",
          missingEvidence: ["missing source document"],
          evidenceRefs: [],
          consumer: "",
          falsifier: "",
          doesNotProve: "This does not prove acquisition quality."
        }
      ]
    });

    expect(result.candidates[0]).toEqual(
      expect.objectContaining({
        reviewability: "needs_more_evidence",
        mutation: "none"
      })
    );
    expect(result.candidates[0]?.reviewabilityReasons).toEqual([
      "Missing fields: consumer, falsifier."
    ]);
  });

  test("requires an acquisition query before candidate review", () => {
    const result = buildKnowledgeAcquisitionMaintenancePreview({
      now,
      evidenceRef,
      requests: [
        {
          id: "blank-query-request",
          source: "source_search",
          query: "   ",
          missingEvidence: ["missing source document"],
          evidenceRefs: [evidenceRef],
          consumer: "maintenance/dreaming candidate runtime",
          falsifier: "Blank acquisition queries should not be review-ready.",
          doesNotProve: "This does not prove acquisition quality."
        }
      ]
    });

    expect(result.candidates[0]).toEqual(
      expect.objectContaining({
        reviewability: "needs_more_evidence",
        mutation: "none"
      })
    );
    expect(result.candidates[0]?.reviewabilityReasons).toEqual([
      "Missing fields: query."
    ]);
  });

  test("skips requests without missing evidence", () => {
    const result = buildKnowledgeAcquisitionMaintenancePreview({
      now,
      evidenceRef,
      requests: [
        {
          id: "complete-readback",
          source: "source_search",
          query: "complete source search",
          missingEvidence: [],
          evidenceRefs: [evidenceRef],
          consumer: "maintenance/dreaming candidate runtime",
          falsifier: "Missing-evidence input should be required.",
          doesNotProve: "This does not prove retrieval quality."
        }
      ]
    });

    expect(result.candidates).toEqual([]);
    expect(result.skippedRequestCount).toBe(1);
    expect(result.mutation).toBe("none");
  });
});
