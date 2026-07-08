import type {
  SourceConsensusTimelineReadback
} from "@krn/core";
import type {
  RetrieveActivationCandidatesResult,
  RankedActivationCandidate
} from "@krn/harness";

import {
  sourceSearchCandidateToOutput
} from "./source-search-candidate-readback.js";
import type {
  SourceSearchAnswerCandidate
} from "./source-search-candidate-readback.js";
import {
  buildGraphReadback
} from "./source-search-graph-readback.js";
import type {
  SourceSearchGraphReadback,
  SourceSearchRelationSupport,
  SourceSearchSourceClaimDocumentLink
} from "./source-search-graph-readback.js";
import {
  groupSourceDecisionSupportByClaimId
} from "./source-search-decision-support.js";
import type {
  SourceSearchDecisionSupport
} from "./source-search-decision-support.js";

export type SourceSearchAnswerUsefulness =
  | "useful"
  | "partly_useful_missing_document"
  | "partly_useful_missing_claim"
  | "not_useful"
  | "unknown";

export interface SourceSearchAnswerPackage {
  answer: string;
  answerUsefulness: SourceSearchAnswerUsefulness;
  answerUsefulnessReasons: readonly string[];
  queryShapeDiagnostics: readonly string[];
  supportingClaims: readonly SourceSearchAnswerCandidate[];
  supportingDocuments: readonly SourceSearchAnswerCandidate[];
  sourceClaimDocumentLinks: readonly SourceSearchSourceClaimDocumentLink[];
  relationSupport: readonly SourceSearchRelationSupport[];
  sourceDecisionSupport: readonly SourceSearchDecisionSupport[];
  graphReadback: SourceSearchGraphReadback;
  consensusReadback: SourceConsensusTimelineReadback;
  neutralOrNoise: readonly SourceSearchAnswerCandidate[];
  missingEvidence: readonly string[];
  doesNotProve: readonly string[];
  recommendedNextAction: string;
}

export const buildSourceSearchMissingEvidence = (input: {
  supportingClaimCount: number;
  supportingDocumentCount: number;
  linkedDocumentCount?: number;
}): readonly string[] => [
  ...(input.supportingClaimCount === 0
    ? ["SourceClaim evidence in the answer package for this query"]
    : []),
  ...(input.supportingDocumentCount === 0
    ? input.supportingClaimCount > 0
      ? [
          input.linkedDocumentCount !== undefined && input.linkedDocumentCount > 0
            ? "included SearchDocument evidence for this combined query; artifact-linked SearchDocuments are visible but were not included by lexical retrieval"
            : "included SearchDocument evidence for this combined query; topic-specific SearchDocuments may still exist"
        ]
      : ["included SearchDocument evidence in the answer package for this query"]
    : [])
];

export const classifySourceSearchAnswerUsefulness = (input: {
  supportingClaimCount: number;
  supportingDocumentCount: number;
  decisionLinkedClaimCount?: number;
}): {
  answerUsefulness: SourceSearchAnswerUsefulness;
  reasons: readonly string[];
} => {
  const sourceClaimEvidenceReason =
    input.decisionLinkedClaimCount !== undefined && input.decisionLinkedClaimCount > 0
      ? "Answer package includes decision-linked SourceClaim evidence."
      : "Answer package includes accepted SourceClaim evidence without decision-linked authority.";

  if (input.supportingClaimCount > 0 && input.supportingDocumentCount > 0) {
    return {
      answerUsefulness: "useful",
      reasons: [
        sourceClaimEvidenceReason,
        "Answer package includes SearchDocument retrieval evidence."
      ]
    };
  }

  if (input.supportingClaimCount > 0) {
    return {
      answerUsefulness: "partly_useful_missing_document",
      reasons: [
        sourceClaimEvidenceReason,
        "Answer package is missing included SearchDocument evidence."
      ]
    };
  }

  if (input.supportingDocumentCount > 0) {
    return {
      answerUsefulness: "partly_useful_missing_claim",
      reasons: [
        "Answer package includes SearchDocument retrieval evidence.",
        "Answer package is missing SourceClaim evidence."
      ]
    };
  }

  return {
    answerUsefulness: "not_useful",
    reasons: [
      "Answer package has no SourceClaim evidence.",
      "Answer package has no included SearchDocument evidence."
    ]
  };
};

export const buildSourceSearchQueryShapeDiagnostics = (input: {
  supportingClaimCount: number;
  supportingDocumentCount: number;
  searchResultCount: number;
}): readonly string[] => {
  if (
    input.supportingClaimCount > 0 &&
    input.supportingDocumentCount === 0 &&
    input.searchResultCount === 0
  ) {
    return [
      "likely over-constrained query shape: SourceClaims matched, but lexical SearchDocument retrieval returned zero results; try a narrower topic-specific query before changing ranking or coverage."
    ];
  }

  return [];
};

export const buildSourceSearchAnswerPackage = (input: {
  query: string;
  included: readonly RankedActivationCandidate[];
  diagnostics: RetrieveActivationCandidatesResult["diagnostics"];
  relationSupport: readonly SourceSearchRelationSupport[];
  sourceDecisionSupport: readonly SourceSearchDecisionSupport[];
  sourceClaimDocumentLinks: readonly SourceSearchSourceClaimDocumentLink[];
  consensusReadback?: SourceConsensusTimelineReadback;
}): SourceSearchAnswerPackage => {
  const decisionSupportBySourceClaimId = groupSourceDecisionSupportByClaimId(
    input.sourceDecisionSupport
  );
  const included = input.included.map((candidate) =>
    sourceSearchCandidateToOutput(candidate, "included", decisionSupportBySourceClaimId)
  );
  const supportingClaims = included.filter(
    (candidate) => candidate.subjectType === "source_claim"
  );
  const supportingDocuments = included.filter(
    (candidate) =>
      candidate.subjectType === "search_document" &&
      candidate.searchDocumentId !== undefined
  );
  const neutralOrNoise = included.filter(
    (candidate) =>
      candidate.subjectType !== "source_claim" &&
      !(
        candidate.subjectType === "search_document" &&
        candidate.searchDocumentId !== undefined
      )
  );
  const linkedDocumentCount = input.sourceClaimDocumentLinks.reduce(
    (sum, link) => sum + link.linkedSearchDocumentCount,
    0
  );
  const missingEvidence = buildSourceSearchMissingEvidence({
    supportingClaimCount: supportingClaims.length,
    supportingDocumentCount: supportingDocuments.length,
    linkedDocumentCount
  });
  const answerUsefulness = classifySourceSearchAnswerUsefulness({
    supportingClaimCount: supportingClaims.length,
    supportingDocumentCount: supportingDocuments.length,
    decisionLinkedClaimCount: supportingClaims.filter(
      (candidate) => candidate.sourceDecisionSupportState === "linked"
    ).length
  });
  const graphReadback = buildGraphReadback({
    supportingClaims,
    relationSupport: input.relationSupport
  });
  const consensusReadback = input.consensusReadback ?? {
    currentSourceClaimIds: [],
    caveatedSourceClaimIds: [],
    historicalSourceClaimIds: [],
    staleSourceClaimIds: [],
    supersededSourceClaimIds: [],
    unknownSourceClaimIds: [],
    rejectedSourceClaimIds: [],
    entries: [],
    doesNotProve:
      "Source consensus timeline readback was not built for this answer package."
  };
  const queryShapeDiagnostics = buildSourceSearchQueryShapeDiagnostics({
    supportingClaimCount: supportingClaims.length,
    supportingDocumentCount: supportingDocuments.length,
    searchResultCount: input.diagnostics.searchResultCount
  });
  const missingDecisionSupportCount = supportingClaims.filter(
    (candidate) => candidate.sourceDecisionSupportState === "missing"
  ).length;
  const recommendedNextAction =
    supportingClaims.length > 0 && supportingDocuments.length > 0
      ? "Use the supporting claims/documents as a Knowledge Application Gate, then verify the selected knowledge against the target slice."
      : supportingClaims.length > 0
        ? "Use the supporting claims cautiously and split broad queries into narrower topic-specific source searches before changing retrieval."
        : supportingDocuments.length > 0
          ? "Inspect the documents and verify whether a SourceClaim should exist before relying on them."
          : "Narrow the query or ingest a bounded local artifact before changing ranking or adding a product surface.";
  const doesNotProve = [
    input.diagnostics.doesNotProve,
    "source truth, answer correctness, ranking quality, product readiness, or Memory Core mutation"
  ];

  return {
    answer: `Source search found ${supportingClaims.length} supporting SourceClaim(s) and ${supportingDocuments.length} supporting SearchDocument(s) for "${input.query}".`,
    answerUsefulness: answerUsefulness.answerUsefulness,
    answerUsefulnessReasons: [
      ...answerUsefulness.reasons,
      ...(linkedDocumentCount === 0
        ? []
        : [`Answer package found ${linkedDocumentCount} artifact-linked SearchDocument reference(s) for supporting SourceClaims.`]),
      ...(input.relationSupport.length === 0
        ? []
        : ["Answer package includes SourceClaimEdge relation support."]),
      ...(input.sourceDecisionSupport.length === 0
        ? []
        : ["Answer package includes SourceDecisionEdge decision support."]),
      ...(missingDecisionSupportCount === 0
        ? []
        : ["Answer package includes accepted SourceClaim evidence without SourceDecisionEdge readback."])
    ],
    queryShapeDiagnostics,
    supportingClaims,
    supportingDocuments,
    sourceClaimDocumentLinks: input.sourceClaimDocumentLinks,
    relationSupport: input.relationSupport,
    sourceDecisionSupport: input.sourceDecisionSupport,
    graphReadback,
    consensusReadback,
    neutralOrNoise,
    missingEvidence,
    doesNotProve,
    recommendedNextAction
  };
};
