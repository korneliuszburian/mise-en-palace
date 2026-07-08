import { describe, expect, it } from "vitest";
import type {
  AntiMemoryCandidate,
  FeedbackDelta
} from "@krn/core";
import type {
  CreateAntiMemoryCandidateInput
} from "@krn/harness/repositories/internal";

import {
  createFeedbackDeltaMaintenanceHandler
} from "../feedback-delta-maintenance-handler.js";
import {
  runMaintenanceQueueRecord
} from "../maintenance-queue-executor.js";
import type {
  CleanupTestMaintenanceQueuesInput,
  CleanupTestMaintenanceQueuesResult,
  ClaimMaintenanceQueueRecordInput,
  EnqueueMaintenanceQueueInput,
  MaintenanceQueueRecord,
  MaintenanceQueueRepository,
  RecordMaintenanceQueueRetryInput
} from "../maintenance-queue-types.js";

const isoNow = "2026-07-08T10:00:00.000Z";
const retryAt = "2026-07-08T10:05:00.000Z";

const runningRecord = (
  input: Pick<MaintenanceQueueRecord, "jobType" | "payload"> &
    Partial<Pick<MaintenanceQueueRecord, "attempts" | "maxAttempts">>
): MaintenanceQueueRecord => ({
  id: "maintenance-queue-1",
  jobType: input.jobType,
  status: "running",
  payload: input.payload,
  attempts: input.attempts ?? 0,
  maxAttempts: input.maxAttempts ?? 3,
  runAfter: isoNow,
  lockedAt: isoNow,
  lockedBy: "maintenance-test",
  createdAt: isoNow,
  updatedAt: isoNow
});

const unlockedRecord = (
  record: MaintenanceQueueRecord,
  status: MaintenanceQueueRecord["status"],
  lastError?: string
): MaintenanceQueueRecord => {
  const {
    lockedAt: _lockedAt,
    lockedBy: _lockedBy,
    ...rest
  } = record;

  return {
    ...rest,
    status,
    ...(lastError === undefined ? {} : { lastError })
  };
};

class FakeMaintenanceQueueRepository implements MaintenanceQueueRepository {
  readonly calls: string[] = [];

  constructor(private readonly claimedRecord: MaintenanceQueueRecord) {}

  async enqueueMaintenanceQueue(
    _input: EnqueueMaintenanceQueueInput
  ): Promise<MaintenanceQueueRecord> {
    throw new Error("enqueueMaintenanceQueue is not used by executor tests");
  }

  async listQueuedMaintenanceQueues(_limit: number): Promise<MaintenanceQueueRecord[]> {
    throw new Error("listQueuedMaintenanceQueues is not used by executor tests");
  }

  async claimMaintenanceQueueRecord(
    id: string,
    _input?: ClaimMaintenanceQueueRecordInput
  ): Promise<MaintenanceQueueRecord> {
    this.calls.push(`claim:${id}`);

    return this.claimedRecord;
  }

  async recordMaintenanceQueueSuccess(id: string): Promise<MaintenanceQueueRecord> {
    this.calls.push(`success:${id}`);

    return unlockedRecord(this.claimedRecord, "succeeded");
  }

  async recordMaintenanceQueueRetry(
    id: string,
    input: RecordMaintenanceQueueRetryInput
  ): Promise<MaintenanceQueueRecord> {
    this.calls.push(`retry:${id}`);

    return {
      ...unlockedRecord(this.claimedRecord, "queued", input.error),
      attempts: this.claimedRecord.attempts + 1,
      runAfter: input.runAfter ?? isoNow
    };
  }

  async recordMaintenanceQueueDeadLetter(
    id: string,
    error: string
  ): Promise<MaintenanceQueueRecord> {
    this.calls.push(`dead-letter:${id}`);

    return {
      ...unlockedRecord(this.claimedRecord, "dead_letter", error),
      attempts: this.claimedRecord.attempts + 1
    };
  }

  async recordMaintenanceQueueSkip(id: string, reason: string): Promise<MaintenanceQueueRecord> {
    this.calls.push(`skip:${id}`);

    return unlockedRecord(this.claimedRecord, "skipped", reason);
  }

  async cleanupTestMaintenanceQueues(
    _input: CleanupTestMaintenanceQueuesInput
  ): Promise<CleanupTestMaintenanceQueuesResult> {
    throw new Error("cleanupTestMaintenanceQueues is not used by executor tests");
  }
}

class FakeFeedbackMaintenanceMemoryRepository {
  readonly createdAntiMemoryCandidates: CreateAntiMemoryCandidateInput[] = [];

  async createAntiMemoryCandidate(
    input: CreateAntiMemoryCandidateInput
  ): Promise<AntiMemoryCandidate> {
    this.createdAntiMemoryCandidates.push(input);

    return {
      id: `anti-memory-candidate-${this.createdAntiMemoryCandidates.length}`,
      projectId: input.projectId,
      feedbackDeltaId: input.feedbackDeltaId ?? "feedback-delta-test",
      proposedBy: input.proposedBy,
      key: input.key,
      status: input.status ?? "candidate",
      rejectedClaim: input.rejectedClaim ?? "",
      reason: input.reason ?? "",
      invalidatedBySourceClaimIds: input.invalidatedBySourceClaimIds ?? [],
      appliesTo: input.appliesTo ?? "",
      summary: input.summary,
      body: input.body,
      owner: input.owner,
      confidence: input.confidence,
      sourceLineage: input.sourceLineage,
      validFrom: input.validFrom ?? isoNow,
      metadata: input.metadata ?? {},
      createdAt: isoNow,
      updatedAt: isoNow
    };
  }
}

const feedbackDelta = (metadata: Record<string, unknown>): FeedbackDelta => ({
  id: "feedback-delta-1",
  reviewAssessmentId: "review-1",
  status: "candidate",
  memoryCandidates: [],
  sourceDecisions: [],
  evalCandidates: [],
  metadata,
  createdAt: isoNow,
  updatedAt: isoNow
});

describe("runMaintenanceQueueRecord", () => {
  it("claims a record, validates payload, checks declared writes, and records success", async () => {
    const repository = new FakeMaintenanceQueueRepository(
      runningRecord({
        jobType: "embed_source_chunk",
        payload: {
          sourceChunkId: "source-chunk-1",
          reason: "embed current source chunk",
          embeddingModelId: "text-embedding-3-small"
        }
      })
    );

    const result = await runMaintenanceQueueRecord({
      repository,
      recordId: "maintenance-queue-1",
      handlers: [
        {
          jobType: "embed_source_chunk",
          declaredWrites: ["embeddings"],
          run: async ({ job }) => {
            expect(job.payload).toEqual({
              sourceChunkId: "source-chunk-1",
              reason: "embed current source chunk",
              embeddingModelId: "text-embedding-3-small"
            });

            return { status: "succeeded" };
          }
        }
      ]
    });

    expect(result.status).toBe("succeeded");
    expect(result.record.status).toBe("succeeded");
    expect(result.queueRecordKeyUniqueness).toBe("not_enforced_by_executor");
    expect(repository.calls).toEqual(["claim:maintenance-queue-1", "success:maintenance-queue-1"]);
  });

  it("requeues a retryable handler failure while attempts remain", async () => {
    const repository = new FakeMaintenanceQueueRepository(
      runningRecord({
        jobType: "embed_memory_record",
        payload: {
          memoryRecordId: "memory-1",
          reason: "refresh memory embedding",
          embeddingModelId: "text-embedding-3-small"
        },
        attempts: 0,
        maxAttempts: 2
      })
    );

    const result = await runMaintenanceQueueRecord({
      repository,
      recordId: "maintenance-queue-1",
      handlers: [
        {
          jobType: "embed_memory_record",
          declaredWrites: ["embeddings"],
          run: async () => ({
            status: "failed",
            error: "embedding endpoint unavailable",
            retryAfter: retryAt
          })
        }
      ]
    });

    expect(result.status).toBe("retried");
    expect(result.record.status).toBe("queued");
    expect(result.record.attempts).toBe(1);
    expect(result.record.runAfter).toBe(retryAt);
    expect(repository.calls).toEqual(["claim:maintenance-queue-1", "retry:maintenance-queue-1"]);
  });

  it("dead-letters a failed record when no attempts remain", async () => {
    const repository = new FakeMaintenanceQueueRepository(
      runningRecord({
        jobType: "embed_memory_record",
        payload: {
          memoryRecordId: "memory-1",
          reason: "refresh memory embedding",
          embeddingModelId: "text-embedding-3-small"
        },
        attempts: 1,
        maxAttempts: 2
      })
    );

    const result = await runMaintenanceQueueRecord({
      repository,
      recordId: "maintenance-queue-1",
      handlers: [
        {
          jobType: "embed_memory_record",
          declaredWrites: ["embeddings"],
          run: async () => ({
            status: "failed",
            error: "embedding endpoint unavailable"
          })
        }
      ]
    });

    expect(result.status).toBe("dead_lettered");
    expect(result.record.status).toBe("dead_letter");
    expect(result.record.attempts).toBe(2);
    expect(repository.calls).toEqual([
      "claim:maintenance-queue-1",
      "dead-letter:maintenance-queue-1"
    ]);
  });

  it("dead-letters unsafe handler write declarations before running the handler", async () => {
    let handlerRan = false;
    const repository = new FakeMaintenanceQueueRepository(
      runningRecord({
        jobType: "compact_memory",
        payload: {
          projectId: "project-1",
          reason: "compact stale records"
        },
        maxAttempts: 1
      })
    );

    const result = await runMaintenanceQueueRecord({
      repository,
      recordId: "maintenance-queue-1",
      handlers: [
        {
          jobType: "compact_memory",
          declaredWrites: ["memory_records"],
          run: async () => {
            handlerRan = true;

            return { status: "succeeded" };
          }
        }
      ]
    });

    expect(handlerRan).toBe(false);
    expect(result.status).toBe("dead_lettered");
    expect(result.handlerWriteBoundary?.status).toBe("failed");
    expect(result.record.status).toBe("dead_letter");
  });

  it("dead-letters invalid DB payloads before handler dispatch", async () => {
    const repository = new FakeMaintenanceQueueRepository(
      runningRecord({
        jobType: "embed_source_chunk",
        payload: {
          sourceChunkId: "source-chunk-1",
          reason: "missing embedding model"
        },
        maxAttempts: 1
      })
    );

    const result = await runMaintenanceQueueRecord({
      repository,
      recordId: "maintenance-queue-1",
      handlers: [
        {
          jobType: "embed_source_chunk",
          declaredWrites: ["embeddings"],
          run: async () => {
            throw new Error("handler should not run");
          }
        }
      ]
    });

    expect(result.status).toBe("dead_lettered");
    expect(result.record.lastError).toBe("Invalid maintenance payload for embed_source_chunk");
    expect(repository.calls).toEqual([
      "claim:maintenance-queue-1",
      "dead-letter:maintenance-queue-1"
    ]);
  });

  it("turns stale source feedback into reviewable anti-memory candidates", async () => {
    const repository = new FakeMaintenanceQueueRepository(
      runningRecord({
        jobType: "review_feedback_delta",
        payload: {
          projectId: "project-1",
          feedbackDeltaId: "feedback-delta-1",
          reason: "review stale source feedback"
        }
      })
    );
    const memoryRepository = new FakeFeedbackMaintenanceMemoryRepository();
    const feedback = feedbackDelta({
      sourceUsefulnessOutcomes: [{
        sourceClaimId: "source-claim-stale-1",
        outcome: "stale",
        reason: "DecisionPacket selected source guidance that no longer matched the task.",
        evidenceRefs: ["packet:abc", "test:feedback-maintenance"],
        doesNotProve: "This feedback does not prove the source claim is false globally."
      }, {
        sourceDecisionId: "source-decision-unknown-1",
        outcome: "unknown",
        reason: "The run did not establish whether the source decision helped.",
        evidenceRefs: ["packet:abc"],
        doesNotProve: "Unknown usefulness does not prove the source decision is wrong."
      }, {
        sourceClaimId: "source-claim-helped-1",
        outcome: "helped",
        reason: "Useful source should stay retained.",
        evidenceRefs: ["packet:abc"],
        doesNotProve: "Helped feedback does not prove permanent truth."
      }]
    });

    const result = await runMaintenanceQueueRecord({
      repository,
      recordId: "maintenance-queue-1",
      handlers: [
        createFeedbackDeltaMaintenanceHandler({
          harnessRunRepository: {
            async listFeedbackDeltasForProject(projectId, limit) {
              expect(projectId).toBe("project-1");
              expect(limit).toBe(500);

              return [feedback];
            }
          },
          memoryRepository,
          now: () => isoNow
        })
      ]
    });

    expect(result.status).toBe("succeeded");
    expect(result.handlerWriteBoundary).toMatchObject({
      jobType: "review_feedback_delta",
      memoryBoundary: "write_feedback_candidate_only",
      status: "passed",
      declaredWrites: ["anti_memory_candidates"]
    });
    expect(result.writeBoundary.forbiddenWrites).toEqual(expect.arrayContaining([
      "memory_records",
      "anti_memory_records",
      "source_claims",
      "source_decisions"
    ]));
    expect(memoryRepository.createdAntiMemoryCandidates).toHaveLength(2);
    expect(memoryRepository.createdAntiMemoryCandidates[0]).toMatchObject({
      feedbackDeltaId: "feedback-delta-1",
      proposedBy: "maintenance:review_feedback_delta",
      invalidatedBySourceClaimIds: ["source-claim-stale-1"],
      appliesTo: "source_claim:source-claim-stale-1",
      metadata: {
        kind: "krn.feedbackMaintenanceCandidate.v1",
        outcome: "stale",
        mutation: "none"
      }
    });
    expect(memoryRepository.createdAntiMemoryCandidates[1]).toMatchObject({
      feedbackDeltaId: "feedback-delta-1",
      invalidatedBySourceClaimIds: [],
      appliesTo: "source_decision:source-decision-unknown-1",
      metadata: {
        outcome: "unknown",
        sourceDecisionId: "source-decision-unknown-1"
      }
    });
    expect(repository.calls).toEqual(["claim:maintenance-queue-1", "success:maintenance-queue-1"]);
  });
});
