import type {
  SourceClaim
} from "@krn/core";
import type {
  RetrieveActivationCandidatesResult,
  RankedActivationCandidate
} from "@krn/harness";
import {
  buildGraphReadback
} from "./sourceSearchGraphReadback.js";
import type {
  SourceSearchGraphReadback,
  SourceSearchRelationSupport,
  SourceSearchSourceClaimDocumentLink
} from "./sourceSearchGraphReadback.js";
import {
  groupSourceDecisionSupportByClaimId,
  sourceClaimIdFor,
  sourceDecisionSupportReadbackFor
} from "./sourceSearchDecisionSupport.js";
import type {
  SourceSearchDecisionSupport,
  SourceSearchDecisionSupportState
} from "./sourceSearchDecisionSupport.js";
import {
  sourceSearchMetadataString
} from "./sourceSearchMetadata.js";

type SearchReviewability =
  | "ready"
  | "needs_more_evidence"
  | "unknown";

type SourceSearchAnswerUsefulness =
  | "useful"
  | "partly_useful_missing_document"
  | "partly_useful_missing_claim"
  | "not_useful"
  | "unknown";

type SourceSearchCandidateStatus =
  | "included"
  | "excluded";

interface ReviewabilityResult {
  reviewability: SearchReviewability;
  reasons: readonly string[];
}

interface SourceSearchAnswerCandidate {
  label: string;
  subjectType: RankedActivationCandidate["subjectType"];
  subjectId: string;
  status: SourceSearchCandidateStatus;
  kind: RankedActivationCandidate["kind"];
  trustTier: RankedActivationCandidate["trustTier"];
  totalScore: number;
  lexicalScore: number;
  graphScore: number;
  contextRoiScore: number;
  reason: string;
  expectedUse: string;
  reviewability: SearchReviewability;
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

interface SourceSearchAnswerPackage {
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
  neutralOrNoise: readonly SourceSearchAnswerCandidate[];
  missingEvidence: readonly string[];
  doesNotProve: readonly string[];
  recommendedNextAction: string;
}

interface SourceSearchJsonOutput {
  kind: "source_search_answer_package";
  query: string;
  projectId: string;
  limit: number;
  maxInclusions: number;
  persistence: "read_only_postgres";
  dbWrites: "none";
  mutation: "none";
  diagnostics: {
    inputStatus: RetrieveActivationCandidatesResult["diagnostics"]["inputStatus"];
    sourceClaims: number;
    searchResults: number;
    mergedCandidates: number;
    doesNotProve: string;
  };
  answerPackage: SourceSearchAnswerPackage;
  includedCandidates: readonly SourceSearchAnswerCandidate[];
  excludedCandidates: readonly SourceSearchAnswerCandidate[];
  noMatchGuidance: readonly string[];
  proof: {
    proves: readonly string[];
    doesNotProve: readonly string[];
  };
  runtime: {
    memoryMutation: "none";
    crawler: "none";
    embeddings: "not_run";
    graphRuntime: "not_run";
  };
}

export const buildSourceSearchMissingEvidence = (input: {
  supportingClaimCount: number;
  supportingDocumentCount: number;
  linkedDocumentCount?: number;
}): readonly string[] => [
  ...(input.supportingClaimCount === 0
    ? ["governed SourceClaim evidence in the answer package for this query"]
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
}): {
  answerUsefulness: SourceSearchAnswerUsefulness;
  reasons: readonly string[];
} => {
  if (input.supportingClaimCount > 0 && input.supportingDocumentCount > 0) {
    return {
      answerUsefulness: "useful",
      reasons: [
        "Answer package includes governed SourceClaim evidence.",
        "Answer package includes SearchDocument retrieval evidence."
      ]
    };
  }

  if (input.supportingClaimCount > 0) {
    return {
      answerUsefulness: "partly_useful_missing_document",
      reasons: [
        "Answer package includes governed SourceClaim evidence.",
        "Answer package is missing included SearchDocument evidence."
      ]
    };
  }

  if (input.supportingDocumentCount > 0) {
    return {
      answerUsefulness: "partly_useful_missing_claim",
      reasons: [
        "Answer package includes SearchDocument retrieval evidence.",
        "Answer package is missing governed SourceClaim evidence."
      ]
    };
  }

  return {
    answerUsefulness: "not_useful",
    reasons: [
      "Answer package has no governed SourceClaim evidence.",
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

const formatCandidate = (
  candidate: RankedActivationCandidate,
  status: "included" | "excluded"
): string[] => {
  const reviewability = reviewabilityFor(candidate);

  return [
    `- ${candidate.subjectType}:${candidate.subjectId}`,
    `  status: ${status}`,
    `  kind: ${candidate.kind}`,
    `  trustTier: ${candidate.trustTier}`,
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

const candidateToOutput = (
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
    decisionSupportBySourceClaimId
  );

  return {
    label: candidateLabel(candidate),
    subjectType: candidate.subjectType,
    subjectId: candidate.subjectId,
    status,
    kind: candidate.kind,
    trustTier: candidate.trustTier,
    totalScore: candidate.totalScore,
    lexicalScore: candidate.lexicalScore,
    graphScore: candidate.graphScore,
    contextRoiScore: candidate.contextRoiScore,
    reason: candidate.reason,
    expectedUse: candidate.expectedUse,
    reviewability: reviewability.reviewability,
    reviewabilityReasons: reviewability.reasons,
    searchDocumentId: candidate.searchDocumentId,
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

const buildAnswerPackage = (input: {
  query: string;
  included: readonly RankedActivationCandidate[];
  diagnostics: RetrieveActivationCandidatesResult["diagnostics"];
  relationSupport: readonly SourceSearchRelationSupport[];
  sourceDecisionSupport: readonly SourceSearchDecisionSupport[];
  sourceClaimDocumentLinks: readonly SourceSearchSourceClaimDocumentLink[];
}): SourceSearchAnswerPackage => {
  const decisionSupportBySourceClaimId = groupSourceDecisionSupportByClaimId(
    input.sourceDecisionSupport
  );
  const included = input.included.map((candidate) =>
    candidateToOutput(candidate, "included", decisionSupportBySourceClaimId)
  );
  const supportingClaims = included.filter(
    (candidate) => candidate.subjectType === "source_claim"
  );
  const supportingDocuments = included.filter(
    (candidate) => candidate.subjectType === "search_document"
  );
  const neutralOrNoise = included.filter(
    (candidate) =>
      candidate.subjectType !== "source_claim" && candidate.subjectType !== "search_document"
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
    supportingDocumentCount: supportingDocuments.length
  });
  const graphReadback = buildGraphReadback({
    supportingClaims,
    relationSupport: input.relationSupport
  });
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
      ? "Use the supporting claims/documents as a Pattern Application Gate, then verify the selected pattern against the target slice."
    : supportingClaims.length > 0
        ? "Use the supporting claims cautiously and split broad queries into narrower topic-specific source searches before changing retrieval."
        : supportingDocuments.length > 0
          ? "Inspect the documents and verify whether a governed SourceClaim should exist before relying on them."
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
    neutralOrNoise,
    missingEvidence,
    doesNotProve,
    recommendedNextAction
  };
};

const formatSourceDecisionSupport = (
  sourceDecisionSupport: readonly SourceSearchDecisionSupport[]
): readonly string[] =>
  sourceDecisionSupport.length === 0
    ? ["- none"]
    : sourceDecisionSupport.map((decision) =>
        [
          `- source_claim:${decision.sourceClaimId}`,
          ` edge:${decision.sourceDecisionEdgeId}`,
          ` target:${decision.targetType}/${decision.targetId}`,
          ` supportType:${decision.supportType}`,
          ` confidence:${decision.confidence}`,
          ` notes:${decision.notes}`,
          ` doesNotProve:${decision.doesNotProve}`
        ].join("")
      );

const formatAnswerPackage = (answerPackage: SourceSearchAnswerPackage): string[] => {
  return [
    "Answer package preview:",
    `answer: ${answerPackage.answer}`,
    `answer usefulness: ${answerPackage.answerUsefulness}`,
    "answer usefulness reasons:",
    ...answerPackage.answerUsefulnessReasons.map((reason) => `- ${reason}`),
    "query shape diagnostics:",
    ...(answerPackage.queryShapeDiagnostics.length === 0
      ? ["- none detected by current diagnostics"]
      : answerPackage.queryShapeDiagnostics.map((diagnostic) => `- ${diagnostic}`)),
    "supporting claims:",
    ...(answerPackage.supportingClaims.length === 0
      ? ["- none"]
      : answerPackage.supportingClaims.map((candidate) =>
          [
            `- ${candidate.label} | ${candidate.reason}`,
            candidate.sourceDecisionSupportState === undefined
              ? ""
              : ` | sourceDecisionSupport:${candidate.sourceDecisionSupportState}`,
            candidate.sourceDecisionSupportCaveat === undefined
              ? ""
              : ` | caveat:${candidate.sourceDecisionSupportCaveat}`
          ].join("")
        )),
    "supporting documents:",
    ...(answerPackage.supportingDocuments.length === 0
      ? ["- none"]
      : answerPackage.supportingDocuments.map((candidate) => `- ${candidate.label} | ${candidate.reason}`)),
    "source claim document links:",
    ...(answerPackage.sourceClaimDocumentLinks.length === 0
      ? ["- none"]
      : answerPackage.sourceClaimDocumentLinks.map((link) =>
          [
            `- source_claim:${link.sourceClaimId}`,
            ` linkedSearchDocumentCount:${link.linkedSearchDocumentCount}`,
            link.linkedSearchDocumentIds.length === 0
              ? " linkedSearchDocumentIds:none"
              : ` linkedSearchDocumentIds:${link.linkedSearchDocumentIds.join(",")}`,
            link.linkKinds.length === 0 ? " linkKinds:none" : ` linkKinds:${link.linkKinds.join(",")}`,
            link.sourceArtifactId === undefined ? "" : ` sourceArtifactId:${link.sourceArtifactId}`,
            link.sourceChunkId === undefined ? "" : ` sourceChunkId:${link.sourceChunkId}`,
            link.caveat === undefined ? "" : ` caveat:${link.caveat}`
          ].join("")
        )),
    "relation support:",
    ...(answerPackage.relationSupport.length === 0
      ? ["- none"]
      : answerPackage.relationSupport.map((relation) =>
          [
            `- source_claim:${relation.sourceClaimId}`,
            ` edge:${relation.edgeId}`,
            ` direction:${relation.direction}`,
            ` kind:${relation.kind}`,
            ` relatedSourceClaim:${relation.relatedSourceClaimId}`,
            relation.consumer === undefined ? "" : ` consumer:${relation.consumer}`,
            relation.doesNotProve === undefined ? "" : ` doesNotProve:${relation.doesNotProve}`,
            relation.validFrom === undefined ? "" : ` validFrom:${relation.validFrom}`,
            relation.validUntil === undefined ? "" : ` validUntil:${relation.validUntil}`,
            relation.invalidatedAt === undefined ? "" : ` invalidatedAt:${relation.invalidatedAt}`
          ].join("")
        )),
    "source decision support:",
    ...formatSourceDecisionSupport(answerPackage.sourceDecisionSupport),
    "graph readback:",
    `- claimNodes: ${answerPackage.graphReadback.claimNodes}`,
    `- relationEdges: ${answerPackage.graphReadback.relationEdges}`,
    ...(answerPackage.graphReadback.relationKinds.length === 0
      ? ["- relationKinds: none"]
      : answerPackage.graphReadback.relationKinds.map((item) =>
          `- relationKind: ${item.kind} count:${item.count}`
        )),
    `- temporalEdges: ${answerPackage.graphReadback.temporalEdges}`,
    `- contradictionEdges: ${answerPackage.graphReadback.contradictionEdges}`,
    `- duplicateEdges: ${answerPackage.graphReadback.duplicateEdges}`,
    `- invalidationEdges: ${answerPackage.graphReadback.invalidationEdges}`,
    `- graphAware: ${answerPackage.graphReadback.graphAware}`,
    "graph caveats:",
    ...answerPackage.graphReadback.caveats.map((item) => `- ${item}`),
    "neutral/noise:",
    ...(answerPackage.neutralOrNoise.length === 0
      ? ["- none from included candidates"]
      : answerPackage.neutralOrNoise.map((candidate) => `- ${candidate.label} | outside SourceClaim/SearchDocument answer scope`)),
    "missing evidence:",
    ...(answerPackage.missingEvidence.length === 0
      ? ["- none detected by current diagnostics"]
      : answerPackage.missingEvidence.map((item) => `- ${item}`)),
    "doesNotProve:",
    ...answerPackage.doesNotProve.map((item) => `- ${item}`),
    `recommended next action: ${answerPackage.recommendedNextAction}`
  ];
};

export type SourceSearchRenderInput = {
  query: string;
  projectId: string;
  limit: number;
  maxInclusions: number;
  candidates: readonly RankedActivationCandidate[];
  diagnostics: RetrieveActivationCandidatesResult["diagnostics"];
  relationSupport: readonly SourceSearchRelationSupport[];
  sourceDecisionSupport: readonly SourceSearchDecisionSupport[];
  sourceClaimDocumentLinks: readonly SourceSearchSourceClaimDocumentLink[];
};

const buildSearchReadback = (input: SourceSearchRenderInput) => {
  const included = input.candidates.filter((candidate) => candidate.exclusion === undefined);
  const excluded = input.candidates.filter((candidate) => candidate.exclusion !== undefined);
  const decisionSupportBySourceClaimId = groupSourceDecisionSupportByClaimId(
    input.sourceDecisionSupport
  );
  const answerPackage = buildAnswerPackage({
    query: input.query,
    included,
    diagnostics: input.diagnostics,
    relationSupport: input.relationSupport,
    sourceDecisionSupport: input.sourceDecisionSupport,
    sourceClaimDocumentLinks: input.sourceClaimDocumentLinks
  });

  return {
    included,
    excluded,
    decisionSupportBySourceClaimId,
    answerPackage,
    noMatchGuidance: buildNoMatchGuidance(input.candidates.length)
  };
};

export const formatSearchResult = (input: SourceSearchRenderInput): string => {
  const readback = buildSearchReadback(input);

  return [
    "KRN Source Knowledge Search",
    "Persistence: read-only (Postgres)",
    "DB writes: none",
    "Mutation: none",
    `Query: ${input.query}`,
    `Project: ${input.projectId}`,
    `Limit: ${input.limit}`,
    `Max inclusions: ${input.maxInclusions}`,
    "",
    "Diagnostics:",
    `- inputStatus: ${input.diagnostics.inputStatus}`,
    `- sourceClaims: ${input.diagnostics.sourceClaimCount}`,
    `- searchResults: ${input.diagnostics.searchResultCount}`,
    `- mergedCandidates: ${input.diagnostics.mergedCandidateCount}`,
    `- doesNotProve: ${input.diagnostics.doesNotProve}`,
    "",
    ...formatAnswerPackage(readback.answerPackage),
    "",
    "Included candidates:",
    ...(readback.included.length === 0
      ? ["- none"]
      : readback.included.flatMap((candidate) => formatCandidate(candidate, "included"))),
    "",
    "Excluded candidates:",
    ...(readback.excluded.length === 0
      ? ["- none"]
      : readback.excluded.flatMap((candidate) => formatCandidate(candidate, "excluded"))),
    "",
    "No-match guidance:",
    ...readback.noMatchGuidance.map((item) => `- ${item}`),
    "",
    "Proof:",
    "- proves: current Postgres can read persisted source/search candidates for this query",
    "- proves: readback shows inclusion/exclusion, scores, reviewability, and proof boundaries",
    "- doesNotProve: source truth, ranking quality, embeddings, graph retrieval, crawler readiness, product readiness, or Memory Core mutation",
    "Memory mutation: none",
    "Crawler: none",
    "Embeddings: not run",
    "Graph runtime: not run"
  ].join("\n");
};

const buildNoMatchGuidance = (candidateCount: number): readonly string[] =>
  candidateCount === 0
    ? [
        "no candidates matched; try a narrower marker/hash query or ingest a local artifact first"
      ]
    : [
        "if an expected SearchDocument is excluded, inspect score and budget before changing ranking",
        "if an expected SourceClaim is missing, verify source claim persistence and project scope"
      ];

export const formatSearchJson = (input: SourceSearchRenderInput): string => {
  const readback = buildSearchReadback(input);
  const output: SourceSearchJsonOutput = {
    kind: "source_search_answer_package",
    query: input.query,
    projectId: input.projectId,
    limit: input.limit,
    maxInclusions: input.maxInclusions,
    persistence: "read_only_postgres",
    dbWrites: "none",
    mutation: "none",
    diagnostics: {
      inputStatus: input.diagnostics.inputStatus,
      sourceClaims: input.diagnostics.sourceClaimCount,
      searchResults: input.diagnostics.searchResultCount,
      mergedCandidates: input.diagnostics.mergedCandidateCount,
      doesNotProve: input.diagnostics.doesNotProve
    },
    answerPackage: readback.answerPackage,
    includedCandidates: readback.included.map((candidate) =>
      candidateToOutput(candidate, "included", readback.decisionSupportBySourceClaimId)
    ),
    excludedCandidates: readback.excluded.map((candidate) => candidateToOutput(candidate, "excluded")),
    noMatchGuidance: readback.noMatchGuidance,
    proof: {
      proves: [
        "current Postgres can read persisted source/search candidates for this query",
        "readback shows inclusion/exclusion, scores, reviewability, and proof boundaries"
      ],
      doesNotProve: [
        "source truth",
        "ranking quality",
        "embeddings",
        "graph retrieval",
        "crawler readiness",
        "product readiness",
        "Memory Core mutation"
      ]
    },
    runtime: {
      memoryMutation: "none",
      crawler: "none",
      embeddings: "not_run",
      graphRuntime: "not_run"
    }
  };

  return JSON.stringify(output, null, 2);
};
