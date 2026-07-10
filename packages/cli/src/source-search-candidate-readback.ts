import type {
  SourceClaim
} from "@krn/core";
import type {
  RankedActivationCandidate
} from "@krn/harness";

import {
  sourceClaimIdFor,
  sourceDecisionSupportReadbackFor
} from "./source-search-decision-support.js";
import type {
  SourceSearchDecisionSupport,
  SourceSearchDecisionSupportState
} from "./source-search-decision-support.js";
import {
  sourceSearchMetadataString
} from "./source-search-metadata.js";

export type SourceSearchReviewability =
  | "ready"
  | "needs_more_evidence"
  | "unknown";

export type SourceSearchCandidateStatus =
  | "included"
  | "excluded";

interface ReviewabilityResult {
  reviewability: SourceSearchReviewability;
  reasons: readonly string[];
}

export interface SourceSearchAnswerCandidate {
  label: string;
  subjectType: RankedActivationCandidate["subjectType"];
  subjectId: string;
  status: SourceSearchCandidateStatus;
  kind: RankedActivationCandidate["kind"];
  sourceAuthority: RankedActivationCandidate["sourceAuthority"];
  totalScore: number;
  lexicalScore: number;
  graphScore: number;
  contextRoiScore: number;
  reason: string;
  expectedUse: string;
  reviewability: SourceSearchReviewability;
  reviewabilityReasons: readonly string[];
  searchDocumentId: string | undefined;
  sourceClaimId: string | undefined;
  sourceArtifactId: string | undefined;
  sourceChunkId: string | undefined;
  claim: string | undefined;
  mechanism: string | undefined;
  krnImplication: string | undefined;
  consumer: string | undefined;
  falsifier: string | undefined;
  doesNotProve: string | undefined;
  exclusionReason: string | undefined;
  exclusionExplanation: string | undefined;
  sourceDecisionSupportState: SourceSearchDecisionSupportState | undefined;
  sourceDecisionSupportEdgeIds: readonly string[] | undefined;
  sourceDecisionSupportCaveat: string | undefined;
}

const reviewabilityFor = (candidate: RankedActivationCandidate): ReviewabilityResult => {
  if (candidate.subjectType === "source_claim") {
    const reasons = [
      candidate.hasMechanism === false
        ? "SourceClaim is missing mechanism."
        : "SourceClaim has mechanism.",
      candidate.doesNotProve === undefined || candidate.doesNotProve.trim().length === 0
        ? "SourceClaim is missing doesNotProve."
        : "SourceClaim has doesNotProve boundary."
    ];

    return {
      reviewability: reasons.some((reason) => reason.includes("missing"))
        ? "needs_more_evidence"
        : "ready",
      reasons
    };
  }

  if (candidate.subjectType === "search_document") {
    return {
      reviewability: candidate.searchDocumentId === undefined ? "needs_more_evidence" : "ready",
      reasons: [
        candidate.searchDocumentId === undefined
          ? "Search candidate has no SearchDocument id."
          : "SearchDocument row matched the query.",
        "SearchDocument readback is reviewable only as retrieval evidence."
      ]
    };
  }

  return {
    reviewability: "unknown",
    reasons: ["Candidate kind is outside the V341 SourceClaim/SearchDocument preview scope."]
  };
};

export const formatSourceSearchCandidate = (
  candidate: RankedActivationCandidate,
  status: SourceSearchCandidateStatus
): string[] => {
  const reviewability = reviewabilityFor(candidate);

  return [
    `- ${candidate.subjectType}:${candidate.subjectId}`,
    `  status: ${status}`,
    `  kind: ${candidate.kind}`,
    `  sourceAuthority: ${candidate.sourceAuthority}`,
    `  totalScore: ${candidate.totalScore}`,
    `  lexicalScore: ${candidate.lexicalScore}`,
    `  graphScore: ${candidate.graphScore}`,
    `  contextRoiScore: ${candidate.contextRoiScore}`,
    `  reason: ${candidate.reason}`,
    `  expectedUse: ${candidate.expectedUse}`,
    `  reviewability: ${reviewability.reviewability}`,
    "  reviewability reasons:",
    ...reviewability.reasons.map((reason) => `  - ${reason}`),
    ...(candidate.searchDocumentId === undefined
      ? []
      : [`  searchDocumentId: ${candidate.searchDocumentId}`]),
    ...(candidate.sourceClaimId === undefined
      ? []
      : [`  sourceClaimId: ${candidate.sourceClaimId}`]),
    ...(candidate.doesNotProve === undefined
      ? []
      : [`  doesNotProve: ${candidate.doesNotProve}`]),
    ...(candidate.exclusion === undefined
      ? []
      : [
          `  exclusionReason: ${candidate.exclusion.reason}`,
          `  exclusionExplanation: ${candidate.exclusion.explanation}`
        ])
  ];
};

const candidateLabel = (candidate: RankedActivationCandidate): string =>
  `${candidate.subjectType}:${candidate.subjectId}`;

const canonicalProjectionIdFor = (
  candidate: RankedActivationCandidate
): string | undefined => candidate.searchDocumentId ??
  (candidate.searchDocumentIds?.length === 1 ? candidate.searchDocumentIds[0] : undefined);

export const sourceSearchCandidateToOutput = (
  candidate: RankedActivationCandidate,
  status: SourceSearchCandidateStatus,
  decisionSupportBySourceClaimId?: ReadonlyMap<
    SourceClaim["id"],
    readonly SourceSearchDecisionSupport[]
  >
): SourceSearchAnswerCandidate => {
  const reviewability = reviewabilityFor(candidate);
  const claim = sourceSearchMetadataString(candidate.metadata, "claim");
  const mechanism = sourceSearchMetadataString(candidate.metadata, "mechanism");
  const krnImplication = sourceSearchMetadataString(candidate.metadata, "krnImplication");
  const consumer = sourceSearchMetadataString(candidate.metadata, "consumer");
  const falsifier = sourceSearchMetadataString(candidate.metadata, "falsifier");
  const sourceArtifactId = sourceSearchMetadataString(candidate.metadata, "sourceArtifactId");
  const sourceChunkId = sourceSearchMetadataString(candidate.metadata, "sourceChunkId");
  const sourceClaimId =
    candidate.subjectType === "source_claim"
      ? sourceClaimIdFor(candidate)
      : candidate.sourceClaimId;
  const decisionSupportReadback = sourceDecisionSupportReadbackFor(
    candidate.subjectType === "source_claim" ? sourceClaimId : undefined,
    candidate.sourceClaimStatus,
    decisionSupportBySourceClaimId
  );

  return {
    label: candidateLabel(candidate),
    subjectType: candidate.subjectType,
    subjectId: candidate.subjectId,
    status,
    kind: candidate.kind,
    sourceAuthority: candidate.sourceAuthority,
    totalScore: candidate.totalScore,
    lexicalScore: candidate.lexicalScore,
    graphScore: candidate.graphScore,
    contextRoiScore: candidate.contextRoiScore,
    reason: candidate.reason,
    expectedUse: candidate.expectedUse,
    reviewability: reviewability.reviewability,
    reviewabilityReasons: reviewability.reasons,
    searchDocumentId: canonicalProjectionIdFor(candidate),
    sourceClaimId,
    sourceArtifactId,
    sourceChunkId,
    claim,
    mechanism,
    krnImplication,
    consumer,
    falsifier,
    doesNotProve: candidate.doesNotProve,
    exclusionReason: candidate.exclusion?.reason,
    exclusionExplanation: candidate.exclusion?.explanation,
    sourceDecisionSupportState: decisionSupportReadback.state,
    sourceDecisionSupportEdgeIds: decisionSupportReadback.edgeIds,
    sourceDecisionSupportCaveat: decisionSupportReadback.caveat
  };
};
