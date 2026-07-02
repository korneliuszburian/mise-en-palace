import { describe, expect, expectTypeOf, test } from "vitest";

import {
  assessSourceClaimOverride,
  assessSourceClaimReviewSignals,
  assessSourceDecisionReviewSignals,
  classifySourceClaimTaxonomy,
  classifySourceSupportType,
  classifySourceTrustTier,
  rankSourceTrustTier,
  sourceKinds,
  sourceSupportRelations,
  sourceSupportTypes,
  sourceTrustTiers,
  sourceTrustLevels,
  sourceUses,
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
        severity: "warning",
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
    expect(sourceTrustTiers).toEqual([
      "high",
      "medium",
      "low",
      "primary",
      "official",
      "project-decision",
      "source-code",
      "paper",
      "practitioner",
      "secondary",
      "hypothesis"
    ]);
    expect(sourceTrustLevels).toEqual(["high", "medium", "low"]);
    expect(sourceKinds).toEqual([
      "unspecified",
      "primary",
      "official",
      "project-decision",
      "source-code",
      "paper",
      "practitioner",
      "secondary",
      "hypothesis"
    ]);
    expect(sourceSupportTypes).toContain("supports");
    expect(sourceSupportRelations).toEqual([
      "supports",
      "contradicts",
      "qualifies",
      "does_not_support",
      "not_applicable"
    ]);
    expect(sourceUses).toContain("implementation-boundary");
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
  });

  test("projects legacy trust tiers into explicit trust level and source kind", () => {
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

  test("projects legacy support types into relation and source use", () => {
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
