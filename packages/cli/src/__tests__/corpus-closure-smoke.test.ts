import {
  describe,
  expect,
  it
} from "vitest";

import {
  runCorpusClosureSmoke
} from "../run-corpus-closure-smoke.js";

const sourceDecisionGaps = (overrides: Record<string, unknown> = {}): string =>
  JSON.stringify({
    kind: "source_decision_gaps",
    projectId: "7d9d103a-1a8e-4492-a4ca-db3a5589bd9b",
    acceptedSourceClaimCount: 8,
    linkedSourceClaimCount: 8,
    missingDecisionEdgeCount: 0,
    pendingUnadoptedSourceClaimCount: 0,
    ...overrides
  });

const sourceSearch = (input: {
  readonly query: string;
  readonly supportingClaims: readonly Record<string, unknown>[];
}): string =>
  JSON.stringify({
    kind: "source_search_answer_package",
    query: input.query,
    answerPackage: {
      supportingClaims: input.supportingClaims
    }
  });

const linkedClaim = (
  id: string,
  totalScore: number
): Record<string, unknown> => ({
  label: `source_claim:${id}`,
  sourceClaimId: id,
  sourceDecisionSupportState: "linked",
  totalScore
});

const missingClaim = (
  id: string,
  totalScore: number
): Record<string, unknown> => ({
  label: `source_claim:${id}`,
  sourceClaimId: id,
  sourceDecisionSupportState: "missing",
  totalScore
});

describe("runCorpusClosureSmoke", () => {
  it("passes when source decision gaps are closed and top supporting claims are decision-linked", async () => {
    const result = await runCorpusClosureSmoke({
      queries: [
        {
          id: "worker-boundary",
          query: "worker boundary"
        },
        {
          id: "source-authority",
          query: "source authority"
        }
      ],
      runners: {
        sourceDecisionGaps: async () => sourceDecisionGaps(),
        sourceSearch: async (query) => sourceSearch({
          query,
          supportingClaims: [
            missingClaim("claim-missing", 98),
            linkedClaim("claim-linked", 97),
            missingClaim("claim-third", 96)
          ]
        })
      }
    });

    expect(result).toMatchObject({
      kind: "krn.corpusClosure.smoke.v1",
      status: "pass",
      projectId: "7d9d103a-1a8e-4492-a4ca-db3a5589bd9b",
      gaps: {
        acceptedSourceClaimCount: 8,
        linkedSourceClaimCount: 8,
        missingDecisionEdgeCount: 0,
        pendingUnadoptedSourceClaimCount: 0
      }
    });
    expect(result.cases).toHaveLength(2);
    expect(result.cases.every((testCase) => testCase.status === "pass")).toBe(true);
    expect(result.cases[0]?.linkedTop3ClaimIds).toEqual(["claim-linked"]);
    expect(result.proof.doesNotProve).toContain("that dogfood DB state matches CI seed state");
  });

  it("fails when the connected project still has source decision gaps", async () => {
    const result = await runCorpusClosureSmoke({
      queries: [
        {
          id: "worker-boundary",
          query: "worker boundary"
        }
      ],
      runners: {
        sourceDecisionGaps: async () => sourceDecisionGaps({
          linkedSourceClaimCount: 7,
          missingDecisionEdgeCount: 1,
          pendingUnadoptedSourceClaimCount: 1
        }),
        sourceSearch: async (query) => sourceSearch({
          query,
          supportingClaims: [linkedClaim("claim-linked", 100)]
        })
      }
    });

    expect(result.status).toBe("fail");
    expect(result.gaps).toMatchObject({
      missingDecisionEdgeCount: 1,
      pendingUnadoptedSourceClaimCount: 1
    });
    expect(result.cases[0]?.status).toBe("pass");
  });

  it("fails when a canonical source-search query has no linked SourceClaim in the top 3", async () => {
    const result = await runCorpusClosureSmoke({
      queries: [
        {
          id: "feedback-forget",
          query: "feedback forget"
        }
      ],
      runners: {
        sourceDecisionGaps: async () => sourceDecisionGaps(),
        sourceSearch: async (query) => sourceSearch({
          query,
          supportingClaims: [
            missingClaim("claim-1", 100),
            missingClaim("claim-2", 99),
            missingClaim("claim-3", 98),
            linkedClaim("claim-4", 97)
          ]
        })
      }
    });

    expect(result.status).toBe("fail");
    expect(result.cases[0]).toMatchObject({
      id: "feedback-forget",
      status: "fail",
      topSupportingClaimIds: ["claim-1", "claim-2", "claim-3"],
      linkedTop3ClaimIds: [],
      failureReason: "top 3 supporting claims did not include SourceDecisionEdge-linked authority"
    });
  });

  it("uses product readback order as top 3 instead of re-sorting by score", async () => {
    const result = await runCorpusClosureSmoke({
      queries: [
        {
          id: "source-authority",
          query: "source authority"
        }
      ],
      runners: {
        sourceDecisionGaps: async () => sourceDecisionGaps(),
        sourceSearch: async (query) => sourceSearch({
          query,
          supportingClaims: [
            missingClaim("claim-1", 80),
            missingClaim("claim-2", 70),
            linkedClaim("linked-in-product-top3", 60),
            linkedClaim("linked-higher-score-outside-product-top3", 100)
          ]
        })
      }
    });

    expect(result.status).toBe("pass");
    expect(result.cases[0]).toMatchObject({
      status: "pass",
      topSupportingClaimIds: ["claim-1", "claim-2", "linked-in-product-top3"],
      linkedTop3ClaimIds: ["linked-in-product-top3"]
    });
  });
});
