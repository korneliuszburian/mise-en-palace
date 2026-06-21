import { and, asc, eq } from "drizzle-orm";
import type {
  AntiMemoryRecord,
  MemoryCandidate,
  MemoryRecord,
  ProjectId
} from "@krn/core";
import type {
  CreateAntiMemoryRecordInput,
  CreateMemoryCandidateInput,
  CreateMemoryRecordInput,
  MemoryRepository
} from "@krn/harness";

import type { KrnDatabase } from "../database.js";
import {
  antiMemoryRecords,
  memoryCandidates,
  memoryRecordVersions,
  memoryRecords,
  outboxEvents
} from "../schema/index.js";
import { requireReturnedRow } from "./common.js";
import {
  mapAntiMemoryRecord,
  mapMemoryCandidate,
  mapMemoryRecord
} from "./mappers.js";

export class DrizzleMemoryRepository implements MemoryRepository {
  constructor(private readonly db: KrnDatabase) {}

  async createMemoryRecord(input: CreateMemoryRecordInput): Promise<MemoryRecord> {
    return this.db.transaction(async (tx) => {
      const row = requireReturnedRow(
        await tx
          .insert(memoryRecords)
          .values({
            projectId: input.projectId,
            key: input.key,
            kind: input.kind,
            status: input.status ?? "active",
            summary: input.summary,
            body: input.body,
            owner: input.owner,
            confidence: input.confidence,
            applicationGuidance: input.applicationGuidance,
            sourceLineage: input.sourceLineage,
            isUserPreference: input.isUserPreference,
            metadata: input.metadata ?? {}
          })
          .returning(),
        "createMemoryRecord"
      );

      await tx.insert(memoryRecordVersions).values({
        memoryRecordId: row.id,
        version: 1,
        summary: input.summary,
        body: input.body,
        owner: input.owner,
        confidence: input.confidence,
        applicationGuidance: input.applicationGuidance,
        sourceLineage: input.sourceLineage,
        metadata: {
          reason: "initial memory record version"
        }
      });

      return mapMemoryRecord(row);
    });
  }

  async getMemoryRecord(id: string): Promise<MemoryRecord | undefined> {
    const row = await this.db.query.memoryRecords.findFirst({
      where: eq(memoryRecords.id, id)
    });

    return row === undefined ? undefined : mapMemoryRecord(row);
  }

  async listActiveMemory(projectId: ProjectId, limit: number): Promise<MemoryRecord[]> {
    const rows = await this.db.query.memoryRecords.findMany({
      where: and(eq(memoryRecords.projectId, projectId), eq(memoryRecords.status, "active")),
      orderBy: asc(memoryRecords.updatedAt),
      limit
    });

    return rows.map(mapMemoryRecord);
  }

  async createMemoryCandidate(input: CreateMemoryCandidateInput): Promise<MemoryCandidate> {
    return this.db.transaction(async (tx) => {
      const row = requireReturnedRow(
        await tx
          .insert(memoryCandidates)
          .values({
            projectId: input.projectId,
            proposedBy: input.proposedBy,
            kind: input.kind,
            summary: input.summary,
            body: input.body,
            owner: input.owner,
            confidence: input.confidence,
            applicationGuidance: input.applicationGuidance,
            sourceLineage: input.sourceLineage,
            isUserPreference: input.isUserPreference,
            metadata: input.metadata ?? {}
          })
          .returning(),
        "createMemoryCandidate"
      );

      await tx.insert(outboxEvents).values({
        topic: "memory.candidate.created",
        payload: {
          memoryCandidateId: row.id,
          projectId: row.projectId
        }
      });

      return mapMemoryCandidate(row);
    });
  }

  async listMemoryCandidates(projectId: ProjectId, limit: number): Promise<MemoryCandidate[]> {
    const rows = await this.db.query.memoryCandidates.findMany({
      where: eq(memoryCandidates.projectId, projectId),
      orderBy: asc(memoryCandidates.createdAt),
      limit
    });

    return rows.map(mapMemoryCandidate);
  }

  async createAntiMemoryRecord(input: CreateAntiMemoryRecordInput): Promise<AntiMemoryRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(antiMemoryRecords)
        .values({
          projectId: input.projectId,
          key: input.key,
          summary: input.summary,
          body: input.body,
          owner: input.owner,
          confidence: input.confidence,
          sourceLineage: input.sourceLineage,
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createAntiMemoryRecord"
    );

    return mapAntiMemoryRecord(row);
  }
}
