import { describe, expect, it } from "vitest";

import type { KrnDatabase } from "../../database.js";
import { DrizzleMaintenanceQueueRepository } from "../drizzle-maintenance-queue-repository.js";

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

const sqlTextFragments = (
  value: unknown,
  seen: WeakSet<object> = new WeakSet()
): readonly string[] => {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => sqlTextFragments(item, seen));
  }

  if (!isRecord(value)) {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }
  seen.add(value);

  const name = value["name"];
  const queryChunks = value["queryChunks"];
  const strings = typeof name === "string" ? [name] : [];

  return [
    ...strings,
    ...(Array.isArray(queryChunks)
      ? queryChunks.flatMap((item) => sqlTextFragments(item, seen))
      : [])
  ];
};

const methodNames = [
  "enqueueMaintenanceQueue",
  "listQueuedMaintenanceQueues",
  "claimMaintenanceQueueRecord",
  "recordMaintenanceQueueSuccess",
  "recordMaintenanceQueueRetry",
  "recordMaintenanceQueueDeadLetter",
  "recordMaintenanceQueueSkip",
  "cleanupTestMaintenanceQueues"
] as const;

const maintenanceQueueRow = (
  status: "queued" | "running" | "succeeded" | "skipped" | "dead_letter"
) => {
  const timestamp = new Date("2026-07-07T00:00:00.000Z");

  return {
    id: "maintenance-queue-1",
    type: "compact_memory",
    jobType: "compact_memory",
    queueKey: "compact_memory:project-1:-",
    status,
    payload: {
      projectId: "project-1"
    },
    attempts: status === "queued" || status === "dead_letter" ? 1 : 0,
    maxAttempts: 3,
    availableAt: timestamp,
    runAfter: timestamp,
    lockedAt: status === "running" ? timestamp : null,
    lockedBy: status === "running" ? "maintenance-queue-claim-1" : null,
    lastError:
      status === "queued" || status === "dead_letter" || status === "skipped"
        ? "terminal reason"
        : null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

const createUpdateDb = (row: ReturnType<typeof maintenanceQueueRow>) => {
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

describe("DrizzleMaintenanceQueueRepository", () => {
  it("exposes maintenance queue repository methods separately from record execution", () => {
    for (const methodName of methodNames) {
      expect(typeof DrizzleMaintenanceQueueRepository.prototype[methodName]).toBe("function");
    }
  });

  it("guards record claim to queued jobs available at claim time", async () => {
    const claimAt = "2026-07-07T00:00:00.000Z";
    const rowTimestamp = new Date(claimAt);
    const { db, updateCall } = createUpdateDb(maintenanceQueueRow("running"));
    const repository = new DrizzleMaintenanceQueueRepository(db);

    await repository.claimMaintenanceQueueRecord("maintenance-queue-1", {
      lockedAt: claimAt,
      lockedBy: "maintenance-queue-claim-1"
    });

    expect(sqlParamValues(updateCall.whereCondition)).toEqual(
      expect.arrayContaining(["maintenance-queue-1", "queued", rowTimestamp])
    );
  });

  it("persists deterministic queue keys when enqueuing maintenance work", async () => {
    const row = maintenanceQueueRow("queued");
    const insertCall: { values?: unknown } = {};
    const db = {
      insert: (_table: unknown) => ({
        values: (value: unknown) => {
          insertCall.values = value;

          return {
            returning: async () => [{
              ...row,
              ...(value as Record<string, unknown>)
            }]
          };
        }
      })
    } as unknown as KrnDatabase;
    const repository = new DrizzleMaintenanceQueueRepository(db);

    const record = await repository.enqueueMaintenanceQueue({
      jobType: "review_feedback_delta",
      payload: {
        projectId: "project-1",
        feedbackDeltaId: "feedback-delta-1",
        reason: "turn stale feedback into anti-memory candidates"
      }
    });

    expect(insertCall.values).toEqual(expect.objectContaining({
      jobType: "review_feedback_delta",
      queueKey: "review_feedback_delta:project-1:feedback-delta-1"
    }));
    expect(record.queueKey).toBe("review_feedback_delta:project-1:feedback-delta-1");
  });

  it.each([
    {
      label: "succeeded",
      status: "succeeded",
      run: (repository: DrizzleMaintenanceQueueRepository) =>
        repository.recordMaintenanceQueueSuccess("maintenance-queue-1")
    },
    {
      label: "retry",
      status: "queued",
      run: (repository: DrizzleMaintenanceQueueRepository) =>
        repository.recordMaintenanceQueueRetry("maintenance-queue-1", {
          error: "terminal reason"
        })
    },
    {
      label: "dead letter",
      status: "dead_letter",
      run: (repository: DrizzleMaintenanceQueueRepository) =>
        repository.recordMaintenanceQueueDeadLetter(
          "maintenance-queue-1",
          "terminal reason"
        )
    },
    {
      label: "skipped",
      status: "skipped",
      run: (repository: DrizzleMaintenanceQueueRepository) =>
        repository.recordMaintenanceQueueSkip("maintenance-queue-1", "terminal reason")
    }
  ] as const)(
    "guards $label record settlement to already-claimed records",
    async ({ status, run }) => {
      const { db, updateCall } = createUpdateDb(maintenanceQueueRow(status));
      const repository = new DrizzleMaintenanceQueueRepository(db);

      await run(repository);

      expect(sqlParamValues(updateCall.whereCondition)).toEqual(
        expect.arrayContaining(["maintenance-queue-1", "running"])
      );
    }
  );

  it("guards retry to records with remaining attempts", async () => {
    const { db, updateCall } = createUpdateDb(maintenanceQueueRow("queued"));
    const repository = new DrizzleMaintenanceQueueRepository(db);

    await repository.recordMaintenanceQueueRetry("maintenance-queue-1", {
      error: "retryable reason",
      runAfter: "2026-07-07T00:05:00.000Z"
    });

    expect(sqlParamValues(updateCall.whereCondition)).toEqual(
      expect.arrayContaining(["maintenance-queue-1", "running"])
    );
    expect(sqlTextFragments(updateCall.whereCondition)).toEqual(
      expect.arrayContaining(["attempts", "max_attempts"])
    );
  });
});
