import { describe, expect, test } from "vitest";

import {
  buildKnowledgeAcquisitionHeartbeatPreview
} from "./knowledgeAcquisitionHeartbeatPreview.js";

const now = "2026-06-30T21:10:00.000Z";
const evidenceRef =
  "docs/reviews/controlled-dogfood/2026-06-30-imr-05-store-backed-pattern-gate-ama/REPORT.md";

describe("knowledge acquisition heartbeat preview", () => {
  test("turns missing-evidence readback into a reviewable candidate without mutation", () => {
    const result = buildKnowledgeAcquisitionHeartbeatPreview({
      now,
      evidenceRef,
      requests: [
        {
          id: "ama-missing-evidence",
          source: "brain_search",
          query: "Autonomous Memory Agents acquisition escalation",
          missingEvidence: [
            "source-search missing evidence should produce acquisition candidates",
            "candidate-only heartbeat/dreaming behavior needs a local falsifier"
          ],
          evidenceRefs: [
            "docs/KRN_SOURCES.md#towards-autonomous-memory-agents"
          ],
          consumer: "heartbeat/dreaming candidate runtime",
          falsifier:
            "A missing-evidence run cannot create a reviewable acquisition candidate.",
          doesNotProve:
            "This candidate does not prove source truth, autonomous worker readiness, or Memory Core mutation safety."
        }
      ]
    });

    expect(result.mutation).toBe("none");
    expect(result.proof).toContain("candidate-only acquisition work");
    expect(result.doesNotProve).toContain("crawler readiness");
    expect(result.candidates).toEqual([
      expect.objectContaining({
        id: "knowledge-acquisition-heartbeat:ama-missing-evidence:missing_evidence",
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
          "worker_jobs"
        ]
      })
    ]);
    expect(result.candidates[0]?.missingEvidence).toEqual([
      "source-search missing evidence should produce acquisition candidates",
      "candidate-only heartbeat/dreaming behavior needs a local falsifier"
    ]);
    expect(result.candidates[0]?.reviewabilityReasons).toEqual([
      "Candidate has review evidence, application guidance, and doesNotProve boundary."
    ]);
    expect(result.candidates[0]?.evidenceRefs).toEqual([
      evidenceRef,
      "docs/KRN_SOURCES.md#towards-autonomous-memory-agents"
    ]);
    expect(result.candidates[0]?.applicationGuidance).toContain(
      "before creating source claims"
    );
    expect(result.candidates[0]?.acquisitionEvidenceRequest).toContain(
      "Preserve source, mechanism, KRN implication, consumer, falsifier, and doesNotProve"
    );
  });

  test("carries query diagnostics and recommended follow-up into acquisition candidates", () => {
    const result = buildKnowledgeAcquisitionHeartbeatPreview({
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
          consumer: "heartbeat/dreaming candidate runtime",
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

  test("keeps weak acquisition requests as needs_more_evidence", () => {
    const result = buildKnowledgeAcquisitionHeartbeatPreview({
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

  test("skips requests without missing evidence", () => {
    const result = buildKnowledgeAcquisitionHeartbeatPreview({
      now,
      evidenceRef,
      requests: [
        {
          id: "complete-readback",
          source: "source_search",
          query: "complete source search",
          missingEvidence: [],
          evidenceRefs: [evidenceRef],
          consumer: "heartbeat/dreaming candidate runtime",
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
