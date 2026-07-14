import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import postgres from "postgres";
import { describe, expect, it } from "vitest";

import { migrateDatabase } from "../migration-readiness.js";
import { inspectSourceAuthorityIntegrity } from "../source-authority-integrity-readiness.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));

const databaseUrlFor = (input: string, databaseName: string): string => {
  const parsed = new URL(input);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
};

const createDisposableDatabase = async (input: string): Promise<{
  readonly databaseUrl: string;
  readonly cleanup: () => Promise<void>;
}> => {
  const databaseName = `krn_source_authority_integrity_${crypto.randomUUID().replaceAll("-", "")}`;
  const adminClient = postgres(databaseUrlFor(input, "postgres"), {
    max: 1,
    onnotice: () => undefined
  });

  try {
    await adminClient.unsafe(`create database ${databaseName}`);
  } catch (error) {
    await adminClient.end();
    throw error;
  }

  return {
    databaseUrl: databaseUrlFor(input, databaseName),
    cleanup: async () => {
      try {
        await adminClient.unsafe(`drop database if exists ${databaseName} with (force)`);
      } finally {
        await adminClient.end();
      }
    }
  };
};

type EvidenceFreshness = "current" | "stale" | "unknown";

interface GoverningEvidenceFixture {
  readonly projectId: string;
  readonly sourceArtifactId: string;
  readonly sourceChunkId: string;
  readonly sourceClaimId: string;
  readonly sourceDecisionId: string;
  readonly evidenceRef: string;
}

const createGoverningEvidenceFixture = async (
  client: ReturnType<typeof postgres>,
  input: {
    readonly projectId: string;
    readonly marker: string;
    readonly freshness: EvidenceFreshness | "unrecognized";
    readonly lifecycle?: "deferred" | "governing";
    readonly decisionCorpusStatus?: "current";
  }
): Promise<GoverningEvidenceFixture> => {
  const lifecycle = input.lifecycle ?? "governing";
  const evidenceRef = `source-authority://${input.marker}/evidence`;
  const evidenceContentHash = `sha256:${input.marker}:evidence`;
  const metadata = {
    smokeId: input.marker,
    evidenceRef,
    evidenceStatus: "captured",
    evidenceContentHash,
    evidenceFreshness: input.freshness,
    ...(input.decisionCorpusStatus === undefined
      ? {}
      : { decisionCorpusStatus: input.decisionCorpusStatus })
  };
  const rows = await client<GoverningEvidenceFixture[]>`
    with artifact as (
      insert into source_artifacts (
        project_id, import_id, import_row_id, kind, trust_tier, uri, title, content_hash, metadata
      )
      values (
        ${input.projectId},
        ${input.decisionCorpusStatus === undefined ? null : input.marker},
        ${input.decisionCorpusStatus === undefined ? null : input.marker},
        'doc',
        'project-decision',
        ${evidenceRef},
        ${input.marker},
        ${`sha256:${input.marker}:artifact`},
        ${client.json(metadata)}
      )
      returning id, project_id, uri
    ), chunk as (
      insert into source_chunks (source_artifact_id, ordinal, content, content_hash, metadata)
      select id, 0, 'captured fixture evidence', ${evidenceContentHash}, ${client.json(metadata)}
      from artifact
      returning id
    ), claim as (
      insert into source_claims (
        source_artifact_id, source_chunk_id, claim, mechanism, krn_implication,
        does_not_prove, trust_tier, support_type, consumer, status, metadata
      )
      select
        artifact.id,
        chunk.id,
        'governing fixture claim',
        'captured evidence supports the fixture decision',
        'integrity must report non-current governing evidence',
        'does not prove remote source truth',
        'project-decision',
        'implementation-boundary',
        'source authority integrity readiness',
        ${lifecycle === "governing" ? "accepted" : "deprecated"},
        ${client.json(metadata)}
      from artifact, chunk
      returning id
    ), decision as (
      insert into source_decisions (
        project_id, source_claim_id, status, decision, rationale, falsifier, consumer, metadata
      )
      select
        artifact.project_id,
        claim.id,
        ${lifecycle === "governing" ? "adopt" : "defer"},
        'adopt fixture authority',
        'fixture rationale',
        'non-current evidence remains governing',
        'source authority integrity readiness',
        ${client.json(metadata)}
      from artifact, claim
      returning id
    ), edge as (
      insert into source_decision_edges (
        source_claim_id, source_decision_id, target_type, target_id,
        support_type, confidence, notes, metadata
      )
      select
        claim.id,
        decision.id,
        'architecture_decision',
        ${input.marker},
        'implementation-boundary',
        'high',
        'fixture governing edge',
        ${client.json({ smokeId: input.marker })}
      from claim, decision
      where ${lifecycle} = 'governing'
      returning id
    ), search as (
      insert into search_documents (
        project_id, subject_type, subject_id, source_artifact_id, source_chunk_id,
        source_claim_id, source_decision_id, trust_tier, validity_status,
        title, body, search_text, metadata
      )
      select
        artifact.project_id,
        'source_claim',
        claim.id,
        artifact.id,
        chunk.id,
        claim.id,
        decision.id,
        'project-decision',
        ${lifecycle === "governing" ? "active" : "expired"},
        'fixture governing search',
        'fixture governing search body',
        'fixture governing search',
        ${client.json({ smokeId: input.marker })}
      from artifact, chunk, claim, decision
      returning id
    )
    select
      artifact.project_id::text as "projectId",
      artifact.id::text as "sourceArtifactId",
      chunk.id::text as "sourceChunkId",
      claim.id::text as "sourceClaimId",
      decision.id::text as "sourceDecisionId",
      artifact.uri as "evidenceRef"
    from artifact, chunk, claim, decision, search
  `;
  const fixture = rows[0];

  if (fixture === undefined) {
    throw new Error(`failed to create governing evidence fixture ${input.marker}`);
  }

  return fixture;
};

const expectedFreshnessViolation = (
  fixture: GoverningEvidenceFixture,
  freshness: Exclude<EvidenceFreshness, "current">
) => ({
  id: `governing_evidence_not_current:${fixture.sourceDecisionId}`,
  kind: "governing_evidence_not_current",
  subjectId: fixture.sourceDecisionId,
  projectId: fixture.projectId,
  sourceArtifactId: fixture.sourceArtifactId,
  sourceChunkId: fixture.sourceChunkId,
  sourceClaimId: fixture.sourceClaimId,
  sourceDecisionId: fixture.sourceDecisionId,
  evidenceRef: fixture.evidenceRef,
  evidenceFreshness: freshness,
  detail: `governing SourceDecision evidence freshness is ${freshness}, not current`
});

const fixtureMetadata = (smokeId: string, evidenceContentHash = "sha256:fixture-evidence"): Record<string, unknown> => ({
  smokeId,
  evidenceStatus: "captured",
  evidenceContentHash
});

const fixtureResidueCount = async (
  client: ReturnType<typeof postgres>,
  marker: string
): Promise<number> => {
  const rows = await client<{ count: number }[]>`
    select count(*)::int as count
    from (
      select id::text from workspaces where metadata->>'smokeId' = ${marker}
      union all select id::text from projects where metadata->>'smokeId' = ${marker}
      union all select id::text from source_artifacts where metadata->>'smokeId' = ${marker}
      union all select id::text from source_claims where metadata->>'smokeId' = ${marker}
      union all select id::text from source_decisions where metadata->>'smokeId' = ${marker}
      union all select id::text from source_decision_edges where metadata->>'smokeId' = ${marker}
      union all select id::text from search_documents where metadata->>'smokeId' = ${marker}
      union all select id::text from source_chunks where metadata->>'smokeId' = ${marker}
    ) fixture_rows
  `;

  return rows[0]?.count ?? 0;
};

const cleanupFixture = async (
  client: ReturnType<typeof postgres>,
  marker: string
): Promise<number> => {
  await client.unsafe("set session_replication_role = origin");
  await client`delete from outbox_events where payload->>'smokeId' = ${marker}`;
  await client`delete from source_decision_edges where metadata->>'smokeId' = ${marker}`;
  await client`delete from search_documents where metadata->>'smokeId' = ${marker}`;
  await client`delete from source_decisions where metadata->>'smokeId' = ${marker}`;
  await client`delete from source_chunks where metadata->>'smokeId' = ${marker}`;
  await client`delete from source_claims where metadata->>'smokeId' = ${marker}`;
  await client`delete from source_artifacts where metadata->>'smokeId' = ${marker}`;
  await client`delete from projects where metadata->>'smokeId' = ${marker}`;
  await client`delete from workspaces where metadata->>'smokeId' = ${marker}`;

  return fixtureResidueCount(client, marker);
};

describe("source authority integrity readiness", () => {
  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "reports zero, one, and multiple non-current governing evidence rows without writing",
    async () => {
      const disposableDatabase = await createDisposableDatabase(databaseUrl!);
      const client = postgres(disposableDatabase.databaseUrl, { max: 1, onnotice: () => undefined });

      try {
        await migrateDatabase({
          databaseUrl: disposableDatabase.databaseUrl,
          migrationsFolder
        });
        const emptyReport = await inspectSourceAuthorityIntegrity({
          databaseUrl: disposableDatabase.databaseUrl
        });
        const workspace = await client<{ id: string }[]>`
          insert into workspaces (slug, display_name)
          values ('source-authority-freshness', 'Source authority freshness')
          returning id
        `;
        const project = await client<{ id: string }[]>`
          insert into projects (workspace_id, slug, display_name)
          values (${workspace[0]!.id}, 'source-authority-freshness', 'Source authority freshness')
          returning id
        `;
        const projectId = project[0]!.id;

        await createGoverningEvidenceFixture(client, {
          projectId,
          marker: "governing-current",
          freshness: "current"
        });
        await createGoverningEvidenceFixture(client, {
          projectId,
          marker: "deferred-unknown",
          freshness: "unknown",
          lifecycle: "deferred",
          decisionCorpusStatus: "current"
        });
        await createGoverningEvidenceFixture(client, {
          projectId,
          marker: "deferred-stale",
          freshness: "stale",
          lifecycle: "deferred",
          decisionCorpusStatus: "current"
        });
        await createGoverningEvidenceFixture(client, {
          projectId,
          marker: "deferred-unrecognized",
          freshness: "unrecognized",
          lifecycle: "deferred",
          decisionCorpusStatus: "current"
        });
        const currentReport = await inspectSourceAuthorityIntegrity({
          databaseUrl: disposableDatabase.databaseUrl
        });
        const unknownFixture = await createGoverningEvidenceFixture(client, {
          projectId,
          marker: "governing-unknown",
          freshness: "unknown",
          decisionCorpusStatus: "current"
        });
        const unknownReport = await inspectSourceAuthorityIntegrity({
          databaseUrl: disposableDatabase.databaseUrl
        });
        const staleFixture = await createGoverningEvidenceFixture(client, {
          projectId,
          marker: "governing-stale",
          freshness: "stale",
          decisionCorpusStatus: "current"
        });
        const beforeFinalInspection = await client<{ count: number }[]>`
          select count(*)::int as count
          from source_decisions
        `;
        const staleReport = await inspectSourceAuthorityIntegrity({
          databaseUrl: disposableDatabase.databaseUrl
        });
        const afterFinalInspection = await client<{ count: number }[]>`
          select count(*)::int as count
          from source_decisions
        `;

        expect(emptyReport).toMatchObject({
          readOnly: true,
          violationCount: 0,
          violations: [],
          integrityReady: true
        });
        expect(currentReport).toMatchObject({
          readOnly: true,
          violationCount: 0,
          violations: [],
          integrityReady: true
        });
        expect(unknownReport).toMatchObject({
          readOnly: true,
          violationCount: 1,
          violations: [expectedFreshnessViolation(unknownFixture, "unknown")],
          integrityReady: false
        });
        expect(staleReport).toMatchObject({
          readOnly: true,
          violationCount: 2,
          integrityReady: false
        });
        expect(staleReport.violations).toEqual(expect.arrayContaining([
          expectedFreshnessViolation(staleFixture, "stale"),
          expectedFreshnessViolation(unknownFixture, "unknown")
        ]));
        expect(afterFinalInspection).toEqual(beforeFinalInspection);
      } finally {
        await client.end();
        await disposableDatabase.cleanup();
      }
    },
    60_000
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "reports each controlled authority violation exactly once without writing",
    async () => {
      const client = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const marker = `source-authority-integrity-${crypto.randomUUID()}`;
      let residueCount: number | undefined;
      try {
        await client.unsafe("set session_replication_role = replica");
        const workspace = await client<{ id: string }[]>`
          insert into workspaces (slug, display_name, metadata)
          values (${marker}, 'Source authority integrity smoke', ${client.json({ smokeId: marker })})
          returning id
        `;
        const workspaceId = workspace[0]?.id;
        if (workspaceId === undefined) {
          throw new Error("source authority integrity smoke workspace was not created");
        }

        const projects = await client<{ id: string; slug: string }[]>`
          insert into projects (workspace_id, slug, display_name, metadata)
          values
            (${workspaceId}, ${`${marker}-one`}, 'Source authority integrity one', ${client.json({ smokeId: marker })}),
            (${workspaceId}, ${`${marker}-two`}, 'Source authority integrity two', ${client.json({ smokeId: marker })})
          returning id, slug
        `;
        const projectOne = projects.find((project) => project.slug.endsWith("-one"))?.id;
        const projectTwo = projects.find((project) => project.slug.endsWith("-two"))?.id;
        if (projectOne === undefined || projectTwo === undefined) {
          throw new Error("source authority integrity smoke projects were not created");
        }

        const createArtifact = async (suffix: string, projectId = projectOne, metadata = fixtureMetadata(marker)) => {
          const rows = await client<{ id: string }[]>`
            insert into source_artifacts (project_id, kind, trust_tier, uri, title, content_hash, metadata)
            values (${projectId}, 'doc', 'project-decision', ${`source-authority://${marker}/${suffix}`}, ${suffix}, ${`sha256:${marker}:${suffix}`}, ${client.json(metadata)})
            returning id
          `;
          return rows[0]!.id;
        };
        const createClaim = async (artifactId: string, status: "proposed" | "accepted" = "proposed", metadata = fixtureMetadata(marker)) => {
          const rows = await client<{ id: string }[]>`
            insert into source_claims (source_artifact_id, claim, mechanism, krn_implication, does_not_prove, trust_tier, support_type, consumer, status, metadata)
            values (${artifactId}, 'fixture claim', 'fixture mechanism', 'fixture implication', 'fixture non-proof', 'project-decision', 'implementation-boundary', 'source authority smoke', ${status}, ${client.json(metadata)})
            returning id
          `;
          return rows[0]!.id;
        };
        const createDecision = async (claimId: string, status: "adopt" | "reject" | "defer", projectId = projectOne, metadata = fixtureMetadata(marker)) => {
          const rows = await client<{ id: string }[]>`
            insert into source_decisions (project_id, source_claim_id, status, decision, rationale, falsifier, consumer, metadata)
            values (${projectId}, ${claimId}, ${status}, 'fixture decision', 'fixture rationale', 'fixture falsifier', 'source authority smoke', ${client.json(metadata)})
            returning id
          `;
          return rows[0]!.id;
        };

        const mismatchArtifact = await createArtifact("project-mismatch");
        const mismatchClaim = await createClaim(mismatchArtifact);
        const mismatchDecision = await createDecision(mismatchClaim, "adopt", projectTwo);

        const missingArtifact = await createArtifact("missing-review");
        const missingClaim = await createClaim(missingArtifact, "accepted");

        const conflictArtifact = await createArtifact("conflict-review");
        const conflictClaim = await createClaim(conflictArtifact, "accepted");
        await createDecision(conflictClaim, "adopt");
        await createDecision(conflictClaim, "defer");

        const mismatchStatusArtifact = await createArtifact("status-mismatch");
        const mismatchStatusClaim = await createClaim(mismatchStatusArtifact, "accepted");
        await createDecision(mismatchStatusClaim, "defer");

        const invalidEdgeArtifact = await createArtifact("invalid-edge");
        const invalidEdgeClaim = await createClaim(invalidEdgeArtifact);
        const invalidEdgeDecision = await createDecision(invalidEdgeClaim, "reject");
        const invalidEdge = await client<{ id: string }[]>`
          insert into source_decision_edges (source_claim_id, source_decision_id, target_type, target_id, support_type, confidence, notes, metadata)
          values (${invalidEdgeClaim}, ${invalidEdgeDecision}, 'architecture_decision', ${`${marker}-invalid-edge`}, 'implementation-boundary', 'high', 'fixture edge', ${client.json({ smokeId: marker })})
          returning id
        `;

        const activeSearchArtifact = await createArtifact("active-search");
        const activeSearchClaim = await createClaim(activeSearchArtifact);
        const activeSearch = await client<{ id: string }[]>`
          insert into search_documents (project_id, subject_type, subject_id, source_artifact_id, source_claim_id, trust_tier, validity_status, title, body, search_text, metadata)
          values (${projectOne}, 'source_claim', ${activeSearchClaim}, ${activeSearchArtifact}, ${activeSearchClaim}, 'project-decision', 'active', 'fixture search', 'fixture body', 'fixture search', ${client.json({ smokeId: marker })})
          returning id
        `;

        const incompleteArtifact = await client<{ id: string }[]>`
          insert into source_artifacts (project_id, import_id, import_row_id, kind, trust_tier, uri, title, content_hash, metadata)
          values (${projectOne}, ${marker}, 'incomplete', 'doc', 'project-decision', ${`source-authority://${marker}/incomplete`}, 'incomplete', ${`sha256:${marker}:incomplete`}, ${client.json({ smokeId: marker, decisionCorpusStatus: "current" })})
          returning id
        `;

        const evidenceArtifact = await createArtifact("evidence-mismatch", projectOne, fixtureMetadata(marker, "sha256:artifact-evidence"));
        const evidenceClaim = await createClaim(evidenceArtifact, "accepted", fixtureMetadata(marker, "sha256:claim-evidence"));
        const evidenceChunk = await client<{ id: string }[]>`
          insert into source_chunks (source_artifact_id, ordinal, content, content_hash, metadata)
          values (${evidenceArtifact}, 0, 'fixture evidence chunk', ${`sha256:${marker}:chunk`}, ${client.json(fixtureMetadata(marker, "sha256:chunk-evidence"))})
          returning id
        `;
        const evidenceDecision = await createDecision(evidenceClaim, "adopt", projectOne, fixtureMetadata(marker, "sha256:decision-evidence"));

        const before = await client<{ count: number }[]>`select count(*)::int as count from source_artifacts`;
        const report = await inspectSourceAuthorityIntegrity({ databaseUrl: databaseUrl! });
        const after = await client<{ count: number }[]>`select count(*)::int as count from source_artifacts`;
        const fixtureSubjectIds = [
          mismatchDecision,
          missingClaim,
          conflictClaim,
          mismatchStatusClaim,
          invalidEdge[0]!.id,
          activeSearch[0]!.id,
          incompleteArtifact[0]!.id,
          evidenceDecision
        ];
        const fixtureViolations = report.violations.filter((item) => fixtureSubjectIds.includes(item.subjectId));

        expect(report.readOnly).toBe(true);
        expect(after[0]?.count).toBe(before[0]?.count);
        expect(new Set(fixtureViolations.map((item) => item.id)).size).toBe(fixtureViolations.length);
        expect(fixtureViolations).toEqual(expect.arrayContaining([
          expect.objectContaining({ kind: "project_mismatch", subjectId: mismatchDecision }),
          expect.objectContaining({ kind: "missing_terminal_review", subjectId: missingClaim }),
          expect.objectContaining({ kind: "conflicting_terminal_review", subjectId: conflictClaim }),
          expect.objectContaining({ kind: "claim_decision_status_mismatch", subjectId: mismatchStatusClaim }),
          expect.objectContaining({ kind: "governing_edge_without_current_reviewed_decision", subjectId: invalidEdge[0]!.id }),
          expect.objectContaining({ kind: "active_search_without_canonical_authority", subjectId: activeSearch[0]!.id }),
          expect.objectContaining({ kind: "incomplete_import_lifecycle", subjectId: incompleteArtifact[0]!.id }),
          expect.objectContaining({ kind: "captured_evidence_missing_or_mismatched", subjectId: evidenceDecision })
        ]));
        void evidenceChunk;
      } finally {
        try {
          residueCount = await cleanupFixture(client, marker);
        } finally {
          await client.end();
        }
      }
      expect(residueCount).toBe(0);
    }
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "rejects new cross-project, arbitrary-edge, and competing terminal writes",
    async () => {
      const client = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const marker = `source-authority-constraints-${crypto.randomUUID()}`;
      let residueCount: number | undefined;
      try {
        const workspace = await client<{ id: string }[]>`
          insert into workspaces (slug, display_name, metadata)
          values (${marker}, 'Source authority constraint smoke', ${client.json({ smokeId: marker })})
          returning id
        `;
        const workspaceId = workspace[0]!.id;
        const projects = await client<{ id: string }[]>`
          insert into projects (workspace_id, slug, display_name, metadata)
          values
            (${workspaceId}, ${`${marker}-one`}, 'Constraint one', ${client.json({ smokeId: marker })}),
            (${workspaceId}, ${`${marker}-two`}, 'Constraint two', ${client.json({ smokeId: marker })})
          returning id
        `;
        const projectOne = projects[0]!.id;
        const projectTwo = projects[1]!.id;
        const artifact = await client<{ id: string }[]>`
          insert into source_artifacts (project_id, kind, trust_tier, uri, title, content_hash, metadata)
          values (${projectOne}, 'doc', 'project-decision', ${`source-authority://${marker}/artifact`}, 'constraint artifact', ${`sha256:${marker}`}, ${client.json({ smokeId: marker })})
          returning id
        `;
        const claim = await client<{ id: string }[]>`
          insert into source_claims (source_artifact_id, claim, mechanism, krn_implication, does_not_prove, trust_tier, support_type, consumer, status, metadata)
          values (${artifact[0]!.id}, 'constraint claim', 'mechanism', 'implication', 'non-proof', 'project-decision', 'implementation-boundary', 'constraint smoke', 'accepted', ${client.json({ smokeId: marker })})
          returning id
        `;
        const decision = await client<{ id: string }[]>`
          insert into source_decisions (project_id, source_claim_id, status, decision, rationale, falsifier, consumer, metadata)
          values (${projectOne}, ${claim[0]!.id}, 'adopt', 'adopted', 'rationale', 'falsifier', 'constraint smoke', ${client.json({ smokeId: marker })})
          returning id
        `;

        await expect(client`
          insert into source_decisions (project_id, source_claim_id, status, decision, rationale, falsifier, consumer, metadata)
          values (${projectTwo}, ${claim[0]!.id}, 'adopt', 'cross-project', 'rationale', 'falsifier', 'constraint smoke', ${client.json({ smokeId: marker })})
        `).rejects.toThrow("governing SourceDecision project");

        const arbitraryClaim = await client<{ id: string }[]>`
          insert into source_claims (source_artifact_id, claim, mechanism, krn_implication, does_not_prove, trust_tier, support_type, consumer, status, metadata)
          values (${artifact[0]!.id}, 'arbitrary edge claim', 'mechanism', 'implication', 'non-proof', 'project-decision', 'implementation-boundary', 'constraint smoke', 'proposed', ${client.json({ smokeId: marker })})
          returning id
        `;
        const arbitraryDecision = await client<{ id: string }[]>`
          insert into source_decisions (project_id, source_claim_id, status, decision, rationale, falsifier, consumer, metadata)
          values (${projectOne}, ${arbitraryClaim[0]!.id}, 'reject', 'rejected', 'rationale', 'falsifier', 'constraint smoke', ${client.json({ smokeId: marker })})
          returning id
        `;
        await expect(client`
          insert into source_decision_edges (source_claim_id, source_decision_id, target_type, target_id, support_type, confidence, notes, metadata)
          values (${arbitraryClaim[0]!.id}, ${arbitraryDecision[0]!.id}, 'architecture_decision', ${`${marker}-arbitrary`}, 'implementation-boundary', 'high', 'arbitrary', ${client.json({ smokeId: marker })})
        `).rejects.toThrow("SourceDecisionEdge requires same-project adopted reviewed SourceDecision");

        await expect(client`
          insert into source_decisions (project_id, source_claim_id, status, decision, rationale, falsifier, consumer, metadata)
          values (${projectOne}, ${claim[0]!.id}, 'reject', 'competing', 'rationale', 'falsifier', 'constraint smoke', ${client.json({ smokeId: marker })})
        `).rejects.toThrow();
        void decision;
      } finally {
        try {
          residueCount = await cleanupFixture(client, marker);
        } finally {
          await client.end();
        }
      }
      expect(residueCount).toBe(0);
    }
  );
});
