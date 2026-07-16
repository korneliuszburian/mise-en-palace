import type {
  RetrieveActivationCandidatesResult,
  RankedActivationCandidate
} from "@krn/harness";
import {
  formatSourceSearchCandidate,
  sourceSearchCandidateToOutput
} from "./source-search-candidate-readback.js";
import type {
  SourceSearchAnswerCandidate
} from "./source-search-candidate-readback.js";
import {
  buildSourceSearchAnswerPackage
} from "./source-search-answer-package.js";
import type {
  SourceSearchAnswerPackage
} from "./source-search-answer-package.js";
import type {
  SourceSearchRelationSupport,
  SourceSearchSourceClaimDocumentLink
} from "./source-search-graph-readback.js";
import {
  groupSourceDecisionSupportByClaimId
} from "./source-search-decision-support.js";
import type {
  SourceSearchDecisionSupport
} from "./source-search-decision-support.js";

export {
  buildSourceSearchMissingEvidence,
  buildSourceSearchQueryShapeDiagnostics,
  classifySourceSearchAnswerUsefulness
} from "./source-search-answer-package.js";

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

const formatSourceDecisionSupport = (
  sourceDecisionSupport: readonly SourceSearchDecisionSupport[]
): readonly string[] =>
  sourceDecisionSupport.length === 0
    ? ["- none"]
    : sourceDecisionSupport.map((decision) =>
        [
          `- source_claim:${decision.sourceClaimId}`,
          ...(decision.sourceDecisionId === undefined
            ? []
            : [` source_decision:${decision.sourceDecisionId}`]),
          ` edge:${decision.sourceDecisionEdgeId}`,
          ` target:${decision.targetType}/${decision.targetId}`,
          ` supportType:${decision.supportType}`,
          ` confidence:${decision.confidence}`,
          ` notes:${decision.notes}`,
          ` doesNotProve:${decision.doesNotProve}`
        ].join("")
      );

const commaList = (values: readonly string[]): string =>
  values.length === 0 ? "none" : values.join(",");

const formatConsensusRelationEvidence = (
  relationEvidence: SourceSearchAnswerPackage["consensusReadback"]["entries"][number]["relationEvidence"]
): string =>
  relationEvidence.length === 0
    ? "none"
    : relationEvidence.map((relation) =>
        [
          relation.sourceClaimEdgeId,
          `direction=${relation.direction}`,
          `kind=${relation.kind}`,
          `related=${relation.relatedSourceClaimId}`,
          `temporalStatus=${relation.temporalValidity.status}`,
          `temporalReason=${
            relation.temporalValidity.status === "current"
              ? "none"
              : relation.temporalValidity.reason
          }`,
          `evidenceRefs=${commaList(relation.metadataEvidenceRefs)}`,
          `metadataSourceDecisionRef=${relation.metadataSourceDecisionRef ?? "none"}`,
          `gaps=${commaList(relation.evidenceGaps)}`
        ].join("/")
      ).join(";");

const formatConsensusReadback = (
  answerPackage: SourceSearchAnswerPackage
): readonly string[] => [
  "consensus readback:",
  `- currentSourceClaims: ${commaList(answerPackage.consensusReadback.currentSourceClaimIds)}`,
  `- caveatedSourceClaims: ${commaList(answerPackage.consensusReadback.caveatedSourceClaimIds)}`,
  `- historicalSourceClaims: ${commaList(answerPackage.consensusReadback.historicalSourceClaimIds)}`,
  `- staleSourceClaims: ${commaList(answerPackage.consensusReadback.staleSourceClaimIds)}`,
  `- supersededSourceClaims: ${commaList(answerPackage.consensusReadback.supersededSourceClaimIds)}`,
  `- unknownSourceClaims: ${commaList(answerPackage.consensusReadback.unknownSourceClaimIds)}`,
  `- rejectedSourceClaims: ${commaList(answerPackage.consensusReadback.rejectedSourceClaimIds)}`,
  "consensus entries:",
  ...(answerPackage.consensusReadback.entries.length === 0
    ? ["- none"]
    : answerPackage.consensusReadback.entries.map((entry) =>
        [
          `- source_claim:${entry.sourceClaimId}`,
          ` state:${entry.state}`,
          ` status:${entry.status}`,
          ` authority:${entry.sourceAuthority}`,
          ` decisionEdges:${commaList(entry.decisionSupportEdgeIds)}`,
          ` currentSupports:${commaList(entry.supportingSourceClaimIds)}`,
          ` currentConflicts:${commaList(entry.dissentingSourceClaimIds)}`,
          ` currentSupersededBy:${commaList(entry.supersededBySourceClaimIds)}`,
          ` relationEvidence:${formatConsensusRelationEvidence(entry.relationEvidence)}`,
          ` rejections:${commaList(entry.rejectionIds)}`,
          ` caveats:${commaList(entry.caveats)}`
        ].join("")
      )),
  `consensus doesNotProve: ${answerPackage.consensusReadback.doesNotProve}`
];

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
    ...formatConsensusReadback(answerPackage),
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
  consensusReadback: SourceSearchAnswerPackage["consensusReadback"];
};

const buildSearchReadback = (input: SourceSearchRenderInput) => {
  const included = input.candidates.filter((candidate) => candidate.exclusion === undefined);
  const excluded = input.candidates.filter((candidate) => candidate.exclusion !== undefined);
  const decisionSupportBySourceClaimId = groupSourceDecisionSupportByClaimId(
    input.sourceDecisionSupport
  );
  const answerPackage = buildSourceSearchAnswerPackage({
    query: input.query,
    included,
    diagnostics: input.diagnostics,
    relationSupport: input.relationSupport,
    sourceDecisionSupport: input.sourceDecisionSupport,
    sourceClaimDocumentLinks: input.sourceClaimDocumentLinks,
    consensusReadback: input.consensusReadback
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
      : readback.included.flatMap((candidate) => formatSourceSearchCandidate(candidate, "included"))),
    "",
    "Excluded candidates:",
    ...(readback.excluded.length === 0
      ? ["- none"]
      : readback.excluded.flatMap((candidate) => formatSourceSearchCandidate(candidate, "excluded"))),
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
      sourceSearchCandidateToOutput(candidate, "included", readback.decisionSupportBySourceClaimId)
    ),
    excludedCandidates: readback.excluded.map((candidate) => sourceSearchCandidateToOutput(candidate, "excluded")),
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
