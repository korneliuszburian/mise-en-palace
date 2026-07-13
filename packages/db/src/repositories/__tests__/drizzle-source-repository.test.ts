import { describe, expect, it } from "vitest";
import type {
  SourceClaim,
  SourceDecision,
  SourceSupportType
} from "@krn/core";

import {
  DrizzleSourceRepository,
  assertSourceClaimEdgeGovernance,
  assertSourceClaimGovernance,
  assertSourceDecisionEdgeGovernance,
  assertSourceDecisionGovernance,
  throwOnBlockingSourceDecisionSignals,
  assertSourceDecisionSourceClaimCanSupport,
  assessSourceClaimOverride,
  rankSourceAuthority,
  sourceClaimStatusForDecisionStatus
} from "../drizzle-source-repository.js";

const methodNames = [
  "createSourceArtifact",
  "createSourceChunk",
  "createSourceClaim",
  "deprecateSourceClaim",
  "getSourceClaimById",
  "getSourceClaimForProject",
  "listClaimsForProject",
  "listSourceClaimsForRun",
  "createSourceDecision",
  "getSourceDecisionForProject",
  "listSourceDecisionKnowledgeSources",
  "listRejectedSourceDecisionKnowledgeSources",
  "createSourceClaimEdge",
  "listSourceClaimEdgesForClaim",
  "listSourceClaimEdgesForProject",
  "createSourceDecisionEdge",
  "getSourceDecisionEdgeById",
  "listSourceDecisionEdgesForRun",
  "createSourceRejection"
] as const;

const createdAt = new Date("2026-07-09T00:00:00.000Z");

const createKnowledgeSourceDb = (rows: readonly unknown[]) => ({
  select: () => ({
    from: () => ({
      innerJoin: () => ({
        innerJoin: () => ({
          innerJoin: () => ({
            where: () => ({
              orderBy: () => ({
                limit: () => Promise.resolve(rows)
              })
            })
          })
        })
      })
    })
  })
});

const knowledgeSourceRow = (input: {
  id: string;
  projectId?: string | null;
  decisionStatus?: SourceDecision["status"];
  claimStatus?: SourceClaim["status"];
  edgeSupportType?: SourceSupportType;
}) => {
  const sourceClaimId = `source-claim-${input.id}`;

  return {
    sourceDecision: {
      id: `source-decision-${input.id}`,
      projectId: input.projectId ?? "project-1",
      sourceClaimId,
      status: input.decisionStatus ?? "adopt",
      decision: "Retain store-backed source decision knowledge.",
      rationale: "The source decision has accepted source support and a decision edge.",
      falsifier: "The row is returned without accepted claim support.",
      consumer: "source-decision knowledge proposal",
      metadata: {},
      createdAt,
      updatedAt: createdAt
    },
    sourceClaim: {
      id: sourceClaimId,
      sourceArtifactId: `source-artifact-${input.id}`,
      sourceChunkId: null,
      executionRunId: null,
      claim: "Source decisions can seed governed knowledge proposals.",
      mechanism: "Accepted source claims and source decision edges preserve support.",
      krnImplication: "Memory proposals can be sourced from store decisions.",
      doesNotProve: "This does not promote durable memory truth by itself.",
      sourceAuthority: "project-decision",
      supportType: "implementation-boundary",
      consumer: "source-decision knowledge proposal",
      falsifier: "A rejected or unsupported source decision is proposed as knowledge.",
      revisitWhen: null,
      status: input.claimStatus ?? "accepted",
      metadata: {},
      createdAt,
      updatedAt: createdAt
    },
    sourceDecisionEdge: {
      id: `source-decision-edge-${input.id}`,
      sourceClaimId,
      sourceDecisionId: `source-decision-${input.id}`,
      targetType: "memory_record",
      targetId: `knowledge-${input.id}`,
      supportType: input.edgeSupportType ?? "implementation-boundary",
      confidence: "high",
      notes: "Decision support for a future knowledge proposal.",
      metadata: {},
      createdAt
    }
  };
};

const rejectedKnowledgeSourceRow = (input: {
  id: string;
  projectId?: string | null;
  decisionStatus?: SourceDecision["status"];
  claimStatus?: SourceClaim["status"];
}) => {
  const sourceClaimId = `source-claim-rejected-${input.id}`;

  return {
    sourceDecision: {
      id: `source-decision-rejected-${input.id}`,
      projectId: input.projectId ?? "project-1",
      sourceClaimId,
      status: input.decisionStatus ?? "reject",
      decision: "Reject markdown as runtime memory.",
      rationale: "Runtime memory must flow through store-backed candidates.",
      falsifier: "Markdown is treated as active Memory Core truth.",
      consumer: "rejected source decision anti-memory proposal",
      metadata: {},
      createdAt,
      updatedAt: createdAt
    },
    sourceClaim: {
      id: sourceClaimId,
      sourceArtifactId: `source-artifact-rejected-${input.id}`,
      sourceChunkId: null,
      executionRunId: null,
      claim: "Markdown is runtime memory.",
      mechanism: "Markdown files bypass reviewable store-backed memory state.",
      krnImplication: "KRN should retain this as a rejected path, not active knowledge.",
      doesNotProve: "This does not prove all markdown files are useless.",
      sourceAuthority: "project-decision",
      supportType: "rejection",
      consumer: "rejected source decision anti-memory proposal",
      falsifier: "A rejected source decision creates active MemoryRecord truth.",
      revisitWhen: null,
      status: input.claimStatus ?? "rejected",
      metadata: {},
      createdAt,
      updatedAt: createdAt
    },
    sourceRejection: {
      id: `source-rejection-${input.id}`,
      projectId: input.projectId ?? "project-1",
      executionRunId: null,
      sourceArtifactId: `source-artifact-rejected-${input.id}`,
      sourceClaimId,
      title: "Markdown runtime memory rejected",
      attemptedClaim: "Markdown is runtime memory.",
      rejectedBecause: "unsupported",
      reason: "Runtime memory must be store-backed and reviewed.",
      doesNotProve: "This rejection does not prove all markdown is non-operational.",
      consumer: "rejected source decision anti-memory proposal",
      metadata: {},
      rejectedAt: createdAt
    }
  };
};

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
      sourceAuthority: "project-decision",
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
      sourceDecisionId: "source-decision-1",
      targetType: "harness_run",
      targetId: "execution-run-1",
      supportType: "background",
      confidence: "medium",
      notes: "Used as a decorative citation."
    })).toThrow("SourceDecisionEdge supportType cannot be decorative");

    expect(() => assertSourceDecisionEdgeGovernance({
      sourceClaimId: "source-claim-1",
      targetType: "harness_run",
      targetId: "execution-run-1",
      supportType: "implementation-boundary",
      confidence: "medium",
      notes: "Reviewed source decision support is required.",
      sourceDecisionId: undefined
    } as Parameters<typeof assertSourceDecisionEdgeGovernance>[0])).toThrow(
      "SourceDecisionEdge requires sourceDecisionId"
    );

    expect(() => assertSourceDecisionEdgeGovernance({
      sourceClaimId: "source-claim-1",
      sourceDecisionId: "source-decision-1",
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
        evidenceRef: "source-artifact:temporal-edge#L1-L4",
        scope: "source graph temporal read model"
      }
    } as const;

    expect(() => assertSourceClaimEdgeGovernance(valid)).not.toThrow();
    expect(() => assertSourceClaimEdgeGovernance({
      ...valid,
      metadata: {
        consumer: valid.metadata.consumer,
        doesNotProve: valid.metadata.doesNotProve,
        scope: valid.metadata.scope
      }
    })).toThrow("SourceClaimEdge invalidates requires metadata.evidenceRef or metadata.sourceDecisionRef");
    expect(() => assertSourceClaimEdgeGovernance({
      ...valid,
      kind: "supersedes",
      metadata: {
        consumer: valid.metadata.consumer,
        doesNotProve: valid.metadata.doesNotProve,
        sourceDecisionRef: "source-decision-edge:temporal-support",
        scope: valid.metadata.scope
      }
    })).not.toThrow();
    expect(() => assertSourceClaimEdgeGovernance({
      ...valid,
      kind: "supports",
      metadata: {
        consumer: valid.metadata.consumer,
        doesNotProve: valid.metadata.doesNotProve,
        scope: valid.metadata.scope
      }
    })).not.toThrow();
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

  it("requires accepted source claims as decision support", () => {
    const validClaim = {
      id: "source-claim-1",
      status: "accepted",
      claim: "Source claim supports an implementation boundary."
    } as const;

    expect(() => assertSourceDecisionSourceClaimCanSupport(validClaim)).not.toThrow();
    expect(() => assertSourceDecisionSourceClaimCanSupport({
      ...validClaim,
      status: "proposed"
    })).toThrow("SourceDecisionEdge requires accepted SourceClaim; current status proposed");
    expect(() => assertSourceDecisionSourceClaimCanSupport({
      ...validClaim,
      status: "rejected"
    })).toThrow("SourceDecisionEdge requires accepted SourceClaim; current status rejected");
    expect(() => assertSourceDecisionSourceClaimCanSupport({
      ...validClaim,
      status: "deprecated"
    })).toThrow("SourceDecisionEdge requires accepted SourceClaim; current status deprecated");
  });

  it("maps adopted and rejected source decisions to claim lifecycle status", () => {
    expect(sourceClaimStatusForDecisionStatus("adopt")).toBe("accepted");
    expect(sourceClaimStatusForDecisionStatus("reject")).toBe("rejected");
    expect(sourceClaimStatusForDecisionStatus("defer")).toBeUndefined();
    expect(sourceClaimStatusForDecisionStatus("lab_test")).toBeUndefined();
  });

  it("blocks source decisions if linked source claims are rejected", () => {
    const sourceDecision = {
      id: "source-decision-1",
      status: "adopt",
      decision: "Adopt source claim",
      rationale: "The source claim is valid for this test",
      falsifier: "Rejected claim should fail",
      consumer: "Kernel guardrail",
      metadata: {},
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z"
    } as SourceDecision;

    expect(() => throwOnBlockingSourceDecisionSignals(sourceDecision, "rejected")).toThrow(
      "SourceDecision blocked by review signals"
    );
    expect(() => throwOnBlockingSourceDecisionSignals(sourceDecision, "deprecated")).toThrow(
      "SourceDecision blocked by review signals"
    );
  });

  it("allows accepted source claims as SourceDecision inputs", () => {
    const sourceDecision = {
      id: "source-decision-2",
      status: "adopt",
      sourceClaimId: "source-claim-1",
      decision: "Adopt source claim",
      rationale: "The source claim is valid for this test",
      falsifier: "Accepted claim should pass",
      consumer: "Kernel guardrail",
      metadata: {},
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-01T00:00:00.000Z"
    } as SourceDecision;

    expect(() => throwOnBlockingSourceDecisionSignals(sourceDecision, "accepted")).not.toThrow();
  });

  it("lists only adopted source decisions with accepted claim and decision support for knowledge proposals", async () => {
    const repository = new DrizzleSourceRepository(createKnowledgeSourceDb([
      knowledgeSourceRow({ id: "valid" }),
      knowledgeSourceRow({ id: "rejected-decision", decisionStatus: "reject" }),
      knowledgeSourceRow({ id: "proposed-claim", claimStatus: "proposed" }),
      knowledgeSourceRow({ id: "unsupported-edge", edgeSupportType: "background" }),
      knowledgeSourceRow({ id: "other-project", projectId: "project-2" })
    ]) as never);

    const sources = await repository.listSourceDecisionKnowledgeSources("project-1", 20);

    expect(sources).toHaveLength(1);
    expect(sources[0]?.sourceDecision.id).toBe("source-decision-valid");
    expect(sources[0]?.sourceClaim.status).toBe("accepted");
    expect(sources[0]?.sourceDecisionEdge.supportType).toBe("implementation-boundary");
  });

  it("lists only rejected source decisions with rejected claim and rejection details for anti-memory proposals", async () => {
    const repository = new DrizzleSourceRepository(createKnowledgeSourceDb([
      rejectedKnowledgeSourceRow({ id: "valid" }),
      rejectedKnowledgeSourceRow({ id: "adopted-decision", decisionStatus: "adopt" }),
      rejectedKnowledgeSourceRow({ id: "accepted-claim", claimStatus: "accepted" }),
      rejectedKnowledgeSourceRow({ id: "other-project", projectId: "project-2" })
    ]) as never);

    const sources = await repository.listRejectedSourceDecisionKnowledgeSources("project-1", 20);

    expect(sources).toHaveLength(1);
    expect(sources[0]?.sourceDecision.id).toBe("source-decision-rejected-valid");
    expect(sources[0]?.sourceClaim.status).toBe("rejected");
    expect(sources[0]?.sourceRejection.reason).toBe(
      "Runtime memory must be store-backed and reviewed."
    );
  });

  it("ranks source authorities deterministically", () => {
    expect(rankSourceAuthority("official")).toBeGreaterThan(rankSourceAuthority("high"));
    expect(rankSourceAuthority("primary")).toBe(rankSourceAuthority("official"));
    expect(rankSourceAuthority("project-decision")).toBe(rankSourceAuthority("official"));
    expect(rankSourceAuthority("source-code")).toBe(rankSourceAuthority("official"));
    expect(rankSourceAuthority("high")).toBeGreaterThan(rankSourceAuthority("secondary"));
    expect(rankSourceAuthority("secondary")).toBeGreaterThan(rankSourceAuthority("hypothesis"));
  });

  it("blocks a newer weak source from overriding stronger current consensus without reason", () => {
    const consensusClaim = {
      id: "source-claim-strong",
      status: "accepted",
      sourceAuthority: "official",
      revisitWhen: "2026-12-31T00:00:00.000Z",
      createdAt: "2026-06-01T00:00:00.000Z",
      claim: "Memory promotion requires a review gate."
    } as const;

    const weakClaim = {
      id: "source-claim-weak",
      status: "proposed",
      sourceAuthority: "hypothesis",
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
      overrideReason: "Official docs were superseded by an explicit project decision.",
      overrideProvenanceRef: "source-decision:manual-review"
    })).toEqual({
      allowed: true,
      reason: "explicit_override_reason"
    });
  });

  it("allows a weak source to challenge stale stronger consensus", () => {
    const staleConsensusClaim = {
      id: "source-claim-stale",
      status: "accepted",
      sourceAuthority: "official",
      revisitWhen: "2026-06-01T00:00:00.000Z",
      createdAt: "2026-05-01T00:00:00.000Z",
      claim: "Observation prefix can be selected by priority alone."
    } as const;

    const newerWeakClaim = {
      id: "source-claim-new",
      status: "proposed",
      sourceAuthority: "low",
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
