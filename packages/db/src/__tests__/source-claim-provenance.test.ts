import crypto from "node:crypto";

import { and, eq, sql } from "drizzle-orm";
import postgres from "postgres";
import { describe, expect, it } from "vitest";
import {
  rankSourceAuthority,
  sourceAuthorityLabels,
  type SourceAuthorityLabel
} from "@krn/core";

import { createKrnDatabase, type KrnDatabaseTransaction } from "../database.js";
import { DrizzleSourceRepository } from "../repositories/drizzle-source-repository.js";
import {
  outboxEvents,
  projects,
  sourceChunks,
  sourceClaims,
  workspaces
} from "../schema/index.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();

const requiredId = (rows: readonly { id: string }[], label: string): string => {
  const id = rows[0]?.id;

  if (id === undefined) {
    throw new Error(`source claim provenance ${label} was not created`);
  }

  return id;
};

const createProjects = async (
  transaction: KrnDatabaseTransaction,
  marker: string
): Promise<{
  readonly projectAId: string;
  readonly projectBId: string;
}> => {
  const workspaceId = requiredId(await transaction
    .insert(workspaces)
    .values({
      slug: marker,
      displayName: "SourceClaim provenance fixture",
      metadata: { smokeId: marker }
    })
    .returning({ id: workspaces.id }), "workspace");
  const projectRows = await transaction
    .insert(projects)
    .values([
      {
        workspaceId,
        slug: `${marker}-a`,
        displayName: "SourceClaim provenance project A",
        metadata: { smokeId: marker }
      },
      {
        workspaceId,
        slug: `${marker}-b`,
        displayName: "SourceClaim provenance project B",
        metadata: { smokeId: marker }
      }
    ])
    .returning({ id: projects.id, slug: projects.slug });
  const projectAId = projectRows.find((project) => project.slug.endsWith("-a"))?.id;
  const projectBId = projectRows.find((project) => project.slug.endsWith("-b"))?.id;

  if (projectAId === undefined || projectBId === undefined) {
    throw new Error("source claim provenance projects were not created");
  }

  return { projectAId, projectBId };
};

const createArtifactWithChunk = async (
  sourceRepository: DrizzleSourceRepository,
  marker: string,
  projectId: string,
  label: string,
  sourceAuthority: SourceAuthorityLabel = "project-decision"
): Promise<{
  readonly artifactId: string;
  readonly chunkId: string;
}> => {
  const sourceArtifact = await sourceRepository.createSourceArtifact({
    projectId,
    kind: "operator_input",
    sourceAuthority,
    uri: `source-claim-provenance://${marker}/${label}`,
    title: `SourceClaim provenance ${label}`,
    contentHash: `source-claim-provenance-${marker}-${label}`,
    metadata: { smokeId: marker, label }
  });
  const sourceChunk = await sourceRepository.createSourceChunk({
    sourceArtifactId: sourceArtifact.id,
    ordinal: 0,
    content: `SourceClaim provenance content for ${label}.`,
    contentHash: `source-claim-provenance-chunk-${marker}-${label}`,
    metadata: { smokeId: marker, label }
  });

  return { artifactId: sourceArtifact.id, chunkId: sourceChunk.id };
};

const sourceClaimInput = (
  marker: string,
  sourceArtifactId: string,
  sourceChunkId?: string,
  caseLabel?: string
) => ({
  sourceArtifactId,
  ...(sourceChunkId === undefined ? {} : { sourceChunkId }),
  claim: "SourceClaim must cite a chunk from its own artifact.",
  mechanism: "Independent artifact and chunk foreign keys permit a mixed provenance tuple.",
  krnImplication: "Mixed provenance can misattribute governing source support.",
  doesNotProve: "This fixture does not prove claim text matches source bytes.",
  sourceAuthority: "project-decision" as const,
  supportType: "implementation-boundary" as const,
  consumer: "SourceClaim provenance boundary test",
  falsifier: "The claim persists with a chunk owned by a different source artifact.",
  metadata: { smokeId: marker, ...(caseLabel === undefined ? {} : { caseLabel }) }
});

const selectClaimChunkTuple = async (
  transaction: KrnDatabaseTransaction,
  sourceClaimId: string
) => transaction
  .select({
    claimId: sourceClaims.id,
    claimSourceArtifactId: sourceClaims.sourceArtifactId,
    sourceChunkId: sourceClaims.sourceChunkId,
    chunkSourceArtifactId: sourceChunks.sourceArtifactId
  })
  .from(sourceClaims)
  .innerJoin(sourceChunks, eq(sourceClaims.sourceChunkId, sourceChunks.id))
  .where(eq(sourceClaims.id, sourceClaimId));

const withRolledBackTransaction = async (
  test: (transaction: KrnDatabaseTransaction, marker: string) => Promise<void>,
  isolationLevel: "read committed" | "repeatable read" = "repeatable read"
): Promise<void> => {
  const client = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
  const database = createKrnDatabase(client);
  const marker = `source-claim-provenance-${crypto.randomUUID()}`;
  const expectedFixtureRollback = new Error("source claim provenance fixture rollback");

  try {
    try {
      await database.transaction(
        async (transaction) => {
          await test(transaction, marker);
          throw expectedFixtureRollback;
        },
        { isolationLevel }
      );
    } catch (error) {
      if (error !== expectedFixtureRollback) {
        throw error;
      }
    }
  } finally {
    await client.end();
  }
};

interface SourceAuthorityPairResult {
  readonly artifactAuthority: SourceAuthorityLabel;
  readonly claimAuthority: SourceAuthorityLabel;
  readonly artifactRank: number;
  readonly claimRank: number;
  readonly status: "accepted" | "rejected";
  readonly rejectionMessage?: string;
  readonly rejectionConstraint?: string;
}

const postgresConstraintName = (error: unknown): string | undefined => {
  if (!(error instanceof Error) || !("cause" in error)) {
    return undefined;
  }

  const cause: unknown = error.cause;

  if (typeof cause !== "object" || cause === null || !("constraint_name" in cause)) {
    return undefined;
  }

  return typeof cause.constraint_name === "string" ? cause.constraint_name : undefined;
};

describe("source claim provenance", () => {
  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "prevents claim authority escalation above its artifact",
    async () => {
      await withRolledBackTransaction(async (transaction, marker) => {
        const sourceRepository = new DrizzleSourceRepository(transaction);
        const { projectAId } = await createProjects(transaction, marker);
        const results: SourceAuthorityPairResult[] = [];
        const outboxEventsBefore = await transaction
          .select({ id: outboxEvents.id })
          .from(outboxEvents)
          .orderBy(outboxEvents.id);

        for (const artifactAuthority of sourceAuthorityLabels) {
          const artifact = await createArtifactWithChunk(
            sourceRepository,
            marker,
            projectAId,
            `authority-${artifactAuthority}`,
            artifactAuthority
          );

          for (const claimAuthority of sourceAuthorityLabels) {
            const artifactRank = rankSourceAuthority(artifactAuthority);
            const claimRank = rankSourceAuthority(claimAuthority);

            try {
              await sourceRepository.createSourceClaim({
                ...sourceClaimInput(
                  marker,
                  artifact.artifactId,
                  artifact.chunkId,
                  `${artifactAuthority}-to-${claimAuthority}`
                ),
                sourceAuthority: claimAuthority
              });
              results.push({
                artifactAuthority,
                claimAuthority,
                artifactRank,
                claimRank,
                status: "accepted"
              });
            } catch (error) {
              results.push({
                artifactAuthority,
                claimAuthority,
                artifactRank,
                claimRank,
                status: "rejected",
                rejectionMessage: error instanceof Error
                  ? error.message
                  : "SourceClaim authority rejection did not throw an Error"
              });
            }
          }
        }

        const hypothesisToOfficial = results.find((result) =>
          result.artifactAuthority === "hypothesis" && result.claimAuthority === "official"
        );
        const policyMismatches = results.filter((result) =>
          (result.claimRank > result.artifactRank) !== (result.status === "rejected")
        );
        const expectedRejectedPairCount = results.filter((result) =>
          result.claimRank > result.artifactRank
        ).length;
        const actualRejectedPairCount = results.filter((result) =>
          result.status === "rejected"
        ).length;
        const acceptedPairCount = results.length - actualRejectedPairCount;
        const persistedMatrixClaims = await transaction
          .select({ id: sourceClaims.id })
          .from(sourceClaims)
          .where(sql`${sourceClaims.metadata}->>'smokeId' = ${marker}`);
        const outboxEventsAfter = await transaction
          .select({ id: outboxEvents.id })
          .from(outboxEvents)
          .orderBy(outboxEvents.id);

        expect({
          totalPairCount: results.length,
          hypothesisToOfficial,
          expectedRejectedPairCount,
          actualRejectedPairCount,
          policyMismatchCount: policyMismatches.length,
          persistedClaimCount: persistedMatrixClaims.length,
          outboxChanged: JSON.stringify(outboxEventsAfter) !== JSON.stringify(outboxEventsBefore)
        }).toEqual({
          totalPairCount: sourceAuthorityLabels.length ** 2,
          hypothesisToOfficial: {
            artifactAuthority: "hypothesis",
            claimAuthority: "official",
            artifactRank: rankSourceAuthority("hypothesis"),
            claimRank: rankSourceAuthority("official"),
            status: "rejected",
            rejectionMessage:
              "SourceClaim sourceAuthority official exceeds SourceArtifact sourceAuthority hypothesis"
          },
          expectedRejectedPairCount,
          actualRejectedPairCount: expectedRejectedPairCount,
          policyMismatchCount: 0,
          persistedClaimCount: acceptedPairCount,
          outboxChanged: false
        });
      });
    }
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "matches the canonical authority matrix for direct SQL and artifact downgrades",
    async () => {
      await withRolledBackTransaction(async (transaction, marker) => {
        const sourceRepository = new DrizzleSourceRepository(transaction);
        const { projectAId } = await createProjects(transaction, marker);
        const results: SourceAuthorityPairResult[] = [];

        for (const artifactAuthority of sourceAuthorityLabels) {
          const artifact = await createArtifactWithChunk(
            sourceRepository,
            marker,
            projectAId,
            `direct-sql-authority-${artifactAuthority}`,
            artifactAuthority
          );

          for (const claimAuthority of sourceAuthorityLabels) {
            const artifactRank = rankSourceAuthority(artifactAuthority);
            const claimRank = rankSourceAuthority(claimAuthority);

            try {
              await transaction.transaction(async (nestedTransaction) =>
                nestedTransaction.execute(sql`
                  insert into source_claims (
                    source_artifact_id,
                    source_chunk_id,
                    claim,
                    mechanism,
                    krn_implication,
                    does_not_prove,
                    trust_tier,
                    support_type,
                    consumer,
                    falsifier,
                    metadata
                  ) values (
                    ${artifact.artifactId},
                    ${artifact.chunkId},
                    'direct SQL authority matrix claim',
                    'PostgreSQL owns the durable authority ceiling',
                    'SQL authority policy must match the canonical core rank',
                    'does not prove the artifact authority is correct',
                    ${claimAuthority},
                    'implementation-boundary',
                    'SourceClaim SQL authority matrix',
                    'a direct SQL pair disagrees with canonical rankSourceAuthority',
                    ${JSON.stringify({
                      smokeId: marker,
                      caseLabel: `direct-sql-${artifactAuthority}-to-${claimAuthority}`
                    })}::jsonb
                  )
                `)
              );
              results.push({
                artifactAuthority,
                claimAuthority,
                artifactRank,
                claimRank,
                status: "accepted"
              });
            } catch (error) {
              results.push({
                artifactAuthority,
                claimAuthority,
                artifactRank,
                claimRank,
                status: "rejected",
                rejectionMessage: error instanceof Error ? error.message : undefined,
                rejectionConstraint: postgresConstraintName(error)
              });
            }
          }
        }

        const policyMismatches = results.filter((result) =>
          (result.claimRank > result.artifactRank) !== (result.status === "rejected")
        );
        const invalidRejectionConstraints = results.filter((result) =>
          result.status === "rejected" &&
          result.rejectionConstraint !== "source_claims_authority_ceiling"
        );
        const expectedRejectedPairCount = results.filter((result) =>
          result.claimRank > result.artifactRank
        ).length;
        const persistedMatrixClaims = await transaction
          .select({ id: sourceClaims.id })
          .from(sourceClaims)
          .where(sql`${sourceClaims.metadata}->>'smokeId' = ${marker}`);

        expect({
          totalPairCount: results.length,
          rejectedPairCount: results.filter((result) => result.status === "rejected").length,
          policyMismatchCount: policyMismatches.length,
          invalidRejectionConstraintCount: invalidRejectionConstraints.length,
          persistedClaimCount: persistedMatrixClaims.length
        }).toEqual({
          totalPairCount: sourceAuthorityLabels.length ** 2,
          rejectedPairCount: expectedRejectedPairCount,
          policyMismatchCount: 0,
          invalidRejectionConstraintCount: 0,
          persistedClaimCount: results.length - expectedRejectedPairCount
        });

        const officialArtifact = await createArtifactWithChunk(
          sourceRepository,
          marker,
          projectAId,
          "direct-sql-artifact-downgrade",
          "official"
        );
        const officialClaim = await sourceRepository.createSourceClaim({
          ...sourceClaimInput(
            marker,
            officialArtifact.artifactId,
            officialArtifact.chunkId,
            "artifact-downgrade"
          ),
          sourceAuthority: "official"
        });

        await expect(transaction.transaction(async (nestedTransaction) =>
          nestedTransaction.execute(sql`
            update source_artifacts
            set trust_tier = 'hypothesis'
            where id = ${officialArtifact.artifactId}
          `)
        )).rejects.toMatchObject({
          cause: {
            code: "23514",
            constraint_name: "source_claims_authority_ceiling"
          }
        });

        const [persistedClaim] = await transaction
          .select({
            sourceAuthority: sourceClaims.sourceAuthority,
            artifactAuthority: sql<string>`source_artifact.trust_tier::text`
          })
          .from(sourceClaims)
          .innerJoin(
            sql`source_artifacts source_artifact`,
            sql`source_artifact.id = ${sourceClaims.sourceArtifactId}`
          )
          .where(eq(sourceClaims.id, officialClaim.id));

        expect(persistedClaim).toEqual({
          sourceAuthority: "official",
          artifactAuthority: "official"
        });
      });
    }
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "serializes a concurrent artifact downgrade before claim persistence",
    async () => {
      const marker = `source-claim-authority-race-${crypto.randomUUID()}`;
      const creatorApplicationName = `krn-authority-race-${crypto.randomUUID()}`;
      const creatorUrl = new URL(databaseUrl!);
      creatorUrl.searchParams.set("application_name", creatorApplicationName);
      const setupClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const creatorClient = postgres(creatorUrl.toString(), { max: 1, onnotice: () => undefined });
      const blockerClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const observerClient = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const setupDatabase = createKrnDatabase(setupClient);
      const creatorRepository = new DrizzleSourceRepository(createKrnDatabase(creatorClient));
      let releaseBlocker: (() => void) | undefined;
      let reportBlockerReady: (() => void) | undefined;
      const blockerReady = new Promise<void>((resolve) => {
        reportBlockerReady = resolve;
      });
      const blockerMayCommit = new Promise<void>((resolve) => {
        releaseBlocker = resolve;
      });

      try {
        const fixture = await setupDatabase.transaction(async (transaction) => {
          const sourceRepository = new DrizzleSourceRepository(transaction);
          const { projectAId } = await createProjects(transaction, marker);
          const artifact = await createArtifactWithChunk(
            sourceRepository,
            marker,
            projectAId,
            "concurrent-downgrade",
            "official"
          );

          return { projectAId, artifact };
        });
        const blocker = blockerClient.begin(async (transaction) => {
          await transaction`lock table source_claims in access exclusive mode`;
          reportBlockerReady?.();
          await blockerMayCommit;
          await transaction`
            update source_artifacts
            set trust_tier = 'hypothesis'
            where id = ${fixture.artifact.artifactId}
          `;
        });

        await blockerReady;
        const createClaim = creatorRepository.createSourceClaim({
          ...sourceClaimInput(
            marker,
            fixture.artifact.artifactId,
            fixture.artifact.chunkId,
            "concurrent-elevation"
          ),
          sourceAuthority: "official"
        });
        let creatorWaitedForTableLock = false;

        for (let attempt = 0; attempt < 100; attempt += 1) {
          const [activity] = await observerClient<{ waiting: boolean }[]>`
            select wait_event_type = 'Lock' as waiting
            from pg_stat_activity
            where application_name = ${creatorApplicationName}
              and query ilike 'insert into %source_claims%'
          `;

          if (activity?.waiting === true) {
            creatorWaitedForTableLock = true;
            break;
          }

          await new Promise<void>((resolve) => setTimeout(resolve, 10));
        }

        expect(creatorWaitedForTableLock).toBe(true);
        releaseBlocker?.();
        await blocker;
        await expect(createClaim).rejects.toMatchObject({
          cause: {
            code: "23514",
            constraint_name: "source_claims_authority_ceiling",
            message:
              "SourceClaim sourceAuthority official exceeds SourceArtifact sourceAuthority hypothesis"
          }
        });

        const rows = await setupClient<{ claimCount: number; artifactAuthority: string }[]>`
          select
            count(claim.id)::int as "claimCount",
            min(artifact.trust_tier::text) as "artifactAuthority"
          from source_artifacts artifact
          left join source_claims claim on claim.source_artifact_id = artifact.id
          where artifact.id = ${fixture.artifact.artifactId}
        `;
        expect(rows).toEqual([{ claimCount: 0, artifactAuthority: "hypothesis" }]);

        await setupClient`delete from projects where id = ${fixture.projectAId}`;
      } finally {
        releaseBlocker?.();
        await Promise.allSettled([
          creatorClient.end(),
          blockerClient.end(),
          observerClient.end(),
          setupClient.end()
        ]);
      }
    },
    15_000
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "rejects a chunk from another source artifact before repository writes",
    async () => {
      await withRolledBackTransaction(async (transaction, marker) => {
        const sourceRepository = new DrizzleSourceRepository(transaction);
        const { projectAId } = await createProjects(transaction, marker);
        const claimArtifact = await createArtifactWithChunk(
          sourceRepository,
          marker,
          projectAId,
          "repository-claim-artifact"
        );
        const wrongArtifact = await createArtifactWithChunk(
          sourceRepository,
          marker,
          projectAId,
          "repository-wrong-artifact"
        );
        const mismatchInput = sourceClaimInput(
          marker,
          claimArtifact.artifactId,
          wrongArtifact.chunkId,
          "repository-mismatch"
        );
        const outboxEventsBefore = await transaction
          .select({ id: outboxEvents.id })
          .from(outboxEvents)
          .orderBy(outboxEvents.id);
        let mismatchError: unknown;

        try {
          await sourceRepository.createSourceClaim(mismatchInput);
        } catch (error) {
          mismatchError = error;
        }

        expect(mismatchError).toBeInstanceOf(Error);

        if (!(mismatchError instanceof Error)) {
          throw new Error("SourceClaim ownership mismatch did not reject with an Error");
        }

        expect(mismatchError.message).toBe(
          `SourceClaim sourceChunkId ${wrongArtifact.chunkId} belongs to sourceArtifactId `
          + `${wrongArtifact.artifactId}; expected ${claimArtifact.artifactId}`
        );

        const rejectedClaims = await transaction
          .select({ id: sourceClaims.id })
          .from(sourceClaims)
          .where(and(
            eq(sourceClaims.sourceArtifactId, claimArtifact.artifactId),
            eq(sourceClaims.sourceChunkId, wrongArtifact.chunkId)
          ));
        const outboxEventsAfter = await transaction
          .select({ id: outboxEvents.id })
          .from(outboxEvents)
          .orderBy(outboxEvents.id);

        expect(rejectedClaims).toEqual([]);
        expect(outboxEventsAfter).toEqual(outboxEventsBefore);

        const validClaim = await sourceRepository.createSourceClaim(sourceClaimInput(
          marker,
          claimArtifact.artifactId,
          claimArtifact.chunkId,
          "valid-matching-chunk"
        ));
        const chunklessClaim = await sourceRepository.createSourceClaim(sourceClaimInput(
          marker,
          claimArtifact.artifactId,
          undefined,
          "chunkless-proposed"
        ));

        expect(await selectClaimChunkTuple(transaction, validClaim.id)).toEqual([{
          claimId: validClaim.id,
          claimSourceArtifactId: claimArtifact.artifactId,
          sourceChunkId: claimArtifact.chunkId,
          chunkSourceArtifactId: claimArtifact.artifactId
        }]);
        expect(chunklessClaim).toMatchObject({
          sourceArtifactId: claimArtifact.artifactId,
          status: "proposed"
        });
        expect(chunklessClaim).not.toHaveProperty("sourceChunkId");

        await transaction
          .delete(sourceChunks)
          .where(eq(sourceChunks.id, claimArtifact.chunkId));
        const [validClaimAfterChunkDelete] = await transaction
          .select({
            sourceArtifactId: sourceClaims.sourceArtifactId,
            sourceChunkId: sourceClaims.sourceChunkId
          })
          .from(sourceClaims)
          .where(eq(sourceClaims.id, validClaim.id));
        const [chunklessClaimAfterChunkDelete] = await transaction
          .select({
            sourceArtifactId: sourceClaims.sourceArtifactId,
            sourceChunkId: sourceClaims.sourceChunkId
          })
          .from(sourceClaims)
          .where(eq(sourceClaims.id, chunklessClaim.id));

        expect(validClaimAfterChunkDelete).toEqual({
          sourceArtifactId: claimArtifact.artifactId,
          sourceChunkId: null
        });
        expect(chunklessClaimAfterChunkDelete).toEqual({
          sourceArtifactId: claimArtifact.artifactId,
          sourceChunkId: null
        });
      }, "read committed");
    }
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "rejects cross-project inserts and ownership updates through direct SQL",
    async () => {
      await withRolledBackTransaction(async (transaction, marker) => {
        const sourceRepository = new DrizzleSourceRepository(transaction);
        const { projectAId, projectBId } = await createProjects(transaction, marker);
        const claimArtifact = await createArtifactWithChunk(
          sourceRepository,
          marker,
          projectAId,
          "sql-claim-artifact"
        );
        const foreignArtifact = await createArtifactWithChunk(
          sourceRepository,
          marker,
          projectBId,
          "sql-foreign-artifact"
        );
        const sourceClaim = await sourceRepository.createSourceClaim(sourceClaimInput(
          marker,
          claimArtifact.artifactId,
          claimArtifact.chunkId
        ));

        await expect(transaction.transaction(async (nestedTransaction) =>
          nestedTransaction
            .insert(sourceClaims)
            .values(sourceClaimInput(
              marker,
              claimArtifact.artifactId,
              foreignArtifact.chunkId,
              "sql-insert-mismatch"
            ))
            .returning({ id: sourceClaims.id })
        )).rejects.toMatchObject({
          cause: {
            code: "23503",
            constraint_name: "source_claims_chunk_artifact_fk"
          }
        });
        await expect(transaction.transaction(async (nestedTransaction) =>
          nestedTransaction
            .update(sourceClaims)
            .set({ sourceChunkId: foreignArtifact.chunkId })
            .where(eq(sourceClaims.id, sourceClaim.id))
            .returning({ id: sourceClaims.id })
        )).rejects.toMatchObject({
          cause: {
            code: "23503",
            constraint_name: "source_claims_chunk_artifact_fk"
          }
        });
        expect(await transaction
          .select({ id: sourceClaims.id })
          .from(sourceClaims)
          .where(and(
            eq(sourceClaims.sourceArtifactId, claimArtifact.artifactId),
            eq(sourceClaims.sourceChunkId, foreignArtifact.chunkId)
          ))).toEqual([]);
        await transaction
          .delete(sourceChunks)
          .where(eq(sourceChunks.id, foreignArtifact.chunkId));
        await expect(transaction.transaction(async (nestedTransaction) =>
          nestedTransaction
            .update(sourceChunks)
            .set({ sourceArtifactId: foreignArtifact.artifactId })
            .where(eq(sourceChunks.id, claimArtifact.chunkId))
            .returning({ id: sourceChunks.id })
        )).rejects.toMatchObject({
          cause: {
            code: "23503",
            constraint_name: "source_claims_chunk_artifact_fk"
          }
        });

        expect(await selectClaimChunkTuple(transaction, sourceClaim.id)).toEqual([{
          claimId: sourceClaim.id,
          claimSourceArtifactId: claimArtifact.artifactId,
          sourceChunkId: claimArtifact.chunkId,
          chunkSourceArtifactId: claimArtifact.artifactId
        }]);
      }, "read committed");
    }
  );
});
