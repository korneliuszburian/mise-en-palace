import { describe, expect, it } from "vitest";

import {
  runMaintenanceQueueRecord
} from "../maintenance-queue-executor.js";
import type {
  CleanupTestMaintenanceQueuesInput,
  CleanupTestMaintenanceQueuesResult,
  ClaimMaintenanceQueueRecordInput,
  EnqueueMaintenanceQueueInput,
  MaintenanceQueueRecord,
  MaintenanceQueueRepository,
  RecordMaintenanceQueueRetryInput
} from "../maintenance-queue-types.js";

const isoNow = "2026-07-08T10:00:00.000Z";
const retryAt = "2026-07-08T10:05:00.000Z";

const runningRecord = (
  input: Pick<MaintenanceQueueRecord, "jobType" | "payload"> &
    Partial<Pick<MaintenanceQueueRecord, "attempts" | "maxAttempts">>
): MaintenanceQueueRecord => ({
  id: "maintenance-queue-1",
  jobType: input.jobType,
  status: "running",
  payload: input.payload,
  attempts: input.attempts ?? 0,
  maxAttempts: input.maxAttempts ?? 3,
  runAfter: isoNow,
  lockedAt: isoNow,
  lockedBy: "maintenance-test",
  createdAt: isoNow,
  updatedAt: isoNow
});

const unlockedRecord = (
  record: MaintenanceQueueRecord,
  status: MaintenanceQueueRecord["status"],
  lastError?: string
): MaintenanceQueueRecord => {
  const {
    lockedAt: _lockedAt,
    lockedBy: _lockedBy,
    ...rest
  } = record;

  return {
    ...rest,
    status,
    ...(lastError === undefined ? {} : { lastError })
  };
};

class FakeMaintenanceQueueRepository implements MaintenanceQueueRepository {
  readonly calls: string[] = [];

  constructor(private readonly claimedRecord: MaintenanceQueueRecord) {}

  async enqueueMaintenanceQueue(
    _input: EnqueueMaintenanceQueueInput
  ): Promise<MaintenanceQueueRecord> {
    throw new Error("enqueueMaintenanceQueue is not used by executor tests");
  }

  async listQueuedMaintenanceQueues(_limit: number): Promise<MaintenanceQueueRecord[]> {
    throw new Error("listQueuedMaintenanceQueues is not used by executor tests");
  }

  async claimMaintenanceQueueRecord(
    id: string,
    _input?: ClaimMaintenanceQueueRecordInput
  ): Promise<MaintenanceQueueRecord> {
    this.calls.push(`claim:${id}`);

    return this.claimedRecord;
  }

  async recordMaintenanceQueueSuccess(id: string): Promise<MaintenanceQueueRecord> {
    this.calls.push(`success:${id}`);

    return unlockedRecord(this.claimedRecord, "succeeded");
  }

  async recordMaintenanceQueueRetry(
    id: string,
    input: RecordMaintenanceQueueRetryInput
  ): Promise<MaintenanceQueueRecord> {
    this.calls.push(`retry:${id}`);

    return {
      ...unlockedRecord(this.claimedRecord, "queued", input.error),
      attempts: this.claimedRecord.attempts + 1,
      runAfter: input.runAfter ?? isoNow
    };
  }

  async recordMaintenanceQueueDeadLetter(
    id: string,
    error: string
  ): Promise<MaintenanceQueueRecord> {
    this.calls.push(`dead-letter:${id}`);

    return {
      ...unlockedRecord(this.claimedRecord, "dead_letter", error),
      attempts: this.claimedRecord.attempts + 1
    };
  }

  async recordMaintenanceQueueSkip(id: string, reason: string): Promise<MaintenanceQueueRecord> {
    this.calls.push(`skip:${id}`);

    return unlockedRecord(this.claimedRecord, "skipped", reason);
  }

  async cleanupTestMaintenanceQueues(
    _input: CleanupTestMaintenanceQueuesInput
  ): Promise<CleanupTestMaintenanceQueuesResult> {
    throw new Error("cleanupTestMaintenanceQueues is not used by executor tests");
  }
}

describe("runMaintenanceQueueRecord", () => {
  it("claims a record, validates payload, checks declared writes, and records success", async () => {
    const repository = new FakeMaintenanceQueueRepository(
      runningRecord({
        jobType: "embed_source_chunk",
        payload: {
          sourceChunkId: "source-chunk-1",
          reason: "embed current source chunk",
          embeddingModelId: "text-embedding-3-small"
        }
      })
    );

    const result = await runMaintenanceQueueRecord({
      repository,
      recordId: "maintenance-queue-1",
      handlers: [
        {
          jobType: "embed_source_chunk",
          declaredWrites: ["embeddings"],
          run: async ({ job }) => {
            expect(job.payload).toEqual({
              sourceChunkId: "source-chunk-1",
              reason: "embed current source chunk",
              embeddingModelId: "text-embedding-3-small"
            });

            return { status: "succeeded" };
          }
        }
      ]
    });

    expect(result.status).toBe("succeeded");
    expect(result.record.status).toBe("succeeded");
    expect(result.queueRecordKeyUniqueness).toBe("not_enforced_by_executor");
    expect(repository.calls).toEqual(["claim:maintenance-queue-1", "success:maintenance-queue-1"]);
  });

  it("requeues a retryable handler failure while attempts remain", async () => {
    const repository = new FakeMaintenanceQueueRepository(
      runningRecord({
        jobType: "embed_memory_record",
        payload: {
          memoryRecordId: "memory-1",
          reason: "refresh memory embedding",
          embeddingModelId: "text-embedding-3-small"
        },
        attempts: 0,
        maxAttempts: 2
      })
    );

    const result = await runMaintenanceQueueRecord({
      repository,
      recordId: "maintenance-queue-1",
      handlers: [
        {
          jobType: "embed_memory_record",
          declaredWrites: ["embeddings"],
          run: async () => ({
            status: "failed",
            error: "embedding endpoint unavailable",
            retryAfter: retryAt
          })
        }
      ]
    });

    expect(result.status).toBe("retried");
    expect(result.record.status).toBe("queued");
    expect(result.record.attempts).toBe(1);
    expect(result.record.runAfter).toBe(retryAt);
    expect(repository.calls).toEqual(["claim:maintenance-queue-1", "retry:maintenance-queue-1"]);
  });

  it("dead-letters a failed record when no attempts remain", async () => {
    const repository = new FakeMaintenanceQueueRepository(
      runningRecord({
        jobType: "embed_memory_record",
        payload: {
          memoryRecordId: "memory-1",
          reason: "refresh memory embedding",
          embeddingModelId: "text-embedding-3-small"
        },
        attempts: 1,
        maxAttempts: 2
      })
    );

    const result = await runMaintenanceQueueRecord({
      repository,
      recordId: "maintenance-queue-1",
      handlers: [
        {
          jobType: "embed_memory_record",
          declaredWrites: ["embeddings"],
          run: async () => ({
            status: "failed",
            error: "embedding endpoint unavailable"
          })
        }
      ]
    });

    expect(result.status).toBe("dead_lettered");
    expect(result.record.status).toBe("dead_letter");
    expect(result.record.attempts).toBe(2);
    expect(repository.calls).toEqual([
      "claim:maintenance-queue-1",
      "dead-letter:maintenance-queue-1"
    ]);
  });

  it("dead-letters unsafe handler write declarations before running the handler", async () => {
    let handlerRan = false;
    const repository = new FakeMaintenanceQueueRepository(
      runningRecord({
        jobType: "compact_memory",
        payload: {
          projectId: "project-1",
          reason: "compact stale records"
        },
        maxAttempts: 1
      })
    );

    const result = await runMaintenanceQueueRecord({
      repository,
      recordId: "maintenance-queue-1",
      handlers: [
        {
          jobType: "compact_memory",
          declaredWrites: ["memory_records"],
          run: async () => {
            handlerRan = true;

            return { status: "succeeded" };
          }
        }
      ]
    });

    expect(handlerRan).toBe(false);
    expect(result.status).toBe("dead_lettered");
    expect(result.handlerWriteBoundary?.status).toBe("failed");
    expect(result.record.status).toBe("dead_letter");
  });

  it("dead-letters invalid DB payloads before handler dispatch", async () => {
    const repository = new FakeMaintenanceQueueRepository(
      runningRecord({
        jobType: "embed_source_chunk",
        payload: {
          sourceChunkId: "source-chunk-1",
          reason: "missing embedding model"
        },
        maxAttempts: 1
      })
    );

    const result = await runMaintenanceQueueRecord({
      repository,
      recordId: "maintenance-queue-1",
      handlers: [
        {
          jobType: "embed_source_chunk",
          declaredWrites: ["embeddings"],
          run: async () => {
            throw new Error("handler should not run");
          }
        }
      ]
    });

    expect(result.status).toBe("dead_lettered");
    expect(result.record.lastError).toBe("Invalid maintenance payload for embed_source_chunk");
    expect(repository.calls).toEqual([
      "claim:maintenance-queue-1",
      "dead-letter:maintenance-queue-1"
    ]);
  });
});
