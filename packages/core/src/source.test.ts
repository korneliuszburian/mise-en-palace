import { describe, expect, test } from "vitest";

import {
  assessSourceClaimOverride,
  assessSourceClaimReviewSignals,
  assessSourceDecisionReviewSignals,
  rankSourceTrustTier,
  type SourceClaim,
  type SourceDecision
} from "./source.js";

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
});
