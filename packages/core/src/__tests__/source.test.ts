import { describe, expect, expectTypeOf, test } from "vitest";

import {
  assessSourceClaimOverride,
  assessSourceClaimReviewSignals,
  assessSourceClaimTemporalValidity,
  assessSourceDecisionReviewSignals,
  assessSourceSupportType,
  classifySourceAuthority,
  classifySourceClaimTaxonomy,
  classifySourceSupportType,
  classifySourceTrustTier,
  isSourceClaimTemporallyValid,
  rankSourceTrustTier,
  readSourceRelationMetadataReadback,
  relatedSourceClaimIdForEdge,
  sourceAuthorityByTrustTier,
  sourceSupportAssessmentByType,
  sourceSupportTypes,
  sourceTrustTiers,
  type SourceClaimCreateStatus,
  type SourceClaimLifecycleStatus,
  type SourceClaim,
  type SourceDecision
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
        severity: "warning",
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
    expect(sourceSupportTypes).toContain("supports");
    expect(sourceAuthorityByTrustTier.official).toEqual({
      trustLevel: "high",
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
      trustLevel: "high",
      sourceKind: "official",
      rank: 100
    });
    expect(classifySourceTrustTier("high")).toEqual({
      trustLevel: "high",
      sourceKind: "unspecified"
    });
    expect(classifySourceTrustTier("source-code")).toEqual({
      trustLevel: "high",
      sourceKind: "source-code"
    });
    expect(classifySourceTrustTier("practitioner")).toEqual({
      trustLevel: "medium",
      sourceKind: "practitioner"
    });
    expect(classifySourceTrustTier("hypothesis")).toEqual({
      trustLevel: "low",
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
      trustLevel: "high",
      sourceKind: "official",
      supportRelation: "not_applicable",
      sourceUse: "risk",
      decisionGrade: true
    });
  });
});
