import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lte,
  or,
  sql
} from "drizzle-orm";
import { createHash } from "node:crypto";
import type {
  MemoryCandidate,
  MemoryRecord,
  ProjectId
} from "@krn/core";
import {
  isDecisionPacketUsefulnessSubjectSelected,
  parseDecisionPacketContractReadback
} from "@krn/core";
import type {
  ActiveMemorySelectionOptions,
  CreateMemoryCandidateInput,
  MemoryRepository,
  PromoteMemoryCandidateInput
} from "@krn/core/repositories/internal";
import type {
  RecordMemoryFeedbackWithPacketBindingInput,
  RecordMemoryFeedbackWithPacketBindingResult
} from "@krn/core/repositories/internal";

import type {
  KrnSqliteConnection,
  KrnSqliteDatabase
} from "../sqlite-database.js";
import {
  outboxEvents
} from "../schema/sqlite/events.js";
import {
  decisionPacketIssuances,
  executionRuns,
  harnessPlans,
  operatorIntents,
  taskContracts
} from "../schema/sqlite/harness.js";
import {
  memoryCandidates,
  memoryFeedbackEvents,
  memoryRecords,
  memoryRecordVersions
} from "../schema/sqlite/memory.js";
import {
  assertMemoryCoreInvariants,
  ensurePromotableMemoryCandidate,
  memorySelectionDate,
  normalizedMemorySelectionTerms,
  memoryPromotionMetadata,
  packetFeedbackIdempotencyKey,
  requirePacketFeedbackNote
} from "./memory-repository-policy.js";
import {
  mapMemoryCandidate,
  mapMemoryRecord
} from "./memory-mappers.js";

export type SqliteMemoryLifecycleRepositoryPort = Pick<
  MemoryRepository,
  | "createMemoryCandidate"
  | "getMemoryCandidateById"
  | "promoteReviewedMemoryCandidate"
  | "listActiveMemory"
  | "recordMemoryFeedbackWithPacketBinding"
>;

const requireRow = <T>(rows: readonly T[], operation: string): T => {
  const row = rows[0];
  if (row === undefined) {
    throw new Error(`${operation} did not return a row`);
  }
  return row;
};

const smokePayload = (metadata: Record<string, unknown> | undefined): Record<string, string> =>
  typeof metadata?.smokeId === "string" ? { smokeId: metadata.smokeId } : {};

const packetSha256Hex = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

export class SqliteMemoryLifecycleRepository implements SqliteMemoryLifecycleRepositoryPort {
  constructor(
    private readonly db: KrnSqliteDatabase,
    private readonly connection?: KrnSqliteConnection
  ) {}

  async createMemoryCandidate(input: CreateMemoryCandidateInput): Promise<MemoryCandidate> {
    assertMemoryCoreInvariants(input, "Memory candidate");
    const task = this.connection?.client.transaction(() => {
      const row = requireRow(this.db.insert(memoryCandidates).values({
        projectId: input.projectId,
        ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
        ...(input.feedbackDeltaId === undefined ? {} : { feedbackDeltaId: input.feedbackDeltaId }),
        proposedBy: input.proposedBy,
        kind: input.kind,
        status: input.status ?? "proposed",
        summary: input.summary,
        body: input.body,
        owner: input.owner,
        confidence: input.confidence,
        applicationGuidance: input.applicationGuidance,
        ...(input.invalidationRule === undefined ? {} : { invalidationRule: input.invalidationRule }),
        sourceClaimIds: input.sourceClaimIds ?? [],
        sourceLineage: input.sourceLineage,
        isUserPreference: input.isUserPreference,
        ...(input.validFrom === undefined ? {} : { validFrom: new Date(input.validFrom) }),
        ...(input.validUntil === undefined ? {} : { validUntil: new Date(input.validUntil) }),
        metadata: input.metadata ?? {}
      }).returning().all(), "createMemoryCandidate");
      this.db.insert(outboxEvents).values({
        topic: "memory.candidate.created",
        payload: {
          ...smokePayload(input.metadata),
          memoryCandidateId: row.id,
          projectId: row.projectId
        }
      }).run();
      return row;
    });

    if (task === undefined) {
      throw new Error("SQLite memory writes require an owned store connection");
    }
    return mapMemoryCandidate(task.immediate());
  }

  async getMemoryCandidateById(id: string): Promise<MemoryCandidate | undefined> {
    const row = this.db.query.memoryCandidates.findFirst({
      where: eq(memoryCandidates.id, id)
    }).sync();
    return row === undefined ? undefined : mapMemoryCandidate(row);
  }

  // fallow-ignore-next-line complexity -- packet-bound feedback keeps project, issuance, selector, idempotency, event, counter, and outbox checks atomic
  async recordMemoryFeedbackWithPacketBinding(
    input: RecordMemoryFeedbackWithPacketBindingInput
  ): Promise<RecordMemoryFeedbackWithPacketBindingResult> {
    const note = requirePacketFeedbackNote(input);
    const idempotencyKey = packetFeedbackIdempotencyKey(input);
    // fallow-ignore-next-line complexity -- one transaction keeps binding, idempotency, event, counter, and outbox checks atomic
    const task = this.connection?.client.transaction(() => {
      const record = this.db.select({
        projectId: memoryRecords.projectId,
        status: memoryRecords.status
      }).from(memoryRecords).where(eq(memoryRecords.id, input.memoryRecordId)).get();
      if (record === undefined) throw new Error(`MemoryRecord not found: ${input.memoryRecordId}`);
      if (record.status !== "active") throw new Error(`MemoryRecord is not active: ${input.memoryRecordId}`);

      const run = this.db.select({
        projectId: taskContracts.projectId,
        taskId: taskContracts.id
      }).from(executionRuns)
        .innerJoin(harnessPlans, eq(executionRuns.harnessPlanId, harnessPlans.id))
        .innerJoin(taskContracts, eq(harnessPlans.taskContractId, taskContracts.id))
        .innerJoin(operatorIntents, eq(taskContracts.operatorIntentId, operatorIntents.id))
        .where(eq(executionRuns.id, input.runId)).get();
      if (run === undefined) throw new Error(`Execution run not found: ${input.runId}`);
      if (run.projectId !== record.projectId) throw new Error("Execution run does not belong to the connected project");

      const issuance = this.db.select({
        packetChecksum: decisionPacketIssuances.packetChecksum,
        packetGeneratedAt: decisionPacketIssuances.packetGeneratedAt,
        sourceRunLifecycleRevision: decisionPacketIssuances.sourceRunLifecycleRevision,
        readback: decisionPacketIssuances.readback
      }).from(decisionPacketIssuances)
        .where(eq(decisionPacketIssuances.executionRunId, input.runId)).get();
      if (issuance === undefined) throw new Error("Issued DecisionPacket is required");
      if (issuance.packetChecksum !== input.packetChecksum) throw new Error("DecisionPacket checksum mismatch");
      let parsedReadback: unknown = issuance.readback;
      if (typeof issuance.readback === "string") {
        const parsedJson: unknown = JSON.parse(issuance.readback);
        parsedReadback = parsedJson;
      }
      const readback = parseDecisionPacketContractReadback({
        value: parsedReadback,
        expectedRunId: input.runId,
        sha256Hex: packetSha256Hex
      });
      if (readback === undefined || readback.packetIdentity.checksum !== input.packetChecksum) {
        throw new Error("DecisionPacket issuance is corrupt or has an invalid checksum");
      }
      if (readback.packet.task.id !== run.taskId || readback.request.taskId !== run.taskId) {
        throw new Error("DecisionPacket task identity does not match the execution run");
      }
      if (
        issuance.packetGeneratedAt.getTime() !== Date.parse(readback.packetIdentity.generatedAt) ||
        issuance.sourceRunLifecycleRevision !== readback.packetIdentity.sourceRunLifecycleRevision ||
        readback.request.projectId !== run.projectId ||
        readback.packet.task.projectId !== run.projectId
      ) {
        throw new Error("DecisionPacket issuance identity does not match the execution run");
      }
      if (!isDecisionPacketUsefulnessSubjectSelected(readback.packet, {
        kind: "memory_record",
        id: input.memoryRecordId
      })) {
        throw new Error("DecisionPacket did not select this memory record");
      }

      const existing = this.db.select({ id: memoryFeedbackEvents.id })
        .from(memoryFeedbackEvents)
        .where(eq(memoryFeedbackEvents.idempotencyKey, idempotencyKey))
        .get();
      if (existing !== undefined) return { feedbackEventId: existing.id, idempotentReplay: true };

      const eventType = input.outcome === "helped"
        ? "strengthened"
        : input.outcome === "hurt" ? "demoted" : "stale_detected";
      const event = requireRow(this.db.insert(memoryFeedbackEvents).values({
        memoryRecordId: input.memoryRecordId,
        executionRunId: input.runId,
        runId: input.runId,
        packetChecksum: input.packetChecksum,
        outcome: input.outcome,
        idempotencyKey,
        eventType,
        direction: input.outcome === "helped" ? "positive" : "negative",
        note: note ?? "Packet-bound MCP feedback: helped",
        metadata: {
          feedbackContext: {
            provenance: "mcp_packet_bound",
            runId: input.runId,
            packetChecksum: input.packetChecksum,
            packetGeneratedAt: readback.packetIdentity.generatedAt,
            sourceRunLifecycleRevision: issuance.sourceRunLifecycleRevision
          }
        }
      }).returning().all(), "recordMemoryFeedbackWithPacketBinding");
      this.db.update(memoryRecords).set(
        input.outcome === "helped"
          ? { positiveFeedbackCount: sql`${memoryRecords.positiveFeedbackCount} + 1`, updatedAt: new Date() }
          : { negativeFeedbackCount: sql`${memoryRecords.negativeFeedbackCount} + 1`, updatedAt: new Date() }
      ).where(eq(memoryRecords.id, input.memoryRecordId)).run();
      this.db.insert(outboxEvents).values({
        topic: "memory.feedback.created",
        payload: {
          memoryFeedbackEventId: event.id,
          memoryRecordId: input.memoryRecordId,
          executionRunId: input.runId,
          packetChecksum: input.packetChecksum
        }
      }).run();
      return { feedbackEventId: event.id, idempotentReplay: false };
    });
    if (task === undefined) throw new Error("SQLite memory writes require an owned store connection");
    return task.immediate();
  }

  async promoteReviewedMemoryCandidate(input: PromoteMemoryCandidateInput): Promise<MemoryRecord> {
    // fallow-ignore-next-line complexity -- one immediate transaction owns duplicate-feedback rejection, candidate transition, record/version creation, and outbox publication
    const task = this.connection?.client.transaction(() => {
      const candidateRow = this.db.query.memoryCandidates.findFirst({
        where: eq(memoryCandidates.id, input.candidateId)
      }).sync();
      if (candidateRow === undefined) {
        throw new Error(`Memory candidate ${input.candidateId} was not found`);
      }

      const candidate = mapMemoryCandidate(candidateRow);
      if (candidate.feedbackDeltaId !== undefined) {
        const existing = this.db
          .select({ candidateId: memoryCandidates.id })
          .from(memoryCandidates)
          .innerJoin(
            memoryRecordVersions,
            eq(memoryRecordVersions.createdFromCandidateId, memoryCandidates.id)
          )
          .innerJoin(
            memoryRecords,
            and(
              eq(memoryRecords.currentVersionId, memoryRecordVersions.id),
              eq(memoryRecords.status, "active")
            )
          )
          .where(and(
            eq(memoryCandidates.projectId, candidate.projectId),
            eq(memoryCandidates.feedbackDeltaId, candidate.feedbackDeltaId),
            sql`${memoryCandidates.id} <> ${candidate.id}`
          ))
          .limit(1)
          .all();
        if (existing.length > 0) {
          throw new Error(
            `Memory feedback ${candidate.feedbackDeltaId} already has active memory; use the reviewed authority upgrade path`
          );
        }
      }
      ensurePromotableMemoryCandidate(candidate);
      const now = new Date();
      requireRow(this.db.update(memoryCandidates).set({
        status: input.decision,
        reviewer: input.reviewer,
        reviewedAt: now,
        metadata: memoryPromotionMetadata(candidate, input),
        updatedAt: now
      }).where(and(
        eq(memoryCandidates.id, candidateRow.id),
        inArray(memoryCandidates.status, ["proposed", "candidate"])
      )).returning().all(), "promoteMemoryCandidate");
      const promotionMetadata = memoryPromotionMetadata(candidate, input);
      const record = requireRow(this.db.insert(memoryRecords).values({
        projectId: candidateRow.projectId,
        key: input.recordKey ?? `memory:${candidateRow.id}`,
        kind: candidateRow.kind,
        status: "active",
        summary: candidateRow.summary,
        body: candidateRow.body,
        owner: candidateRow.owner,
        confidence: candidateRow.confidence,
        applicationGuidance: candidateRow.applicationGuidance,
        ...(candidateRow.invalidationRule === null ? {} : { invalidationRule: candidateRow.invalidationRule }),
        sourceLineage: candidateRow.sourceLineage,
        isUserPreference: candidateRow.isUserPreference,
        validFrom: candidateRow.validFrom,
        ...(candidateRow.validUntil === null ? {} : { validUntil: candidateRow.validUntil }),
        metadata: promotionMetadata
      }).returning().all(), "promoteMemoryCandidate.insertMemoryRecord");
      const version = requireRow(this.db.insert(memoryRecordVersions).values({
        memoryRecordId: record.id,
        createdFromCandidateId: candidateRow.id,
        version: 1,
        summary: candidateRow.summary,
        body: candidateRow.body,
        owner: candidateRow.owner,
        confidence: candidateRow.confidence,
        applicationGuidance: candidateRow.applicationGuidance,
        ...(candidateRow.invalidationRule === null ? {} : { invalidationRule: candidateRow.invalidationRule }),
        validFrom: candidateRow.validFrom,
        ...(candidateRow.validUntil === null ? {} : { validUntil: candidateRow.validUntil }),
        sourceLineage: candidateRow.sourceLineage,
        metadata: promotionMetadata
      }).returning().all(), "promoteMemoryCandidate.insertMemoryRecordVersion");
      const updated = requireRow(this.db.update(memoryRecords).set({
        currentVersionId: version.id,
        updatedAt: now
      }).where(eq(memoryRecords.id, record.id)).returning().all(), "promoteMemoryCandidate.updateMemoryRecord");
      this.db.insert(outboxEvents).values({
        topic: "memory.candidate.promoted",
        payload: {
          ...smokePayload(input.metadata),
          memoryCandidateId: candidateRow.id,
          memoryRecordId: updated.id,
          memoryRecordVersionId: version.id,
          projectId: candidateRow.projectId
        }
      }).run();
      return updated;
    });
    if (task === undefined) {
      throw new Error("SQLite memory writes require an owned store connection");
    }
    return mapMemoryRecord(task.immediate());
  }

  async listActiveMemory(
    projectId: ProjectId,
    limit: number,
    options?: ActiveMemorySelectionOptions
  ): Promise<MemoryRecord[]> {
    const now = memorySelectionDate(options?.now);
    if (now === undefined) {
      return [];
    }
    const terms = normalizedMemorySelectionTerms(options?.terms);
    const searchableText = sql`lower(
      coalesce(${memoryRecords.key}, '') || ' ' ||
      coalesce(${memoryRecords.summary}, '') || ' ' ||
      coalesce(${memoryRecords.body}, '') || ' ' ||
      coalesce(${memoryRecords.owner}, '') || ' ' ||
      coalesce(${memoryRecords.applicationGuidance}, '') || ' ' ||
      coalesce(${memoryRecords.invalidationRule}, '')
    )`;
    const relevanceFilter = terms.length === 0
      ? undefined
      : or(...terms.map((term) => sql`instr(${searchableText}, ${term}) > 0`));
    const relevanceScore = terms.length === 0
      ? undefined
      : sql<number>`(${sql.join(
          terms.map((term) => sql`CASE WHEN instr(${searchableText}, ${term}) > 0 THEN 1 ELSE 0 END`),
          sql` + `
        )})`;
    const rows = this.db.query.memoryRecords.findMany({
      where: and(
        eq(memoryRecords.projectId, projectId),
        eq(memoryRecords.status, "active"),
        lte(memoryRecords.validFrom, now),
        or(isNull(memoryRecords.validUntil), gt(memoryRecords.validUntil, now)),
        or(isNull(memoryRecords.invalidatedAt), gt(memoryRecords.invalidatedAt, now)),
        relevanceFilter
      ),
      orderBy: [
        ...(relevanceScore === undefined ? [] : [desc(relevanceScore)]),
        asc(memoryRecords.negativeFeedbackCount),
        desc(memoryRecords.positiveFeedbackCount),
        desc(memoryRecords.updatedAt),
        asc(memoryRecords.id)
      ],
      limit
    }).sync();
    return rows.map(mapMemoryRecord);
  }
}
