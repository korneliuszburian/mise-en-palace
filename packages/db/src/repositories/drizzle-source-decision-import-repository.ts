import { and, eq } from "drizzle-orm";
import type {
  SourceDecisionImportLookup,
  SourceDecisionImportLookupInput,
  SourceDecisionImportRepository
} from "@krn/core/repositories/internal";

import type { KrnDatabase, KrnDatabaseTransaction } from "../database.js";
import {
  searchDocuments,
  sourceArtifacts,
  sourceChunks,
  sourceClaims,
  sourceDecisionEdges,
  sourceDecisions,
  sourceRejections
} from "../schema/index.js";

export class DrizzleSourceDecisionImportRepository implements SourceDecisionImportRepository {
  constructor(private readonly db: KrnDatabase | KrnDatabaseTransaction) {}

  async getSourceDecisionImportRow(
    input: SourceDecisionImportLookupInput
  ): Promise<SourceDecisionImportLookup> {
    const rows = await this.db
      .select({
        sourceArtifact: sourceArtifacts,
        sourceChunk: sourceChunks,
        sourceClaim: sourceClaims,
        sourceDecision: sourceDecisions,
        sourceDecisionEdge: sourceDecisionEdges,
        searchDocument: searchDocuments,
        sourceRejection: sourceRejections
      })
      .from(sourceArtifacts)
      .leftJoin(sourceChunks, eq(sourceChunks.sourceArtifactId, sourceArtifacts.id))
      .leftJoin(sourceClaims, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
      .leftJoin(sourceDecisions, eq(sourceDecisions.sourceClaimId, sourceClaims.id))
      .leftJoin(sourceDecisionEdges, eq(sourceDecisionEdges.sourceClaimId, sourceClaims.id))
      .leftJoin(
        searchDocuments,
        and(
          eq(searchDocuments.sourceClaimId, sourceClaims.id),
          eq(searchDocuments.sourceDecisionId, sourceDecisions.id)
        )
      )
      .leftJoin(sourceRejections, eq(sourceRejections.sourceClaimId, sourceClaims.id))
      .where(and(
        eq(sourceArtifacts.projectId, input.projectId),
        eq(sourceArtifacts.importId, input.importId),
        eq(sourceArtifacts.importRowId, input.decisionId)
      ))
      .limit(1);
    const row = rows[0];

    if (row === undefined) {
      return { status: "missing" };
    }

    if (
      row.sourceChunk === null ||
      row.sourceClaim === null ||
      row.sourceDecision === null
    ) {
      return {
        status: "partial",
        sourceArtifactId: row.sourceArtifact.id,
        contentHash: row.sourceArtifact.contentHash
      };
    }

    return {
      status: "complete",
      row: {
        decisionId: input.decisionId,
        contentHash: row.sourceArtifact.contentHash,
        sourceArtifactId: row.sourceArtifact.id,
        sourceChunkId: row.sourceChunk.id,
        sourceClaimId: row.sourceClaim.id,
        sourceClaimStatus: row.sourceClaim.status,
        sourceDecisionId: row.sourceDecision.id,
        sourceDecisionStatus: row.sourceDecision.status,
        ...(row.sourceDecisionEdge === null
          ? {}
          : { sourceDecisionEdgeId: row.sourceDecisionEdge.id }),
        ...(row.searchDocument === null
          ? {}
          : { searchDocumentId: row.searchDocument.id }),
        ...(row.sourceRejection === null
          ? {}
          : { sourceRejectionId: row.sourceRejection.id })
      }
    };
  }
}
