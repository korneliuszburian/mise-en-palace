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
import type {
  ReviewedSourceDecisionCorpus,
  ReviewedSourceDecisionRow
} from "../reviewed-source-decision-corpus.js";

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

const singleDecisionCorpus = (
  decision: ReviewedSourceDecisionRow
): ReviewedSourceDecisionCorpus => ({
  version: "1",
  corpusName: fixture().corpusName,
  coverageScope: {
    declaredRows: [{
      decisionId: decision.id,
      evidenceRefs: [decision.evidenceRef]
    }]
  },
  decisions: [decision]
});

const importDecision = (
  id: string
) => {
  const decision = fixture().decisions.find((candidate) => candidate.id === id);

  if (decision === undefined) {
    throw new Error(`missing import decision ${id}`);
  }

  return decision;
};

const failOnPersistenceWriteRuntime = (
  includeImportRepository = false,
  equivalentImportIds: readonly string[] = []
) => {
  let writeCount = 0;
  const failWrite = async (): Promise<never> => {
    writeCount += 1;
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

  if (!includeImportRepository) {
    return {
      runtime: { sourceRepository, retrievalRepository },
      writeCount: () => writeCount
    };
  }

  const sourceDecisionImportRepository: NonNullable<
    DatabaseRuntime["sourceDecisionImportRepository"]
  > = {
    getCapturedSourceEvidence: async ({ evidenceRef }) => ({
      status: "missing" as const,
      evidenceRef
    }),
    getSourceDecisionImportRow: async () => ({ status: "missing" }),
    findEquivalentSourceDecisionImportIds: async () => equivalentImportIds,
    listSourceDecisionImportReconciliation: async ({ limit }) => ({
      limit,
      afterImportId: null,
      nextAfterImportId: null,
      imports: {
        totalCount: 0,
        returnedCount: 0,
        truncated: false,
        items: []
      }
    })
  };
  const withTransaction: NonNullable<DatabaseRuntime["withTransaction"]> = async (
    _lockKey,
    work
  ) => work({
    sourceRepository,
    retrievalRepository,
    sourceDecisionImportRepository
  });

  return {
    runtime: {
      sourceRepository,
      retrievalRepository,
      sourceDecisionImportRepository,
      withTransaction
    },
    writeCount: () => writeCount
  };
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
      decisionPacketStatus: "pass",
      coverage: {
        status: "incomplete",
        declaredRowCount: 11,
        missingRowCount: 0,
        declaredEvidenceRefCount: 11,
        capturedEvidenceRefCount: 0,
        capturedCurrentEvidenceRefCount: 0,
        capturedStaleEvidenceRefCount: 0,
        capturedUnknownEvidenceRefCount: 0,
        missingEvidenceRefCount: 10,
        mismatchedEvidenceRefCount: 0,
        externallyUnverifiedEvidenceRefCount: 1
      }
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

  it("rejects an unresolvable evidence reference before repository writes", async () => {
    const { runtime, writeCount } = failOnPersistenceWriteRuntime();

    await expect(persistDecisionCorpusImport({
      runtime,
      projectId: "project-1",
      fixture: {
        ...fixture(),
        decisions: fixture().decisions.map((row, index) => index === 0
          ? { ...row, evidenceRef: "../outside-evidence.md" }
          : row)
      },
      smokeId: "unit-smoke",
      now
    })).rejects.toThrow("unresolvable evidenceRef");
    expect(writeCount()).toBe(0);
  });

  it("rejects syntactically valid but uncaptured evidence before repository writes", async () => {
    const { runtime, writeCount } = failOnPersistenceWriteRuntime(true);
    const firstDecision = fixture().decisions[0];

    if (firstDecision === undefined) {
      throw new Error("missing first decision corpus row");
    }

    await expect(persistDecisionCorpusImport({
      runtime,
      projectId: "project-1",
      fixture: singleDecisionCorpus({
          ...firstDecision,
          evidenceRef: "run-evidence/missing-captured-evidence.md"
      }),
      smokeId: "unit-smoke",
      now,
      authorizedRepoRoot: process.cwd()
    })).rejects.toThrow("cannot create governing authority");

    await expect(persistDecisionCorpusImport({
      runtime,
      projectId: "project-1",
      fixture: singleDecisionCorpus({
          ...firstDecision,
          evidenceRef: "https://example.com/uncaptured-source"
      }),
      smokeId: "unit-smoke-url",
      now,
      authorizedRepoRoot: process.cwd()
    })).rejects.toThrow("externally_unverified");

    await expect(persistDecisionCorpusImport({
      runtime,
      projectId: "project-1",
      fixture: singleDecisionCorpus({
          ...firstDecision,
          evidenceRef: "run-evidence/digest-mismatch.md"
      }),
      smokeId: "unit-smoke-digest",
      now,
      authorizedRepoRoot: process.cwd(),
      resolveEvidence: async ({ evidenceRef, now: capturedAt }) => ({
        status: "captured" as const,
        evidenceRef,
        content: "captured bytes",
        contentHash: "wrong-digest",
        capturedAt,
        provenance: {
          kind: "local_file" as const,
          uri: `test-fixture://${evidenceRef}`,
          path: evidenceRef
        }
      })
    })).rejects.toThrow("cannot create governing authority");
    expect(writeCount()).toBe(0);
  });

  it("fails closed when one manifest already has competing import identities", async () => {
    const { runtime, writeCount } = failOnPersistenceWriteRuntime(true, [
      "source-decision-import:legacy",
      "source-decision-import:current"
    ]);
    const firstDecision = fixture().decisions[0];

    if (firstDecision === undefined) {
      throw new Error("missing first decision corpus row");
    }

    await expect(persistDecisionCorpusImport({
      runtime,
      projectId: "project-1",
      fixture: singleDecisionCorpus(firstDecision),
      smokeId: "unit-smoke-competing-equivalents",
      now,
      resolveEvidence: async ({ evidenceRef, now: capturedAt }) => ({
        status: "captured" as const,
        evidenceRef,
        content: "captured source",
        capturedAt,
        freshness: "current" as const,
        provenance: {
          kind: "source_artifact" as const,
          uri: evidenceRef,
          sourceArtifactId: "source-artifact-captured"
        }
      })
    })).rejects.toThrow("competing equivalent imports");
    expect(writeCount()).toBe(0);
  });
});
