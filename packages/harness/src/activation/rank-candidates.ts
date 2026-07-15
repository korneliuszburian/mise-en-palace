import type {
  SearchDocumentSearchResult,
} from "@krn/core/repositories";
import type {
  AntiMemoryRecord,
  MemoryRecord,
  MemoryRecordReviewSignal,
  IsoTimestamp,
  SourceClaim,
  SourceClaimEdge
} from "@krn/core";
import {
  assessSourceMetadataTemporalValidity,
  assessMemoryRecordReviewSignals,
  classifySourceClaimTaxonomy,
  projectStandardDecisionFromMemoryRecord,
  rankSourceAuthority,
  readSourceRelationMetadataReadback
} from "@krn/core";

import type {
  ActivationCandidate,
  ActivationQuery,
  RankedActivationCandidate
} from "./types.js";
import {
  markExcluded
} from "./types.js";
import {
  tokenizeActivationText
} from "./memory-query.js";
import {
  canonicalCandidateKey
} from "./candidate-identity.js";
import {
  defaultSourceClaimEdgeGraphScore,
  defaultSourceClaimEdgeRankDownScore,
  isSourceClaimEdgeRankDownKind,
  sourceClaimEdgeInfluenceDoesNotProve,
  sourceClaimEdgeInfluenceScore,
  sourceClaimEdgeRankDownDoesNotProve
} from "./source-claim-edge-scoring.js";

const confidenceToSourceAuthority = (confidence: number): ActivationCandidate["sourceAuthority"] => {
  if (confidence >= 85) {
    return "high";
  }

  if (confidence >= 60) {
    return "medium";
  }

  return "low";
};

const estimateTokens = (text: string): number => Math.max(24, Math.ceil(text.length / 4));

const lexicalScore = (candidateText: string, query: ActivationQuery): number => {
  const candidateTerms = new Set(tokenizeActivationText(candidateText));
  const hits = query.terms.filter((term) => candidateTerms.has(term)).length;

  return hits * 20;
};

const strongerSourceAuthority = (
  left: ActivationCandidate["sourceAuthority"],
  right: ActivationCandidate["sourceAuthority"]
): ActivationCandidate["sourceAuthority"] =>
  rankSourceAuthority(right) > rankSourceAuthority(left) ? right : left;

const activationTrustScore = (sourceAuthority: ActivationCandidate["sourceAuthority"]): number => {
  if (rankSourceAuthority(sourceAuthority) >= rankSourceAuthority("high")) {
    return 30;
  }

  if (rankSourceAuthority(sourceAuthority) >= rankSourceAuthority("medium")) {
    return 20;
  }

  return 10;
};

const preferredRepresentative = (
  left: RankedActivationCandidate,
  right: RankedActivationCandidate
): RankedActivationCandidate => {
  if (left.kind === "search" && right.kind !== "search") {
    return right;
  }

  if (right.kind === "search" && left.kind !== "search") {
    return left;
  }

  return right.totalScore > left.totalScore ? right : left;
};

const uniqueStrings = (values: readonly string[]): string[] => [...new Set(values)];

interface MergedCandidateScores {
  lexical: number;
  vector: number;
  graph: number;
  temporal: number;
  contextRoi: number;
  feedback: number;
  trust: number;
}

const mergedFeedbackScore = (left: number, right: number): number =>
  left < 0 || right < 0
    ? Math.min(left, right)
    : Math.max(left, right);

const mergedScores = (
  left: RankedActivationCandidate,
  right: RankedActivationCandidate,
  sourceAuthority: ActivationCandidate["sourceAuthority"]
): MergedCandidateScores => ({
  lexical: Math.max(left.lexicalScore, right.lexicalScore),
  vector: Math.max(left.vectorScore, right.vectorScore),
  graph: Math.max(left.graphScore, right.graphScore),
  temporal: Math.max(left.temporalScore, right.temporalScore),
  contextRoi: Math.max(left.contextRoiScore, right.contextRoiScore),
  feedback: mergedFeedbackScore(left.feedbackScore, right.feedbackScore),
  trust: activationTrustScore(sourceAuthority)
});

const mergedTotalScore = (scores: MergedCandidateScores): number =>
  scores.lexical +
  scores.vector +
  scores.graph +
  scores.temporal +
  scores.contextRoi +
  scores.feedback +
  scores.trust;

const stringArrayMetadata = (
  value: unknown,
  fallback: string
): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [fallback];

const mergedMetadataStrings = (
  left: RankedActivationCandidate,
  right: RankedActivationCandidate,
  key: string,
  leftFallback: string,
  rightFallback: string
): string[] => uniqueStrings([
  ...stringArrayMetadata(left.metadata[key], leftFallback),
  ...stringArrayMetadata(right.metadata[key], rightFallback)
]);

const searchDocumentIdInputs = (candidate: RankedActivationCandidate): string[] => [
  ...(candidate.searchDocumentIds ?? []),
  ...(candidate.searchDocumentId === undefined ? [] : [candidate.searchDocumentId]),
  ...(candidate.kind === "search" ? [candidate.subjectId] : [])
];

const mergedSearchDocumentIds = (
  left: RankedActivationCandidate,
  right: RankedActivationCandidate
): string[] => uniqueStrings([
  ...searchDocumentIdInputs(left),
  ...searchDocumentIdInputs(right)
]);

const mergeTwoCandidates = (
  left: RankedActivationCandidate,
  right: RankedActivationCandidate
): RankedActivationCandidate => {
  const representative = preferredRepresentative(left, right);
  const sourceAuthority = strongerSourceAuthority(left.sourceAuthority, right.sourceAuthority);
  const scores = mergedScores(left, right, sourceAuthority);
  const searchDocumentIds = mergedSearchDocumentIds(left, right);
  const mergedCandidateIds = mergedMetadataStrings(
    left,
    right,
    "mergedCandidateIds",
    left.id,
    right.id
  );
  const mergedKinds = mergedMetadataStrings(
    left,
    right,
    "mergedKinds",
    left.kind,
    right.kind
  );

  return {
    ...representative,
    sourceAuthority,
    tokenEstimate: Math.min(left.tokenEstimate, right.tokenEstimate),
    lexicalScore: scores.lexical,
    vectorScore: scores.vector,
    graphScore: scores.graph,
    temporalScore: scores.temporal,
    contextRoiScore: scores.contextRoi,
    feedbackScore: scores.feedback,
    ...(searchDocumentIds.length === 0 ? {} : { searchDocumentIds }),
    totalScore: mergedTotalScore(scores),
    metadata: {
      ...left.metadata,
      ...right.metadata,
      mergedCandidateIds,
      mergedKinds,
      ...(searchDocumentIds.length === 0 ? {} : { mergedSearchDocumentIds: searchDocumentIds })
    }
  };
};

const memoryFeedbackScore = (record: MemoryRecord): number =>
  record.positiveFeedbackCount * 2 - record.negativeFeedbackCount * 15;

const memoryReviewSignalMetadata = (
  signals: readonly MemoryRecordReviewSignal[]
): Record<string, unknown> =>
  signals.length === 0 ? {} : { memoryReviewSignals: signals };

const canonicalRevisionMetadata = (input: {
  subjectType: "memory_record" | "source_claim";
  subjectId: string;
  updatedAt: IsoTimestamp;
  status: string;
  currentVersionId?: string;
}): Record<string, unknown> => ({
  canonicalRevision: {
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    updatedAt: input.updatedAt,
    status: input.status,
    ...(input.currentVersionId === undefined ? {} : { currentVersionId: input.currentVersionId })
  }
});

export interface SourceClaimEdgeInfluenceInput {
  edges: readonly SourceClaimEdge[];
  seedSourceClaimIds: readonly SourceClaim["id"][];
  now: IsoTimestamp;
  graphScore?: number;
}

interface SourceClaimEdgeInfluence {
  edgeIds: string[];
  edgeKinds: SourceClaimEdge["kind"][];
  graphScore: number;
  missingRelationSupportEdgeIds: string[];
  seedSourceClaimIds: SourceClaim["id"][];
}

const connectedSourceClaimIdFor = (
  edge: SourceClaimEdge,
  seedSourceClaimIds: ReadonlySet<SourceClaim["id"]>
): SourceClaim["id"] | undefined => {
  if (seedSourceClaimIds.has(edge.fromSourceClaimId)) {
    return edge.toSourceClaimId;
  }

  return seedSourceClaimIds.has(edge.toSourceClaimId)
    ? edge.fromSourceClaimId
    : undefined;
};

const edgeHasRelationSupport = (edge: SourceClaimEdge): boolean => {
  const relationMetadata = readSourceRelationMetadataReadback(edge.metadata);

  return relationMetadata.evidenceRefs.length > 0 ||
    relationMetadata.sourceDecisionRef !== undefined;
};

const seedSourceClaimIdForConnection = (
  edge: SourceClaimEdge,
  connectedSourceClaimId: SourceClaim["id"]
): SourceClaim["id"] =>
  edge.fromSourceClaimId === connectedSourceClaimId
    ? edge.toSourceClaimId
    : edge.fromSourceClaimId;

const emptySourceClaimEdgeInfluence = (): SourceClaimEdgeInfluence => ({
  edgeIds: [],
  edgeKinds: [],
  graphScore: 0,
  missingRelationSupportEdgeIds: [],
  seedSourceClaimIds: []
});

const mergeSourceClaimEdgeInfluence = (
  existing: SourceClaimEdgeInfluence | undefined,
  input: {
    edge: SourceClaimEdge;
    graphScore: number;
    hasRelationSupport: boolean;
    seedSourceClaimId: SourceClaim["id"];
  }
): SourceClaimEdgeInfluence => {
  const current = existing ?? emptySourceClaimEdgeInfluence();
  const missingRelationSupportEdgeIds = input.hasRelationSupport
    ? current.missingRelationSupportEdgeIds
    : [...current.missingRelationSupportEdgeIds, input.edge.id];

  return {
    edgeIds: [...current.edgeIds, input.edge.id],
    edgeKinds: [...current.edgeKinds, input.edge.kind],
    graphScore: Math.max(current.graphScore, input.graphScore),
    missingRelationSupportEdgeIds,
    seedSourceClaimIds: [...current.seedSourceClaimIds, input.seedSourceClaimId]
  };
};

const applySourceClaimEdgeInfluenceToCandidate = (
  candidate: ActivationCandidate,
  influence: SourceClaimEdgeInfluence
): ActivationCandidate => {
  const missingRelationSupportEdgeIds = [...new Set(influence.missingRelationSupportEdgeIds)];

  return {
    ...candidate,
    graphScore: Math.max(candidate.graphScore ?? 0, influence.graphScore),
    reason: `${candidate.reason} Edge-aware source graph context: ${influence.edgeKinds.join(", ")}.`,
    expectedUse: `${candidate.expectedUse} Review with connected SourceClaimEdge context before claiming graph retrieval quality.`,
    metadata: {
      ...candidate.metadata,
      sourceClaimEdgeInfluence: {
        edgeIds: [...new Set(influence.edgeIds)],
        edgeKinds: [...new Set(influence.edgeKinds)],
        ...(missingRelationSupportEdgeIds.length === 0
          ? {}
          : { missingRelationSupportEdgeIds }),
        seedSourceClaimIds: [...new Set(influence.seedSourceClaimIds)],
        doesNotProve: sourceClaimEdgeInfluenceDoesNotProve
      }
    }
  };
};

export const applySourceClaimEdgeInfluence = (
  candidates: readonly ActivationCandidate[],
  input: SourceClaimEdgeInfluenceInput
): ActivationCandidate[] => {
  const seedSourceClaimIds = new Set(input.seedSourceClaimIds);
  const baseGraphScore = input.graphScore ?? defaultSourceClaimEdgeGraphScore;
  const influenceBySourceClaimId = new Map<SourceClaim["id"], SourceClaimEdgeInfluence>();

  for (const edge of input.edges) {
    if (assessSourceMetadataTemporalValidity(edge.metadata, input.now).status !== "current") {
      continue;
    }

    const connectedSourceClaimId = connectedSourceClaimIdFor(edge, seedSourceClaimIds);

    if (connectedSourceClaimId === undefined) {
      continue;
    }

    const existing = influenceBySourceClaimId.get(connectedSourceClaimId);
    const seedSourceClaimId = seedSourceClaimIdForConnection(edge, connectedSourceClaimId);
    const weightedGraphScore = sourceClaimEdgeInfluenceScore(edge.kind, baseGraphScore);
    const hasRelationSupport = edgeHasRelationSupport(edge);
    const supportedGraphScore = hasRelationSupport ? weightedGraphScore : 0;

    influenceBySourceClaimId.set(
      connectedSourceClaimId,
      mergeSourceClaimEdgeInfluence(existing, {
        edge,
        graphScore: supportedGraphScore,
        hasRelationSupport,
        seedSourceClaimId
      })
    );
  }

  return candidates.map((candidate) => {
    if (candidate.subjectType !== "source_claim") {
      return candidate;
    }

    const influence = influenceBySourceClaimId.get(candidate.subjectId);

    if (influence === undefined) {
      return candidate;
    }

    return applySourceClaimEdgeInfluenceToCandidate(candidate, influence);
  });
};

export interface SourceClaimEdgeRankDownInput {
  edges: readonly SourceClaimEdge[];
  rankDownAuthoritySourceClaimIds: readonly SourceClaim["id"][];
  now: IsoTimestamp;
  graphPenalty?: number;
}

export const applySourceClaimEdgeRankDown = (
  candidates: readonly ActivationCandidate[],
  input: SourceClaimEdgeRankDownInput
): ActivationCandidate[] => {
  const rankDownAuthoritySourceClaimIds = new Set(input.rankDownAuthoritySourceClaimIds);
  const graphPenalty = input.graphPenalty ?? defaultSourceClaimEdgeRankDownScore;
  const rankDownBySourceClaimId = new Map<SourceClaim["id"], {
    edgeIds: string[];
    edgeKinds: SourceClaimEdge["kind"][];
    governingSourceClaimIds: SourceClaim["id"][];
  }>();

  for (const edge of input.edges) {
    if (!isSourceClaimEdgeRankDownKind(edge.kind)) {
      continue;
    }

    if (assessSourceMetadataTemporalValidity(edge.metadata, input.now).status !== "current") {
      continue;
    }

    if (!rankDownAuthoritySourceClaimIds.has(edge.fromSourceClaimId)) {
      continue;
    }

    const existing = rankDownBySourceClaimId.get(edge.toSourceClaimId);

    rankDownBySourceClaimId.set(edge.toSourceClaimId, {
      edgeIds: [...(existing?.edgeIds ?? []), edge.id],
      edgeKinds: [...(existing?.edgeKinds ?? []), edge.kind],
      governingSourceClaimIds: [
        ...(existing?.governingSourceClaimIds ?? []),
        edge.fromSourceClaimId
      ]
    });
  }

  return candidates.map((candidate) => {
    if (candidate.subjectType !== "source_claim") {
      return candidate;
    }

    const rankDown = rankDownBySourceClaimId.get(candidate.subjectId);

    if (rankDown === undefined) {
      return candidate;
    }
    const sourceClaimEdgeRankDown = {
      edgeIds: [...new Set(rankDown.edgeIds)],
      edgeKinds: [...new Set(rankDown.edgeKinds)],
      governingSourceClaimIds: [...new Set(rankDown.governingSourceClaimIds)],
      graphPenalty,
      doesNotProve: sourceClaimEdgeRankDownDoesNotProve
    };

    return {
      ...candidate,
      graphScore: (candidate.graphScore ?? 0) - graphPenalty,
      reason: `${candidate.reason} Source graph rank-down: ${rankDown.edgeKinds.join(", ")} edge from accepted claim.`,
      expectedUse: `${candidate.expectedUse} Treat as lower-priority source evidence until the graph relation is reviewed.`,
      sourceClaimEdgeRankDown,
      metadata: {
        ...candidate.metadata,
        sourceClaimEdgeRankDown
      }
    };
  });
};

export const toMemoryCandidate = (record: MemoryRecord): ActivationCandidate => {
  const memoryReviewSignals = assessMemoryRecordReviewSignals(record);
  const projectStandardDecision = projectStandardDecisionFromMemoryRecord(record);

  return {
    id: record.id,
    kind: "memory",
    subjectType: "memory_record",
    subjectId: record.id,
    text: [record.summary, record.body, record.applicationGuidance].join(" "),
    sourceAuthority: confidenceToSourceAuthority(record.confidence),
    reason: `Memory: ${record.summary}`,
    expectedUse: record.applicationGuidance,
    tokenEstimate: estimateTokens([record.summary, record.body].join(" ")),
    status: record.status,
    validFrom: record.validFrom,
    ...(record.validUntil === undefined ? {} : { validUntil: record.validUntil }),
    ...(record.invalidatedAt === undefined ? {} : { invalidatedAt: record.invalidatedAt }),
    ...(record.invalidationReason === undefined
      ? {}
      : { invalidationReason: record.invalidationReason }),
    feedbackScore: memoryFeedbackScore(record),
    ...(memoryReviewSignals.length === 0 ? {} : { memoryReviewSignals }),
    metadata: {
      key: record.key,
      kind: record.kind,
      confidence: record.confidence,
      positiveFeedbackCount: record.positiveFeedbackCount,
      negativeFeedbackCount: record.negativeFeedbackCount,
      feedbackPenalty: Math.min(0, memoryFeedbackScore(record)),
      ...canonicalRevisionMetadata({
        subjectType: "memory_record",
        subjectId: record.id,
        updatedAt: record.updatedAt,
        status: record.status,
        ...(record.currentVersionId === undefined ? {} : { currentVersionId: record.currentVersionId })
      }),
      ...(projectStandardDecision === undefined ? {} : { projectStandardDecision }),
      ...memoryReviewSignalMetadata(memoryReviewSignals)
    }
  };
};

export const toSourceClaimCandidate = (claim: SourceClaim): ActivationCandidate => {
  const taxonomy = classifySourceClaimTaxonomy(claim);
  const temporalMetadata = readSourceRelationMetadataReadback(claim.metadata);
  const validUntil = temporalMetadata.validUntil ?? claim.revisitWhen;

  return {
    id: claim.id,
    kind: "source",
    subjectType: "source_claim",
    subjectId: claim.id,
    text: [claim.claim, claim.mechanism, claim.krnImplication, claim.doesNotProve].join(" "),
    sourceAuthority: claim.sourceAuthority,
    sourceAuthorityRank: taxonomy.authorityRank,
    sourceKind: taxonomy.sourceKind,
    sourceSupportRelation: taxonomy.supportRelation,
    sourceUse: taxonomy.sourceUse,
    reason: `Source claim: ${claim.claim}`,
    expectedUse: claim.krnImplication,
    tokenEstimate: estimateTokens([claim.claim, claim.mechanism, claim.krnImplication].join(" ")),
    hasMechanism: claim.mechanism.trim().length > 0,
    doesNotProve: claim.doesNotProve,
    sourceClaimStatus: claim.status,
    ...(temporalMetadata.validFrom === undefined
      ? {}
      : { validFrom: temporalMetadata.validFrom }),
    ...(validUntil === undefined ? {} : { validUntil }),
    ...(temporalMetadata.invalidatedAt === undefined
      ? {}
      : { invalidatedAt: temporalMetadata.invalidatedAt }),
    metadata: {
      sourceArtifactId: claim.sourceArtifactId,
      sourceClaimStatus: claim.status,
      claim: claim.claim,
      mechanism: claim.mechanism,
      krnImplication: claim.krnImplication,
      supportType: claim.supportType,
      authorityRank: taxonomy.authorityRank,
      sourceKind: taxonomy.sourceKind,
      supportRelation: taxonomy.supportRelation,
      sourceUse: taxonomy.sourceUse,
      decisionGrade: taxonomy.decisionGrade,
      consumer: claim.consumer,
      ...canonicalRevisionMetadata({
        subjectType: "source_claim",
        subjectId: claim.id,
        updatedAt: claim.updatedAt,
        status: claim.status
      }),
      ...(claim.falsifier === undefined ? {} : { falsifier: claim.falsifier })
    }
  };
};

export const toSearchCandidate = (document: SearchDocumentSearchResult): ActivationCandidate => ({
  id: document.id,
  kind: "search",
  subjectType: "search_document",
  subjectId: document.id,
  text: [document.title, document.body, document.searchText].join(" "),
  sourceAuthority: document.sourceAuthority,
  reason: `Search document: ${document.title}`,
  expectedUse: "Use when the search document directly matches the task query.",
  tokenEstimate: estimateTokens([document.title, document.body].join(" ")),
  validFrom: document.validFrom,
  ...(document.validUntil === undefined ? {} : { validUntil: document.validUntil }),
  ...(document.invalidatedAt === undefined ? {} : { invalidatedAt: document.invalidatedAt }),
  lexicalScore: document.lexicalScore,
  ...(document.vectorScore === undefined ? {} : { vectorScore: document.vectorScore }),
  ...(document.graphScore === undefined ? {} : { graphScore: document.graphScore }),
  ...(document.temporalScore === undefined ? {} : { temporalScore: document.temporalScore }),
  ...(document.contextRoiScore === undefined ? {} : { contextRoiScore: document.contextRoiScore }),
  searchDocumentId: document.id,
  ...(document.sourceClaimId === undefined ? {} : { sourceClaimId: document.sourceClaimId }),
  ...(document.memoryRecordId === undefined ? {} : { memoryRecordId: document.memoryRecordId }),
  ...(document.antiMemoryRecordId === undefined
    ? {}
    : { antiMemoryRecordId: document.antiMemoryRecordId }),
  metadata: {
    subjectType: document.subjectType,
    subjectId: document.subjectId,
    ...(document.embeddingModel === undefined
      ? {}
      : { embeddingModel: document.embeddingModel })
  }
});

const antiMemoryCandidate = (
  record: AntiMemoryRecord
): ActivationCandidate => ({
  id: record.id,
  kind: "anti_memory",
  subjectType: "anti_memory_record",
  subjectId: record.id,
  text: [
    record.key,
    record.rejectedClaim,
    record.reason,
    record.appliesTo,
    record.summary,
    record.body
  ].filter((value): value is string => value !== undefined).join(" "),
  sourceAuthority: confidenceToSourceAuthority(record.confidence),
  reason: `Rejected path: ${record.reason ?? record.summary}`,
  expectedUse:
    "Preserve as a non-governing rejected-path warning; never activate it as positive authority.",
  tokenEstimate: estimateTokens([record.summary, record.body].join(" ")),
  validFrom: record.validFrom,
  ...(record.validUntil === undefined ? {} : { validUntil: record.validUntil }),
  ...(record.invalidatedAt === undefined ? {} : { invalidatedAt: record.invalidatedAt }),
  antiMemoryRecordId: record.id,
  metadata: {
    key: record.key,
    ...(record.rejectedClaim === undefined ? {} : { rejectedClaim: record.rejectedClaim }),
    ...(record.reason === undefined ? {} : { reason: record.reason }),
    ...(record.appliesTo === undefined ? {} : { appliesTo: record.appliesTo }),
    ...(record.mayRevisitWhen === undefined ? {} : { mayRevisitWhen: record.mayRevisitWhen }),
    sourceLineage: record.sourceLineage,
    nonGoverning: true
  }
});

export const rankCandidates = (
  candidates: readonly ActivationCandidate[],
  query: ActivationQuery
): RankedActivationCandidate[] =>
  candidates
    .map((candidate) => {
      const lexical = candidate.lexicalScore ?? lexicalScore(candidate.text, query);
      const vector = candidate.vectorScore ?? 0;
      const graph = candidate.graphScore ?? 0;
      const temporal = candidate.temporalScore ?? 0;
      const contextRoi = candidate.contextRoiScore ?? 0;
      const feedback = candidate.feedbackScore ?? 0;
      const trust = activationTrustScore(candidate.sourceAuthority);

      return {
        ...candidate,
        lexicalScore: lexical,
        vectorScore: vector,
        graphScore: graph,
        temporalScore: temporal,
        contextRoiScore: contextRoi,
        feedbackScore: feedback,
        totalScore: lexical + vector + graph + temporal + contextRoi + feedback + trust
      };
    })
    .sort((left, right) => right.totalScore - left.totalScore);

export const toNonGoverningAntiMemoryCandidate = (
  record: AntiMemoryRecord,
  query: ActivationQuery
): RankedActivationCandidate => {
  const candidate = rankCandidates([antiMemoryCandidate(record)], query)[0];

  if (candidate === undefined) {
    throw new Error(`Anti-memory ${record.id} did not produce an activation candidate`);
  }

  return markExcluded(candidate, {
    reason: "unsafe",
    explanation: `Non-governing ${candidate.reason} (anti-memory ${record.id}).`
  });
};

export const mergeActivationCandidates = (
  candidates: readonly RankedActivationCandidate[]
): RankedActivationCandidate[] => {
  const mergedByKey = new Map<string, RankedActivationCandidate>();

  for (const candidate of candidates) {
    const key = canonicalCandidateKey(candidate);
    const existing = mergedByKey.get(key);

    mergedByKey.set(key, existing === undefined
      ? candidate
      : mergeTwoCandidates(existing, candidate));
  }

  return [...mergedByKey.values()].sort((left, right) => right.totalScore - left.totalScore);
};
