import type {
  SourceArtifactId,
  SourceClaim,
  SourceClaimEdge,
  SourceClaimId
} from "@krn/core";
import { describe, expect, test } from "vitest";

import {
  buildSourceRelationHeartbeatPreview
} from "./sourceRelationHeartbeatPreview.js";

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
    expect(result.candidates[0]?.relationEvidenceRefs).toEqual([
      "docs/reviews/controlled-dogfood/v336/REPORT.md"
    ]);
    expect(result.candidates[0]?.relationEvidenceRequest).toBe(
      "Review listed SourceClaimEdge evidenceRefs before accepting relation maintenance."
    );
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
