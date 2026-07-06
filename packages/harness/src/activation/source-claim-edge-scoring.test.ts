import { describe, expect, it } from "vitest";

import {
  defaultSourceClaimEdgeGraphScore,
  defaultSourceClaimEdgeRankDownScore,
  isSourceClaimEdgeRankDownKind,
  sourceClaimEdgeInfluenceScore,
  sourceClaimEdgeKindWeights,
  sourceClaimEdgeRankDownKinds
} from "./source-claim-edge-scoring.js";

describe("source claim edge scoring policy", () => {
  it("keeps relation-kind influence weights explicit and reviewable", () => {
    expect(sourceClaimEdgeKindWeights).toEqual({
      supports: 1,
      contradicts: 1,
      qualifies: 0.75,
      depends_on: 0.75,
      duplicates: 0.75,
      supersedes: 1,
      narrows: 0.75,
      invalidates: 1,
      expires: 1
    });
    expect(sourceClaimEdgeInfluenceScore("supports")).toBe(defaultSourceClaimEdgeGraphScore);
    expect(sourceClaimEdgeInfluenceScore("duplicates")).toBe(8);
    expect(sourceClaimEdgeInfluenceScore("narrows", 12)).toBe(9);
  });

  it("keeps rank-down relation kinds separate from positive influence weights", () => {
    expect(sourceClaimEdgeRankDownKinds).toEqual([
      "invalidates",
      "expires",
      "supersedes"
    ]);
    expect(defaultSourceClaimEdgeRankDownScore).toBe(60);
    expect(isSourceClaimEdgeRankDownKind("invalidates")).toBe(true);
    expect(isSourceClaimEdgeRankDownKind("duplicates")).toBe(false);
    expect(isSourceClaimEdgeRankDownKind("supports")).toBe(false);
  });
});
