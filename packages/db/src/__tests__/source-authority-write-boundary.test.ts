import crypto from "node:crypto";

import postgres from "postgres";
import { describe, expect, it } from "vitest";

import { createKrnDatabase } from "../database.js";
import { DrizzleSourceRepository } from "../repositories/drizzle-source-repository.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();

interface SourceAuthorityWriteBoundaryFixture {
  readonly client: ReturnType<typeof postgres>;
  readonly marker: string;
  readonly projectId: string;
  readonly sourceRepository: DrizzleSourceRepository;
  readonly sourceUri: string;
  readonly workspaceId: string;
}

const requiredId = (rows: readonly { id: string }[], label: string): string => {
  const id = rows[0]?.id;

  if (id === undefined) {
    throw new Error(`source authority write boundary ${label} was not created`);
  }

  return id;
};

const createFixture = async (url: string): Promise<SourceAuthorityWriteBoundaryFixture> => {
  const client = postgres(url, { max: 1, onnotice: () => undefined });
  const marker = `source-authority-write-boundary-${crypto.randomUUID()}`;
  const sourceUri = `source-authority://${marker}/uncaptured`;

  try {
    const workspace = await client<{ id: string }[]>`
      insert into workspaces (slug, display_name, metadata)
      values (${marker}, 'Source authority write boundary', ${client.json({ smokeId: marker })})
      returning id
    `;
    const workspaceId = requiredId(workspace, "workspace");
    const project = await client<{ id: string }[]>`
      insert into projects (workspace_id, slug, display_name, metadata)
      values (${workspaceId}, ${marker}, 'Source authority write boundary', ${client.json({ smokeId: marker })})
      returning id
    `;
    const projectId = requiredId(project, "project");

    return {
      client,
      marker,
      projectId,
      sourceRepository: new DrizzleSourceRepository(createKrnDatabase(client)),
      sourceUri,
      workspaceId
    };
  } catch (error) {
    await client`delete from workspaces where slug = ${marker}`;
    await client.end();
    throw error;
  }
};

const cleanupFixture = async (fixture: SourceAuthorityWriteBoundaryFixture): Promise<void> => {
  await fixture.client`delete from outbox_events where payload->>'smokeId' = ${fixture.marker}`;
  await fixture.client`delete from source_decision_edges where metadata->>'smokeId' = ${fixture.marker}`;
  await fixture.client`delete from source_decisions where metadata->>'smokeId' = ${fixture.marker}`;
  await fixture.client`delete from source_artifacts where metadata->>'smokeId' = ${fixture.marker}`;
  await fixture.client`delete from workspaces where id = ${fixture.workspaceId}`;
  await fixture.client.end();
};

type EvidenceFreshness = "current" | "stale" | "unknown";

const capturedEvidenceMetadata = (
  fixture: SourceAuthorityWriteBoundaryFixture,
  freshness: EvidenceFreshness = "current"
): Record<string, string> => ({
  smokeId: fixture.marker,
  evidenceRef: `source-authority://${fixture.marker}/captured`,
  evidenceStatus: "captured",
  evidenceContentHash: `sha256:${fixture.marker}:captured-evidence`,
  evidenceFreshness: freshness
});

const createCapturedClaim = async (
  fixture: SourceAuthorityWriteBoundaryFixture,
  options: {
    readonly freshness?: EvidenceFreshness;
    readonly chunkEvidenceContentHash?: string;
    readonly padChunkEvidenceContentHash?: boolean;
    readonly uncitedChunkEvidenceContentHash?: string;
  } = {}
) => {
  const metadata = capturedEvidenceMetadata(fixture, options.freshness);
  const sourceArtifact = await fixture.sourceRepository.createSourceArtifact({
    projectId: fixture.projectId,
    kind: "doc",
    sourceAuthority: "project-decision",
    uri: `${fixture.sourceUri}/${options.freshness ?? "current"}/${crypto.randomUUID()}`,
    title: "Captured governing source",
    contentHash: `sha256:${fixture.marker}:artifact`,
    metadata
  });

  if (options.uncitedChunkEvidenceContentHash !== undefined) {
    await fixture.sourceRepository.createSourceChunk({
      sourceArtifactId: sourceArtifact.id,
      ordinal: 0,
      content: "Uncited evidence bytes must not define the governing evidence identity.",
      contentHash: `sha256:${fixture.marker}:uncited-chunk`,
      metadata: {
        ...metadata,
        evidenceContentHash: options.uncitedChunkEvidenceContentHash
      }
    });
  }

  const citedChunkEvidenceContentHash = options.chunkEvidenceContentHash ??
    (options.padChunkEvidenceContentHash === true
      ? ` ${metadata.evidenceContentHash} `
      : undefined);

  const sourceChunk = await fixture.sourceRepository.createSourceChunk({
    sourceArtifactId: sourceArtifact.id,
    ordinal: options.uncitedChunkEvidenceContentHash === undefined ? 0 : 1,
    content: "Captured evidence bytes for the source authority boundary.",
    contentHash: `sha256:${fixture.marker}:chunk`,
    metadata: {
      ...metadata,
      ...(citedChunkEvidenceContentHash === undefined
        ? {}
        : { evidenceContentHash: citedChunkEvidenceContentHash })
    }
  });
  const sourceClaim = await fixture.sourceRepository.createSourceClaim({
    sourceArtifactId: sourceArtifact.id,
    sourceChunkId: sourceChunk.id,
    claim: "A governing source must have captured-current bytes.",
    mechanism: "Captured-current evidence binds authority to inspectable bytes.",
    krnImplication: "Only a coherent captured-current chain may govern.",
    doesNotProve: "Captured bytes do not prove source truth.",
    sourceAuthority: "project-decision",
    supportType: "implementation-boundary",
    consumer: "source authority write boundary",
    falsifier: "A missing, mismatched, or non-current chain becomes adopted.",
    metadata
  });

  return { metadata, sourceArtifact, sourceChunk, sourceClaim };
};

const governingDecisionInput = (
  fixture: SourceAuthorityWriteBoundaryFixture,
  sourceClaimId: string
) => ({
  projectId: fixture.projectId,
  sourceClaimId,
  status: "adopt" as const,
  decision: "Adopt captured-current source authority.",
  rationale: "The exact cited evidence chain is captured, coherent, and current.",
  falsifier: "The captured-current chain cannot become governing.",
  consumer: "source authority write boundary",
  metadata: { smokeId: fixture.marker }
});

describe.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
  "source authority write boundary",
  () => {
    it("rejects governing authority without captured evidence", async () => {
      const fixture = await createFixture(databaseUrl!);

      try {
        const sourceArtifact = await fixture.sourceRepository.createSourceArtifact({
          projectId: fixture.projectId,
          kind: "doc",
          sourceAuthority: "project-decision",
          uri: fixture.sourceUri,
          title: "Uncaptured governing source",
          contentHash: `sha256:${fixture.marker}`,
          metadata: { smokeId: fixture.marker }
        });
        const sourceClaim = await fixture.sourceRepository.createSourceClaim({
          sourceArtifactId: sourceArtifact.id,
          claim: "A governing source must have captured bytes.",
          mechanism: "Captured bytes bind source authority to inspectable evidence.",
          krnImplication: "Uncaptured source claims must remain non-governing.",
          doesNotProve: "Captured bytes do not prove source truth.",
          sourceAuthority: "project-decision",
          supportType: "implementation-boundary",
          consumer: "source authority write boundary",
          falsifier: "An uncaptured claim becomes adopted decision support.",
          metadata: { smokeId: fixture.marker }
        });
        await expect(fixture.sourceRepository.createSourceDecision({
          projectId: fixture.projectId,
          sourceClaimId: sourceClaim.id,
          status: "adopt",
          decision: "Adopt uncaptured source authority.",
          rationale: "This should be rejected before authority is persisted.",
          falsifier: "The uncaptured source claim becomes governing.",
          consumer: "source authority write boundary",
          metadata: { smokeId: fixture.marker }
        })).rejects.toThrow("SourceDecision adopt requires coherent captured-current evidence");
        const claimReadback = await fixture.client<{ sourceChunkId: string | null; status: string }[]>`
          select source_chunk_id::text as "sourceChunkId", status::text as status
          from source_claims
          where id = ${sourceClaim.id}
        `;
        const decisionCount = await fixture.client<{ count: number }[]>`
          select count(*)::int as count
          from source_decisions
          where metadata->>'smokeId' = ${fixture.marker}
        `;
        const edgeCount = await fixture.client<{ count: number }[]>`
          select count(*)::int as count
          from source_decision_edges
          where metadata->>'smokeId' = ${fixture.marker}
        `;
        const sourceChunkCount = await fixture.client<{ count: number }[]>`
          select count(*)::int as count from source_chunks where source_artifact_id = ${sourceArtifact.id}
        `;
        const outboxTopics = await fixture.client<{ topic: string }[]>`
          select topic
          from outbox_events
          where payload->>'smokeId' = ${fixture.marker}
          order by topic, id
        `;

        expect({
          claimStatus: claimReadback[0]?.status,
          sourceChunkId: claimReadback[0]?.sourceChunkId,
          decisionCount: decisionCount[0]?.count,
          edgeCount: edgeCount[0]?.count,
          sourceChunkCount: sourceChunkCount[0]?.count,
          outboxTopics: outboxTopics.map((row) => row.topic)
        }).toEqual({
          claimStatus: "proposed",
          sourceChunkId: null,
          decisionCount: 0,
          edgeCount: 0,
          sourceChunkCount: 0,
          outboxTopics: []
        });
      } finally {
        await cleanupFixture(fixture);
      }
    });

    it.each([
      {
        name: "mismatched evidence hash",
        options: { chunkEvidenceContentHash: "sha256:mismatched-captured-evidence" },
        decisionMetadata: {},
        detail: "SourceChunk evidenceContentHash does not match SourceArtifact"
      },
      {
        name: "whitespace-padded evidence hash",
        options: { padChunkEvidenceContentHash: true },
        decisionMetadata: {},
        detail: "SourceChunk evidenceContentHash does not match SourceArtifact"
      },
      {
        name: "unknown evidence freshness",
        options: { freshness: "unknown" as const },
        decisionMetadata: {},
        detail: "SourceArtifact evidenceFreshness is not current"
      },
      {
        name: "stale evidence freshness",
        options: { freshness: "stale" as const },
        decisionMetadata: {},
        detail: "SourceArtifact evidenceFreshness is not current"
      },
      {
        name: "conflicting decision evidence hash",
        options: {},
        decisionMetadata: { evidenceContentHash: "sha256:caller-conflict" },
        detail: "input evidenceContentHash conflicts with persisted evidence identity"
      }
    ])("rejects $name without partial authority", async ({ options, decisionMetadata, detail }) => {
      const fixture = await createFixture(databaseUrl!);

      try {
        const { sourceClaim } = await createCapturedClaim(fixture, options);
        const decisionInput = governingDecisionInput(fixture, sourceClaim.id);

        await expect(fixture.sourceRepository.createSourceDecision(
          {
            ...decisionInput,
            metadata: { ...decisionInput.metadata, ...decisionMetadata }
          }
        )).rejects.toThrow(detail);

        const state = await fixture.client<{
          claimStatus: string;
          decisionCount: number;
          edgeCount: number;
          outboxCount: number;
        }[]>`
          select
            claim.status::text as "claimStatus",
            (select count(*)::int from source_decisions decision where decision.source_claim_id = claim.id) as "decisionCount",
            (select count(*)::int from source_decision_edges edge where edge.source_claim_id = claim.id) as "edgeCount",
            (select count(*)::int from outbox_events event where event.payload->>'smokeId' = ${fixture.marker}) as "outboxCount"
          from source_claims claim
          where claim.id = ${sourceClaim.id}
        `;

        expect(state).toEqual([{
          claimStatus: "proposed",
          decisionCount: 0,
          edgeCount: 0,
          outboxCount: 0
        }]);
      } finally {
        await cleanupFixture(fixture);
      }
    });

    it("persists one coherent captured-current governing chain", async () => {
      const fixture = await createFixture(databaseUrl!);

      try {
        const { metadata, sourceChunk, sourceClaim } = await createCapturedClaim(fixture, {
          uncitedChunkEvidenceContentHash: "sha256:uncited-evidence-identity"
        });
        const sourceDecision = await fixture.sourceRepository.createSourceDecision(
          governingDecisionInput(fixture, sourceClaim.id)
        );
        const sourceDecisionEdge = await fixture.sourceRepository.createSourceDecisionEdge({
          sourceClaimId: sourceClaim.id,
          sourceDecisionId: sourceDecision.id,
          targetType: "architecture_decision",
          targetId: `${fixture.marker}-target`,
          supportType: "implementation-boundary",
          confidence: "high",
          notes: "The exact captured-current chain supports this target.",
          metadata: { smokeId: fixture.marker }
        });
        const state = await fixture.client<{
          claimStatus: string;
          decisionStatus: string;
          evidenceStatus: string;
          evidenceContentHash: string;
          evidenceFreshness: string;
          sourceChunkId: string;
        }[]>`
          select
            claim.status::text as "claimStatus",
            decision.status::text as "decisionStatus",
            decision.metadata->>'evidenceStatus' as "evidenceStatus",
            decision.metadata->>'evidenceContentHash' as "evidenceContentHash",
            decision.metadata->>'evidenceFreshness' as "evidenceFreshness",
            claim.source_chunk_id::text as "sourceChunkId"
          from source_claims claim
          join source_decisions decision on decision.source_claim_id = claim.id
          where claim.id = ${sourceClaim.id}
        `;
        const edgeIds = await fixture.client<{ id: string }[]>`
          select id::text as id
          from source_decision_edges
          where source_claim_id = ${sourceClaim.id}
        `;
        const outboxTopics = await fixture.client<{ topic: string }[]>`
          select topic
          from outbox_events
          where payload->>'smokeId' = ${fixture.marker}
          order by case topic
            when 'source.decision.created' then 1
            when 'source.decision_edge.created' then 2
            else 3
          end
        `;

        expect(state).toEqual([{
          claimStatus: "accepted",
          decisionStatus: "adopt",
          evidenceStatus: "captured",
          evidenceContentHash: metadata.evidenceContentHash,
          evidenceFreshness: "current",
          sourceChunkId: sourceChunk.id
        }]);
        expect(edgeIds).toEqual([{ id: sourceDecisionEdge.id }]);
        expect(outboxTopics.map((row) => row.topic)).toEqual([
          "source.decision.created",
          "source.decision_edge.created"
        ]);
      } finally {
        await cleanupFixture(fixture);
      }
    });

    it("rejects a standalone edge for legacy adopted authority without captured evidence", async () => {
      const fixture = await createFixture(databaseUrl!);

      try {
        const sourceArtifact = await fixture.sourceRepository.createSourceArtifact({
          projectId: fixture.projectId,
          kind: "doc",
          sourceAuthority: "project-decision",
          uri: fixture.sourceUri,
          title: "Legacy uncaptured governing source",
          contentHash: `sha256:${fixture.marker}:legacy`,
          metadata: { smokeId: fixture.marker }
        });
        const sourceClaim = await fixture.sourceRepository.createSourceClaim({
          sourceArtifactId: sourceArtifact.id,
          claim: "Legacy authority was adopted without captured bytes.",
          mechanism: "The repository edge boundary must detect the retained defect.",
          krnImplication: "A legacy adopted row cannot acquire new governing support.",
          doesNotProve: "This fixture does not prove direct SQL is prevented.",
          sourceAuthority: "project-decision",
          supportType: "implementation-boundary",
          consumer: "source authority write boundary",
          falsifier: "The repository creates an edge for the invalid legacy row.",
          metadata: { smokeId: fixture.marker }
        });
        const sourceDecisionId = await fixture.client.begin(async (transaction) => {
          await transaction`set local session_replication_role = 'replica'`;
          await transaction`
            update source_claims
            set status = 'accepted'
            where id = ${sourceClaim.id}
          `;
          const rows = await transaction<{ id: string }[]>`
            insert into source_decisions (
              project_id, source_claim_id, status, decision, rationale, falsifier, consumer, metadata
            ) values (
              ${fixture.projectId}, ${sourceClaim.id}, 'adopt',
              'Legacy uncaptured adoption', 'Seeded to prove repository edge defense',
              'A new edge persists', 'source authority write boundary',
              ${JSON.stringify({ smokeId: fixture.marker })}::jsonb
            )
            returning id
          `;

          return requiredId(rows, "legacy source decision");
        });

        await expect(fixture.sourceRepository.createSourceDecisionEdge({
          sourceClaimId: sourceClaim.id,
          sourceDecisionId,
          targetType: "architecture_decision",
          targetId: `${fixture.marker}-legacy-target`,
          supportType: "implementation-boundary",
          confidence: "high",
          notes: "This edge must remain absent.",
          metadata: { smokeId: fixture.marker }
        })).rejects.toThrow("SourceDecisionEdge requires coherent captured-current evidence");

        const edgeCount = await fixture.client<{ count: number }[]>`
          select count(*)::int as count
          from source_decision_edges
          where source_claim_id = ${sourceClaim.id}
        `;
        const outboxCount = await fixture.client<{ count: number }[]>`
          select count(*)::int as count
          from outbox_events
          where payload->>'smokeId' = ${fixture.marker}
        `;

        expect(edgeCount).toEqual([{ count: 0 }]);
        expect(outboxCount).toEqual([{ count: 0 }]);
      } finally {
        await cleanupFixture(fixture);
      }
    });

    it("rejects a standalone edge when the adopted decision does not retain the captured identity", async () => {
      const fixture = await createFixture(databaseUrl!);

      try {
        const { sourceClaim } = await createCapturedClaim(fixture);
        const sourceDecisionId = await fixture.client.begin(async (transaction) => {
          await transaction`set local session_replication_role = 'replica'`;
          await transaction`
            update source_claims
            set status = 'accepted'
            where id = ${sourceClaim.id}
          `;
          const rows = await transaction<{ id: string }[]>`
            insert into source_decisions (
              project_id, source_claim_id, status, decision, rationale, falsifier, consumer, metadata
            ) values (
              ${fixture.projectId}, ${sourceClaim.id}, 'adopt',
              'Adoption with lost evidence identity',
              'Seeded to prove the repository edge revalidates decision metadata',
              'A new edge persists', 'source authority write boundary',
              ${JSON.stringify({ smokeId: fixture.marker })}::jsonb
            )
            returning id
          `;

          return requiredId(rows, "adopted source decision without evidence metadata");
        });

        await expect(fixture.sourceRepository.createSourceDecisionEdge({
          sourceClaimId: sourceClaim.id,
          sourceDecisionId,
          targetType: "architecture_decision",
          targetId: `${fixture.marker}-missing-decision-evidence`,
          supportType: "implementation-boundary",
          confidence: "high",
          notes: "This edge must remain absent when the decision lost its evidence identity.",
          metadata: { smokeId: fixture.marker }
        })).rejects.toThrow("SourceDecision evidenceStatus does not match persisted evidence identity");

        const edgeCount = await fixture.client<{ count: number }[]>`
          select count(*)::int as count
          from source_decision_edges
          where source_claim_id = ${sourceClaim.id}
        `;
        const outboxCount = await fixture.client<{ count: number }[]>`
          select count(*)::int as count
          from outbox_events
          where payload->>'smokeId' = ${fixture.marker}
        `;

        expect(edgeCount).toEqual([{ count: 0 }]);
        expect(outboxCount).toEqual([{ count: 0 }]);
      } finally {
        await cleanupFixture(fixture);
      }
    });
  }
);
