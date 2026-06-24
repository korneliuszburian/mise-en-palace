import type {
  AntiMemoryCandidate,
  AntiMemoryRecord,
  ReflectionCandidateEvidence,
  SourceClaim
} from "@krn/core";
import type {
  MemoryRepository,
  PromoteAntiMemoryCandidateInput
} from "../repositories/memoryRepository.js";
import type {
  SourceRepository
} from "../repositories/sourceRepository.js";

export interface AntiMemoryReviewGateReview {
  candidateId: string;
  reviewer: string;
  evidenceReviewedRef: string;
  recordKey?: string;
  metadata?: Record<string, unknown>;
}

export interface PromoteAntiMemoryCandidateThroughGateInput {
  memoryRepository: Pick<
    MemoryRepository,
    "getAntiMemoryCandidateById" | "promoteReviewedAntiMemoryCandidate"
  >;
  sourceRepository: Pick<SourceRepository, "getSourceClaimById">;
  review: AntiMemoryReviewGateReview;
}

export type ReviewableAntiMemoryCandidateStatus = Extract<
  AntiMemoryCandidate["status"],
  "proposed" | "candidate"
>;

export type ReviewableAntiMemoryCandidate = AntiMemoryCandidate & {
  status: ReviewableAntiMemoryCandidateStatus;
};

export interface PromoteAntiMemoryCandidateThroughGateResult {
  candidate: ReviewableAntiMemoryCandidate;
  antiMemoryRecord: AntiMemoryRecord;
  reviewedSourceClaims: SourceClaim[];
}

const isReviewableAntiMemoryCandidateStatus = (
  status: AntiMemoryCandidate["status"]
): status is ReviewableAntiMemoryCandidateStatus => (
  status === "proposed" || status === "candidate"
);

const candidateEvidenceProvenances = new Set<ReflectionCandidateEvidence["provenance"]>([
  "default_template",
  "operator_reported",
  "captured_output_file",
  "command_runner",
  "external_log",
  "run_event",
  "source_chunk",
  "tool_trace",
  "diff",
  "evidence_bundle",
  "review_assessment",
  "feedback_delta",
  "user_correction",
  "user_preference",
  "local_operator_note",
  "source_claim"
]);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

const stringListOrEmpty = (value: unknown): string[] => (
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
);

const isCandidateEvidenceProvenance = (
  value: string
): value is ReflectionCandidateEvidence["provenance"] =>
  candidateEvidenceProvenances.has(value as ReflectionCandidateEvidence["provenance"]);

const requireTrimmed = (value: string, field: string): string => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new Error(`${field} is required`);
  }

  return trimmed;
};

const candidateEvidence = (
  candidate: AntiMemoryCandidate
): ReflectionCandidateEvidence | undefined => {
  const value = candidate.metadata["reflectionCandidateEvidence"];

  if (!isRecord(value)) {
    return undefined;
  }

  const provenance = typeof value.provenance === "string" ? value.provenance.trim() : "";
  const doesNotProve = typeof value.doesNotProve === "string" ? value.doesNotProve.trim() : "";

  if (
    provenance.length === 0 ||
    !isCandidateEvidenceProvenance(provenance) ||
    doesNotProve.length === 0
  ) {
    return undefined;
  }

  return {
    provenance,
    evidenceRefs: stringListOrEmpty(value.evidenceRefs),
    doesNotProve
  };
};

function assertCandidateReviewable(
  candidate: AntiMemoryCandidate
): asserts candidate is ReviewableAntiMemoryCandidate {
  if (!isReviewableAntiMemoryCandidateStatus(candidate.status)) {
    throw new Error(
      `AntiMemoryCandidate ${candidate.id} cannot be promoted from status ${candidate.status}`
    );
  }

  if (
    candidate.sourceLineage.length === 0 &&
    candidate.invalidatedBySourceClaimIds.length === 0 &&
    candidate.invalidatedBySourceClaimId === undefined
  ) {
    throw new Error(
      `AntiMemoryCandidate ${candidate.id} requires source lineage or invalidating source claim before promotion`
    );
  }

  if (!Number.isInteger(candidate.confidence) || candidate.confidence < 0 || candidate.confidence > 100) {
    throw new Error(`AntiMemoryCandidate ${candidate.id} confidence must be an integer between 0 and 100`);
  }

  const evidence = candidateEvidence(candidate);

  if (evidence === undefined) {
    throw new Error(
      `AntiMemoryCandidate ${candidate.id} requires candidate evidence provenance before promotion`
    );
  }

  if (evidence.evidenceRefs.length === 0) {
    throw new Error(`AntiMemoryCandidate ${candidate.id} requires candidate evidence refs before promotion`);
  }

  if (evidence.provenance === "default_template") {
    throw new Error(
      `AntiMemoryCandidate ${candidate.id} cannot be promoted from weak default-template evidence`
    );
  }
}

const candidateSourceClaimIds = (candidate: AntiMemoryCandidate): string[] => [
  ...new Set([
    ...candidate.invalidatedBySourceClaimIds,
    ...(candidate.invalidatedBySourceClaimId === undefined
      ? []
      : [candidate.invalidatedBySourceClaimId])
  ])
];

const reviewedSourceClaims = async (
  sourceRepository: Pick<SourceRepository, "getSourceClaimById">,
  candidate: AntiMemoryCandidate
): Promise<SourceClaim[]> => {
  const sourceClaims: SourceClaim[] = [];

  for (const sourceClaimId of candidateSourceClaimIds(candidate)) {
    const sourceClaim = await sourceRepository.getSourceClaimById(sourceClaimId);

    if (sourceClaim === undefined) {
      throw new Error(`SourceClaim not found: ${sourceClaimId}`);
    }

    sourceClaims.push(sourceClaim);
  }

  return sourceClaims;
};

export const buildAntiMemoryReviewGateMetadata = (input: {
  review: AntiMemoryReviewGateReview;
  candidate: AntiMemoryCandidate;
  reviewedSourceClaims: SourceClaim[];
}): Record<string, unknown> => ({
  ...(input.review.metadata ?? {}),
  reviewGate: {
    evidenceReviewedRef: requireTrimmed(
      input.review.evidenceReviewedRef,
      "evidenceReviewedRef"
    ),
    candidateEvidence: candidateEvidence(input.candidate),
    invalidatedSourceClaimIds: candidateSourceClaimIds(input.candidate),
    reviewedSourceClaimIds: input.reviewedSourceClaims.map((sourceClaim) => sourceClaim.id)
  }
});

export const promoteAntiMemoryCandidateThroughGate = async (
  input: PromoteAntiMemoryCandidateThroughGateInput
): Promise<PromoteAntiMemoryCandidateThroughGateResult> => {
  const candidateId = requireTrimmed(input.review.candidateId, "candidateId");
  const reviewer = requireTrimmed(input.review.reviewer, "reviewer");
  requireTrimmed(input.review.evidenceReviewedRef, "evidenceReviewedRef");

  const candidate = await input.memoryRepository.getAntiMemoryCandidateById(candidateId);

  if (candidate === undefined) {
    throw new Error(`AntiMemoryCandidate not found: ${candidateId}`);
  }

  assertCandidateReviewable(candidate);
  const sourceClaims = await reviewedSourceClaims(input.sourceRepository, candidate);
  const promotionInput: PromoteAntiMemoryCandidateInput = {
    candidateId,
    reviewer,
    decision: "accepted",
    metadata: buildAntiMemoryReviewGateMetadata({
      review: input.review,
      candidate,
      reviewedSourceClaims: sourceClaims
    })
  };

  if (input.review.recordKey !== undefined) {
    promotionInput.recordKey = requireTrimmed(input.review.recordKey, "recordKey");
  }

  const antiMemoryRecord = await input.memoryRepository.promoteReviewedAntiMemoryCandidate(
    promotionInput
  );

  return {
    candidate,
    antiMemoryRecord,
    reviewedSourceClaims: sourceClaims
  };
};
