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

const nonCurrentFreshnessCases = [
  { decisionId: "decision-corpus-import-path", freshness: "unknown" },
  { decisionId: "db-backed-decision-corpus-import", freshness: "stale" }
] as const;

type NonCurrentEvidenceFreshness = typeof nonCurrentFreshnessCases[number]["freshness"];

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

const capturedEvidenceResolver = (freshness: NonCurrentEvidenceFreshness) =>
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

interface CurrentAuthorityProjection {
  readonly decisionId: string;
  readonly evidenceFreshness: PersistedDecisionCorpusRow["evidenceFreshness"];
  readonly sourceClaimStatus: string;
  readonly sourceDecisionStatus: string;
  readonly searchDocumentValidityStatus: string;
}

const currentAuthorityProjection = async (
  client: ReturnType<typeof postgres>,
  row: PersistedDecisionCorpusRow
): Promise<CurrentAuthorityProjection> => {
  if (row.sourceDecisionEdgeId === undefined || row.searchDocumentId === undefined) {
    throw new Error(`missing governing projection for ${row.decisionId}`);
  }

  const projections = await client<{
    sourceClaimStatus: string;
    sourceDecisionStatus: string;
    searchDocumentValidityStatus: string;
  }[]>`
    select
      source_claims.status::text as "sourceClaimStatus",
      source_decisions.status::text as "sourceDecisionStatus",
      search_documents.validity_status::text as "searchDocumentValidityStatus"
    from source_claims
    join source_decisions
      on source_decisions.id = ${row.sourceDecisionId}
      and source_decisions.source_claim_id = source_claims.id
    join source_decision_edges
      on source_decision_edges.id = ${row.sourceDecisionEdgeId}
      and source_decision_edges.source_claim_id = source_claims.id
      and source_decision_edges.source_decision_id = source_decisions.id
    join search_documents
      on search_documents.id = ${row.searchDocumentId}
      and search_documents.source_claim_id = source_claims.id
      and search_documents.source_decision_id = source_decisions.id
    where source_claims.id = ${row.sourceClaimId}
  `;
  const projection = projections[0];

  if (projection === undefined) {
    throw new Error(`missing persisted governing projection for ${row.decisionId}`);
  }

  return {
    decisionId: row.decisionId,
    evidenceFreshness: row.evidenceFreshness,
    ...projection
  };
};

describe("decision corpus import evidence freshness boundary", () => {
  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "reproduces governing authority from captured stale and unknown evidence",
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

        for (const freshnessCase of nonCurrentFreshnessCases) {
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

        const authorityProjections = await Promise.all(rows.map((row) =>
          currentAuthorityProjection(client, row)
        ));

        expect(authorityProjections).toEqual([
          {
            decisionId: "decision-corpus-import-path",
            evidenceFreshness: "unknown",
            sourceClaimStatus: "accepted",
            sourceDecisionStatus: "adopt",
            searchDocumentValidityStatus: "active"
          },
          {
            decisionId: "db-backed-decision-corpus-import",
            evidenceFreshness: "stale",
            sourceClaimStatus: "accepted",
            sourceDecisionStatus: "adopt",
            searchDocumentValidityStatus: "active"
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
