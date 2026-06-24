import { describe, expect, it } from "vitest";

import type {
  AntiMemoryCandidate,
  AntiMemoryRecord,
  SourceClaim
} from "@krn/core";
import type {
  PromoteAntiMemoryCandidateInput
} from "../repositories/memoryRepository.js";
import {
  promoteAntiMemoryCandidateThroughGate
} from "./antiMemoryReviewGate.js";

const now = "2026-06-23T00:00:00.000Z";

const candidate = (
  overrides: Partial<AntiMemoryCandidate> = {}
): AntiMemoryCandidate => ({
  id: "anti-memory-candidate-1",
  projectId: "project-1",
  executionRunId: "execution-run-1",
  proposedBy: "reflection",
  key: "anti-markdown-runtime-memory",
  status: "candidate",
  rejectedClaim: "Markdown files are KRN runtime memory",
  reason: "KRN runtime memory is Postgres-backed; markdown can be source/export only.",
  invalidatedBySourceClaimIds: ["source-claim-1"],
  sourceLineage: [{ sourceId: "source-claim-1" }],
  summary: "Do not treat markdown as runtime memory.",
  body: "Markdown may be source, export, audit, seed, or backup, not Memory Core.",
  owner: "operator",
  confidence: 90,
  validFrom: now,
  metadata: {
    reflectionCandidateEvidence: {
      provenance: "source_claim",
      evidenceRefs: ["source-claim-1"],
      doesNotProve: "This does not prove the anti-memory candidate is reviewed."
    }
  },
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const sourceClaim = (): SourceClaim => ({
  id: "source-claim-1",
  sourceArtifactId: "source-artifact-1",
  claim: "KRN runtime memory is store-backed.",
  mechanism: "Memory Core writes go through Postgres-backed repositories.",
  krnImplication: "Markdown cannot be treated as runtime Memory Core.",
  doesNotProve: "This does not prove markdown cannot be source material.",
  trustTier: "project-decision",
  supportType: "implementation-boundary",
  consumer: "anti-memory-review-gate",
  status: "accepted",
  metadata: {},
  createdAt: now,
  updatedAt: now
});

const antiMemoryRecord = (): AntiMemoryRecord => ({
  id: "anti-memory-record-1",
  projectId: "project-1",
  executionRunId: "execution-run-1",
  createdFromCandidateId: "anti-memory-candidate-1",
  key: "anti-markdown-runtime-memory",
  rejectedClaim: "Markdown files are KRN runtime memory",
  reason: "KRN runtime memory is Postgres-backed; markdown can be source/export only.",
  invalidatedBySourceClaimIds: ["source-claim-1"],
  summary: "Do not treat markdown as runtime memory.",
  body: "Markdown may be source, export, audit, seed, or backup, not Memory Core.",
  owner: "operator",
  confidence: 90,
  sourceLineage: [{ sourceId: "source-claim-1" }],
  validFrom: now,
  metadata: {},
  createdAt: now,
  updatedAt: now
});

const expectReviewableAntiMemoryCandidateStatus = (
  _status: "proposed" | "candidate"
): void => {};

describe("promoteAntiMemoryCandidateThroughGate", () => {
  it("rejects promotion when candidate evidence provenance is missing", async () => {
    let promoteCalled = false;

    await expect(
      promoteAntiMemoryCandidateThroughGate({
        memoryRepository: {
          async getAntiMemoryCandidateById() {
            return candidate({ metadata: {} });
          },
          async promoteReviewedAntiMemoryCandidate() {
            promoteCalled = true;
            return antiMemoryRecord();
          }
        },
        sourceRepository: {
          async getSourceClaimById() {
            return sourceClaim();
          }
        },
        review: {
          candidateId: "anti-memory-candidate-1",
          reviewer: "operator",
          evidenceReviewedRef: "source-claim-1"
        }
      })
    ).rejects.toThrow(
      "AntiMemoryCandidate anti-memory-candidate-1 requires candidate evidence provenance before promotion"
    );

    expect(promoteCalled).toBe(false);
  });

  it("rejects promotion when candidate evidence is weak default-template provenance", async () => {
    let promoteCalled = false;

    await expect(
      promoteAntiMemoryCandidateThroughGate({
        memoryRepository: {
          async getAntiMemoryCandidateById() {
            return candidate({
              metadata: {
                reflectionCandidateEvidence: {
                  provenance: "default_template",
                  evidenceRefs: ["evidence-bundle-1:commands"],
                  doesNotProve: "This command row does not prove verification ran."
                }
              }
            });
          },
          async promoteReviewedAntiMemoryCandidate() {
            promoteCalled = true;
            return antiMemoryRecord();
          }
        },
        sourceRepository: {
          async getSourceClaimById() {
            return sourceClaim();
          }
        },
        review: {
          candidateId: "anti-memory-candidate-1",
          reviewer: "operator",
          evidenceReviewedRef: "source-claim-1"
        }
      })
    ).rejects.toThrow(
      "AntiMemoryCandidate anti-memory-candidate-1 cannot be promoted from weak default-template evidence"
    );

    expect(promoteCalled).toBe(false);
  });

  it("promotes an approved anti-memory candidate through the reviewed port", async () => {
    let capturedPromotion: PromoteAntiMemoryCandidateInput | undefined;

    const result = await promoteAntiMemoryCandidateThroughGate({
      memoryRepository: {
        async getAntiMemoryCandidateById() {
          return candidate();
        },
        async promoteReviewedAntiMemoryCandidate(input) {
          capturedPromotion = input;
          return antiMemoryRecord();
        }
      },
      sourceRepository: {
        async getSourceClaimById() {
          return sourceClaim();
        }
      },
      review: {
        candidateId: "anti-memory-candidate-1",
        reviewer: "operator",
        evidenceReviewedRef: "source-claim-1",
        metadata: {
          reviewNote: "inspected source claim"
        }
      }
    });

    expect(result.antiMemoryRecord.id).toBe("anti-memory-record-1");
    expectReviewableAntiMemoryCandidateStatus(result.candidate.status);
    expect(result.candidate.status).toBe("candidate");
    expect(result.reviewedSourceClaims).toHaveLength(1);
    expect(capturedPromotion).toMatchObject({
      candidateId: "anti-memory-candidate-1",
      reviewer: "operator",
      decision: "accepted",
      metadata: {
        reviewNote: "inspected source claim",
        reviewGate: {
          evidenceReviewedRef: "source-claim-1",
          invalidatedSourceClaimIds: ["source-claim-1"]
        }
      }
    });
  });
});
