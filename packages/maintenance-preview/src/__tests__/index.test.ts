import { describe, expect, test } from "vitest";

import {
  assessMaintenanceQueueWriteBoundary,
  buildMaintenancePreview,
  buildMaintenanceCandidatePreview,
  buildMaintenanceQueueWriteBoundaryReadback,
  describeMaintenanceJob,
  isMaintenanceJobType,
  maintenanceJobPersistenceContract,
  maintenanceJobTypes,
  parseMaintenanceJobType
} from "../index.js";
import type {
  MaintenanceQueueRecord,
  MaintenanceJob
} from "../index.js";

const isoNow = "2026-06-21T17:30:00.000Z";

describe("maintenance queue contract", () => {
  test("describes the supported KRN maintenance jobs as persistence-only", () => {
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
          ...maintenanceJobPersistenceContract
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
        memoryBoundary: "write_memory_candidate_only"
      })
    );
  });

  test("rejects unknown maintenance job type input", () => {
    expect(parseMaintenanceJobType("run_everything_now")).toBeUndefined();
    expect(parseMaintenanceJobType({ jobType: "compact_memory" })).toBeUndefined();
    expect(parseMaintenanceJobType("expire_stale_memory")).toBe("expire_stale_memory");
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
        executionMode: "persistence_only"
      })
    );

    const skippedRecord: MaintenanceQueueRecord<"embed_memory_record"> = {
      id: "maintenance-queue-2",
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
    expect(describeMaintenanceJob("embed_source_chunk").queueRecordKeyTemplate).toContain(
      "{embeddingModelId}"
    );
    expect(describeMaintenanceJob("embed_memory_record").queueRecordKeyTemplate).toContain(
      "{embeddingModelId}"
    );
  });

  test("describes queue write boundary before any maintenance executor exists", () => {
    const descriptions = maintenanceJobTypes.map((type) => describeMaintenanceJob(type));

    expect(descriptions).toEqual(
      maintenanceJobTypes.map((type) =>
        expect.objectContaining({
          jobType: type,
          failureRecordStatus: "failed",
          recordSettlementTopic: "maintenance_queue.record_settled",
          executionMode: "persistence_only",
          memoryBoundary: expect.any(String),
          inputSchema: expect.stringContaining("Payload"),
          queueRecordKeyTemplate: expect.stringContaining(type),
          allowedWrites: expect.arrayContaining(["maintenance_queue_records", "outbox_events"]),
          forbiddenWrites: expect.arrayContaining(["memory_records"])
        })
      )
    );
    expect(describeMaintenanceJob("compact_memory")).toEqual(
      expect.objectContaining({
        allowedWrites: ["maintenance_queue_records", "outbox_events", "memory_candidates"],
        forbiddenWrites: [
          "memory_records",
          "anti_memory_records",
          "source_claims",
          "source_decisions"
        ],
        memoryBoundary: "write_memory_candidate_only"
      })
    );
  });

  test("routes maintenance candidate preview through the maintenance preview builder", () => {
    const input = {
      now: isoNow,
      memoryRecords: [],
      sourceClaims: [],
      sourceClaimEdges: [],
      evidenceRef: "maintenance-test"
    } as const;

    expect(buildMaintenanceCandidatePreview(input)).toEqual(buildMaintenancePreview(input));
  });

  test("builds a maintenance boundary readback for maintenance candidates", () => {
    expect(buildMaintenanceQueueWriteBoundaryReadback("expire_stale_memory")).toEqual({
      jobType: "expire_stale_memory",
      memoryBoundary: "must_create_reviewed_invalidation_candidate",
      status: "passed",
      queueRecordKeyTemplate: "expire_stale_memory:{projectId}:{olderThan}",
      allowedWrites: [
        "maintenance_queue_records",
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
        "Declared maintenance queue write boundary does not prove maintenance execution, scheduler readiness, unique enqueue deduplication, runtime enforcement, candidate truth, review correctness, or Memory Core mutation safety outside this declared queue boundary."
    });
  });

  test("fails maintenance queue write boundary when a memory boundary allows the wrong write", () => {
    const invalidDescription = {
      ...describeMaintenanceJob("embed_source_chunk"),
      allowedWrites: ["maintenance_queue_records", "outbox_events", "memory_candidates"],
      memoryBoundary: "no_memory_core_write"
    } as const;

    expect(assessMaintenanceQueueWriteBoundary(invalidDescription)).toEqual({
      jobType: "embed_source_chunk",
      memoryBoundary: "no_memory_core_write",
      status: "failed",
      violations: [
        {
          code: "disallowed_write_for_memory_boundary",
          message:
            "embed_source_chunk allows memory_candidates but memory boundary no_memory_core_write does not."
        }
      ]
    });
  });
});
