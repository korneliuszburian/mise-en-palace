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
        rowCount: 29,
        queryCount: 24,
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
        queryCount: 24,
        corpusRows: 29,
        hitRateAtK: 1,
        expectedHitIdCount: 24,
        distractorClassCount: 5,
        relationLinkedCaseCount: 10,
        flatBaselineWeakerCases: 10,
        flatBaselineMissingExpectedRelationSupportCases: 10,
        relationShapeCaseCount: 9,
        relationShapeCoveredCases: 9,
        relationShapeKinds: ["contradicts", "depends_on", "duplicates", "expires", "invalidates", "qualifies", "supersedes", "supports"],
        heldOutQueryCount: 2,
        heldOutHitRateAtK: 1,
        heldOutNdcgAtK: 1,
        heldOutRelationShapeCaseCount: 2,
        heldOutRelationShapeKinds: ["depends_on", "qualifies"],
        relationDirectionCaseCount: 3,
        relationDirectionCoveredCases: 3,
        relationDirections: ["incoming", "outgoing"],
        observedRelationDirections: ["incoming", "outgoing"],
        heldOutRelationDirections: ["incoming", "outgoing"],
        heldOutObservedRelationDirections: ["incoming", "outgoing"],
        staleEdgeReadbackCases: 2
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
      testCase.id === "relation-shape-supersedes"
    )).toMatchObject({
      relationLinkedExpected: true,
      expectedRelationKinds: ["supersedes"],
      expectedHitRelationSupport: 1,
      relationKinds: expect.arrayContaining(["supersedes"]),
      expectedHitRelationKinds: ["supersedes"],
      flatComparison: {
        expectedHitRelationSupport: 0,
        relationKinds: [],
        expectedHitRelationKinds: [],
        weakness: "missing_expected_relation_support"
      }
    });
    expect(result.cases.find((testCase) =>
      testCase.id === "relation-shape-expires"
    )).toMatchObject({
      relationLinkedExpected: true,
      expectedRelationKinds: ["expires"],
      expectedHitRelationSupport: 1,
      relationKinds: expect.arrayContaining(["expires"]),
      expectedHitRelationKinds: ["expires"],
      flatComparison: {
        expectedHitRelationSupport: 0,
        relationKinds: [],
        expectedHitRelationKinds: [],
        weakness: "missing_expected_relation_support"
      }
    });
    expect(result.cases.find((testCase) =>
      testCase.id === "relation-shape-contradicts"
    )).toMatchObject({
      relationLinkedExpected: true,
      expectedRelationKinds: ["contradicts"],
      expectedHitRelationSupport: 1,
      relationKinds: expect.arrayContaining(["contradicts"]),
      expectedHitRelationKinds: ["contradicts"],
      flatComparison: {
        expectedHitRelationSupport: 0,
        relationKinds: [],
        expectedHitRelationKinds: [],
        weakness: "missing_expected_relation_support"
      }
    });
    expect(result.cases.find((testCase) =>
      testCase.id === "stale-rankdown-incoming"
    )).toMatchObject({
      corpusSplit: "main",
      relationLinkedExpected: true,
      expectedRelationKinds: ["invalidates"],
      expectedRelationDirections: ["incoming"],
      hitAtK: true,
      incomingStaleEdge: true,
      expectedHitRelationSupport: 1,
      expectedHitRelationKinds: ["invalidates"],
      expectedHitRelationDirections: ["incoming"],
      flatComparison: {
        expectedHitRelationSupport: 0,
        expectedHitRelationKinds: [],
        expectedHitRelationDirections: [],
        weakness: "missing_expected_relation_support"
      }
    });
    expect(result.metrics.staleEdgeReadbackCases).toBeGreaterThanOrEqual(1);
    expect(result.cases.filter((testCase) => testCase.incomingStaleEdge).length)
      .toBe(result.metrics.staleEdgeReadbackCases);
    expect(result.cases.find((testCase) =>
      testCase.id === "heldout-skill-context-qualifies"
    )).toMatchObject({
      corpusSplit: "held_out",
      relationLinkedExpected: true,
      expectedRelationKinds: ["qualifies"],
      expectedRelationDirections: ["incoming"],
      expectedHitRelationSupport: 1,
      expectedHitRelationKinds: ["qualifies"],
      expectedHitRelationDirections: ["incoming"],
      flatComparison: {
        expectedHitRelationSupport: 0,
        expectedHitRelationKinds: [],
        expectedHitRelationDirections: [],
        weakness: "missing_expected_relation_support"
      }
    });
    expect(result.cases.find((testCase) =>
      testCase.id === "heldout-contract-output-depends"
    )).toMatchObject({
      corpusSplit: "held_out",
      relationLinkedExpected: true,
      expectedRelationKinds: ["depends_on"],
      expectedRelationDirections: ["outgoing"],
      expectedHitRelationSupport: 1,
      expectedHitRelationKinds: ["depends_on"],
      expectedHitRelationDirections: ["outgoing"],
      flatComparison: {
        expectedHitRelationSupport: 0,
        expectedHitRelationKinds: [],
        expectedHitRelationDirections: [],
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
    expect(result.proof.proves).toContain(
      "relation-direction cases report expected and observed incoming/outgoing SourceClaimEdge directions for expected hits"
    );
    expect(result.proof.proves).toContain(
      "relation-shape coverage spans supports, duplicates, invalidates, supersedes, expires, and contradicts SourceClaimEdge kinds"
    );
    expect(result.proof.proves).toContain(
      "stale-edge cases surface incoming invalidating relation readback while the expected claim remains selectable in top-k"
    );
    expect(result.proof.doesNotProve).toEqual(expect.arrayContaining([
      "source truth",
      "broad semantic ranking quality",
      "live pgvector retrieval quality",
      "graph database need",
      "autonomous memory evolution",
      "API or MCP readiness",
      "crawler readiness",
      "product readiness",
      "stale-edge readback is not score-based rank demotion"
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

  it("fails when relation direction coverage is incomplete", async () => {
    const result = await runSourceGraphRankingEval(parseSourceGraphRankingEvalFixture({
      version: "1",
      corpusName: "negative-relation-direction-partial",
      distractorClasses: ["partial-relation-direction-coverage"],
      topK: 6,
      minimumHitRateAtK: 1,
      minimumNdcgAtK: 1,
      rows: Array.from({ length: 20 }, (_unused, index) => [
        `claim-${index}`,
        index === 0 ? "supportsanchor directionedge" :
          index === 2 ? "duplicatesanchor directionedge" :
            index === 4 ? "invalidatesanchor directionedge" :
              index === 7 ? "incominganchor directionedge" :
              `controlanchor${index}`,
        `Fixture claim ${index}.`
      ]),
      relations: [
        ["claim-0", "claim-1", "supports"],
        ["claim-2", "claim-3", "duplicates"],
        ["claim-4", "claim-5", "invalidates"],
        ["claim-6", "claim-7", "narrows"]
      ],
      queries: [
        // Direction readback is relative to the expected source-claim hit. This
        // relation starts at claim-0, so claim-0 must observe it as outgoing.
        [
          "query-supports-wrong-direction",
          "supportsanchor directionedge",
          ["source_claim:claim-0"],
          "The supports relation kind is present, but the expected direction is intentionally wrong.",
          true,
          ["supports"],
          "held_out",
          ["incoming"]
        ],
        [
          "query-duplicates-heldout",
          "duplicatesanchor directionedge",
          ["source_claim:claim-2"],
          "The duplicates held-out query supplies the second held-out relation kind.",
          true,
          ["duplicates"],
          "held_out",
          ["outgoing"]
        ],
        [
          "query-invalidates-main",
          "invalidatesanchor directionedge",
          ["source_claim:claim-4"],
          "The invalidates query completes required relation-shape coverage.",
          true,
          ["invalidates"]
        ],
        // Symmetric polarity check: this relation points into claim-7, so
        // claim-7 must observe it as incoming, not outgoing.
        [
          "query-narrows-wrong-direction",
          "incominganchor directionedge",
          ["source_claim:claim-7"],
          "The narrows relation kind is present, but the expected direction is intentionally wrong in the opposite polarity.",
          true,
          ["narrows"],
          "main",
          ["outgoing"]
        ],
        ...Array.from({ length: 11 }, (_unused, index) => [
          `query-${index}`,
          `controlanchor${index + 8}`,
          [`source_claim:claim-${index + 8}`],
          `Control source ${index + 8} should remain selectable.`
        ])
      ]
    }));

    expect(result.metrics.hitRateAtK).toBe(1);
    expect(result.metrics.ndcgAtK).toBeGreaterThanOrEqual(1);
    expect(result.metrics.flatBaselineWeakerCases).toBe(4);
    expect(result.metrics.relationShapeCoveredCases).toBe(4);
    expect(result.metrics.relationShapeKinds).toEqual(["duplicates", "invalidates", "narrows", "supports"]);
    expect(result.metrics.heldOutRelationShapeKinds).toEqual(["duplicates", "supports"]);
    expect(result.metrics.relationDirectionCaseCount).toBe(3);
    expect(result.metrics.relationDirectionCoveredCases).toBe(1);
    expect(result.cases.find((testCase) =>
      testCase.id === "query-supports-wrong-direction"
    )).toMatchObject({
      expectedRelationDirections: ["incoming"],
      expectedHitRelationDirections: ["outgoing"]
    });
    expect(result.cases.find((testCase) =>
      testCase.id === "query-narrows-wrong-direction"
    )).toMatchObject({
      expectedRelationDirections: ["outgoing"],
      expectedHitRelationDirections: ["incoming"]
    });
    expect(result.status).toBe("fail");
  });

  it("fails when relation direction declarations are absent", async () => {
    const result = await runSourceGraphRankingEval(parseSourceGraphRankingEvalFixture({
      version: "1",
      corpusName: "negative-relation-direction-absent",
      distractorClasses: ["missing-relation-direction-declarations"],
      topK: 6,
      minimumHitRateAtK: 1,
      minimumNdcgAtK: 1,
      rows: Array.from({ length: 20 }, (_unused, index) => [
        `claim-${index}`,
        index === 0 ? "supportsanchor nodirection" :
          index === 2 ? "duplicatesanchor nodirection" :
            index === 4 ? "invalidatesanchor nodirection" :
              `controlanchor${index}`,
        `Fixture claim ${index}.`
      ]),
      relations: [
        ["claim-0", "claim-1", "supports"],
        ["claim-2", "claim-3", "duplicates"],
        ["claim-4", "claim-5", "invalidates"]
      ],
      queries: [
        [
          "query-supports-heldout",
          "supportsanchor nodirection",
          ["source_claim:claim-0"],
          "The supports relation kind is present, but no direction expectation is declared.",
          true,
          ["supports"],
          "held_out"
        ],
        [
          "query-duplicates-heldout",
          "duplicatesanchor nodirection",
          ["source_claim:claim-2"],
          "The duplicates relation kind supplies the second held-out relation shape without direction coverage.",
          true,
          ["duplicates"],
          "held_out"
        ],
        [
          "query-invalidates-main",
          "invalidatesanchor nodirection",
          ["source_claim:claim-4"],
          "The invalidates query completes required relation-shape coverage.",
          true,
          ["invalidates"]
        ],
        ...Array.from({ length: 12 }, (_unused, index) => [
          `query-${index}`,
          `controlanchor${index + 6}`,
          [`source_claim:claim-${index + 6}`],
          `Control source ${index + 6} should remain selectable.`
        ])
      ]
    }));

    expect(result.metrics.hitRateAtK).toBe(1);
    expect(result.metrics.flatBaselineWeakerCases).toBe(3);
    expect(result.metrics.relationShapeCoveredCases).toBe(3);
    expect(result.metrics.heldOutRelationShapeKinds).toEqual(["duplicates", "supports"]);
    expect(result.metrics.relationDirectionCaseCount).toBe(0);
    expect(result.metrics.relationDirectionCoveredCases).toBe(0);
    expect(result.metrics.relationDirections).toEqual([]);
    expect(result.metrics.observedRelationDirections).toEqual([]);
    expect(result.metrics.heldOutRelationDirections).toEqual([]);
    expect(result.metrics.heldOutObservedRelationDirections).toEqual([]);
    expect(result.status).toBe("fail");
  });
});
