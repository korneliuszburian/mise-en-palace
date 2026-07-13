import type {
  AntiMemoryCandidate,
  ExecutionRunId,
  FeedbackDeltaId,
  IsoTimestamp,
  MemoryFeedbackEvent,
  MemoryFeedbackEventType,
  MemoryCandidate,
  MemoryRecord,
  MemoryRecordKind,
  MemoryStalenessMaintenanceCandidate,
  ProjectId,
  SourceLineageRef
} from "@krn/core";
import type {
  CreateAntiMemoryCandidateInput,
  CreateMemoryCandidateInput,
  CreateMemoryFeedbackEventInput,
  ApplyReviewedMemoryRevisionInput as RepositoryApplyReviewedMemoryRevisionInput,
  MemoryRepository,
  RejectMemoryCandidateInput
} from "@krn/core/repositories/internal";

export interface ProposeMemoryConsolidationInput {
  memoryRepository: Pick<
    MemoryRepository,
    "createAntiMemoryCandidate" | "createMemoryFeedbackEvent"
  >;
  candidate: MemoryStalenessMaintenanceCandidate;
  projectId: ProjectId;
  proposedBy: string;
  owner: string;
  observedAt: IsoTimestamp;
  executionRunId?: ExecutionRunId;
  feedbackDeltaId?: FeedbackDeltaId;
  metadata?: Record<string, unknown>;
}

export interface ProposeMemoryConsolidationResult {
  antiMemoryCandidate: AntiMemoryCandidate;
  feedbackEvent: MemoryFeedbackEvent;
}

export type MemoryRevisionAction =
  | "merge_duplicate"
  | "refresh_memory"
  | "supersede_memory";

export interface MemoryRevisionDraft {
  action: MemoryRevisionAction;
  sourceMemoryRecord: MemoryRecord;
  kind?: MemoryRecordKind;
  summary: string;
  body: string;
  applicationGuidance: string;
  invalidationRule?: string;
  confidence: number;
  owner: string;
  sourceLineage: SourceLineageRef[];
  sourceClaimIds?: readonly string[];
  isUserPreference?: boolean;
  validFrom?: IsoTimestamp;
  validUntil?: IsoTimestamp;
  reason: string;
  evidenceRefs: readonly string[];
  doesNotProve: string;
}

export interface ProposeMemoryRevisionInput {
  memoryRepository: Pick<
    MemoryRepository,
    "createMemoryCandidate" | "createMemoryFeedbackEvent"
  >;
  draft: MemoryRevisionDraft;
  projectId: ProjectId;
  proposedBy: string;
  executionRunId?: ExecutionRunId;
  feedbackDeltaId?: FeedbackDeltaId;
  metadata?: Record<string, unknown>;
}

export interface ProposeMemoryRevisionResult {
  memoryCandidate: MemoryCandidate;
  feedbackEvent: MemoryFeedbackEvent;
}

export interface ApplyReviewedMemoryRevisionInput {
  memoryRepository: Pick<MemoryRepository, "applyReviewedMemoryRevision">;
  proposal: ProposeMemoryRevisionResult;
  sourceMemoryRecordId: MemoryRecord["id"];
  reviewer: string;
  reason: string;
  recordKey?: string;
  reviewedAt?: IsoTimestamp;
  metadata?: Record<string, unknown>;
}

export interface ApplyReviewedMemoryRevisionResult {
  memoryRecord: MemoryRecord;
  supersededMemoryRecord: MemoryRecord;
}

export interface RejectMemoryRevisionInput {
  memoryRepository: Pick<MemoryRepository, "rejectMemoryCandidate">;
  proposal: ProposeMemoryRevisionResult;
  reviewer: string;
  reason: string;
  metadata?: Record<string, unknown>;
}

const hasText = (value: string): boolean => value.trim().length > 0;

const requireText = (value: string, field: string): string => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new Error(`${field} is required`);
  }

  return trimmed;
};

const uniqueText = (values: readonly string[]): string[] => [
  ...new Set(values.map((value) => value.trim()).filter(hasText))
];

const sourceLineage = (
  candidate: MemoryStalenessMaintenanceCandidate,
  evidenceRefs: readonly string[]
): SourceLineageRef[] =>
  uniqueText([
    ...candidate.sourceLineageRefs,
    ...evidenceRefs
  ]).map((sourceId) => ({ sourceId }));

const candidateEvidenceRefs = (
  candidate: MemoryStalenessMaintenanceCandidate
): string[] => uniqueText(candidate.evidenceRefs);

const feedbackEventType = (
  candidate: MemoryStalenessMaintenanceCandidate
): MemoryFeedbackEventType => {
  if (
    candidate.action === "review_memory_invalidation" ||
    candidate.action === "review_memory_feedback"
  ) {
    return "stale_detected";
  }

  return "corrected";
};

const feedbackDirection = (
  candidate: MemoryStalenessMaintenanceCandidate
): CreateMemoryFeedbackEventInput["direction"] =>
  candidate.action === "review_memory_refresh" ? "correction" : "negative";

const revisionFeedbackEventType = (
  action: MemoryRevisionAction
): MemoryFeedbackEventType => {
  if (action === "refresh_memory") {
    return "corrected";
  }

  if (action === "merge_duplicate") {
    return "demoted";
  }

  return "stale_detected";
};

const revisionEvidenceRefs = (
  draft: MemoryRevisionDraft
): string[] => uniqueText([
  ...draft.evidenceRefs,
  ...draft.sourceLineage.map((lineage) => lineage.sourceId)
]);

const revisionCandidateRunRefs = (
  input: ProposeMemoryRevisionInput
): Pick<CreateMemoryCandidateInput, "executionRunId" | "feedbackDeltaId"> => ({
  ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
  ...(input.feedbackDeltaId === undefined ? {} : { feedbackDeltaId: input.feedbackDeltaId })
});

const revisionCandidateWindow = (
  draft: MemoryRevisionDraft
): Pick<CreateMemoryCandidateInput, "validFrom" | "validUntil"> => ({
  validFrom: draft.validFrom ?? draft.sourceMemoryRecord.validFrom,
  ...(draft.validUntil === undefined ? {} : { validUntil: draft.validUntil })
});

const revisionCandidateMetadata = (
  input: ProposeMemoryRevisionInput,
  evidenceRefs: readonly string[]
): Record<string, unknown> => ({
  ...(input.metadata ?? {}),
  memoryRevision: {
    action: input.draft.action,
    sourceMemoryRecordId: input.draft.sourceMemoryRecord.id,
    reason: input.draft.reason,
    evidenceRefs,
    doesNotProve: input.draft.doesNotProve
  }
});

const revisionCandidateInput = (
  input: ProposeMemoryRevisionInput,
  evidenceRefs: readonly string[]
): CreateMemoryCandidateInput => {
  const { draft } = input;

  return {
    projectId: input.projectId,
    ...revisionCandidateRunRefs(input),
    proposedBy: requireText(input.proposedBy, "proposedBy"),
    kind: draft.kind ?? draft.sourceMemoryRecord.kind,
    status: "candidate",
    summary: requireText(draft.summary, "summary"),
    body: requireText(draft.body, "body"),
    owner: requireText(draft.owner, "owner"),
    confidence: draft.confidence,
    applicationGuidance: requireText(draft.applicationGuidance, "applicationGuidance"),
    ...(draft.invalidationRule === undefined ? {} : { invalidationRule: draft.invalidationRule }),
    sourceClaimIds: [...(draft.sourceClaimIds ?? [])],
    sourceLineage: draft.sourceLineage,
    isUserPreference: draft.isUserPreference ?? draft.sourceMemoryRecord.isUserPreference,
    ...revisionCandidateWindow(draft),
    metadata: revisionCandidateMetadata(input, evidenceRefs)
  };
};

const antiMemoryInput = (
  input: ProposeMemoryConsolidationInput,
  lineage: SourceLineageRef[],
  evidenceRefs: readonly string[],
  invalidationIntent: string
): CreateAntiMemoryCandidateInput => {
  const { candidate } = input;
  const metadata = {
    ...(input.metadata ?? {}),
    maintenanceConsolidation: {
      candidateId: candidate.id,
      action: candidate.action,
      reason: candidate.reason,
      memoryRecordId: candidate.memoryRecordId,
      memoryStatus: candidate.memoryStatus,
      evidenceRefs,
      reviewabilityReasons: candidate.reviewabilityReasons,
      doesNotProve: candidate.doesNotProve
    },
    reflectionCandidateEvidence: {
      provenance: input.feedbackDeltaId === undefined ? "run_event" : "feedback_delta",
      evidenceRefs,
      doesNotProve: candidate.doesNotProve
    }
  };

  return {
    projectId: input.projectId,
    ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
    ...(input.feedbackDeltaId === undefined ? {} : { feedbackDeltaId: input.feedbackDeltaId }),
    proposedBy: requireText(input.proposedBy, "proposedBy"),
    key: candidate.memoryRecordId,
    status: "candidate",
    rejectedClaim: `Continue using memory ${candidate.memoryRecordId} without ${candidate.action}.`,
    reason: invalidationIntent,
    appliesTo: candidate.memoryKey,
    summary: candidate.summary,
    body: `Maintenance proposed ${candidate.action} for ${candidate.memoryRecordId}. Reason: ${candidate.reason}. Intent: ${invalidationIntent}`,
    owner: requireText(input.owner, "owner"),
    confidence: 70,
    sourceLineage: lineage,
    validFrom: input.observedAt,
    metadata
  };
};

export const proposeMemoryConsolidation = async (
  input: ProposeMemoryConsolidationInput
): Promise<ProposeMemoryConsolidationResult> => {
  const { candidate } = input;

  if (candidate.reviewability !== "ready") {
    throw new Error(
      `Maintenance candidate ${candidate.id} is not ready for consolidation: ${candidate.reviewability}`
    );
  }

  const evidenceRefs = candidateEvidenceRefs(candidate);

  if (evidenceRefs.length === 0) {
    throw new Error(`Maintenance candidate ${candidate.id} requires evidence refs`);
  }

  const invalidationIntent = requireText(candidate.invalidationIntent, "invalidationIntent");
  const lineage = sourceLineage(candidate, evidenceRefs);

  if (lineage.length === 0) {
    throw new Error(`Maintenance candidate ${candidate.id} requires source lineage`);
  }

  const antiMemoryCandidate = await input.memoryRepository.createAntiMemoryCandidate(
    antiMemoryInput(input, lineage, evidenceRefs, invalidationIntent)
  );
  const primaryEvidenceRef = evidenceRefs[0];

  if (primaryEvidenceRef === undefined) {
    throw new Error(`Maintenance candidate ${candidate.id} requires primary evidence ref`);
  }

  const feedbackInput: CreateMemoryFeedbackEventInput = {
    memoryRecordId: candidate.memoryRecordId,
    ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
    ...(input.feedbackDeltaId === undefined ? {} : { feedbackDeltaId: input.feedbackDeltaId }),
    eventType: feedbackEventType(candidate),
    direction: feedbackDirection(candidate),
    note: candidate.summary,
    reason: invalidationIntent,
    evidenceRef: primaryEvidenceRef,
    metadata: {
      ...(input.metadata ?? {}),
      maintenanceConsolidationCandidateId: candidate.id,
      antiMemoryCandidateId: antiMemoryCandidate.id,
      action: candidate.action,
      doesNotProve: candidate.doesNotProve
    }
  };
  const feedbackEvent = await input.memoryRepository.createMemoryFeedbackEvent(feedbackInput);

  return {
    antiMemoryCandidate,
    feedbackEvent
  };
};

export const proposeMemoryRevision = async (
  input: ProposeMemoryRevisionInput
): Promise<ProposeMemoryRevisionResult> => {
  const evidenceRefs = revisionEvidenceRefs(input.draft);

  if (evidenceRefs.length === 0) {
    throw new Error("Memory revision requires evidence refs");
  }

  const reason = requireText(input.draft.reason, "reason");
  const memoryCandidate = await input.memoryRepository.createMemoryCandidate(
    revisionCandidateInput(input, evidenceRefs)
  );
  const primaryEvidenceRef = evidenceRefs[0];

  if (primaryEvidenceRef === undefined) {
    throw new Error("Memory revision requires primary evidence ref");
  }

  const feedbackEvent = await input.memoryRepository.createMemoryFeedbackEvent({
    memoryRecordId: input.draft.sourceMemoryRecord.id,
    ...(input.executionRunId === undefined ? {} : { executionRunId: input.executionRunId }),
    ...(input.feedbackDeltaId === undefined ? {} : { feedbackDeltaId: input.feedbackDeltaId }),
    eventType: revisionFeedbackEventType(input.draft.action),
    direction: "correction",
    note: input.draft.summary,
    reason,
    evidenceRef: primaryEvidenceRef,
    metadata: {
      ...(input.metadata ?? {}),
      memoryRevisionCandidateId: memoryCandidate.id,
      sourceMemoryRecordId: input.draft.sourceMemoryRecord.id,
      action: input.draft.action,
      doesNotProve: input.draft.doesNotProve
    }
  });

  return {
    memoryCandidate,
    feedbackEvent
  };
};

export const applyReviewedMemoryRevision = async (
  input: ApplyReviewedMemoryRevisionInput
): Promise<ApplyReviewedMemoryRevisionResult> => {
  const reviewer = requireText(input.reviewer, "reviewer");
  const reason = requireText(input.reason, "reason");
  const repositoryInput: RepositoryApplyReviewedMemoryRevisionInput = {
    candidateId: input.proposal.memoryCandidate.id,
    sourceMemoryRecordId: input.sourceMemoryRecordId,
    reviewer,
    reason,
    ...(input.recordKey === undefined ? {} : { recordKey: input.recordKey }),
    ...(input.reviewedAt === undefined ? {} : { supersededAt: input.reviewedAt }),
    metadata: {
      ...input.proposal.memoryCandidate.metadata,
      ...(input.metadata ?? {}),
      revisionReview: {
        reviewer,
        reason,
        sourceMemoryRecordId: input.sourceMemoryRecordId
      }
    }
  };

  return input.memoryRepository.applyReviewedMemoryRevision(repositoryInput);
};

export const rejectMemoryRevision = async (
  input: RejectMemoryRevisionInput
): Promise<MemoryCandidate> => {
  const reviewer = requireText(input.reviewer, "reviewer");
  const reason = requireText(input.reason, "reason");
  const rejectInput: RejectMemoryCandidateInput = {
    candidateId: input.proposal.memoryCandidate.id,
    reviewer,
    reason,
    metadata: {
      ...input.proposal.memoryCandidate.metadata,
      ...(input.metadata ?? {}),
      revisionRejection: {
        reviewer,
        reason
      }
    }
  };

  return input.memoryRepository.rejectMemoryCandidate(rejectInput);
};
