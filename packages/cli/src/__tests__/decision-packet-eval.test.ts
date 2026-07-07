import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseDecisionPacketEvalFixture
} from "../decision-packet-fixture.js";
import {
  loadDecisionPacketEvalFixture
} from "../decision-packet-fixture.js";
import {
  runDecisionPacketEval
} from "../run-decision-packet-eval.js";

const fixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/notes-baseline/decision-packet-vs-notes.json", import.meta.url)
);

const loadMutableFixture = (): {
  decisions: Array<Record<string, unknown>>;
  cases: Array<Record<string, unknown>>;
} => JSON.parse(readFileSync(fixturePath, "utf8")) as {
  decisions: Array<Record<string, unknown>>;
  cases: Array<Record<string, unknown>>;
};

describe("runDecisionPacketEval", () => {
  it("passes the pre-code decision-packet quality benchmark", async () => {
    const result = await runDecisionPacketEval(loadDecisionPacketEvalFixture(fixturePath));

    expect(result).toMatchObject({
      kind: "krn.decisionPacket.eval.v1",
      fixtureVersion: "1",
      status: "pass",
      thresholds: {
        minimumUsefulRate: 0.8,
        minimumKrnWinRate: 0.75,
        maximumNotesWinRate: 0,
        maximumSevereStaleAuthorityInclusions: 0,
        maximumAverageNoiseDecisions: 2
      },
      metrics: {
        caseCount: 17,
        usefulCount: 17,
        noisyCount: 0,
        missCount: 0,
        staleAuthorityCount: 0,
        notesUsableCount: 5,
        notesUnsafeCount: 12,
        notesMissCount: 0,
        krnWinCount: 12,
        notesWinCount: 0,
        tieCount: 5,
        decisiveComparisonCount: 12,
        usefulRate: 1,
        krnWinRate: 1,
        notesWinRate: 0,
        averageNoiseDecisions: 1.1176,
        severeStaleAuthorityInclusions: 0
      }
    });
    expect(result.cases.every((testCase) => testCase.qualityLabel === "useful")).toBe(true);
    expect(result.cases.find((testCase) =>
      testCase.id === "memory-runtime-task"
    )).toMatchObject({
      expectedDecisionId: "store-backed-memory-no-markdown",
      qualityLabel: "useful",
      notesBaseline: {
        qualityLabel: "unsafe",
        topDecisionIds: [
          "store-backed-memory-no-markdown",
          "create-markdown-memory-files",
          "markdown-runtime-memory"
        ],
        unsafeDecisionIds: [
          "create-markdown-memory-files",
          "markdown-runtime-memory"
        ]
      },
      comparisonOutcome: "krn_win",
      packet: {
        formatVersion: "krn.decisionPacket.v1",
        governingDecisionIds: expect.arrayContaining(["store-backed-memory-no-markdown"]),
        sourceClaimIds: expect.arrayContaining(["source-claim:store-backed-memory-no-markdown"]),
        sourceDecisionEdgeIds: expect.arrayContaining(["source-decision-edge:store-backed-memory-no-markdown"]),
        memoryRefs: expect.arrayContaining(["memory:decision:store-backed-memory-no-markdown"]),
        brief: {
          observationPrefixCount: 1
        },
        staleDecisionIds: ["markdown-runtime-memory"],
        rejectedPathIds: ["create-markdown-memory-files"],
        severeStaleAuthorityIds: []
      }
    });
    expect(result.proof.doesNotProve).toEqual(expect.arrayContaining([
      "live Codex execution or obedience",
      "source truth",
      "broad arbitrary-repo packet quality",
      "that packet review burden is acceptable for every task",
      "that memory refs correspond to existing MemoryRecord rows"
    ]));
  });

  it("fails when packets lose SourceDecisionEdge boundaries", async () => {
    const rawFixture = loadMutableFixture();

    for (const decision of rawFixture.decisions) {
      if (decision["status"] === "current") {
        delete decision["sourceDecisionEdgeId"];
      }
    }

    const result = await runDecisionPacketEval(parseDecisionPacketEvalFixture(rawFixture));

    expect(result.status).toBe("fail");
    expect(result.metrics.usefulCount).toBe(0);
    expect(result.metrics.noisyCount).toBe(17);
    expect(result.metrics.usefulRate).toBe(0);
    expect(result.cases[0]).toMatchObject({
      qualityLabel: "noisy",
      reasons: expect.arrayContaining(["packet is missing SourceDecisionEdge refs"])
    });
  });

  it("fails when a stale decision reaches the governed packet", async () => {
    const rawFixture = loadMutableFixture();
    const staleDecision = rawFixture.decisions.find((decision) =>
      decision["id"] === "markdown-runtime-memory"
    );

    (rawFixture as Record<string, unknown>)["topK"] = 34;
    staleDecision!["status"] = "current";

    expect(rawFixture.decisions).toHaveLength(34);
    expect(staleDecision?.["status"]).toBe("current");

    const result = await runDecisionPacketEval(parseDecisionPacketEvalFixture(rawFixture));

    expect(result.status).toBe("fail");
    expect(result.metrics.staleAuthorityCount).toBeGreaterThan(0);
    expect(result.metrics.severeStaleAuthorityInclusions).toBeGreaterThan(0);
    expect(result.cases.find((testCase) =>
      testCase.id === "memory-runtime-task"
    )).toMatchObject({
      qualityLabel: "stale_authority",
      packet: {
        severeStaleAuthorityIds: expect.arrayContaining(["markdown-runtime-memory"])
      },
      reasons: expect.arrayContaining(["packet includes stale or rejected authority as governing context"])
    });
  });
});
