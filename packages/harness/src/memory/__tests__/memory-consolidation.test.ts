import { describe, expect, it } from "vitest";
import type {
  AntiMemoryCandidate,
  AntiMemoryRecord,
  MemoryCandidate,
  MemoryFeedbackEvent,
  MemoryRecord,
  TaskContract
} from "@krn/core";
import {
  buildMemoryStalenessMaintenancePreview,
  projectStandardDecisionFromMemoryRecord
} from "@krn/core";
import {
  applyActivationFilters,
  buildMemoryQuery,
  rankCandidates,
  toMemoryCandidate
} from "../../activation/index.js";
import type {
  CreateAntiMemoryCandidateInput,
  CreateMemoryCandidateInput,
  CreateMemoryFeedbackEventInput,
  PromoteAntiMemoryCandidateInput,
  PromoteMemoryCandidateInput,
  SupersedeMemoryRecordInput
} from "@krn/core/repositories";
import {
  promoteAntiMemoryCandidateThroughGate
} from "../anti-memory-review-gate.js";
import {
  applyReviewedMemoryRevision,
  proposeMemoryRevision,
  proposeMemoryConsolidation,
  rejectMemoryRevision
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

const memoryCandidateFromInput = (
  input: CreateMemoryCandidateInput
): MemoryCandidate => ({
  id: "memory-candidate-1",
  projectId: input.projectId,
  ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
  ...(input.feedbackDeltaId === undefined ? {} : { feedbackDeltaId: input.feedbackDeltaId }),
  proposedBy: input.proposedBy,
  kind: input.kind,
  status: input.status ?? "candidate",
  summary: input.summary,
  body: input.body,
  owner: input.owner,
  confidence: input.confidence,
  applicationGuidance: input.applicationGuidance,
  ...(input.invalidationRule === undefined ? {} : { invalidationRule: input.invalidationRule }),
  sourceClaimIds: input.sourceClaimIds ?? [],
  sourceLineage: input.sourceLineage,
  isUserPreference: input.isUserPreference,
  validFrom: input.validFrom ?? now,
  ...(input.validUntil === undefined ? {} : { validUntil: input.validUntil }),
  metadata: input.metadata ?? {},
  createdAt: now,
  updatedAt: now
});

const memoryRecordFromCandidate = (
  candidate: MemoryCandidate,
  input: PromoteMemoryCandidateInput
): MemoryRecord => ({
  id: "memory-refreshed-1",
  projectId: candidate.projectId,
  currentVersionId: "memory-version-refreshed-1",
  key: input.recordKey ?? `memory:${candidate.id}`,
  kind: candidate.kind,
  status: "active",
  summary: candidate.summary,
  body: candidate.body,
  owner: candidate.owner,
  confidence: candidate.confidence,
  applicationGuidance: candidate.applicationGuidance,
  ...(candidate.invalidationRule === undefined ? {} : { invalidationRule: candidate.invalidationRule }),
  sourceLineage: candidate.sourceLineage,
  isUserPreference: candidate.isUserPreference,
  positiveFeedbackCount: 0,
  negativeFeedbackCount: 0,
  metadata: input.metadata ?? {},
  validFrom: candidate.validFrom,
  ...(candidate.validUntil === undefined ? {} : { validUntil: candidate.validUntil }),
  createdAt: now,
  updatedAt: now
});

const supersededMemoryRecordFromInput = (
  record: MemoryRecord,
  input: SupersedeMemoryRecordInput
): MemoryRecord => ({
  ...record,
  status: "superseded",
  invalidatedAt: input.supersededAt ?? now,
  invalidationReason: input.reason,
  metadata: {
    ...record.metadata,
    ...(input.metadata ?? {}),
    supersessionReview: {
      reviewer: input.reviewer,
      reason: input.reason,
      supersededAt: input.supersededAt ?? now,
      supersededByMemoryRecordId: input.supersededByMemoryRecordId
    }
  },
  updatedAt: now
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
        async getSourceClaimForProject() {
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
      minimumSourceAuthority: "medium",
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

describe("reviewed memory revision", () => {
  it("rejects revision proposals without evidence before writing a candidate", async () => {
    let writes = 0;

    await expect(
      proposeMemoryRevision({
        memoryRepository: {
          async createMemoryCandidate(input) {
            writes += 1;
            return memoryCandidateFromInput(input);
          },
          async createMemoryFeedbackEvent(input) {
            writes += 1;
            return feedbackEventFromInput(input);
          }
        },
        draft: {
          action: "refresh_memory",
          sourceMemoryRecord: memoryRecord(),
          summary: "Use the refreshed frontend bootstrap standard.",
          body: "Refreshed frontend bootstrap body.",
          applicationGuidance: "Use when starting new frontend projects.",
          invalidationRule: "Revisit when project template changes.",
          confidence: 90,
          owner: "operator",
          sourceLineage: [],
          reason: "The prior memory was stale.",
          evidenceRefs: [],
          doesNotProve: "This revision does not prove broad frontend quality."
        },
        projectId: "project-1",
        proposedBy: "maintenance-consolidation"
      })
    ).rejects.toThrow("Memory revision requires evidence refs");
    expect(writes).toBe(0);
  });

  it("applies a reviewed refresh by promoting the replacement and superseding the old memory", async () => {
    const originalRecord: MemoryRecord = {
      ...memoryRecord(),
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
      metadata: {
        projectStandardDecision: {
          mechanism: "The old frontend starter was the accepted project bootstrap path before the current template existed.",
          krnImplication: "Activation may use this standard only for historical explanation, not current new-project setup.",
          decision: "Supersede the old frontend bootstrap standard.",
          rejectedPath: "Do not start new frontend projects from the old bootstrap.",
          consumer: "activation:new-project-setup",
          falsifier: "A new-project DecisionPacket includes memory-stale-1 as current guidance.",
          doesNotProve: "Historical project standard readback does not prove the old starter is currently valid."
        }
      }
    };
    let candidate: MemoryCandidate | undefined;
    let supersedeInput: SupersedeMemoryRecordInput | undefined;
    const proposal = await proposeMemoryRevision({
      memoryRepository: {
        async createMemoryCandidate(input) {
          candidate = memoryCandidateFromInput(input);
          return candidate;
        },
        async createMemoryFeedbackEvent(input) {
          return feedbackEventFromInput(input);
        }
      },
      draft: {
        action: "refresh_memory",
        sourceMemoryRecord: originalRecord,
        summary: "Use the refreshed frontend bootstrap standard.",
        body: "Use the current frontend boilerplate and testing standard.",
        applicationGuidance: "Use when starting new frontend projects.",
        invalidationRule: "Revisit when the frontend starter changes.",
        confidence: 92,
        owner: "operator",
        sourceLineage: [{ sourceId: "source-claim-2" }],
        sourceClaimIds: ["source-claim-2"],
        reason: "The older frontend standard was superseded by current practice.",
        evidenceRefs: ["feedback-delta-2"],
        doesNotProve: "This revision does not prove the standard applies to every stack."
      },
      projectId: "project-1",
      proposedBy: "maintenance-consolidation",
      feedbackDeltaId: "feedback-delta-2",
      metadata: {
        smokeId: "memory-revision-test",
        projectStandardDecision: {
          sourceRefs: ["feedback-delta-2", "source-claim-2"],
          mechanism: "Reviewed feedback and source claim show the current frontend boilerplate replaced the older starter.",
          krnImplication: "Activation should select this standard for new frontend project setup and caveat the superseded path.",
          decision: "Use the refreshed frontend bootstrap standard for matching new frontend projects.",
          rejectedPath: "Do not use the superseded old frontend bootstrap standard for new projects.",
          consumer: "activation:new-project-setup",
          falsifier: "A matching new-project DecisionPacket omits memory-refreshed-1 or includes memory-stale-1 as current guidance.",
          doesNotProve: "This project standard does not prove the starter applies to every stack or future template revision."
        }
      }
    });

    expect(proposal.memoryCandidate).toMatchObject({
      summary: "Use the refreshed frontend bootstrap standard.",
      metadata: {
        memoryRevision: {
          action: "refresh_memory",
          sourceMemoryRecordId: "memory-stale-1",
          evidenceRefs: ["feedback-delta-2", "source-claim-2"]
        }
      }
    });
    expect(proposal.feedbackEvent).toMatchObject({
      memoryRecordId: "memory-stale-1",
      eventType: "corrected",
      direction: "correction"
    });

    const applied = await applyReviewedMemoryRevision({
      memoryRepository: {
        async applyReviewedMemoryRevision(input) {
          if (candidate === undefined) {
            throw new Error("missing memory candidate");
          }

          const memoryRecord = memoryRecordFromCandidate(candidate, {
            candidateId: input.candidateId,
            reviewer: input.reviewer,
            decision: "accepted",
            ...(input.recordKey === undefined ? {} : { recordKey: input.recordKey }),
            metadata: input.metadata
          });
          supersedeInput = {
            memoryRecordId: input.sourceMemoryRecordId,
            supersededByMemoryRecordId: memoryRecord.id,
            reviewer: input.reviewer,
            reason: input.reason,
            metadata: {
              ...(input.metadata ?? {}),
              replacementMemoryRecordId: memoryRecord.id
            }
          };
          return {
            memoryRecord,
            supersededMemoryRecord: supersededMemoryRecordFromInput(originalRecord, {
              ...supersedeInput,
              ...(input.supersededAt === undefined ? {} : { supersededAt: input.supersededAt }),
              metadata: {
                replacementMemoryRecordId: memoryRecord.id
              }
            })
          };
        }
      },
      proposal,
      sourceMemoryRecordId: originalRecord.id,
      reviewer: "operator",
      reason: "Reviewed refresh replaces stale frontend standard.",
      recordKey: "frontend-bootstrap-standard",
      reviewedAt: now
    });

    expect(supersedeInput).toMatchObject({
      memoryRecordId: "memory-stale-1",
      supersededByMemoryRecordId: "memory-refreshed-1",
      reviewer: "operator"
    });
    expect(applied.supersededMemoryRecord).toMatchObject({
      id: "memory-stale-1",
      status: "superseded",
      metadata: {
        replacementMemoryRecordId: "memory-refreshed-1"
      }
    });
    expect(projectStandardDecisionFromMemoryRecord(applied.memoryRecord)).toEqual({
      kind: "krn.projectStandardDecision.v1",
      memoryRecordId: "memory-refreshed-1",
      key: "frontend-bootstrap-standard",
      sourceRefs: ["source-claim-2", "feedback-delta-2"],
      mechanism: "Reviewed feedback and source claim show the current frontend boilerplate replaced the older starter.",
      krnImplication: "Activation should select this standard for new frontend project setup and caveat the superseded path.",
      decision: "Use the refreshed frontend bootstrap standard for matching new frontend projects.",
      rejectedPath: "Do not use the superseded old frontend bootstrap standard for new projects.",
      consumer: "activation:new-project-setup",
      falsifier: "A matching new-project DecisionPacket omits memory-refreshed-1 or includes memory-stale-1 as current guidance.",
      validFrom: "2026-06-01T00:00:00.000Z",
      doesNotProve: "This project standard does not prove the starter applies to every stack or future template revision."
    });
    expect(projectStandardDecisionFromMemoryRecord(applied.supersededMemoryRecord)).toMatchObject({
      memoryRecordId: "memory-stale-1",
      decision: "Supersede the old frontend bootstrap standard.",
      rejectedPath: "Do not start new frontend projects from the old bootstrap.",
      consumer: "activation:new-project-setup"
    });

    const ranked = rankCandidates([
      toMemoryCandidate(applied.supersededMemoryRecord),
      toMemoryCandidate(applied.memoryRecord)
    ], buildMemoryQuery(taskContract()));
    expect(ranked.find((candidate) =>
      candidate.subjectId === "memory-refreshed-1"
    )?.metadata).toMatchObject({
      projectStandardDecision: {
        decision: "Use the refreshed frontend bootstrap standard for matching new frontend projects.",
        consumer: "activation:new-project-setup",
        falsifier: "A matching new-project DecisionPacket omits memory-refreshed-1 or includes memory-stale-1 as current guidance."
      }
    });
    const filtered = applyActivationFilters({
      candidates: ranked,
      antiMemoryRecords: [],
      minimumSourceAuthority: "medium",
      now
    });

    expect(filtered.candidates.some((item) =>
      item.subjectId === "memory-refreshed-1" && item.exclusion === undefined
    )).toBe(true);
    expect(filtered.candidates.some((item) =>
      item.subjectId === "memory-stale-1" &&
      item.exclusion?.reason === "superseded"
    )).toBe(true);
  });

  it("rejects a revision through the memory candidate review path", async () => {
    const proposal = await proposeMemoryRevision({
      memoryRepository: {
        async createMemoryCandidate(input) {
          return memoryCandidateFromInput(input);
        },
        async createMemoryFeedbackEvent(input) {
          return feedbackEventFromInput(input);
        }
      },
      draft: {
        action: "merge_duplicate",
        sourceMemoryRecord: memoryRecord(),
        summary: "Merge duplicate frontend bootstrap memories.",
        body: "Keep one canonical frontend bootstrap memory.",
        applicationGuidance: "Use when duplicate memories compete.",
        confidence: 80,
        owner: "operator",
        sourceLineage: [{ sourceId: "source-claim-3" }],
        reason: "Two records appear to describe the same standard.",
        evidenceRefs: ["review:duplicate-memory"],
        doesNotProve: "This proposal does not prove the records are duplicates."
      },
      projectId: "project-1",
      proposedBy: "maintenance-consolidation"
    });
    const rejected = await rejectMemoryRevision({
      memoryRepository: {
        async rejectMemoryCandidate(input) {
          return {
            ...proposal.memoryCandidate,
            status: "rejected",
            reviewer: input.reviewer,
            rejectionReason: input.reason,
            metadata: input.metadata ?? {},
            updatedAt: now
          };
        }
      },
      proposal,
      reviewer: "operator",
      reason: "Records are similar but not duplicates."
    });

    expect(rejected).toMatchObject({
      status: "rejected",
      reviewer: "operator",
      rejectionReason: "Records are similar but not duplicates.",
      metadata: {
        revisionRejection: {
          reviewer: "operator"
        }
      }
    });
  });
});
