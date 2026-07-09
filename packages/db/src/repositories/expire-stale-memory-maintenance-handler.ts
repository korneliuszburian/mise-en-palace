import {
  buildMemoryStalenessMaintenancePreview
} from "@krn/core";
import type {
  MemoryStalenessMaintenanceCandidate
} from "@krn/core";
import type {
  CreateAntiMemoryCandidateInput,
  MemoryRepository
} from "@krn/core/repositories/internal";

import type {
  MaintenanceQueueCreatedReviewCandidate,
  MaintenanceQueueHandler
} from "./maintenance-queue-executor.js";

export interface CreateExpireStaleMemoryMaintenanceHandlerInput {
  readonly memoryRepository: Pick<
    MemoryRepository,
    "listMemoryRecordsForProject" | "createAntiMemoryCandidate"
  >;
  readonly maxMemoryRecords?: number;
  readonly maxCandidates?: number;
}

const unique = (values: readonly string[]): string[] => [
  ...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))
];

const sourceLineageFor = (
  candidate: MemoryStalenessMaintenanceCandidate,
  maintenanceQueueRecordId: string
): CreateAntiMemoryCandidateInput["sourceLineage"] =>
  unique([
    `maintenance_queue:${maintenanceQueueRecordId}`,
    ...candidate.sourceLineageRefs,
    ...candidate.evidenceRefs
  ]).map((sourceId) => ({
    sourceId,
    note: "expire-stale-memory-maintenance"
  }));

const antiMemoryCandidateFor = (input: {
  readonly candidate: MemoryStalenessMaintenanceCandidate;
  readonly maintenanceQueueRecordId: string;
  readonly projectId: string;
  readonly observedAt: string;
}): CreateAntiMemoryCandidateInput => {
  const { candidate } = input;

  return {
    projectId: input.projectId,
    proposedBy: "maintenance:expire_stale_memory",
    key: candidate.memoryRecordId,
    status: "candidate",
    rejectedClaim:
      `Continue using memory ${candidate.memoryRecordId} without ${candidate.action}.`,
    reason: candidate.invalidationIntent,
    appliesTo: candidate.memoryKey,
    summary: candidate.summary,
    body:
      `Maintenance job ${input.maintenanceQueueRecordId} proposed ${candidate.action} ` +
      `for memory ${candidate.memoryRecordId}. Reason: ${candidate.reason}.`,
    owner: "maintenance-stale-memory",
    confidence: 70,
    sourceLineage: sourceLineageFor(candidate, input.maintenanceQueueRecordId),
    validFrom: input.observedAt,
    metadata: {
      kind: "krn.expireStaleMemoryMaintenanceCandidate.v1",
      maintenanceQueueRecordId: input.maintenanceQueueRecordId,
      memoryRecordId: candidate.memoryRecordId,
      memoryKey: candidate.memoryKey,
      action: candidate.action,
      reason: candidate.reason,
      evidenceRefs: candidate.evidenceRefs,
      reviewabilityReasons: candidate.reviewabilityReasons,
      mutation: "none",
      doesNotProve: candidate.doesNotProve
    }
  };
};

const readyInvalidationCandidates = (
  candidates: readonly MemoryStalenessMaintenanceCandidate[]
): MemoryStalenessMaintenanceCandidate[] => candidates.filter((candidate) =>
  candidate.reviewability === "ready" &&
  candidate.action === "review_memory_invalidation"
);

export const createExpireStaleMemoryMaintenanceHandler = (
  input: CreateExpireStaleMemoryMaintenanceHandlerInput
): MaintenanceQueueHandler => ({
  jobType: "expire_stale_memory",
  declaredWrites: ["anti_memory_candidates"],
  async run({ job, record }) {
    if (job.jobType !== "expire_stale_memory") {
      return {
        status: "skipped",
        reason: `Expire-stale-memory handler cannot process ${job.jobType}`
      };
    }

    const memoryRecords = await input.memoryRepository.listMemoryRecordsForProject(
      job.payload.projectId,
      input.maxMemoryRecords ?? 500
    );
    const preview = buildMemoryStalenessMaintenancePreview({
      now: job.payload.olderThan,
      memoryRecords,
      evidenceRef: `maintenance_queue:${record.id}`,
      nearExpiryDays: 0,
      ...(input.maxCandidates === undefined ? {} : { maxCandidates: input.maxCandidates })
    });
    const candidates = readyInvalidationCandidates(preview.candidates);

    if (candidates.length === 0) {
      return {
        status: "skipped",
        reason:
          `No reviewable expired memory candidates found for project ${job.payload.projectId}`
      };
    }

    const createdReviewCandidates: MaintenanceQueueCreatedReviewCandidate[] = [];

    for (const candidate of candidates) {
      const antiMemoryCandidate = await input.memoryRepository.createAntiMemoryCandidate(
        antiMemoryCandidateFor({
          candidate,
          maintenanceQueueRecordId: record.id,
          projectId: job.payload.projectId,
          observedAt: job.payload.olderThan
        })
      );

      createdReviewCandidates.push({
        kind: "anti_memory_candidate",
        id: antiMemoryCandidate.id
      });
    }

    return {
      status: "succeeded",
      createdReviewCandidates
    };
  }
});
