import { and, asc, desc, eq, sql } from "drizzle-orm";
import type {
  AntiMemoryCandidate,
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
  CreateAntiMemoryCandidateInput,
  CreateMemoryFeedbackEventInput,
  CreateMemoryCandidateInput,
  CreateMemoryRecordInput,
  InvalidateMemoryRecordInput,
  MemoryRepository,
  PromoteAntiMemoryCandidateInput,
  PromoteMemoryCandidateInput,
  RejectAntiMemoryCandidateInput,
  RejectMemoryCandidateInput,
  RecordMemoryApplicationInput,
  RecordMemoryApplicationOnceInput,
  RecordMemoryApplicationOnceResult,
  SupersedeMemoryRecordInput
} from "@krn/core/repositories/internal";

import type { KrnDatabase } from "../database.js";
import {
  antiMemoryRecords,
  antiMemoryCandidates,
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
} from "./repository-value-readers.js";
import {
  mapAntiMemoryRecord,
  mapAntiMemoryCandidate,
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

const antiMemoryRecordKeyForCandidate = (
  candidate: AntiMemoryCandidate,
  input: PromoteAntiMemoryCandidateInput
): string => input.recordKey ?? candidate.key;

export const memoryPromotionMetadata = (
  candidate: MemoryCandidate,
  input: PromoteMemoryCandidateInput
): Record<string, unknown> => ({
  ...candidate.metadata,
  ...(input.metadata ?? {}),
  createdFromCandidateId: candidate.id,
  sourceClaimIds: candidate.sourceClaimIds
});

export const antiMemoryPromotionMetadata = (
  candidate: AntiMemoryCandidate,
  input: PromoteAntiMemoryCandidateInput
): Record<string, unknown> => ({
  ...candidate.metadata,
  ...(input.metadata ?? {}),
  createdFromCandidateId: candidate.id,
  invalidatedBySourceClaimIds: candidate.invalidatedBySourceClaimIds
});

export const activeMemorySelectionOrder = () => [
  asc(memoryRecords.negativeFeedbackCount),
  desc(memoryRecords.positiveFeedbackCount),
  desc(memoryRecords.updatedAt)
];

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

interface AntiMemoryCandidateInvariantInput {
  key: string;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  invalidatedBySourceClaimIds?: readonly string[];
  sourceLineage: readonly { sourceId: string }[];
  validFrom?: string;
  validUntil?: string;
}

type MemoryRecordInsertRow = typeof memoryRecords.$inferInsert;
type MemoryRecordVersionInsertRow = typeof memoryRecordVersions.$inferInsert;
type AntiMemoryCandidateInsertRow = typeof antiMemoryCandidates.$inferInsert;

const hasText = (value: string | undefined): boolean =>
  value !== undefined && value.trim().length > 0;

const assertHasText = (
  value: string | undefined,
  message: string
): void => {
  if (!hasText(value)) {
    throw new Error(message);
  }
};

const assertConfidence = (
  confidence: number,
  subject: string
): void => {
  if (!Number.isInteger(confidence) || confidence < 0 || confidence > 100) {
    throw new Error(`${subject} confidence must be an integer from 0 to 100`);
  }
};

const sourceLineageIsPresent = (
  sourceLineage: readonly { sourceId: string }[]
): boolean => (
  sourceLineage.length > 0 &&
  sourceLineage.every((lineage) => hasText(lineage.sourceId))
);

const assertSourceLineage = (
  sourceLineage: readonly { sourceId: string }[],
  subject: string
): void => {
  if (!sourceLineageIsPresent(sourceLineage)) {
    throw new Error(`${subject} requires source lineage`);
  }
};

const timestampValue = (value: string | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? undefined : parsed;
};

const assertTemporalWindow = (
  validFrom: string | undefined,
  validUntil: string | undefined,
  subject: string
): void => {
  if (validUntil === undefined) {
    return;
  }

  if (!hasText(validFrom)) {
    throw new Error(`${subject} with validUntil requires validFrom`);
  }

  const validFromTime = timestampValue(validFrom);
  const validUntilTime = timestampValue(validUntil);

  if (validFromTime !== undefined && validUntilTime !== undefined && validUntilTime <= validFromTime) {
    throw new Error(`${subject} validUntil must be after validFrom`);
  }
};

const assertMemoryTemporalStrategy = (
  input: MemoryCoreInvariantInput,
  subject: string
): void => {
  if (input.validUntil === undefined) {
    return;
  }

  if (!hasText(input.validFrom)) {
    throw new Error(`${subject} with validUntil requires validFrom`);
  }

  if (!hasText(input.invalidationRule)) {
    throw new Error(`${subject} with validUntil requires invalidation rule`);
  }

  assertTemporalWindow(input.validFrom, input.validUntil, subject);
};

const invalidatingSourceClaimCount = (
  input: AntiMemoryCandidateInvariantInput
): number => input.invalidatedBySourceClaimIds?.filter(hasText).length ?? 0;

const hasAntiMemoryInvalidationEvidence = (
  input: AntiMemoryCandidateInvariantInput
): boolean => (
  invalidatingSourceClaimCount(input) > 0 ||
  sourceLineageIsPresent(input.sourceLineage)
);

export const assertMemoryCoreInvariants = (
  input: MemoryCoreInvariantInput,
  subject: string
): void => {
  assertHasText(input.summary, `${subject} requires summary`);
  assertHasText(input.body, `${subject} requires body`);
  assertHasText(input.owner, `${subject} requires owner`);
  assertConfidence(input.confidence, subject);
  assertHasText(input.applicationGuidance, `${subject} requires application guidance`);
  assertSourceLineage(input.sourceLineage, subject);
  assertMemoryTemporalStrategy(input, subject);
};

export const assertAntiMemoryCandidateInvariants = (
  input: AntiMemoryCandidateInvariantInput,
  subject: string
): void => {
  assertHasText(input.key, `${subject} requires key`);
  assertHasText(input.summary, `${subject} requires summary`);
  assertHasText(input.body, `${subject} requires body`);
  assertHasText(input.owner, `${subject} requires owner`);
  assertConfidence(input.confidence, subject);

  if (!hasAntiMemoryInvalidationEvidence(input)) {
    throw new Error(`${subject} requires invalidating source claim or source lineage`);
  }

  assertTemporalWindow(input.validFrom, input.validUntil, subject);
};

const ensurePromotableCandidate = (candidate: MemoryCandidate): void => {
  if (candidate.status !== "proposed" && candidate.status !== "candidate") {
    throw new Error(
      `Memory candidate ${candidate.id} cannot be promoted from ${candidate.status}`
    );
  }

  assertMemoryCoreInvariants(candidate, `Memory candidate ${candidate.id}`);
};

const ensurePromotableAntiMemoryCandidate = (candidate: AntiMemoryCandidate): void => {
  if (candidate.status !== "proposed" && candidate.status !== "candidate") {
    throw new Error(
      `Anti-memory candidate ${candidate.id} cannot be promoted from ${candidate.status}`
    );
  }

  assertAntiMemoryCandidateInvariants(candidate, `Anti-memory candidate ${candidate.id}`);
};

const memoryRecordInsertValues = (
  input: CreateMemoryRecordInput
): MemoryRecordInsertRow => {
  const row: MemoryRecordInsertRow = {
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
    metadata: input.metadata ?? {}
  };

  if (input.currentVersionId !== undefined) {
    row.currentVersionId = input.currentVersionId;
  }

  if (input.invalidationRule !== undefined) {
    row.invalidationRule = input.invalidationRule;
  }

  if (input.isUserPreference !== undefined) {
    row.isUserPreference = input.isUserPreference;
  }

  if (input.validFrom !== undefined) {
    row.validFrom = fromIsoTimestamp(input.validFrom);
  }

  if (input.validUntil !== undefined) {
    row.validUntil = fromIsoTimestamp(input.validUntil);
  }

  return row;
};

const initialMemoryRecordVersionInsertValues = (
  memoryRecordId: string,
  input: CreateMemoryRecordInput
): MemoryRecordVersionInsertRow => {
  const row: MemoryRecordVersionInsertRow = {
    memoryRecordId,
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
  };

  if (input.invalidationRule !== undefined) {
    row.invalidationRule = input.invalidationRule;
  }

  if (input.validFrom !== undefined) {
    row.validFrom = fromIsoTimestamp(input.validFrom);
  }

  if (input.validUntil !== undefined) {
    row.validUntil = fromIsoTimestamp(input.validUntil);
  }

  return row;
};

const applyAntiMemoryCandidateRunLinks = (
  row: AntiMemoryCandidateInsertRow,
  input: CreateAntiMemoryCandidateInput
): void => {
  if (input.executionRunId !== undefined) {
    row.executionRunId = input.executionRunId;
  }

  if (input.feedbackDeltaId !== undefined) {
    row.feedbackDeltaId = input.feedbackDeltaId;
  }
};

const applyAntiMemoryCandidateSourceContext = (
  row: AntiMemoryCandidateInsertRow,
  input: CreateAntiMemoryCandidateInput
): void => {
  if (input.rejectedClaim !== undefined) {
    row.rejectedClaim = input.rejectedClaim;
  }

  if (input.reason !== undefined) {
    row.reason = input.reason;
  }

};

const applyAntiMemoryCandidateScope = (
  row: AntiMemoryCandidateInsertRow,
  input: CreateAntiMemoryCandidateInput
): void => {
  if (input.appliesTo !== undefined) {
    row.appliesTo = input.appliesTo;
  }

  if (input.mayRevisitWhen !== undefined) {
    row.mayRevisitWhen = input.mayRevisitWhen;
  }
};

const applyAntiMemoryCandidateTemporalWindow = (
  row: AntiMemoryCandidateInsertRow,
  input: CreateAntiMemoryCandidateInput
): void => {
  if (input.validFrom !== undefined) {
    row.validFrom = fromIsoTimestamp(input.validFrom);
  }

  if (input.validUntil !== undefined) {
    row.validUntil = fromIsoTimestamp(input.validUntil);
  }
};

const antiMemoryCandidateInsertValues = (
  input: CreateAntiMemoryCandidateInput
): AntiMemoryCandidateInsertRow => {
  const row: AntiMemoryCandidateInsertRow = {
    projectId: input.projectId,
    proposedBy: input.proposedBy,
    key: input.key,
    status: input.status ?? "candidate",
    invalidatedBySourceClaimIds: input.invalidatedBySourceClaimIds ?? [],
    summary: input.summary,
    body: input.body,
    owner: input.owner,
    confidence: input.confidence,
    sourceLineage: input.sourceLineage,
    metadata: input.metadata ?? {}
  };

  applyAntiMemoryCandidateRunLinks(row, input);
  applyAntiMemoryCandidateSourceContext(row, input);
  applyAntiMemoryCandidateScope(row, input);
  applyAntiMemoryCandidateTemporalWindow(row, input);

  return row;
};

export class DrizzleMemoryRepository implements MemoryRepository {
  constructor(private readonly db: KrnDatabase) {}

  async createMemoryRecord(input: CreateMemoryRecordInput): Promise<MemoryRecord> {
    assertMemoryCoreInvariants(input, "Memory record");

    return this.db.transaction(async (tx) => {
      const row = requireReturnedRow(
        await tx
          .insert(memoryRecords)
          .values(memoryRecordInsertValues(input))
          .returning(),
        "createMemoryRecord"
      );

      const versionRow = requireReturnedRow(
        await tx
          .insert(memoryRecordVersions)
          .values(initialMemoryRecordVersionInsertValues(row.id, input))
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
      orderBy: activeMemorySelectionOrder(),
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

  async promoteReviewedMemoryCandidate(input: PromoteMemoryCandidateInput): Promise<MemoryRecord> {
    return this.promoteMemoryCandidate(input);
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

  async supersedeMemoryRecord(input: SupersedeMemoryRecordInput): Promise<MemoryRecord> {
    const reviewer = input.reviewer.trim();
    const reason = input.reason.trim();

    if (reviewer.length === 0) {
      throw new Error("supersedeMemoryRecord requires reviewer");
    }

    if (reason.length === 0) {
      throw new Error("supersedeMemoryRecord requires reason");
    }

    return this.db.transaction(async (tx) => {
      const currentRow = await tx.query.memoryRecords.findFirst({
        where: eq(memoryRecords.id, input.memoryRecordId)
      });
      const replacementRow = await tx.query.memoryRecords.findFirst({
        where: eq(memoryRecords.id, input.supersededByMemoryRecordId)
      });

      if (currentRow === undefined) {
        throw new Error(`MemoryRecord not found: ${input.memoryRecordId}`);
      }

      if (replacementRow === undefined) {
        throw new Error(`Superseding MemoryRecord not found: ${input.supersededByMemoryRecordId}`);
      }

      const supersededAt =
        input.supersededAt === undefined
          ? new Date()
          : fromIsoTimestamp(input.supersededAt);
      const row = requireReturnedRow(
        await tx
          .update(memoryRecords)
          .set({
            status: "superseded",
            invalidatedAt: supersededAt,
            invalidationReason: reason,
            metadata: {
              ...currentRow.metadata,
              ...(input.metadata ?? {}),
              supersessionReview: {
                reviewer,
                reason,
                supersededAt: supersededAt.toISOString(),
                supersededByMemoryRecordId: input.supersededByMemoryRecordId
              }
            },
            updatedAt: new Date()
          })
          .where(eq(memoryRecords.id, input.memoryRecordId))
          .returning(),
        "supersedeMemoryRecord"
      );

      await tx.insert(outboxEvents).values({
        topic: "memory.record.superseded",
        payload: {
          ...smokePayload(input.metadata),
          memoryRecordId: input.memoryRecordId,
          supersededByMemoryRecordId: input.supersededByMemoryRecordId,
          projectId: currentRow.projectId
        }
      });

      return mapMemoryRecord(row);
    });
  }

  private async insertMemoryApplication(
    input: RecordMemoryApplicationInput,
    tx: KrnDatabase
  ): Promise<MemoryApplication> {
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
  }

  async recordMemoryApplication(
    input: RecordMemoryApplicationInput
  ): Promise<MemoryApplication> {
    return this.db.transaction(async (tx) => this.insertMemoryApplication(input, tx));
  }

  async recordMemoryApplicationOnce(
    input: RecordMemoryApplicationOnceInput
  ): Promise<RecordMemoryApplicationOnceResult> {
    return this.db.transaction(async (tx) => {
      const binding = [
        input.memoryRecordId,
        input.executionRunId,
        input.packetChecksum
      ].join(":");

      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${binding}, 0))`
      );

      const [existing] = await tx
        .select()
        .from(memoryApplications)
        .where(and(
          eq(memoryApplications.memoryRecordId, input.memoryRecordId),
          eq(memoryApplications.executionRunId, input.executionRunId),
          sql`${memoryApplications.metadata} ->> 'decisionPacketChecksum' = ${input.packetChecksum}`
        ))
        .limit(1);

      if (existing !== undefined) {
        return {
          application: mapMemoryApplication(existing),
          created: false
        };
      }

      return {
        application: await this.insertMemoryApplication({
          ...input,
          metadata: {
            ...input.metadata,
            decisionPacketChecksum: input.packetChecksum
          }
        }, tx),
        created: true
      };
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

  async createAntiMemoryCandidate(
    input: CreateAntiMemoryCandidateInput
  ): Promise<AntiMemoryCandidate> {
    assertAntiMemoryCandidateInvariants(input, "Anti-memory candidate");

    return this.db.transaction(async (tx) => {
      const row = requireReturnedRow(
        await tx
          .insert(antiMemoryCandidates)
          .values(antiMemoryCandidateInsertValues(input))
          .returning(),
        "createAntiMemoryCandidate"
      );

      await tx.insert(outboxEvents).values({
        topic: "anti_memory.candidate.created",
        payload: {
          ...smokePayload(input.metadata),
          antiMemoryCandidateId: row.id,
          projectId: row.projectId
        }
      });

      return mapAntiMemoryCandidate(row);
    });
  }

  async getAntiMemoryCandidateById(id: string): Promise<AntiMemoryCandidate | undefined> {
    const row = await this.db.query.antiMemoryCandidates.findFirst({
      where: eq(antiMemoryCandidates.id, id)
    });

    return row === undefined ? undefined : mapAntiMemoryCandidate(row);
  }

  async promoteReviewedAntiMemoryCandidate(
    input: PromoteAntiMemoryCandidateInput
  ): Promise<AntiMemoryRecord> {
    return this.db.transaction(async (tx) => {
      const candidateRow = await tx.query.antiMemoryCandidates.findFirst({
        where: eq(antiMemoryCandidates.id, input.candidateId)
      });

      if (candidateRow === undefined) {
        throw new Error(`Anti-memory candidate ${input.candidateId} was not found`);
      }

      const candidate = mapAntiMemoryCandidate(candidateRow);
      ensurePromotableAntiMemoryCandidate(candidate);

      const now = new Date();
      const metadata = antiMemoryPromotionMetadata(candidate, input);
      const antiMemoryRow = requireReturnedRow(
        await tx
          .insert(antiMemoryRecords)
          .values({
            projectId: candidateRow.projectId,
            ...(candidateRow.executionRunId === null
              ? {}
              : { executionRunId: candidateRow.executionRunId }),
            createdFromCandidateId: candidateRow.id,
            key: antiMemoryRecordKeyForCandidate(candidate, input),
            ...(candidateRow.rejectedClaim === null
              ? {}
              : { rejectedClaim: candidateRow.rejectedClaim }),
            ...(candidateRow.reason === null ? {} : { reason: candidateRow.reason }),
            invalidatedBySourceClaimIds: candidateRow.invalidatedBySourceClaimIds,
            ...(candidateRow.appliesTo === null ? {} : { appliesTo: candidateRow.appliesTo }),
            ...(candidateRow.mayRevisitWhen === null
              ? {}
              : { mayRevisitWhen: candidateRow.mayRevisitWhen }),
            summary: candidateRow.summary,
            body: candidateRow.body,
            owner: candidateRow.owner,
            confidence: candidateRow.confidence,
            sourceLineage: candidateRow.sourceLineage,
            validFrom: candidateRow.validFrom,
            ...(candidateRow.validUntil === null
              ? {}
              : { validUntil: candidateRow.validUntil }),
            metadata
          })
          .returning(),
        "promoteReviewedAntiMemoryCandidate.insertAntiMemoryRecord"
      );

      await tx
        .update(antiMemoryCandidates)
        .set({
          status: input.decision,
          reviewer: input.reviewer,
          reviewedAt: now,
          metadata,
          updatedAt: now
        })
        .where(eq(antiMemoryCandidates.id, candidateRow.id));

      await tx.insert(outboxEvents).values({
        topic: "anti_memory.candidate.promoted",
        payload: {
          ...smokePayload(input.metadata),
          antiMemoryCandidateId: candidateRow.id,
          antiMemoryRecordId: antiMemoryRow.id,
          projectId: candidateRow.projectId
        }
      });

      return mapAntiMemoryRecord(antiMemoryRow);
    });
  }

  async rejectAntiMemoryCandidate(
    input: RejectAntiMemoryCandidateInput
  ): Promise<AntiMemoryCandidate> {
    const now = new Date();
    const row = requireReturnedRow(
      await this.db
        .update(antiMemoryCandidates)
        .set({
          status: "rejected",
          reviewer: input.reviewer,
          reviewedAt: now,
          rejectionReason: input.reason,
          metadata: input.metadata ?? {},
          updatedAt: now
        })
        .where(eq(antiMemoryCandidates.id, input.candidateId))
        .returning(),
      "rejectAntiMemoryCandidate"
    );

    return mapAntiMemoryCandidate(row);
  }

  async listAntiMemoryCandidates(
    projectId: ProjectId,
    limit: number
  ): Promise<AntiMemoryCandidate[]> {
    const rows = await this.db.query.antiMemoryCandidates.findMany({
      where: eq(antiMemoryCandidates.projectId, projectId),
      orderBy: asc(antiMemoryCandidates.createdAt),
      limit
    });

    return rows.map(mapAntiMemoryCandidate);
  }

  async createAntiMemoryRecord(input: CreateAntiMemoryRecordInput): Promise<AntiMemoryRecord> {
    assertAntiMemoryCandidateInvariants(input, "Anti-memory record");

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
