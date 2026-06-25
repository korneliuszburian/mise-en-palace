import { describe, expect, it } from "vitest";

import {
  DrizzleSourceRepository,
  assertSourceClaimEdgeGovernance,
  assertSourceClaimGovernance,
  assertSourceDecisionEdgeGovernance,
  assertSourceDecisionGovernance,
  assertSourceDecisionSourceClaimCanSupport,
  assessSourceClaimOverride,
  rankSourceTrustTier
} from "./DrizzleSourceRepository.js";

const methodNames = [
  "createSourceArtifact",
  "createSourceChunk",
  "createSourceClaim",
  "getSourceClaimById",
  "listClaimsForProject",
  "listSourceClaimsForRun",
  "createSourceDecision",
  "createSourceClaimEdge",
  "listSourceClaimEdgesForClaim",
  "createSourceDecisionEdge",
  "listSourceDecisionEdgesForRun",
  "createSourceRejection"
] as const;

describe("DrizzleSourceRepository", () => {
  it("exposes source graph repository methods", () => {
    const prototype = DrizzleSourceRepository.prototype as Record<string, unknown>;

    for (const methodName of methodNames) {
      expect(typeof prototype[methodName]).toBe("function");
    }
  });

  it("rejects decorative source claims without decision-grade fields", () => {
    const valid = {
      claim: "KRN source graph decisions must have a consumer.",
      mechanism: "Source claims are only useful when they name how evidence changes behavior.",
      krnImplication: "KRN must reject decorative source claims before persistence.",
      doesNotProve: "This does not prove retrieval quality.",
      trustTier: "project-decision",
      supportType: "implementation-boundary",
      consumer: "MM-34 source graph hardening",
      falsifier: "A claim can be persisted with no consumer or mechanism."
    } as const;

    expect(() => assertSourceClaimGovernance(valid)).not.toThrow();
    expect(() => assertSourceClaimGovernance({
      ...valid,
      mechanism: " "
    })).toThrow("SourceClaim requires mechanism");
    expect(() => assertSourceClaimGovernance({
      ...valid,
      doesNotProve: ""
    })).toThrow("SourceClaim requires doesNotProve");
    expect(() => assertSourceClaimGovernance({
      ...valid,
      supportType: "background"
    })).toThrow("SourceClaim supportType cannot be decorative");
    expect(() => assertSourceClaimGovernance({
      ...valid,
      falsifier: undefined
    })).toThrow("SourceClaim requires falsifier");
  });

  it("rejects source decisions and edges that cannot support a decision", () => {
    expect(() => assertSourceDecisionGovernance({
      status: "adopt",
      decision: "Adopt source graph hardening.",
      rationale: "The source claim maps mechanism to KRN behavior.",
      falsifier: "Decorative source claims still persist.",
      consumer: "MM-34 source graph hardening",
      sourceClaimId: "source-claim-1"
    })).not.toThrow();

    expect(() => assertSourceDecisionGovernance({
      status: "adopt",
      decision: "Adopt source graph hardening.",
      rationale: "The source claim maps mechanism to KRN behavior.",
      falsifier: "Decorative source claims still persist.",
      consumer: "MM-34 source graph hardening"
    })).toThrow("SourceDecision adopt requires sourceClaimId");

    expect(() => assertSourceDecisionEdgeGovernance({
      sourceClaimId: "source-claim-1",
      targetType: "harness_run",
      targetId: "execution-run-1",
      supportType: "background",
      confidence: "medium",
      notes: "Used as a decorative citation."
    })).toThrow("SourceDecisionEdge supportType cannot be decorative");

    expect(() => assertSourceDecisionEdgeGovernance({
      sourceClaimId: "source-claim-1",
      targetType: "harness_run",
      targetId: " ",
      supportType: "implementation-boundary",
      confidence: "medium",
      notes: " "
    })).toThrow("SourceDecisionEdge requires targetId");
  });

  it("requires reviewable source claim edge metadata", () => {
    const valid = {
      fromSourceClaimId: "source-claim-new",
      toSourceClaimId: "source-claim-old",
      kind: "invalidates",
      metadata: {
        consumer: "B-01 temporal claim edge implementation",
        doesNotProve: "This edge does not prove the newer claim is globally true.",
        scope: "source graph temporal read model"
      }
    } as const;

    expect(() => assertSourceClaimEdgeGovernance(valid)).not.toThrow();
    expect(() => assertSourceClaimEdgeGovernance({
      ...valid,
      metadata: {
        ...valid.metadata,
        consumer: " "
      }
    })).toThrow("SourceClaimEdge requires metadata.consumer");
    expect(() => assertSourceClaimEdgeGovernance({
      ...valid,
      metadata: {
        ...valid.metadata,
        doesNotProve: ""
      }
    })).toThrow("SourceClaimEdge requires metadata.doesNotProve");
  });

  it("rejects rejected or deprecated source claims as decision support", () => {
    const validClaim = {
      id: "source-claim-1",
      status: "accepted",
      claim: "Source claim supports an implementation boundary."
    } as const;

    expect(() => assertSourceDecisionSourceClaimCanSupport(validClaim)).not.toThrow();
    expect(() => assertSourceDecisionSourceClaimCanSupport({
      ...validClaim,
      status: "rejected"
    })).toThrow("SourceDecisionEdge cannot use rejected SourceClaim");
    expect(() => assertSourceDecisionSourceClaimCanSupport({
      ...validClaim,
      status: "deprecated"
    })).toThrow("SourceDecisionEdge cannot use deprecated SourceClaim");
  });

  it("ranks source trust tiers deterministically", () => {
    expect(rankSourceTrustTier("official")).toBeGreaterThan(rankSourceTrustTier("high"));
    expect(rankSourceTrustTier("primary")).toBe(rankSourceTrustTier("official"));
    expect(rankSourceTrustTier("project-decision")).toBe(rankSourceTrustTier("official"));
    expect(rankSourceTrustTier("source-code")).toBe(rankSourceTrustTier("official"));
    expect(rankSourceTrustTier("high")).toBeGreaterThan(rankSourceTrustTier("secondary"));
    expect(rankSourceTrustTier("secondary")).toBeGreaterThan(rankSourceTrustTier("hypothesis"));
  });

  it("blocks a newer weak source from overriding stronger current consensus without reason", () => {
    const consensusClaim = {
      id: "source-claim-strong",
      status: "accepted",
      trustTier: "official",
      revisitWhen: "2026-12-31T00:00:00.000Z",
      createdAt: "2026-06-01T00:00:00.000Z",
      claim: "Memory promotion requires a review gate."
    } as const;

    const weakClaim = {
      id: "source-claim-weak",
      status: "proposed",
      trustTier: "hypothesis",
      revisitWhen: "2026-12-31T00:00:00.000Z",
      createdAt: "2026-06-23T00:00:00.000Z",
      claim: "Memory promotion can skip review when recent."
    } as const;

    expect(assessSourceClaimOverride({
      candidate: weakClaim,
      currentConsensus: [consensusClaim],
      now: "2026-06-23T12:00:00.000Z"
    })).toEqual({
      allowed: false,
      reason: "weaker_than_current_valid_consensus",
      blockedBySourceClaimId: "source-claim-strong"
    });

    expect(assessSourceClaimOverride({
      candidate: weakClaim,
      currentConsensus: [consensusClaim],
      now: "2026-06-23T12:00:00.000Z",
      overrideReason: "Official docs were superseded by an explicit project decision."
    })).toEqual({
      allowed: true,
      reason: "explicit_override_reason"
    });
  });

  it("allows a weak source to challenge stale stronger consensus", () => {
    const staleConsensusClaim = {
      id: "source-claim-stale",
      status: "accepted",
      trustTier: "official",
      revisitWhen: "2026-06-01T00:00:00.000Z",
      createdAt: "2026-05-01T00:00:00.000Z",
      claim: "Observation prefix can be selected by priority alone."
    } as const;

    const newerWeakClaim = {
      id: "source-claim-new",
      status: "proposed",
      trustTier: "low",
      createdAt: "2026-06-23T00:00:00.000Z",
      claim: "Priority alone should not select observation prefix."
    } as const;

    expect(assessSourceClaimOverride({
      candidate: newerWeakClaim,
      currentConsensus: [staleConsensusClaim],
      now: "2026-06-23T12:00:00.000Z"
    })).toEqual({
      allowed: true,
      reason: "no_stronger_valid_consensus"
    });
  });
});
