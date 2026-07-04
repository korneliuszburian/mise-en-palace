import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  loadSourceGraphRankingEvalFixture,
  parseSourceGraphRankingEvalFixture,
  runSourceGraphRankingEval
} from "../runSourceGraphRankingEval.js";

const fixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/source-graph-ranking/source-graph-ranking-eval.json", import.meta.url)
);

describe("runSourceGraphRankingEval", () => {
  it("passes the deterministic source graph ranking proxy fixture", async () => {
    const result = await runSourceGraphRankingEval(loadSourceGraphRankingEvalFixture(fixturePath));

    expect(result).toMatchObject({
      kind: "krn.sourceGraphRanking.eval.v1",
      status: "pass",
      topK: 6,
      corpus: {
        name: "source-graph-kernel-quality-corpus",
        rowCount: 20,
        queryCount: 15,
        distractorClasses: [
          "adjacent-governance-source",
          "stale-relation-edge",
          "lexical-vector-ambiguity",
          "target-specific-vs-generic"
        ]
      },
      metrics: {
        queryCount: 15,
        corpusRows: 20,
        hitRateAtK: 1,
        expectedHitIdCount: 15,
        distractorClassCount: 4
      }
    });
    expect(result.metrics.ndcgAtK).toBeGreaterThanOrEqual(0.95);
    expect(result.metrics.answerRelationReadbackCases).toBe(15);
    expect(result.metrics.expectedHitRelationReadbackCases).toBeGreaterThan(0);
    expect(result.metrics.expectedHitRelationReadbackCases).toBeLessThan(result.metrics.queryCount);
    expect(result.metrics.searchDocumentLinkReadbackCases).toBe(result.metrics.queryCount);
    expect(result.metrics.sourceDecisionSupportCases).toBe(result.metrics.queryCount);
    expect(result.metrics.distractorClassCount).toBe(result.corpus.distractorClasses.length);
    expect(result.cases.every((testCase) =>
      testCase.baselineFailureRationale.length > 0
    )).toBe(true);
    expect(result.cases.find((testCase) =>
      testCase.id === "heartbeat-acquisition"
    )?.expectedHitRelationSupport).toBe(0);
    expect(result.proof.doesNotProve).toContain("proxy labels are not production retrieval truth");
    expect(result.proof.proves).toContain(
      "source graph ranking fixture reports corpus name, corpus size, distractor classes, and per-query baseline failure rationale"
    );
    expect(result.proof.doesNotProve).toEqual(expect.arrayContaining([
      "source truth",
      "broad semantic ranking quality",
      "live pgvector retrieval quality",
      "crawler readiness",
      "product readiness"
    ]));
  });

  it("fails when expected source graph hits are absent from top-k", async () => {
    const result = await runSourceGraphRankingEval(parseSourceGraphRankingEvalFixture({
      version: "1",
      corpusName: "negative-missing-source-graph",
      distractorClasses: ["missing-expected-source"],
      topK: 1,
      minimumHitRateAtK: 1,
      minimumNdcgAtK: 1,
      rows: Array.from({ length: 20 }, (_unused, index) => [
        `claim-${index}`,
        `fixture terms ${index}`,
        `Fixture claim ${index}.`
      ]),
      relations: [],
      queries: Array.from({ length: 15 }, (_unused, index) => [
        `query-${index}`,
        `fixture terms ${index}`,
        [`source_claim:missing-${index}`],
        `Expected source ${index} is intentionally absent from the corpus.`
      ])
    }));

    expect(result.status).toBe("fail");
    expect(result.metrics.hitRateAtK).toBe(0);
    expect(result.cases.every((testCase) => !testCase.hitAtK)).toBe(true);
  });

  it("fails when an expected source graph hit exists but falls out of top-k", async () => {
    const result = await runSourceGraphRankingEval(parseSourceGraphRankingEvalFixture({
      version: "1",
      corpusName: "negative-source-graph-topk",
      distractorClasses: ["expected-source-below-topk"],
      topK: 1,
      minimumHitRateAtK: 1,
      minimumNdcgAtK: 1,
      rows: Array.from({ length: 20 }, (_unused, index) => [
        `claim-${index}`,
        index === 19 ? "rare expected source row" : `dominant query terms ${index}`,
        `Fixture claim ${index}.`
      ]),
      relations: [],
      queries: Array.from({ length: 15 }, (_unused, index) => [
        `query-${index}`,
        "dominant query terms",
        ["source_claim:claim-19"],
        `Dominant distractor terms should outrank expected row for negative case ${index}.`
      ])
    }));

    expect(result.status).toBe("fail");
    expect(result.metrics.hitRateAtK).toBe(0);
    expect(result.cases.every((testCase) => !testCase.hitAtK)).toBe(true);
  });
});
