import {
  and,
  asc,
  eq,
  inArray,
  lte,
  sql
} from "drizzle-orm";

import type { KrnDatabase } from "../database.js";
import { workerJobs } from "../schema/index.js";
import {
  fromIsoTimestamp,
  requireReturnedRow
} from "./repository-value-readers.js";
import { mapWorkerJob } from "./worker-job-mappers.js";
import type {
  CleanupTestWorkerJobsInput,
  CleanupTestWorkerJobsResult,
  EnqueueWorkerJobInput,
  MarkWorkerJobRunningInput,
  WorkerJobRecord,
  WorkerJobRepository
} from "./worker-job-types.js";

const now = (): Date => new Date();

const workerJobPayloadJson = (
  payload: EnqueueWorkerJobInput["payload"]
): Record<string, unknown> => ({ ...payload });

export class DrizzleWorkerJobRepository implements WorkerJobRepository {
  constructor(private readonly db: KrnDatabase) {}

  async enqueueWorkerJob(input: EnqueueWorkerJobInput): Promise<WorkerJobRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(workerJobs)
        .values({
          jobType: input.jobType,
          payload: workerJobPayloadJson(input.payload),
          ...(input.runAfter === undefined
            ? {}
            : { runAfter: fromIsoTimestamp(input.runAfter) }),
          ...(input.maxAttempts === undefined ? {} : { maxAttempts: input.maxAttempts })
        })
        .returning(),
      "enqueueWorkerJob"
    );

    return mapWorkerJob(row);
  }

  async enqueue(input: EnqueueWorkerJobInput): Promise<WorkerJobRecord> {
    return this.enqueueWorkerJob(input);
  }

  async getWorkerJobById(id: string): Promise<WorkerJobRecord | undefined> {
    const row = await this.db.query.workerJobs.findFirst({
      where: eq(workerJobs.id, id)
    });

    return row === undefined ? undefined : mapWorkerJob(row);
  }

  async listQueuedWorkerJobs(limit: number): Promise<WorkerJobRecord[]> {
    const rows = await this.db.query.workerJobs.findMany({
      where: and(eq(workerJobs.status, "queued"), lte(workerJobs.runAfter, now())),
      orderBy: asc(workerJobs.runAfter),
      limit
    });

    return rows.map(mapWorkerJob);
  }

  async markWorkerJobRunning(
    id: string,
    input: MarkWorkerJobRunningInput = {}
  ): Promise<WorkerJobRecord> {
    const claimAt = input.lockedAt === undefined ? now() : fromIsoTimestamp(input.lockedAt);
    const row = requireReturnedRow(
      await this.db
        .update(workerJobs)
        .set({
          status: "running",
          lockedAt: claimAt,
          ...(input.lockedBy === undefined ? {} : { lockedBy: input.lockedBy }),
          updatedAt: now()
        })
        .where(
          and(
            eq(workerJobs.id, id),
            eq(workerJobs.status, "queued"),
            lte(workerJobs.runAfter, claimAt)
          )
        )
        .returning(),
      "markWorkerJobRunning"
    );

    return mapWorkerJob(row);
  }

  async markWorkerJobSucceeded(id: string): Promise<WorkerJobRecord> {
    const row = requireReturnedRow(
      await this.db
        .update(workerJobs)
        .set({
          status: "succeeded",
          lockedAt: null,
          lockedBy: null,
          lastError: null,
          updatedAt: now()
        })
        .where(eq(workerJobs.id, id))
        .returning(),
      "markWorkerJobSucceeded"
    );

    return mapWorkerJob(row);
  }

  async markWorkerJobFailed(id: string, error: string): Promise<WorkerJobRecord> {
    const row = requireReturnedRow(
      await this.db
        .update(workerJobs)
        .set({
          status: "failed",
          attempts: sql`${workerJobs.attempts} + 1`,
          lockedAt: null,
          lockedBy: null,
          lastError: error,
          updatedAt: now()
        })
        .where(eq(workerJobs.id, id))
        .returning(),
      "markWorkerJobFailed"
    );

    return mapWorkerJob(row);
  }

  async markWorkerJobSkipped(id: string, reason: string): Promise<WorkerJobRecord> {
    const row = requireReturnedRow(
      await this.db
        .update(workerJobs)
        .set({
          status: "skipped",
          lockedAt: null,
          lockedBy: null,
          lastError: reason,
          updatedAt: now()
        })
        .where(eq(workerJobs.id, id))
        .returning(),
      "markWorkerJobSkipped"
    );

    return mapWorkerJob(row);
  }

  async cleanupTestWorkerJobs(
    input: CleanupTestWorkerJobsInput
  ): Promise<CleanupTestWorkerJobsResult> {
    if (input.workerJobIds.length === 0) {
      return { deletedCount: 0 };
    }

    const deletedRows = await this.db
      .delete(workerJobs)
      .where(inArray(workerJobs.id, input.workerJobIds))
      .returning({ id: workerJobs.id });

    return {
      deletedCount: deletedRows.length
    };
  }
}
