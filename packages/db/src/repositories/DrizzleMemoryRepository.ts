import { and, asc, eq, sql } from "drizzle-orm";
import type {
  AntiMemoryRecord,
  ExecutionRunId,
  MemoryApplication,
  MemoryCandidate,
  MemoryFeedbackEvent,
  MemoryRecord,
  ProjectId
} from "@krn/core";
import type {
  CreateAntiMemoryRecordInput,
  CreateMemoryFeedbackEventInput,
  CreateMemoryCandidateInput,
  CreateMemoryRecordInput,
  InvalidateMemoryRecordInput,
  MemoryRepository,
  PromoteMemoryCandidateInput,
  RejectMemoryCandidateInput,
  RecordMemoryApplicationInput
} from "@krn/harness";

import type { KrnDatabase } from "../database.js";
import {
  antiMemoryRecords,
  memoryApplications,
  memoryCandidates,
  memoryFeedbackEvents,
  memoryRecordVersions,
  memoryRecords,
  outboxEvents
} from "../schema/index.js";
import {
  fromIsoTimestamp,
  requireReturnedRow
} from "./common.js";
import {
  mapAntiMemoryRecord,
  mapMemoryApplication,
  mapMemoryCandidate,
  mapMemoryFeedbackEvent,
  mapMemoryRecord
} from "./mappers.js";

const smokePayload = (
  metadata: Record<string, unknown> | undefined
): Record<string, string> => {
  const smokeId = metadata?.smokeId;

  return typeof smokeId === "string" ? { smokeId } : {};
};

const memoryRecordKeyForCandidate = (input: PromoteMemoryCandidateInput): string =>
  input.recordKey ?? `memory:${input.candidateId}`;

export const memoryPromotionMetadata = (
  candidate: MemoryCandidate,
  input: PromoteMemoryCandidateInput
): Record<string, unknown> => ({
  ...candidate.metadata,
  ...(input.metadata ?? {}),
  createdFromCandidateId: candidate.id,
  sourceClaimIds: candidate.sourceClaimIds
});

interface MemoryCoreInvariantInput {
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  applicationGuidance: string;
  invalidationRule?: string;
  sourceLineage: readonly { sourceId: string }[];
  validFrom?: string;
  validUntil?: string;
}

const hasText = (value: string | undefined): boolean =>
  value !== undefined && value.trim().length > 0;

const timestampValue = (value: string | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? undefined : parsed;
};

export const assertMemoryCoreInvariants = (
  input: MemoryCoreInvariantInput,
  subject: string
): void => {
  if (!hasText(input.summary)) {
    throw new Error(`${subject} requires summary`);
  }

  if (!hasText(input.body)) {
    throw new Error(`${subject} requires body`);
  }

  if (!hasText(input.owner)) {
    throw new Error(`${subject} requires owner`);
  }

  if (!Number.isInteger(input.confidence) || input.confidence < 0 || input.confidence > 100) {
    throw new Error(`${subject} confidence must be an integer from 0 to 100`);
  }

  if (!hasText(input.applicationGuidance)) {
    throw new Error(`${subject} requires application guidance`);
  }

  if (
    input.sourceLineage.length === 0 ||
    input.sourceLineage.some((lineage) => !hasText(lineage.sourceId))
  ) {
    throw new Error(`${subject} requires source lineage`);
  }

  if (input.validUntil !== undefined) {
    if (!hasText(input.validFrom)) {
      throw new Error(`${subject} with validUntil requires validFrom`);
    }

    if (!hasText(input.invalidationRule)) {
      throw new Error(`${subject} with validUntil requires invalidation rule`);
    }

    const validFrom = timestampValue(input.validFrom);
    const validUntil = timestampValue(input.validUntil);

    if (validFrom !== undefined && validUntil !== undefined && validUntil <= validFrom) {
      throw new Error(`${subject} validUntil must be after validFrom`);
    }
  }
};

const ensurePromotableCandidate = (candidate: MemoryCandidate): void => {
  if (candidate.status !== "proposed" && candidate.status !== "candidate") {
    throw new Error(
      `Memory candidate ${candidate.id} cannot be promoted from ${candidate.status}`
    );
  }

  assertMemoryCoreInvariants(candidate, `Memory candidate ${candidate.id}`);
};

export class DrizzleMemoryRepository implements MemoryRepository {
  constructor(private readonly db: KrnDatabase) {}

  async createMemoryRecord(input: CreateMemoryRecordInput): Promise<MemoryRecord> {
    assertMemoryCoreInvariants(input, "Memory record");

    return this.db.transaction(async (tx) => {
      const row = requireReturnedRow(
        await tx
          .insert(memoryRecords)
          .values({
            projectId: input.projectId,
            ...(input.currentVersionId === undefined
              ? {}
              : { currentVersionId: input.currentVersionId }),
            key: input.key,
            kind: input.kind,
            status: input.status ?? "active",
            summary: input.summary,
            body: input.body,
            owner: input.owner,
            confidence: input.confidence,
            applicationGuidance: input.applicationGuidance,
            ...(input.invalidationRule === undefined
              ? {}
              : { invalidationRule: input.invalidationRule }),
            sourceLineage: input.sourceLineage,
            isUserPreference: input.isUserPreference,
            ...(input.validFrom === undefined
              ? {}
              : { validFrom: fromIsoTimestamp(input.validFrom) }),
            ...(input.validUntil === undefined
              ? {}
              : { validUntil: fromIsoTimestamp(input.validUntil) }),
            metadata: input.metadata ?? {}
          })
          .returning(),
        "createMemoryRecord"
      );

      const versionRow = requireReturnedRow(
        await tx
          .insert(memoryRecordVersions)
          .values({
            memoryRecordId: row.id,
            version: 1,
            summary: input.summary,
            body: input.body,
            owner: input.owner,
            confidence: input.confidence,
            applicationGuidance: input.applicationGuidance,
            ...(input.invalidationRule === undefined
              ? {}
              : { invalidationRule: input.invalidationRule }),
            ...(input.validFrom === undefined
              ? {}
              : { validFrom: fromIsoTimestamp(input.validFrom) }),
            ...(input.validUntil === undefined
              ? {}
              : { validUntil: fromIsoTimestamp(input.validUntil) }),
            sourceLineage: input.sourceLineage,
            metadata: {
              reason: "initial memory record version"
            }
          })
          .returning(),
        "createMemoryRecordVersion"
      );
      const updatedRow = requireReturnedRow(
        await tx
          .update(memoryRecords)
          .set({
            currentVersionId: input.currentVersionId ?? versionRow.id,
            updatedAt: new Date()
          })
          .where(eq(memoryRecords.id, row.id))
          .returning(),
        "createMemoryRecord.updateCurrentVersion"
      );

      return mapMemoryRecord(updatedRow);
    });
  }

  async getMemoryRecord(id: string): Promise<MemoryRecord | undefined> {
    return this.getMemoryRecordById(id);
  }

  async getMemoryRecordById(id: string): Promise<MemoryRecord | undefined> {
    const row = await this.db.query.memoryRecords.findFirst({
      where: eq(memoryRecords.id, id)
    });

    return row === undefined ? undefined : mapMemoryRecord(row);
  }

  async listMemoryRecordsForProject(
    projectId: ProjectId,
    limit?: number
  ): Promise<MemoryRecord[]> {
    const rows = await this.db.query.memoryRecords.findMany({
      where: eq(memoryRecords.projectId, projectId),
      orderBy: asc(memoryRecords.updatedAt),
      ...(limit === undefined ? {} : { limit })
    });

    return rows.map(mapMemoryRecord);
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
    assertMemoryCoreInvariants(input, "Memory candidate");

    return this.db.transaction(async (tx) => {
      const row = requireReturnedRow(
        await tx
          .insert(memoryCandidates)
          .values({
            projectId: input.projectId,
            ...(input.executionRunId === undefined
              ? {}
              : { executionRunId: input.executionRunId }),
            ...(input.feedbackDeltaId === undefined
              ? {}
              : { feedbackDeltaId: input.feedbackDeltaId }),
            proposedBy: input.proposedBy,
            kind: input.kind,
            status: input.status ?? "proposed",
            summary: input.summary,
            body: input.body,
            owner: input.owner,
            confidence: input.confidence,
            applicationGuidance: input.applicationGuidance,
            ...(input.invalidationRule === undefined
              ? {}
              : { invalidationRule: input.invalidationRule }),
            sourceClaimIds: input.sourceClaimIds ?? [],
            sourceLineage: input.sourceLineage,
            isUserPreference: input.isUserPreference,
            ...(input.validFrom === undefined
              ? {}
              : { validFrom: fromIsoTimestamp(input.validFrom) }),
            ...(input.validUntil === undefined
              ? {}
              : { validUntil: fromIsoTimestamp(input.validUntil) }),
            metadata: input.metadata ?? {}
          })
          .returning(),
        "createMemoryCandidate"
      );

      await tx.insert(outboxEvents).values({
        topic: "memory.candidate.created",
        payload: {
          ...smokePayload(input.metadata),
          memoryCandidateId: row.id,
          projectId: row.projectId
        }
      });

      return mapMemoryCandidate(row);
    });
  }

  async getMemoryCandidateById(id: string): Promise<MemoryCandidate | undefined> {
    const row = await this.db.query.memoryCandidates.findFirst({
      where: eq(memoryCandidates.id, id)
    });

    return row === undefined ? undefined : mapMemoryCandidate(row);
  }

  async promoteMemoryCandidate(input: PromoteMemoryCandidateInput): Promise<MemoryRecord> {
    return this.db.transaction(async (tx) => {
      const candidateRow = await tx.query.memoryCandidates.findFirst({
        where: eq(memoryCandidates.id, input.candidateId)
      });

      if (candidateRow === undefined) {
        throw new Error(`Memory candidate ${input.candidateId} was not found`);
      }

      const candidate = mapMemoryCandidate(candidateRow);
      ensurePromotableCandidate(candidate);

      const now = new Date();
      const memoryRecordRow = requireReturnedRow(
        await tx
          .insert(memoryRecords)
          .values({
            projectId: candidateRow.projectId,
            key: memoryRecordKeyForCandidate(input),
            kind: candidateRow.kind,
            status: "active",
            summary: candidateRow.summary,
            body: candidateRow.body,
            owner: candidateRow.owner,
            confidence: candidateRow.confidence,
            applicationGuidance: candidateRow.applicationGuidance,
            ...(candidateRow.invalidationRule === null
              ? {}
              : { invalidationRule: candidateRow.invalidationRule }),
            sourceLineage: candidateRow.sourceLineage,
            isUserPreference: candidateRow.isUserPreference,
            validFrom: candidateRow.validFrom,
            ...(candidateRow.validUntil === null
              ? {}
              : { validUntil: candidateRow.validUntil }),
            metadata: {
              ...memoryPromotionMetadata(candidate, input)
            }
          })
          .returning(),
        "promoteMemoryCandidate.insertMemoryRecord"
      );
      const versionRow = requireReturnedRow(
        await tx
          .insert(memoryRecordVersions)
          .values({
            memoryRecordId: memoryRecordRow.id,
            createdFromCandidateId: candidateRow.id,
            version: 1,
            summary: candidateRow.summary,
            body: candidateRow.body,
            owner: candidateRow.owner,
            confidence: candidateRow.confidence,
            applicationGuidance: candidateRow.applicationGuidance,
            ...(candidateRow.invalidationRule === null
              ? {}
              : { invalidationRule: candidateRow.invalidationRule }),
            validFrom: candidateRow.validFrom,
            ...(candidateRow.validUntil === null
              ? {}
              : { validUntil: candidateRow.validUntil }),
            sourceLineage: candidateRow.sourceLineage,
            metadata: memoryPromotionMetadata(candidate, input)
          })
          .returning(),
        "promoteMemoryCandidate.insertMemoryRecordVersion"
      );
      const updatedRecordRow = requireReturnedRow(
        await tx
          .update(memoryRecords)
          .set({
            currentVersionId: versionRow.id,
            updatedAt: now
          })
          .where(eq(memoryRecords.id, memoryRecordRow.id))
          .returning(),
        "promoteMemoryCandidate.updateMemoryRecord"
      );
      await tx
        .update(memoryCandidates)
        .set({
          status: input.decision,
          reviewer: input.reviewer,
          reviewedAt: now,
          metadata: memoryPromotionMetadata(candidate, input),
          updatedAt: now
        })
        .where(eq(memoryCandidates.id, candidateRow.id));
      await tx.insert(outboxEvents).values({
        topic: "memory.candidate.promoted",
        payload: {
          ...smokePayload(input.metadata),
          memoryCandidateId: candidateRow.id,
          memoryRecordId: updatedRecordRow.id,
          memoryRecordVersionId: versionRow.id,
          projectId: candidateRow.projectId
        }
      });

      return mapMemoryRecord(updatedRecordRow);
    });
  }

  async rejectMemoryCandidate(input: RejectMemoryCandidateInput): Promise<MemoryCandidate> {
    const now = new Date();
    const row = requireReturnedRow(
      await this.db
        .update(memoryCandidates)
        .set({
          status: "rejected",
          reviewer: input.reviewer,
          reviewedAt: now,
          rejectionReason: input.reason,
          updatedAt: now
        })
        .where(eq(memoryCandidates.id, input.candidateId))
        .returning(),
      "rejectMemoryCandidate"
    );

    return mapMemoryCandidate(row);
  }

  async listMemoryCandidates(projectId: ProjectId, limit: number): Promise<MemoryCandidate[]> {
    const rows = await this.db.query.memoryCandidates.findMany({
      where: eq(memoryCandidates.projectId, projectId),
      orderBy: asc(memoryCandidates.createdAt),
      limit
    });

    return rows.map(mapMemoryCandidate);
  }

  async invalidateMemoryRecord(input: InvalidateMemoryRecordInput): Promise<MemoryRecord> {
    const reviewer = input.reviewer.trim();
    const reason = input.reason.trim();

    if (reviewer.length === 0) {
      throw new Error("invalidateMemoryRecord requires reviewer");
    }

    if (reason.length === 0) {
      throw new Error("invalidateMemoryRecord requires reason");
    }

    return this.db.transaction(async (tx) => {
      const currentRow = await tx.query.memoryRecords.findFirst({
        where: eq(memoryRecords.id, input.memoryRecordId)
      });

      if (currentRow === undefined) {
        throw new Error(`MemoryRecord not found: ${input.memoryRecordId}`);
      }

      const invalidatedAt =
        input.invalidatedAt === undefined
          ? new Date()
          : fromIsoTimestamp(input.invalidatedAt);
      const row = requireReturnedRow(
        await tx
          .update(memoryRecords)
          .set({
            status: "invalidated",
            invalidatedAt,
            invalidationReason: reason,
            metadata: {
              ...currentRow.metadata,
              ...(input.metadata ?? {}),
              invalidationReview: {
                reviewer,
                reason,
                invalidatedAt: invalidatedAt.toISOString()
              }
            },
            updatedAt: new Date()
          })
          .where(eq(memoryRecords.id, input.memoryRecordId))
          .returning(),
        "invalidateMemoryRecord"
      );

      return mapMemoryRecord(row);
    });
  }

  async recordMemoryApplication(
    input: RecordMemoryApplicationInput
  ): Promise<MemoryApplication> {
    return this.db.transaction(async (tx) => {
      const row = requireReturnedRow(
        await tx
          .insert(memoryApplications)
          .values({
            memoryRecordId: input.memoryRecordId,
            executionRunId: input.executionRunId,
            ...(input.taskContractId === undefined
              ? {}
              : { taskContractId: input.taskContractId }),
            ...(input.contextAssemblyId === undefined
              ? {}
              : { contextAssemblyId: input.contextAssemblyId }),
            expectedUse: input.expectedUse,
            outcome: input.outcome,
            notes: input.notes,
            metadata: input.metadata ?? {}
          })
          .returning(),
        "recordMemoryApplication"
      );

      if (input.outcome === "helped") {
        await tx
          .update(memoryRecords)
          .set({
            positiveFeedbackCount: sql`${memoryRecords.positiveFeedbackCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(memoryRecords.id, input.memoryRecordId));
      }

      if (input.outcome === "hurt" || input.outcome === "stale") {
        await tx
          .update(memoryRecords)
          .set({
            negativeFeedbackCount: sql`${memoryRecords.negativeFeedbackCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(memoryRecords.id, input.memoryRecordId));
      }

      return mapMemoryApplication(row);
    });
  }

  async createMemoryFeedbackEvent(
    input: CreateMemoryFeedbackEventInput
  ): Promise<MemoryFeedbackEvent> {
    const row = requireReturnedRow(
      await this.db
        .insert(memoryFeedbackEvents)
        .values({
          memoryRecordId: input.memoryRecordId,
          ...(input.executionRunId === undefined
            ? {}
            : { executionRunId: input.executionRunId }),
          ...(input.feedbackDeltaId === undefined
            ? {}
            : { feedbackDeltaId: input.feedbackDeltaId }),
          ...(input.eventType === undefined ? {} : { eventType: input.eventType }),
          direction: input.direction,
          note: input.note,
          ...(input.reason === undefined ? {} : { reason: input.reason }),
          ...(input.evidenceRef === undefined ? {} : { evidenceRef: input.evidenceRef }),
          metadata: input.metadata ?? {}
        })
        .returning(),
      "createMemoryFeedbackEvent"
    );

    return mapMemoryFeedbackEvent(row);
  }

  async createAntiMemoryRecord(input: CreateAntiMemoryRecordInput): Promise<AntiMemoryRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(antiMemoryRecords)
        .values({
          projectId: input.projectId,
          ...(input.executionRunId === undefined
            ? {}
            : { executionRunId: input.executionRunId }),
          key: input.key,
          ...(input.rejectedClaim === undefined
            ? {}
            : { rejectedClaim: input.rejectedClaim }),
          ...(input.reason === undefined ? {} : { reason: input.reason }),
          invalidatedBySourceClaimIds: input.invalidatedBySourceClaimIds ?? [],
          ...(input.invalidatedBySourceClaimId === undefined
            ? {}
            : { invalidatedBySourceClaimId: input.invalidatedBySourceClaimId }),
          ...(input.appliesTo === undefined ? {} : { appliesTo: input.appliesTo }),
          ...(input.mayRevisitWhen === undefined
            ? {}
            : { mayRevisitWhen: input.mayRevisitWhen }),
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

  async listAntiMemoryForProject(projectId: ProjectId, limit: number): Promise<AntiMemoryRecord[]> {
    const rows = await this.db.query.antiMemoryRecords.findMany({
      where: eq(antiMemoryRecords.projectId, projectId),
      orderBy: asc(antiMemoryRecords.createdAt),
      limit
    });

    return rows.map(mapAntiMemoryRecord);
  }

  async listAntiMemoryForRun(executionRunId: ExecutionRunId): Promise<AntiMemoryRecord[]> {
    const rows = await this.db.query.antiMemoryRecords.findMany({
      where: eq(antiMemoryRecords.executionRunId, executionRunId),
      orderBy: asc(antiMemoryRecords.createdAt)
    });

    return rows.map(mapAntiMemoryRecord);
  }
}
