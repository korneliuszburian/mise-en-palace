import {
  and,
  asc,
  eq,
  inArray,
  lte,
  sql
} from "drizzle-orm";
import {
  maintenanceQueueRecordKeyForJob
} from "@krn/core";

import type { KrnDatabase } from "../database.js";
import { maintenanceQueues } from "../schema/index.js";
import {
  fromIsoTimestamp,
  requireReturnedRow
} from "./repository-value-readers.js";
import { mapMaintenanceQueue } from "./maintenance-queue-mappers.js";
import type {
  CleanupTestMaintenanceQueuesInput,
  CleanupTestMaintenanceQueuesResult,
  ClaimMaintenanceQueueRecordInput,
  EnqueueMaintenanceQueueInput,
  MaintenanceQueueRecord,
  MaintenanceQueueRepository,
  RecordMaintenanceQueueRetryInput
} from "./maintenance-queue-types.js";

const now = (): Date => new Date();

const maintenanceQueuePayloadJson = (
  payload: EnqueueMaintenanceQueueInput["payload"]
): Record<string, unknown> => ({ ...payload });

export class DrizzleMaintenanceQueueRepository implements MaintenanceQueueRepository {
  constructor(private readonly db: KrnDatabase) {}

  async enqueueMaintenanceQueue(input: EnqueueMaintenanceQueueInput): Promise<MaintenanceQueueRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(maintenanceQueues)
        .values({
          jobType: input.jobType,
          queueKey: maintenanceQueueRecordKeyForJob(input),
          payload: maintenanceQueuePayloadJson(input.payload),
          ...(input.runAfter === undefined
            ? {}
            : { runAfter: fromIsoTimestamp(input.runAfter) }),
          ...(input.maxAttempts === undefined ? {} : { maxAttempts: input.maxAttempts })
        })
        .returning(),
      "enqueueMaintenanceQueue"
    );

    return mapMaintenanceQueue(row);
  }

  async listQueuedMaintenanceQueues(limit: number): Promise<MaintenanceQueueRecord[]> {
    const rows = await this.db.query.maintenanceQueues.findMany({
      where: and(eq(maintenanceQueues.status, "queued"), lte(maintenanceQueues.runAfter, now())),
      orderBy: asc(maintenanceQueues.runAfter),
      limit
    });

    return rows.map(mapMaintenanceQueue);
  }

  async claimMaintenanceQueueRecord(
    id: string,
    input: ClaimMaintenanceQueueRecordInput = {}
  ): Promise<MaintenanceQueueRecord> {
    const claimAt = input.lockedAt === undefined ? now() : fromIsoTimestamp(input.lockedAt);
    const row = requireReturnedRow(
      await this.db
        .update(maintenanceQueues)
        .set({
          status: "running",
          lockedAt: claimAt,
          ...(input.lockedBy === undefined ? {} : { lockedBy: input.lockedBy }),
          updatedAt: now()
        })
        .where(
          and(
            eq(maintenanceQueues.id, id),
            eq(maintenanceQueues.status, "queued"),
            lte(maintenanceQueues.runAfter, claimAt)
          )
        )
        .returning(),
      "claimMaintenanceQueueRecord"
    );

    return mapMaintenanceQueue(row);
  }

  async recordMaintenanceQueueSuccess(id: string): Promise<MaintenanceQueueRecord> {
    const row = requireReturnedRow(
      await this.db
        .update(maintenanceQueues)
        .set({
          status: "succeeded",
          lockedAt: null,
          lockedBy: null,
          lastError: null,
          updatedAt: now()
        })
        .where(and(eq(maintenanceQueues.id, id), eq(maintenanceQueues.status, "running")))
        .returning(),
      "recordMaintenanceQueueSuccess"
    );

    return mapMaintenanceQueue(row);
  }

  async recordMaintenanceQueueRetry(
    id: string,
    input: RecordMaintenanceQueueRetryInput
  ): Promise<MaintenanceQueueRecord> {
    const runAfter = input.runAfter === undefined ? now() : fromIsoTimestamp(input.runAfter);
    const row = requireReturnedRow(
      await this.db
        .update(maintenanceQueues)
        .set({
          status: "queued",
          attempts: sql`${maintenanceQueues.attempts} + 1`,
          lockedAt: null,
          lockedBy: null,
          lastError: input.error,
          runAfter,
          updatedAt: now()
        })
        .where(
          and(
            eq(maintenanceQueues.id, id),
            eq(maintenanceQueues.status, "running"),
            sql`${maintenanceQueues.attempts} + 1 < ${maintenanceQueues.maxAttempts}`
          )
        )
        .returning(),
      "recordMaintenanceQueueRetry"
    );

    return mapMaintenanceQueue(row);
  }

  async recordMaintenanceQueueDeadLetter(id: string, error: string): Promise<MaintenanceQueueRecord> {
    const row = requireReturnedRow(
      await this.db
        .update(maintenanceQueues)
        .set({
          status: "dead_letter",
          attempts: sql`${maintenanceQueues.attempts} + 1`,
          lockedAt: null,
          lockedBy: null,
          lastError: error,
          updatedAt: now()
        })
        .where(and(eq(maintenanceQueues.id, id), eq(maintenanceQueues.status, "running")))
        .returning(),
      "recordMaintenanceQueueDeadLetter"
    );

    return mapMaintenanceQueue(row);
  }

  async recordMaintenanceQueueSkip(id: string, reason: string): Promise<MaintenanceQueueRecord> {
    const row = requireReturnedRow(
      await this.db
        .update(maintenanceQueues)
        .set({
          status: "skipped",
          lockedAt: null,
          lockedBy: null,
          lastError: reason,
          updatedAt: now()
        })
        .where(and(eq(maintenanceQueues.id, id), eq(maintenanceQueues.status, "running")))
        .returning(),
      "recordMaintenanceQueueSkip"
    );

    return mapMaintenanceQueue(row);
  }

  async cleanupTestMaintenanceQueues(
    input: CleanupTestMaintenanceQueuesInput
  ): Promise<CleanupTestMaintenanceQueuesResult> {
    if (input.maintenanceQueueIds.length === 0) {
      return { deletedCount: 0 };
    }

    const deletedRows = await this.db
      .delete(maintenanceQueues)
      .where(inArray(maintenanceQueues.id, input.maintenanceQueueIds))
      .returning({ id: maintenanceQueues.id });

    return {
      deletedCount: deletedRows.length
    };
  }
}
