import { describe, expect, test } from "vitest";

import {
  assessMaintenanceJobWriteAuthority,
  buildBrainHeartbeatPreview,
  buildMaintenanceCandidatePreview,
  buildMaintenanceJobAuthorityReadback,
  describeMaintenanceJob,
  isMaintenanceJobType,
  maintenanceJobRuntimeContract,
  maintenanceJobTypes,
  parseMaintenanceJobType
} from "../index.js";
import type {
  EnqueueMaintenanceJobRequest,
  EnqueueMaintenanceJobResult,
  MaintenanceJob,
  MaintenanceJobQueueRepository,
  WorkerJobRecord
} from "../index.js";

const isoNow = "2026-06-21T17:30:00.000Z";

class InMemoryMaintenanceJobQueue implements MaintenanceJobQueueRepository {
  readonly requests: EnqueueMaintenanceJobRequest[] = [];

  async enqueue<TType extends MaintenanceJob["jobType"]>(
    request: EnqueueMaintenanceJobRequest<TType>
  ): Promise<EnqueueMaintenanceJobResult<TType>> {
    this.requests.push(request);

    const workerJob = {
      id: "worker-job-1",
      jobType: request.job.jobType,
      status: "queued",
      payload: request.job.payload,
      attempts: 0,
      maxAttempts: request.maxAttempts ?? 3,
      runAfter: request.runAfter ?? isoNow,
      createdAt: isoNow,
      updatedAt: isoNow
    } as WorkerJobRecord<TType>;

    const outboxEvent = {
      id: "outbox-event-1",
      topic: "worker_job.queued"
    } as const;

    return {
      workerJob,
      outboxEvent
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
      "expire_stale_memory"
    ]);

    const descriptions = maintenanceJobTypes.map((type) => describeMaintenanceJob(type));

    expect(descriptions).toEqual(
      maintenanceJobTypes.map((type) =>
        expect.objectContaining({
          jobType: type,
          ...maintenanceJobRuntimeContract
        })
      )
    );
  });

  test("narrows unknown input before using a maintenance job type", () => {
    const fromExternalInput: unknown = "compact_memory";

    expect(isMaintenanceJobType(fromExternalInput)).toBe(true);

    if (!isMaintenanceJobType(fromExternalInput)) {
      throw new Error("expected compact_memory to narrow to MaintenanceJobType");
    }

    expect(describeMaintenanceJob(fromExternalInput)).toEqual(
      expect.objectContaining({
        jobType: "compact_memory",
        memoryCoreGate: "write_memory_candidate_only"
      })
    );
  });

  test("rejects unknown maintenance job type input", () => {
    expect(parseMaintenanceJobType("run_everything_now")).toBeUndefined();
    expect(parseMaintenanceJobType({ jobType: "compact_memory" })).toBeUndefined();
    expect(parseMaintenanceJobType("expire_stale_memory")).toBe("expire_stale_memory");
  });

  test("enqueues a typed worker job through one atomic queue port", async () => {
    const queue = new InMemoryMaintenanceJobQueue();
    const job: MaintenanceJob = {
      jobType: "compact_memory",
      payload: {
        projectId: "project-1",
        memoryRecordId: "memory-1",
        reason: "summarize stale high-confidence project memories"
      }
    };

    const result = await queue.enqueue({
      job,
      runAfter: "2026-06-21T18:00:00.000Z",
      maxAttempts: 2
    });

    expect(queue.requests).toEqual([
      {
        job,
        runAfter: "2026-06-21T18:00:00.000Z",
        maxAttempts: 2
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

  test("requires embedding model scope for embed job payloads", () => {
    const sourceChunkJob: MaintenanceJob<"embed_source_chunk"> = {
      jobType: "embed_source_chunk",
      payload: {
        sourceChunkId: "source-chunk-1",
        reason: "refresh source chunk embedding",
        embeddingModelId: "text-embedding-3-small"
      }
    };
    const memoryRecordJob: MaintenanceJob<"embed_memory_record"> = {
      jobType: "embed_memory_record",
      payload: {
        memoryRecordId: "memory-1",
        reason: "refresh stale memory embedding",
        embeddingModelId: "text-embedding-3-small"
      }
    };

    expect(sourceChunkJob.payload.embeddingModelId).toBe("text-embedding-3-small");
    expect(memoryRecordJob.payload.embeddingModelId).toBe("text-embedding-3-small");
    expect(describeMaintenanceJob("embed_source_chunk").idempotencyKey).toContain(
      "{embeddingModelId}"
    );
    expect(describeMaintenanceJob("embed_memory_record").idempotencyKey).toContain(
      "{embeddingModelId}"
    );
  });

  test("describes write authority before any worker runtime exists", () => {
    const descriptions = maintenanceJobTypes.map((type) => describeMaintenanceJob(type));

    expect(descriptions).toEqual(
      maintenanceJobTypes.map((type) =>
        expect.objectContaining({
          jobType: type,
          failureState: "failed",
          outputEvent: "worker_job.completed",
          memoryCoreGate: expect.any(String),
          inputSchema: expect.stringContaining("Payload"),
          idempotencyKey: expect.stringContaining(type),
          allowedWrites: expect.arrayContaining(["worker_jobs", "outbox_events"]),
          forbiddenWrites: expect.arrayContaining(["memory_records"])
        })
      )
    );
    expect(describeMaintenanceJob("compact_memory")).toEqual(
      expect.objectContaining({
        allowedWrites: ["worker_jobs", "outbox_events", "memory_candidates"],
        forbiddenWrites: [
          "memory_records",
          "anti_memory_records",
          "source_claims",
          "source_decisions"
        ],
        memoryCoreGate: "write_memory_candidate_only"
      })
    );
  });

  test("routes maintenance candidate preview through the legacy heartbeat builder", () => {
    const input = {
      now: isoNow,
      memoryRecords: [],
      sourceClaims: [],
      sourceClaimEdges: [],
      evidenceRef: "worker-test"
    } as const;

    expect(buildMaintenanceCandidatePreview(input)).toEqual(buildBrainHeartbeatPreview(input));
  });

  test("builds a worker authority readback for heartbeat candidates", () => {
    expect(buildMaintenanceJobAuthorityReadback("expire_stale_memory")).toEqual({
      jobType: "expire_stale_memory",
      memoryCoreGate: "must_create_reviewed_invalidation_candidate",
      status: "passed",
      idempotencyKey: "expire_stale_memory:{projectId}:{olderThan}",
      allowedWrites: [
        "worker_jobs",
        "outbox_events",
        "memory_candidates"
      ],
      forbiddenWrites: [
        "memory_records",
        "anti_memory_records",
        "source_claims",
        "source_decisions"
      ],
      doesNotProve:
        "Declared worker write authority does not prove worker execution, scheduler readiness, idempotent enqueue deduplication, runtime authority gating, candidate truth, review correctness, or Memory Core mutation safety outside this declared job boundary."
    });
  });

  test("fails worker write authority when a gate allows the wrong write", () => {
    const invalidDescription = {
      ...describeMaintenanceJob("embed_source_chunk"),
      allowedWrites: ["worker_jobs", "outbox_events", "memory_candidates"],
      memoryCoreGate: "no_memory_core_write"
    } as const;

    expect(assessMaintenanceJobWriteAuthority(invalidDescription)).toEqual({
      jobType: "embed_source_chunk",
      memoryCoreGate: "no_memory_core_write",
      status: "failed",
      violations: [
        {
          code: "disallowed_write_for_memory_core_gate",
          message:
            "embed_source_chunk allows memory_candidates but gate no_memory_core_write does not."
        }
      ]
    });
  });
});
