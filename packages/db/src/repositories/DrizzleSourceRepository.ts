import { eq } from "drizzle-orm";
import type {
  ProjectId,
  SourceClaim,
  SourceDecision
} from "@krn/core";
import type {
  CreateSourceArtifactInput,
  CreateSourceChunkInput,
  CreateSourceClaimInput,
  CreateSourceDecisionInput,
  SourceArtifactRecord,
  SourceChunkRecord,
  SourceRepository
} from "@krn/harness";

import type { KrnDatabase } from "../database.js";
import {
  outboxEvents,
  sourceArtifacts,
  sourceChunks,
  sourceClaims,
  sourceDecisions
} from "../schema/index.js";
import { requireReturnedRow } from "./common.js";
import {
  mapSourceArtifact,
  mapSourceChunk,
  mapSourceClaim,
  mapSourceDecision
} from "./mappers.js";

export class DrizzleSourceRepository implements SourceRepository {
  constructor(private readonly db: KrnDatabase) {}

  async createSourceArtifact(input: CreateSourceArtifactInput): Promise<SourceArtifactRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(sourceArtifacts)
        .values({
          ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
          kind: input.kind,
          trustTier: input.trustTier,
          uri: input.uri,
          title: input.title,
          contentHash: input.contentHash,
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createSourceArtifact"
    );

    return mapSourceArtifact(row);
  }

  async createSourceChunk(input: CreateSourceChunkInput): Promise<SourceChunkRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(sourceChunks)
        .values({
          sourceArtifactId: input.sourceArtifactId,
          ordinal: input.ordinal,
          ...(input.heading === undefined ? {} : { heading: input.heading }),
          content: input.content,
          ...(input.tokenCount === undefined ? {} : { tokenCount: input.tokenCount }),
          contentHash: input.contentHash,
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createSourceChunk"
    );

    return mapSourceChunk(row);
  }

  async createSourceClaim(input: CreateSourceClaimInput): Promise<SourceClaim> {
    const row = requireReturnedRow(
      await this.db
        .insert(sourceClaims)
        .values({
          sourceArtifactId: input.sourceArtifactId,
          ...(input.sourceChunkId === undefined ? {} : { sourceChunkId: input.sourceChunkId }),
          ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
          claim: input.claim,
          mechanism: input.mechanism,
          krnImplication: input.krnImplication,
          doesNotProve: input.doesNotProve,
          trustTier: input.trustTier,
          supportType: input.supportType,
          consumer: input.consumer,
          ...(input.falsifier === undefined ? {} : { falsifier: input.falsifier }),
          ...(input.revisitWhen === undefined ? {} : { revisitWhen: input.revisitWhen }),
          ...(input.status === undefined ? {} : { status: input.status }),
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createSourceClaim"
    );

    return mapSourceClaim(row);
  }

  async listClaimsForProject(projectId: ProjectId, limit: number): Promise<SourceClaim[]> {
    const rows = await this.db
      .select({
        id: sourceClaims.id,
        sourceArtifactId: sourceClaims.sourceArtifactId,
        sourceChunkId: sourceClaims.sourceChunkId,
        executionRunId: sourceClaims.executionRunId,
        claim: sourceClaims.claim,
        mechanism: sourceClaims.mechanism,
        krnImplication: sourceClaims.krnImplication,
        doesNotProve: sourceClaims.doesNotProve,
        trustTier: sourceClaims.trustTier,
        supportType: sourceClaims.supportType,
        consumer: sourceClaims.consumer,
        falsifier: sourceClaims.falsifier,
        revisitWhen: sourceClaims.revisitWhen,
        status: sourceClaims.status,
        metadata: sourceClaims.metadata,
        createdAt: sourceClaims.createdAt,
        updatedAt: sourceClaims.updatedAt
      })
      .from(sourceClaims)
      .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
      .where(eq(sourceArtifacts.projectId, projectId))
      .limit(limit);

    return rows.map(mapSourceClaim);
  }

  async createSourceDecision(input: CreateSourceDecisionInput): Promise<SourceDecision> {
    return this.db.transaction(async (tx) => {
      const row = requireReturnedRow(
        await tx
          .insert(sourceDecisions)
          .values({
            ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
            ...(input.sourceClaimId === undefined ? {} : { sourceClaimId: input.sourceClaimId }),
            status: input.status,
            decision: input.decision,
            rationale: input.rationale,
            falsifier: input.falsifier,
            consumer: input.consumer,
            metadata: input.metadata ?? {}
          })
          .returning(),
        "createSourceDecision"
      );

      await tx.insert(outboxEvents).values({
        topic: "source.decision.created",
        payload: {
          sourceDecisionId: row.id,
          projectId: row.projectId,
          sourceClaimId: row.sourceClaimId
        }
      });

      return mapSourceDecision(row);
    });
  }
}
