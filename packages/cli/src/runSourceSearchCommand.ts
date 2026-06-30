import type {
  SourceClaim,
  SourceClaimEdge,
  TaskContract
} from "@krn/core";
import {
  applyContextROI,
  buildActivationQuery,
  retrieveActivationCandidates
} from "@krn/harness";
import type {
  RetrieveActivationCandidatesResult,
  RankedActivationCandidate
} from "@krn/harness";
import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./databaseRuntime.js";
import type {
  CliCommand
} from "./parseArgs.js";
import {
  findRepoRoot
} from "./cliFileBoundary.js";

export type SourceSearchCommand = Extract<CliCommand, { kind: "sourceSearch" }>;

export interface SourceSearchCommandRuntime {
  cwd: string;
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: SourceSearchCommand;
  createDatabaseRuntime?: CreateSourceSearchDatabaseRuntime;
}

export interface SourceSearchCommandResult {
  stdout: string;
}

export type CreateSourceSearchDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";
const defaultLimit = 20;
const defaultMaxInclusions = 6;

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
  searchDocumentId?: string;
  sourceClaimId?: string;
  doesNotProve?: string;
  exclusionReason?: string;
  exclusionExplanation?: string;
}

type SourceSearchRelationDirection = "outgoing" | "incoming";

interface SourceSearchRelationSupport {
  sourceClaimId: SourceClaim["id"];
  edgeId: SourceClaimEdge["id"];
  direction: SourceSearchRelationDirection;
  relatedSourceClaimId: SourceClaim["id"];
  kind: SourceClaimEdge["kind"];
  consumer?: string;
  doesNotProve?: string;
  evidenceRef?: string;
  sourceDecisionRef?: string;
  sourceRanges?: readonly string[];
  validFrom?: string;
  validUntil?: string;
  invalidatedAt?: string;
  createdAt: SourceClaimEdge["createdAt"];
}

interface SourceSearchGraphRelationKindCount {
  kind: SourceClaimEdge["kind"];
  count: number;
}

interface SourceSearchGraphReadback {
  claimNodes: number;
  relationEdges: number;
  relationKinds: readonly SourceSearchGraphRelationKindCount[];
  temporalEdges: number;
  contradictionEdges: number;
  duplicateEdges: number;
  invalidationEdges: number;
  graphAware: boolean;
  caveats: readonly string[];
}

interface SourceSearchAnswerPackage {
  answer: string;
  answerUsefulness: SourceSearchAnswerUsefulness;
  answerUsefulnessReasons: readonly string[];
  queryShapeDiagnostics: readonly string[];
  supportingClaims: readonly SourceSearchAnswerCandidate[];
  supportingDocuments: readonly SourceSearchAnswerCandidate[];
  relationSupport: readonly SourceSearchRelationSupport[];
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
}): readonly string[] => [
  ...(input.supportingClaimCount === 0
    ? ["governed SourceClaim evidence in the answer package for this query"]
    : []),
  ...(input.supportingDocumentCount === 0
    ? input.supportingClaimCount > 0
      ? ["included SearchDocument evidence for this combined query; topic-specific SearchDocuments may still exist"]
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
  status: SourceSearchCandidateStatus
): SourceSearchAnswerCandidate => {
  const reviewability = reviewabilityFor(candidate);

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
    ...(candidate.searchDocumentId === undefined
      ? {}
      : { searchDocumentId: candidate.searchDocumentId }),
    ...(candidate.sourceClaimId === undefined
      ? {}
      : { sourceClaimId: candidate.sourceClaimId }),
    ...(candidate.doesNotProve === undefined
      ? {}
      : { doesNotProve: candidate.doesNotProve }),
    ...(candidate.exclusion === undefined
      ? {}
      : {
          exclusionReason: candidate.exclusion.reason,
          exclusionExplanation: candidate.exclusion.explanation
        })
  };
};

const sourceClaimIdFor = (
  candidate: RankedActivationCandidate
): SourceClaim["id"] | undefined =>
  candidate.subjectType === "source_claim"
    ? (candidate.sourceClaimId ?? candidate.subjectId) as SourceClaim["id"]
    : undefined;

const relationDirectionFor = (
  sourceClaimId: SourceClaim["id"],
  edge: SourceClaimEdge
): SourceSearchRelationDirection =>
  edge.fromSourceClaimId === sourceClaimId ? "outgoing" : "incoming";

const relatedSourceClaimIdFor = (
  sourceClaimId: SourceClaim["id"],
  edge: SourceClaimEdge
): SourceClaim["id"] =>
  (edge.fromSourceClaimId === sourceClaimId
    ? edge.toSourceClaimId
    : edge.fromSourceClaimId) as SourceClaim["id"];

const metadataString = (
  metadata: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = metadata[key];

  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

const metadataStringArray = (
  metadata: Record<string, unknown>,
  key: string
): readonly string[] | undefined => {
  const value = metadata[key];

  return Array.isArray(value) && value.every((item): item is string => typeof item === "string")
    ? value
    : undefined;
};

const relationSupportFromEdge = (
  sourceClaimId: SourceClaim["id"],
  edge: SourceClaimEdge
): SourceSearchRelationSupport => {
  const consumer = metadataString(edge.metadata, "consumer");
  const doesNotProve = metadataString(edge.metadata, "doesNotProve");
  const evidenceRef = metadataString(edge.metadata, "evidenceRef");
  const sourceDecisionRef = metadataString(edge.metadata, "sourceDecisionRef");
  const sourceRanges = metadataStringArray(edge.metadata, "sourceRanges");
  const validFrom = metadataString(edge.metadata, "validFrom");
  const validUntil = metadataString(edge.metadata, "validUntil");
  const invalidatedAt = metadataString(edge.metadata, "invalidatedAt");
  const support: SourceSearchRelationSupport = {
    sourceClaimId,
    edgeId: edge.id,
    direction: relationDirectionFor(sourceClaimId, edge),
    relatedSourceClaimId: relatedSourceClaimIdFor(sourceClaimId, edge),
    kind: edge.kind,
    createdAt: edge.createdAt
  };

  if (consumer !== undefined) {
    support.consumer = consumer;
  }

  if (doesNotProve !== undefined) {
    support.doesNotProve = doesNotProve;
  }

  if (evidenceRef !== undefined) {
    support.evidenceRef = evidenceRef;
  }

  if (sourceDecisionRef !== undefined) {
    support.sourceDecisionRef = sourceDecisionRef;
  }

  if (sourceRanges !== undefined) {
    support.sourceRanges = sourceRanges;
  }

  if (validFrom !== undefined) {
    support.validFrom = validFrom;
  }

  if (validUntil !== undefined) {
    support.validUntil = validUntil;
  }

  if (invalidatedAt !== undefined) {
    support.invalidatedAt = invalidatedAt;
  }

  return support;
};

const buildRelationKindCounts = (
  relationSupport: readonly SourceSearchRelationSupport[]
): readonly SourceSearchGraphRelationKindCount[] => {
  const counts = new Map<SourceClaimEdge["kind"], number>();

  for (const relation of relationSupport) {
    counts.set(relation.kind, (counts.get(relation.kind) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([kind, count]) => ({ kind, count }));
};

const hasTemporalMetadata = (relation: SourceSearchRelationSupport): boolean =>
  relation.validFrom !== undefined ||
  relation.validUntil !== undefined ||
  relation.invalidatedAt !== undefined ||
  relation.kind === "supersedes" ||
  relation.kind === "invalidates" ||
  relation.kind === "expires";

const buildGraphReadback = (input: {
  supportingClaims: readonly SourceSearchAnswerCandidate[];
  relationSupport: readonly SourceSearchRelationSupport[];
}): SourceSearchGraphReadback => {
  const contradictionEdges = input.relationSupport.filter(
    (relation) => relation.kind === "contradicts"
  ).length;
  const duplicateEdges = input.relationSupport.filter(
    (relation) => relation.kind === "duplicates"
  ).length;
  const invalidationEdges = input.relationSupport.filter((relation) =>
    relation.kind === "invalidates" ||
    relation.kind === "expires" ||
    relation.kind === "supersedes"
  ).length;
  const temporalEdges = input.relationSupport.filter(hasTemporalMetadata).length;

  return {
    claimNodes: input.supportingClaims.length,
    relationEdges: input.relationSupport.length,
    relationKinds: buildRelationKindCounts(input.relationSupport),
    temporalEdges,
    contradictionEdges,
    duplicateEdges,
    invalidationEdges,
    graphAware: input.relationSupport.length > 0,
    caveats: [
      "graph readback summarizes existing SourceClaimEdge rows only",
      "entity extraction is not available in this bounded readback",
      "relation support does not prove source truth, edge correctness, or ranking quality"
    ]
  };
};

const buildRelationSupport = async (input: {
  included: readonly RankedActivationCandidate[];
  sourceRepository: Pick<DatabaseRuntime["sourceRepository"], "listSourceClaimEdgesForClaim">;
}): Promise<SourceSearchRelationSupport[]> => {
  const sourceClaimIds = [...new Set(input.included.flatMap((candidate) => {
    const sourceClaimId = sourceClaimIdFor(candidate);

    return sourceClaimId === undefined ? [] : [sourceClaimId];
  }))];
  const edgeGroups = await Promise.all(sourceClaimIds.map(async (sourceClaimId) => {
    const edges = await input.sourceRepository.listSourceClaimEdgesForClaim(sourceClaimId);

    return edges.map((edge) => relationSupportFromEdge(sourceClaimId, edge));
  }));

  return edgeGroups.flat();
};

const buildAnswerPackage = (input: {
  query: string;
  included: readonly RankedActivationCandidate[];
  diagnostics: RetrieveActivationCandidatesResult["diagnostics"];
  relationSupport: readonly SourceSearchRelationSupport[];
}): SourceSearchAnswerPackage => {
  const included = input.included.map((candidate) => candidateToOutput(candidate, "included"));
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
  const missingEvidence = buildSourceSearchMissingEvidence({
    supportingClaimCount: supportingClaims.length,
    supportingDocumentCount: supportingDocuments.length
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
      ...(input.relationSupport.length === 0
        ? []
        : ["Answer package includes SourceClaimEdge relation support."])
    ],
    queryShapeDiagnostics,
    supportingClaims,
    supportingDocuments,
    relationSupport: input.relationSupport,
    graphReadback,
    neutralOrNoise,
    missingEvidence,
    doesNotProve,
    recommendedNextAction
  };
};

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
      : answerPackage.supportingClaims.map((candidate) => `- ${candidate.label} | ${candidate.reason}`)),
    "supporting documents:",
    ...(answerPackage.supportingDocuments.length === 0
      ? ["- none"]
      : answerPackage.supportingDocuments.map((candidate) => `- ${candidate.label} | ${candidate.reason}`)),
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

const createSearchTaskContract = (
  runtime: SourceSearchCommandRuntime,
  projectId: string,
  query: string,
  now: string
): TaskContract => ({
  id: runtime.createId("source-search-task"),
  operatorIntentId: runtime.createId("source-search-intent"),
  projectId,
  title: `Knowledge search readback: ${query}`,
  objective: query,
  constraints: [
    "read-only knowledge search",
    "show proof and non-proof boundaries"
  ],
  nonGoals: [
    "crawler",
    "dashboard",
    "API",
    "MCP",
    "Memory Core mutation"
  ],
  acceptance: [
    "show reviewable SourceClaim/SearchDocument candidates",
    "show exclusions or no-match guidance"
  ],
  status: "active",
  metadata: {
    source: "krn source search"
  },
  createdAt: now,
  updatedAt: now
});

const createSearchSourceQuery = (taskContract: TaskContract, query: string) => {
  const queryOnly = buildActivationQuery({
    ...taskContract,
    title: "",
    objective: query,
    constraints: [],
    nonGoals: [],
    acceptance: []
  }, {
    focus: "source",
    needs: ["source", "search"]
  });

  return {
    ...queryOnly,
    text: query
  };
};

type SourceSearchRenderInput = {
  query: string;
  projectId: string;
  limit: number;
  maxInclusions: number;
  candidates: readonly RankedActivationCandidate[];
  diagnostics: RetrieveActivationCandidatesResult["diagnostics"];
  relationSupport: readonly SourceSearchRelationSupport[];
};

const buildSearchReadback = (input: SourceSearchRenderInput) => {
  const included = input.candidates.filter((candidate) => candidate.exclusion === undefined);
  const excluded = input.candidates.filter((candidate) => candidate.exclusion !== undefined);
  const answerPackage = buildAnswerPackage({
    query: input.query,
    included,
    diagnostics: input.diagnostics,
    relationSupport: input.relationSupport
  });

  return {
    included,
    excluded,
    answerPackage,
    noMatchGuidance: buildNoMatchGuidance(input.candidates.length)
  };
};

const formatSearchResult = (input: SourceSearchRenderInput): string => {
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

const formatSearchJson = (input: SourceSearchRenderInput): string => {
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
    includedCandidates: readback.included.map((candidate) => candidateToOutput(candidate, "included")),
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

export const runSourceSearchCommand = async (
  runtime: SourceSearchCommandRuntime
): Promise<SourceSearchCommandResult> => {
  const query = runtime.command.query?.trim();

  if (query === undefined || query.length === 0) {
    throw new Error("--query is required for krn source search");
  }

  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn source search");
  }

  const now = runtime.now();
  const limit = runtime.command.limit ?? defaultLimit;
  const maxInclusions = runtime.command.maxInclusions ?? Math.min(defaultMaxInclusions, limit);
  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;
  const databaseRuntime = await createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    repoPathHint: await findRepoRoot(runtime.cwd),
    now: runtime.now,
    createId: runtime.createId
  });

  try {
    const retrievalRepository = databaseRuntime.retrievalRepository;

    if (retrievalRepository === undefined) {
      throw new Error("Retrieval repository is unavailable for krn source search");
    }

    const taskContract = createSearchTaskContract(
      runtime,
      databaseRuntime.projectId,
      query,
      now
    );
    const retrieved = await retrieveActivationCandidates({
      taskContract,
      sourceQuery: createSearchSourceQuery(taskContract, query),
      limits: {
        memory: 0,
        source: limit,
        search: limit,
        antiMemory: 0
      },
      repositories: {
        memoryRepository: databaseRuntime.compilerDependencies.memoryRepository,
        sourceRepository: databaseRuntime.compilerDependencies.sourceRepository,
        retrievalRepository
      }
    });
    const bounded = applyContextROI(retrieved.candidates, {
      maxInclusions,
      minimumDiverseKinds: ["source", "search"]
    });
    const relationSupport = await buildRelationSupport({
      included: bounded.filter((candidate) => candidate.exclusion === undefined),
      sourceRepository: databaseRuntime.sourceRepository
    });

    return {
      stdout: runtime.command.json === true
        ? formatSearchJson({
            query,
            projectId: databaseRuntime.projectId,
            limit,
            maxInclusions,
            candidates: bounded,
            diagnostics: retrieved.diagnostics,
            relationSupport
          })
        : formatSearchResult({
            query,
            projectId: databaseRuntime.projectId,
            limit,
            maxInclusions,
            candidates: bounded,
            diagnostics: retrieved.diagnostics,
            relationSupport
          })
    };
  } finally {
    await databaseRuntime.close();
  }
};
