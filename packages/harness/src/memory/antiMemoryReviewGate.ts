import type {
  AntiMemoryCandidate,
  AntiMemoryRecord,
  SourceClaim
} from "@krn/core";
import type {
  MemoryRepository,
  PromoteAntiMemoryCandidateInput
} from "../repositories/memoryRepository.js";
import type {
  SourceRepository
} from "../repositories/sourceRepository.js";
import {
  assertReviewableCandidateEvidence,
  assertReviewGateConfidence,
  candidateEvidence,
  readReviewGateIdentity,
  requireReviewGateTrimmed,
  reviewedSourceClaims
} from "./reviewGateSupport.js";

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

function assertCandidateReviewable(
  candidate: AntiMemoryCandidate
): asserts candidate is ReviewableAntiMemoryCandidate {
  const candidateLabel = `AntiMemoryCandidate ${candidate.id}`;

  if (!isReviewableAntiMemoryCandidateStatus(candidate.status)) {
    throw new Error(
      `${candidateLabel} cannot be promoted from status ${candidate.status}`
    );
  }

  if (
    candidate.sourceLineage.length === 0 &&
    candidate.invalidatedBySourceClaimIds.length === 0 &&
    candidate.invalidatedBySourceClaimId === undefined
  ) {
    throw new Error(
      `${candidateLabel} requires source lineage or invalidating source claim before promotion`
    );
  }

  assertReviewGateConfidence(candidateLabel, candidate.confidence);
  assertReviewableCandidateEvidence(candidateLabel, candidateEvidence(candidate));
}

const candidateSourceClaimIds = (candidate: AntiMemoryCandidate): string[] => [
  ...new Set([
    ...candidate.invalidatedBySourceClaimIds,
    ...(candidate.invalidatedBySourceClaimId === undefined
      ? []
      : [candidate.invalidatedBySourceClaimId])
  ])
];

export const buildAntiMemoryReviewGateMetadata = (input: {
  review: AntiMemoryReviewGateReview;
  candidate: AntiMemoryCandidate;
  reviewedSourceClaims: SourceClaim[];
}): Record<string, unknown> => ({
  ...(input.review.metadata ?? {}),
  reviewGate: {
    evidenceReviewedRef: requireReviewGateTrimmed(
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
  const { candidateId, reviewer } = readReviewGateIdentity(input.review);

  const candidate = await input.memoryRepository.getAntiMemoryCandidateById(candidateId);

  if (candidate === undefined) {
    throw new Error(`AntiMemoryCandidate not found: ${candidateId}`);
  }

  assertCandidateReviewable(candidate);
  const sourceClaims = await reviewedSourceClaims(
    input.sourceRepository,
    candidateSourceClaimIds(candidate)
  );
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
    promotionInput.recordKey = requireReviewGateTrimmed(input.review.recordKey, "recordKey");
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
