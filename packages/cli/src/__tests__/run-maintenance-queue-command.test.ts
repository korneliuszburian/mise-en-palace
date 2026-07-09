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
      ...runningFeedbackRecord,
      status: "succeeded",
      lockedAt: undefined,
      lockedBy: undefined,
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
    _id: string,
    _input: RecoverStaleMaintenanceQueueRecordInput
  ): Promise<MaintenanceQueueRecord> {
    throw new Error("recoverStaleMaintenanceQueueRecord should not be called");
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
          async listFeedbackDeltasForProject(projectId, limit) {
            expect(projectId).toBe("project-1");
            expect(limit).toBe(500);

            return [feedbackDelta];
          }
        },
        memoryRepository: {
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
});
