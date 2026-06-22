import { describe, expect, it } from "vitest";

import {
  DrizzleMemoryRepository,
  assertMemoryCoreInvariants,
  memoryPromotionMetadata
} from "./DrizzleMemoryRepository.js";

const methodNames = [
  "createMemoryCandidate",
  "getMemoryCandidateById",
  "promoteMemoryCandidate",
  "rejectMemoryCandidate",
  "getMemoryRecordById",
  "listMemoryRecordsForProject",
  "invalidateMemoryRecord",
  "recordMemoryApplication",
  "createMemoryFeedbackEvent",
  "createAntiMemoryRecord",
  "listAntiMemoryForProject",
  "listAntiMemoryForRun"
] as const;

describe("DrizzleMemoryRepository", () => {
  it("exposes M23 memory governance repository methods", () => {
    for (const methodName of methodNames) {
      expect(typeof DrizzleMemoryRepository.prototype[methodName]).toBe("function");
    }
  });

  it("accepts governed memory core inputs with lineage and guidance", () => {
    expect(() => assertMemoryCoreInvariants({
      summary: "Reviewed memory summary",
      body: "Reviewed memory body.",
      owner: "kernel",
      confidence: 90,
      applicationGuidance: "Use only for governed memory tests.",
      invalidationRule: "Revisit when governance changes.",
      sourceLineage: [{ sourceId: "source-claim-1" }],
      validFrom: "2026-06-22T00:00:00.000Z",
      validUntil: "2026-07-22T00:00:00.000Z"
    }, "Memory record")).not.toThrow();
  });

  it("rejects missing source lineage, owner, guidance, and bad confidence", () => {
    const valid = {
      summary: "Reviewed memory summary",
      body: "Reviewed memory body.",
      owner: "kernel",
      confidence: 90,
      applicationGuidance: "Use only for governed memory tests.",
      sourceLineage: [{ sourceId: "source-claim-1" }]
    };

    expect(() => assertMemoryCoreInvariants({
      ...valid,
      sourceLineage: []
    }, "Memory record")).toThrow("Memory record requires source lineage");
    expect(() => assertMemoryCoreInvariants({
      ...valid,
      owner: " "
    }, "Memory record")).toThrow("Memory record requires owner");
    expect(() => assertMemoryCoreInvariants({
      ...valid,
      applicationGuidance: ""
    }, "Memory record")).toThrow("Memory record requires application guidance");
    expect(() => assertMemoryCoreInvariants({
      ...valid,
      confidence: 101
    }, "Memory record")).toThrow("Memory record confidence must be an integer from 0 to 100");
  });

  it("requires validity and invalidation strategy for temporal memory", () => {
    const temporal = {
      summary: "Temporal memory summary",
      body: "Temporal memory body.",
      owner: "kernel",
      confidence: 80,
      applicationGuidance: "Use until stale.",
      sourceLineage: [{ sourceId: "source-claim-1" }],
      validUntil: "2026-06-22T00:00:00.000Z"
    };

    expect(() => assertMemoryCoreInvariants(temporal, "Memory record"))
      .toThrow("Memory record with validUntil requires validFrom");
    expect(() => assertMemoryCoreInvariants({
      ...temporal,
      validFrom: "2026-06-21T00:00:00.000Z"
    }, "Memory record")).toThrow("Memory record with validUntil requires invalidation rule");
    expect(() => assertMemoryCoreInvariants({
      ...temporal,
      validFrom: "2026-06-23T00:00:00.000Z",
      invalidationRule: "Revisit when stale."
    }, "Memory record")).toThrow("Memory record validUntil must be after validFrom");
  });

  it("preserves review gate metadata when promoting a candidate", () => {
    const metadata = memoryPromotionMetadata({
      id: "memory-candidate-1",
      projectId: "project-1",
      executionRunId: "execution-run-1",
      proposedBy: "reflection",
      kind: "constraint",
      status: "candidate",
      summary: "Use Postgres edge tables first",
      body: "Use Postgres edge tables first.",
      owner: "operator",
      confidence: 80,
      applicationGuidance: "Use when evaluating graph DB proposals.",
      invalidationRule: "Revisit when graph traversal exceeds Postgres limits.",
      sourceClaimIds: ["source-claim-1"],
      sourceLineage: [{ sourceId: "source-claim-1" }],
      isUserPreference: false,
      validFrom: "2026-06-23T00:00:00.000Z",
      metadata: {
        candidateNote: "from reflection"
      },
      createdAt: "2026-06-23T00:00:00.000Z",
      updatedAt: "2026-06-23T00:00:00.000Z"
    }, {
      candidateId: "memory-candidate-1",
      reviewer: "operator",
      decision: "accepted",
      metadata: {
        reviewGate: {
          evidenceReviewedRef: "raw-evidence:run-event-1"
        }
      }
    });

    expect(metadata).toMatchObject({
      candidateNote: "from reflection",
      createdFromCandidateId: "memory-candidate-1",
      sourceClaimIds: ["source-claim-1"],
      reviewGate: {
        evidenceReviewedRef: "raw-evidence:run-event-1"
      }
    });
  });
});
