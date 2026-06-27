import type {
  MemoryCandidate,
  MemoryRecord,
  ReflectionCandidateEvidence,
  SourceClaim
} from "@krn/core";
import type {
  MemoryRepository,
  PromoteMemoryCandidateInput
} from "../repositories/memoryRepository.js";
import type {
  SourceRepository
} from "../repositories/sourceRepository.js";

export interface MemoryReviewGateReview {
  candidateId: string;
  reviewer: string;
  evidenceReviewedRef: string;
  untrustedSourceReviewRef?: string;
  recordKey?: string;
  metadata?: Record<string, unknown>;
}

export interface PromoteMemoryCandidateThroughGateInput {
  memoryRepository: Pick<
    MemoryRepository,
    "getMemoryCandidateById" | "promoteReviewedMemoryCandidate"
  >;
  sourceRepository: Pick<SourceRepository, "getSourceClaimById">;
  review: MemoryReviewGateReview;
}

export type ReviewableMemoryCandidateStatus = Extract<
  MemoryCandidate["status"],
  "proposed" | "candidate"
>;

export type ReviewableMemoryCandidate = MemoryCandidate & {
  status: ReviewableMemoryCandidateStatus;
};

export interface PromoteMemoryCandidateThroughGateResult {
  candidate: ReviewableMemoryCandidate;
  memoryRecord: MemoryRecord;
  reviewedSourceClaims: SourceClaim[];
}

const isReviewableMemoryCandidateStatus = (
  status: MemoryCandidate["status"]
): status is ReviewableMemoryCandidateStatus => (
  status === "proposed" || status === "candidate"
);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object" && value !== null && !Array.isArray(value)
);

const stringListOrEmpty = (value: unknown): string[] => (
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
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

const isCandidateEvidenceProvenance = (
  value: string
): value is ReflectionCandidateEvidence["provenance"] =>
  candidateEvidenceProvenances.has(value as ReflectionCandidateEvidence["provenance"]);

const trustedPromotionSourceTiers = new Set([
  "high",
  "official",
  "primary",
  "project-decision",
  "source-code"
]);

const requireTrimmed = (value: string, field: string): string => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new Error(`${field} is required`);
  }

  return trimmed;
};

const candidateEvidence = (candidate: MemoryCandidate): ReflectionCandidateEvidence | undefined => {
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
  candidate: MemoryCandidate
): asserts candidate is ReviewableMemoryCandidate {
  if (!isReviewableMemoryCandidateStatus(candidate.status)) {
    throw new Error(
      `MemoryCandidate ${candidate.id} cannot be promoted from status ${candidate.status}`
    );
  }

  if (candidate.sourceLineage.length === 0) {
    throw new Error(`MemoryCandidate ${candidate.id} requires sourceLineage before promotion`);
  }

  if (candidate.applicationGuidance.trim().length === 0) {
    throw new Error(`MemoryCandidate ${candidate.id} requires applicationGuidance before promotion`);
  }

  if (!Number.isInteger(candidate.confidence) || candidate.confidence < 0 || candidate.confidence > 100) {
    throw new Error(`MemoryCandidate ${candidate.id} confidence must be an integer between 0 and 100`);
  }

  if (candidate.validUntil !== undefined && candidate.invalidationRule === undefined) {
    throw new Error(`MemoryCandidate ${candidate.id} requires invalidationRule for temporal promotion`);
  }

  const evidence = candidateEvidence(candidate);

  if (evidence === undefined) {
    throw new Error(`MemoryCandidate ${candidate.id} requires candidate evidence provenance before promotion`);
  }

  if (evidence.evidenceRefs.length === 0) {
    throw new Error(`MemoryCandidate ${candidate.id} requires candidate evidence refs before promotion`);
  }

  if (evidence.provenance === "default_template") {
    throw new Error(`MemoryCandidate ${candidate.id} cannot be promoted from weak default-template evidence`);
  }
}

const reviewedSourceClaims = async (
  sourceRepository: Pick<SourceRepository, "getSourceClaimById">,
  candidate: MemoryCandidate
): Promise<SourceClaim[]> => {
  const sourceClaims: SourceClaim[] = [];

  for (const sourceClaimId of candidate.sourceClaimIds) {
    const sourceClaim = await sourceRepository.getSourceClaimById(sourceClaimId);

    if (sourceClaim === undefined) {
      throw new Error(`SourceClaim not found: ${sourceClaimId}`);
    }

    sourceClaims.push(sourceClaim);
  }

  return sourceClaims;
};

const untrustedReviewedSourceClaims = (
  sourceClaims: readonly SourceClaim[]
): SourceClaim[] => sourceClaims.filter((sourceClaim) =>
  !trustedPromotionSourceTiers.has(sourceClaim.trustTier)
);

const assertUntrustedSourceReview = (
  review: MemoryReviewGateReview,
  sourceClaims: readonly SourceClaim[]
): string | undefined => {
  const untrustedClaims = untrustedReviewedSourceClaims(sourceClaims);

  if (untrustedClaims.length === 0) {
    return undefined;
  }

  const reviewRef = review.untrustedSourceReviewRef?.trim();

  if (reviewRef === undefined || reviewRef.length === 0) {
    throw new Error(
      `MemoryCandidate ${review.candidateId} requires untrustedSourceReviewRef before promotion from untrusted source lineage: ${untrustedClaims.map((sourceClaim) => sourceClaim.id).join(", ")}`
    );
  }

  return reviewRef;
};

export const buildMemoryReviewGateMetadata = (input: {
  review: MemoryReviewGateReview;
  candidate: MemoryCandidate;
  reviewedSourceClaims: SourceClaim[];
  untrustedSourceReviewRef?: string;
}): Record<string, unknown> => ({
  ...(input.review.metadata ?? {}),
  reviewGate: {
    evidenceReviewedRef: requireTrimmed(
      input.review.evidenceReviewedRef,
      "evidenceReviewedRef"
    ),
    candidateEvidence: candidateEvidence(input.candidate),
    sourceClaimIds: input.candidate.sourceClaimIds,
    reviewedSourceClaimIds: input.reviewedSourceClaims.map((sourceClaim) => sourceClaim.id),
    untrustedSourceClaimIds: untrustedReviewedSourceClaims(input.reviewedSourceClaims).map(
      (sourceClaim) => sourceClaim.id
    ),
    ...(input.untrustedSourceReviewRef === undefined
      ? {}
      : { untrustedSourceReviewRef: input.untrustedSourceReviewRef })
  }
});

export const promoteMemoryCandidateThroughGate = async (
  input: PromoteMemoryCandidateThroughGateInput
): Promise<PromoteMemoryCandidateThroughGateResult> => {
  const candidateId = requireTrimmed(input.review.candidateId, "candidateId");
  const reviewer = requireTrimmed(input.review.reviewer, "reviewer");
  requireTrimmed(input.review.evidenceReviewedRef, "evidenceReviewedRef");

  const candidate = await input.memoryRepository.getMemoryCandidateById(candidateId);

  if (candidate === undefined) {
    throw new Error(`MemoryCandidate not found: ${candidateId}`);
  }

  assertCandidateReviewable(candidate);
  const sourceClaims = await reviewedSourceClaims(input.sourceRepository, candidate);
  const untrustedSourceReviewRef = assertUntrustedSourceReview(input.review, sourceClaims);
  const promotionInput: PromoteMemoryCandidateInput = {
    candidateId,
    reviewer,
    decision: "accepted",
    metadata: buildMemoryReviewGateMetadata({
      review: input.review,
      candidate,
      reviewedSourceClaims: sourceClaims,
      ...(untrustedSourceReviewRef === undefined ? {} : { untrustedSourceReviewRef })
    })
  };

  if (input.review.recordKey !== undefined) {
    promotionInput.recordKey = requireTrimmed(input.review.recordKey, "recordKey");
  }

  const memoryRecord = await input.memoryRepository.promoteReviewedMemoryCandidate(promotionInput);

  return {
    candidate,
    memoryRecord,
    reviewedSourceClaims: sourceClaims
  };
};
