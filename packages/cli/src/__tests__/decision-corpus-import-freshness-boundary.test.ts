import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import postgres from "postgres";
import { describe, expect, it } from "vitest";
import {
  compileHarnessPlan,
  decisionPacketForCompiledPlan
} from "@krn/harness";

import {
  createDatabaseRuntime,
  type DatabaseRuntime
} from "../database-runtime.js";
import {
  loadDecisionCorpusImportFixture
} from "../internal/eval/run-decision-corpus-import.js";
import {
  persistDecisionCorpusImport,
  type PersistedDecisionCorpusRow
} from "../internal/smoke/run-decision-corpus-import-db-smoke.js";
import { evaluateSourceCoverage } from "../source-coverage.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const now = "2026-07-12T00:00:00.000Z";
const authorityReadNow = "2099-01-01T00:00:00.000Z";
const fixturePath = fileURLToPath(
  new URL(
    "../../../../tests/fixtures/decision-corpus-ingest/krn-source-to-decision-import.json",
    import.meta.url
  )
);

const freshnessCases = [
  { decisionId: "live-codex-packet-obedience-pilot", freshness: "current" },
  { decisionId: "decision-corpus-import-path", freshness: "unknown" },
  { decisionId: "db-backed-decision-corpus-import", freshness: "stale" }
] as const;

type EvidenceFreshness = typeof freshnessCases[number]["freshness"];

const fixtureWithCurrentDecision = (decisionId: string) => {
  const fixture = loadDecisionCorpusImportFixture(fixturePath);
  const decision = fixture.decisions.find((candidate) => candidate.id === decisionId);

  if (decision === undefined || decision.status !== "current") {
    throw new Error(`missing current import decision ${decisionId}`);
  }

  return {
    ...fixture,
    coverageScope: {
      declaredRows: [{ decisionId, evidenceRefs: [decision.evidenceRef] }]
    },
    decisions: [decision],
    cases: []
  };
};

const capturedEvidenceResolver = (freshness: EvidenceFreshness) =>
  async (input: { readonly evidenceRef: string; readonly now: string }) => ({
    status: "captured" as const,
    evidenceRef: input.evidenceRef,
    content: `captured ${freshness} evidence for ${input.evidenceRef}`,
    capturedAt: input.now,
    freshness,
    provenance: {
      kind: "local_file" as const,
      uri: `test-fixture://${input.evidenceRef}`,
      path: input.evidenceRef
    }
  });

const fixtureResidueCount = async (
  client: ReturnType<typeof postgres>,
  marker: string
): Promise<number> => {
  const smokeId = `${marker}-%`;
  const rows = await client<{ count: number }[]>`
    select count(*)::int as count
    from (
      select id::text from workspaces where slug = ${marker}
      union all select id::text from projects where slug = ${marker}
      union all select id::text from source_artifacts where metadata->>'smokeId' like ${smokeId}
      union all select id::text from source_chunks where metadata->>'smokeId' like ${smokeId}
      union all select id::text from source_claims where metadata->>'smokeId' like ${smokeId}
      union all select id::text from source_decisions where metadata->>'smokeId' like ${smokeId}
      union all select id::text from source_decision_edges where metadata->>'smokeId' like ${smokeId}
      union all select id::text from search_documents where metadata->>'smokeId' like ${smokeId}
      union all select id::text from outbox_events where payload->>'smokeId' like ${smokeId}
    ) fixture_rows
  `;

  return rows[0]?.count ?? 0;
};

const cleanupFixture = async (
  client: ReturnType<typeof postgres>,
  marker: string
): Promise<number> => {
  const smokeId = `${marker}-%`;

  await client`delete from outbox_events where payload->>'smokeId' like ${smokeId}`;
  await client`delete from source_decision_edges where metadata->>'smokeId' like ${smokeId}`;
  await client`delete from search_documents where metadata->>'smokeId' like ${smokeId}`;
  await client`delete from source_decisions where metadata->>'smokeId' like ${smokeId}`;
  await client`delete from source_chunks where metadata->>'smokeId' like ${smokeId}`;
  await client`delete from source_claims where metadata->>'smokeId' like ${smokeId}`;
  await client`delete from source_artifacts where metadata->>'smokeId' like ${smokeId}`;
  await client`delete from projects where slug = ${marker}`;
  await client`delete from workspaces where slug = ${marker}`;

  return fixtureResidueCount(client, marker);
};

const requiredPersistedRow = (
  rows: readonly PersistedDecisionCorpusRow[],
  decisionId: string
): PersistedDecisionCorpusRow => {
  const row = rows[0];

  if (rows.length !== 1 || row === undefined || row.decisionId !== decisionId) {
    throw new Error(`missing persisted current import row ${decisionId}`);
  }

  return row;
};

const persistedRowFor = (
  rows: readonly PersistedDecisionCorpusRow[],
  decisionId: string
): PersistedDecisionCorpusRow => {
  const row = rows.find((candidate) => candidate.decisionId === decisionId);

  if (row === undefined) {
    throw new Error(`missing persisted import row ${decisionId}`);
  }

  return row;
};

const retainedSourceChunkContent = async (
  client: ReturnType<typeof postgres>,
  sourceChunkId: string
): Promise<string> => {
  const rows = await client<{ content: string }[]>`
    select content
    from source_chunks
    where id = ${sourceChunkId}
  `;
  const content = rows[0]?.content;

  if (content === undefined) {
    throw new Error(`missing retained SourceChunk ${sourceChunkId}`);
  }

  return content;
};

interface ImportLifecycleProjection {
  readonly decisionId: string;
  readonly evidenceFreshness: PersistedDecisionCorpusRow["evidenceFreshness"];
  readonly sourceChunkId: string;
  readonly sourceClaimStatus: string;
  readonly sourceDecisionStatus: string;
  readonly sourceDecisionEdgeCount: number;
  readonly searchDocumentValidityStatus: string;
}

const importLifecycleProjection = async (
  client: ReturnType<typeof postgres>,
  row: PersistedDecisionCorpusRow
): Promise<ImportLifecycleProjection> => {
  if (row.searchDocumentId === undefined) {
    throw new Error(`missing retained SearchDocument for ${row.decisionId}`);
  }

  const projections = await client<{
    sourceChunkId: string;
    sourceClaimStatus: string;
    sourceDecisionStatus: string;
    sourceDecisionEdgeCount: number;
    searchDocumentValidityStatus: string;
  }[]>`
    select
      source_chunks.id as "sourceChunkId",
      source_claims.status::text as "sourceClaimStatus",
      source_decisions.status::text as "sourceDecisionStatus",
      count(source_decision_edges.id)::int as "sourceDecisionEdgeCount",
      search_documents.validity_status::text as "searchDocumentValidityStatus"
    from source_artifacts
    join source_chunks
      on source_chunks.id = ${row.sourceChunkId}
      and source_chunks.source_artifact_id = source_artifacts.id
    join source_claims
      on source_claims.id = ${row.sourceClaimId}
      and source_claims.source_artifact_id = source_artifacts.id
    join source_decisions
      on source_decisions.id = ${row.sourceDecisionId}
      and source_decisions.source_claim_id = source_claims.id
    left join source_decision_edges
      on source_decision_edges.source_claim_id = source_claims.id
      and source_decision_edges.source_decision_id = source_decisions.id
    join search_documents
      on search_documents.id = ${row.searchDocumentId}
      and search_documents.source_claim_id = source_claims.id
      and search_documents.source_decision_id = source_decisions.id
    where source_artifacts.id = ${row.sourceArtifactId}
    group by
      source_chunks.id,
      source_claims.status,
      source_decisions.status,
      search_documents.validity_status
  `;
  const projection = projections[0];

  if (projection === undefined) {
    throw new Error(`missing persisted import lifecycle for ${row.decisionId}`);
  }

  return {
    decisionId: row.decisionId,
    evidenceFreshness: row.evidenceFreshness,
    ...projection
  };
};

describe("decision corpus import evidence freshness boundary", () => {
  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "defers captured stale and unknown evidence for current governing imports",
    async () => {
      const marker = `decision-corpus-import-freshness-${crypto.randomUUID()}`;
      const client = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      let runtime: DatabaseRuntime | undefined;
      let residueCount: number | undefined;

      try {
        runtime = await createDatabaseRuntime({
          databaseUrl: databaseUrl!,
          workspaceSlug: marker,
          projectSlug: marker,
          now: () => now,
          createId: (prefix) => `${prefix}-${crypto.randomUUID()}`
        });
        const rows: PersistedDecisionCorpusRow[] = [];
        const importFixtures = freshnessCases.map((freshnessCase) => ({
          ...freshnessCase,
          fixture: fixtureWithCurrentDecision(freshnessCase.decisionId)
        }));

        for (const freshnessCase of importFixtures) {
          const persistedRows = await persistDecisionCorpusImport({
            runtime,
            projectId: runtime.projectId,
            fixture: freshnessCase.fixture,
            smokeId: `${marker}-${freshnessCase.freshness}`,
            now,
            resolveEvidence: capturedEvidenceResolver(freshnessCase.freshness)
          });

          rows.push(requiredPersistedRow(persistedRows, freshnessCase.decisionId));
        }

        const lifecycleProjections = await Promise.all(rows.map((row) =>
          importLifecycleProjection(client, row)
        ));
        const currentRow = persistedRowFor(rows, "live-codex-packet-obedience-pilot");
        const unknownRow = persistedRowFor(rows, "decision-corpus-import-path");
        const unknownChunkContent = await retainedSourceChunkContent(
          client,
          unknownRow.sourceChunkId
        );
        const searchLexical = runtime.retrievalRepository?.searchLexical;
        const listKnowledgeSources =
          runtime.sourceRepository.listSourceDecisionKnowledgeSources;

        if (searchLexical === undefined || listKnowledgeSources === undefined) {
          throw new Error("decision corpus freshness proof is missing governing read repositories");
        }

        const [currentSearchResults, unknownSearchResults, knowledgeSources] =
          await Promise.all([
            searchLexical({
              projectId: runtime.projectId,
              query: "Live Codex packet obedience pilot",
              now: authorityReadNow,
              limit: 20
            }),
            searchLexical({
              projectId: runtime.projectId,
              query: "Decision corpus import path",
              now: authorityReadNow,
              limit: 20
            }),
            listKnowledgeSources(runtime.projectId, 20)
          ]);
        const compiled = await compileHarnessPlan({
          workspaceId: runtime.workspaceId,
          projectId: runtime.projectId,
          operatorIntent: {
            rawIntent: "Apply the Live Codex packet obedience pilot",
            source: "cli",
            metadata: { marker }
          },
          taskContract: {
            title: "Apply the Live Codex packet obedience pilot",
            objective: "Use only current imported evidence as governing context.",
            constraints: ["exclude stale or unknown imported evidence"],
            nonGoals: ["do not promote retained unknown evidence"],
            acceptance: ["the current imported source claim is selected"],
            metadata: { marker }
          },
          tokenBudget: 420,
          metadata: { marker }
        }, {
          ...runtime.compilerDependencies,
          now: () => authorityReadNow
        });
        const decisionPacket = decisionPacketForCompiledPlan(compiled);
        const coverage = evaluateSourceCoverage({
          scope: {
            declaredRows: importFixtures.flatMap(
              ({ fixture }) => fixture.coverageScope?.declaredRows ?? []
            )
          },
          evidence: rows.map((row) => ({
            decisionId: row.decisionId,
            evidenceRef: row.evidenceRef,
            status: row.evidenceStatus,
            freshness: row.evidenceFreshness
          }))
        });

        expect(lifecycleProjections).toEqual([
          {
            decisionId: "live-codex-packet-obedience-pilot",
            evidenceFreshness: "current",
            sourceChunkId: expect.any(String),
            sourceClaimStatus: "accepted",
            sourceDecisionStatus: "adopt",
            sourceDecisionEdgeCount: 1,
            searchDocumentValidityStatus: "active"
          },
          {
            decisionId: "decision-corpus-import-path",
            evidenceFreshness: "unknown",
            sourceChunkId: expect.any(String),
            sourceClaimStatus: "deprecated",
            sourceDecisionStatus: "defer",
            sourceDecisionEdgeCount: 0,
            searchDocumentValidityStatus: "expired"
          },
          {
            decisionId: "db-backed-decision-corpus-import",
            evidenceFreshness: "stale",
            sourceChunkId: expect.any(String),
            sourceClaimStatus: "deprecated",
            sourceDecisionStatus: "defer",
            sourceDecisionEdgeCount: 0,
            searchDocumentValidityStatus: "expired"
          }
        ]);
        expect(coverage).toMatchObject({
          status: "incomplete",
          declaredRowCount: 3,
          capturedRowCount: 3,
          missingRowCount: 0,
          declaredEvidenceRefCount: 3,
          capturedEvidenceRefCount: 3,
          capturedCurrentEvidenceRefCount: 1,
          capturedStaleEvidenceRefCount: 1,
          capturedUnknownEvidenceRefCount: 1,
          missingEvidenceRefCount: 0,
          mismatchedEvidenceRefCount: 0,
          externallyUnverifiedEvidenceRefCount: 0
        });
        expect(unknownChunkContent).toContain(
          `captured unknown evidence for ${unknownRow.evidenceRef}`
        );
        expect(currentSearchResults.map((result) => result.id)).toContain(
          currentRow.searchDocumentId
        );
        expect(unknownSearchResults.map((result) => result.id)).not.toContain(
          unknownRow.searchDocumentId
        );
        expect(knowledgeSources.map((source) => source.sourceClaim.id)).toContain(
          currentRow.sourceClaimId
        );
        expect(knowledgeSources.map((source) => source.sourceClaim.id)).not.toContain(
          unknownRow.sourceClaimId
        );
        expect(decisionPacket.sourceClaimIds).toContain(currentRow.sourceClaimId);
        expect(decisionPacket.sourceClaimIds).not.toContain(unknownRow.sourceClaimId);
      } finally {
        try {
          try {
            await runtime?.close();
          } finally {
            residueCount = await cleanupFixture(client, marker);
          }
        } finally {
          await client.end();
        }
      }
      expect(residueCount).toBe(0);
    }
  );
});
