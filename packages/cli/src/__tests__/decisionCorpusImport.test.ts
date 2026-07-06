import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  buildImportedDecisionCorpus,
  loadDecisionCorpusImportFixture,
  runDecisionCorpusImport
} from "../runDecisionCorpusImport.js";
import {
  loadNotesBaselineEvalFixture
} from "../runNotesBaselineEval.js";

const fixturePath = fileURLToPath(
  new URL(
    "../../../../tests/fixtures/decision-corpus-ingest/krn-source-to-decision-import.json",
    import.meta.url
  )
);

const baseFixturePath = fileURLToPath(
  new URL(
    "../../../../tests/fixtures/notes-baseline/decision-packet-vs-notes.json",
    import.meta.url
  )
);

const fixture = () => loadDecisionCorpusImportFixture(fixturePath);
const baseFixture = () => loadNotesBaselineEvalFixture(baseFixturePath);

const importDecision = (
  id: string
) => {
  const decision = fixture().decisions.find((candidate) => candidate.id === id);

  if (decision === undefined) {
    throw new Error(`missing import decision ${id}`);
  }

  return decision;
};

describe("runDecisionCorpusImport", () => {
  it("imports compact source-to-decision rows into a passing decision corpus", () => {
    const result = runDecisionCorpusImport({
      ...fixture(),
      baseFixturePath
    });

    expect(result).toMatchObject({
      kind: "krn.decisionCorpusImport.v1",
      fixtureVersion: "1",
      status: "pass",
      imported: {
        decisionCount: 3,
        noteCount: 3,
        caseCount: 1,
        currentDecisionCount: 1,
        staleDecisionCount: 1,
        rejectedDecisionCount: 1
      },
      notesBaselineStatus: "pass",
      decisionPacketStatus: "pass"
    });
    expect(result.importedDecisionIds).toEqual([
      "decision-corpus-import-path",
      "manual-fixture-editing-only",
      "import-without-link-validation"
    ]);
    expect(result.importedCaseIds).toEqual(["decision-corpus-import-task"]);
    expect(result.proof.proves).toContain(
      "the importer validates current, stale, and rejected decision links for imported cases"
    );
    expect(result.proof.doesNotProve).toContain("DB ingestion");
  });

  it("runs with the fixture embedded relative base path", () => {
    const result = runDecisionCorpusImport(fixture());

    expect(result.status).toBe("pass");
    expect(result.mergedCorpus).toMatchObject({
      name: "krn-decision-packet-imported-source-to-decision",
      decisionCount: 37,
      noteCount: 37,
      caseCount: 18
    });
  });

  it("builds a merged corpus without mutating the base fixture", () => {
    const sourceFixture = fixture();
    const base = baseFixture();
    const merged = buildImportedDecisionCorpus(
      {
        ...sourceFixture,
        baseFixturePath
      },
      base
    );

    expect(base.decisions.some((decision) => decision.id === "decision-corpus-import-path")).toBe(false);
    expect(merged.decisions.some((decision) => decision.id === "decision-corpus-import-path")).toBe(true);
    expect(merged.notes.some((note) => note.id === "note:decision-corpus-import-path")).toBe(true);
    expect(merged.cases.some((testCase) => testCase.id === "decision-corpus-import-task")).toBe(true);
  });

  it("rejects duplicate imported decision ids before merge", () => {
    const sourceFixture = fixture();
    const decision = importDecision("decision-corpus-import-path");

    expect(() =>
      buildImportedDecisionCorpus(
        {
          ...sourceFixture,
          decisions: [
            ...sourceFixture.decisions,
            {
              ...decision,
              title: "Duplicate import decision"
            }
          ]
        },
        baseFixture()
      )
    ).toThrow("import decisions contains duplicate ids: decision-corpus-import-path");
  });

  it("rejects imported decisions that collide with base corpus ids", () => {
    const sourceFixture = fixture();
    const decision = importDecision("decision-corpus-import-path");

    expect(() =>
      buildImportedDecisionCorpus(
        {
          ...sourceFixture,
          decisions: [
            {
              ...decision,
              id: "store-backed-memory-no-markdown"
            },
            ...sourceFixture.decisions.slice(1)
          ]
        },
        baseFixture()
      )
    ).toThrow("import decision duplicates base decision store-backed-memory-no-markdown");
  });

  it("rejects imported cases that collide with base corpus ids", () => {
    const sourceFixture = fixture();

    expect(() =>
      buildImportedDecisionCorpus(
        {
          ...sourceFixture,
          cases: sourceFixture.cases.map((testCase) => ({
            ...testCase,
            id: "memory-runtime-task"
          }))
        },
        baseFixture()
      )
    ).toThrow("import case duplicates base case memory-runtime-task");
  });

  it("rejects stale links that do not point at stale imported decisions", () => {
    const sourceFixture = fixture();

    expect(() =>
      buildImportedDecisionCorpus(
        {
          ...sourceFixture,
          cases: sourceFixture.cases.map((testCase) => ({
            ...testCase,
            staleDecisionIds: ["decision-corpus-import-path"]
          }))
        },
        baseFixture()
      )
    ).toThrow("case decision-corpus-import-task staleDecisionIds must reference stale decisions");
  });

  it("rejects rejected links that do not point at rejected imported decisions", () => {
    const sourceFixture = fixture();

    expect(() =>
      buildImportedDecisionCorpus(
        {
          ...sourceFixture,
          cases: sourceFixture.cases.map((testCase) => ({
            ...testCase,
            rejectedDecisionIds: ["manual-fixture-editing-only"]
          }))
        },
        baseFixture()
      )
    ).toThrow("case decision-corpus-import-task rejectedDecisionIds must reference rejected decisions");
  });
});
