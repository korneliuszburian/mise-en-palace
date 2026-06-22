import { describe, expect, test } from "vitest";

import {
  describeMaintenanceJob,
  enqueueMaintenanceJob,
  maintenanceJobTypes
} from "./index.js";
import type {
  CreateWorkerJobInput,
  MaintenanceJob,
  WorkerJobRecord,
  WorkerJobRepository,
  WorkerOutboxRepository
} from "./index.js";

const isoNow = "2026-06-21T17:30:00.000Z";

class InMemoryWorkerJobRepository implements WorkerJobRepository {
  readonly inputs: CreateWorkerJobInput[] = [];

  async enqueue(input: CreateWorkerJobInput): Promise<WorkerJobRecord> {
    this.inputs.push(input);

    return {
      id: "worker-job-1",
      jobType: input.jobType,
      status: "queued",
      payload: input.payload,
      attempts: 0,
      maxAttempts: input.maxAttempts ?? 3,
      runAfter: input.runAfter ?? isoNow,
      createdAt: isoNow,
      updatedAt: isoNow
    };
  }
}

class InMemoryOutboxRepository implements WorkerOutboxRepository {
  readonly inputs: Parameters<WorkerOutboxRepository["enqueue"]>[0][] = [];

  async enqueue(input: Parameters<WorkerOutboxRepository["enqueue"]>[0]) {
    this.inputs.push(input);

    return {
      id: "outbox-event-1",
      topic: input.topic
    };
  }
}

describe("maintenance worker skeleton", () => {
  test("describes the supported KRN maintenance jobs without daemon behavior", () => {
    expect(maintenanceJobTypes).toEqual([
      "embed_source_chunk",
      "embed_memory_record",
      "compact_memory",
      "detect_contradiction",
      "expire_stale_memory",
      "promote_eval_candidate"
    ]);

    const descriptions = maintenanceJobTypes.map((type) => describeMaintenanceJob(type));

    expect(descriptions).toEqual(
      maintenanceJobTypes.map((type) =>
        expect.objectContaining({
          jobType: type,
          workerTable: "worker_jobs",
          outboxTable: "outbox_events",
          requiresBackgroundLoop: false
        })
      )
    );
  });

  test("enqueues a typed worker job and emits a worker-job outbox event", async () => {
    const workerJobs = new InMemoryWorkerJobRepository();
    const outbox = new InMemoryOutboxRepository();
    const job: MaintenanceJob = {
      jobType: "compact_memory",
      payload: {
        projectId: "project-1",
        memoryRecordId: "memory-1",
        reason: "summarize stale high-confidence project memories"
      }
    };

    const result = await enqueueMaintenanceJob({
      job,
      repositories: {
        workerJobs,
        outbox
      },
      runAfter: "2026-06-21T18:00:00.000Z",
      maxAttempts: 2
    });

    expect(workerJobs.inputs).toEqual([
      {
        jobType: "compact_memory",
        payload: job.payload,
        runAfter: "2026-06-21T18:00:00.000Z",
        maxAttempts: 2
      }
    ]);
    expect(outbox.inputs).toEqual([
      {
        topic: "worker_job.queued",
        payload: {
          workerJobId: "worker-job-1",
          jobType: "compact_memory",
          payload: job.payload
        },
        runAfter: "2026-06-21T18:00:00.000Z"
      }
    ]);
    expect(result).toEqual({
      workerJob: expect.objectContaining({
        id: "worker-job-1",
        jobType: "compact_memory",
        status: "queued"
      }),
      outboxEvent: {
        id: "outbox-event-1",
        topic: "worker_job.queued"
      }
    });
  });

  test("describes embed memory record jobs and skipped lifecycle status", () => {
    const job: MaintenanceJob<"embed_memory_record"> = {
      jobType: "embed_memory_record",
      payload: {
        memoryRecordId: "memory-1",
        reason: "refresh stale memory embedding",
        embeddingModelId: "text-embedding-3-small"
      }
    };

    expect(describeMaintenanceJob(job.jobType)).toEqual(
      expect.objectContaining({
        jobType: "embed_memory_record",
        label: "Embed memory record",
        requiresBackgroundLoop: false
      })
    );

    const skippedRecord: WorkerJobRecord<"embed_memory_record"> = {
      id: "worker-job-2",
      jobType: job.jobType,
      status: "skipped",
      payload: job.payload,
      attempts: 0,
      maxAttempts: 3,
      runAfter: isoNow,
      createdAt: isoNow,
      updatedAt: isoNow
    };

    expect(skippedRecord.status).toBe("skipped");
  });
});
