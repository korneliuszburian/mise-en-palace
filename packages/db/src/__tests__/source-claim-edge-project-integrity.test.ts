import crypto from "node:crypto";

import postgres from "postgres";
import { describe, expect, it } from "vitest";

import type {
  SourceClaim
} from "@krn/core";
import {
  buildSourceConsensusTimelineReadback
} from "@krn/core";

import {
  createKrnDatabase
} from "../database.js";
import {
  assertSourceClaimEdgeGovernance,
  DrizzleSourceRepository
} from "../repositories/drizzle-source-repository.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();

interface SourceClaimEdgeIntegrityFixture {
  readonly client: ReturnType<typeof postgres>;
  readonly marker: string;
  readonly projectAId: string;
  readonly projectBId: string;
  readonly sourceRepository: DrizzleSourceRepository;
  readonly workspaceId: string;
}

interface AcceptedSourceClaim {
  readonly sourceClaim: SourceClaim;
  readonly sourceDecisionId: string;
}

const requiredId = (rows: readonly { id: string }[], label: string): string => {
  const id = rows[0]?.id;

  if (id === undefined) {
    throw new Error(`source claim edge integrity ${label} was not created`);
  }

  return id;
};

const edgeMetadata = (marker: string, label: string): Record<string, unknown> => ({
  smokeId: marker,
  consumer: "md7u.137 source claim edge integrity witness",
  doesNotProve: "This witness does not prove allowed relation semantics or source truth.",
  evidenceRef: `source-claim-edge-integrity:${label}`
});

const createFixture = async (url: string): Promise<SourceClaimEdgeIntegrityFixture> => {
  const client = postgres(url, { max: 1, onnotice: () => undefined });
  const marker = `source-claim-edge-integrity-${crypto.randomUUID()}`;

  try {
    const workspaceId = requiredId(await client<{ id: string }[]>`
      insert into workspaces (slug, display_name, metadata)
      values (${marker}, 'SourceClaimEdge integrity witness', ${client.json({ smokeId: marker })})
      returning id
    `, "workspace");
    const projectAId = requiredId(await client<{ id: string }[]>`
      insert into projects (workspace_id, slug, display_name, metadata)
      values (${workspaceId}, ${`${marker}-a`}, 'SourceClaimEdge project A', ${client.json({ smokeId: marker })})
      returning id
    `, "project A");
    const projectBId = requiredId(await client<{ id: string }[]>`
      insert into projects (workspace_id, slug, display_name, metadata)
      values (${workspaceId}, ${`${marker}-b`}, 'SourceClaimEdge project B', ${client.json({ smokeId: marker })})
      returning id
    `, "project B");

    return {
      client,
      marker,
      projectAId,
      projectBId,
      sourceRepository: new DrizzleSourceRepository(createKrnDatabase(client)),
      workspaceId
    };
  } catch (error) {
    await client`delete from workspaces where slug = ${marker}`;
    await client.end();
    throw error;
  }
};

const createAcceptedSourceClaim = async (
  fixture: SourceClaimEdgeIntegrityFixture,
  projectId: string,
  label: string
): Promise<AcceptedSourceClaim> => {
  const sourceArtifact = await fixture.sourceRepository.createSourceArtifact({
    projectId,
    kind: "operator_input",
    sourceAuthority: "project-decision",
    uri: `source-claim-edge-integrity://${fixture.marker}/${label}`,
    title: `SourceClaimEdge integrity ${label}`,
    contentHash: `source-claim-edge-integrity-${fixture.marker}-${label}`,
    metadata: { smokeId: fixture.marker }
  });
  const sourceClaim = await fixture.sourceRepository.createSourceClaim({
    sourceArtifactId: sourceArtifact.id,
    claim: `SourceClaimEdge integrity ${label} must remain reviewable.`,
    mechanism: "The witness records a concrete source claim endpoint for graph integrity checks.",
    krnImplication: "Invalid SourceClaimEdge rows can distort source consensus and graph readback.",
    doesNotProve: "This witness does not prove source truth.",
    sourceAuthority: "project-decision",
    supportType: "implementation-boundary",
    consumer: "md7u.137 source claim edge integrity witness",
    falsifier: "An invalid SourceClaimEdge is stored without a reviewable endpoint claim.",
    metadata: { smokeId: fixture.marker }
  });

  const sourceDecision = await fixture.sourceRepository.createSourceDecision({
    projectId,
    sourceClaimId: sourceClaim.id,
    status: "adopt",
    decision: `Adopt SourceClaimEdge integrity ${label} for this witness.`,
    rationale: "Accepted endpoints are required to isolate edge-integrity behavior from lifecycle rejection.",
    falsifier: "The witness creates an edge from a non-accepted source claim.",
    consumer: "md7u.137 source claim edge integrity witness",
    metadata: { smokeId: fixture.marker }
  });

  const acceptedSourceClaim = await fixture.sourceRepository.getSourceClaimById(sourceClaim.id);

  if (acceptedSourceClaim === undefined || acceptedSourceClaim.status !== "accepted") {
    throw new Error(`source claim edge integrity ${label} did not become accepted`);
  }

  return {
    sourceClaim: acceptedSourceClaim,
    sourceDecisionId: sourceDecision.id
  };
};

const cleanupFixture = async (fixture: SourceClaimEdgeIntegrityFixture): Promise<void> => {
  await fixture.client`delete from outbox_events where payload->>'smokeId' = ${fixture.marker}`;
  await fixture.client`delete from source_claim_edges where metadata->>'smokeId' = ${fixture.marker}`;
  await fixture.client`delete from source_decision_edges where metadata->>'smokeId' = ${fixture.marker}`;
  await fixture.client`delete from source_decisions where metadata->>'smokeId' = ${fixture.marker}`;
  await fixture.client`delete from source_artifacts where metadata->>'smokeId' = ${fixture.marker}`;
  await fixture.client`delete from projects where workspace_id = ${fixture.workspaceId}`;
  await fixture.client`delete from workspaces where id = ${fixture.workspaceId}`;
  await fixture.client.end();
};

describe("source claim edge project integrity", () => {
  it("currently admits a self SourceClaimEdge at the pure governance boundary", () => {
    expect(() => assertSourceClaimEdgeGovernance({
      fromSourceClaimId: "source-claim-self",
      toSourceClaimId: "source-claim-self",
      kind: "supersedes",
      metadata: edgeMetadata("pure", "self")
    })).not.toThrow();
  });

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "captures self, cross-project, and duplicate SourceClaimEdge writes with their exact effects",
    async () => {
      const fixture = await createFixture(databaseUrl!);

      try {
        const projectAClaim = await createAcceptedSourceClaim(fixture, fixture.projectAId, "project-a-1");
        const projectASecondClaim = await createAcceptedSourceClaim(fixture, fixture.projectAId, "project-a-2");
        const projectAThirdClaim = await createAcceptedSourceClaim(fixture, fixture.projectAId, "project-a-3");
        const projectBClaim = await createAcceptedSourceClaim(fixture, fixture.projectBId, "project-b-1");
        const sourceDecisionEdge = await fixture.sourceRepository.createSourceDecisionEdge({
          sourceClaimId: projectAClaim.sourceClaim.id,
          sourceDecisionId: projectAClaim.sourceDecisionId,
          targetType: "architecture_decision",
          targetId: "KRN_ROADMAP.md#source-claim-edge-integrity",
          supportType: "decision",
          confidence: "high",
          notes: "This fixture gives the self-superseding claim real rank-down authority.",
          metadata: edgeMetadata(fixture.marker, "source-decision")
        });
        const repositorySelfEdge = await fixture.sourceRepository.createSourceClaimEdge({
          fromSourceClaimId: projectAClaim.sourceClaim.id,
          toSourceClaimId: projectAClaim.sourceClaim.id,
          kind: "supersedes",
          metadata: edgeMetadata(fixture.marker, "repository-self")
        });
        const repositoryDuplicateInput = {
          fromSourceClaimId: projectAClaim.sourceClaim.id,
          toSourceClaimId: projectASecondClaim.sourceClaim.id,
          kind: "supports" as const,
          metadata: edgeMetadata(fixture.marker, "repository-duplicate")
        };
        const repositoryDuplicateFirst = await fixture.sourceRepository.createSourceClaimEdge(
          repositoryDuplicateInput
        );
        const repositoryDuplicateRetry = await fixture.sourceRepository.createSourceClaimEdge(
          repositoryDuplicateInput
        );
        const directSelfEdgeId = requiredId(await fixture.client<{ id: string }[]>`
          insert into source_claim_edges (from_source_claim_id, to_source_claim_id, kind, metadata)
          values (
            ${projectAClaim.sourceClaim.id},
            ${projectAClaim.sourceClaim.id},
            'supports',
            ${JSON.stringify(edgeMetadata(fixture.marker, "direct-self"))}::jsonb
          )
          returning id
        `, "direct self edge");
        const directCrossProjectEdgeId = requiredId(await fixture.client<{ id: string }[]>`
          insert into source_claim_edges (from_source_claim_id, to_source_claim_id, kind, metadata)
          values (
            ${projectAClaim.sourceClaim.id},
            ${projectBClaim.sourceClaim.id},
            'supports',
            ${JSON.stringify(edgeMetadata(fixture.marker, "direct-cross-project"))}::jsonb
          )
          returning id
        `, "direct cross-project edge");
        const directDuplicateFirstId = requiredId(await fixture.client<{ id: string }[]>`
          insert into source_claim_edges (from_source_claim_id, to_source_claim_id, kind, metadata)
          values (
            ${projectASecondClaim.sourceClaim.id},
            ${projectAThirdClaim.sourceClaim.id},
            'supports',
            ${JSON.stringify(edgeMetadata(fixture.marker, "direct-duplicate"))}::jsonb
          )
          returning id
        `, "first direct duplicate edge");
        const directDuplicateRetryId = requiredId(await fixture.client<{ id: string }[]>`
          insert into source_claim_edges (from_source_claim_id, to_source_claim_id, kind, metadata)
          values (
            ${projectASecondClaim.sourceClaim.id},
            ${projectAThirdClaim.sourceClaim.id},
            'supports',
            ${JSON.stringify(edgeMetadata(fixture.marker, "direct-duplicate"))}::jsonb
          )
          returning id
        `, "second direct duplicate edge");
        const counts = (await fixture.client<{
          edgeCount: number;
          outboxCount: number;
        }[]>`
          select
            count(*)::int as "edgeCount",
            (
              select count(*)::int
              from outbox_events
              where topic = 'source.claim_edge.created'
                and payload->>'smokeId' = ${fixture.marker}
            ) as "outboxCount"
          from source_claim_edges
          where metadata->>'smokeId' = ${fixture.marker}
        `)[0];
        const timeline = buildSourceConsensusTimelineReadback({
          sourceClaims: [projectAClaim.sourceClaim],
          sourceClaimEdges: [repositorySelfEdge],
          sourceDecisionEdges: [sourceDecisionEdge],
          now: "2026-07-13T12:00:00.000Z"
        });
        const selfEntry = timeline.entries.find((entry) => entry.sourceClaimId === projectAClaim.sourceClaim.id);

        expect(repositoryDuplicateFirst.id).not.toBe(repositoryDuplicateRetry.id);
        expect(directDuplicateFirstId).not.toBe(directDuplicateRetryId);
        expect(directSelfEdgeId).not.toBe(repositorySelfEdge.id);
        expect(directCrossProjectEdgeId).toEqual(expect.any(String));
        expect(counts).toEqual({ edgeCount: 7, outboxCount: 3 });
        expect(timeline.supersededSourceClaimIds).toEqual([projectAClaim.sourceClaim.id]);
        expect(selfEntry?.supersededBySourceClaimIds).toEqual([projectAClaim.sourceClaim.id]);
      } finally {
        await cleanupFixture(fixture);
      }
    }
  );
});
