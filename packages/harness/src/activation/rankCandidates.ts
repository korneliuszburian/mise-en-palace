import type {
  MemoryRecord,
  SourceClaim
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
  metadata: {
    key: record.key,
    kind: record.kind,
    confidence: record.confidence
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
  doesNotProve: claim.doesNotProve,
  metadata: {
    sourceArtifactId: claim.sourceArtifactId,
    supportType: claim.supportType,
    consumer: claim.consumer
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
      const trust = trustRank[candidate.trustTier] * 10;

      return {
        ...candidate,
        lexicalScore: lexical,
        vectorScore: vector,
        graphScore: graph,
        temporalScore: temporal,
        contextRoiScore: contextRoi,
        totalScore: lexical + vector + graph + temporal + contextRoi + trust
      };
    })
    .sort((left, right) => right.totalScore - left.totalScore);
