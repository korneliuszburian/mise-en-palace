import {
  and,
  eq
} from "drizzle-orm";
import type {
  ProjectId,
  SourceClaim
} from "@krn/core";
import type {
  SourceRepository
} from "@krn/core/repositories/internal";

import type {
  KrnSqliteDatabase
} from "../sqlite-database.js";
import {
  sourceArtifacts,
  sourceClaims
} from "../schema/sqlite/sources.js";
import {
  mapSourceClaim
} from "./mappers.js";

export type SqliteSourceClaimRepositoryPort = Pick<
  SourceRepository,
  "getSourceClaimById" | "getSourceClaimForProject" | "listClaimsForProject"
>;

export class SqliteSourceClaimRepository implements SqliteSourceClaimRepositoryPort {
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

  async listClaimsForProject(
    projectId: ProjectId,
    limit: number
  ): Promise<SourceClaim[]> {
    return this.db.select({ claim: sourceClaims })
      .from(sourceClaims)
      .innerJoin(sourceArtifacts, eq(sourceClaims.sourceArtifactId, sourceArtifacts.id))
      .where(eq(sourceArtifacts.projectId, projectId))
      .limit(limit)
      .all()
      .map(({ claim }) => mapSourceClaim(claim));
  }
}
