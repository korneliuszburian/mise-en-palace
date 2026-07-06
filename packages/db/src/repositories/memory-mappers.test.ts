import {
  describe,
  expect,
  it
} from "vitest";

import {
  mapAntiMemoryCandidate,
  mapAntiMemoryRecord,
  mapMemoryApplication,
  mapMemoryCandidate,
  mapMemoryFeedbackEvent,
  mapMemoryRecord,
  memoryCandidatesOrEmpty
} from "./memory-mappers.js";

const createdAt = new Date("2026-06-21T12:00:00.000Z");
const updatedAt = new Date("2026-06-21T12:30:00.000Z");

describe("memoryMappers", () => {
  it("exports focused memory-domain row mappers", () => {
    expect(mapMemoryRecord).toEqual(expect.any(Function));
    expect(mapMemoryCandidate).toEqual(expect.any(Function));
    expect(mapMemoryApplication).toEqual(expect.any(Function));
    expect(mapMemoryFeedbackEvent).toEqual(expect.any(Function));
    expect(mapAntiMemoryCandidate).toEqual(expect.any(Function));
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

  it("filters malformed MemoryCandidate JSON at the boundary", () => {
    const candidateJson: unknown[] = [
      "not-object",
      {
        id: "candidate-invalid-kind",
        projectId: "project-1",
        proposedBy: "reviewer",
        kind: "note",
        status: "candidate",
        summary: "Invalid kind",
        body: "This should be filtered.",
        owner: "memory-governance",
        confidence: 90,
        applicationGuidance: "Use never.",
        isUserPreference: false,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString()
      },
      {
        id: "candidate-invalid-status",
        projectId: "project-1",
        proposedBy: "reviewer",
        kind: "procedure",
        status: "ready",
        summary: "Invalid status",
        body: "This should be filtered.",
        owner: "memory-governance",
        confidence: 90,
        applicationGuidance: "Use never.",
        isUserPreference: false,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString()
      },
      {
        id: "candidate-valid",
        projectId: "project-1",
        proposedBy: "reviewer",
        kind: "procedure",
        status: "candidate",
        summary: "Keep review feedback candidate-only.",
        body: "Feedback should not create MemoryRecord rows directly.",
        owner: "memory-governance",
        confidence: 90,
        applicationGuidance: "Use when reviewing feedback extraction.",
        sourceClaimIds: ["source-claim-1", 123],
        sourceLineage: [
          { sourceId: "source-claim-1", note: "reviewed" },
          { sourceId: 123 },
          { note: "missing source" }
        ],
        isUserPreference: false,
        metadata: ["not-a-record"],
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString()
      }
    ];

    expect(memoryCandidatesOrEmpty(candidateJson)).toEqual([{
      id: "candidate-valid",
      projectId: "project-1",
      proposedBy: "reviewer",
      kind: "procedure",
      status: "candidate",
      summary: "Keep review feedback candidate-only.",
      body: "Feedback should not create MemoryRecord rows directly.",
      owner: "memory-governance",
      confidence: 90,
      applicationGuidance: "Use when reviewing feedback extraction.",
      sourceClaimIds: ["source-claim-1"],
      sourceLineage: [{ sourceId: "source-claim-1", note: "reviewed" }],
      isUserPreference: false,
      validFrom: createdAt.toISOString(),
      metadata: {},
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString()
    }]);
  });

  it("maps AntiMemoryCandidate review and lineage fields", () => {
    expect(mapAntiMemoryCandidate({
      id: "anti-memory-candidate-1",
      projectId: "project-1",
      executionRunId: "run-1",
      feedbackDeltaId: null,
      proposedBy: "reflection",
      key: "anti-markdown-runtime-memory",
      status: "candidate",
      rejectedClaim: "Markdown files are runtime memory",
      reason: "Memory Core is store-backed.",
      invalidatedBySourceClaimIds: ["source-claim-1"],
      invalidatedBySourceClaimId: null,
      appliesTo: "memory:markdown-runtime",
      mayRevisitWhen: null,
      summary: "Do not treat markdown as runtime memory.",
      body: "Markdown may be source/export, not Memory Core.",
      owner: "operator",
      confidence: 90,
      sourceLineage: [{ sourceId: "source-claim-1", note: "reviewed" }],
      reviewer: null,
      reviewedAt: null,
      rejectionReason: null,
      validFrom: createdAt,
      validUntil: null,
      metadata: { reflectionRecordId: "reflection-1" },
      createdAt,
      updatedAt
    })).toMatchObject({
      id: "anti-memory-candidate-1",
      proposedBy: "reflection",
      invalidatedBySourceClaimIds: ["source-claim-1"],
      sourceLineage: [{ sourceId: "source-claim-1", note: "reviewed" }],
      validFrom: createdAt.toISOString(),
      metadata: { reflectionRecordId: "reflection-1" }
    });
  });
});
