import { describe, expect, it } from "vitest";

import { mapWorkerJob } from "./workerJobMappers.js";

const createdAt = new Date("2026-06-22T09:00:00.000Z");
const updatedAt = new Date("2026-06-22T09:05:00.000Z");
const runAfter = new Date("2026-06-22T09:10:00.000Z");

describe("worker job mappers", () => {
  it("maps worker job rows to the M26 jobType/runAfter contract", () => {
    expect(
      mapWorkerJob({
        id: "worker-job-1",
        jobType: "embed_memory_record",
        status: "queued",
        payload: {
          memoryRecordId: "memory-1",
          reason: "refresh stale memory embedding"
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
      id: "worker-job-1",
      jobType: "embed_memory_record",
      status: "queued",
      payload: {
        memoryRecordId: "memory-1",
        reason: "refresh stale memory embedding"
      },
      attempts: 0,
      maxAttempts: 3,
      runAfter: "2026-06-22T09:10:00.000Z",
      createdAt: "2026-06-22T09:00:00.000Z",
      updatedAt: "2026-06-22T09:05:00.000Z"
    });
  });

  it("rejects legacy DB-only statuses from the target worker lifecycle", () => {
    expect(() =>
      mapWorkerJob({
        id: "worker-job-legacy",
        jobType: "compact_memory",
        status: "dead_letter",
        payload: {},
        attempts: 2,
        maxAttempts: 3,
        runAfter,
        lockedAt: null,
        lockedBy: null,
        lastError: "legacy state",
        createdAt,
        updatedAt
      })
    ).toThrow("Unsupported worker job status: dead_letter");
  });
});
