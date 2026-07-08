import type {
  AntiMemoryCandidate
} from "@krn/core";

import type {
  RankedActivationCandidate
} from "./types.js";

const pendingAntiMemoryReviewDoesNotProve =
  "Pending anti-memory candidates are reviewable maintenance proposals; they do not block activation, promote rejected paths, or mutate Memory Core truth until reviewed.";

const unique = (values: readonly string[]): string[] => [...new Set(values)];

const candidateMetadataKey = (candidate: RankedActivationCandidate): string | undefined =>
  typeof candidate.metadata["key"] === "string" ? candidate.metadata["key"] : undefined;

const pendingReviewTargetsMemory = (
  review: AntiMemoryCandidate,
  candidate: RankedActivationCandidate
): boolean => {
  if (candidate.subjectType !== "memory_record") {
    return false;
  }

  const appliesTo = review.appliesTo?.trim();
  const key = candidateMetadataKey(candidate);

  return (
    review.key === candidate.subjectId ||
    appliesTo === candidate.subjectId ||
    (key !== undefined && (review.key === key || appliesTo === key))
  );
};

const pendingReviewTargetsSourceClaim = (
  review: AntiMemoryCandidate,
  candidate: RankedActivationCandidate
): boolean =>
  candidate.subjectType === "source_claim" &&
  review.invalidatedBySourceClaimIds.includes(candidate.subjectId);

const pendingReviewTargetsSearch = (
  review: AntiMemoryCandidate,
  candidate: RankedActivationCandidate
): boolean => {
  if (candidate.subjectType !== "search_document") {
    return false;
  }

  if (
    candidate.sourceClaimId !== undefined &&
    review.invalidatedBySourceClaimIds.includes(candidate.sourceClaimId)
  ) {
    return true;
  }

  const appliesTo = review.appliesTo?.trim();

  return (
    candidate.memoryRecordId !== undefined &&
    (review.key === candidate.memoryRecordId || appliesTo === candidate.memoryRecordId)
  );
};

const pendingReviewTargetsCandidate = (
  review: AntiMemoryCandidate,
  candidate: RankedActivationCandidate
): boolean =>
  pendingReviewTargetsSourceClaim(review, candidate) ||
  pendingReviewTargetsMemory(review, candidate) ||
  pendingReviewTargetsSearch(review, candidate);

const pendingAntiMemoryReviewMetadata = (
  reviews: readonly AntiMemoryCandidate[]
): Record<string, unknown> => ({
  antiMemoryCandidateIds: unique(reviews.map((review) => review.id)),
  feedbackDeltaIds: unique(reviews.flatMap((review) =>
    review.feedbackDeltaId === undefined ? [] : [review.feedbackDeltaId]
  )),
  subjectRefs: unique(reviews.flatMap((review) => [
    ...(review.appliesTo === undefined ? [] : [`applies_to:${review.appliesTo}`]),
    ...review.invalidatedBySourceClaimIds.map((sourceClaimId) => `source_claim:${sourceClaimId}`)
  ])),
  doesNotProve: pendingAntiMemoryReviewDoesNotProve
});

export const applyPendingAntiMemoryReview = (
  candidates: readonly RankedActivationCandidate[],
  antiMemoryCandidates: readonly AntiMemoryCandidate[]
): RankedActivationCandidate[] => {
  const pendingReviews = antiMemoryCandidates.filter((review) => review.status === "candidate");

  if (pendingReviews.length === 0) {
    return [...candidates];
  }

  return candidates.map((candidate) => {
    const matchingReviews = pendingReviews.filter((review) =>
      pendingReviewTargetsCandidate(review, candidate)
    );

    if (matchingReviews.length === 0) {
      return candidate;
    }

    const ids = unique(matchingReviews.map((review) => review.id));

    return {
      ...candidate,
      reason:
        `${candidate.reason} Pending anti-memory review candidate(s) ${ids.join(", ")} require review before this is clean authority.`,
      expectedUse:
        `${candidate.expectedUse} Treat pending anti-memory review as a caveat, not an active block.`,
      metadata: {
        ...candidate.metadata,
        pendingAntiMemoryReview: pendingAntiMemoryReviewMetadata(matchingReviews)
      }
    };
  });
};
