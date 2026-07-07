import { describe, expect, it } from "vitest";
import type {
  AntiMemoryCandidate,
  AntiMemoryRecord,
  MemoryFeedbackEvent,
  MemoryRecord,
  TaskContract
} from "@krn/core";
import {
  buildMemoryStalenessMaintenancePreview
} from "@krn/core";
import {
  applyActivationFilters,
  buildMemoryQuery,
  rankCandidates,
  toMemoryCandidate
} from "../../activation/index.js";
import type {
  CreateAntiMemoryCandidateInput,
  CreateMemoryFeedbackEventInput,
  PromoteAntiMemoryCandidateInput
} from "../../repositories/memory-repository.js";
import {
  promoteAntiMemoryCandidateThroughGate
} from "../anti-memory-review-gate.js";
import {
  proposeMemoryConsolidation
} from "../memory-consolidation.js";

const now = "2026-07-07T12:00:00.000Z";

const memoryRecord = (): MemoryRecord => ({
  id: "memory-stale-1",
  projectId: "project-1",
  key: "frontend-bootstrap-standard",
  kind: "procedure",
  status: "active",
  summary: "Use the old frontend bootstrap standard.",
  body: "This record has repeated stale feedback and should be reviewed.",
  owner: "operator",
  confidence: 88,
  applicationGuidance: "Use when starting frontend projects.",
  invalidationRule: "Revisit after repeated stale feedback.",
  sourceLineage: [{ sourceId: "source-claim-1" }],
  isUserPreference: false,
  positiveFeedbackCount: 1,
  negativeFeedbackCount: 3,
  metadata: {},
  validFrom: "2026-06-01T00:00:00.000Z",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z"
});

const taskContract = (): TaskContract => ({
  id: "task-1",
  operatorIntentId: "intent-1",
  projectId: "project-1",
  title: "Start frontend project",
  objective: "Use the frontend bootstrap standard for a new app.",
  constraints: ["avoid stale guidance"],
  nonGoals: ["do not use rejected memory"],
  acceptance: ["stale memory is excluded"],
  status: "active",
  metadata: {},
  createdAt: now,
  updatedAt: now
});

const antiMemoryCandidateFromInput = (
  input: CreateAntiMemoryCandidateInput
): AntiMemoryCandidate => ({
  id: "anti-memory-candidate-1",
  projectId: input.projectId,
  feedbackDeltaId: "feedback-delta-1",
  proposedBy: input.proposedBy,
  key: input.key,
  status: "candidate",
  rejectedClaim: input.rejectedClaim ?? "missing rejected claim",
  reason: input.reason ?? "missing reason",
  invalidatedBySourceClaimIds: [],
  appliesTo: input.appliesTo ?? "missing appliesTo",
  summary: input.summary,
  body: input.body,
  owner: input.owner,
  confidence: input.confidence,
  sourceLineage: input.sourceLineage,
  validFrom: now,
  metadata: input.metadata ?? {},
  createdAt: now,
  updatedAt: now
});

const feedbackEventFromInput = (
  input: CreateMemoryFeedbackEventInput
): MemoryFeedbackEvent => ({
  id: "memory-feedback-event-1",
  memoryRecordId: input.memoryRecordId,
  ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
  ...(input.feedbackDeltaId === undefined ? {} : { feedbackDeltaId: input.feedbackDeltaId }),
  ...(input.eventType === undefined ? {} : { eventType: input.eventType }),
  direction: input.direction,
  note: input.note,
  ...(input.reason === undefined ? {} : { reason: input.reason }),
  ...(input.evidenceRef === undefined ? {} : { evidenceRef: input.evidenceRef }),
  metadata: input.metadata ?? {},
  createdAt: now
});

const antiMemoryRecordFromCandidate = (
  candidate: AntiMemoryCandidate,
  input: PromoteAntiMemoryCandidateInput
): AntiMemoryRecord => ({
  id: "anti-memory-record-1",
  projectId: candidate.projectId,
  ...(candidate.executionRunId === undefined ? {} : { executionRunId: candidate.executionRunId }),
  createdFromCandidateId: candidate.id,
  key: input.recordKey ?? candidate.key,
  ...(candidate.rejectedClaim === undefined ? {} : { rejectedClaim: candidate.rejectedClaim }),
  ...(candidate.reason === undefined ? {} : { reason: candidate.reason }),
  invalidatedBySourceClaimIds: candidate.invalidatedBySourceClaimIds,
  ...(candidate.appliesTo === undefined ? {} : { appliesTo: candidate.appliesTo }),
  ...(candidate.mayRevisitWhen === undefined ? {} : { mayRevisitWhen: candidate.mayRevisitWhen }),
  summary: candidate.summary,
  body: candidate.body,
  owner: candidate.owner,
  confidence: candidate.confidence,
  sourceLineage: candidate.sourceLineage,
  validFrom: candidate.validFrom,
  ...(candidate.validUntil === undefined ? {} : { validUntil: candidate.validUntil }),
  metadata: input.metadata ?? {},
  createdAt: now,
  updatedAt: now
});

describe("proposeMemoryConsolidation", () => {
  const memoryRepository = {
    async createAntiMemoryCandidate(input: CreateAntiMemoryCandidateInput) {
      return antiMemoryCandidateFromInput(input);
    },
    async createMemoryFeedbackEvent(input: CreateMemoryFeedbackEventInput) {
      return feedbackEventFromInput(input);
    }
  };

  const readyCandidate = () => {
    const preview = buildMemoryStalenessMaintenancePreview({
      now,
      memoryRecords: [memoryRecord()],
      evidenceRef: "feedback-delta-1"
    });
    const candidate = preview.candidates[0];

    if (candidate === undefined) {
      throw new Error("expected maintenance candidate");
    }

    return candidate;
  };

  it("rejects non-reviewable maintenance candidates before writing anti-memory", async () => {
    await expect(
      proposeMemoryConsolidation({
        memoryRepository,
        candidate: {
          ...readyCandidate(),
          reviewability: "needs_more_evidence"
        },
        projectId: "project-1",
        proposedBy: "maintenance-consolidation",
        owner: "operator",
        observedAt: now
      })
    ).rejects.toThrow(
      "Maintenance candidate memory-staleness-maintenance:memory-stale-1:unresolved_negative_feedback is not ready for consolidation"
    );
  });

  it("rejects candidates without review evidence refs before writing anti-memory", async () => {
    await expect(
      proposeMemoryConsolidation({
        memoryRepository,
        candidate: {
          ...readyCandidate(),
          evidenceRefs: []
        },
        projectId: "project-1",
        proposedBy: "maintenance-consolidation",
        owner: "operator",
        observedAt: now
      })
    ).rejects.toThrow(
      "Maintenance candidate memory-staleness-maintenance:memory-stale-1:unresolved_negative_feedback requires evidence refs"
    );
  });

  it("turns a stale-memory preview into reviewed anti-memory that changes later activation", async () => {
    const record = memoryRecord();
    const preview = buildMemoryStalenessMaintenancePreview({
      now,
      memoryRecords: [record],
      evidenceRef: "feedback-delta-1"
    });
    const maintenanceCandidate = preview.candidates[0];

    expect(maintenanceCandidate?.reviewability).toBe("ready");

    if (maintenanceCandidate === undefined) {
      throw new Error("expected maintenance candidate");
    }

    let antiMemoryCandidate: AntiMemoryCandidate | undefined;

    const proposal = await proposeMemoryConsolidation({
      memoryRepository: {
        async createAntiMemoryCandidate(input) {
          antiMemoryCandidate = antiMemoryCandidateFromInput(input);
          return antiMemoryCandidate;
        },
        async createMemoryFeedbackEvent(input) {
          return feedbackEventFromInput(input);
        }
      },
      candidate: maintenanceCandidate,
      projectId: "project-1",
      proposedBy: "maintenance-consolidation",
      owner: "operator",
      observedAt: now,
      feedbackDeltaId: "feedback-delta-1"
    });

    expect(proposal.feedbackEvent).toMatchObject({
      memoryRecordId: "memory-stale-1",
      eventType: "stale_detected",
      direction: "negative"
    });
    expect(proposal.antiMemoryCandidate).toMatchObject({
      key: "memory-stale-1",
      appliesTo: "frontend-bootstrap-standard",
      metadata: {
        reflectionCandidateEvidence: {
          provenance: "feedback_delta",
          evidenceRefs: ["feedback-delta-1", "source-claim-1"]
        }
      }
    });

    const gateResult = await promoteAntiMemoryCandidateThroughGate({
      memoryRepository: {
        async getAntiMemoryCandidateById() {
          return antiMemoryCandidate;
        },
        async promoteReviewedAntiMemoryCandidate(input) {
          if (antiMemoryCandidate === undefined) {
            throw new Error("missing anti-memory candidate");
          }

          return antiMemoryRecordFromCandidate(antiMemoryCandidate, input);
        }
      },
      sourceRepository: {
        async getSourceClaimById() {
          throw new Error("source claims are not needed for lineage-only anti-memory");
        }
      },
      review: {
        candidateId: "anti-memory-candidate-1",
        reviewer: "operator",
        evidenceReviewedRef: "feedback-delta-1"
      }
    });

    const ranked = rankCandidates([toMemoryCandidate(record)], buildMemoryQuery(taskContract()));
    const filtered = applyActivationFilters({
      candidates: ranked,
      antiMemoryRecords: [gateResult.antiMemoryRecord],
      minimumTrustTier: "medium",
      now
    });

    expect(filtered.candidates[0]).toMatchObject({
      subjectId: "memory-stale-1",
      exclusion: {
        reason: "unsafe"
      },
      antiMemoryRecordId: "anti-memory-record-1"
    });
    expect(filtered.conflictSets).toHaveLength(1);
  });
});
