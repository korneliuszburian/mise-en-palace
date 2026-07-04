import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";

import {
  loadBrainRankingEvalFixture,
  parseBrainRankingEvalFixture,
  runBrainRankingEval
} from "../runBrainRankingEval.js";

const fixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/brain-ranking/brain-ranking-eval.json", import.meta.url)
);

describe("runBrainRankingEval", () => {
  it("passes the deterministic brain-ranking proxy fixture", async () => {
    const result = await runBrainRankingEval(loadBrainRankingEvalFixture(fixturePath));

    expect(result).toMatchObject({
      kind: "krn.brainRanking.eval.v1",
      status: "pass",
      topK: 5,
      metrics: {
        caseCount: 10,
        hitRateAtK: 1,
        ndcgAtK: 1
      }
    });
    expect(result.metrics.catalogBackedCases).toBeGreaterThanOrEqual(8);
    expect(result.metrics.sourceBackedCases).toBeGreaterThanOrEqual(2);
    expect(result.metrics.targetSpecificSelections).toBeGreaterThan(0);
    expect(result.proof.doesNotProve).toContain("proxy labels are not broad ranking truth");
    expect(result.proof.doesNotProve).toContain("broad semantic ranking quality");
  });

  it("fails when expected selected knowledge is absent from top-k", async () => {
    const result = await runBrainRankingEval(parseBrainRankingEvalFixture({
      version: "1",
      topK: 1,
      minimumHitRateAtK: 1,
      minimumNdcgAtK: 1,
      cases: Array.from({ length: 10 }, (_unused, index) => ({
        id: `negative-${index}`,
        query: "missing expected ranking packet",
        expectedSelectedKnowledgeIds: [`expected-${index}`],
        knowledgeCards: [{
          id: `actual-${index}`,
          title: "Actual packet",
          summary: "Actual selected packet does not match the proxy label.",
          consumers: ["negative fixture"],
          falsifier: "The eval passes despite missing the expected id.",
          doesNotProve: "This does not prove ranking quality.",
          nextAction: "use"
        }],
        sourceClaims: []
      }))
    }));

    expect(result.status).toBe("fail");
    expect(result.metrics.hitRateAtK).toBe(0);
    expect(result.cases.every((testCase) => !testCase.hitAtK)).toBe(true);
  });
});
