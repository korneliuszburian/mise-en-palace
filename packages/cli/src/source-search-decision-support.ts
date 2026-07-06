import type {
  SourceClaim,
  SourceClaimStatus,
  SourceDecisionEdge
} from "@krn/core";
import {
  isDecisionGradeSourceSupportType
} from "@krn/core";
import type {
  RankedActivationCandidate
} from "@krn/harness";

import type {
  DatabaseRuntime
} from "./database-runtime.js";

export type SourceSearchDecisionSupportState =
  | "linked"
  | "missing";

export interface SourceSearchDecisionSupport {
  sourceClaimId: SourceClaim["id"];
  sourceDecisionEdgeId: string;
  targetType: SourceDecisionEdge["targetType"];
  targetId: string;
  supportType: SourceDecisionEdge["supportType"];
  confidence: SourceDecisionEdge["confidence"];
  notes: string;
  doesNotProve: string;
  createdAt: string;
}

export const sourceClaimIdFor = (
  candidate: RankedActivationCandidate
): SourceClaim["id"] | undefined => (
  candidate.subjectType === "source_claim"
    ? (candidate.sourceClaimId ?? candidate.subjectId) as SourceClaim["id"]
    : undefined
);

export const sourceClaimIdsForCandidates = (
  candidates: readonly RankedActivationCandidate[]
): readonly SourceClaim["id"][] => [
  ...new Set(candidates.flatMap((candidate) => {
    const sourceClaimId = sourceClaimIdFor(candidate);

    return sourceClaimId === undefined ? [] : [sourceClaimId];
  }))
];

const metadataString = (
  metadata: Record<string, unknown>,
  key: string
): string | undefined => (
  typeof metadata[key] === "string" ? metadata[key] : undefined
);

const sourceDecisionSupportFromEdge = (
  edge: SourceDecisionEdge
): SourceSearchDecisionSupport => ({
  sourceClaimId: edge.sourceClaimId,
  sourceDecisionEdgeId: edge.id,
  targetType: edge.targetType,
  targetId: edge.targetId,
  supportType: edge.supportType,
  confidence: edge.confidence,
  notes: edge.notes,
  doesNotProve:
    metadataString(edge.metadata, "doesNotProve") ??
    "SourceDecisionEdge support does not prove source truth, target correctness, eval promotion, or Memory Core mutation.",
  createdAt: edge.createdAt
});

export const buildSourceDecisionSupport = async (input: {
  candidates: readonly RankedActivationCandidate[];
  sourceRepository: Pick<DatabaseRuntime["sourceRepository"], "listSourceDecisionEdgesForClaim">;
}): Promise<SourceSearchDecisionSupport[]> => {
  const listSourceDecisionEdgesForClaim = input.sourceRepository.listSourceDecisionEdgesForClaim;

  if (listSourceDecisionEdgesForClaim === undefined) {
    return [];
  }

  const sourceClaimIds = sourceClaimIdsForCandidates(input.candidates);
  const edgeGroups = await Promise.all(sourceClaimIds.map(async (sourceClaimId) =>
    (await input.sourceRepository.listSourceDecisionEdgesForClaim?.(sourceClaimId) ?? [])
      .map(sourceDecisionSupportFromEdge)
  ));

  return edgeGroups.flat();
};

export const sourceDecisionSupportForCandidates = (
  candidates: readonly RankedActivationCandidate[],
  sourceDecisionSupport: readonly SourceSearchDecisionSupport[]
): readonly SourceSearchDecisionSupport[] => {
  const sourceClaimIds = new Set(sourceClaimIdsForCandidates(candidates));

  return sourceDecisionSupport.filter((support) => sourceClaimIds.has(support.sourceClaimId));
};

export const groupSourceDecisionSupportByClaimId = (
  sourceDecisionSupport: readonly SourceSearchDecisionSupport[]
): ReadonlyMap<SourceClaim["id"], readonly SourceSearchDecisionSupport[]> => {
  const supportByClaimId = new Map<SourceClaim["id"], SourceSearchDecisionSupport[]>();

  for (const support of sourceDecisionSupport) {
    supportByClaimId.set(support.sourceClaimId, [
      ...(supportByClaimId.get(support.sourceClaimId) ?? []),
      support
    ]);
  }

  return supportByClaimId;
};

export const sourceDecisionSupportReadbackFor = (
  sourceClaimId: SourceClaim["id"] | undefined,
  sourceClaimStatus: SourceClaimStatus | undefined,
  decisionSupportBySourceClaimId:
    | ReadonlyMap<SourceClaim["id"], readonly SourceSearchDecisionSupport[]>
    | undefined
): {
  state: SourceSearchDecisionSupportState | undefined;
  edgeIds: readonly string[] | undefined;
  caveat: string | undefined;
} => {
  if (sourceClaimId === undefined || sourceClaimStatus !== "accepted") {
    return {
      state: undefined,
      edgeIds: undefined,
      caveat: undefined
    };
  }

  const support = decisionSupportBySourceClaimId?.get(sourceClaimId) ?? [];

  if (support.length > 0) {
    return {
      state: "linked",
      edgeIds: support.map((item) => item.sourceDecisionEdgeId),
      caveat: undefined
    };
  }

  return {
    state: "missing",
    edgeIds: [],
    caveat:
      `Accepted SourceClaim ${sourceClaimId} has no SourceDecisionEdge support in this readback; treat it as accepted claim evidence, not decision-linked authority.`
  };
};

const sourceDecisionEdgeConfidenceScores: Record<SourceDecisionEdge["confidence"], number> = {
  low: 8,
  medium: 15,
  high: 20
};

const decisionGradeSourceDecisionEdgeBonus = 5;

const sourceDecisionSupportScore = (
  support: readonly SourceSearchDecisionSupport[]
): number => Math.max(0, ...support.map((item) =>
  sourceDecisionEdgeConfidenceScores[item.confidence] +
  (isDecisionGradeSourceSupportType(item.supportType)
    ? decisionGradeSourceDecisionEdgeBonus
    : 0)
));

export const applySourceDecisionSupportBoost = (
  candidates: readonly RankedActivationCandidate[],
  sourceDecisionSupport: readonly SourceSearchDecisionSupport[]
): readonly RankedActivationCandidate[] => {
  const decisionSupportBySourceClaimId = groupSourceDecisionSupportByClaimId(sourceDecisionSupport);

  return candidates.map((candidate) => {
    const sourceClaimId = sourceClaimIdFor(candidate);

    if (
      candidate.exclusion !== undefined ||
      candidate.subjectType !== "source_claim" ||
      sourceClaimId === undefined
    ) {
      return candidate;
    }

    const support = decisionSupportBySourceClaimId.get(sourceClaimId) ?? [];

    if (support.length === 0) {
      return candidate;
    }

    const score = sourceDecisionSupportScore(support);
    const graphScore = candidate.graphScore + score;

    return {
      ...candidate,
      graphScore,
      totalScore: candidate.totalScore + score,
      reason: `${candidate.reason} Decision-linked source support: SourceDecisionEdge readback exists.`,
      expectedUse: `${candidate.expectedUse} Prefer over accepted-only SourceClaims when relevance is otherwise comparable.`,
      metadata: {
        ...candidate.metadata,
        sourceDecisionSupportBoost: {
          score,
          sourceDecisionEdgeIds: support.map((item) => item.sourceDecisionEdgeId),
          confidence: support.map((item) => item.confidence),
          supportTypes: support.map((item) => item.supportType),
          doesNotProve:
            "SourceDecisionEdge ranking boost does not prove source truth, target correctness, or broad retrieval quality."
        }
      }
    };
  });
};
