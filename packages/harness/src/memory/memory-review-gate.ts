import type {
  MemoryCandidate,
  MemoryRecord,
  SourceClaim
} from "@krn/core";
import type {
  ApplyReviewedMemoryRevisionInput,
  ApplyReviewedMemoryRevisionResult,
  MemoryRepository,
  PromoteMemoryCandidateInput
} from "@krn/core/repositories/internal";
import {
  assertReviewableCandidateEvidence,
  assertReviewGateConfidence,
  candidateEvidence,
  readReviewGateIdentity,
  requireReviewGateTrimmed,
  reviewedSourceClaims as readReviewedSourceClaims
} from "./review-gate-support.js";
import type {
  ProjectScopedSourceClaimRepository
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
  sourceRepository: ProjectScopedSourceClaimRepository;
  review: MemoryReviewGateReview;
}

export type ReviewableMemoryCandidateStatus = Extract<
  MemoryCandidate["status"],
  "proposed" | "candidate"
>;

export type ReviewableMemoryCandidate = MemoryCandidate & {
  status: ReviewableMemoryCandidateStatus;
};

export type RevisableMemoryCandidate = MemoryCandidate & {
  status: ReviewableMemoryCandidateStatus | "accepted";
};

export interface PromoteMemoryCandidateThroughGateResult {
  candidate: ReviewableMemoryCandidate;
  memoryRecord: MemoryRecord;
  reviewedSourceClaims: SourceClaim[];
}

export interface ApplyReviewedHelpedAuthorityUpgradeThroughGateInput {
  memoryRepository: Pick<
    MemoryRepository,
    "getMemoryCandidateById" | "applyReviewedMemoryRevision"
  >;
  sourceRepository: ProjectScopedSourceClaimRepository;
  review: MemoryReviewGateReview;
  sourceMemoryRecordId: MemoryRecord["id"];
  reason: string;
  supersededAt?: string;
}

export interface ApplyReviewedHelpedAuthorityUpgradeThroughGateResult
  extends ApplyReviewedMemoryRevisionResult {
  candidate: RevisableMemoryCandidate;
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

const assertCandidatePromotionShape = (candidate: MemoryCandidate): void => {
  const candidateLabel = `MemoryCandidate ${candidate.id}`;

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
};

function assertCandidateReviewable(
  candidate: MemoryCandidate
): asserts candidate is ReviewableMemoryCandidate {
  if (!isReviewableMemoryCandidateStatus(candidate.status)) {
    throw new Error(
      `MemoryCandidate ${candidate.id} cannot be promoted from status ${candidate.status}`
    );
  }

  assertCandidatePromotionShape(candidate);
}

function assertCandidateRevisable(
  candidate: MemoryCandidate
): asserts candidate is RevisableMemoryCandidate {
  if (!isReviewableMemoryCandidateStatus(candidate.status) && candidate.status !== "accepted") {
    throw new Error(
      `MemoryCandidate ${candidate.id} cannot revise memory from status ${candidate.status}`
    );
  }

  assertCandidatePromotionShape(candidate);
}

const reviewedSourceClaims = async (
  sourceRepository: ProjectScopedSourceClaimRepository,
  candidate: MemoryCandidate
): Promise<SourceClaim[]> => readReviewedSourceClaims(
  sourceRepository,
  candidate.projectId,
  candidate.sourceClaimIds
);

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

const reviewedPromotionInput = async (input: {
  memoryRepository: Pick<MemoryRepository, "getMemoryCandidateById">;
  sourceRepository: ProjectScopedSourceClaimRepository;
  review: MemoryReviewGateReview;
  allowAcceptedRevisionRetry?: boolean;
}): Promise<{
  candidate: MemoryCandidate;
  reviewedSourceClaims: SourceClaim[];
  promotionInput: PromoteMemoryCandidateInput;
}> => {
  const { candidateId, reviewer } = readReviewGateIdentity(input.review);
  const candidate = await input.memoryRepository.getMemoryCandidateById(candidateId);

  if (candidate === undefined) {
    throw new Error(`MemoryCandidate not found: ${candidateId}`);
  }

  if (input.allowAcceptedRevisionRetry === true) {
    assertCandidateRevisable(candidate);
  } else {
    assertCandidateReviewable(candidate);
  }
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

  return {
    candidate,
    reviewedSourceClaims: sourceClaims,
    promotionInput
  };
};

export const promoteMemoryCandidateThroughGate = async (
  input: PromoteMemoryCandidateThroughGateInput
): Promise<PromoteMemoryCandidateThroughGateResult> => {
  const { candidate, reviewedSourceClaims, promotionInput } =
    await reviewedPromotionInput(input);
  assertCandidateReviewable(candidate);

  const memoryRecord = await input.memoryRepository.promoteReviewedMemoryCandidate(promotionInput);

  return {
    candidate,
    memoryRecord,
    reviewedSourceClaims
  };
};

export const applyReviewedHelpedAuthorityUpgradeThroughGate = async (
  input: ApplyReviewedHelpedAuthorityUpgradeThroughGateInput
): Promise<ApplyReviewedHelpedAuthorityUpgradeThroughGateResult> => {
  const reason = requireReviewGateTrimmed(input.reason, "reason");
  const evidenceReviewedRef = requireReviewGateTrimmed(
    input.review.evidenceReviewedRef,
    "evidenceReviewedRef"
  );
  const { candidate, reviewedSourceClaims, promotionInput } =
    await reviewedPromotionInput({
      ...input,
      review: { ...input.review, evidenceReviewedRef },
      allowAcceptedRevisionRetry: true
    });
  assertCandidateRevisable(candidate);
  if (
    candidate.feedbackDeltaId === undefined ||
    candidate.reviewAssessmentId === undefined ||
    candidate.usefulnessApplicationId === undefined
  ) {
    throw new Error(
      `MemoryCandidate ${candidate.id} requires first-class feedback, review, and application bindings for reviewed-helped authority upgrade`
    );
  }
  const sourceReviewRef = `review-assessment:${candidate.reviewAssessmentId}`;
  if (!evidenceReviewedRef.startsWith("review-assessment:") || evidenceReviewedRef === sourceReviewRef) {
    throw new Error(
      `MemoryCandidate ${candidate.id} requires a distinct reviewed predecessor assessment for authority upgrade`
    );
  }
  const repositoryInput: ApplyReviewedMemoryRevisionInput = {
    candidateId: promotionInput.candidateId,
    sourceMemoryRecordId: input.sourceMemoryRecordId,
    reviewer: promotionInput.reviewer,
    reason,
    ...(promotionInput.recordKey === undefined
      ? {}
      : { recordKey: promotionInput.recordKey }),
    ...(input.supersededAt === undefined
      ? {}
      : { supersededAt: input.supersededAt }),
    metadata: {
      ...promotionInput.metadata,
      memoryRevision: {
        action: "merge_duplicate",
        sourceMemoryRecordId: input.sourceMemoryRecordId,
        reason,
        evidenceRefs: [
          evidenceReviewedRef,
          ...candidate.sourceClaimIds
        ],
        doesNotProve:
          "Reviewed authority upgrade preserves legacy history; it does not prove the replacement is broadly useful."
      },
      revisionReview: {
        reviewer: promotionInput.reviewer,
        reason,
        sourceMemoryRecordId: input.sourceMemoryRecordId
      }
    }
  };
  const result = await input.memoryRepository.applyReviewedMemoryRevision(repositoryInput);

  return {
    candidate,
    reviewedSourceClaims,
    ...result
  };
};
