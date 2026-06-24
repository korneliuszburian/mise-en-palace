import { describe, expect, it } from "vitest";

import type {
  MemoryCandidate,
  MemoryRecord,
  SourceClaim,
  TaskContract
} from "@krn/core";
import type {
  PromoteMemoryCandidateInput
} from "../repositories/memoryRepository.js";
import {
  applyContextROI,
  assembleContext,
  buildMemoryQuery,
  rankCandidates,
  toMemoryCandidate
} from "../activation/index.js";
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
  metadata: {
    reflectionCandidateEvidence: {
      provenance: "operator_reported",
      evidenceRefs: ["raw-evidence:run-event-1"],
      doesNotProve: "This does not prove the candidate is approved Memory Core truth."
    }
  },
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

const task = (): TaskContract => ({
  id: "task-1",
  operatorIntentId: "intent-1",
  projectId: "project-1",
  title: "Evaluate graph database proposal",
  objective: "Decide whether KRN should add a separate graph database.",
  constraints: ["use reviewed memory"],
  nonGoals: ["do not add a graph database without proof"],
  acceptance: ["reviewed memory influences activation"],
  status: "active",
  metadata: {},
  createdAt: now,
  updatedAt: now
});

const memoryRecord = (
  overrides: Partial<MemoryRecord> = {}
): MemoryRecord => ({
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
  updatedAt: now,
  ...overrides
});

const expectReviewableMemoryCandidateStatus = (
  _status: "proposed" | "candidate"
): void => {};

describe("promoteMemoryCandidateThroughGate", () => {
  it("rejects promotion when candidate evidence provenance is missing", async () => {
    let promoteCalled = false;

    await expect(
      promoteMemoryCandidateThroughGate({
        memoryRepository: {
          async getMemoryCandidateById() {
            return candidate({
              metadata: {}
            });
          },
          async promoteReviewedMemoryCandidate() {
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
          evidenceReviewedRef: "raw-evidence:run-event-1"
        }
      })
    ).rejects.toThrow("MemoryCandidate memory-candidate-1 requires candidate evidence provenance before promotion");

    expect(promoteCalled).toBe(false);
  });

  it("rejects promotion when candidate evidence is weak default-template provenance", async () => {
    let promoteCalled = false;

    await expect(
      promoteMemoryCandidateThroughGate({
        memoryRepository: {
          async getMemoryCandidateById() {
            return candidate({
              metadata: {
                reflectionCandidateEvidence: {
                  provenance: "default_template",
                  evidenceRefs: ["evidence-bundle-1:commands"],
                  doesNotProve: "This command row does not prove the command executed."
                }
              }
            });
          },
          async promoteReviewedMemoryCandidate() {
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
          evidenceReviewedRef: "raw-evidence:run-event-1"
        }
      })
    ).rejects.toThrow("MemoryCandidate memory-candidate-1 cannot be promoted from weak default-template evidence");

    expect(promoteCalled).toBe(false);
  });

  it("rejects promotion without raw evidence review reference", async () => {
    let promoteCalled = false;

    await expect(
      promoteMemoryCandidateThroughGate({
        memoryRepository: {
          async getMemoryCandidateById() {
            return candidate();
          },
          async promoteReviewedMemoryCandidate() {
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
          async promoteReviewedMemoryCandidate() {
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
        async promoteReviewedMemoryCandidate(input) {
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
    expectReviewableMemoryCandidateStatus(result.candidate.status);
    expect(result.candidate.status).toBe("candidate");
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

  it("uses the reviewed promotion port instead of raw candidate promotion", async () => {
    let capturedPromotion: PromoteMemoryCandidateInput | undefined;

    const result = await promoteMemoryCandidateThroughGate({
      memoryRepository: {
        async getMemoryCandidateById() {
          return candidate();
        },
        async promoteReviewedMemoryCandidate(input) {
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
        evidenceReviewedRef: "raw-evidence:run-event-1"
      }
    });

    expect(result.memoryRecord.id).toBe("memory-record-1");
    expectReviewableMemoryCandidateStatus(result.candidate.status);
    expect(result.candidate.status).toBe("candidate");
    expect(capturedPromotion).toMatchObject({
      candidateId: "memory-candidate-1",
      reviewer: "operator",
      decision: "accepted",
      metadata: {
        reviewGate: {
          evidenceReviewedRef: "raw-evidence:run-event-1"
        }
      }
    });
  });

  it("promotes a reviewed candidate into memory that can influence later activation", async () => {
    const result = await promoteMemoryCandidateThroughGate({
      memoryRepository: {
        async getMemoryCandidateById() {
          return candidate();
        },
        async promoteReviewedMemoryCandidate() {
          return memoryRecord({
            id: "memory-reviewed-graph-db"
          });
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
        evidenceReviewedRef: "raw-evidence:run-event-1"
      }
    });

    const ranked = rankCandidates([
      toMemoryCandidate(result.memoryRecord)
    ], buildMemoryQuery(task()));
    expectReviewableMemoryCandidateStatus(result.candidate.status);
    const context = assembleContext({
      id: "context-reviewed-memory",
      harnessPlanId: "harness-plan-1",
      candidates: applyContextROI(ranked, { maxInclusions: 1 }),
      createdAt: now
    });

    expect(context.inclusions).toEqual([expect.objectContaining({
      subjectType: "memory_record",
      subjectId: "memory-reviewed-graph-db"
    })]);
  });
});
