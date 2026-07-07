import type {
  MemoryCandidate,
  MemoryRecord,
  SourceClaim
} from "@krn/core";
import type {
  MemoryRepository,
  PromoteMemoryCandidateInput
} from "../repositories/memory-repository.js";
import type {
  SourceRepository
} from "../repositories/source-repository.js";
import {
  assertReviewableCandidateEvidence,
  assertReviewGateConfidence,
  candidateEvidence,
  readReviewGateIdentity,
  requireReviewGateTrimmed,
  reviewedSourceClaims as readReviewedSourceClaims
} from "./review-gate-support.js";

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

const trustedPromotionSourceTiers = new Set([
  "high",
  "official",
  "primary",
  "project-decision",
  "source-code"
]);

function assertCandidateReviewable(
  candidate: MemoryCandidate
): asserts candidate is ReviewableMemoryCandidate {
  const candidateLabel = `MemoryCandidate ${candidate.id}`;

  if (!isReviewableMemoryCandidateStatus(candidate.status)) {
    throw new Error(
      `${candidateLabel} cannot be promoted from status ${candidate.status}`
    );
  }

  if (candidate.sourceLineage.length === 0) {
    throw new Error(`${candidateLabel} requires sourceLineage before promotion`);
  }

  if (candidate.applicationGuidance.trim().length === 0) {
    throw new Error(`${candidateLabel} requires applicationGuidance before promotion`);
  }

  assertReviewGateConfidence(candidateLabel, candidate.confidence);

  if (candidate.validUntil !== undefined && candidate.invalidationRule === undefined) {
    throw new Error(`${candidateLabel} requires invalidationRule for temporal promotion`);
  }

  assertReviewableCandidateEvidence(candidateLabel, candidateEvidence(candidate));
}

const reviewedSourceClaims = async (
  sourceRepository: Pick<SourceRepository, "getSourceClaimById">,
  candidate: MemoryCandidate
): Promise<SourceClaim[]> => readReviewedSourceClaims(sourceRepository, candidate.sourceClaimIds);

const untrustedReviewedSourceClaims = (
  sourceClaims: readonly SourceClaim[]
): SourceClaim[] => sourceClaims.filter((sourceClaim) =>
  !trustedPromotionSourceTiers.has(sourceClaim.sourceAuthority)
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
    evidenceReviewedRef: requireReviewGateTrimmed(
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
  const { candidateId, reviewer } = readReviewGateIdentity(input.review);

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
    promotionInput.recordKey = requireReviewGateTrimmed(input.review.recordKey, "recordKey");
  }

  const memoryRecord = await input.memoryRepository.promoteReviewedMemoryCandidate(promotionInput);

  return {
    candidate,
    memoryRecord,
    reviewedSourceClaims: sourceClaims
  };
};
