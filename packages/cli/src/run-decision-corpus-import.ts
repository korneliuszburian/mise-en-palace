import { readFileSync } from "node:fs";

import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./eval-main.js";
import {
  isRecord,
  numberValue,
  recordArray,
  assertUniqueIds,
  stringArrayValue,
  stringValue
} from "./eval-parse-support.js";
import {
  runDecisionPacketEval
} from "./run-decision-packet-eval.js";
import {
  loadNotesBaselineEvalFixture,
  parseNotesBaselineEvalFixture,
  runNotesBaselineEval
} from "./run-notes-baseline-eval.js";
import type {
  NotesBaselineEvalFixture
} from "./run-notes-baseline-eval.js";

export type ImportedDecisionStatus = "current" | "stale" | "rejected";
type ImportedDecision = NotesBaselineEvalFixture["decisions"][number];
type ImportedNote = NotesBaselineEvalFixture["notes"][number];
type ImportedCase = NotesBaselineEvalFixture["cases"][number];

export interface DecisionCorpusImportRow {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly status: ImportedDecisionStatus;
  readonly evidenceRef: string;
  readonly falsifier: string;
  readonly doesNotProve: string;
  readonly noteText: string;
}

export interface DecisionCorpusImportCase {
  readonly id: string;
  readonly task: string;
  readonly expectedDecisionId: string;
  readonly staleDecisionIds: readonly string[];
  readonly rejectedDecisionIds: readonly string[];
  readonly baselineFailureRationale: string;
}

export interface DecisionCorpusImportFixture {
  readonly version: "1";
  readonly baseFixturePath: string;
  readonly corpusName: string;
  readonly topK: number;
  readonly minimumKrnWinRate: number;
  readonly maximumNotesWinRate: number;
  readonly decisions: readonly DecisionCorpusImportRow[];
  readonly cases: readonly DecisionCorpusImportCase[];
}

export interface DecisionCorpusImportResult {
  readonly kind: "krn.decisionCorpusImport.v1";
  readonly fixtureVersion: "1";
  readonly status: "pass" | "fail";
  readonly imported: {
    readonly decisionCount: number;
    readonly noteCount: number;
    readonly caseCount: number;
    readonly currentDecisionCount: number;
    readonly staleDecisionCount: number;
    readonly rejectedDecisionCount: number;
  };
  readonly mergedCorpus: {
    readonly name: string;
    readonly decisionCount: number;
    readonly noteCount: number;
    readonly caseCount: number;
  };
  readonly importedDecisionIds: readonly string[];
  readonly importedCaseIds: readonly string[];
  readonly notesBaselineStatus: "pass" | "fail";
  readonly decisionPacketStatus: "pass" | "fail";
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

const decisionStatuses = new Set<ImportedDecisionStatus>(["current", "stale", "rejected"]);

const parseDecisionStatus = (
  value: unknown,
  label: string
): ImportedDecisionStatus => {
  const status = stringValue(value, label);

  if (!decisionStatuses.has(status as ImportedDecisionStatus)) {
    throw new Error(`${label} must be current, stale, or rejected`);
  }

  return status as ImportedDecisionStatus;
};

const parseImportDecision = (
  value: Record<string, unknown>,
  index: number
): DecisionCorpusImportRow => ({
  id: stringValue(value["id"], `decisions[${index}].id`),
  title: stringValue(value["title"], `decisions[${index}].title`),
  statement: stringValue(value["statement"], `decisions[${index}].statement`),
  status: parseDecisionStatus(value["status"], `decisions[${index}].status`),
  evidenceRef: stringValue(value["evidenceRef"], `decisions[${index}].evidenceRef`),
  falsifier: stringValue(value["falsifier"], `decisions[${index}].falsifier`),
  doesNotProve: stringValue(value["doesNotProve"], `decisions[${index}].doesNotProve`),
  noteText: stringValue(value["noteText"], `decisions[${index}].noteText`)
});

const parseImportCase = (
  value: Record<string, unknown>,
  index: number
): DecisionCorpusImportCase => ({
  id: stringValue(value["id"], `cases[${index}].id`),
  task: stringValue(value["task"], `cases[${index}].task`),
  expectedDecisionId: stringValue(value["expectedDecisionId"], `cases[${index}].expectedDecisionId`),
  staleDecisionIds: stringArrayValue(value["staleDecisionIds"], `cases[${index}].staleDecisionIds`),
  rejectedDecisionIds: stringArrayValue(value["rejectedDecisionIds"], `cases[${index}].rejectedDecisionIds`),
  baselineFailureRationale: stringValue(value["baselineFailureRationale"], `cases[${index}].baselineFailureRationale`)
});

export const parseDecisionCorpusImportFixture = (
  value: unknown
): DecisionCorpusImportFixture => {
  if (!isRecord(value)) {
    throw new Error("decision corpus import fixture must be an object");
  }

  if (value["version"] !== "1") {
    throw new Error("decision corpus import fixture version must be 1");
  }

  const decisions = recordArray(value["decisions"], "decisions").map(parseImportDecision);
  const cases = recordArray(value["cases"], "cases").map(parseImportCase);

  assertUniqueIds(decisions.map((decision) => decision.id), "import decisions");
  assertUniqueIds(cases.map((testCase) => testCase.id), "import cases");

  return {
    version: "1",
    baseFixturePath: stringValue(value["baseFixturePath"], "baseFixturePath"),
    corpusName: stringValue(value["corpusName"], "corpusName"),
    topK: numberValue(value["topK"], "topK"),
    minimumKrnWinRate: numberValue(value["minimumKrnWinRate"], "minimumKrnWinRate"),
    maximumNotesWinRate: numberValue(value["maximumNotesWinRate"], "maximumNotesWinRate"),
    decisions,
    cases
  };
};

export const loadDecisionCorpusImportFixture = (
  path: string
): DecisionCorpusImportFixture => {
  const json: unknown = JSON.parse(readFileSync(path, "utf8"));

  return parseDecisionCorpusImportFixture(json);
};

const toDecision = (
  row: DecisionCorpusImportRow
): ImportedDecision => ({
  id: row.id,
  title: row.title,
  statement: row.statement,
  status: row.status,
  evidenceRef: row.evidenceRef,
  sourceClaimId: `source-claim:${row.id}`,
  sourceDecisionEdgeId: `source-decision-edge:${row.id}`,
  falsifier: row.falsifier,
  doesNotProve: row.doesNotProve,
  ...(row.status === "rejected" ? { sourceRejectionId: `source-rejection:${row.id}` } : {})
});

const toNote = (
  row: DecisionCorpusImportRow
): ImportedNote => ({
  id: `note:${row.id}`,
  decisionId: row.id,
  text: row.noteText
});

const toCase = (
  row: DecisionCorpusImportCase
): ImportedCase => ({
  id: row.id,
  task: row.task,
  expectedDecisionId: row.expectedDecisionId,
  staleDecisionIds: row.staleDecisionIds,
  rejectedDecisionIds: row.rejectedDecisionIds,
  baselineFailureRationale: row.baselineFailureRationale
});

const assertNoBaseCollisions = (
  base: NotesBaselineEvalFixture,
  importedDecisions: readonly ImportedDecision[],
  importedNotes: readonly ImportedNote[],
  importedCases: readonly ImportedCase[]
): void => {
  const baseDecisionIds = new Set(base.decisions.map((decision) => decision.id));
  const baseNoteIds = new Set(base.notes.map((note) => note.id));
  const baseCaseIds = new Set(base.cases.map((testCase) => testCase.id));
  const duplicateDecision = importedDecisions.find((decision) => baseDecisionIds.has(decision.id));
  const duplicateNote = importedNotes.find((note) => baseNoteIds.has(note.id));
  const duplicateCase = importedCases.find((testCase) => baseCaseIds.has(testCase.id));

  if (duplicateDecision !== undefined) {
    throw new Error(`import decision duplicates base decision ${duplicateDecision.id}`);
  }

  if (duplicateNote !== undefined) {
    throw new Error(`import note duplicates base note ${duplicateNote.id}`);
  }

  if (duplicateCase !== undefined) {
    throw new Error(`import case duplicates base case ${duplicateCase.id}`);
  }
};

const assertDecisionStatus = (
  input: {
    readonly decisionsById: ReadonlyMap<string, ImportedDecision>;
    readonly decisionId: string;
    readonly expectedStatus: ImportedDecisionStatus;
    readonly errorMessage: string;
  }
): void => {
  if (input.decisionsById.get(input.decisionId)?.status !== input.expectedStatus) {
    throw new Error(input.errorMessage);
  }
};

const assertImportedCaseLinks = (
  decisions: readonly ImportedDecision[],
  cases: readonly ImportedCase[]
): void => {
  const decisionsById = new Map(decisions.map((decision) => [decision.id, decision]));

  for (const testCase of cases) {
    assertDecisionStatus({
      decisionsById,
      decisionId: testCase.expectedDecisionId,
      expectedStatus: "current",
      errorMessage: `case ${testCase.id} expectedDecisionId must reference a current decision`
    });

    for (const staleId of testCase.staleDecisionIds) {
      assertDecisionStatus({
        decisionsById,
        decisionId: staleId,
        expectedStatus: "stale",
        errorMessage: `case ${testCase.id} staleDecisionIds must reference stale decisions`
      });
    }

    for (const rejectedId of testCase.rejectedDecisionIds) {
      assertDecisionStatus({
        decisionsById,
        decisionId: rejectedId,
        expectedStatus: "rejected",
        errorMessage: `case ${testCase.id} rejectedDecisionIds must reference rejected decisions`
      });
    }
  }
};

export const buildImportedDecisionCorpus = (
  fixture: DecisionCorpusImportFixture,
  base: NotesBaselineEvalFixture
): NotesBaselineEvalFixture => {
  assertUniqueIds(fixture.decisions.map((decision) => decision.id), "import decisions");
  assertUniqueIds(fixture.cases.map((testCase) => testCase.id), "import cases");

  const importedDecisions = fixture.decisions.map(toDecision);
  const importedNotes = fixture.decisions.map(toNote);
  const importedCases = fixture.cases.map(toCase);

  assertNoBaseCollisions(base, importedDecisions, importedNotes, importedCases);
  assertImportedCaseLinks(importedDecisions, importedCases);

  return parseNotesBaselineEvalFixture({
    version: "1",
    corpusName: fixture.corpusName,
    topK: fixture.topK,
    minimumKrnWinRate: fixture.minimumKrnWinRate,
    maximumNotesWinRate: fixture.maximumNotesWinRate,
    decisions: [...base.decisions, ...importedDecisions],
    notes: [...base.notes, ...importedNotes],
    cases: [...base.cases, ...importedCases]
  });
};

export const runDecisionCorpusImport = async (
  fixture: DecisionCorpusImportFixture
): Promise<DecisionCorpusImportResult> => {
  const base = loadNotesBaselineEvalFixture(fixture.baseFixturePath);
  const merged = buildImportedDecisionCorpus(fixture, base);
  const notesBaseline = await runNotesBaselineEval(merged);
  const decisionPacket = await runDecisionPacketEval(merged);
  const currentDecisionCount = fixture.decisions.filter((decision) => decision.status === "current").length;
  const staleDecisionCount = fixture.decisions.filter((decision) => decision.status === "stale").length;
  const rejectedDecisionCount = fixture.decisions.filter((decision) => decision.status === "rejected").length;
  const status = notesBaseline.status === "pass" && decisionPacket.status === "pass"
    ? "pass"
    : "fail";

  return {
    kind: "krn.decisionCorpusImport.v1",
    fixtureVersion: fixture.version,
    status,
    imported: {
      decisionCount: fixture.decisions.length,
      noteCount: fixture.decisions.length,
      caseCount: fixture.cases.length,
      currentDecisionCount,
      staleDecisionCount,
      rejectedDecisionCount
    },
    mergedCorpus: {
      name: merged.corpusName,
      decisionCount: merged.decisions.length,
      noteCount: merged.notes.length,
      caseCount: merged.cases.length
    },
    importedDecisionIds: fixture.decisions.map((decision) => decision.id),
    importedCaseIds: fixture.cases.map((testCase) => testCase.id),
    notesBaselineStatus: notesBaseline.status,
    decisionPacketStatus: decisionPacket.status,
    proof: {
      proves: [
        "compact source-to-decision import rows can be converted into notes-baseline and decision-packet corpus rows",
        "the importer rejects duplicate imported ids and collisions with the base corpus before merge",
        "the importer validates current, stale, and rejected decision links for imported cases",
        "the merged corpus still passes notes-baseline and decision-packet eval gates"
      ],
      doesNotProve: [
        "DB ingestion",
        "source truth",
        "automatic source promotion",
        "live Codex obedience",
        "arbitrary corpus quality",
        "product readiness"
      ]
    }
  };
};

if (isCliEntrypoint(import.meta.url)) {
  await writeJsonEvalResult(async () =>
    runDecisionCorpusImport(
      loadDecisionCorpusImportFixture(
        process.argv[2] ?? "tests/fixtures/decision-corpus-ingest/krn-source-to-decision-import.json"
      )
    )
  );
}
