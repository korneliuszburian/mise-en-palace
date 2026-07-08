import type {
  MemoryRecord,
  MemoryRecordId,
  ProjectId
} from "@krn/core";
import { describe, expect, test } from "vitest";

import {
  buildMemoryStalenessMaintenancePreview
} from "../memory-staleness-maintenance-preview.js";

const now = "2026-06-29T05:00:00.000Z";
const evidenceRef =
  "review-evidence/controlled-dogfood/2026-06-29-v338-memory-staleness-maintenance-candidate-preview/REPORT.md";

const memoryRecord = (
  id: string,
  overrides: Partial<MemoryRecord> = {}
): MemoryRecord => ({
  id: id as MemoryRecordId,
  projectId: "project-1" as ProjectId,
  key: id,
  kind: "procedure",
  status: "active",
  summary: `Memory ${id}`,
  body: "A bounded memory record for maintenance preview tests.",
  owner: "krn",
  confidence: 90,
  applicationGuidance: "Use only when current evidence still supports this memory.",
  invalidationRule: "Revisit when current evidence supersedes this memory.",
  sourceLineage: [{
    sourceId: "review-evidence/controlled-dogfood/2026-06-29-v337-source-relation-maintenance-candidate-preview/REPORT.md"
  }],
  isUserPreference: false,
  positiveFeedbackCount: 1,
  negativeFeedbackCount: 0,
  metadata: {},
  validFrom: "2026-06-01T00:00:00.000Z",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  ...overrides
});

describe("memory staleness maintenance preview", () => {
  test("proposes a reviewable invalidation candidate for expired memory without mutation", () => {
    const result = buildMemoryStalenessMaintenancePreview({
      now,
      memoryRecords: [
        memoryRecord("memory-expired", {
          validUntil: "2026-06-28T00:00:00.000Z"
        })
      ],
      evidenceRef
    });

    expect(result.mutation).toBe("none");
    expect(result.doesNotProve).toContain("Memory Core mutation");
    expect(result.candidates).toEqual([
      expect.objectContaining({
        id: "memory-staleness-maintenance:memory-expired:expired_memory",
        kind: "memory_staleness_maintenance_candidate",
        action: "review_memory_invalidation",
        reason: "expired_memory",
        reviewability: "ready",
        maintenanceWriteBoundary: expect.objectContaining({
          jobType: "expire_stale_memory",
          memoryBoundary: "must_create_reviewed_invalidation_candidate",
          status: "passed",
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
          ]
        }),
        mutation: "none",
        forbiddenWrites: [
          "memory_records",
          "anti_memory_records",
          "source_claims",
          "source_decisions"
        ]
      })
    ]);
    expect(result.candidates[0]?.reviewabilityReasons).toEqual([
      "Candidate has review evidence, application guidance, and doesNotProve boundary."
    ]);
    expect(result.candidates[0]?.evidenceRefs).toContain(evidenceRef);
    expect(result.candidates[0]?.sourceLineageRefs).toEqual([
      "review-evidence/controlled-dogfood/2026-06-29-v337-source-relation-maintenance-candidate-preview/REPORT.md"
    ]);
  });

  test("proposes near-expiry memory review before it becomes stale", () => {
    const result = buildMemoryStalenessMaintenancePreview({
      now,
      nearExpiryDays: 7,
      memoryRecords: [
        memoryRecord("memory-near-expiry", {
          validUntil: "2026-07-02T00:00:00.000Z"
        })
      ],
      evidenceRef
    });

    expect(result.candidates[0]).toEqual(
      expect.objectContaining({
        action: "review_memory_invalidation",
        reason: "near_expiry_memory",
        reviewability: "ready"
      })
    );
  });

  test("uses existing memory review signals for stale high-confidence memory", () => {
    const result = buildMemoryStalenessMaintenancePreview({
      now,
      memoryRecords: [
        memoryRecord("memory-stale-high-confidence", {
          status: "stale",
          confidence: 95
        })
      ],
      evidenceRef
    });

    expect(result.candidates[0]).toEqual(
      expect.objectContaining({
        action: "review_memory_invalidation",
        reason: "stale_high_confidence",
        reviewability: "ready"
      })
    );
  });

  test("routes repeated negative feedback to memory feedback review", () => {
    const result = buildMemoryStalenessMaintenancePreview({
      now,
      memoryRecords: [
        memoryRecord("memory-negative-feedback", {
          negativeFeedbackCount: 3
        })
      ],
      evidenceRef
    });

    expect(result.candidates[0]).toEqual(
      expect.objectContaining({
        action: "review_memory_feedback",
        reason: "unresolved_negative_feedback",
        reviewability: "ready"
      })
    );
  });

  test("skips healthy memory and respects maxCandidates zero", () => {
    const healthy = memoryRecord("memory-healthy", {
      validUntil: "2026-08-01T00:00:00.000Z"
    });

    const healthyResult = buildMemoryStalenessMaintenancePreview({
      now,
      memoryRecords: [healthy],
      evidenceRef
    });

    expect(healthyResult.candidates).toEqual([]);
    expect(healthyResult.skippedMemoryCount).toBe(1);

    const disabledResult = buildMemoryStalenessMaintenancePreview({
      now,
      memoryRecords: [
        memoryRecord("memory-expired", {
          validUntil: "2026-06-28T00:00:00.000Z"
        })
      ],
      evidenceRef,
      maxCandidates: 0
    });

    expect(disabledResult.candidates).toEqual([]);
    expect(disabledResult.skippedMemoryCount).toBe(1);
    expect(disabledResult.mutation).toBe("none");
  });
});
