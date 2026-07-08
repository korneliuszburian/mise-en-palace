import { describe, expect, it } from "vitest";

import { mapMaintenanceQueue } from "../maintenance-queue-mappers.js";

const createdAt = new Date("2026-06-22T09:00:00.000Z");
const updatedAt = new Date("2026-06-22T09:05:00.000Z");
const runAfter = new Date("2026-06-22T09:10:00.000Z");

describe("maintenance queue mappers", () => {
  it("maps maintenance queue rows to the M26 jobType/runAfter contract", () => {
    expect(
      mapMaintenanceQueue({
        id: "maintenance-queue-1",
        jobType: "embed_memory_record",
        queueKey: "embed_memory_record:memory-1:text-embedding-3-small",
        status: "queued",
        payload: {
          memoryRecordId: "memory-1",
          reason: "refresh stale memory embedding",
          embeddingModelId: "text-embedding-3-small"
        },
        attempts: 0,
        maxAttempts: 3,
        runAfter,
        lockedAt: null,
        lockedBy: null,
        lastError: null,
        createdAt,
        updatedAt
      })
    ).toEqual({
      id: "maintenance-queue-1",
      jobType: "embed_memory_record",
      queueKey: "embed_memory_record:memory-1:text-embedding-3-small",
      status: "queued",
      payload: {
        memoryRecordId: "memory-1",
        reason: "refresh stale memory embedding",
        embeddingModelId: "text-embedding-3-small"
      },
      attempts: 0,
      maxAttempts: 3,
      runAfter: "2026-06-22T09:10:00.000Z",
      createdAt: "2026-06-22T09:00:00.000Z",
      updatedAt: "2026-06-22T09:05:00.000Z"
    });
  });
});
