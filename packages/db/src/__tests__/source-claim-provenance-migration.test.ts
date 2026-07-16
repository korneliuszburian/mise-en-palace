import crypto from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import postgres from "postgres";
import { describe, expect, it } from "vitest";
import { retrieveActivationCandidates } from "@krn/harness";

import { createKrnDatabase } from "../database.js";
import { migrateDatabase } from "../migration-readiness.js";
import {
  DrizzleMemoryRepository,
  DrizzleRetrievalRepository,
  DrizzleSourceRepository
} from "../repositories/index.js";
import { inspectSourceAuthorityIntegrity } from "../source-authority-integrity-readiness.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));
const migrationTestTimeoutMs = 60_000;

interface MigrationJournalEntry {
  readonly idx: number;
  readonly version: string;
  readonly when: number;
  readonly tag: string;
  readonly breakpoints: boolean;
}

interface MigrationJournal {
  readonly version: string;
  readonly dialect: string;
  readonly entries: readonly MigrationJournalEntry[];
}

interface MismatchedClaimFixture {
  readonly projectId: string;
  readonly claimArtifactId: string;
  readonly wrongChunkId: string;
  readonly actualChunkArtifactId: string;
  readonly claimId: string;
  readonly coherentPeerClaimId: string;
  readonly unrelatedPeerClaimId: string;
  readonly taintedClaimEdgeId: string;
  readonly coherentClaimEdgeId: string;
  readonly decisionId: string;
  readonly edgeId: string;
  readonly searchId: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isMigrationJournalEntry = (value: unknown): value is MigrationJournalEntry =>
  isRecord(value) &&
  typeof value.idx === "number" &&
  Number.isInteger(value.idx) &&
  typeof value.version === "string" &&
  typeof value.when === "number" &&
  Number.isFinite(value.when) &&
  typeof value.tag === "string" &&
  typeof value.breakpoints === "boolean";

const isMigrationJournal = (value: unknown): value is MigrationJournal =>
  isRecord(value) &&
  typeof value.version === "string" &&
  typeof value.dialect === "string" &&
  Array.isArray(value.entries) &&
  value.entries.every(isMigrationJournalEntry);

const parseMigrationJournal = (contents: string): MigrationJournal => {
  const parsed: unknown = JSON.parse(contents);

  if (!isMigrationJournal(parsed)) {
    throw new Error("migration journal has an invalid shape");
  }

  return parsed;
};

const databaseUrlFor = (input: string, databaseName: string): string => {
  const parsed = new URL(input);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
};

const createDisposableDatabase = async (input: string): Promise<{
  readonly databaseUrl: string;
  readonly cleanup: () => Promise<void>;
}> => {
  const databaseName = `krn_source_claim_migration_${crypto.randomUUID().replaceAll("-", "")}`;
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

const createMigrationsFolderThrough = async (
  lastMigrationIndex: number,
  expectedLastTag: string
): Promise<{
  readonly migrationsFolder: string;
  readonly cleanup: () => Promise<void>;
}> => {
  const temporaryFolder = await mkdtemp(
    join(tmpdir(), `krn-migrations-through-${lastMigrationIndex}-`)
  );

  try {
    const journalPath = join(migrationsFolder, "meta", "_journal.json");
    const journal = parseMigrationJournal(await readFile(journalPath, "utf8"));
    const entries = journal.entries.filter((entry) => entry.idx <= lastMigrationIndex);

    if (
      entries.length !== lastMigrationIndex + 1 ||
      entries.some((entry, index) => entry.idx !== index) ||
      entries.at(-1)?.tag !== expectedLastTag
    ) {
      throw new Error(
        `migration journal does not contain the expected contiguous 0000-${lastMigrationIndex} range`
      );
    }

    const temporaryJournalPath = join(temporaryFolder, "meta", "_journal.json");
    await mkdir(dirname(temporaryJournalPath), { recursive: true });
    await Promise.all(entries.map(async (entry) => {
      const filename = `${entry.tag}.sql`;
      await copyFile(join(migrationsFolder, filename), join(temporaryFolder, filename));
    }));
    await writeFile(
      temporaryJournalPath,
      `${JSON.stringify({ ...journal, entries }, null, 2)}\n`,
      "utf8"
    );
  } catch (error) {
    await rm(temporaryFolder, { recursive: true, force: true });
    throw error;
  }

  return {
    migrationsFolder: temporaryFolder,
    cleanup: () => rm(temporaryFolder, { recursive: true, force: true })
  };
};

const seedMismatchedClaim = async (
  input: string,
  marker: string
): Promise<MismatchedClaimFixture> => {
  const client = postgres(input, { max: 1, onnotice: () => undefined });
  const evidenceContentHash = `sha256:${marker}:evidence`;
  const evidenceMetadata = {
    smokeId: marker,
    evidenceStatus: "captured",
    evidenceContentHash,
    evidenceFreshness: "current"
  };

  try {
    const rows = await client<MismatchedClaimFixture[]>`
      with workspace as (
        insert into workspaces (slug, display_name, metadata)
        values (${marker}, ${marker}, ${client.json({ smokeId: marker })})
        returning id
      ), project as (
        insert into projects (workspace_id, slug, display_name, metadata)
        select id, ${marker}, ${marker}, ${client.json({ smokeId: marker })}
        from workspace
        returning id
      ), claim_artifact as (
        insert into source_artifacts (
          project_id, kind, trust_tier, uri, title, content_hash, metadata
        )
        select
          id,
          'doc',
          'project-decision',
          ${`source-authority://${marker}/claim-artifact`},
          'claim artifact',
          ${`sha256:${marker}:claim-artifact`},
          ${client.json(evidenceMetadata)}
        from project
        returning id
      ), actual_chunk_artifact as (
        insert into source_artifacts (
          project_id, kind, trust_tier, uri, title, content_hash, metadata
        )
        select
          id,
          'doc',
          'project-decision',
          ${`source-authority://${marker}/actual-chunk-artifact`},
          'actual chunk artifact',
          ${`sha256:${marker}:actual-chunk-artifact`},
          ${client.json({ smokeId: marker })}
        from project
        returning id
      ), claim_artifact_chunk as (
        insert into source_chunks (
          source_artifact_id, ordinal, content, content_hash, metadata
        )
        select
          id,
          0,
          'captured evidence for the claim artifact',
          ${evidenceContentHash},
          ${client.json(evidenceMetadata)}
        from claim_artifact
        returning id
      ), wrong_chunk as (
        insert into source_chunks (
          source_artifact_id, ordinal, content, content_hash, metadata
        )
        select
          id,
          0,
          'chunk owned by the other artifact',
          ${`sha256:${marker}:wrong-chunk`},
          ${client.json({ smokeId: marker })}
        from actual_chunk_artifact
        returning id
      ), claim as (
        insert into source_claims (
          source_artifact_id, source_chunk_id, claim, mechanism, krn_implication,
          does_not_prove, trust_tier, support_type, consumer, status, metadata
        )
        select
          claim_artifact.id,
          wrong_chunk.id,
          'legacy mismatched claim',
          'a pre-0030 write linked a chunk from a different artifact',
          'the migration must quarantine authority before enforcing provenance',
          'does not prove captured evidence authority',
          'project-decision',
          'implementation-boundary',
          'source claim provenance migration',
          'accepted',
          ${client.json(evidenceMetadata)}
        from claim_artifact, wrong_chunk
        returning id
      ), coherent_peer_claim as (
        insert into source_claims (
          source_artifact_id, source_chunk_id, claim, mechanism, krn_implication,
          does_not_prove, trust_tier, support_type, consumer, status, metadata
        )
        select
          claim_artifact.id,
          claim_artifact_chunk.id,
          'coherent peer claim',
          'the peer retains one unrelated coherent edge after migration',
          'migration proof distinguishes tainted and coherent graph relations',
          'does not prove the peer claim is true',
          'project-decision',
          'implementation-boundary',
          'source claim provenance migration',
          'accepted',
          ${client.json(evidenceMetadata)}
        from claim_artifact, claim_artifact_chunk
        returning id
      ), unrelated_peer_claim as (
        insert into source_claims (
          source_artifact_id, source_chunk_id, claim, mechanism, krn_implication,
          does_not_prove, trust_tier, support_type, consumer, status, metadata
        )
        select
          claim_artifact.id,
          claim_artifact_chunk.id,
          'unrelated coherent peer claim',
          'the claim anchors an unaffected graph relation',
          'migration proof preserves coherent graph relations',
          'does not prove the relation is useful',
          'project-decision',
          'implementation-boundary',
          'source claim provenance migration',
          'proposed',
          ${client.json(evidenceMetadata)}
        from claim_artifact, claim_artifact_chunk
        returning id
      ), decision as (
        insert into source_decisions (
          project_id, source_claim_id, status, decision, rationale,
          falsifier, consumer, metadata
        )
        select
          project.id,
          claim.id,
          'adopt',
          'legacy adopted decision',
          'the legacy row appeared coherent before artifact-chunk integrity',
          'migration detects the mismatched chunk owner',
          'source claim provenance migration',
          ${client.json(evidenceMetadata)}
        from project, claim
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
          ${marker},
          'implementation-boundary',
          'high',
          'legacy governing edge',
          ${client.json({ smokeId: marker })}
        from claim, decision
        returning id
      ), coherent_peer_decision as (
        insert into source_decisions (
          project_id, source_claim_id, status, decision, rationale,
          falsifier, consumer, metadata
        )
        select
          project.id,
          coherent_peer_claim.id,
          'adopt',
          'retain coherent peer claim',
          'the peer provenance is internally coherent',
          'migration corrupts or removes the coherent peer authority chain',
          'source claim provenance migration',
          ${client.json(evidenceMetadata)}
        from project, coherent_peer_claim
        returning id
      ), coherent_peer_decision_edge as (
        insert into source_decision_edges (
          source_claim_id, source_decision_id, target_type, target_id,
          support_type, confidence, notes, metadata
        )
        select
          coherent_peer_claim.id,
          coherent_peer_decision.id,
          'architecture_decision',
          ${`${marker}:coherent-peer`},
          'implementation-boundary',
          'high',
          'coherent peer governing edge',
          ${client.json({ smokeId: marker })}
        from coherent_peer_claim, coherent_peer_decision
        returning id
      ), tainted_claim_edge as (
        insert into source_claim_edges (
          from_source_claim_id, to_source_claim_id, kind, metadata
        )
        select
          claim.id,
          coherent_peer_claim.id,
          'supports',
          ${client.json({
            consumer: "source claim provenance migration",
            doesNotProve: "a retained edge would not prove the quarantined claim is authoritative",
            evidenceRef: `migration-fixture:${marker}:tainted-edge`
          })}
        from claim, coherent_peer_claim
        returning id
      ), coherent_claim_edge as (
        insert into source_claim_edges (
          from_source_claim_id, to_source_claim_id, kind, metadata
        )
        select
          coherent_peer_claim.id,
          unrelated_peer_claim.id,
          'supports',
          ${client.json({
            consumer: "source claim provenance migration",
            doesNotProve: "structural coherence does not prove graph relation truth",
            evidenceRef: `migration-fixture:${marker}:coherent-edge`
          })}
        from coherent_peer_claim, unrelated_peer_claim
        returning id
      ), search as (
        insert into search_documents (
          project_id, subject_type, subject_id, source_artifact_id, source_chunk_id,
          source_claim_id, source_decision_id, trust_tier, validity_status,
          title, body, search_text, metadata
        )
        select
          project.id,
          'source_claim',
          claim.id,
          claim_artifact.id,
          wrong_chunk.id,
          claim.id,
          decision.id,
          'project-decision',
          'active',
          'legacy active search document',
          'legacy active search document body',
          'legacy active search document',
          ${client.json({ smokeId: marker })}
        from project, claim_artifact, wrong_chunk, claim, decision
        returning id
      )
      select
        project.id::text as "projectId",
        claim_artifact.id::text as "claimArtifactId",
        wrong_chunk.id::text as "wrongChunkId",
        actual_chunk_artifact.id::text as "actualChunkArtifactId",
        claim.id::text as "claimId",
        coherent_peer_claim.id::text as "coherentPeerClaimId",
        unrelated_peer_claim.id::text as "unrelatedPeerClaimId",
        tainted_claim_edge.id::text as "taintedClaimEdgeId",
        coherent_claim_edge.id::text as "coherentClaimEdgeId",
        decision.id::text as "decisionId",
        edge.id::text as "edgeId",
        search.id::text as "searchId"
      from
        project,
        claim_artifact,
        actual_chunk_artifact,
        claim_artifact_chunk,
        wrong_chunk,
        claim,
        coherent_peer_claim,
        unrelated_peer_claim,
        decision,
        edge,
        coherent_peer_decision,
        coherent_peer_decision_edge,
        tainted_claim_edge,
        coherent_claim_edge,
        search
    `;
    const fixture = rows[0];

    if (fixture === undefined) {
      throw new Error("failed to seed a mismatched SourceClaim migration fixture");
    }

    return fixture;
  } finally {
    await client.end();
  }
};

const seedElevatedClaim = async (
  input: string,
  marker: string
): Promise<{ readonly artifactId: string; readonly claimId: string }> => {
  const client = postgres(input, { max: 1, onnotice: () => undefined });

  try {
    const rows = await client<{ artifactId: string; claimId: string }[]>`
      with workspace as (
        insert into workspaces (slug, display_name, metadata)
        values (${marker}, ${marker}, ${client.json({ smokeId: marker })})
        returning id
      ), project as (
        insert into projects (workspace_id, slug, display_name, metadata)
        select id, ${marker}, ${marker}, ${client.json({ smokeId: marker })}
        from workspace
        returning id
      ), artifact as (
        insert into source_artifacts (
          project_id, kind, trust_tier, uri, title, content_hash, metadata
        )
        select
          id,
          'doc',
          'hypothesis',
          ${`source-authority://${marker}/hypothesis`},
          'legacy hypothesis artifact',
          ${`sha256:${marker}:hypothesis`},
          ${client.json({ smokeId: marker })}
        from project
        returning id
      ), chunk as (
        insert into source_chunks (
          source_artifact_id, ordinal, content, content_hash, metadata
        )
        select
          id,
          0,
          'legacy hypothesis artifact chunk',
          ${`sha256:${marker}:chunk`},
          ${client.json({ smokeId: marker })}
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
          'legacy elevated official claim',
          'pre-0042 writes did not compare claim and artifact authority',
          'migration must block instead of silently clamping authority',
          'does not prove the artifact tier is correct',
          'official',
          'implementation-boundary',
          'source authority ceiling migration',
          'proposed',
          ${client.json({ smokeId: marker })}
        from artifact, chunk
        returning id, source_artifact_id
      )
      select
        source_artifact_id::text as "artifactId",
        id::text as "claimId"
      from claim
    `;
    const fixture = rows[0];

    if (fixture === undefined) {
      throw new Error("failed to seed an elevated SourceClaim migration fixture");
    }

    return fixture;
  } finally {
    await client.end();
  }
};

const seedHypothesisArtifact = async (
  input: string,
  marker: string
): Promise<{ readonly artifactId: string; readonly chunkId: string }> => {
  const client = postgres(input, { max: 1, onnotice: () => undefined });

  try {
    const rows = await client<{ artifactId: string; chunkId: string }[]>`
      with workspace as (
        insert into workspaces (slug, display_name, metadata)
        values (${marker}, ${marker}, ${client.json({ smokeId: marker })})
        returning id
      ), project as (
        insert into projects (workspace_id, slug, display_name, metadata)
        select id, ${marker}, ${marker}, ${client.json({ smokeId: marker })}
        from workspace
        returning id
      ), artifact as (
        insert into source_artifacts (
          project_id, kind, trust_tier, uri, title, content_hash, metadata
        )
        select
          id,
          'doc',
          'hypothesis',
          ${`source-authority://${marker}/hypothesis`},
          'hypothesis artifact',
          ${`sha256:${marker}:hypothesis`},
          ${client.json({ smokeId: marker })}
        from project
        returning id
      ), chunk as (
        insert into source_chunks (
          source_artifact_id, ordinal, content, content_hash, metadata
        )
        select
          id,
          0,
          'hypothesis artifact chunk',
          ${`sha256:${marker}:chunk`},
          ${client.json({ smokeId: marker })}
        from artifact
        returning id, source_artifact_id
      )
      select
        source_artifact_id::text as "artifactId",
        id::text as "chunkId"
      from chunk
    `;
    const fixture = rows[0];

    if (fixture === undefined) {
      throw new Error("failed to seed a hypothesis SourceArtifact migration fixture");
    }

    return fixture;
  } finally {
    await client.end();
  }
};

describe("SourceClaim provenance migration", () => {
  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "quarantines legacy artifact-chunk mismatches before validating the composite foreign key",
    async () => {
      const disposable = await createDisposableDatabase(databaseUrl!);
      let pre0030Migrations: Awaited<ReturnType<typeof createMigrationsFolderThrough>> | undefined;
      const marker = `source-claim-migration-${crypto.randomUUID()}`;

      try {
        pre0030Migrations = await createMigrationsFolderThrough(29, "0029_careful_spyke");
        const pre0030Report = await migrateDatabase({
          databaseUrl: disposable.databaseUrl,
          migrationsFolder: pre0030Migrations.migrationsFolder
        });
        expect(pre0030Report).toMatchObject({
          expectedMigrationCount: 30,
          appliedMigrationCount: 30,
          migrationIdentityStatus: "verified",
          migrationsVerified: true
        });

        const fixture = await seedMismatchedClaim(disposable.databaseUrl, marker);
        const post0030Report = await migrateDatabase({
          databaseUrl: disposable.databaseUrl,
          migrationsFolder
        });
        expect(post0030Report).toMatchObject({
          migrationIdentityStatus: "verified",
          migrationsVerified: true
        });
        expect(post0030Report.expectedMigrationCount).toBeGreaterThan(30);
        expect(post0030Report.appliedMigrationCount).toBe(
          post0030Report.expectedMigrationCount
        );
        const retryReport = await migrateDatabase({
          databaseUrl: disposable.databaseUrl,
          migrationsFolder
        });
        expect(retryReport).toMatchObject({
          expectedMigrationCount: post0030Report.expectedMigrationCount,
          appliedMigrationCount: post0030Report.appliedMigrationCount,
          migrationIdentityStatus: "verified",
          migrationsVerified: true
        });

        const client = postgres(disposable.databaseUrl, {
          max: 1,
          onnotice: () => undefined
        });

        try {
          const claimRows = await client<{
            status: string;
            sourceChunkId: string | null;
          }[]>`
            select status::text, source_chunk_id::text as "sourceChunkId"
            from source_claims
            where id = ${fixture.claimId}
          `;
          expect(claimRows).toEqual([{ status: "proposed", sourceChunkId: null }]);

          const decisionRows = await client<{
            status: string;
            projectId: string | null;
          }[]>`
            select status::text, project_id::text as "projectId"
            from source_decisions
            where id = ${fixture.decisionId}
          `;
          expect(decisionRows).toEqual([{ status: "lab_test", projectId: null }]);

          const edgeRows = await client<{ count: number }[]>`
            select count(*)::int as count
            from source_decision_edges
            where id = ${fixture.edgeId}
          `;
          expect(edgeRows).toEqual([{ count: 0 }]);

          const claimEdgeRows = await client<{
            id: string;
            fromSourceClaimId: string;
            toSourceClaimId: string;
          }[]>`
            select
              id::text,
              from_source_claim_id::text as "fromSourceClaimId",
              to_source_claim_id::text as "toSourceClaimId"
            from source_claim_edges
            where id in (${fixture.taintedClaimEdgeId}, ${fixture.coherentClaimEdgeId})
            order by id
          `;
          expect(claimEdgeRows).toEqual([{
            id: fixture.coherentClaimEdgeId,
            fromSourceClaimId: fixture.coherentPeerClaimId,
            toSourceClaimId: fixture.unrelatedPeerClaimId
          }]);

          const activationNow = "2026-07-16T00:00:00.000Z";
          const database = createKrnDatabase(client);
          const retrieved = await retrieveActivationCandidates({
            taskContract: {
              id: `task-${marker}`,
              operatorIntentId: `intent-${marker}`,
              projectId: fixture.projectId,
              title: "Review coherent peer claim migration",
              objective: "Keep coherent peer claim graph context without legacy mixed provenance",
              constraints: ["exclude quarantined graph authority"],
              nonGoals: ["do not infer replacement provenance"],
              acceptance: ["only coherent graph influence remains"],
              status: "active",
              metadata: {},
              createdAt: activationNow,
              updatedAt: activationNow
            },
            now: activationNow,
            limits: {
              memory: 0,
              source: 10,
              search: 0,
              antiMemory: 0
            },
            repositories: {
              memoryRepository: new DrizzleMemoryRepository(database),
              sourceRepository: new DrizzleSourceRepository(database),
              retrievalRepository: new DrizzleRetrievalRepository(database)
            }
          });
          const candidateWithCoherentInfluence = retrieved.candidates.find((candidate) =>
            JSON.stringify(candidate.metadata).includes(fixture.coherentClaimEdgeId)
          );

          expect(JSON.stringify(retrieved.candidates)).not.toContain(fixture.taintedClaimEdgeId);
          expect(candidateWithCoherentInfluence?.metadata).toMatchObject({
            sourceClaimEdgeInfluence: {
              edgeIds: [fixture.coherentClaimEdgeId]
            }
          });
          expect(candidateWithCoherentInfluence?.graphScore).toBeGreaterThan(0);

          const searchRows = await client<{
            validityStatus: string;
            invalidated: boolean;
          }[]>`
            select
              validity_status::text as "validityStatus",
              invalidated_at is not null as invalidated
            from search_documents
            where id = ${fixture.searchId}
          `;
          expect(searchRows).toEqual([{
            validityStatus: "invalidated",
            invalidated: true
          }]);

          const quarantineRows = await client<{
            entityType: string;
            entityId: string;
          }[]>`
            select entity_type as "entityType", entity_id::text as "entityId"
            from source_authority_quarantines
            where reason = 'claim_chunk_artifact_mismatch'
              and entity_id in (
                ${fixture.claimId},
                ${fixture.taintedClaimEdgeId},
                ${fixture.decisionId},
                ${fixture.edgeId},
                ${fixture.searchId}
              )
            order by entity_type
          `;
          expect(quarantineRows).toEqual([
            { entityType: "search_document", entityId: fixture.searchId },
            { entityType: "source_claim", entityId: fixture.claimId },
            { entityType: "source_claim_edge", entityId: fixture.taintedClaimEdgeId },
            { entityType: "source_decision", entityId: fixture.decisionId },
            { entityType: "source_decision_edge", entityId: fixture.edgeId }
          ]);

          const claimEdgeQuarantineRows = await client<{
            fromSourceClaimId: string | null;
            toSourceClaimId: string | null;
            quarantinedSourceClaimIds: string[] | null;
          }[]>`
            select
              metadata->>'from_source_claim_id' as "fromSourceClaimId",
              metadata->>'to_source_claim_id' as "toSourceClaimId",
              array(
                select jsonb_array_elements_text(metadata->'quarantined_source_claim_ids')
              ) as "quarantinedSourceClaimIds"
            from source_authority_quarantines
            where entity_type = 'source_claim_edge'
              and entity_id = ${fixture.taintedClaimEdgeId}
              and reason = 'claim_chunk_artifact_mismatch'
          `;
          expect(claimEdgeQuarantineRows).toEqual([{
            fromSourceClaimId: fixture.claimId,
            toSourceClaimId: fixture.coherentPeerClaimId,
            quarantinedSourceClaimIds: [fixture.claimId]
          }]);

          const claimQuarantineRows = await client<{
            claimArtifactId: string | null;
            wrongChunkId: string | null;
            actualChunkArtifactId: string | null;
          }[]>`
            select
              metadata->>'source_artifact_id' as "claimArtifactId",
              metadata->>'source_chunk_id' as "wrongChunkId",
              metadata->>'chunk_source_artifact_id' as "actualChunkArtifactId"
            from source_authority_quarantines
            where entity_type = 'source_claim'
              and entity_id = ${fixture.claimId}
              and reason = 'claim_chunk_artifact_mismatch'
          `;
          expect(claimQuarantineRows).toEqual([{
            claimArtifactId: fixture.claimArtifactId,
            wrongChunkId: fixture.wrongChunkId,
            actualChunkArtifactId: fixture.actualChunkArtifactId
          }]);

          const constraintRows = await client<{
            validated: boolean;
            localColumns: string[];
            referencedColumns: string[];
          }[]>`
            select
              constraint_row.convalidated as validated,
              array(
                select attribute.attname::text
                from unnest(constraint_row.conkey) with ordinality as key(attnum, position)
                join pg_attribute attribute
                  on attribute.attrelid = constraint_row.conrelid
                 and attribute.attnum = key.attnum
                order by key.position
              ) as "localColumns",
              array(
                select attribute.attname::text
                from unnest(constraint_row.confkey) with ordinality as key(attnum, position)
                join pg_attribute attribute
                  on attribute.attrelid = constraint_row.confrelid
                 and attribute.attnum = key.attnum
                order by key.position
              ) as "referencedColumns"
            from pg_constraint constraint_row
            where constraint_row.conname = 'source_claims_chunk_artifact_fk'
              and constraint_row.conrelid = 'source_claims'::regclass
              and constraint_row.contype = 'f'
          `;
          expect(constraintRows).toEqual([{
            validated: true,
            localColumns: ["source_chunk_id", "source_artifact_id"],
            referencedColumns: ["id", "source_artifact_id"]
          }]);

          const [deleteProof] = await client<{
            claimId: string;
            sourceArtifactId: string;
            sourceChunkId: string;
          }[]>`
            with artifact as (
              select source_artifact_id as id
              from source_claims
              where id = ${fixture.coherentPeerClaimId}
            ), chunk as (
              insert into source_chunks (
                source_artifact_id, ordinal, content, content_hash
              )
              select
                artifact.id,
                coalesce((
                  select max(existing.ordinal) + 1
                  from source_chunks existing
                  where existing.source_artifact_id = artifact.id
                ), 0),
                'source chunk delete behavior proof',
                ${`sha256:${marker}:delete-proof-chunk`}
              from artifact
              returning id, source_artifact_id
            ), claim as (
              insert into source_claims (
                source_artifact_id, source_chunk_id, claim, mechanism, krn_implication,
                does_not_prove, trust_tier, support_type, consumer, status
              )
              select
                chunk.source_artifact_id,
                chunk.id,
                'Deleting a cited chunk clears only the optional chunk binding.',
                'The simple chunk foreign key owns delete behavior.',
                'The composite provenance foreign key may remain NO ACTION.',
                'This fixture does not prove source truth.',
                'hypothesis',
                'background',
                'source claim migration delete behavior proof',
                'proposed'
              from chunk
              returning id, source_artifact_id, source_chunk_id
            )
            select
              id as "claimId",
              source_artifact_id as "sourceArtifactId",
              source_chunk_id as "sourceChunkId"
            from claim
          `;
          if (deleteProof === undefined) {
            throw new Error("source chunk delete behavior fixture was not created");
          }
          await client`
            delete from source_chunks
            where id = ${deleteProof.sourceChunkId}
          `;
          const [deleteProofAfter] = await client<{
            sourceArtifactId: string;
            sourceChunkId: string | null;
          }[]>`
            select
              source_artifact_id as "sourceArtifactId",
              source_chunk_id as "sourceChunkId"
            from source_claims
            where id = ${deleteProof.claimId}
          `;
          expect(deleteProofAfter).toEqual({
            sourceArtifactId: deleteProof.sourceArtifactId,
            sourceChunkId: null
          });
          await client`delete from source_claims where id = ${deleteProof.claimId}`;
        } finally {
          await client.end();
        }

        const integrity = await inspectSourceAuthorityIntegrity({
          databaseUrl: disposable.databaseUrl,
          storeName: "postgres",
          schemaIdentity: "post-0030-source-claim-provenance"
        });
        expect(integrity).toMatchObject({
          schemaReady: true,
          readOnly: true,
          violationCount: 0,
          violations: [],
          integrityReady: true
        });
      } finally {
        await Promise.all([
          pre0030Migrations?.cleanup() ?? Promise.resolve(),
          disposable.cleanup()
        ]);
      }
    },
    migrationTestTimeoutMs
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "blocks authority-ceiling migration when elevated legacy claims exist",
    async () => {
      const disposable = await createDisposableDatabase(databaseUrl!);
      let pre0042Migrations: Awaited<ReturnType<typeof createMigrationsFolderThrough>> | undefined;
      const marker = `source-claim-authority-ceiling-${crypto.randomUUID()}`;

      try {
        pre0042Migrations = await createMigrationsFolderThrough(
          41,
          "0041_quarantine_legacy_mixed_claim_graph_edges"
        );
        const pre0042Report = await migrateDatabase({
          databaseUrl: disposable.databaseUrl,
          migrationsFolder: pre0042Migrations.migrationsFolder
        });
        expect(pre0042Report).toMatchObject({
          expectedMigrationCount: 42,
          appliedMigrationCount: 42,
          migrationIdentityStatus: "verified",
          migrationsVerified: true
        });
        const fixture = await seedElevatedClaim(disposable.databaseUrl, marker);

        await expect(migrateDatabase({
          databaseUrl: disposable.databaseUrl,
          migrationsFolder
        })).rejects.toMatchObject({
          cause: {
            code: "23514",
            constraint_name: "source_claims_authority_ceiling",
            message:
              "cannot enforce SourceClaim authority ceiling while elevated legacy claims exist"
          }
        });

        const client = postgres(disposable.databaseUrl, { max: 1, onnotice: () => undefined });

        try {
          const rows = await client<{
            artifactAuthority: string;
            claimAuthority: string;
          }[]>`
            select
              artifact.trust_tier::text as "artifactAuthority",
              claim.trust_tier::text as "claimAuthority"
            from source_claims claim
            join source_artifacts artifact on artifact.id = claim.source_artifact_id
            where artifact.id = ${fixture.artifactId}
              and claim.id = ${fixture.claimId}
          `;
          expect(rows).toEqual([{
            artifactAuthority: "hypothesis",
            claimAuthority: "official"
          }]);
        } finally {
          await client.end();
        }
      } finally {
        await Promise.all([
          pre0042Migrations?.cleanup() ?? Promise.resolve(),
          disposable.cleanup()
        ]);
      }
    },
    migrationTestTimeoutMs
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "serializes legacy writers before the authority-ceiling migration preflight",
    async () => {
      const disposable = await createDisposableDatabase(databaseUrl!);
      let pre0042Migrations: Awaited<ReturnType<typeof createMigrationsFolderThrough>> | undefined;
      const marker = `source-claim-authority-cutover-${crypto.randomUUID()}`;
      const migrationApplicationName = `krn-authority-cutover-${crypto.randomUUID()}`;
      const migrationUrl = new URL(disposable.databaseUrl);
      migrationUrl.searchParams.set("application_name", migrationApplicationName);
      const writerClient = postgres(disposable.databaseUrl, { max: 1, onnotice: () => undefined });
      const observerClient = postgres(disposable.databaseUrl, { max: 1, onnotice: () => undefined });
      let allowWriterCommit: (() => void) | undefined;
      let reportWriterReady: (() => void) | undefined;
      const writerMayCommit = new Promise<void>((resolve) => {
        allowWriterCommit = resolve;
      });
      const writerReady = new Promise<void>((resolve) => {
        reportWriterReady = resolve;
      });
      let writer: Promise<unknown> | undefined;

      try {
        pre0042Migrations = await createMigrationsFolderThrough(
          41,
          "0041_quarantine_legacy_mixed_claim_graph_edges"
        );
        await migrateDatabase({
          databaseUrl: disposable.databaseUrl,
          migrationsFolder: pre0042Migrations.migrationsFolder
        });
        const fixture = await seedHypothesisArtifact(disposable.databaseUrl, marker);

        writer = writerClient.begin(async (transaction) => {
          await transaction`
            insert into source_claims (
              source_artifact_id, source_chunk_id, claim, mechanism, krn_implication,
              does_not_prove, trust_tier, support_type, consumer, status, metadata
            ) values (
              ${fixture.artifactId},
              ${fixture.chunkId},
              'concurrent legacy elevated official claim',
              'an old writer can overlap the authority-ceiling migration',
              'the migration must lock before scanning legacy rows',
              'does not prove the artifact tier is correct',
              'official',
              'implementation-boundary',
              'source authority ceiling migration cutover',
              'proposed',
              ${transaction.json({ smokeId: marker })}
            )
          `;
          reportWriterReady?.();
          await writerMayCommit;
        });

        await writerReady;
        const migration = migrateDatabase({
          databaseUrl: migrationUrl.toString(),
          migrationsFolder
        });
        let migrationWaitedForWriter = false;

        for (let attempt = 0; attempt < 200; attempt += 1) {
          const [activity] = await observerClient<{ waiting: boolean }[]>`
            select wait_event_type = 'Lock' as waiting
            from pg_stat_activity
            where application_name = ${migrationApplicationName}
          `;

          if (activity?.waiting === true) {
            migrationWaitedForWriter = true;
            break;
          }

          await new Promise<void>((resolve) => setTimeout(resolve, 10));
        }

        expect(migrationWaitedForWriter).toBe(true);
        allowWriterCommit?.();
        await writer;
        await expect(migration).rejects.toMatchObject({
          cause: {
            code: "23514",
            constraint_name: "source_claims_authority_ceiling",
            message:
              "cannot enforce SourceClaim authority ceiling while elevated legacy claims exist"
          }
        });

        const rows = await observerClient<{ claimAuthority: string; artifactAuthority: string }[]>`
          select
            claim.trust_tier::text as "claimAuthority",
            artifact.trust_tier::text as "artifactAuthority"
          from source_claims claim
          join source_artifacts artifact on artifact.id = claim.source_artifact_id
          where claim.metadata->>'smokeId' = ${marker}
        `;
        expect(rows).toEqual([{
          claimAuthority: "official",
          artifactAuthority: "hypothesis"
        }]);
      } finally {
        allowWriterCommit?.();
        await Promise.allSettled([
          writer ?? Promise.resolve(),
          writerClient.end(),
          observerClient.end()
        ]);
        await Promise.all([
          pre0042Migrations?.cleanup() ?? Promise.resolve(),
          disposable.cleanup()
        ]);
      }
    },
    migrationTestTimeoutMs
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "quarantines legacy SearchDocument provenance and rejects future direct mismatches",
    async () => {
      const disposable = await createDisposableDatabase(databaseUrl!);
      let pre0043Migrations: Awaited<ReturnType<typeof createMigrationsFolderThrough>> | undefined;
      const marker = `search-document-provenance-${crypto.randomUUID()}`;
      const client = postgres(disposable.databaseUrl, { max: 1, onnotice: () => undefined });

      try {
        pre0043Migrations = await createMigrationsFolderThrough(
          42,
          "0042_source_claim_authority_ceiling"
        );
        await migrateDatabase({
          databaseUrl: disposable.databaseUrl,
          migrationsFolder: pre0043Migrations.migrationsFolder
        });
        const [fixture] = await client<{
          projectId: string;
          claimId: string;
          canonicalArtifactId: string;
          canonicalChunkId: string;
          wrongArtifactId: string;
          wrongChunkId: string;
          searchDocumentId: string;
        }[]>`
          with workspace as (
            insert into workspaces (slug, display_name, metadata)
            values (${marker}, ${marker}, ${client.json({ smokeId: marker })})
            returning id
          ), fixture_projects as (
            insert into projects (workspace_id, slug, display_name, metadata)
            select id, ${`${marker}-a`}, 'Search provenance A', ${client.json({ smokeId: marker })}
            from workspace
            union all
            select id, ${`${marker}-b`}, 'Search provenance B', ${client.json({ smokeId: marker })}
            from workspace
            returning id, slug
          ), artifacts as (
            insert into source_artifacts (
              project_id, kind, trust_tier, uri, title, content_hash, metadata
            )
            select
              id,
              'doc',
              'project-decision',
              ${`search-provenance://${marker}/`} || slug,
              slug,
              ${`sha256:${marker}:`} || slug,
              ${client.json({ smokeId: marker })}
            from fixture_projects
            returning id, project_id
          ), chunks as (
            insert into source_chunks (
              source_artifact_id, ordinal, content, content_hash, metadata
            )
            select
              id,
              0,
              'SearchDocument provenance migration fixture',
              ${`sha256:${marker}:chunk:`} || id::text,
              ${client.json({ smokeId: marker })}
            from artifacts
            returning id, source_artifact_id
          ), canonical_claim as (
            insert into source_claims (
              source_artifact_id, source_chunk_id, claim, mechanism, krn_implication,
              does_not_prove, trust_tier, support_type, consumer, status, metadata
            )
            select
              artifact.id,
              chunk.id,
              'SearchDocument provenance must remain coherent.',
              'The canonical claim owns one artifact and chunk.',
              'Direct projections must preserve that chain.',
              'This fixture does not prove source truth.',
              'project-decision',
              'implementation-boundary',
              'SearchDocument provenance migration',
              'proposed',
              ${client.json({ smokeId: marker })}
            from fixture_projects project
            join artifacts artifact on artifact.project_id = project.id
            join chunks chunk on chunk.source_artifact_id = artifact.id
            where project.slug = ${`${marker}-a`}
            returning id, source_artifact_id, source_chunk_id
          ), legacy_search as (
            insert into search_documents (
              project_id, subject_type, subject_id, source_artifact_id,
              source_chunk_id, source_claim_id, title, body, search_text,
              validity_status, metadata
            )
            select
              project.id,
              'source_claim',
              claim.id,
              wrong_artifact.id,
              wrong_chunk.id,
              claim.id,
              'Legacy incoherent SearchDocument',
              'Claim A is attributed to chain B.',
              'legacy incoherent search provenance',
              'active',
              ${client.json({ smokeId: marker })}
            from fixture_projects project
            join canonical_claim claim on true
            join fixture_projects wrong_project on wrong_project.slug = ${`${marker}-b`}
            join artifacts wrong_artifact on wrong_artifact.project_id = wrong_project.id
            join chunks wrong_chunk on wrong_chunk.source_artifact_id = wrong_artifact.id
            where project.slug = ${`${marker}-a`}
            returning id, project_id, source_artifact_id, source_chunk_id, source_claim_id
          )
          select
            legacy_search.project_id as "projectId",
            legacy_search.source_claim_id as "claimId",
            claim.source_artifact_id as "canonicalArtifactId",
            claim.source_chunk_id as "canonicalChunkId",
            legacy_search.source_artifact_id as "wrongArtifactId",
            legacy_search.source_chunk_id as "wrongChunkId",
            legacy_search.id as "searchDocumentId"
          from legacy_search
          join canonical_claim claim on claim.id = legacy_search.source_claim_id
        `;
        if (fixture === undefined) {
          throw new Error("SearchDocument provenance migration fixture was not created");
        }

        const report = await migrateDatabase({
          databaseUrl: disposable.databaseUrl,
          migrationsFolder
        });
        expect(report).toMatchObject({
          migrationIdentityStatus: "verified",
          migrationsVerified: true
        });
        expect(report.appliedMigrationCount).toBe(report.expectedMigrationCount);

        const quarantineRows = await client<{
          entityId: string;
          reason: string;
          provenanceViolation: string | null;
        }[]>`
          select
            entity_id as "entityId",
            reason,
            metadata->>'provenanceViolation' as "provenanceViolation"
          from source_authority_quarantines
          where entity_type = 'search_document'
            and entity_id = ${fixture.searchDocumentId}
        `;
        expect(quarantineRows).toEqual([{
          entityId: fixture.searchDocumentId,
          reason: "incoherent_search_document_provenance",
          provenanceViolation: "claim_chunk_mismatch"
        }]);

        const [legacyReadback] = await client<{
          validityStatus: string;
          invalidated: boolean;
          quarantineReason: string | null;
          provenanceViolation: string | null;
        }[]>`
          select
            validity_status::text as "validityStatus",
            invalidated_at is not null as invalidated,
            metadata->>'quarantineReason' as "quarantineReason",
            metadata->>'provenanceViolation' as "provenanceViolation"
          from search_documents
          where id = ${fixture.searchDocumentId}
        `;
        expect(legacyReadback).toEqual({
          validityStatus: "invalidated",
          invalidated: true,
          quarantineReason: "incoherent_search_document_provenance",
          provenanceViolation: "claim_chunk_mismatch"
        });

        const [coherentSearchDocument] = await client<{ id: string }[]>`
          insert into search_documents (
            project_id, subject_type, subject_id, source_artifact_id,
            source_chunk_id, source_claim_id, title, body, search_text,
            validity_status, metadata
          ) values (
            ${fixture.projectId},
            'source_claim',
            ${fixture.claimId},
            ${fixture.canonicalArtifactId},
            ${fixture.canonicalChunkId},
            ${fixture.claimId},
            'Coherent SearchDocument',
            'The reverse guard must preserve this canonical chain.',
            'coherent reverse provenance guard',
            'active',
            ${client.json({ smokeId: marker })}
          )
          returning id
        `;
        expect(coherentSearchDocument).toBeDefined();

        await expect(client`
          update source_claims
          set source_artifact_id = ${fixture.wrongArtifactId},
              source_chunk_id = ${fixture.wrongChunkId}
          where id = ${fixture.claimId}
        `).rejects.toMatchObject({
          code: "23514",
          constraint_name: "search_documents_provenance_coherence",
          message: expect.stringContaining(
            "canonical source mutation would make active SearchDocument"
          )
        });

        await client`
          update search_documents
          set validity_status = 'invalidated',
              invalidated_at = now()
          where id = ${coherentSearchDocument!.id}
        `;
        await client`
          update search_documents
          set source_claim_id = null
          where validity_status = 'invalidated'
            and metadata->>'smokeId' = ${marker}
        `;
        await client`
          insert into search_documents (
            project_id, subject_type, subject_id, title, body, search_text,
            validity_status, metadata
          ) values (
            ${fixture.projectId},
            'source_claim',
            ${fixture.claimId},
            'Subject-derived SearchDocument',
            'The reverse guard must preserve an omitted nullable canonical link.',
            'subject derived reverse provenance guard',
            'active',
            ${client.json({ smokeId: marker })}
          )
        `;

        await expect(client`
          update source_claims
          set id = ${crypto.randomUUID()}
          where id = ${fixture.claimId}
        `).rejects.toMatchObject({
          code: "23514",
          constraint_name: "search_documents_provenance_coherence",
          message: expect.stringContaining(
            "canonical source mutation would make active SearchDocument"
          )
        });

        await expect(client`
          delete from source_claims
          where id = ${fixture.claimId}
        `).rejects.toMatchObject({
          code: "23514",
          constraint_name: "search_documents_provenance_coherence",
          message: expect.stringContaining(
            "canonical source mutation would make active SearchDocument"
          )
        });

        await expect(client.begin(
          "isolation level repeatable read",
          async (transaction) => transaction`
            update source_claims
            set source_artifact_id = source_artifact_id
            where id = ${fixture.claimId}
          `
        )).rejects.toMatchObject({
          code: "23514",
          constraint_name: "search_documents_provenance_coherence",
          message: expect.stringContaining(
            "SearchDocument provenance writes require read committed isolation"
          )
        });

        await expect(client`
          insert into search_documents (
            project_id, subject_type, subject_id, source_artifact_id,
            source_chunk_id, source_claim_id, title, body, search_text,
            validity_status, metadata
          ) values (
            ${fixture.projectId},
            'source_claim',
            ${fixture.claimId},
            ${fixture.wrongArtifactId},
            ${fixture.wrongChunkId},
            ${fixture.claimId},
            'Rejected direct SearchDocument',
            'The trigger must reject this wrong chain.',
            'rejected direct search provenance',
            'active',
            ${client.json({ smokeId: marker })}
          )
        `).rejects.toMatchObject({
          code: "23514",
          constraint_name: "search_documents_provenance_coherence",
          message: expect.stringContaining(
            "active SearchDocument canonical provenance is incoherent"
          )
        });

        await client`
          alter table search_documents
          disable trigger search_documents_provenance_coherence
        `;
        let readinessFixtureId: string | undefined;
        try {
          const [readinessFixture] = await client<{ id: string }[]>`
            insert into search_documents (
              project_id, subject_type, subject_id, source_artifact_id,
              source_chunk_id, source_claim_id, title, body, search_text,
              validity_status, metadata
            ) values (
              ${fixture.projectId},
              'source_claim',
              ${fixture.claimId},
              ${fixture.wrongArtifactId},
              ${fixture.wrongChunkId},
              ${fixture.claimId},
              'Readiness-only incoherent SearchDocument',
              'This privileged fixture proves the read-only integrity probe.',
              'readiness incoherent search provenance',
              'active',
              ${client.json({ smokeId: marker })}
            )
            returning id
          `;
          readinessFixtureId = readinessFixture?.id;
        } finally {
          await client`
            alter table search_documents
            enable trigger search_documents_provenance_coherence
          `;
        }
        expect(readinessFixtureId).toBeDefined();

        const detectedIntegrity = await inspectSourceAuthorityIntegrity({
          databaseUrl: disposable.databaseUrl,
          schemaIdentity: "post-0043-search-document-provenance-damaged"
        });
        expect(detectedIntegrity).toMatchObject({
          schemaReady: true,
          violationCount: 2,
          violations: [
            {
              id: `active_search_without_canonical_authority:${readinessFixtureId}`,
              kind: "active_search_without_canonical_authority",
              subjectId: readinessFixtureId
            },
            {
              id: `incoherent_search_document_provenance:${readinessFixtureId}`,
              kind: "incoherent_search_document_provenance",
              subjectId: readinessFixtureId,
              detail: expect.stringContaining("claim_chunk_mismatch")
            }
          ],
          integrityReady: false
        });

        await client`
          delete from search_documents
          where id = ${readinessFixtureId!}
        `;

        const integrity = await inspectSourceAuthorityIntegrity({
          databaseUrl: disposable.databaseUrl,
          schemaIdentity: "post-0043-search-document-provenance"
        });
        expect(integrity).toMatchObject({
          schemaReady: true,
          violationCount: 0,
          violations: [],
          integrityReady: true
        });
      } finally {
        await client.end();
        await Promise.all([
          pre0043Migrations?.cleanup() ?? Promise.resolve(),
          disposable.cleanup()
        ]);
      }
    },
    migrationTestTimeoutMs
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "preserves and reports legacy import and temporal violations under the write-enforcing migration",
    async () => {
      const disposable = await createDisposableDatabase(databaseUrl!);
      const pre0046Migrations = await createMigrationsFolderThrough(
        45,
        "0045_align_source_schema_constraints"
      );
      const client = postgres(disposable.databaseUrl, { max: 1, onnotice: () => undefined });

      try {
        await migrateDatabase({
          databaseUrl: disposable.databaseUrl,
          migrationsFolder: pre0046Migrations.migrationsFolder
        });
        const [workspace] = await client<{ id: string }[]>`
          insert into workspaces (slug, display_name)
          values ('legacy-import-consistency', 'Legacy import consistency')
          returning id
        `;
        const [project] = await client<{ id: string }[]>`
          insert into projects (workspace_id, slug, display_name)
          values (${workspace!.id}, 'legacy-import-consistency', 'Legacy import consistency')
          returning id
        `;
        const [partialArtifact] = await client<{ id: string }[]>`
          insert into source_artifacts (
            project_id, import_id, kind, trust_tier, uri, title, content_hash
          ) values (
            ${project!.id}, 'legacy-import', 'doc', 'project-decision',
            'legacy-consistency://partial', 'legacy partial', ${"a".repeat(64)}
          ) returning id
        `;
        const [malformedArtifact] = await client<{ id: string }[]>`
          insert into source_artifacts (
            project_id, import_id, import_row_id, kind, trust_tier, uri, title, content_hash
          ) values (
            ${project!.id}, 'legacy-import', 'legacy-row', 'doc', 'project-decision',
            'legacy-consistency://digest', 'legacy digest', 'not-a-digest'
          ) returning id
        `;
        const [temporalDocument] = await client<{ id: string }[]>`
          insert into search_documents (
            project_id, subject_type, subject_id, trust_tier, validity_status,
            title, body, search_text, invalidated_at
          ) values (
            ${project!.id}, 'owner_file', ${crypto.randomUUID()}, 'project-decision', 'active',
            'legacy temporal', 'legacy temporal', 'legacy temporal', now()
          ) returning id
        `;
        await client`
          insert into source_authority_quarantines (entity_type, entity_id, reason, metadata)
          values
            ('source_artifact', ${partialArtifact!.id}, 'incomplete_import_lifecycle', '{}'::jsonb),
            ('source_artifact', ${malformedArtifact!.id}, 'incomplete_import_lifecycle', '{}'::jsonb)
        `;

        const migration = await migrateDatabase({
          databaseUrl: disposable.databaseUrl,
          migrationsFolder
        });
        expect(migration).toMatchObject({
          migrationIdentityStatus: "verified",
          migrationsVerified: true
        });
        expect(migration.expectedMigrationCount).toBeGreaterThan(46);
        expect(migration.appliedMigrationCount).toBe(migration.expectedMigrationCount);

        const report = await inspectSourceAuthorityIntegrity({
          databaseUrl: disposable.databaseUrl,
          schemaIdentity: "post-0046-source-import-consistency"
        });
        const consistencyViolations = report.violations.filter(({ kind }) =>
          [
            "source_import_tuple_incomplete",
            "source_import_content_hash_malformed",
            "search_document_temporal_incoherence"
          ].includes(kind)
        );
        expect(consistencyViolations).toEqual([
          expect.objectContaining({
            kind: "search_document_temporal_incoherence",
            subjectId: temporalDocument!.id
          }),
          expect.objectContaining({
            kind: "source_import_content_hash_malformed",
            subjectId: malformedArtifact!.id
          }),
          expect.objectContaining({
            kind: "source_import_tuple_incomplete",
            subjectId: partialArtifact!.id
          })
        ]);
        expect(report).toMatchObject({ readOnly: true, integrityReady: false });

        const constraints = await client<{ name: string; validated: boolean }[]>`
          select conname as name, convalidated as validated
          from pg_constraint
          where conname in (
            'source_artifacts_import_tuple_complete',
            'source_artifacts_import_content_hash_sha256',
            'search_documents_validity_window',
            'search_documents_validity_status_timestamps'
          )
          order by conname
        `;
        expect(constraints).toHaveLength(4);
        expect(constraints.every(({ validated }) => validated === false)).toBe(true);
      } finally {
        await client.end();
        await Promise.all([pre0046Migrations.cleanup(), disposable.cleanup()]);
      }
    },
    migrationTestTimeoutMs
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "quarantines legacy uncaptured adoption before enforcing the direct SQL boundary",
    async () => {
      const disposable = await createDisposableDatabase(databaseUrl!);
      const pre0047Migrations = await createMigrationsFolderThrough(
        46,
        "0046_useful_mystique"
      );
      const client = postgres(disposable.databaseUrl, { max: 1, onnotice: () => undefined });
      const marker = `legacy-uncaptured-authority-${crypto.randomUUID()}`;

      try {
        await migrateDatabase({
          databaseUrl: disposable.databaseUrl,
          migrationsFolder: pre0047Migrations.migrationsFolder
        });
        const [fixture] = await client<{
          claimId: string;
          decisionId: string;
          edgeId: string;
          searchId: string;
        }[]>`
          with workspace as (
            insert into workspaces (slug, display_name)
            values (${marker}, 'Legacy uncaptured authority')
            returning id
          ), project as (
            insert into projects (workspace_id, slug, display_name)
            select id, ${marker}, 'Legacy uncaptured authority' from workspace
            returning id
          ), artifact as (
            insert into source_artifacts (
              project_id, kind, trust_tier, uri, title, content_hash, metadata
            )
            select id, 'doc', 'project-decision', ${`legacy://${marker}`},
              'Legacy uncaptured artifact', ${`sha256:${marker}`},
              ${client.json({ smokeId: marker })}
            from project
            returning id, project_id
          ), chunk as (
            insert into source_chunks (
              source_artifact_id, ordinal, content, content_hash, metadata
            )
            select id, 0, 'legacy uncaptured bytes', ${`sha256:${marker}:chunk`},
              ${client.json({ smokeId: marker })}
            from artifact
            returning id, source_artifact_id
          ), claim as (
            insert into source_claims (
              source_artifact_id, source_chunk_id, claim, mechanism, krn_implication,
              does_not_prove, trust_tier, support_type, consumer, status, metadata
            )
            select artifact.id, chunk.id, 'Legacy uncaptured claim',
              'Pre-0047 SQL admitted governing rows without captured identity',
              'Migration must remove governing authority',
              'Does not prove source truth', 'project-decision',
              'implementation-boundary', '0047 migration proof', 'accepted',
              ${client.json({ smokeId: marker })}
            from artifact, chunk
            returning id, source_artifact_id
          ), decision as (
            insert into source_decisions (
              project_id, source_claim_id, status, decision, rationale,
              falsifier, consumer, metadata
            )
            select artifact.project_id, claim.id, 'adopt', 'Legacy uncaptured adoption',
              'Pre-0047 direct SQL', 'The row remains governing',
              '0047 migration proof', ${client.json({ smokeId: marker })}
            from artifact, claim
            returning id, source_claim_id
          ), edge as (
            insert into source_decision_edges (
              source_claim_id, source_decision_id, target_type, target_id,
              support_type, confidence, notes, metadata
            )
            select claim.id, decision.id, 'architecture_decision', ${marker},
              'implementation-boundary', 'high', 'Legacy governing edge',
              ${client.json({ smokeId: marker })}
            from claim, decision
            returning id
          ), search as (
            insert into search_documents (
              project_id, subject_type, subject_id, source_artifact_id,
              source_chunk_id, source_claim_id, source_decision_id, trust_tier,
              validity_status, title, body, search_text, metadata
            )
            select artifact.project_id, 'source_claim', claim.id, artifact.id,
              chunk.id, claim.id, decision.id, 'project-decision', 'active',
              'Legacy uncaptured search', 'Legacy uncaptured search body',
              'legacy uncaptured search', ${client.json({ smokeId: marker })}
            from artifact, chunk, claim, decision
            returning id
          )
          select
            claim.id::text as "claimId",
            decision.id::text as "decisionId",
            edge.id::text as "edgeId",
            search.id::text as "searchId"
          from claim, decision, edge, search
        `;

        await migrateDatabase({
          databaseUrl: disposable.databaseUrl,
          migrationsFolder
        });

        const [lifecycle] = await client<{
          claimStatus: string;
          decisionProjectId: string | null;
          decisionStatus: string;
          edgeCount: number;
          searchInvalidated: boolean;
          searchStatus: string;
        }[]>`
          select
            claim.status::text as "claimStatus",
            decision.project_id::text as "decisionProjectId",
            decision.status::text as "decisionStatus",
            (select count(*)::int from source_decision_edges edge
              where edge.id = ${fixture!.edgeId}) as "edgeCount",
            search.invalidated_at is not null as "searchInvalidated",
            search.validity_status::text as "searchStatus"
          from source_claims claim
          join source_decisions decision on decision.source_claim_id = claim.id
          join search_documents search on search.id = ${fixture!.searchId}
          where decision.id = ${fixture!.decisionId}
        `;
        const quarantines = await client<{ entityId: string; entityType: string }[]>`
          select entity_id::text as "entityId", entity_type as "entityType"
          from source_authority_quarantines
          where reason = 'captured_evidence_missing_or_mismatched'
            and entity_id in (${fixture!.decisionId}, ${fixture!.edgeId}, ${fixture!.searchId})
          order by entity_type
        `;
        expect(lifecycle).toEqual({
          claimStatus: "proposed",
          decisionProjectId: null,
          decisionStatus: "lab_test",
          edgeCount: 0,
          searchInvalidated: true,
          searchStatus: "invalidated"
        });
        expect(quarantines).toEqual([
          { entityId: fixture!.searchId, entityType: "search_document" },
          { entityId: fixture!.decisionId, entityType: "source_decision" },
          { entityId: fixture!.edgeId, entityType: "source_decision_edge" }
        ]);
      } finally {
        await client.end();
        await Promise.all([pre0047Migrations.cleanup(), disposable.cleanup()]);
      }
    },
    migrationTestTimeoutMs
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "fails closed for authority labels not classified by the SQL projection",
    async () => {
      const disposable = await createDisposableDatabase(databaseUrl!);
      const marker = `source-claim-unclassified-authority-${crypto.randomUUID()}`;
      const client = postgres(disposable.databaseUrl, { max: 1, onnotice: () => undefined });
      const unclassifiedAuthority = "future-unclassified";

      try {
        await migrateDatabase({
          databaseUrl: disposable.databaseUrl,
          migrationsFolder
        });
        const fixture = await seedHypothesisArtifact(disposable.databaseUrl, marker);
        await client.unsafe(
          `alter type source_trust_tier add value '${unclassifiedAuthority}'`
        );
        const [projection] = await client<{ rank: number | null }[]>`
          select krn_source_authority_rank(
            ${unclassifiedAuthority}::source_trust_tier
          ) as rank
        `;
        expect(projection).toEqual({ rank: null });

        await expect(client`
          insert into source_claims (
            source_artifact_id, source_chunk_id, claim, mechanism, krn_implication,
            does_not_prove, trust_tier, support_type, consumer, falsifier, status, metadata
          ) values (
            ${fixture.artifactId},
            ${fixture.chunkId},
            'unclassified authority claim',
            'a future enum value lacks a canonical SQL rank',
            'the trigger must fail closed until the projection is updated',
            'does not prove the future tier belongs in the taxonomy',
            ${unclassifiedAuthority},
            'implementation-boundary',
            'source authority SQL projection',
            'an unclassified claim authority persists',
            'proposed',
            ${client.json({ smokeId: marker })}
          )
        `).rejects.toMatchObject({
          code: "23514",
          constraint_name: "source_claims_authority_ceiling",
          message: "cannot compare unclassified SourceClaim or SourceArtifact authority"
        });

        await expect(client`
          update source_artifacts
          set trust_tier = ${unclassifiedAuthority}
          where id = ${fixture.artifactId}
        `).rejects.toMatchObject({
          code: "23514",
          constraint_name: "source_claims_authority_ceiling",
          message: "cannot compare unclassified SourceArtifact authority"
        });
      } finally {
        await client.end();
        await disposable.cleanup();
      }
    },
    migrationTestTimeoutMs
  );
});
