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
        rowCount: 25,
        queryCount: 20,
        heldOutQueryCount: 2,
        distractorClasses: [
          "adjacent-governance-source",
          "stale-relation-edge",
          "lexical-vector-ambiguity",
          "target-specific-vs-generic",
          "flat-relationless-baseline"
        ]
      },
      metrics: {
        queryCount: 20,
        corpusRows: 25,
        hitRateAtK: 1,
        expectedHitIdCount: 20,
        distractorClassCount: 5,
        relationLinkedCaseCount: 6,
        flatBaselineWeakerCases: 6,
        flatBaselineMissingExpectedRelationSupportCases: 6,
        relationShapeCaseCount: 5,
        relationShapeCoveredCases: 5,
        relationShapeKinds: ["depends_on", "duplicates", "invalidates", "qualifies", "supports"],
        heldOutQueryCount: 2,
        heldOutHitRateAtK: 1,
        heldOutNdcgAtK: 1,
        heldOutRelationShapeCaseCount: 2,
        heldOutRelationShapeKinds: ["depends_on", "qualifies"]
      }
    });
    expect(result.metrics.ndcgAtK).toBeGreaterThanOrEqual(0.95);
    expect(result.metrics.answerRelationReadbackCases).toBe(result.metrics.queryCount);
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
    const relationLinkedCase = result.cases.find((testCase) =>
      testCase.id === "graph-relation"
    );
    expect(relationLinkedCase).toMatchObject({
      relationLinkedExpected: true,
      expectedRelationKinds: [],
      expectedHitRelationSupport: 3,
      expectedHitRelationKinds: ["invalidates", "narrows"],
      flatComparison: {
        relationSupport: 0,
        expectedHitRelationSupport: 0,
        relationKinds: [],
        expectedHitRelationKinds: [],
        hitAtK: true,
        weakness: "missing_expected_relation_support"
      }
    });
    expect(result.cases.find((testCase) =>
      testCase.id === "relation-shape-supports"
    )).toMatchObject({
      relationLinkedExpected: true,
      expectedRelationKinds: ["supports"],
      expectedHitRelationSupport: 1,
      relationKinds: expect.arrayContaining(["supports"]),
      expectedHitRelationKinds: ["supports"],
      flatComparison: {
        expectedHitRelationSupport: 0,
        relationKinds: [],
        expectedHitRelationKinds: [],
        weakness: "missing_expected_relation_support"
      }
    });
    expect(result.cases.find((testCase) =>
      testCase.id === "relation-shape-duplicates"
    )).toMatchObject({
      relationLinkedExpected: true,
      expectedRelationKinds: ["duplicates"],
      expectedHitRelationSupport: 1,
      relationKinds: expect.arrayContaining(["duplicates"]),
      expectedHitRelationKinds: ["duplicates"],
      flatComparison: {
        expectedHitRelationSupport: 0,
        relationKinds: [],
        expectedHitRelationKinds: [],
        weakness: "missing_expected_relation_support"
      }
    });
    expect(result.cases.find((testCase) =>
      testCase.id === "relation-shape-invalidates"
    )).toMatchObject({
      relationLinkedExpected: true,
      expectedRelationKinds: ["invalidates"],
      expectedHitRelationSupport: 1,
      relationKinds: expect.arrayContaining(["invalidates"]),
      expectedHitRelationKinds: ["invalidates"],
      flatComparison: {
        expectedHitRelationSupport: 0,
        relationKinds: [],
        expectedHitRelationKinds: [],
        weakness: "missing_expected_relation_support"
      }
    });
    expect(result.cases.find((testCase) =>
      testCase.id === "heldout-skill-context-qualifies"
    )).toMatchObject({
      corpusSplit: "held_out",
      relationLinkedExpected: true,
      expectedRelationKinds: ["qualifies"],
      expectedHitRelationSupport: 1,
      expectedHitRelationKinds: ["qualifies"],
      flatComparison: {
        expectedHitRelationSupport: 0,
        expectedHitRelationKinds: [],
        weakness: "missing_expected_relation_support"
      }
    });
    expect(result.cases.find((testCase) =>
      testCase.id === "heldout-contract-output-depends"
    )).toMatchObject({
      corpusSplit: "held_out",
      relationLinkedExpected: true,
      expectedRelationKinds: ["depends_on"],
      expectedHitRelationSupport: 1,
      expectedHitRelationKinds: ["depends_on"],
      flatComparison: {
        expectedHitRelationSupport: 0,
        expectedHitRelationKinds: [],
        weakness: "missing_expected_relation_support"
      }
    });
    expect(result.proof.doesNotProve).toContain("proxy labels are not production retrieval truth");
    expect(result.proof.proves).toContain(
      "source graph ranking fixture reports corpus name, corpus size, distractor classes, and per-query baseline failure rationale"
    );
    expect(result.proof.proves).toContain(
      "relation-linked cases compare linked SourceClaimEdge readback against a flat no-relation path and require the flat path to be weaker in relation-support readback"
    );
    expect(result.proof.proves).toContain(
      "relation-shape cases report expected and observed SourceClaimEdge kinds for duplicates, invalidates, supports readback"
    );
    expect(result.proof.proves).toContain(
      "held-out relation corpus split reports held-out query count, hit-rate/NDCG, relation-shape kinds, and flat comparison"
    );
    expect(result.proof.doesNotProve).toEqual(expect.arrayContaining([
      "source truth",
      "broad semantic ranking quality",
      "live pgvector retrieval quality",
      "graph database need",
      "autonomous memory evolution",
      "API or MCP readiness",
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

  it("fails when a relation-linked case has no relation-support advantage over the flat path", async () => {
    const result = await runSourceGraphRankingEval(parseSourceGraphRankingEvalFixture({
      version: "1",
      corpusName: "negative-relation-linked-flat-equivalent",
      distractorClasses: ["missing-relation-support-advantage"],
      topK: 6,
      minimumHitRateAtK: 1,
      minimumNdcgAtK: 1,
      rows: Array.from({ length: 20 }, (_unused, index) => [
        `claim-${index}`,
        index === 0 ? "relationanchor0" : `controlanchor${index}`,
        `Fixture claim ${index}.`
      ]),
      relations: [],
      queries: [
        [
          "query-relation-linked",
          "relationanchor0",
          ["source_claim:claim-0"],
          "Relation-linked query intentionally has no SourceClaimEdge support.",
          true,
          ["supports"]
        ],
        ...Array.from({ length: 14 }, (_unused, index) => [
          `query-${index}`,
          `controlanchor${index + 1}`,
          [`source_claim:claim-${index + 1}`],
          `Control source ${index + 1} should remain selectable.`
        ])
      ]
    }));

    expect(result.status).toBe("fail");
    expect(result.metrics.hitRateAtK).toBe(1);
    expect(result.metrics.relationLinkedCaseCount).toBe(1);
    expect(result.metrics.flatBaselineWeakerCases).toBe(0);
    expect(result.metrics.flatBaselineMissingExpectedRelationSupportCases).toBe(0);
    expect(result.metrics.relationShapeCaseCount).toBe(1);
    expect(result.metrics.relationShapeCoveredCases).toBe(0);
    expect(result.metrics.relationShapeKinds).toEqual(["supports"]);
    expect(result.cases.find((testCase) =>
      testCase.id === "query-relation-linked"
    )?.flatComparison).toBeUndefined();
  });

  it("fails when relation-shape coverage omits required edge kinds", async () => {
    const result = await runSourceGraphRankingEval(parseSourceGraphRankingEvalFixture({
      version: "1",
      corpusName: "negative-relation-shape-partial",
      distractorClasses: ["partial-relation-shape-coverage"],
      topK: 6,
      minimumHitRateAtK: 1,
      minimumNdcgAtK: 1,
      rows: Array.from({ length: 20 }, (_unused, index) => [
        `claim-${index}`,
        index === 0 ? "relationanchor0 supportsedge" : `controlanchor${index}`,
        `Fixture claim ${index}.`
      ]),
      relations: [
        ["claim-0", "claim-1", "supports"]
      ],
      queries: [
        [
          "query-supports-only",
          "relationanchor0 supportsedge",
          ["source_claim:claim-0"],
          "The relation-linked path has support readback, but the fixture covers only supports and omits duplicates/invalidates.",
          true,
          ["supports"]
        ],
        ...Array.from({ length: 14 }, (_unused, index) => [
          `query-${index}`,
          `controlanchor${index + 1}`,
          [`source_claim:claim-${index + 1}`],
          `Control source ${index + 1} should remain selectable.`
        ])
      ]
    }));

    expect(result.metrics.hitRateAtK).toBe(1);
    expect(result.metrics.ndcgAtK).toBeGreaterThanOrEqual(1);
    expect(result.metrics.flatBaselineWeakerCases).toBe(1);
    expect(result.metrics.relationShapeCaseCount).toBe(1);
    expect(result.metrics.relationShapeCoveredCases).toBe(1);
    expect(result.metrics.relationShapeKinds).toEqual(["supports"]);
    expect(result.status).toBe("fail");
  });
});
