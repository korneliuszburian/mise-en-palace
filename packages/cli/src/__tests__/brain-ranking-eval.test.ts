import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";

import {
  loadBrainRankingEvalFixture,
  parseBrainRankingEvalFixture,
  runBrainRankingEval
} from "../internal/eval/run-brain-ranking-eval.js";

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
      corpus: {
        name: "company-brain-pattern-ranking",
        caseCount: 11,
        distractorClasses: [
          "adjacent-governance-pattern",
          "target-specific-vs-generic",
          "catalog-vs-source",
          "obsolete-negative-memory"
        ]
      },
      metrics: {
        caseCount: 11,
        hitRateAtK: 1,
        recallAtK: 1,
        ndcgAtK: 1,
        expectedIdCount: 11,
        distractorClassCount: 4
      }
    });
    expect(result.metrics.catalogBackedCases).toBeGreaterThanOrEqual(8);
    expect(result.metrics.sourceBackedCases).toBeGreaterThanOrEqual(2);
    expect(result.metrics.targetSpecificSelections).toBeGreaterThan(0);
    expect(result.cases.find((testCase) =>
      testCase.id === "generic-guardrail-not-sufficient"
    )).toMatchObject({
      distractorClasses: ["target-specific-vs-generic"],
      baselineFailureRationale: "Generic retained KRN guardrails mention quality gates but are not EKOLOGUS target evidence."
    });
    expect(result.cases.find((testCase) =>
      testCase.id === "plan-brief-memory-advantage"
    )).toMatchObject({
      distractorClasses: ["adjacent-governance-pattern"],
      baselineFailureRationale: "A local-test closure packet can mention plans and briefs but misses rendered Codex brief memory/source evidence."
    });
    const planBriefCase = result.cases.find((testCase) =>
      testCase.id === "plan-brief-memory-advantage"
    );
    expect(planBriefCase?.selectedKnowledgeIds[0]).toBe("pattern:plan-brief-memory-advantage-comparator");
    expect(planBriefCase?.selectedKnowledgeIds).toContain("pattern:local-tests-alone-closeout");
    expect(result.proof.proves).toContain(
      "brain search reports recall@k over expected proxy-labeled selectedKnowledge ids"
    );
    expect(result.proof.proves).toContain(
      "brain ranking fixture reports corpus name, corpus size, distractor classes, and per-case baseline failure rationale"
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
      corpusName: "negative-duplicate-corpus",
      distractorClasses: ["duplicate-expected-id"],
      topK: 5,
      minimumHitRateAtK: 1,
      minimumRecallAtK: 1,
      minimumNdcgAtK: 0,
      cases: Array.from({ length: 10 }, (_unused, index) => ({
        id: `duplicate-${index}`,
        query: "duplicate selected knowledge ids",
        distractorClasses: ["duplicate-expected-id"],
        baselineFailureRationale: "Duplicate ids should not inflate recall.",
        expectedSelectedKnowledgeIds: ["expected-a", "expected-b"],
        knowledgeReadModels: [
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
      corpusName: "negative-missing-corpus",
      distractorClasses: ["missing-expected-id"],
      topK: 1,
      minimumHitRateAtK: 1,
      minimumRecallAtK: 1,
      minimumNdcgAtK: 1,
      cases: Array.from({ length: 10 }, (_unused, index) => ({
        id: `negative-${index}`,
        query: "missing expected ranking packet",
        distractorClasses: ["missing-expected-id"],
        baselineFailureRationale: "Actual packet should not satisfy a missing expected id.",
        expectedSelectedKnowledgeIds: [`expected-${index}`],
        knowledgeReadModels: [{
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
