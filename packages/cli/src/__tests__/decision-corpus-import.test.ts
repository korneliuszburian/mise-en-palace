import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  buildImportedDecisionCorpus,
  loadDecisionCorpusImportFixture,
  runDecisionCorpusImport
} from "../internal/eval/run-decision-corpus-import.js";
import {
  persistDecisionCorpusImport
} from "../internal/smoke/run-decision-corpus-import-db-smoke.js";
import type {
  DatabaseRuntime
} from "../database-runtime.js";
import {
  loadDecisionPacketEvalFixture
} from "../decision-packet-fixture.js";
import {
  buildDecisionPacketWithEngine
} from "../decision-packet-engine.js";

const fixturePath = fileURLToPath(
  new URL(
    "../../../../tests/fixtures/decision-corpus-ingest/krn-source-to-decision-import.json",
    import.meta.url
  )
);

const baseFixturePath = fileURLToPath(
  new URL(
    "../../../../tests/fixtures/notes-baseline/decision-packet-vs-notes.json",
    import.meta.url
  )
);

const now = "2026-07-06T00:00:00.000Z";

const fixture = () => loadDecisionCorpusImportFixture(fixturePath);
const baseFixture = () => loadDecisionPacketEvalFixture(baseFixturePath);

const importDecision = (
  id: string
) => {
  const decision = fixture().decisions.find((candidate) => candidate.id === id);

  if (decision === undefined) {
    throw new Error(`missing import decision ${id}`);
  }

  return decision;
};

describe("runDecisionCorpusImport", () => {
  it("imports compact source-to-decision rows into a passing decision corpus", async () => {
    const result = await runDecisionCorpusImport({
      ...fixture(),
      baseFixturePath
    });

    expect(result).toMatchObject({
      kind: "krn.decisionCorpusImport.v1",
      sourceEvalKind: "krn.decisionPacket.eval.v1",
      sourceScorerModel: "DecisionPacketEvalCase.v1",
      fixtureVersion: "1",
      status: "pass",
      imported: {
        decisionCount: 11,
        noteCount: 11,
        caseCount: 6,
        currentDecisionCount: 6,
        staleDecisionCount: 2,
        rejectedDecisionCount: 3
      },
      decisionPacketStatus: "pass"
    });
    expect(result.importedDecisionIds).toEqual([
      "decision-corpus-import-path",
      "db-backed-decision-corpus-import",
      "live-codex-packet-obedience-pilot",
      "third-repo-portability-before-breadth",
      "anti-vanity-naming-source-backed",
      "memory-first-research-intake-loop",
      "manual-fixture-editing-only",
      "recorded-obedience-proves-live-codex",
      "import-without-link-validation",
      "product-readiness-from-live-pilot",
      "research-link-as-authority"
    ]);
    expect(result.importedCaseIds).toEqual([
      "decision-corpus-import-task",
      "db-backed-decision-corpus-import-task",
      "live-codex-packet-obedience-task",
      "third-repo-portability-task",
      "anti-vanity-naming-task",
      "research-refresh-intake-task"
    ]);
    expect(result.proof.proves).toContain(
      "the importer validates current, stale, and rejected decision links for imported cases"
    );
    expect(result.proof.doesNotProve).toContain("DB ingestion");
  });

  it("runs with the fixture embedded relative base path", async () => {
    const result = await runDecisionCorpusImport(fixture());

    expect(result.status).toBe("pass");
    expect(result.mergedCorpus).toMatchObject({
      name: "krn-decision-packet-imported-source-to-decision",
      decisionCount: 54,
      noteCount: 54,
      caseCount: 27
    });
  });

  it("builds a merged corpus without mutating the base fixture", () => {
    const sourceFixture = fixture();
    const base = baseFixture();
    const merged = buildImportedDecisionCorpus(
      {
        ...sourceFixture,
        baseFixturePath
      },
      base
    );

    expect(base.decisions.some((decision) => decision.id === "decision-corpus-import-path")).toBe(false);
    expect(merged.decisions.some((decision) => decision.id === "decision-corpus-import-path")).toBe(true);
    expect(merged.notes.some((note) => note.id === "note:decision-corpus-import-path")).toBe(true);
    expect(merged.cases.some((testCase) => testCase.id === "decision-corpus-import-task")).toBe(true);
  });

  it("keeps scoped research decisions out of unrelated decision packets", async () => {
    const sourceFixture = fixture();
    const merged = buildImportedDecisionCorpus(
      {
        ...sourceFixture,
        baseFixturePath
      },
      baseFixture()
    );
    const researchCase = merged.cases.find((testCase) => testCase.id === "research-refresh-intake-task");
    const unrelatedCase = merged.cases.find((testCase) => testCase.id === "anti-vanity-naming-task");

    if (researchCase === undefined || unrelatedCase === undefined) {
      throw new Error("missing decision corpus import task-scope cases");
    }

    const researchPacket = await buildDecisionPacketWithEngine(merged, researchCase);
    const unrelatedPacket = await buildDecisionPacketWithEngine(merged, unrelatedCase);

    expect(researchPacket.governingDecisionIds).toContain("memory-first-research-intake-loop");
    expect(researchPacket.rejectedPathIds).toContain("research-link-as-authority");
    expect(unrelatedPacket.governingDecisionIds).not.toContain("memory-first-research-intake-loop");
    expect(unrelatedPacket.rejectedPathIds).not.toContain("research-link-as-authority");
  });

  it("rejects duplicate imported decision ids before merge", () => {
    const sourceFixture = fixture();
    const decision = importDecision("decision-corpus-import-path");

    expect(() =>
      buildImportedDecisionCorpus(
        {
          ...sourceFixture,
          decisions: [
            ...sourceFixture.decisions,
            {
              ...decision,
              title: "Duplicate import decision"
            }
          ]
        },
        baseFixture()
      )
    ).toThrow("import decisions contains duplicate ids: decision-corpus-import-path");
  });

  it("rejects imported decisions that collide with base corpus ids", () => {
    const sourceFixture = fixture();
    const decision = importDecision("decision-corpus-import-path");

    expect(() =>
      buildImportedDecisionCorpus(
        {
          ...sourceFixture,
          decisions: [
            {
              ...decision,
              id: "store-backed-memory-no-markdown"
            },
            ...sourceFixture.decisions.slice(1)
          ]
        },
        baseFixture()
      )
    ).toThrow("import decision duplicates base decision store-backed-memory-no-markdown");
  });

  it("rejects imported cases whose expected decision link is missing", () => {
    const sourceFixture = fixture();

    expect(() =>
      buildImportedDecisionCorpus(
        {
          ...sourceFixture,
          cases: sourceFixture.cases.map((testCase) => ({
            ...testCase,
            expectedDecisionId: "missing-import-decision"
          }))
        },
        baseFixture()
      )
    ).toThrow("case decision-corpus-import-task expectedDecisionId must reference a current decision");
  });

  it("rejects imported cases that collide with base corpus ids", () => {
    const sourceFixture = fixture();

    expect(() =>
      buildImportedDecisionCorpus(
        {
          ...sourceFixture,
          cases: sourceFixture.cases.map((testCase, index) => index === 0
            ? {
                ...testCase,
                id: "memory-runtime-task"
              }
            : testCase)
        },
        baseFixture()
      )
    ).toThrow("import case duplicates base case memory-runtime-task");
  });

  it("rejects stale links that do not point at stale imported decisions", () => {
    const sourceFixture = fixture();

    expect(() =>
      buildImportedDecisionCorpus(
        {
          ...sourceFixture,
          cases: sourceFixture.cases.map((testCase) => ({
            ...testCase,
            staleDecisionIds: ["decision-corpus-import-path"]
          }))
        },
        baseFixture()
      )
    ).toThrow("case decision-corpus-import-task staleDecisionIds must reference stale decisions");
  });

  it("rejects rejected links that do not point at rejected imported decisions", () => {
    const sourceFixture = fixture();

    expect(() =>
      buildImportedDecisionCorpus(
        {
          ...sourceFixture,
          cases: sourceFixture.cases.map((testCase) => ({
            ...testCase,
            rejectedDecisionIds: ["manual-fixture-editing-only"]
          }))
        },
        baseFixture()
      )
    ).toThrow("case decision-corpus-import-task rejectedDecisionIds must reference rejected decisions");
  });

  it("persists compact import rows through source and retrieval repositories", async () => {
    const claims = new Map<string, {
      id: string;
      status: "proposed" | "accepted" | "rejected" | "deprecated";
    }>();
    const artifacts: string[] = [];
    const chunks: string[] = [];
    const decisions: string[] = [];
    const decisionEdges: string[] = [];
    const searchDocuments: Array<{ id: string; validityStatus?: string }> = [];
    const rejections: string[] = [];
    let idCounter = 0;
    const nextId = (prefix: string) => `${prefix}-${++idCounter}`;
    const sourceRepository: DatabaseRuntime["sourceRepository"] = {
      createSourceArtifact: async () => {
        const id = nextId("source-artifact");

        artifacts.push(id);

        return {
          id,
          projectId: "project-1",
          kind: "doc" as const,
          sourceAuthority: "project-decision" as const,
          uri: id,
          title: id,
          contentHash: id,
          capturedAt: now,
          metadata: {},
          createdAt: now,
          updatedAt: now
        };
      },
      listClaimsForProject: async () => [],
      createSourceClaimEdge: async () => {
        throw new Error("createSourceClaimEdge should not be called");
      },
      listSourceClaimEdgesForClaim: async () => [],
      listSourceDecisionEdgesForClaim: async () => [],
      getSourceDecisionEdgeById: async () => undefined,
      createSourceChunk: async () => {
        const id = nextId("source-chunk");

        chunks.push(id);

        return {
          id,
          sourceArtifactId: artifacts.at(-1) ?? "source-artifact-missing",
          ordinal: 0,
          content: id,
          contentHash: id,
          metadata: {},
          createdAt: now
        };
      },
      createSourceClaim: async () => {
        const id = nextId("source-claim");
        const sourceChunkId = chunks.at(-1) ?? "source-chunk-missing";
        const claim = {
          id,
          sourceArtifactId: artifacts.at(-1) ?? "source-artifact-missing",
          sourceChunkId,
          claim: id,
          mechanism: id,
          krnImplication: id,
          doesNotProve: id,
          sourceAuthority: "project-decision" as const,
          supportType: "implementation-boundary" as const,
          consumer: "decision corpus import",
          status: "proposed" as const,
          metadata: {},
          createdAt: now,
          updatedAt: now
        };

        claims.set(id, { id, status: "proposed" });

        return claim;
      },
      getSourceClaimById: async (id: string) => {
        const claim = claims.get(id);

        return claim === undefined
          ? undefined
          : {
              id,
              sourceArtifactId: artifacts.at(-1) ?? "source-artifact-missing",
              claim: id,
              mechanism: id,
              krnImplication: id,
              doesNotProve: id,
              sourceAuthority: "project-decision" as const,
              supportType: "implementation-boundary" as const,
              consumer: "decision corpus import",
              status: claim.status,
              metadata: {},
              createdAt: now,
              updatedAt: now
            };
      },
      createSourceDecision: async (input) => {
        const id = nextId("source-decision");

        decisions.push(id);

        if (input.sourceClaimId !== undefined) {
          claims.set(input.sourceClaimId, {
            id: input.sourceClaimId,
            status: input.status === "reject"
              ? "rejected"
              : input.status === "adopt"
                ? "accepted"
                : "proposed"
          });
        }

        return {
          id,
          projectId: "project-1",
          ...(input.sourceClaimId === undefined ? {} : { sourceClaimId: input.sourceClaimId }),
          status: input.status,
          decision: id,
          rationale: id,
          falsifier: id,
          consumer: "decision corpus import",
          metadata: {},
          createdAt: now,
          updatedAt: now
        };
      },
      deprecateSourceClaim: async ({ sourceClaimId }) => {
        const claim = claims.get(sourceClaimId);

        if (claim === undefined) {
          throw new Error(`missing source claim ${sourceClaimId}`);
        }

        claims.set(sourceClaimId, {
          ...claim,
          status: "deprecated"
        });

        return {
          id: sourceClaimId,
          sourceArtifactId: artifacts.at(-1) ?? "source-artifact-missing",
          claim: sourceClaimId,
          mechanism: sourceClaimId,
          krnImplication: sourceClaimId,
          doesNotProve: sourceClaimId,
          sourceAuthority: "project-decision" as const,
          supportType: "implementation-boundary" as const,
          consumer: "decision corpus import",
          status: "deprecated" as const,
          metadata: {},
          createdAt: now,
          updatedAt: now
        };
      },
      createSourceDecisionEdge: async () => {
        const id = nextId("source-decision-edge");

        decisionEdges.push(id);

        return {
          id,
          sourceClaimId: claims.keys().next().value ?? "source-claim-missing",
          targetType: "architecture_decision" as const,
          targetId: id,
          supportType: "implementation-boundary" as const,
          confidence: "high" as const,
          notes: id,
          metadata: {},
          createdAt: now
        };
      },
      createSourceRejection: async () => {
        const id = nextId("source-rejection");

        rejections.push(id);

        return {
          id,
          projectId: "project-1",
          title: id,
          attemptedClaim: id,
          rejectedBecause: "unsupported" as const,
          reason: "unsupported",
          doesNotProve: id,
          consumer: "decision corpus import",
          metadata: {},
          rejectedAt: now
        };
      }
    };
    const retrievalRepository: NonNullable<DatabaseRuntime["retrievalRepository"]> = {
      createSearchDocument: async (input: { validityStatus?: string }) => {
        const id = nextId("search-document");
        const searchDocument = input.validityStatus === undefined
          ? { id }
          : { id, validityStatus: input.validityStatus };

        searchDocuments.push(searchDocument);

        return {
          ...searchDocument,
          subjectType: "source_claim" as const,
          subjectId: id,
          sourceAuthority: "project-decision" as const,
          validityStatus: input.validityStatus === undefined
            ? "active" as const
            : input.validityStatus as "active" | "expired" | "invalidated",
          language: "en",
          title: id,
          body: id,
          searchText: id,
          metadataFilters: {},
          validFrom: now,
          metadata: {},
          createdAt: now,
          updatedAt: now
        };
      },
      searchLexical: async () => []
    };
    const sourceDecisionImportRepository: NonNullable<DatabaseRuntime["sourceDecisionImportRepository"]> = {
      getSourceDecisionImportRow: async () => ({ status: "missing" })
    };
    const withTransaction: NonNullable<DatabaseRuntime["withTransaction"]> = async (
      _lockKey,
      work
    ) => work({
      sourceRepository,
      retrievalRepository,
      sourceDecisionImportRepository
    });
    const rows = await persistDecisionCorpusImport({
      runtime: {
        sourceRepository,
        retrievalRepository,
        sourceDecisionImportRepository,
        withTransaction
      },
      projectId: "project-1",
      fixture: {
        ...fixture(),
        baseFixturePath
      },
      smokeId: "unit-smoke",
      now
    });

    expect(rows).toHaveLength(11);
    expect(artifacts).toHaveLength(11);
    expect(chunks).toHaveLength(11);
    expect(decisions).toHaveLength(11);
    expect(decisionEdges).toHaveLength(6);
    expect(searchDocuments.filter(({ validityStatus }) => validityStatus === "active"))
      .toHaveLength(6);
    expect(searchDocuments.filter(({ validityStatus }) => validityStatus === "expired"))
      .toHaveLength(2);
    expect(rejections).toHaveLength(3);
    expect(rows.map((row) => [row.decisionId, row.sourceClaimStatus])).toEqual([
      ["decision-corpus-import-path", "accepted"],
      ["db-backed-decision-corpus-import", "accepted"],
      ["live-codex-packet-obedience-pilot", "accepted"],
      ["third-repo-portability-before-breadth", "accepted"],
      ["anti-vanity-naming-source-backed", "accepted"],
      ["memory-first-research-intake-loop", "accepted"],
      ["manual-fixture-editing-only", "deprecated"],
      ["recorded-obedience-proves-live-codex", "deprecated"],
      ["import-without-link-validation", "rejected"],
      ["product-readiness-from-live-pilot", "rejected"],
      ["research-link-as-authority", "rejected"]
    ]);
    expect(rows.find((row) => row.decisionId === "decision-corpus-import-path")?.sourceDecisionEdgeId)
      .toMatch(/^source-decision-edge-/u);
    expect(rows.find((row) => row.decisionId === "manual-fixture-editing-only")?.sourceDecisionEdgeId)
      .toBeUndefined();
    expect(rows.find((row) => row.decisionId === "recorded-obedience-proves-live-codex")?.sourceDecisionEdgeId)
      .toBeUndefined();
    expect(rows.find((row) => row.decisionId === "manual-fixture-editing-only")?.sourceDecisionStatus)
      .toBe("defer");
    expect(rows.find((row) => row.decisionId === "recorded-obedience-proves-live-codex")?.sourceDecisionStatus)
      .toBe("defer");
    expect(rows.find((row) => row.decisionId === "import-without-link-validation")?.sourceRejectionId)
      .toMatch(/^source-rejection-/u);
  });

  it("rejects missing import links before repository writes", async () => {
    let repositoryWriteCount = 0;
    const failWrite = async () => {
      repositoryWriteCount += 1;
      throw new Error("repository write should not run");
    };
    const sourceRepository: DatabaseRuntime["sourceRepository"] = {
      createSourceArtifact: failWrite,
      createSourceChunk: failWrite,
      createSourceClaim: failWrite,
      getSourceClaimById: async () => undefined,
      listClaimsForProject: async () => [],
      createSourceClaimEdge: failWrite,
      listSourceClaimEdgesForClaim: async () => [],
      listSourceDecisionEdgesForClaim: async () => [],
      createSourceDecision: failWrite,
      createSourceDecisionEdge: failWrite,
      getSourceDecisionEdgeById: async () => undefined,
      createSourceRejection: failWrite
    };
    const retrievalRepository: NonNullable<DatabaseRuntime["retrievalRepository"]> = {
      createSearchDocument: failWrite,
      searchLexical: async () => []
    };

    await expect(persistDecisionCorpusImport({
      runtime: {
        sourceRepository,
        retrievalRepository
      },
      projectId: "project-1",
      fixture: {
        ...fixture(),
        baseFixturePath,
        cases: fixture().cases.map((testCase) => ({
          ...testCase,
          expectedDecisionId: "missing-import-decision"
        }))
      },
      smokeId: "unit-smoke",
      now
    })).rejects.toThrow("case decision-corpus-import-task expectedDecisionId must reference a current decision");
    expect(repositoryWriteCount).toBe(0);
  });

  it("rejects an unresolvable evidence reference before repository writes", async () => {
    let repositoryWriteCount = 0;
    const failWrite = async (): Promise<never> => {
      repositoryWriteCount += 1;
      throw new Error("repository write should not run");
    };
    const sourceRepository: DatabaseRuntime["sourceRepository"] = {
      createSourceArtifact: failWrite,
      createSourceChunk: failWrite,
      createSourceClaim: failWrite,
      getSourceClaimById: async () => undefined,
      listClaimsForProject: async () => [],
      createSourceClaimEdge: failWrite,
      listSourceClaimEdgesForClaim: async () => [],
      listSourceDecisionEdgesForClaim: async () => [],
      createSourceDecision: failWrite,
      createSourceDecisionEdge: failWrite,
      getSourceDecisionEdgeById: async () => undefined,
      createSourceRejection: failWrite
    };
    const retrievalRepository: NonNullable<DatabaseRuntime["retrievalRepository"]> = {
      createSearchDocument: failWrite,
      searchLexical: async () => []
    };

    await expect(persistDecisionCorpusImport({
      runtime: {
        sourceRepository,
        retrievalRepository
      },
      projectId: "project-1",
      fixture: {
        ...fixture(),
        decisions: fixture().decisions.map((row, index) => index === 0
          ? { ...row, evidenceRef: "missing-evidence-ref" }
          : row),
        baseFixturePath
      },
      smokeId: "unit-smoke",
      now
    })).rejects.toThrow("unresolvable evidenceRef");
    expect(repositoryWriteCount).toBe(0);
  });
});
