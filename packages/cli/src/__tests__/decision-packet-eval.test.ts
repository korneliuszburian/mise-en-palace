import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type {
  DecisionPacket
} from "@krn/core";
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
  classifyDecisionPacketForEval,
  runDecisionPacketEval
} from "../internal/eval/run-decision-packet-eval.js";

const fixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/notes-baseline/decision-packet-vs-notes.json", import.meta.url)
);

const loadMutableFixture = (): {
  topK: number;
  decisions: Array<Record<string, unknown>>;
  notes: Array<Record<string, unknown>>;
  cases: Array<Record<string, unknown>>;
} => JSON.parse(readFileSync(fixturePath, "utf8")) as {
  topK: number;
  decisions: Array<Record<string, unknown>>;
  notes: Array<Record<string, unknown>>;
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
        caseCount: 18,
        usefulCount: 18,
        noisyCount: 0,
        missCount: 0,
        staleAuthorityCount: 0,
        notesUsableCount: 5,
        notesUnsafeCount: 13,
        notesMissCount: 0,
        krnWinCount: 13,
        notesWinCount: 0,
        tieCount: 5,
        decisiveComparisonCount: 13,
        usefulRate: 1,
        krnWinRate: 1,
        notesWinRate: 0,
        averageNoiseDecisions: 1.1111,
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
    expect(result.cases.find((testCase) =>
      testCase.id === "new-frontend-project-standard-task"
    )).toMatchObject({
      expectedDecisionId: "frontend-project-standard-packet",
      qualityLabel: "useful",
      notesBaseline: {
        qualityLabel: "unsafe",
        topDecisionIds: [
          "frontend-project-standard-packet",
          "generic-frontend-starter-default",
          "install-latest-frontend-stack"
        ],
        unsafeDecisionIds: [
          "generic-frontend-starter-default",
          "install-latest-frontend-stack"
        ]
      },
      comparisonOutcome: "krn_win",
      packet: {
        governingDecisionIds: expect.arrayContaining(["frontend-project-standard-packet"]),
        staleDecisionIds: ["generic-frontend-starter-default"],
        rejectedPathIds: ["install-latest-frontend-stack"],
        brief: {
          observationPrefixCount: 1
        },
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
    expect(result.metrics.noisyCount).toBe(18);
    expect(result.metrics.usefulRate).toBe(0);
    expect(result.cases[0]).toMatchObject({
      qualityLabel: "noisy",
      reasons: expect.arrayContaining(["packet is missing SourceDecisionEdge refs"])
    });
  });

  it("fails when exclusion readback has the wrong decision id with the right count", () => {
    const fixture = loadDecisionPacketEvalFixture(fixturePath);
    const testCase = fixture.cases.find((item) => item.id === "memory-runtime-task");
    const expectedDecision = fixture.decisions.find((decision) =>
      decision.id === testCase?.expectedDecisionId
    );

    expect(testCase).toBeDefined();
    expect(expectedDecision).toBeDefined();

    if (testCase === undefined || expectedDecision === undefined) {
      throw new Error("decision-packet fixture is missing memory-runtime-task setup");
    }

    const packet: DecisionPacket = {
      formatVersion: "krn.decisionPacket.v1",
      governingDecisionIds: ["store-backed-memory-no-markdown"],
      sourceClaimIds: ["source-claim:store-backed-memory-no-markdown"],
      sourceDecisionEdgeIds: ["source-decision-edge:store-backed-memory-no-markdown"],
      memoryRefs: ["memory:decision:store-backed-memory-no-markdown"],
      staleDecisionIds: ["cast-json-record"],
      rejectedPathIds: ["prose-second-opinion"],
      falsifiers: ["A runtime task needs a markdown memory folder to recall KRN knowledge."],
      doesNotProve: ["Does not prove broad memory retrieval quality or live Codex obedience."],
      nonProofs: ["packet quality only"],
      noiseDecisionIds: [],
      severeStaleAuthorityIds: [],
      brief: {
        includedContextCount: 1,
        observationPrefixCount: 1,
        explicitExclusionCount: 2,
        sourceClaimUseCount: 1,
        memoryRecordUseCount: 1
      }
    };

    expect(classifyDecisionPacketForEval(packet, testCase, expectedDecision)).toBe("noisy");
  });

  it("does not match task scopes by substring", async () => {
    const rawFixture = loadMutableFixture();

    rawFixture.decisions.push({
      id: "time-scope-runtime-leak",
      title: "Time scope runtime leak",
      statement: "Runtime memory task guidance that must not apply merely because runtime contains the substring time.",
      status: "current",
      taskScopes: ["time"],
      evidenceRef: "test:scope-token-boundary",
      sourceClaimId: "source-claim:time-scope-runtime-leak",
      sourceDecisionEdgeId: "source-decision-edge:time-scope-runtime-leak",
      falsifier: "A task containing runtime selects a scope that only says time.",
      doesNotProve: "Does not prove all possible scope vocabularies are ideal."
    });
    rawFixture.notes.push({
      id: "note-time-scope-runtime-leak",
      decisionId: "time-scope-runtime-leak",
      text: "Time scope runtime leak. Runtime memory task guidance that must not match runtime by substring time."
    });

    const result = await runDecisionPacketEval(parseDecisionPacketEvalFixture(rawFixture));

    expect(result.cases.find((testCase) =>
      testCase.id === "memory-runtime-task"
    )?.packet.governingDecisionIds).not.toContain("time-scope-runtime-leak");
  });

  it("fails when a stale decision reaches the governed packet", async () => {
    const rawFixture = loadMutableFixture();
    const staleDecision = rawFixture.decisions.find((decision) =>
      decision["id"] === "markdown-runtime-memory"
    );

    rawFixture.topK = rawFixture.decisions.length;
    staleDecision!["status"] = "current";

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
