import { describe, expect, it } from "vitest";
import type {
  AntiMemoryCandidate,
  FeedbackDelta,
  MemoryRecord
} from "@krn/core";
import type {
  CreateAntiMemoryCandidateInput
} from "@krn/core/repositories/internal";

import {
  createFeedbackDeltaMaintenanceHandler
} from "../feedback-delta-maintenance-handler.js";
import {
  createExpireStaleMemoryMaintenanceHandler
} from "../expire-stale-memory-maintenance-handler.js";
import {
  recoverStaleMaintenanceQueueRecord,
  runMaintenanceQueueRecord
} from "../maintenance-queue-executor.js";
import type {
  CleanupTestMaintenanceQueuesInput,
  CleanupTestMaintenanceQueuesResult,
  ClaimMaintenanceQueueRecordInput,
  EnqueueMaintenanceQueueInput,
  MaintenanceQueueRecord,
  MaintenanceQueueRepository,
  RecoverStaleMaintenanceQueueRecordInput,
  RecordMaintenanceQueueRetryInput
} from "../maintenance-queue-types.js";

const isoNow = "2026-07-08T10:00:00.000Z";
const retryAt = "2026-07-08T10:05:00.000Z";
const staleLockCutoff = "2026-07-08T10:10:00.000Z";

const runningRecord = (
  input: Pick<MaintenanceQueueRecord, "jobType" | "payload"> &
    Partial<Pick<MaintenanceQueueRecord, "attempts" | "maxAttempts">>
): MaintenanceQueueRecord => ({
  id: "maintenance-queue-1",
  jobType: input.jobType,
  queueKey: `${input.jobType}:queue-key`,
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

  async recoverStaleMaintenanceQueueRecord(
    id: string,
    input: RecoverStaleMaintenanceQueueRecordInput
  ): Promise<MaintenanceQueueRecord> {
    this.calls.push(`recover-stale:${id}`);

    return {
      ...unlockedRecord(this.claimedRecord, "queued", input.error),
      runAfter: input.runAfter ?? this.claimedRecord.runAfter
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

class FakeExpireStaleMemoryMaintenanceRepository extends FakeFeedbackMaintenanceMemoryRepository {
  constructor(private readonly memoryRecords: readonly MemoryRecord[]) {
    super();
  }

  async listMemoryRecordsForProject(projectId: string, limit?: number): Promise<MemoryRecord[]> {
    return this.memoryRecords
      .filter((record) => record.projectId === projectId)
      .slice(0, limit ?? this.memoryRecords.length);
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

const memoryRecord = (
  input: Partial<MemoryRecord> = {}
): MemoryRecord => ({
  id: "memory-expired-1",
  projectId: "project-1",
  key: "frontend-template-standard",
  kind: "procedure",
  status: "active",
  summary: "Expired frontend template standard",
  body: "Old frontend template guidance that now needs review.",
  owner: "kernel",
  confidence: 90,
  applicationGuidance: "Use only if current source evidence still supports this memory.",
  invalidationRule: "Review when the validity window expires.",
  sourceLineage: [{
    sourceId: "source-claim-expired-memory-1",
    note: "test-source"
  }],
  isUserPreference: false,
  positiveFeedbackCount: 0,
  negativeFeedbackCount: 0,
  metadata: {},
  validFrom: "2026-07-01T00:00:00.000Z",
  validUntil: "2026-07-07T00:00:00.000Z",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
  ...input
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
    expect(result.queueRecordKeyUniqueness).toBe("db_unique_queue_key");
    expect(result.proves).toEqual([
      "A single queued maintenance record was claimed through the repository before settlement.",
      "The claimed payload was parsed for its job type before handler dispatch.",
      "The record was settled through the repository lifecycle after executor handling.",
      "Handler declared writes were checked against the job memory boundary before handler execution."
    ]);
    expect(result.doesNotProve).toEqual(expect.arrayContaining([
      "Explicit maintenance record execution does not prove autonomous scheduler or daemon readiness.",
      "Handler side effects still require focused tests or DB smoke evidence.",
      "Maintenance execution does not directly promote memory records or source claims."
    ]));
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

  it("recovers a stale running record without executing a handler or mutating truth", async () => {
    const repository = new FakeMaintenanceQueueRepository(
      runningRecord({
        jobType: "embed_memory_record",
        payload: {
          memoryRecordId: "memory-1",
          reason: "refresh memory embedding",
          embeddingModelId: "text-embedding-3-small"
        }
      })
    );

    const result = await recoverStaleMaintenanceQueueRecord({
      repository,
      recordId: "maintenance-queue-1",
      recovery: {
        lockedBefore: staleLockCutoff,
        error: "Recovered stale maintenance lock after process exit",
        runAfter: retryAt
      }
    });

    expect(result.status).toBe("recovered");
    expect(result.record.status).toBe("queued");
    expect(result.record.lockedAt).toBeUndefined();
    expect(result.record.lockedBy).toBeUndefined();
    expect(result.record.lastError).toBe("Recovered stale maintenance lock after process exit");
    expect(result.record.runAfter).toBe(retryAt);
    expect(result.staleLockCutoff).toBe(staleLockCutoff);
    expect(result.proves).toEqual([
      "A single running maintenance record was recovered through an explicit repository call.",
      "The recovery was guarded by a stale locked_at cutoff.",
      "The recovered record returned to queued state with lock metadata cleared."
    ]);
    expect(result.doesNotProve).toEqual(expect.arrayContaining([
      "Stale maintenance recovery does not prove autonomous scheduler or daemon readiness.",
      "Stale maintenance recovery does not prove handler idempotency after a process crash.",
      "Stale maintenance recovery does not directly promote memory records or source claims."
    ]));
    expect(repository.calls).toEqual(["recover-stale:maintenance-queue-1"]);
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
    expect(result.proves).toContain(
      "Handler declared writes were checked against the job memory boundary before handler execution."
    );
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
    expect(result.proves).not.toContain(
      "Handler declared writes were checked against the job memory boundary before handler execution."
    );
    expect(repository.calls).toEqual([
      "claim:maintenance-queue-1",
      "dead-letter:maintenance-queue-1"
    ]);
  });

  it("turns expired memory queue records into reviewable anti-memory candidates", async () => {
    const repository = new FakeMaintenanceQueueRepository(
      runningRecord({
        jobType: "expire_stale_memory",
        payload: {
          projectId: "project-1",
          reason: "review expired memory records",
          olderThan: "2026-07-08T00:00:00.000Z"
        }
      })
    );
    const memoryRepository = new FakeExpireStaleMemoryMaintenanceRepository([
      memoryRecord()
    ]);

    const result = await runMaintenanceQueueRecord({
      repository,
      recordId: "maintenance-queue-1",
      handlers: [
        createExpireStaleMemoryMaintenanceHandler({
          memoryRepository
        })
      ]
    });

    expect(result.status).toBe("succeeded");
    expect(result.handlerWriteBoundary).toMatchObject({
      jobType: "expire_stale_memory",
      memoryBoundary: "must_create_reviewed_invalidation_candidate",
      status: "passed",
      declaredWrites: ["anti_memory_candidates"]
    });
    expect(result.writeBoundary.allowedWrites).toEqual([
      "maintenance_queue_records",
      "outbox_events",
      "anti_memory_candidates"
    ]);
    expect(result.writeBoundary.forbiddenWrites).toEqual(expect.arrayContaining([
      "memory_records",
      "anti_memory_records"
    ]));
    expect(result.createdReviewCandidates).toEqual([{
      kind: "anti_memory_candidate",
      id: "anti-memory-candidate-1"
    }]);
    expect(memoryRepository.createdAntiMemoryCandidates).toHaveLength(1);
    expect(memoryRepository.createdAntiMemoryCandidates[0]).toMatchObject({
      proposedBy: "maintenance:expire_stale_memory",
      key: "memory-expired-1",
      appliesTo: "frontend-template-standard",
      status: "candidate",
      metadata: {
        kind: "krn.expireStaleMemoryMaintenanceCandidate.v1",
        maintenanceQueueRecordId: "maintenance-queue-1",
        memoryRecordId: "memory-expired-1",
        action: "review_memory_invalidation",
        reason: "expired_memory",
        mutation: "none"
      }
    });
    expect(memoryRepository.createdAntiMemoryCandidates[0]?.sourceLineage.map((item) =>
      item.sourceId
    )).toEqual(expect.arrayContaining([
      "maintenance_queue:maintenance-queue-1",
      "source-claim-expired-memory-1"
    ]));
    expect(repository.calls).toEqual(["claim:maintenance-queue-1", "success:maintenance-queue-1"]);
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
        sourceDecisionId: "source-decision-hurt-1",
        outcome: "hurt",
        reason: "The source decision caused the wrong maintenance action.",
        evidenceRefs: ["packet:abc", "test:feedback-maintenance"],
        doesNotProve: "Hurt feedback does not delete source authority without review."
      }, {
        sourceClaimId: "source-claim-helped-1",
        outcome: "helped",
        reason: "Useful source should stay retained.",
        evidenceRefs: ["packet:abc"],
        doesNotProve: "Helped feedback does not prove permanent truth."
      }],
      knowledgeUsefulnessOutcomes: [{
        knowledgeId: "knowledge:stale-standard-1",
        outcome: "stale",
        reason: "DecisionPacket selected a standard that newer evidence superseded.",
        evidenceRefs: ["packet:abc", "test:feedback-maintenance"],
        doesNotProve: "This feedback does not prove the standard is false globally."
      }, {
        knowledgeId: "knowledge:rejected-standard-1",
        outcome: "rejected",
        reason: "Reviewer rejected this retained knowledge path.",
        evidenceRefs: ["packet:abc", "test:feedback-maintenance"],
        doesNotProve: "Rejected feedback does not mutate Memory Core without review."
      }, {
        knowledgeId: "memory:helped-standard-1",
        outcome: "helped",
        reason: "Useful knowledge should stay retained.",
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
    expect(memoryRepository.createdAntiMemoryCandidates).toHaveLength(5);
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
    expect(memoryRepository.createdAntiMemoryCandidates[2]).toMatchObject({
      feedbackDeltaId: "feedback-delta-1",
      invalidatedBySourceClaimIds: [],
      appliesTo: "source_decision:source-decision-hurt-1",
      metadata: {
        outcome: "hurt",
        sourceDecisionId: "source-decision-hurt-1",
        recommendationActions: ["demote", "delete"],
        mutation: "none"
      }
    });
    expect(memoryRepository.createdAntiMemoryCandidates[3]).toMatchObject({
      feedbackDeltaId: "feedback-delta-1",
      invalidatedBySourceClaimIds: [],
      appliesTo: "knowledge:stale-standard-1",
      metadata: {
        outcome: "stale",
        knowledgeId: "knowledge:stale-standard-1",
        subjectRef: "memory_record:knowledge:stale-standard-1",
        mutation: "none"
      }
    });
    expect(memoryRepository.createdAntiMemoryCandidates[4]).toMatchObject({
      feedbackDeltaId: "feedback-delta-1",
      invalidatedBySourceClaimIds: [],
      appliesTo: "knowledge:rejected-standard-1",
      metadata: {
        outcome: "rejected",
        knowledgeId: "knowledge:rejected-standard-1",
        recommendationActions: ["delete"],
        subjectRef: "memory_record:knowledge:rejected-standard-1",
        mutation: "none"
      }
    });
    expect(repository.calls).toEqual(["claim:maintenance-queue-1", "success:maintenance-queue-1"]);
  });
});
