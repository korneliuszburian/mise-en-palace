import crypto from "node:crypto";

import { and, eq, sql } from "drizzle-orm";
import postgres from "postgres";
import { describe, expect, it } from "vitest";

import {
  sourceClaimEdgeKinds,
  type SourceClaim
} from "@krn/core";

import {
  createKrnDatabase,
  type KrnDatabase,
  type KrnDatabaseTransaction
} from "../database.js";
import {
  assertSourceClaimEdgeGovernance,
  DrizzleSourceRepository
} from "../repositories/drizzle-source-repository.js";
import {
  outboxEvents,
  projects,
  sourceClaimEdges,
  workspaces
} from "../schema/index.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();

interface SourceClaimEdgeIntegrityFixture {
  readonly client: ReturnType<typeof postgres>;
  readonly database: KrnDatabase;
  readonly marker: string;
}

const requiredId = (rows: readonly { id: string }[], label: string): string => {
  const id = rows[0]?.id;

  if (id === undefined) {
    throw new Error(`source claim edge integrity ${label} was not created`);
  }

  return id;
};

const edgeMetadata = (marker: string, label: string): {
  readonly consumer: string;
  readonly doesNotProve: string;
  readonly evidenceRef: string;
  readonly smokeId: string;
} => ({
  smokeId: marker,
  consumer: "md7u.138 source claim edge integrity",
  doesNotProve: "This test does not prove allowed relation semantics or source truth.",
  evidenceRef: `source-claim-edge-integrity:${label}`
});

const createProjectFixture = async (
  transaction: KrnDatabaseTransaction,
  fixture: SourceClaimEdgeIntegrityFixture
): Promise<{
  readonly projectAId: string;
  readonly projectBId: string;
}> => {
  const workspaceId = requiredId(await transaction
    .insert(workspaces)
    .values({
      slug: fixture.marker,
      displayName: "SourceClaimEdge integrity fixture",
      metadata: { smokeId: fixture.marker }
    })
    .returning({ id: workspaces.id }), "workspace");
  const projectRows = await transaction
    .insert(projects)
    .values([
      {
        workspaceId,
        slug: `${fixture.marker}-a`,
        displayName: "SourceClaimEdge project A",
        metadata: { smokeId: fixture.marker }
      },
      {
        workspaceId,
        slug: `${fixture.marker}-b`,
        displayName: "SourceClaimEdge project B",
        metadata: { smokeId: fixture.marker }
      }
    ])
    .returning({ id: projects.id, slug: projects.slug });
  const projectAId = projectRows.find((project) => project.slug.endsWith("-a"))?.id;
  const projectBId = projectRows.find((project) => project.slug.endsWith("-b"))?.id;

  if (projectAId === undefined || projectBId === undefined) {
    throw new Error("source claim edge integrity projects were not created");
  }

  return { projectAId, projectBId };
};

const createFixture = async (url: string): Promise<SourceClaimEdgeIntegrityFixture> => {
  const client = postgres(url, { max: 1, onnotice: () => undefined });
  const marker = `source-claim-edge-integrity-${crypto.randomUUID()}`;

  return {
    client,
    database: createKrnDatabase(client),
    marker
  };
};

const createAcceptedSourceClaim = async (
  sourceRepository: DrizzleSourceRepository,
  fixture: SourceClaimEdgeIntegrityFixture,
  projectId: string,
  label: string
): Promise<SourceClaim> => {
  const sourceArtifact = await sourceRepository.createSourceArtifact({
    projectId,
    kind: "operator_input",
    sourceAuthority: "project-decision",
    uri: `source-claim-edge-integrity://${fixture.marker}/${label}`,
    title: `SourceClaimEdge integrity ${label}`,
    contentHash: `source-claim-edge-integrity-${fixture.marker}-${label}`,
    metadata: { smokeId: fixture.marker }
  });
  const sourceClaim = await sourceRepository.createSourceClaim({
    sourceArtifactId: sourceArtifact.id,
    claim: `SourceClaimEdge integrity ${label} must remain reviewable.`,
    mechanism: "The fixture records a concrete source claim endpoint for graph integrity checks.",
    krnImplication: "Invalid SourceClaimEdge rows can distort source consensus and graph readback.",
    doesNotProve: "This fixture does not prove source truth.",
    sourceAuthority: "project-decision",
    supportType: "implementation-boundary",
    consumer: "md7u.138 source claim edge integrity",
    falsifier: "An invalid SourceClaimEdge is stored without a reviewable endpoint claim.",
    metadata: { smokeId: fixture.marker }
  });

  await sourceRepository.createSourceDecision({
    projectId,
    sourceClaimId: sourceClaim.id,
    status: "adopt",
    decision: `Adopt SourceClaimEdge integrity ${label} for this fixture.`,
    rationale: "Accepted endpoints isolate edge-integrity behavior from lifecycle rejection.",
    falsifier: "The fixture creates an edge from a non-accepted source claim.",
    consumer: "md7u.138 source claim edge integrity",
    metadata: { smokeId: fixture.marker }
  });

  const acceptedSourceClaim = await sourceRepository.getSourceClaimById(sourceClaim.id);

  if (acceptedSourceClaim === undefined || acceptedSourceClaim.status !== "accepted") {
    throw new Error(`source claim edge integrity ${label} did not become accepted`);
  }

  return acceptedSourceClaim;
};

const cleanupFixture = async (fixture: SourceClaimEdgeIntegrityFixture): Promise<void> => {
  await fixture.client.end();
};

describe("source claim edge project integrity", () => {
  it("rejects self SourceClaimEdges at the pure governance boundary", () => {
    expect(() => assertSourceClaimEdgeGovernance({
      fromSourceClaimId: "source-claim-self",
      toSourceClaimId: "source-claim-self",
      kind: "supersedes",
      metadata: edgeMetadata("pure", "self")
    })).toThrow("SourceClaimEdge requires distinct fromSourceClaimId and toSourceClaimId");
  });

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "enforces repository edge identity before insert and outbox emission",
    async () => {
      const fixture = await createFixture(databaseUrl!);
      const expectedFixtureRollback = new Error("source claim edge integrity fixture rollback");

      try {
        try {
          await fixture.database.transaction(async (transaction) => {
            const sourceRepository = new DrizzleSourceRepository(transaction);
            const { projectAId, projectBId } = await createProjectFixture(transaction, fixture);
            const projectAClaim = await createAcceptedSourceClaim(
              sourceRepository,
              fixture,
              projectAId,
              "project-a-1"
            );
            const projectASecondClaim = await createAcceptedSourceClaim(
              sourceRepository,
              fixture,
              projectAId,
              "project-a-2"
            );
            const projectAThirdClaim = await createAcceptedSourceClaim(
              sourceRepository,
              fixture,
              projectAId,
              "project-a-3"
            );
            const projectBClaim = await createAcceptedSourceClaim(
              sourceRepository,
              fixture,
              projectBId,
              "project-b-1"
            );
            const supportsForward = {
              fromSourceClaimId: projectAClaim.id,
              toSourceClaimId: projectASecondClaim.id,
              kind: "supports" as const,
              metadata: edgeMetadata(fixture.marker, "supports-forward")
            };

            await expect(sourceRepository.createSourceClaimEdge({
              fromSourceClaimId: projectAClaim.id,
              toSourceClaimId: projectAClaim.id,
              kind: "supports",
              metadata: edgeMetadata(fixture.marker, "self")
            })).rejects.toThrow("SourceClaimEdge requires distinct fromSourceClaimId and toSourceClaimId");
            await expect(sourceRepository.createSourceClaimEdge({
              fromSourceClaimId: projectAClaim.id,
              toSourceClaimId: projectBClaim.id,
              kind: "supports",
              metadata: edgeMetadata(fixture.marker, "cross-project")
            })).rejects.toThrow("SourceClaimEdge requires source records from the same project");

            const firstSupportsForward = await sourceRepository.createSourceClaimEdge(supportsForward);
            const exactRetry = await sourceRepository.createSourceClaimEdge({
              ...supportsForward,
              metadata: {
                evidenceRef: supportsForward.metadata.evidenceRef,
                doesNotProve: supportsForward.metadata.doesNotProve,
                consumer: supportsForward.metadata.consumer,
                smokeId: supportsForward.metadata.smokeId
              }
            });

            await expect(sourceRepository.createSourceClaimEdge({
              ...supportsForward,
              metadata: edgeMetadata(fixture.marker, "supports-forward-conflict")
            })).rejects.toThrow("SourceClaimEdge semantic identity has conflicting metadata");

            const legacyDuplicateMetadata = edgeMetadata(fixture.marker, "legacy-duplicate");

            await transaction.insert(sourceClaimEdges).values([
              {
                fromSourceClaimId: projectASecondClaim.id,
                toSourceClaimId: projectAThirdClaim.id,
                kind: "supports",
                metadata: legacyDuplicateMetadata
              },
              {
                fromSourceClaimId: projectASecondClaim.id,
                toSourceClaimId: projectAThirdClaim.id,
                kind: "supports",
                metadata: legacyDuplicateMetadata
              }
            ]);

            await expect(sourceRepository.createSourceClaimEdge({
              fromSourceClaimId: projectASecondClaim.id,
              toSourceClaimId: projectAThirdClaim.id,
              kind: "supports",
              metadata: legacyDuplicateMetadata
            })).rejects.toThrow("SourceClaimEdge semantic identity is ambiguous");

            for (const kind of sourceClaimEdgeKinds) {
              for (const [fromSourceClaimId, toSourceClaimId, direction] of [
                [projectAClaim.id, projectASecondClaim.id, "forward"],
                [projectASecondClaim.id, projectAClaim.id, "reverse"]
              ] as const) {
                if (kind === "supports" && direction === "forward") {
                  continue;
                }

                await sourceRepository.createSourceClaimEdge({
                  fromSourceClaimId,
                  toSourceClaimId,
                  kind,
                  metadata: edgeMetadata(fixture.marker, `${kind}-${direction}`)
                });
              }
            }

            const edges = await sourceRepository.listSourceClaimEdgesForClaim(projectAClaim.id);
            const fixtureEdges = await transaction
              .select({ id: sourceClaimEdges.id })
              .from(sourceClaimEdges)
              .where(sql`${sourceClaimEdges.metadata}->>'smokeId' = ${fixture.marker}`);
            const fixtureOutboxEvents = await transaction
              .select({ id: outboxEvents.id })
              .from(outboxEvents)
              .where(and(
                eq(outboxEvents.topic, "source.claim_edge.created"),
                sql`${outboxEvents.payload}->>'smokeId' = ${fixture.marker}`
              ));

            expect(exactRetry.id).toBe(firstSupportsForward.id);
            expect(edges).toHaveLength(sourceClaimEdgeKinds.length * 2);
            expect(fixtureEdges).toHaveLength(sourceClaimEdgeKinds.length * 2 + 2);
            expect(fixtureOutboxEvents).toHaveLength(sourceClaimEdgeKinds.length * 2);

            throw expectedFixtureRollback;
          });
        } catch (error) {
          if (error !== expectedFixtureRollback) {
            throw error;
          }
        }
      } finally {
        await cleanupFixture(fixture);
      }
    }
  );
});
