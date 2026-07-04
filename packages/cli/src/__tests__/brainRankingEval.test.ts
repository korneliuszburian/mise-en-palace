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
        recallAtK: 1,
        ndcgAtK: 1
      }
    });
    expect(result.metrics.catalogBackedCases).toBeGreaterThanOrEqual(8);
    expect(result.metrics.sourceBackedCases).toBeGreaterThanOrEqual(2);
    expect(result.metrics.targetSpecificSelections).toBeGreaterThan(0);
    expect(result.proof.proves).toContain(
      "brain search reports recall@k over expected proxy-labeled selectedKnowledge ids"
    );
    expect(result.proof.doesNotProve).toContain("proxy labels are not broad ranking truth");
    expect(result.proof.doesNotProve).toContain("broad semantic ranking quality");
  });

  it("returns identical results for consecutive fixture runs", async () => {
    const fixture = loadBrainRankingEvalFixture(fixturePath);
    const first = await runBrainRankingEval(fixture);
    const second = await runBrainRankingEval(fixture);

    expect(second).toEqual(first);
  });

  it("counts unique expected ids for recall@k", async () => {
    const result = await runBrainRankingEval(parseBrainRankingEvalFixture({
      version: "1",
      topK: 5,
      minimumHitRateAtK: 1,
      minimumRecallAtK: 1,
      minimumNdcgAtK: 0,
      cases: Array.from({ length: 10 }, (_unused, index) => ({
        id: `duplicate-${index}`,
        query: "duplicate selected knowledge ids",
        expectedSelectedKnowledgeIds: ["expected-a", "expected-b"],
        knowledgeCards: [
          {
            id: "expected-a",
            title: "Expected A",
            summary: "Repeated packet should count once toward recall.",
            consumers: ["negative fixture"],
            falsifier: "Recall exceeds the unique expected id match count.",
            doesNotProve: "This does not prove ranking quality.",
            nextAction: "use"
          },
          {
            id: "expected-a",
            title: "Expected A duplicate",
            summary: "Duplicate packet should not count twice toward recall.",
            consumers: ["negative fixture"],
            falsifier: "Recall exceeds the unique expected id match count.",
            doesNotProve: "This does not prove ranking quality.",
            nextAction: "use"
          }
        ],
        sourceClaims: []
      }))
    }));

    expect(result.status).toBe("fail");
    expect(result.cases[0]?.recallAtK).toBe(0.5);
    expect(result.metrics.recallAtK).toBe(0.5);
  });

  it("fails when expected selected knowledge is absent from top-k", async () => {
    const result = await runBrainRankingEval(parseBrainRankingEvalFixture({
      version: "1",
      topK: 1,
      minimumHitRateAtK: 1,
      minimumRecallAtK: 1,
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
    expect(result.metrics.recallAtK).toBe(0);
    expect(result.cases.every((testCase) => !testCase.hitAtK)).toBe(true);
  });
});
