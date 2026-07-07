import { describe, expect, expectTypeOf, test } from "vitest";

import {
  assessSourceClaimOverride,
  assessSourceClaimReviewSignals,
  assessSourceClaimTemporalValidity,
  assessSourceDecisionReviewSignals,
  assessSourceSupportType,
  buildSourceConsensusTimelineReadback,
  classifySourceAuthority,
  classifySourceClaimTaxonomy,
  classifySourceSupportType,
  classifySourceTrustTier,
  isSourceClaimTemporallyValid,
  rankSourceTrustTier,
  readSourceRelationMetadataReadback,
  relatedSourceClaimIdForEdge,
  sourceAuthorityRanks,
  sourceAuthorityByTrustTier,
  sourceKinds,
  sourceRankedKinds,
  sourceSupportAssessmentByType,
  sourceSupportTypes,
  sourceTrustTiers,
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
  trustTier: "project-decision",
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
      evidenceRef: " docs/reviews/source-edge-a.md ",
      evidenceRefs: [
        "docs/reviews/source-edge-a.md",
        " docs/reviews/source-edge-b.md ",
        "",
        " ",
        42
      ],
      sourceDecisionRef: " source-decision:edge ",
      scope: " relation-review ",
      validFrom: " 2026-06-01T00:00:00.000Z ",
      validUntil: " 2026-12-31T00:00:00.000Z ",
      invalidatedAt: " 2027-01-01T00:00:00.000Z ",
      file: " docs/decisions/ADR-0021-temporal-claim-graph.md ",
      contentHash: " sha256:source-edge ",
      sourceRanges: [
        " docs/decisions/ADR-0021-temporal-claim-graph.md:112-119 ",
        "docs/decisions/ADR-0021-temporal-claim-graph.md:112-119",
        false
      ],
      unrelated: "must not leak"
    })).toEqual({
      consumer: "graph brain",
      doesNotProve: "relation metadata does not prove source truth",
      evidenceRef: "docs/reviews/source-edge-a.md",
      evidenceRefs: [
        "docs/reviews/source-edge-a.md",
        "docs/reviews/source-edge-b.md"
      ],
      file: "docs/decisions/ADR-0021-temporal-claim-graph.md",
      contentHash: "sha256:source-edge",
      missingProofBoundaryFields: [],
      sourceDecisionRef: "source-decision:edge",
      scope: "relation-review",
      sourceRanges: [
        "docs/decisions/ADR-0021-temporal-claim-graph.md:112-119"
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
      evidenceRefs: [" ", 42, "docs/reviews/source-edge.md"],
      sourceRanges: ["", " docs/source.md:1-2 "]
    })).toEqual({
      evidenceRefs: ["docs/reviews/source-edge.md"],
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

  test("builds a temporal source consensus timeline readback", () => {
    const oldStandard = sourceClaim({
      id: "claim-old-standard",
      claim: "Frontend projects should use the legacy boilerplate.",
      trustTier: "official",
      createdAt: "2026-05-01T08:00:00.000Z",
      updatedAt: "2026-05-01T08:00:00.000Z"
    });
    const currentStandard = sourceClaim({
      id: "claim-current-standard",
      claim: "Frontend projects should use the current app template.",
      trustTier: "project-decision",
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
      trustTier: "official",
      revisitWhen: "2026-06-01T00:00:00.000Z",
      createdAt: "2026-06-18T08:00:00.000Z",
      updatedAt: "2026-06-18T08:00:00.000Z"
    });
    const invalidTimeStandard = sourceClaim({
      id: "claim-invalid-time-standard",
      claim: "Invalid temporal metadata must remain caveated.",
      trustTier: "official",
      revisitWhen: "not-a-date",
      createdAt: "2026-06-19T08:00:00.000Z",
      updatedAt: "2026-06-19T08:00:00.000Z"
    });
    const acceptedOnly = sourceClaim({
      id: "claim-accepted-only",
      claim: "Accepted-only source evidence needs a caveat.",
      trustTier: "official",
      createdAt: "2026-06-22T08:00:00.000Z",
      updatedAt: "2026-06-22T08:00:00.000Z"
    });
    const newerWeakStandard = sourceClaim({
      id: "claim-newer-weak-standard",
      claim: "Frontend projects can skip the governed template because a newer comment said so.",
      trustTier: "hypothesis",
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
      trustTier: "hypothesis",
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
          kind: "supersedes"
        }),
        sourceClaimEdge({
          id: "edge-rejected-contradicts-current",
          fromSourceClaimId: rejectedClaim.id,
          toSourceClaimId: currentStandard.id,
          kind: "contradicts"
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
      supersedesSourceClaimIds: ["claim-old-standard"],
      caveats: []
    });
    expect(readback.entries.find((entry) =>
      entry.sourceClaimId === "claim-old-standard"
    )).toMatchObject({
      state: "historical",
      supersededBySourceClaimIds: ["claim-current-standard"],
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
    expect(sourceTrustTiers).toContain("official");
    expect(sourceAuthorityRanks).toEqual(["high", "medium", "low"]);
    expect(sourceRankedKinds).toContain("official");
    expect(sourceRankedKinds).not.toContain("unspecified");
    expect(sourceKinds).toContain("official");
    expect(sourceKinds).toContain("unspecified");
    expect(sourceSupportTypes).toContain("supports");
    expect(sourceAuthorityByTrustTier.official).toEqual({
      authorityRank: "high",
      sourceKind: "official",
      rank: 100
    });
    expect(sourceSupportAssessmentByType["implementation-boundary"]).toEqual({
      relation: "not_applicable",
      use: "implementation-boundary",
      decisionGrade: true
    });
    expect(rankSourceTrustTier("official")).toBeGreaterThan(rankSourceTrustTier("high"));
    expect(rankSourceTrustTier("project-decision")).toBe(rankSourceTrustTier("official"));
    expect(rankSourceTrustTier("hypothesis")).toBeLessThan(rankSourceTrustTier("secondary"));

    expect(assessSourceClaimOverride({
      candidate: sourceClaim({
        id: "source-claim-weak",
        trustTier: "hypothesis",
        createdAt: "2026-06-24T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-official",
          trustTier: "official",
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
        trustTier: "hypothesis",
        createdAt: "2026-05-01T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-current-official",
          trustTier: "official",
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
        trustTier: "hypothesis",
        createdAt: "2026-06-24T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-invalid-now-official",
          trustTier: "official",
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
        trustTier: "hypothesis",
        revisitWhen: "2026-06-01T00:00:00.000Z",
        createdAt: "2026-06-24T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-stale-candidate-official",
          trustTier: "official",
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
        trustTier: "hypothesis",
        createdAt: "2026-06-24T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-trivial-override-official",
          trustTier: "official",
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
        trustTier: "hypothesis",
        createdAt: "2026-06-24T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-unprovenanced-override-official",
          trustTier: "official",
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
        trustTier: "hypothesis",
        createdAt: "2026-06-24T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-provenanced-override-official",
          trustTier: "official",
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
        trustTier: "hypothesis",
        createdAt: "2026-06-24T08:00:00.000Z"
      }),
      currentConsensus: [
        sourceClaim({
          id: "source-claim-invalid-current-official",
          trustTier: "official",
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

  test("projects source authority from the canonical trust table", () => {
    expect(classifySourceAuthority("official")).toEqual({
      authorityRank: "high",
      sourceKind: "official",
      rank: 100
    });
    expect(classifySourceTrustTier("high")).toEqual({
      authorityRank: "high",
      sourceKind: "unspecified"
    });
    expect(classifySourceTrustTier("source-code")).toEqual({
      authorityRank: "high",
      sourceKind: "source-code"
    });
    expect(classifySourceTrustTier("practitioner")).toEqual({
      authorityRank: "medium",
      sourceKind: "practitioner"
    });
    expect(classifySourceTrustTier("hypothesis")).toEqual({
      authorityRank: "low",
      sourceKind: "hypothesis"
    });
  });

  test("projects source support from the canonical support table", () => {
    expect(assessSourceSupportType("implementation-boundary")).toEqual({
      relation: "not_applicable",
      use: "implementation-boundary",
      decisionGrade: true
    });
    expect(classifySourceSupportType("supports")).toEqual({
      relation: "supports",
      use: "relation-only",
      decisionGrade: false
    });
    expect(classifySourceSupportType("contradicts")).toEqual({
      relation: "contradicts",
      use: "rejection",
      decisionGrade: true
    });
    expect(classifySourceSupportType("implementation-boundary")).toEqual({
      relation: "not_applicable",
      use: "implementation-boundary",
      decisionGrade: true
    });

    expect(classifySourceClaimTaxonomy(sourceClaim({
      trustTier: "official",
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
