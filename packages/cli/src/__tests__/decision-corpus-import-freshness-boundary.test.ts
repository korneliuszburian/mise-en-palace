import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import postgres from "postgres";
import { describe, expect, it } from "vitest";

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

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const now = "2026-07-12T00:00:00.000Z";
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

      try {
        runtime = await createDatabaseRuntime({
          databaseUrl: databaseUrl!,
          workspaceSlug: marker,
          projectSlug: marker,
          now: () => now,
          createId: (prefix) => `${prefix}-${crypto.randomUUID()}`
        });
        const rows: PersistedDecisionCorpusRow[] = [];

        for (const freshnessCase of freshnessCases) {
          const persistedRows = await persistDecisionCorpusImport({
            runtime,
            projectId: runtime.projectId,
            fixture: fixtureWithCurrentDecision(freshnessCase.decisionId),
            smokeId: `${marker}-${freshnessCase.freshness}`,
            now,
            resolveEvidence: capturedEvidenceResolver(freshnessCase.freshness)
          });

          rows.push(requiredPersistedRow(persistedRows, freshnessCase.decisionId));
        }

        const lifecycleProjections = await Promise.all(rows.map((row) =>
          importLifecycleProjection(client, row)
        ));

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
      } finally {
        await runtime?.close();
        await client`delete from workspaces where slug = ${marker}`;
        await client.end();
      }
    }
  );
});
