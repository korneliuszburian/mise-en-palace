import type {
  SourceArtifactId,
  SourceClaim,
  SourceClaimEdge,
  SourceClaimId
} from "@krn/core";
import { describe, expect, test } from "vitest";

import {
  buildSourceRelationHeartbeatPreview
} from "../sourceRelationHeartbeatPreview.js";

const now = "2026-06-29T04:30:00.000Z";

const sourceClaim = (
  id: string,
  overrides: Partial<SourceClaim> = {}
): SourceClaim => ({
  id: id as SourceClaimId,
  sourceArtifactId: "source-artifact-1" as SourceArtifactId,
  claim: `Claim ${id}`,
  mechanism: "A bounded source claim carries mechanism for graph maintenance preview.",
  krnImplication: "Use this claim only as relation preview input.",
  doesNotProve: "This source claim does not prove source truth.",
  trustTier: "project-decision",
  supportType: "mechanism",
  consumer: "source relation heartbeat preview test",
  status: "accepted",
  metadata: {},
  createdAt: "2026-06-29T04:00:00.000Z",
  updatedAt: "2026-06-29T04:00:00.000Z",
  ...overrides
});

const sourceClaimEdge = (
  overrides: Partial<SourceClaimEdge> = {}
): SourceClaimEdge => ({
  id: "source-claim-edge-1",
  fromSourceClaimId: "source-claim-1" as SourceClaimId,
  toSourceClaimId: "source-claim-2" as SourceClaimId,
  kind: "contradicts",
  metadata: {
    consumer: "source relation heartbeat preview test",
    doesNotProve: "This edge does not prove source truth.",
    evidenceRefs: ["docs/reviews/controlled-dogfood/v336/REPORT.md"]
  },
  createdAt: "2026-06-29T04:10:00.000Z",
  ...overrides
});

describe("source relation heartbeat preview", () => {
  test("proposes a reviewable candidate for maintenance-class source relations without mutation", () => {
    const result = buildSourceRelationHeartbeatPreview({
      now,
      sourceClaims: [
        sourceClaim("source-claim-1"),
        sourceClaim("source-claim-2")
      ],
      sourceClaimEdges: [sourceClaimEdge()],
      evidenceRef: "docs/reviews/controlled-dogfood/2026-06-29-v337-source-relation-heartbeat-candidate-preview/REPORT.md"
    });

    expect(result.mutation).toBe("none");
    expect(result.doesNotProve).toContain("autonomous worker execution");
    expect(result.candidates).toEqual([
      expect.objectContaining({
        id: "source-relation-heartbeat:source-claim-edge-1:relation_needs_review",
        kind: "source_relation_maintenance_candidate",
        action: "review_source_relation",
        reason: "relation_needs_review",
        relationReviewFocus: "contradiction",
        relationReviewQuestion:
          "Review whether this edge represents a real contradiction before changing source truth or downstream activation.",
        reviewability: "ready",
        mutation: "none",
        forbiddenWrites: [
          "memory_records",
          "source_claims",
          "source_decisions",
          "source_claim_edges"
        ]
      })
    ]);
    expect(result.candidates[0]?.reviewabilityReasons).toEqual([
      "Candidate has review evidence, application guidance, and doesNotProve boundary."
    ]);
    expect(result.candidates[0]?.evidenceRefs).toContain(
      "docs/reviews/controlled-dogfood/2026-06-29-v337-source-relation-heartbeat-candidate-preview/REPORT.md"
    );
    expect(result.candidates[0]?.summary).toBe(
      "Review contradiction SourceClaimEdge source-claim-edge-1 between source-claim-1 and source-claim-2."
    );
    expect(result.candidates[0]?.applicationGuidance).toContain(
      "real contradiction"
    );
    expect(result.candidates[0]?.relationEvidenceRefs).toEqual([
      "docs/reviews/controlled-dogfood/v336/REPORT.md"
    ]);
    expect(result.candidates[0]?.relationEvidenceRequest).toBe(
      "Review listed SourceClaimEdge evidenceRefs before accepting relation maintenance."
    );
  });

  test("distinguishes duplicate source relations from generic relation maintenance", () => {
    const result = buildSourceRelationHeartbeatPreview({
      now,
      sourceClaims: [
        sourceClaim("source-claim-1"),
        sourceClaim("source-claim-2")
      ],
      sourceClaimEdges: [
        sourceClaimEdge({
          kind: "duplicates"
        })
      ],
      evidenceRef: "docs/reviews/controlled-dogfood/2026-07-01-gcr-01-graph-contradiction-duplicate-candidates/REPORT.md"
    });

    expect(result.candidates[0]).toEqual(
      expect.objectContaining({
        action: "review_source_relation",
        reason: "relation_needs_review",
        edgeKind: "duplicates",
        relationReviewFocus: "duplicate",
        relationReviewQuestion:
          "Review whether these claims are true duplicates before consolidation, suppression, or source truth changes.",
        summary:
          "Review duplicate SourceClaimEdge source-claim-edge-1 between source-claim-1 and source-claim-2.",
        mutation: "none",
        reviewability: "ready"
      })
    );
  });

  test("normalizes singular and plural relation evidence refs before candidate review", () => {
    const result = buildSourceRelationHeartbeatPreview({
      now,
      sourceClaims: [
        sourceClaim("source-claim-1"),
        sourceClaim("source-claim-2")
      ],
      sourceClaimEdges: [
        sourceClaimEdge({
          metadata: {
            consumer: " source relation heartbeat preview test ",
            doesNotProve: " This edge does not prove source truth. ",
            evidenceRef: " docs/reviews/source-edge-a.md ",
            evidenceRefs: [
              "docs/reviews/source-edge-a.md",
              " docs/reviews/source-edge-b.md ",
              "",
              12
            ]
          }
        })
      ],
      evidenceRef: "docs/reviews/controlled-dogfood/2026-06-29-v337-source-relation-heartbeat-candidate-preview/REPORT.md"
    });

    expect(result.candidates[0]?.relationEvidenceRefs).toEqual([
      "docs/reviews/source-edge-a.md",
      "docs/reviews/source-edge-b.md"
    ]);
    expect(result.candidates[0]?.evidenceRefs).toEqual([
      "docs/reviews/controlled-dogfood/2026-06-29-v337-source-relation-heartbeat-candidate-preview/REPORT.md",
      "docs/reviews/source-edge-a.md",
      "docs/reviews/source-edge-b.md"
    ]);
    expect(result.candidates[0]?.relationEvidenceRequest).toBe(
      "Review listed SourceClaimEdge evidenceRefs before accepting relation maintenance."
    );
    expect(result.candidates[0]?.reviewability).toBe("ready");
  });

  test("prioritizes stale connected claims before relation-kind maintenance", () => {
    const result = buildSourceRelationHeartbeatPreview({
      now,
      sourceClaims: [
        sourceClaim("source-claim-1", {
          revisitWhen: "2026-06-28T00:00:00.000Z"
        }),
        sourceClaim("source-claim-2")
      ],
      sourceClaimEdges: [sourceClaimEdge()],
      evidenceRef: "docs/reviews/controlled-dogfood/2026-06-29-v337-source-relation-heartbeat-candidate-preview/REPORT.md"
    });

    expect(result.candidates[0]).toEqual(
      expect.objectContaining({
        action: "review_stale_connected_claim",
        reason: "connected_claim_is_stale",
        relationReviewFocus: "stale_connected_claim",
        reviewability: "ready"
      })
    );
  });

  test("flags weak relation evidence but does not create source truth", () => {
    const result = buildSourceRelationHeartbeatPreview({
      now,
      sourceClaims: [
        sourceClaim("source-claim-1"),
        sourceClaim("source-claim-2")
      ],
      sourceClaimEdges: [
        sourceClaimEdge({
          kind: "supports",
          metadata: {}
        })
      ],
      evidenceRef: "docs/reviews/controlled-dogfood/2026-06-29-v337-source-relation-heartbeat-candidate-preview/REPORT.md"
    });

    expect(result.candidates[0]).toEqual(
      expect.objectContaining({
        action: "review_relation_evidence",
        reason: "relation_evidence_is_weak",
        relationReviewFocus: "relation_evidence",
        mutation: "none",
        reviewability: "needs_more_evidence"
      })
    );
    expect(result.candidates[0]?.reviewabilityReasons).toContain(
      "Missing fields: relationEvidenceRefs."
    );
    expect(result.candidates[0]?.relationEvidenceRefs).toEqual([]);
    expect(result.candidates[0]?.relationEvidenceRequest).toBe(
      "Capture concrete SourceClaimEdge evidenceRefs before accepting relation maintenance."
    );
  });

  test("skips healthy background relations", () => {
    const result = buildSourceRelationHeartbeatPreview({
      now,
      sourceClaims: [
        sourceClaim("source-claim-1"),
        sourceClaim("source-claim-2")
      ],
      sourceClaimEdges: [
        sourceClaimEdge({
          kind: "supports"
        })
      ],
      evidenceRef: "docs/reviews/controlled-dogfood/2026-06-29-v337-source-relation-heartbeat-candidate-preview/REPORT.md"
    });

    expect(result.candidates).toEqual([]);
    expect(result.skippedEdgeCount).toBe(1);
  });

  test("honors maxCandidates zero without proposing maintenance work", () => {
    const result = buildSourceRelationHeartbeatPreview({
      now,
      sourceClaims: [
        sourceClaim("source-claim-1"),
        sourceClaim("source-claim-2")
      ],
      sourceClaimEdges: [sourceClaimEdge()],
      evidenceRef: "docs/reviews/controlled-dogfood/2026-06-29-v337-source-relation-heartbeat-candidate-preview/REPORT.md",
      maxCandidates: 0
    });

    expect(result.candidates).toEqual([]);
    expect(result.skippedEdgeCount).toBe(1);
    expect(result.mutation).toBe("none");
  });
});
