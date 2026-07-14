import crypto from "node:crypto";

import { and, eq } from "drizzle-orm";
import postgres from "postgres";
import { describe, expect, it } from "vitest";

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
  label: string
): Promise<{
  readonly artifactId: string;
  readonly chunkId: string;
}> => {
  const sourceArtifact = await sourceRepository.createSourceArtifact({
    projectId,
    kind: "operator_input",
    sourceAuthority: "project-decision",
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
  test: (transaction: KrnDatabaseTransaction, marker: string) => Promise<void>
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
        { isolationLevel: "repeatable read" }
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

describe("source claim provenance", () => {
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
      });
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
      });
    }
  );
});
