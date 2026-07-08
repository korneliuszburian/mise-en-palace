import { describe, expect, expectTypeOf, test } from "vitest";

import {
  assessSourceClaimAuthority,
  assessSourceClaimOverride,
  assessSourceClaimReviewSignals,
  assessSourceClaimTemporalValidity,
  assessSourceDecisionReviewSignals,
  assessSourceSupportType,
  buildSourceConsensusTimelineReadback,
  classifySourceAuthority,
  classifySourceClaimTaxonomy,
  decisionGradeSourceSupportTypes,
  isSourceClaimTemporallyValid,
  rankSourceAuthority,
  readSourceRelationMetadataReadback,
  relatedSourceClaimIdForEdge,
  sourceSupportTypes,
  sourceAuthorityLabels,
  type SourceClaimCreateStatus,
  type SourceClaimEdge,
  type SourceClaimLifecycleStatus,
  type SourceClaim,
  type SourceDecision,
  type SourceDecisionEdge,
  type SourceRejection
} from "../source.js";

const now = "2026-06-24T08:00:00.000Z";

const sourceClaim = (overrides: Partial<SourceClaim>): SourceClaim => ({
  id: "source-claim-1",
  sourceArtifactId: "source-artifact-1",
  claim: "KRN source decisions must stay source grounded.",
  mechanism: "Source claims map evidence into concrete KRN behavior.",
  krnImplication: "KRN must reject decorative source claims before activation.",
  doesNotProve: "This does not prove source retrieval quality.",
  sourceAuthority: "project-decision",
  supportType: "implementation-boundary",
  consumer: "C6-00 source review signal",
  falsifier: "Decorative source claims can guide activation.",
  status: "accepted",
  metadata: {},
  createdAt: "2026-06-23T08:00:00.000Z",
  updatedAt: "2026-06-23T08:00:00.000Z",
  ...overrides
});

const sourceDecision = (overrides: Partial<SourceDecision>): SourceDecision => ({
  id: "source-decision-1",
  sourceClaimId: "source-claim-1",
  status: "adopt",
  decision: "Adopt source review signals.",
  rationale: "They move retained audit invariants into pure source domain logic.",
  falsifier: "Source decisions can be retained without falsifiers.",
  consumer: "C6-00 source review signal",
  metadata: {},
  createdAt: "2026-06-23T08:00:00.000Z",
  updatedAt: "2026-06-23T08:00:00.000Z",
  ...overrides
});

const sourceClaimEdge = (
  overrides: Partial<SourceClaimEdge>
): SourceClaimEdge => ({
  id: "source-claim-edge-1",
  fromSourceClaimId: "source-claim-1",
  toSourceClaimId: "source-claim-2",
  kind: "supports",
  metadata: {},
  createdAt: "2026-06-23T08:00:00.000Z",
  ...overrides
});

const sourceDecisionEdge = (
  overrides: Partial<SourceDecisionEdge>
): SourceDecisionEdge => ({
  id: "source-decision-edge-1",
  sourceClaimId: "source-claim-1",
  targetType: "architecture_decision",
  targetId: "KRN_ROADMAP.md#phase-5",
  supportType: "decision",
  confidence: "high",
  notes: "Decision-linked source support.",
  metadata: {},
  createdAt: "2026-06-23T08:00:00.000Z",
  ...overrides
});

const sourceRejection = (
  overrides: Partial<SourceRejection>
): SourceRejection => ({
  id: "source-rejection-1",
  sourceClaimId: "source-claim-1",
  title: "Rejected source claim",
  attemptedClaim: "A rejected claim should not become authority.",
  rejectedBecause: "conflicting",
  reason: "A stronger accepted claim superseded it.",
  doesNotProve: "This rejection does not prove corpus completeness.",
  consumer: "source consensus timeline readback",
  metadata: {},
  rejectedAt: "2026-06-23T08:00:00.000Z",
  ...overrides
});

describe("source review signals", () => {
  test("source relation metadata readback trims known keys and proof boundaries", () => {
    expect(readSourceRelationMetadataReadback({
      consumer: " graph brain ",
      doesNotProve: " relation metadata does not prove source truth ",
      evidenceRef: " review-evidence/source-edge-a.md ",
      evidenceRefs: [
        "review-evidence/source-edge-a.md",
        " review-evidence/source-edge-b.md ",
        "",
        " ",
        42
      ],
      sourceDecisionRef: " source-decision:edge ",
      scope: " relation-review ",
      validFrom: " 2026-06-01T00:00:00.000Z ",
      validUntil: " 2026-12-31T00:00:00.000Z ",
      invalidatedAt: " 2027-01-01T00:00:00.000Z ",
      file: " KRN_ROADMAP.md ",
      contentHash: " sha256:source-edge ",
      sourceRanges: [
        " KRN_ROADMAP.md:112-119 ",
        "KRN_ROADMAP.md:112-119",
        false
      ],
      unrelated: "must not leak"
    })).toEqual({
      consumer: "graph brain",
      doesNotProve: "relation metadata does not prove source truth",
      evidenceRef: "review-evidence/source-edge-a.md",
      evidenceRefs: [
        "review-evidence/source-edge-a.md",
        "review-evidence/source-edge-b.md"
      ],
      file: "KRN_ROADMAP.md",
      contentHash: "sha256:source-edge",
      missingProofBoundaryFields: [],
      sourceDecisionRef: "source-decision:edge",
      scope: "relation-review",
      sourceRanges: [
        "KRN_ROADMAP.md:112-119"
      ],
      validFrom: "2026-06-01T00:00:00.000Z",
      validUntil: "2026-12-31T00:00:00.000Z",
      invalidatedAt: "2027-01-01T00:00:00.000Z"
    });
  });

  test("source relation metadata readback reports missing proof boundary fields", () => {
    expect(readSourceRelationMetadataReadback({
      consumer: " ",
      doesNotProve: 12,
      evidenceRef: "",
      evidenceRefs: [" ", 42, "review-evidence/source-edge.md"],
      sourceRanges: ["", " docs/source.md:1-2 "]
    })).toEqual({
      evidenceRefs: ["review-evidence/source-edge.md"],
      missingProofBoundaryFields: ["consumer", "doesNotProve"],
      sourceRanges: ["docs/source.md:1-2"]
    });
  });

  test("reads the opposite SourceClaim endpoint from a SourceClaimEdge", () => {
    expect(relatedSourceClaimIdForEdge("source-claim-1", {
      fromSourceClaimId: "source-claim-1",
      toSourceClaimId: "source-claim-2"
    })).toBe("source-claim-2");
    expect(relatedSourceClaimIdForEdge("source-claim-2", {
      fromSourceClaimId: "source-claim-1",
      toSourceClaimId: "source-claim-2"
    })).toBe("source-claim-1");
    expect(relatedSourceClaimIdForEdge("source-claim-3", {
      fromSourceClaimId: "source-claim-1",
      toSourceClaimId: "source-claim-2"
    })).toBeUndefined();
  });

  test("separates source claim create status from review lifecycle states", () => {
    expectTypeOf<SourceClaimCreateStatus>().toEqualTypeOf<"proposed">();
    expectTypeOf<SourceClaimLifecycleStatus>().toEqualTypeOf<
      "accepted" | "rejected" | "deprecated"
    >();
  });

  test("reports stale and unconsumed accepted source claims", () => {
    expect(assessSourceClaimReviewSignals(sourceClaim({
      revisitWhen: "2026-06-01T00:00:00.000Z"
    }), {
      now,
      sourceDecisionCount: 0
    })).toEqual([
      {
        kind: "stale_accepted_claim",
        severity: "warning",
        sourceClaimId: "source-claim-1",
        reason:
          "Accepted SourceClaim is past revisitWhen and needs refresh, deprecation, or replacement before continued use."
      },
      {
        kind: "accepted_claim_without_decision",
        severity: "blocking",
        sourceClaimId: "source-claim-1",
        reason:
          "Accepted SourceClaim has a consumer but no linked SourceDecision, which risks source hoarding instead of source-to-decision evidence."
      }
    ]);
  });

  test("blocks decorative or incomplete source claims", () => {
    const signals = assessSourceClaimReviewSignals(sourceClaim({
      mechanism: "",
      supportType: "background",
      falsifier: ""
    }));

    expect(signals.map((signal) => signal.kind)).toEqual([
      "missing_source_to_decision_fields",
      "decorative_support_type"
    ]);
    expect(signals.every((signal) => signal.severity === "blocking")).toBe(true);
  });

  test("fails closed for invalid source claim timestamps", () => {
    const invalidNowClaim = sourceClaim({});
    const invalidRevisitClaim = sourceClaim({
      revisitWhen: "not-a-date"
    });

    expect(assessSourceClaimTemporalValidity(invalidNowClaim, "not-a-date")).toEqual({
      status: "invalid_time",
      reason: "invalid_now"
    });
    expect(assessSourceClaimTemporalValidity(invalidRevisitClaim, now)).toEqual({
      status: "invalid_time",
      reason: "invalid_revisit_when"
    });
    expect(assessSourceClaimTemporalValidity(sourceClaim({
      revisitWhen: "2026-06-01T00:00:00.000Z"
    }), now)).toEqual({
      status: "stale",
      reason: "revisit_when_elapsed"
    });
    expect(assessSourceClaimTemporalValidity(sourceClaim({}), now)).toEqual({
      status: "valid"
    });

    expect(isSourceClaimTemporallyValid(invalidNowClaim, "not-a-date")).toBe(false);
    expect(isSourceClaimTemporallyValid(invalidRevisitClaim, now)).toBe(false);
    expect(isSourceClaimTemporallyValid(sourceClaim({}), now)).toBe(true);
  });

  test("blocks accepted source claims with invalid temporal metadata", () => {
    expect(assessSourceClaimReviewSignals(sourceClaim({
      revisitWhen: "not-a-date"
    }), {
      now
    })).toEqual([
      {
        kind: "invalid_source_claim_time",
        severity: "blocking",
        sourceClaimId: "source-claim-1",
        reason:
          "Accepted SourceClaim has invalid temporal metadata and cannot be used as current authority."
      }
    ]);

    expect(assessSourceClaimReviewSignals(sourceClaim({}), {
      now: "not-a-date"
    })).toEqual([
      {
        kind: "invalid_source_claim_time",
        severity: "blocking",
        sourceClaimId: "source-claim-1",
        reason:
          "Accepted SourceClaim has invalid temporal metadata and cannot be used as current authority."
      }
    ]);
  });

  test("assesses source authority through one fail-closed gate", () => {
    expect(assessSourceClaimAuthority({
      claim: sourceClaim({}),
      now,
      decisionSupportEdgeIds: ["source-decision-edge-1"]
    })).toMatchObject({
      status: "accepted",
      reasons: ["current_decision_linked_authority"],
      caveats: []
    });

    expect(assessSourceClaimAuthority({
      claim: sourceClaim({
        revisitWhen: "not-a-date"
      }),
      now,
      decisionSupportEdgeIds: ["source-decision-edge-1"]
    })).toMatchObject({
      status: "blocked",
      reasons: expect.arrayContaining(["invalid_time"]),
      caveats: ["invalid_time:invalid_revisit_when"]
    });

    expect(assessSourceClaimAuthority({
      claim: sourceClaim({
        revisitWhen: "2026-06-01T00:00:00.000Z"
      }),
      now,
      decisionSupportEdgeIds: ["source-decision-edge-1"]
    })).toMatchObject({
      status: "stale",
      reasons: ["stale"],
      caveats: ["stale"]
    });

    expect(assessSourceClaimAuthority({
      claim: sourceClaim({
        status: "rejected"
      }),
      now,
      decisionSupportEdgeIds: ["source-decision-edge-1"]
    })).toMatchObject({
      status: "rejected",
      reasons: ["rejected_or_deprecated"]
    });

    expect(assessSourceClaimAuthority({
      claim: sourceClaim({}),
      now,
      decisionSupportEdgeIds: []
    })).toMatchObject({
      status: "evidence_gap",
      reasons: ["missing_source_decision_support"],
      caveats: ["missing_source_decision_support"]
    });

    expect(assessSourceClaimAuthority({
      claim: sourceClaim({
        supportType: "background"
      }),
      now,
      decisionSupportEdgeIds: ["source-decision-edge-1"]
    })).toMatchObject({
      status: "blocked",
      reasons: ["decorative_support_type"]
    });

    expect(assessSourceClaimAuthority({
      claim: sourceClaim({
        id: "source-claim-weaker",
        sourceAuthority: "hypothesis"
      }),
      now,
      decisionSupportEdgeIds: ["source-decision-edge-1"],
      blockedByCurrentSourceClaimId: "source-claim-official"
    })).toMatchObject({
      status: "blocked",
      reasons: ["weaker_than_current_valid_consensus"],
      caveats: ["weaker_than_current_valid_consensus:source-claim-official"],
      blockedByCurrentSourceClaimId: "source-claim-official"
    });
  });

  test("builds a temporal source consensus timeline readback", () => {
    const oldStandard = sourceClaim({
      id: "claim-old-standard",
      claim: "Frontend projects should use the legacy boilerplate.",
      sourceAuthority: "official",
      createdAt: "2026-05-01T08:00:00.000Z",
      updatedAt: "2026-05-01T08:00:00.000Z"
    });
    const currentStandard = sourceClaim({
      id: "claim-current-standard",
      claim: "Frontend projects should use the current app template.",
      sourceAuthority: "project-decision",
      metadata: {
        evidenceRef: "source-artifact:frontend-template-current",
        sourceRanges: ["forum_post:frontend-template-consensus#char=12-84"],
        rawEvidence: {
          citationRef: "forum_post:frontend-template-consensus#char=12-84"
        }
      },
      createdAt: "2026-06-20T08:00:00.000Z",
      updatedAt: "2026-06-20T08:00:00.000Z"
    });
    const staleStandard = sourceClaim({
      id: "claim-stale-standard",
      claim: "Frontend projects should refresh old test standards.",
      sourceAuthority: "official",
      revisitWhen: "2026-06-01T00:00:00.000Z",
      createdAt: "2026-06-18T08:00:00.000Z",
      updatedAt: "2026-06-18T08:00:00.000Z"
    });
    const invalidTimeStandard = sourceClaim({
      id: "claim-invalid-time-standard",
      claim: "Invalid temporal metadata must remain caveated.",
      sourceAuthority: "official",
      revisitWhen: "not-a-date",
      createdAt: "2026-06-19T08:00:00.000Z",
      updatedAt: "2026-06-19T08:00:00.000Z"
    });
    const acceptedOnly = sourceClaim({
      id: "claim-accepted-only",
      claim: "Accepted-only source evidence needs a caveat.",
      sourceAuthority: "official",
      createdAt: "2026-06-22T08:00:00.000Z",
      updatedAt: "2026-06-22T08:00:00.000Z"
    });
    const newerWeakStandard = sourceClaim({
      id: "claim-newer-weak-standard",
      claim: "Frontend projects can skip the governed template because a newer comment said so.",
      sourceAuthority: "hypothesis",
      metadata: {
        rawEvidence: {
          citationRef: "forum_post:newer-weak-comment#char=0-91"
        }
      },
      createdAt: "2026-06-23T08:00:00.000Z",
      updatedAt: "2026-06-23T08:00:00.000Z"
    });
    const rejectedClaim = sourceClaim({
      id: "claim-rejected",
      claim: "Rejected source evidence remains historical.",
      status: "rejected",
      sourceAuthority: "hypothesis",
      createdAt: "2026-06-21T08:00:00.000Z",
      updatedAt: "2026-06-21T08:00:00.000Z"
    });

    const readback = buildSourceConsensusTimelineReadback({
      sourceClaims: [
        currentStandard,
        oldStandard,
        acceptedOnly,
        newerWeakStandard,
        rejectedClaim,
        staleStandard,
        invalidTimeStandard
      ],
      sourceClaimEdges: [
        sourceClaimEdge({
          id: "edge-current-supersedes-old",
          fromSourceClaimId: currentStandard.id,
          toSourceClaimId: oldStandard.id,
          kind: "supersedes",
          metadata: {
            evidenceRef: "source-artifact:edge-current-supersedes-old",
            sourceDecisionRef: "source-decision-edge:current-supersedes-old",
            sourceRanges: ["forum_post:frontend-template-consensus#char=85-130"]
          }
        }),
        sourceClaimEdge({
          id: "edge-rejected-contradicts-current",
          fromSourceClaimId: rejectedClaim.id,
          toSourceClaimId: currentStandard.id,
          kind: "contradicts"
        }),
        sourceClaimEdge({
          id: "edge-rejected-supersedes-current",
          fromSourceClaimId: rejectedClaim.id,
          toSourceClaimId: currentStandard.id,
          kind: "supersedes"
        })
      ],
      sourceDecisionEdges: [
        sourceDecisionEdge({
          id: "decision-edge-current",
          sourceClaimId: currentStandard.id
        }),
        sourceDecisionEdge({
          id: "decision-edge-newer-weak",
          sourceClaimId: newerWeakStandard.id
        })
      ],
      sourceRejections: [
        sourceRejection({
          id: "rejection-rejected",
          sourceClaimId: rejectedClaim.id
        })
      ],
      now
    });

    expect(readback.currentSourceClaimIds).toEqual(["claim-current-standard"]);
    expect(readback.caveatedSourceClaimIds).toEqual(["claim-accepted-only"]);
    expect(readback.historicalSourceClaimIds).toEqual([
      "claim-newer-weak-standard",
      "claim-invalid-time-standard",
      "claim-stale-standard",
      "claim-old-standard"
    ]);
    expect(readback.staleSourceClaimIds).toEqual(["claim-stale-standard"]);
    expect(readback.supersededSourceClaimIds).toEqual(["claim-old-standard"]);
    expect(readback.unknownSourceClaimIds).toEqual([
      "claim-accepted-only",
      "claim-invalid-time-standard"
    ]);
    expect(readback.rejectedSourceClaimIds).toEqual(["claim-rejected"]);

    expect(readback.entries.map((entry) => entry.sourceClaimId)).toEqual([
      "claim-current-standard",
      "claim-accepted-only",
      "claim-newer-weak-standard",
      "claim-invalid-time-standard",
      "claim-stale-standard",
      "claim-old-standard",
      "claim-rejected"
    ]);
    expect(readback.entries.find((entry) =>
      entry.sourceClaimId === "claim-current-standard"
    )).toMatchObject({
      state: "current_authority",
      decisionSupportEdgeIds: ["decision-edge-current"],
      evidenceRefs: ["source-artifact:frontend-template-current"],
      rawEvidenceCitationRefs: ["forum_post:frontend-template-consensus#char=12-84"],
      sourceRanges: ["forum_post:frontend-template-consensus#char=12-84"],
      dissentingSourceClaimIds: ["claim-rejected"],
      supersededBySourceClaimIds: [],
      supersedesSourceClaimIds: ["claim-old-standard"],
      relationEvidence: expect.arrayContaining([
        expect.objectContaining({
          sourceClaimEdgeId: "edge-current-supersedes-old",
          direction: "outgoing",
          kind: "supersedes",
          relatedSourceClaimId: "claim-old-standard",
          metadataEvidenceRefs: ["source-artifact:edge-current-supersedes-old"],
          metadataSourceDecisionRef: "source-decision-edge:current-supersedes-old",
          sourceRanges: ["forum_post:frontend-template-consensus#char=85-130"],
          evidenceGaps: []
        }),
        expect.objectContaining({
          sourceClaimEdgeId: "edge-rejected-supersedes-current",
          direction: "incoming",
          kind: "supersedes",
          relatedSourceClaimId: "claim-rejected",
          evidenceGaps: ["missing_relation_support_ref"]
        })
      ]),
      caveats: []
    });
    expect(readback.entries.find((entry) =>
      entry.sourceClaimId === "claim-old-standard"
    )).toMatchObject({
      state: "historical",
      supersededBySourceClaimIds: ["claim-current-standard"],
      relationEvidence: expect.arrayContaining([
        expect.objectContaining({
          sourceClaimEdgeId: "edge-current-supersedes-old",
          direction: "incoming",
          kind: "supersedes",
          relatedSourceClaimId: "claim-current-standard",
          metadataEvidenceRefs: ["source-artifact:edge-current-supersedes-old"],
          metadataSourceDecisionRef: "source-decision-edge:current-supersedes-old",
          evidenceGaps: []
        })
      ]),
      caveats: expect.arrayContaining([
        "missing_source_decision_support",
        "superseded_by:claim-current-standard"
      ])
    });
    expect(readback.entries.find((entry) =>
      entry.sourceClaimId === "claim-stale-standard"
    )).toMatchObject({
      state: "historical",
      caveats: expect.arrayContaining([
        "stale",
        "missing_source_decision_support"
      ])
    });
    expect(readback.entries.find((entry) =>
      entry.sourceClaimId === "claim-invalid-time-standard"
    )).toMatchObject({
      state: "historical",
      caveats: expect.arrayContaining([
        "invalid_time:invalid_revisit_when",
        "missing_source_decision_support"
      ])
    });
    expect(readback.entries.find((entry) =>
      entry.sourceClaimId === "claim-accepted-only"
    )).toMatchObject({
      state: "caveated_authority",
      caveats: ["missing_source_decision_support"]
    });
    expect(readback.entries.find((entry) =>
      entry.sourceClaimId === "claim-rejected"
    )).toMatchObject({
      state: "rejected",
      rejectionIds: ["rejection-rejected"],
      caveats: expect.arrayContaining([
        "missing_source_decision_support",
        "rejected_by:rejection-rejected"
      ])
    });
    expect(readback.entries.find((entry) =>
      entry.sourceClaimId === "claim-newer-weak-standard"
    )).toMatchObject({
      state: "historical",
      blockedByCurrentSourceClaimId: "claim-current-standard",
      decisionSupportEdgeIds: ["decision-edge-newer-weak"],
      rawEvidenceCitationRefs: ["forum_post:newer-weak-comment#char=0-91"],
      caveats: ["weaker_than_current_valid_consensus:claim-current-standard"]
    });
    expect(readback.doesNotProve).toContain("large-scale temporal consensus quality");
  });

  test("caveats current authority when an accepted source claim dissents", () => {
    const currentStandard = sourceClaim({
      id: "claim-current-standard",
      claim: "Frontend projects should use the current app template.",
      createdAt: "2026-06-20T08:00:00.000Z",
      updatedAt: "2026-06-20T08:00:00.000Z"
    });
    const dissentingClaim = sourceClaim({
      id: "claim-dissenting-standard",
      claim: "Frontend projects should not use the current app template.",
      createdAt: "2026-06-21T08:00:00.000Z",
      updatedAt: "2026-06-21T08:00:00.000Z"
    });
    const readback = buildSourceConsensusTimelineReadback({
      sourceClaims: [
        currentStandard,
        dissentingClaim
      ],
      sourceClaimEdges: [
        sourceClaimEdge({
          id: "edge-dissenting-contradicts-current",
          fromSourceClaimId: dissentingClaim.id,
          toSourceClaimId: currentStandard.id,
          kind: "contradicts"
        })
      ],
      sourceDecisionEdges: [
        sourceDecisionEdge({
          id: "decision-edge-current",
          sourceClaimId: currentStandard.id
        })
      ],
      now
    });

    expect(readback.currentSourceClaimIds).toEqual([]);
    expect(readback.caveatedSourceClaimIds).toEqual(expect.arrayContaining([
      "claim-current-standard",
      "claim-dissenting-standard"
    ]));
    expect(readback.caveatedSourceClaimIds).toHaveLength(2);
    expect(readback.entries.find((entry) =>
      entry.sourceClaimId === "claim-current-standard"
    )).toMatchObject({
      state: "caveated_authority",
      decisionSupportEdgeIds: ["decision-edge-current"],
      dissentingSourceClaimIds: ["claim-dissenting-standard"],
      caveats: ["dissenting_source_claims:claim-dissenting-standard"]
    });
  });

  test("reports source decisions without support or falsifiability", () => {
    expect(assessSourceDecisionReviewSignals(sourceDecision({
      sourceClaimId: undefined,
      decision: "",
      falsifier: ""
    }))).toEqual([
      {
        kind: "missing_source_claim",
        severity: "blocking",
        sourceDecisionId: "source-decision-1",
        reason:
          "Adopt/reject SourceDecision records require a SourceClaim link before they can be treated as source-grounded decisions."
      },
      {
        kind: "missing_decision_fields",
        severity: "blocking",
        sourceDecisionId: "source-decision-1",
        reason:
          "SourceDecision needs decision, rationale, consumer, and falsifier to avoid decorative source retention."
      }
    ]);
  });

  test("blocks decisions backed by rejected or deprecated claims", () => {
    expect(assessSourceDecisionReviewSignals(sourceDecision({}), {
      sourceClaimStatus: "rejected"
    })).toEqual([
      {
        kind: "unsupported_source_claim",
        severity: "blocking",
        sourceDecisionId: "source-decision-1",
        reason:
          "SourceDecision must not rely on a rejected or deprecated SourceClaim."
      }
    ]);
  });

  test("keeps source trust and override logic in the core domain", () => {
    expect(new Set(sourceAuthorityLabels).has("official")).toBe(true);
    expect(new Set(sourceSupportTypes).has("supports")).toBe(true);
    expect(classifySourceAuthority("official")).toEqual({
      authorityRank: "high",
      sourceKind: "official",
      rank: 100
    });
    expect(classifySourceAuthority("high")).toEqual({
      authorityRank: "high",
      sourceKind: "unspecified",
      rank: 85
    });
    expect(assessSourceSupportType("implementation-boundary")).toEqual({
      relation: "not_applicable",
      use: "implementation-boundary",
      decisionGrade: true
    });
    expect(rankSourceAuthority("official")).toBeGreaterThan(rankSourceAuthority("high"));
    expect(rankSourceAuthority("project-decision")).toBe(rankSourceAuthority("official"));
    expect(rankSourceAuthority("hypothesis")).toBeLessThan(rankSourceAuthority("secondary"));

    expect(assessSourceClaimOverride({
      candidate: sourceClaim({
        id: "source-claim-weak",
        sourceAuthority: "hypothesis",
        createdAt: "2026-06-24T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-official",
          sourceAuthority: "official",
          createdAt: "2026-06-01T08:00:00.000Z"
        })
      ],
      now
    })).toEqual({
      allowed: false,
      reason: "weaker_than_current_valid_consensus",
      blockedBySourceClaimId: "source-claim-official"
    });

    expect(assessSourceClaimOverride({
      candidate: sourceClaim({
        id: "source-claim-older-weak",
        sourceAuthority: "hypothesis",
        createdAt: "2026-05-01T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-current-official",
          sourceAuthority: "official",
          createdAt: "2026-06-01T08:00:00.000Z"
        })
      ],
      now
    })).toEqual({
      allowed: false,
      reason: "weaker_than_current_valid_consensus",
      blockedBySourceClaimId: "source-claim-current-official"
    });

    expect(assessSourceClaimOverride({
      candidate: sourceClaim({
        id: "source-claim-invalid-now-weak",
        sourceAuthority: "hypothesis",
        createdAt: "2026-06-24T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-invalid-now-official",
          sourceAuthority: "official",
          createdAt: "2026-06-01T08:00:00.000Z"
        })
      ],
      now: "not-a-date"
    })).toEqual({
      allowed: false,
      reason: "candidate_not_current_authority"
    });

    expect(assessSourceClaimOverride({
      candidate: sourceClaim({
        id: "source-claim-stale-candidate",
        sourceAuthority: "hypothesis",
        revisitWhen: "2026-06-01T00:00:00.000Z",
        createdAt: "2026-06-24T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-stale-candidate-official",
          sourceAuthority: "official",
          createdAt: "2026-06-01T08:00:00.000Z"
        })
      ],
      now,
      overrideReason: "Official docs were superseded by an explicit project decision.",
      overrideProvenanceRef: "source-decision:manual-review"
    })).toEqual({
      allowed: false,
      reason: "candidate_not_current_authority"
    });

    expect(assessSourceClaimOverride({
      candidate: sourceClaim({
        id: "source-claim-rejected-candidate",
        status: "rejected",
        sourceAuthority: "project-decision",
        createdAt: "2026-06-24T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-rejected-candidate-official",
          sourceAuthority: "official",
          createdAt: "2026-06-01T08:00:00.000Z"
        })
      ],
      now,
      overrideReason: "Official docs were superseded by an explicit project decision.",
      overrideProvenanceRef: "source-decision:manual-review"
    })).toEqual({
      allowed: false,
      reason: "candidate_not_current_authority"
    });

    expect(assessSourceClaimOverride({
      candidate: sourceClaim({
        id: "source-claim-deprecated-candidate",
        status: "deprecated",
        sourceAuthority: "project-decision",
        createdAt: "2026-06-24T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-deprecated-candidate-official",
          sourceAuthority: "official",
          createdAt: "2026-06-01T08:00:00.000Z"
        })
      ],
      now,
      overrideReason: "Official docs were superseded by an explicit project decision.",
      overrideProvenanceRef: "source-decision:manual-review"
    })).toEqual({
      allowed: false,
      reason: "candidate_not_current_authority"
    });

    expect(assessSourceClaimOverride({
      candidate: sourceClaim({
        id: "source-claim-trivial-override-weak",
        sourceAuthority: "hypothesis",
        createdAt: "2026-06-24T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-trivial-override-official",
          sourceAuthority: "official",
          createdAt: "2026-06-01T08:00:00.000Z"
        })
      ],
      now,
      overrideReason: "ok",
      overrideProvenanceRef: "source-decision:manual-review"
    })).toEqual({
      allowed: false,
      reason: "weaker_than_current_valid_consensus",
      blockedBySourceClaimId: "source-claim-trivial-override-official"
    });

    expect(assessSourceClaimOverride({
      candidate: sourceClaim({
        id: "source-claim-unprovenanced-override-weak",
        sourceAuthority: "hypothesis",
        createdAt: "2026-06-24T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-unprovenanced-override-official",
          sourceAuthority: "official",
          createdAt: "2026-06-01T08:00:00.000Z"
        })
      ],
      now,
      overrideReason: "Official docs were superseded by an explicit project decision."
    })).toEqual({
      allowed: false,
      reason: "weaker_than_current_valid_consensus",
      blockedBySourceClaimId: "source-claim-unprovenanced-override-official"
    });

    expect(assessSourceClaimOverride({
      candidate: sourceClaim({
        id: "source-claim-provenanced-override-weak",
        sourceAuthority: "hypothesis",
        createdAt: "2026-06-24T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-provenanced-override-official",
          sourceAuthority: "official",
          createdAt: "2026-06-01T08:00:00.000Z"
        })
      ],
      now,
      overrideReason: "Official docs were superseded by an explicit project decision.",
      overrideProvenanceRef: "source-decision:manual-review"
    })).toEqual({
      allowed: true,
      reason: "explicit_override_reason"
    });

    expect(assessSourceClaimOverride({
      candidate: sourceClaim({
        id: "source-claim-weak-against-invalid-current",
        sourceAuthority: "hypothesis",
        createdAt: "2026-06-24T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-invalid-current-official",
          sourceAuthority: "official",
          revisitWhen: "not-a-date",
          createdAt: "2026-06-01T08:00:00.000Z"
        })
      ],
      now
    })).toEqual({
      allowed: true,
      reason: "no_stronger_valid_consensus"
    });
  });

  test("projects source authority from the canonical authority table", () => {
    expect(classifySourceAuthority("official")).toEqual({
      authorityRank: "high",
      sourceKind: "official",
      rank: 100
    });
    expect(classifySourceAuthority("high")).toMatchObject({
      authorityRank: "high",
      sourceKind: "unspecified"
    });
    expect(classifySourceAuthority("source-code")).toMatchObject({
      authorityRank: "high",
      sourceKind: "source-code"
    });
    expect(classifySourceAuthority("practitioner")).toMatchObject({
      authorityRank: "medium",
      sourceKind: "practitioner"
    });
    expect(classifySourceAuthority("hypothesis")).toMatchObject({
      authorityRank: "low",
      sourceKind: "hypothesis"
    });
  });

  test("projects source support from the canonical support table", () => {
    expect(decisionGradeSourceSupportTypes).toEqual([
      "contradicts",
      "mechanism",
      "decision",
      "risk",
      "rejection",
      "eval-design",
      "implementation-boundary"
    ]);
    expect(decisionGradeSourceSupportTypes.every((supportType) =>
      assessSourceSupportType(supportType).decisionGrade
    )).toBe(true);
    expect(assessSourceSupportType("implementation-boundary")).toEqual({
      relation: "not_applicable",
      use: "implementation-boundary",
      decisionGrade: true
    });
    expect(assessSourceSupportType("supports")).toEqual({
      relation: "supports",
      use: "relation-only",
      decisionGrade: false
    });
    expect(assessSourceSupportType("contradicts")).toEqual({
      relation: "contradicts",
      use: "rejection",
      decisionGrade: true
    });
    expect(assessSourceSupportType("implementation-boundary")).toEqual({
      relation: "not_applicable",
      use: "implementation-boundary",
      decisionGrade: true
    });

    expect(classifySourceClaimTaxonomy(sourceClaim({
      sourceAuthority: "official",
      supportType: "risk"
    }))).toEqual({
      authorityRank: "high",
      sourceKind: "official",
      supportRelation: "not_applicable",
      sourceUse: "risk",
      decisionGrade: true
    });
  });
});
