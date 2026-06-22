import { describe, expect, it } from "vitest";

import type {
  MemoryCandidate,
  MemoryRecord,
  SourceClaim
} from "@krn/core";
import type {
  PromoteMemoryCandidateInput
} from "../repositories/memoryRepository.js";
import {
  promoteMemoryCandidateThroughGate
} from "./memoryReviewGate.js";

const now = "2026-06-23T00:00:00.000Z";

const candidate = (
  overrides: Partial<MemoryCandidate> = {}
): MemoryCandidate => ({
  id: "memory-candidate-1",
  projectId: "project-1",
  executionRunId: "execution-run-1",
  proposedBy: "reflection",
  kind: "constraint",
  status: "candidate",
  summary: "Use Postgres edge tables before adding a separate graph DB",
  body: "KRN should keep graph traversal in Postgres edge tables until measured bottlenecks prove otherwise.",
  owner: "operator",
  confidence: 82,
  applicationGuidance: "Use when evaluating proposals for a separate graph database.",
  invalidationRule: "Revisit when Postgres edge traversal misses product latency targets.",
  sourceClaimIds: ["source-claim-1"],
  sourceLineage: [{ sourceId: "source-claim-1" }],
  isUserPreference: false,
  validFrom: now,
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const sourceClaim = (): SourceClaim => ({
  id: "source-claim-1",
  sourceArtifactId: "source-artifact-1",
  claim: "Postgres edge tables are the first graph substrate.",
  mechanism: "Relational edges keep the first KRN brain store transactional.",
  krnImplication: "Memory can cite graph decisions without adding a graph DB.",
  doesNotProve: "This does not prove future graph workloads fit Postgres.",
  trustTier: "project-decision",
  supportType: "implementation-boundary",
  consumer: "MM-27",
  status: "accepted",
  metadata: {},
  createdAt: now,
  updatedAt: now
});

const memoryRecord = (): MemoryRecord => ({
  id: "memory-record-1",
  projectId: "project-1",
  currentVersionId: "memory-record-version-1",
  key: "memory:memory-candidate-1",
  kind: "constraint",
  status: "active",
  summary: "Use Postgres edge tables before adding a separate graph DB",
  body: "KRN should keep graph traversal in Postgres edge tables until measured bottlenecks prove otherwise.",
  owner: "operator",
  confidence: 82,
  applicationGuidance: "Use when evaluating proposals for a separate graph database.",
  invalidationRule: "Revisit when Postgres edge traversal misses product latency targets.",
  sourceLineage: [{ sourceId: "source-claim-1" }],
  isUserPreference: false,
  positiveFeedbackCount: 0,
  negativeFeedbackCount: 0,
  metadata: {},
  createdAt: now,
  updatedAt: now
});

describe("promoteMemoryCandidateThroughGate", () => {
  it("rejects promotion without raw evidence review reference", async () => {
    let promoteCalled = false;

    await expect(
      promoteMemoryCandidateThroughGate({
        memoryRepository: {
          async getMemoryCandidateById() {
            return candidate();
          },
          async promoteMemoryCandidate() {
            promoteCalled = true;
            return memoryRecord();
          }
        },
        sourceRepository: {
          async getSourceClaimById() {
            return sourceClaim();
          }
        },
        review: {
          candidateId: "memory-candidate-1",
          reviewer: "operator",
          evidenceReviewedRef: " "
        }
      })
    ).rejects.toThrow("evidenceReviewedRef is required");

    expect(promoteCalled).toBe(false);
  });

  it("rejects promotion when a linked source claim cannot be inspected", async () => {
    let promoteCalled = false;

    await expect(
      promoteMemoryCandidateThroughGate({
        memoryRepository: {
          async getMemoryCandidateById() {
            return candidate();
          },
          async promoteMemoryCandidate() {
            promoteCalled = true;
            return memoryRecord();
          }
        },
        sourceRepository: {
          async getSourceClaimById() {
            return undefined;
          }
        },
        review: {
          candidateId: "memory-candidate-1",
          reviewer: "operator",
          evidenceReviewedRef: "raw-evidence:run-event-1"
        }
      })
    ).rejects.toThrow("SourceClaim not found: source-claim-1");

    expect(promoteCalled).toBe(false);
  });

  it("promotes an approved candidate through the low-level repository with gate metadata", async () => {
    let capturedPromotion: PromoteMemoryCandidateInput | undefined;

    const result = await promoteMemoryCandidateThroughGate({
      memoryRepository: {
        async getMemoryCandidateById() {
          return candidate();
        },
        async promoteMemoryCandidate(input) {
          capturedPromotion = input;
          return memoryRecord();
        }
      },
      sourceRepository: {
        async getSourceClaimById() {
          return sourceClaim();
        }
      },
      review: {
        candidateId: "memory-candidate-1",
        reviewer: "operator",
        evidenceReviewedRef: "raw-evidence:run-event-1",
        metadata: {
          reviewNote: "inspected raw run event"
        }
      }
    });

    expect(result.memoryRecord.id).toBe("memory-record-1");
    expect(result.reviewedSourceClaims).toHaveLength(1);
    expect(capturedPromotion).toMatchObject({
      candidateId: "memory-candidate-1",
      reviewer: "operator",
      decision: "accepted",
      metadata: {
        reviewNote: "inspected raw run event",
        reviewGate: {
          evidenceReviewedRef: "raw-evidence:run-event-1",
          sourceClaimIds: ["source-claim-1"]
        }
      }
    });
  });
});
