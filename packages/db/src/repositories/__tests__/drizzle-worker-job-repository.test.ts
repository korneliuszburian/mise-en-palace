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

const workerJobRow = (
  status: "running" | "succeeded" | "failed" | "skipped"
) => {
  const timestamp = new Date("2026-07-07T00:00:00.000Z");

  return {
    id: "worker-job-1",
    type: "compact_memory",
    jobType: "compact_memory",
    status,
    payload: {
      projectId: "project-1"
    },
    attempts: status === "failed" ? 1 : 0,
    maxAttempts: 3,
    availableAt: timestamp,
    runAfter: timestamp,
    lockedAt: status === "running" ? timestamp : null,
    lockedBy: status === "running" ? "worker-1" : null,
    lastError: status === "failed" || status === "skipped" ? "terminal reason" : null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

const createUpdateDb = (row: ReturnType<typeof workerJobRow>) => {
  const updateCall: { whereCondition?: unknown } = {};
  const db = {
    update: (_table: unknown) => ({
      set: (_value: unknown) => ({
        where: (condition: unknown) => {
          updateCall.whereCondition = condition;

          return {
            returning: async () => [row]
          };
        }
      })
    })
  } as unknown as KrnDatabase;

  return { db, updateCall };
};

describe("DrizzleWorkerJobRepository", () => {
  it("exposes M26 worker job repository methods without maintenance runtime behavior", () => {
    for (const methodName of methodNames) {
      expect(typeof DrizzleWorkerJobRepository.prototype[methodName]).toBe("function");
    }
  });

  it("guards running transition to queued jobs available at claim time", async () => {
    const claimAt = "2026-07-07T00:00:00.000Z";
    const rowTimestamp = new Date(claimAt);
    const { db, updateCall } = createUpdateDb(workerJobRow("running"));
    const repository = new DrizzleWorkerJobRepository(db);

    await repository.markWorkerJobRunning("worker-job-1", {
      lockedAt: claimAt,
      lockedBy: "worker-1"
    });

    expect(sqlParamValues(updateCall.whereCondition)).toEqual(
      expect.arrayContaining(["worker-job-1", "queued", rowTimestamp])
    );
  });

  it.each([
    {
      label: "succeeded",
      status: "succeeded",
      run: (repository: DrizzleWorkerJobRepository) =>
        repository.markWorkerJobSucceeded("worker-job-1")
    },
    {
      label: "failed",
      status: "failed",
      run: (repository: DrizzleWorkerJobRepository) =>
        repository.markWorkerJobFailed("worker-job-1", "terminal reason")
    },
    {
      label: "skipped",
      status: "skipped",
      run: (repository: DrizzleWorkerJobRepository) =>
        repository.markWorkerJobSkipped("worker-job-1", "terminal reason")
    }
  ] as const)(
    "guards $label transition to already-running jobs",
    async ({ status, run }) => {
      const { db, updateCall } = createUpdateDb(workerJobRow(status));
      const repository = new DrizzleWorkerJobRepository(db);

      await run(repository);

      expect(sqlParamValues(updateCall.whereCondition)).toEqual(
        expect.arrayContaining(["worker-job-1", "running"])
      );
    }
  );
});
