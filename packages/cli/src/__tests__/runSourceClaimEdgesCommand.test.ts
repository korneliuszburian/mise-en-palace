import {
  describe,
  expect,
  it
} from "vitest";

import type {
  SourceClaim,
  SourceClaimEdge
} from "@krn/core";
import type {
  DatabaseRuntime
} from "../databaseRuntime.js";
import {
  runSourceClaimEdgesCommand
} from "../runSourceClaimEdgesCommand.js";

const now = "2026-06-29T12:00:00.000Z";
const sourceClaimId = "11111111-1111-4111-8111-111111111111" as SourceClaim["id"];
const relatedSourceClaimId = "22222222-2222-4222-8222-222222222222" as SourceClaim["id"];
const sourceClaimEdgeId = "33333333-3333-4333-8333-333333333333" as SourceClaimEdge["id"];

const sourceClaim: SourceClaim = {
  id: sourceClaimId,
  sourceArtifactId: "44444444-4444-4444-8444-444444444444" as SourceClaim["sourceArtifactId"],
  claim: "A source claim can be connected to another governed claim.",
  mechanism: "SourceClaimEdge rows preserve explicit relation metadata.",
  krnImplication: "Operators need readback before graph-aware retrieval can be trusted.",
  doesNotProve: "This does not prove graph truth.",
  trustTier: "project-decision",
  supportType: "implementation-boundary",
  consumer: "graph brain v0",
  status: "proposed",
  metadata: {},
  createdAt: now,
  updatedAt: now
};

const relatedSourceClaim: SourceClaim = {
  id: relatedSourceClaimId,
  sourceArtifactId: "55555555-5555-4555-8555-555555555555" as SourceClaim["sourceArtifactId"],
  claim: "A narrowed claim can provide adjacent graph-aware source context.",
  mechanism: "The readback follows the persisted SourceClaimEdge to the related SourceClaim row.",
  krnImplication: "Operators can inspect edge-influenced context before ranking or graph runtime work.",
  doesNotProve: "This does not prove graph retrieval quality.",
  trustTier: "project-decision",
  supportType: "implementation-boundary",
  consumer: "graph brain v0",
  status: "proposed",
  metadata: {},
  createdAt: now,
  updatedAt: now
};

const sourceClaimEdge: SourceClaimEdge = {
  id: sourceClaimEdgeId,
  fromSourceClaimId: sourceClaimId,
  toSourceClaimId: relatedSourceClaimId,
  kind: "narrows",
  metadata: {
    consumer: " graph brain v0 ",
    doesNotProve: " This edge does not prove claim truth. ",
    evidenceRef: " docs/example.md:1-3 ",
    sourceDecisionRef: " decision-1 ",
    scope: " bounded preview ",
    validFrom: " 2026-06-01T00:00:00.000Z ",
    validUntil: " 2026-12-31T00:00:00.000Z ",
    sourceRanges: [
      " docs/example.md:1-3 ",
      "",
      12
    ]
  },
  createdAt: now
};

describe("runSourceClaimEdgesCommand", () => {
  it("renders SourceClaimEdge readback with proof boundaries and closes the DB runtime", async () => {
    let closeCount = 0;
    let createSourceClaimEdgeCalled = false;

    const result = await runSourceClaimEdgesCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceClaimEdges",
        sourceClaimId
      },
      createDatabaseRuntime: async () => ({
        workspaceId: "workspace-1",
        projectId: "project-1",
        compilerDependencies: {} as DatabaseRuntime["compilerDependencies"],
        harnessRunRepository: {} as DatabaseRuntime["harnessRunRepository"],
        memoryRepository: {} as DatabaseRuntime["memoryRepository"],
        sourceRepository: {
          async createSourceArtifact() {
            throw new Error("createSourceArtifact should not be called");
          },
          async createSourceClaim() {
            throw new Error("createSourceClaim should not be called");
          },
          async getSourceClaimById(id) {
            if (id === sourceClaimId) {
              return sourceClaim;
            }

            return id === relatedSourceClaimId ? relatedSourceClaim : undefined;
          },
          async createSourceClaimEdge() {
            createSourceClaimEdgeCalled = true;
            throw new Error("createSourceClaimEdge should not be called");
          },
          async listSourceClaimEdgesForClaim(id) {
            return id === sourceClaimId ? [sourceClaimEdge] : [];
          },
          async createSourceDecisionEdge() {
            throw new Error("createSourceDecisionEdge should not be called");
          },
          async getSourceDecisionEdgeById() {
            throw new Error("getSourceDecisionEdgeById should not be called");
          },
          async createSourceRejection() {
            throw new Error("createSourceRejection should not be called");
          }
        },
        async close() {
          closeCount += 1;
        }
      })
    });

    expect(result.stdout).toContain("KRN Source Claim Edges");
    expect(result.stdout).toContain("Persistence: read-only (Postgres)");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain(`sourceClaimId: ${sourceClaimId}`);
    expect(result.stdout).toContain("count: 1");
    expect(result.stdout).toContain(`sourceClaimEdge: ${sourceClaimEdgeId}`);
    expect(result.stdout).toContain("direction: outgoing");
    expect(result.stdout).toContain("kind: narrows");
    expect(result.stdout).toContain("consumer: graph brain v0");
    expect(result.stdout).toContain("doesNotProve: This edge does not prove claim truth.");
    expect(result.stdout).toContain("evidenceRef: docs/example.md:1-3");
    expect(result.stdout).toContain("sourceDecisionRef: decision-1");
    expect(result.stdout).toContain("scope: bounded preview");
    expect(result.stdout).toContain("validFrom: 2026-06-01T00:00:00.000Z");
    expect(result.stdout).toContain("validUntil: 2026-12-31T00:00:00.000Z");
    expect(result.stdout).toContain("sourceRanges:");
    expect(result.stdout).toContain("  - docs/example.md:1-3");
    expect(result.stdout).not.toContain("  - 12");
    expect(result.stdout).toContain("edgeInfluencedSourceContext:");
    expect(result.stdout).toContain(`relatedSourceClaimId: ${relatedSourceClaimId}`);
    expect(result.stdout).toContain("relatedSourceClaimReadback: hit");
    expect(result.stdout).toContain("claim: A narrowed claim can provide adjacent graph-aware source context.");
    expect(result.stdout).toContain("mechanism: The readback follows the persisted SourceClaimEdge to the related SourceClaim row.");
    expect(result.stdout).toContain("krnImplication: Operators can inspect edge-influenced context before ranking or graph runtime work.");
    expect(result.stdout).toContain("connected SourceClaim context can be surfaced through persisted SourceClaimEdge readback");
    expect(result.stdout).toContain("doesNotProve: source truth, claim correctness, edge correctness");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("Graph runtime: none");
    expect(createSourceClaimEdgeCalled).toBe(false);
    expect(closeCount).toBe(1);
  });

  it("requires an existing SourceClaim before edge readback", async () => {
    await expect(runSourceClaimEdgesCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "sourceClaimEdges",
        sourceClaimId: "missing-source-claim"
      },
      createDatabaseRuntime: async () => ({
        workspaceId: "workspace-1",
        projectId: "project-1",
        compilerDependencies: {} as DatabaseRuntime["compilerDependencies"],
        harnessRunRepository: {} as DatabaseRuntime["harnessRunRepository"],
        memoryRepository: {} as DatabaseRuntime["memoryRepository"],
        sourceRepository: {
          async createSourceArtifact() {
            throw new Error("createSourceArtifact should not be called");
          },
          async createSourceClaim() {
            throw new Error("createSourceClaim should not be called");
          },
          async getSourceClaimById() {
            return undefined;
          },
          async createSourceClaimEdge() {
            throw new Error("createSourceClaimEdge should not be called");
          },
          async listSourceClaimEdgesForClaim() {
            throw new Error("listSourceClaimEdgesForClaim should not be called");
          },
          async createSourceDecisionEdge() {
            throw new Error("createSourceDecisionEdge should not be called");
          },
          async getSourceDecisionEdgeById() {
            throw new Error("getSourceDecisionEdgeById should not be called");
          },
          async createSourceRejection() {
            throw new Error("createSourceRejection should not be called");
          }
        },
        async close() {}
      })
    })).rejects.toThrow("SourceClaim not found: missing-source-claim");
  });
});
