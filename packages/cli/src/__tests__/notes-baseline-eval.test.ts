import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  loadNotesBaselineEvalFixture,
  parseNotesBaselineEvalFixture,
  runNotesBaselineEval
} from "../run-notes-baseline-eval.js";

const fixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/notes-baseline/decision-packet-vs-notes.json", import.meta.url)
);

describe("runNotesBaselineEval", () => {
  it("passes the governed decision-packet vs notes baseline falsifier", () => {
    const result = runNotesBaselineEval(loadNotesBaselineEvalFixture(fixturePath));

    expect(result).toMatchObject({
      kind: "krn.notesBaseline.eval.v1",
      status: "pass",
      topK: 3,
      corpus: {
        name: "krn-decision-packet-vs-notes-baseline",
        decisionCount: 34,
        noteCount: 34,
        caseCount: 17,
        staleDecisionCount: 9,
        rejectedDecisionCount: 9
      },
      thresholds: {
        minimumKrnWinRate: 0.75,
        maximumNotesWinRate: 0
      },
      metrics: {
        caseCount: 17,
        krnWinCount: 16,
        notesWinCount: 0,
        tieCount: 1,
        krnWinRate: 0.9412,
        notesWinRate: 0,
        krnRecallRate: 1,
        notesRecallRate: 1,
        governedBoundaryRate: 1,
        staleExclusionCases: 13,
        rejectedPathCases: 16,
        notesStaleOrRejectedNoiseCases: 16
      }
    });
    expect(result.metrics.averageKrnCeremonyUnits).toBeGreaterThan(result.metrics.averageNotesCeremonyUnits);
    expect(result.cases.every((testCase) => testCase.krn.recallExpected)).toBe(true);
    expect(result.cases.every((testCase) => testCase.notes.recallExpected)).toBe(true);
    expect(result.cases.every((testCase) => testCase.krn.governedBoundary)).toBe(true);
    expect(result.cases.filter((testCase) => testCase.winner === "krn")).toHaveLength(16);
    expect(result.cases.filter((testCase) => testCase.winner === "tie")).toHaveLength(1);
    expect(result.cases.find((testCase) =>
      testCase.id === "memory-runtime-task"
    )).toMatchObject({
      expectedDecisionId: "store-backed-memory-no-markdown",
      winner: "krn",
      krn: {
        recallExpected: true,
        governedBoundary: true,
        staleDecisionIds: ["markdown-runtime-memory"],
        rejectedPathIds: ["create-markdown-memory-files"],
        staleExcluded: true,
        rejectedPathVisible: true
      },
      notes: {
        recallExpected: true,
        staleIncluded: true,
        rejectedIncluded: true,
        governedBoundary: false
      }
    });
    expect(result.cases.find((testCase) =>
      testCase.id === "second-opinion-task"
    )).toMatchObject({
      expectedDecisionId: "second-opinion-validated-json",
      winner: "krn",
      krn: {
        staleDecisionIds: ["prose-second-opinion"],
        rejectedPathIds: ["trust-prose-review"]
      },
      notes: {
        staleIncluded: true,
        rejectedIncluded: true
      }
    });
    expect(result.cases.find((testCase) =>
      testCase.id === "notes-baseline-task"
    )).toMatchObject({
      expectedDecisionId: "notes-baseline-is-real-competitor",
      winner: "krn",
      notes: {
        recallExpected: true
      }
    });
    expect(result.cases.find((testCase) =>
      testCase.id === "adapter-non-mutating-boundary-only-task"
    )).toMatchObject({
      expectedDecisionId: "codex-adapter-non-mutating-brief",
      winner: "tie",
      krn: {
        recallExpected: true,
        governedBoundary: true,
        staleExcluded: false,
        rejectedPathVisible: false
      },
      notes: {
        recallExpected: true
      }
    });
    expect(result.proof.proves).toContain(
      "the notes baseline is not a strawman: it contains governing decision text and can tie raw recall"
    );
    expect(result.proof.doesNotProve).toEqual(expect.arrayContaining([
      "live Codex execution or obedience",
      "operator willingness to pay",
      "broad arbitrary-repo advantage",
      "source truth",
      "production semantic retrieval quality",
      "that every KRN packet is less ceremonial than notes"
    ]));
  });

  it("fails when KRN cannot beat the comprehensive notes baseline", () => {
    const result = runNotesBaselineEval(parseNotesBaselineEvalFixture({
      version: "1",
      corpusName: "negative-notes-parity",
      topK: 1,
      minimumKrnWinRate: 0.75,
      maximumNotesWinRate: 0,
      decisions: Array.from({ length: 15 }, (_unused, index) => ({
        id: `decision-${index}`,
        title: `Decision token${index}`,
        statement: `Use current token${index}`,
        status: "current",
        evidenceRef: `file:${index}`,
        sourceClaimId: `claim-${index}`,
        sourceDecisionEdgeId: `edge-${index}`,
        falsifier: `Falsifier ${index}`,
        doesNotProve: `Does not prove ${index}`
      })),
      notes: Array.from({ length: 15 }, (_unused, index) => ({
        id: `note-${index}`,
        decisionId: `decision-${index}`,
        text: `Use current token${index}`
      })),
      cases: Array.from({ length: 15 }, (_unused, index) => ({
        id: `case-${index}`,
        task: `Use current token${index}`,
        expectedDecisionId: `decision-${index}`,
        baselineFailureRationale: "Notes should tie recall and KRN has no stale or rejected-path value.",
        staleDecisionIds: [],
        rejectedDecisionIds: []
      }))
    }));

    expect(result.status).toBe("fail");
    expect(result.metrics.krnRecallRate).toBe(1);
    expect(result.metrics.notesRecallRate).toBe(1);
    expect(result.metrics.krnWinCount).toBe(0);
    expect(result.metrics.tieCount).toBe(15);
  });

  it("fails when the notes baseline beats KRN recall", () => {
    const result = runNotesBaselineEval(parseNotesBaselineEvalFixture({
      version: "1",
      corpusName: "negative-notes-recall-win",
      topK: 1,
      minimumKrnWinRate: 0.75,
      maximumNotesWinRate: 0,
      decisions: Array.from({ length: 15 }, (_unused, index) => ({
        id: `decision-${index}`,
        title: index === 0 ? "Unrelated current decision" : `Decision token${index}`,
        statement: index === 0 ? "No matching terms here" : `Use current decision ${index}`,
        status: index === 0 ? "stale" : "current",
        evidenceRef: `file:${index}`,
        sourceClaimId: `claim-${index}`,
        sourceDecisionEdgeId: `edge-${index}`,
        falsifier: `Falsifier ${index}`,
        doesNotProve: `Does not prove ${index}`
      })),
      notes: Array.from({ length: 15 }, (_unused, index) => ({
        id: `note-${index}`,
        decisionId: `decision-${index}`,
        text: index === 0 ? "critical notes-only governing phrase" : `Use current decision ${index}`
      })),
      cases: Array.from({ length: 15 }, (_unused, index) => ({
        id: `case-${index}`,
        task: index === 0 ? "critical notes-only governing phrase" : `Use current decision ${index}`,
        expectedDecisionId: `decision-${index}`,
        baselineFailureRationale: "Notes should win at least one recall case.",
        staleDecisionIds: [],
        rejectedDecisionIds: []
      }))
    }));

    expect(result.status).toBe("fail");
    expect(result.metrics.notesWinCount).toBe(1);
    expect(result.cases.find((testCase) => testCase.id === "case-0")).toMatchObject({
      winner: "notes",
      krn: {
        recallExpected: false
      },
      notes: {
        recallExpected: true
      }
    });
  });
});
