import {
  describe,
  expect,
  it
} from "vitest";
import type {
  AntiMemoryCandidate,
  FeedbackDelta
} from "@krn/core";
import type {
  CreateAntiMemoryCandidateInput
} from "@krn/core/repositories/internal";
import type {
  MaintenanceQueueRecord,
  MaintenanceQueueRepository,
  ClaimMaintenanceQueueRecordInput,
  CleanupTestMaintenanceQueuesInput,
  CleanupTestMaintenanceQueuesResult,
  EnqueueMaintenanceQueueInput,
  RecoverStaleMaintenanceQueueRecordInput,
  RecordMaintenanceQueueRetryInput
} from "@krn/db/adapters";

import {
  runMaintenanceQueueCommand
} from "../run-maintenance-queue-command.js";

const now = "2026-07-09T12:00:00.000Z";

const runningFeedbackRecord: MaintenanceQueueRecord = {
  id: "maintenance-queue-1",
  jobType: "review_feedback_delta",
  queueKey: "review_feedback_delta:project-1:feedback-delta-1",
  status: "running",
  payload: {
    projectId: "project-1",
    feedbackDeltaId: "feedback-delta-1",
    reason: "review feedback from DecisionPacket return loop"
  },
  attempts: 0,
  maxAttempts: 3,
  runAfter: now,
  lockedAt: now,
  lockedBy: "krn-cli-maintenance-run",
  createdAt: now,
  updatedAt: now
};

const feedbackDelta: FeedbackDelta = {
  id: "feedback-delta-1",
  reviewAssessmentId: "review-1",
  status: "candidate",
  memoryCandidates: [],
  sourceDecisions: [],
  evalCandidates: [],
  metadata: {
    knowledgeUsefulnessOutcomes: [{
      knowledgeId: "knowledge:stale-frontend-standard",
      outcome: "stale",
      reason: "DecisionPacket selected a frontend standard superseded by newer source evidence.",
      evidenceRefs: ["packet:abc", "test:maintenance-run"],
      doesNotProve: "This feedback does not prove the knowledge is false globally."
    }]
  },
  createdAt: now,
  updatedAt: now
};

class FakeMaintenanceQueueRepository implements MaintenanceQueueRepository {
  readonly calls: string[] = [];

  async enqueueMaintenanceQueue(
    _input: EnqueueMaintenanceQueueInput
  ): Promise<MaintenanceQueueRecord> {
    throw new Error("enqueueMaintenanceQueue should not be called");
  }

  async listQueuedMaintenanceQueues(_limit: number): Promise<MaintenanceQueueRecord[]> {
    throw new Error("listQueuedMaintenanceQueues should not be called");
  }

  async claimMaintenanceQueueRecord(
    id: string,
    input?: ClaimMaintenanceQueueRecordInput
  ): Promise<MaintenanceQueueRecord> {
    this.calls.push(`claim:${id}:${input?.lockedBy ?? "unlocked"}`);

    return runningFeedbackRecord;
  }

  async recordMaintenanceQueueSuccess(id: string): Promise<MaintenanceQueueRecord> {
    this.calls.push(`success:${id}`);

    return {
      id: runningFeedbackRecord.id,
      jobType: runningFeedbackRecord.jobType,
      queueKey: runningFeedbackRecord.queueKey,
      status: "succeeded",
      payload: runningFeedbackRecord.payload,
      attempts: runningFeedbackRecord.attempts,
      maxAttempts: runningFeedbackRecord.maxAttempts,
      runAfter: runningFeedbackRecord.runAfter,
      createdAt: runningFeedbackRecord.createdAt,
      updatedAt: now
    };
  }

  async recordMaintenanceQueueRetry(
    _id: string,
    _input: RecordMaintenanceQueueRetryInput
  ): Promise<MaintenanceQueueRecord> {
    throw new Error("recordMaintenanceQueueRetry should not be called");
  }

  async recoverStaleMaintenanceQueueRecord(
    id: string,
    input: RecoverStaleMaintenanceQueueRecordInput
  ): Promise<MaintenanceQueueRecord> {
    this.calls.push(`recover:${id}:${input.lockedBefore}`);

    return {
      id: runningFeedbackRecord.id,
      jobType: runningFeedbackRecord.jobType,
      queueKey: runningFeedbackRecord.queueKey,
      status: "queued",
      payload: runningFeedbackRecord.payload,
      attempts: runningFeedbackRecord.attempts,
      maxAttempts: runningFeedbackRecord.maxAttempts,
      runAfter: runningFeedbackRecord.runAfter,
      createdAt: runningFeedbackRecord.createdAt,
      updatedAt: now
    };
  }

  async recordMaintenanceQueueDeadLetter(
    _id: string,
    _error: string
  ): Promise<MaintenanceQueueRecord> {
    throw new Error("recordMaintenanceQueueDeadLetter should not be called");
  }

  async recordMaintenanceQueueSkip(
    _id: string,
    _reason: string
  ): Promise<MaintenanceQueueRecord> {
    throw new Error("recordMaintenanceQueueSkip should not be called");
  }

  async cleanupTestMaintenanceQueues(
    _input: CleanupTestMaintenanceQueuesInput
  ): Promise<CleanupTestMaintenanceQueuesResult> {
    throw new Error("cleanupTestMaintenanceQueues should not be called");
  }
}

describe("runMaintenanceQueueCommand", () => {
  it("runs one queued feedback maintenance record through the explicit executor", async () => {
    const maintenanceQueueRepository = new FakeMaintenanceQueueRepository();
    const antiMemoryCandidates: CreateAntiMemoryCandidateInput[] = [];
    let closed = false;

    const result = await runMaintenanceQueueCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "maintenanceRun",
        id: "maintenance-queue-1"
      },
      createMaintenanceQueueDatabaseRuntime: async () => ({
        maintenanceQueueRepository,
        harnessRunRepository: {
          async getFeedbackDeltaForProject(projectId, feedbackDeltaId) {
            expect(projectId).toBe("project-1");
            expect(feedbackDeltaId).toBe("feedback-delta-1");

            return {
              status: "found",
              feedbackDelta
            };
          }
        },
        memoryRepository: {
          async listMemoryRecordsForProject() {
            throw new Error("listMemoryRecordsForProject should not be called");
          },
          async createAntiMemoryCandidate(input) {
            antiMemoryCandidates.push(input);

            return {
              id: "anti-memory-candidate-1",
              projectId: input.projectId,
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
              validFrom: input.validFrom ?? now,
              metadata: input.metadata ?? {},
              createdAt: now,
              updatedAt: now
            } satisfies AntiMemoryCandidate;
          }
        },
        sourceRepository: {
          async getSourceDecisionById() {
            return undefined;
          }
        },
        async close() {
          closed = true;
        }
      })
    });

    expect(maintenanceQueueRepository.calls).toEqual([
      "claim:maintenance-queue-1:krn-cli-maintenance-run",
      "success:maintenance-queue-1"
    ]);
    expect(antiMemoryCandidates).toHaveLength(1);
    expect(antiMemoryCandidates[0]).toMatchObject({
      projectId: "project-1",
      feedbackDeltaId: "feedback-delta-1",
      proposedBy: "maintenance:review_feedback_delta",
      appliesTo: "knowledge:stale-frontend-standard",
      metadata: {
        outcome: "stale",
        mutation: "none"
      }
    });
    expect(closed).toBe(true);
    expect(result.stdout).toContain("KRN Maintenance Queue Run");
    expect(result.stdout).toContain("status: succeeded");
    expect(result.stdout).toContain("jobType: review_feedback_delta");
    expect(result.stdout).toContain("recordId: maintenance-queue-1");
    expect(result.stdout).toContain("handlerWriteBoundary:");
    expect(result.stdout).toContain("status: passed");
    expect(result.stdout).toContain("createdReviewCandidates:");
    expect(result.stdout).toContain("- anti_memory_candidate:anti-memory-candidate-1");
    expect(result.stdout).toContain(
      "Explicit maintenance record execution does not prove autonomous scheduler or daemon readiness."
    );
  });

  it("recovers one stale running maintenance record through the explicit executor", async () => {
    const maintenanceQueueRepository = new FakeMaintenanceQueueRepository();
    let closed = false;

    const result = await runMaintenanceQueueCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "maintenanceRecover",
        id: "maintenance-queue-1",
        lockedBefore: "2026-07-09T11:59:00.000Z"
      },
      createMaintenanceQueueDatabaseRuntime: async () => ({
        maintenanceQueueRepository,
        harnessRunRepository: {
          async getFeedbackDeltaForProject() {
            throw new Error("getFeedbackDeltaForProject should not be called");
          }
        },
        memoryRepository: {
          async listMemoryRecordsForProject() {
            throw new Error("listMemoryRecordsForProject should not be called");
          },
          async createAntiMemoryCandidate() {
            throw new Error("createAntiMemoryCandidate should not be called");
          }
        },
        sourceRepository: {
          async getSourceDecisionById() {
            throw new Error("getSourceDecisionById should not be called");
          }
        },
        async close() {
          closed = true;
        }
      })
    });

    expect(maintenanceQueueRepository.calls).toEqual([
      "recover:maintenance-queue-1:2026-07-09T11:59:00.000Z"
    ]);
    expect(closed).toBe(true);
    expect(result.stdout).toContain("KRN Maintenance Queue Recovery");
    expect(result.stdout).toContain("status: recovered");
    expect(result.stdout).toContain("jobType: review_feedback_delta");
    expect(result.stdout).toContain("recordId: maintenance-queue-1");
    expect(result.stdout).toContain("recordStatus: queued");
    expect(result.stdout).toContain("staleLockCutoff: 2026-07-09T11:59:00.000Z");
    expect(result.stdout).toContain("queueRecordKeyUniqueness: db_unique_queue_key");
    expect(result.stdout).toContain(
      "Stale maintenance recovery does not prove autonomous scheduler or daemon readiness."
    );
    expect(result.stdout).toContain(
      "Stale maintenance recovery does not directly promote memory records or source claims."
    );
  });

  it("requires database configuration", async () => {
    await expect(runMaintenanceQueueCommand({
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "maintenanceRun",
        id: "maintenance-queue-1"
      }
    })).rejects.toThrow("KRN_DATABASE_URL is required for krn maintenance run");
  });

  it("requires database configuration for stale recovery", async () => {
    await expect(runMaintenanceQueueCommand({
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      command: {
        kind: "maintenanceRecover",
        id: "maintenance-queue-1",
        lockedBefore: "2026-07-09T11:59:00.000Z"
      }
    })).rejects.toThrow("KRN_DATABASE_URL is required for krn maintenance recover");
  });
});
