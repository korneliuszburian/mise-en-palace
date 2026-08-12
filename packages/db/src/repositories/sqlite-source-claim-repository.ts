import {
  and,
  eq
} from "drizzle-orm";
import type {
  ProjectId,
  SourceClaim
} from "@krn/core";

import type {
  KrnSqliteDatabase
} from "../sqlite-database.js";
import {
  sourceArtifacts,
  sourceClaims
} from "../schema/sqlite/sources.js";
import {
  metadataOrEmpty,
  toIsoTimestamp
} from "./repository-value-readers.js";

const mapSourceClaim = (row: typeof sourceClaims.$inferSelect): SourceClaim => ({
  id: row.id,
  sourceArtifactId: row.sourceArtifactId,
  ...(row.sourceChunkId === null ? {} : { sourceChunkId: row.sourceChunkId }),
  ...(row.executionRunId === null ? {} : { executionRunId: row.executionRunId }),
  claim: row.claim,
  mechanism: row.mechanism,
  krnImplication: row.krnImplication,
  doesNotProve: row.doesNotProve,
  sourceAuthority: row.sourceAuthority,
  supportType: row.supportType,
  consumer: row.consumer,
  ...(row.falsifier === null ? {} : { falsifier: row.falsifier }),
  ...(row.revisitWhen === null ? {} : { revisitWhen: row.revisitWhen }),
  status: row.status,
  metadata: metadataOrEmpty(row.metadata),
  createdAt: toIsoTimestamp(row.createdAt),
  updatedAt: toIsoTimestamp(row.updatedAt)
});

export class SqliteSourceClaimRepository {
  constructor(private readonly db: KrnSqliteDatabase) {}

  async getSourceClaimById(id: SourceClaim["id"]): Promise<SourceClaim | undefined> {
    const row = this.db.query.sourceClaims.findFirst({ where: eq(sourceClaims.id, id) }).sync();
    return row === undefined ? undefined : mapSourceClaim(row);
  }

  async getSourceClaimForProject(
    projectId: ProjectId,
    id: SourceClaim["id"]
  ): Promise<SourceClaim | undefined> {
    const row = this.db.select({ claim: sourceClaims })
      .from(sourceClaims)
      .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
      .where(and(eq(sourceClaims.id, id), eq(sourceArtifacts.projectId, projectId)))
      .get();
    return row === undefined ? undefined : mapSourceClaim(row.claim);
  }
}
