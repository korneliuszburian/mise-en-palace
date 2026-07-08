import type {
  SourceClaimEdge
} from "@krn/core";

export const defaultSourceClaimEdgeGraphScore = 10;
export const defaultSourceClaimEdgeRankDownScore = 60;

export const sourceClaimEdgeKindWeights = {
  supports: 1,
  contradicts: 1,
  qualifies: 0.75,
  depends_on: 0.75,
  duplicates: 0.75,
  supersedes: 1,
  narrows: 0.75,
  invalidates: 1,
  expires: 1
} satisfies Record<SourceClaimEdge["kind"], number>;

export const sourceClaimEdgeRankDownKinds = [
  "contradicts",
  "invalidates",
  "expires",
  "supersedes"
] as const satisfies readonly SourceClaimEdge["kind"][];

const sourceClaimEdgeRankDownKindSet = new Set<SourceClaimEdge["kind"]>(
  sourceClaimEdgeRankDownKinds
);

export const sourceClaimEdgeInfluenceScore = (
  kind: SourceClaimEdge["kind"],
  baseGraphScore: number = defaultSourceClaimEdgeGraphScore
): number => Math.round(baseGraphScore * sourceClaimEdgeKindWeights[kind]);

export const isSourceClaimEdgeRankDownKind = (
  kind: SourceClaimEdge["kind"]
): boolean => sourceClaimEdgeRankDownKindSet.has(kind);

export const sourceClaimEdgeInfluenceDoesNotProve =
  "SourceClaimEdge influence does not prove source truth, edge correctness, ranking quality, or product graph retrieval quality.";

export const sourceClaimEdgeRankDownDoesNotProve =
  "SourceClaimEdge rank-down does not prove source truth, edge correctness, or broad graph retrieval quality.";
