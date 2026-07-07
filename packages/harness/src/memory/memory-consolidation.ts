import type {
  AntiMemoryCandidate,
  ExecutionRunId,
  FeedbackDeltaId,
  IsoTimestamp,
  MemoryFeedbackEvent,
  MemoryFeedbackEventType,
  MemoryStalenessMaintenanceCandidate,
  ProjectId,
  SourceLineageRef
} from "@krn/core";
import type {
  CreateAntiMemoryCandidateInput,
  CreateMemoryFeedbackEventInput,
  MemoryRepository
} from "../repositories/memory-repository.js";

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
}

export interface ProposeMemoryConsolidationResult {
  antiMemoryCandidate: AntiMemoryCandidate;
  feedbackEvent: MemoryFeedbackEvent;
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

const antiMemoryInput = (
  input: ProposeMemoryConsolidationInput,
  lineage: SourceLineageRef[],
  evidenceRefs: readonly string[],
  invalidationIntent: string
): CreateAntiMemoryCandidateInput => {
  const { candidate } = input;
  const metadata = {
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
