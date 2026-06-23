import {
  describe,
  expect,
  it
} from "vitest";

import {
  mapAntiMemoryRecord,
  mapMemoryApplication,
  mapMemoryCandidate,
  mapMemoryFeedbackEvent,
  mapMemoryRecord
} from "./memoryMappers.js";

const createdAt = new Date("2026-06-21T12:00:00.000Z");
const updatedAt = new Date("2026-06-21T12:30:00.000Z");

describe("memoryMappers", () => {
  it("exports focused memory-domain row mappers", () => {
    expect(mapMemoryRecord).toEqual(expect.any(Function));
    expect(mapMemoryCandidate).toEqual(expect.any(Function));
    expect(mapMemoryApplication).toEqual(expect.any(Function));
    expect(mapMemoryFeedbackEvent).toEqual(expect.any(Function));
    expect(mapAntiMemoryRecord).toEqual(expect.any(Function));
  });

  it("maps MemoryCandidate source lineage and timestamps", () => {
    expect(mapMemoryCandidate({
      id: "memory-candidate-1",
      projectId: "project-1",
      executionRunId: "run-1",
      feedbackDeltaId: null,
      proposedBy: "reviewer",
      kind: "procedure",
      status: "candidate",
      summary: "Keep review feedback candidate-only.",
      body: "Feedback should not create MemoryRecord rows directly.",
      owner: "memory-governance",
      confidence: 90,
      applicationGuidance: "Use when reviewing feedback extraction.",
      invalidationRule: "Revisit after MemoryReviewGate changes.",
      sourceClaimIds: ["source-claim-1"],
      sourceLineage: [{ sourceId: "source-claim-1", note: "reviewed" }],
      isUserPreference: false,
      reviewer: null,
      reviewedAt: null,
      rejectionReason: null,
      validFrom: createdAt,
      validUntil: null,
      metadata: { slice: "QG-04G" },
      createdAt,
      updatedAt
    })).toMatchObject({
      id: "memory-candidate-1",
      sourceLineage: [{ sourceId: "source-claim-1", note: "reviewed" }],
      validFrom: createdAt.toISOString(),
      metadata: { slice: "QG-04G" }
    });
  });
});
