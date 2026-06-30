import type {
  SearchDocumentSearchResult,
} from "../repositories/types.js";
import type {
  MemoryRecord,
  SourceClaim,
  SourceClaimEdge
} from "@krn/core";

import type {
  ActivationCandidate,
  ActivationQuery,
  RankedActivationCandidate
} from "./types.js";
import {
  tokenizeActivationText
} from "./memoryQuery.js";
import { trustRank } from "./types.js";

const confidenceToTrustTier = (confidence: number): ActivationCandidate["trustTier"] => {
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

const canonicalCandidateKey = (candidate: RankedActivationCandidate): string => {
  if (candidate.sourceClaimId !== undefined) {
    return `source_claim:${candidate.sourceClaimId}`;
  }

  if (candidate.memoryRecordId !== undefined) {
    return `memory_record:${candidate.memoryRecordId}`;
  }

  return `${candidate.subjectType}:${candidate.subjectId}`;
};

const strongerTrustTier = (
  left: ActivationCandidate["trustTier"],
  right: ActivationCandidate["trustTier"]
): ActivationCandidate["trustTier"] =>
  trustRank[right] > trustRank[left] ? right : left;

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

const mergedScores = (
  left: RankedActivationCandidate,
  right: RankedActivationCandidate,
  trustTier: ActivationCandidate["trustTier"]
): MergedCandidateScores => ({
  lexical: Math.max(left.lexicalScore, right.lexicalScore),
  vector: Math.max(left.vectorScore, right.vectorScore),
  graph: Math.max(left.graphScore, right.graphScore),
  temporal: Math.max(left.temporalScore, right.temporalScore),
  contextRoi: Math.max(left.contextRoiScore, right.contextRoiScore),
  feedback: left.feedbackScore + right.feedbackScore,
  trust: trustRank[trustTier] * 10
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
  const trustTier = strongerTrustTier(left.trustTier, right.trustTier);
  const scores = mergedScores(left, right, trustTier);
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
    trustTier,
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

export interface SourceClaimEdgeInfluenceInput {
  edges: readonly SourceClaimEdge[];
  seedSourceClaimIds: readonly SourceClaim["id"][];
  graphScore?: number;
}

const defaultSourceClaimEdgeGraphScore = 10;

const sourceClaimEdgeKindWeight: Record<SourceClaimEdge["kind"], number> = {
  supports: 1,
  contradicts: 1,
  qualifies: 0.75,
  depends_on: 0.75,
  duplicates: 0.75,
  supersedes: 1,
  narrows: 0.75,
  invalidates: 1,
  expires: 1
};

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

export const applySourceClaimEdgeInfluence = (
  candidates: readonly ActivationCandidate[],
  input: SourceClaimEdgeInfluenceInput
): ActivationCandidate[] => {
  const seedSourceClaimIds = new Set(input.seedSourceClaimIds);
  const baseGraphScore = input.graphScore ?? defaultSourceClaimEdgeGraphScore;
  const influenceBySourceClaimId = new Map<SourceClaim["id"], {
    edgeIds: string[];
    edgeKinds: SourceClaimEdge["kind"][];
    graphScore: number;
    seedSourceClaimIds: SourceClaim["id"][];
  }>();

  for (const edge of input.edges) {
    const connectedSourceClaimId = connectedSourceClaimIdFor(edge, seedSourceClaimIds);

    if (connectedSourceClaimId === undefined) {
      continue;
    }

    const existing = influenceBySourceClaimId.get(connectedSourceClaimId);
    const seedSourceClaimId = edge.fromSourceClaimId === connectedSourceClaimId
      ? edge.toSourceClaimId
      : edge.fromSourceClaimId;
    const weightedGraphScore = Math.round(baseGraphScore * sourceClaimEdgeKindWeight[edge.kind]);

    influenceBySourceClaimId.set(connectedSourceClaimId, {
      edgeIds: [...(existing?.edgeIds ?? []), edge.id],
      edgeKinds: [...(existing?.edgeKinds ?? []), edge.kind],
      graphScore: Math.max(existing?.graphScore ?? 0, weightedGraphScore),
      seedSourceClaimIds: [...(existing?.seedSourceClaimIds ?? []), seedSourceClaimId]
    });
  }

  return candidates.map((candidate) => {
    if (candidate.subjectType !== "source_claim") {
      return candidate;
    }

    const influence = influenceBySourceClaimId.get(candidate.subjectId);

    if (influence === undefined) {
      return candidate;
    }

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
          seedSourceClaimIds: [...new Set(influence.seedSourceClaimIds)],
          doesNotProve: "SourceClaimEdge influence does not prove source truth, edge correctness, ranking quality, or product graph retrieval quality."
        }
      }
    };
  });
};

export const toMemoryCandidate = (record: MemoryRecord): ActivationCandidate => ({
  id: record.id,
  kind: "memory",
  subjectType: "memory_record",
  subjectId: record.id,
  text: [record.summary, record.body, record.applicationGuidance].join(" "),
  trustTier: confidenceToTrustTier(record.confidence),
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
  metadata: {
    key: record.key,
    kind: record.kind,
    confidence: record.confidence,
    positiveFeedbackCount: record.positiveFeedbackCount,
    negativeFeedbackCount: record.negativeFeedbackCount,
    feedbackPenalty: Math.min(0, memoryFeedbackScore(record))
  }
});

export const toSourceClaimCandidate = (claim: SourceClaim): ActivationCandidate => ({
  id: claim.id,
  kind: "source",
  subjectType: "source_claim",
  subjectId: claim.id,
  text: [claim.claim, claim.mechanism, claim.krnImplication, claim.doesNotProve].join(" "),
  trustTier: claim.trustTier,
  reason: `Source claim: ${claim.claim}`,
  expectedUse: claim.krnImplication,
  tokenEstimate: estimateTokens([claim.claim, claim.mechanism, claim.krnImplication].join(" ")),
  hasMechanism: claim.mechanism.trim().length > 0,
  doesNotProve: claim.doesNotProve,
  metadata: {
    sourceArtifactId: claim.sourceArtifactId,
    claim: claim.claim,
    mechanism: claim.mechanism,
    krnImplication: claim.krnImplication,
    supportType: claim.supportType,
    consumer: claim.consumer,
    ...(claim.falsifier === undefined ? {} : { falsifier: claim.falsifier })
  }
});

export const toSearchCandidate = (document: SearchDocumentSearchResult): ActivationCandidate => ({
  id: document.id,
  kind: "search",
  subjectType: "search_document",
  subjectId: document.id,
  text: [document.title, document.body, document.searchText].join(" "),
  trustTier: document.trustTier,
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
    subjectId: document.subjectId
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
      const trust = trustRank[candidate.trustTier] * 10;

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
