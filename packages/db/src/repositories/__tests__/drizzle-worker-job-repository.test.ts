import { describe, expect, it } from "vitest";

import type { KrnDatabase } from "../../database.js";
import { DrizzleWorkerJobRepository } from "../drizzle-worker-job-repository.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sqlParamValues = (
  value: unknown,
  seen: WeakSet<object> = new WeakSet()
): readonly unknown[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => sqlParamValues(item, seen));
  }

  if (!isRecord(value)) {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }
  seen.add(value);

  if ("encoder" in value && "value" in value) {
    return [value["value"]];
  }

  const queryChunks = value["queryChunks"];
  if (Array.isArray(queryChunks)) {
    return queryChunks.flatMap((item) => sqlParamValues(item, seen));
  }

  return [];
};

const methodNames = [
  "enqueueWorkerJob",
  "enqueue",
  "getWorkerJobById",
  "listQueuedWorkerJobs",
  "markWorkerJobRunning",
  "markWorkerJobSucceeded",
  "markWorkerJobFailed",
  "markWorkerJobSkipped",
  "cleanupTestWorkerJobs"
] as const;

describe("DrizzleWorkerJobRepository", () => {
  it("exposes M26 worker job repository methods without maintenance runtime behavior", () => {
    for (const methodName of methodNames) {
      expect(typeof DrizzleWorkerJobRepository.prototype[methodName]).toBe("function");
    }
  });

  it("guards running transition to queued jobs available at claim time", async () => {
    const claimAt = "2026-07-07T00:00:00.000Z";
    const rowTimestamp = new Date(claimAt);
    const workerJobRow = {
      id: "worker-job-1",
      type: "compact_memory",
      jobType: "compact_memory",
      status: "running" as const,
      payload: {
        projectId: "project-1"
      },
      attempts: 0,
      maxAttempts: 3,
      availableAt: rowTimestamp,
      runAfter: rowTimestamp,
      lockedAt: rowTimestamp,
      lockedBy: "worker-1",
      lastError: null,
      createdAt: rowTimestamp,
      updatedAt: rowTimestamp
    };
    let whereCondition: unknown;
    const db = {
      update: (_table: unknown) => ({
        set: (_value: unknown) => ({
          where: (condition: unknown) => {
            whereCondition = condition;

            return {
              returning: async () => [workerJobRow]
            };
          }
        })
      })
    } as unknown as KrnDatabase;
    const repository = new DrizzleWorkerJobRepository(db);

    await repository.markWorkerJobRunning("worker-job-1", {
      lockedAt: claimAt,
      lockedBy: "worker-1"
    });

    expect(sqlParamValues(whereCondition)).toEqual(
      expect.arrayContaining(["worker-job-1", "queued", rowTimestamp])
    );
  });
});
