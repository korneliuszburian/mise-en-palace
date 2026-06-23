import { describe, expect, it } from "vitest";

import {
  DrizzleSourceRepository,
  assertSourceClaimGovernance,
  assertSourceDecisionEdgeGovernance,
  assertSourceDecisionGovernance,
  assertSourceDecisionSourceClaimCanSupport
} from "./DrizzleSourceRepository.js";

const methodNames = [
  "createSourceArtifact",
  "createSourceChunk",
  "createSourceClaim",
  "getSourceClaimById",
  "listClaimsForProject",
  "listSourceClaimsForRun",
  "createSourceDecision",
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
});
