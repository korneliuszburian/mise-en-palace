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
  roundRankingMetric
} from "./ranking-eval-metrics.js";
import {
  tokenOverlapScore
} from "./eval-text-scoring.js";
import {
  buildDecisionPacketWithEngine
} from "./decision-packet-engine.js";

type DecisionStatus = "current" | "stale" | "rejected";
type PacketWinner = "krn" | "notes" | "tie";

export interface DecisionPacketRow {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly status: DecisionStatus;
  readonly evidenceRef: string;
  readonly sourceClaimId: string;
  readonly sourceDecisionEdgeId?: string;
  readonly sourceRejectionId?: string;
  readonly falsifier: string;
  readonly doesNotProve: string;
}

export interface NotesEntry {
  readonly id: string;
  readonly decisionId: string;
  readonly text: string;
}

export interface NotesBaselineCase {
  readonly id: string;
  readonly task: string;
  readonly expectedDecisionId: string;
  readonly staleDecisionIds: readonly string[];
  readonly rejectedDecisionIds: readonly string[];
  readonly baselineFailureRationale: string;
}

export interface NotesBaselineEvalFixture {
  readonly version: "1";
  readonly corpusName: string;
  readonly topK: number;
  readonly minimumKrnWinRate: number;
  readonly maximumNotesWinRate: number;
  readonly decisions: readonly DecisionPacketRow[];
  readonly notes: readonly NotesEntry[];
  readonly cases: readonly NotesBaselineCase[];
}

interface RankedNote {
  readonly id: string;
  readonly decisionId: string;
  readonly score: number;
}

interface KRNPacketReadback {
  readonly selectedDecisionIds: readonly string[];
  readonly staleDecisionIds: readonly string[];
  readonly rejectedPathIds: readonly string[];
  readonly recallExpected: boolean;
  readonly governedBoundary: boolean;
  readonly staleExcluded: boolean;
  readonly rejectedPathVisible: boolean;
  readonly noiseCount: number;
  readonly ceremonyUnits: number;
}

interface NotesPacketReadback {
  readonly selectedNoteIds: readonly string[];
  readonly selectedDecisionIds: readonly string[];
  readonly recallExpected: boolean;
  readonly staleIncluded: boolean;
  readonly rejectedIncluded: boolean;
  readonly governedBoundary: false;
  readonly noiseCount: number;
  readonly ceremonyUnits: number;
}

export interface NotesBaselineEvalCaseResult {
  readonly id: string;
  readonly task: string;
  readonly expectedDecisionId: string;
  readonly baselineFailureRationale: string;
  readonly winner: PacketWinner;
  readonly winReason: string;
  readonly krn: KRNPacketReadback;
  readonly notes: NotesPacketReadback;
}

export interface NotesBaselineEvalResult {
  readonly kind: "krn.notesBaseline.eval.v1";
  readonly fixtureVersion: "1";
  readonly status: "pass" | "fail";
  readonly topK: number;
  readonly corpus: {
    readonly name: string;
    readonly decisionCount: number;
    readonly noteCount: number;
    readonly caseCount: number;
    readonly staleDecisionCount: number;
    readonly rejectedDecisionCount: number;
  };
  readonly thresholds: {
    readonly minimumKrnWinRate: number;
    readonly maximumNotesWinRate: number;
  };
  readonly metrics: {
    readonly caseCount: number;
    readonly krnWinCount: number;
    readonly notesWinCount: number;
    readonly tieCount: number;
    readonly krnWinRate: number;
    readonly notesWinRate: number;
    readonly krnRecallRate: number;
    readonly notesRecallRate: number;
    readonly governedBoundaryRate: number;
    readonly staleExclusionCases: number;
    readonly rejectedPathCases: number;
    readonly notesStaleOrRejectedNoiseCases: number;
    readonly averageKrnCeremonyUnits: number;
    readonly averageNotesCeremonyUnits: number;
  };
  readonly cases: readonly NotesBaselineEvalCaseResult[];
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

const decisionStatuses = new Set<DecisionStatus>(["current", "stale", "rejected"]);

const optionalStringArrayValue = (
  value: unknown,
  label: string
): readonly string[] => value === undefined ? [] : stringArrayValue(value, label);

const optionalStringValue = (
  value: unknown,
  label: string
): string | undefined => value === undefined ? undefined : stringValue(value, label);

const parseDecisionStatus = (
  value: unknown,
  label: string
): DecisionStatus => {
  const status = stringValue(value, label);

  if (!decisionStatuses.has(status as DecisionStatus)) {
    throw new Error(`${label} must be current, stale, or rejected`);
  }

  return status as DecisionStatus;
};

const parseDecision = (
  value: Record<string, unknown>,
  index: number
): DecisionPacketRow => {
  const sourceDecisionEdgeId = optionalStringValue(
    value["sourceDecisionEdgeId"],
    `decisions[${index}].sourceDecisionEdgeId`
  );
  const sourceRejectionId = optionalStringValue(
    value["sourceRejectionId"],
    `decisions[${index}].sourceRejectionId`
  );
  const decision = {
    id: stringValue(value["id"], `decisions[${index}].id`),
    title: stringValue(value["title"], `decisions[${index}].title`),
    statement: stringValue(value["statement"], `decisions[${index}].statement`),
    status: parseDecisionStatus(value["status"], `decisions[${index}].status`),
    evidenceRef: stringValue(value["evidenceRef"], `decisions[${index}].evidenceRef`),
    sourceClaimId: stringValue(value["sourceClaimId"], `decisions[${index}].sourceClaimId`),
    falsifier: stringValue(value["falsifier"], `decisions[${index}].falsifier`),
    doesNotProve: stringValue(value["doesNotProve"], `decisions[${index}].doesNotProve`)
  };

  return {
    ...decision,
    ...(sourceDecisionEdgeId === undefined ? {} : { sourceDecisionEdgeId }),
    ...(sourceRejectionId === undefined ? {} : { sourceRejectionId })
  };
};

const parseNote = (
  value: Record<string, unknown>,
  index: number
): NotesEntry => ({
  id: stringValue(value["id"], `notes[${index}].id`),
  decisionId: stringValue(value["decisionId"], `notes[${index}].decisionId`),
  text: stringValue(value["text"], `notes[${index}].text`)
});

const parseCase = (
  value: Record<string, unknown>,
  index: number
): NotesBaselineCase => ({
  id: stringValue(value["id"], `cases[${index}].id`),
  task: stringValue(value["task"], `cases[${index}].task`),
  expectedDecisionId: stringValue(value["expectedDecisionId"], `cases[${index}].expectedDecisionId`),
  staleDecisionIds: optionalStringArrayValue(value["staleDecisionIds"], `cases[${index}].staleDecisionIds`),
  rejectedDecisionIds: optionalStringArrayValue(value["rejectedDecisionIds"], `cases[${index}].rejectedDecisionIds`),
  baselineFailureRationale: stringValue(value["baselineFailureRationale"], `cases[${index}].baselineFailureRationale`)
});

const assertFixtureSize = (
  fixture: {
    readonly decisions: readonly DecisionPacketRow[];
    readonly notes: readonly NotesEntry[];
    readonly cases: readonly NotesBaselineCase[];
  }
): void => {
  if (fixture.decisions.length < 15) {
    throw new Error("notes baseline eval fixture must contain at least 15 decisions");
  }

  if (fixture.notes.length < fixture.decisions.length) {
    throw new Error("notes baseline eval fixture must contain at least one note per decision");
  }

  if (fixture.cases.length < 15 || fixture.cases.length > 25) {
    throw new Error("notes baseline eval fixture must contain 15-25 cases");
  }
};

const assertCaseDecisionRefs = (
  testCase: NotesBaselineCase,
  decisionIds: ReadonlySet<string>
): void => {
  const unknownRefs = [
    testCase.expectedDecisionId,
    ...testCase.staleDecisionIds,
    ...testCase.rejectedDecisionIds
  ].filter((id) => !decisionIds.has(id));

  if (unknownRefs.length > 0) {
    throw new Error(`case ${testCase.id} references unknown decisions: ${unknownRefs.join(", ")}`);
  }
};

const assertFixtureRefs = (
  fixture: {
    readonly decisions: readonly DecisionPacketRow[];
    readonly notes: readonly NotesEntry[];
    readonly cases: readonly NotesBaselineCase[];
  }
): void => {
  const decisionIds = new Set(fixture.decisions.map((decision) => decision.id));
  const unknownNote = fixture.notes.find((note) => !decisionIds.has(note.decisionId));

  if (unknownNote !== undefined) {
    throw new Error(`note ${unknownNote.id} references unknown decision ${unknownNote.decisionId}`);
  }

  for (const testCase of fixture.cases) {
    assertCaseDecisionRefs(testCase, decisionIds);
  }
};

export const parseNotesBaselineEvalFixture = (
  value: unknown
): NotesBaselineEvalFixture => {
  if (!isRecord(value)) {
    throw new Error("notes baseline eval fixture must be an object");
  }

  if (value["version"] !== "1") {
    throw new Error("notes baseline eval fixture version must be 1");
  }

  const decisions = recordArray(value["decisions"], "decisions").map(parseDecision);
  const notes = recordArray(value["notes"], "notes").map(parseNote);
  const cases = recordArray(value["cases"], "cases").map(parseCase);
  const fixtureParts = { decisions, notes, cases };

  assertUniqueIds(decisions.map((decision) => decision.id), "decisions");
  assertUniqueIds(notes.map((note) => note.id), "notes");
  assertUniqueIds(cases.map((testCase) => testCase.id), "cases");
  assertFixtureSize(fixtureParts);
  assertFixtureRefs(fixtureParts);

  return {
    version: "1",
    corpusName: stringValue(value["corpusName"], "corpusName"),
    topK: numberValue(value["topK"], "topK"),
    minimumKrnWinRate: numberValue(value["minimumKrnWinRate"], "minimumKrnWinRate"),
    maximumNotesWinRate: numberValue(value["maximumNotesWinRate"], "maximumNotesWinRate"),
    decisions,
    notes,
    cases
  };
};

export const loadNotesBaselineEvalFixture = (
  path: string
): NotesBaselineEvalFixture => {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));

  return parseNotesBaselineEvalFixture(parsed);
};

const rankNotes = (
  notes: readonly NotesEntry[],
  task: string
): readonly RankedNote[] =>
  notes
    .map((note) => ({
      id: note.id,
      decisionId: note.decisionId,
      score: tokenOverlapScore(task, note.text)
    }))
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));

const average = (
  values: readonly number[]
): number => {
  if (values.length === 0) {
    return 0;
  }

  return roundRankingMetric(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const hasDecisionBoundary = (
  decision: DecisionPacketRow | undefined
): boolean =>
  decision !== undefined &&
  decision.evidenceRef.trim().length > 0 &&
  decision.sourceClaimId.trim().length > 0 &&
  decision.sourceDecisionEdgeId !== undefined &&
  decision.sourceDecisionEdgeId.trim().length > 0;

const buildKrnPacket = async (
  fixture: NotesBaselineEvalFixture,
  testCase: NotesBaselineCase
): Promise<KRNPacketReadback> => {
  const packet = await buildDecisionPacketWithEngine(fixture, testCase);
  const selectedDecisionIds = packet.governingDecisionIds;
  const expectedDecision = fixture.decisions.find((decision) =>
    decision.id === testCase.expectedDecisionId
  );

  return {
    selectedDecisionIds,
    staleDecisionIds: packet.staleDecisionIds,
    rejectedPathIds: packet.rejectedPathIds,
    recallExpected: selectedDecisionIds.includes(testCase.expectedDecisionId),
    governedBoundary: hasDecisionBoundary(expectedDecision) &&
      packet.sourceDecisionEdgeIds.length > 0 &&
      packet.falsifiers.length > 0 &&
      packet.doesNotProve.length > 0 &&
      selectedDecisionIds.includes(testCase.expectedDecisionId),
    staleExcluded: testCase.staleDecisionIds.length > 0 &&
      packet.staleDecisionIds.length === testCase.staleDecisionIds.length,
    rejectedPathVisible: testCase.rejectedDecisionIds.length > 0 &&
      packet.rejectedPathIds.length === testCase.rejectedDecisionIds.length,
    noiseCount: packet.noiseDecisionIds.length,
    ceremonyUnits: packet.brief.includedContextCount + packet.brief.explicitExclusionCount
  };
};

const buildNotesPacket = (
  fixture: NotesBaselineEvalFixture,
  testCase: NotesBaselineCase
): NotesPacketReadback => {
  const decisionsById = new Map(fixture.decisions.map((decision) => [decision.id, decision]));
  const selectedNotes = rankNotes(fixture.notes, testCase.task).slice(0, fixture.topK);
  const selectedDecisionIds = selectedNotes.map((note) => note.decisionId);
  const staleIncluded = selectedDecisionIds.some((id) => {
    const decision = decisionsById.get(id);

    return decision?.status === "stale";
  });
  const rejectedIncluded = selectedDecisionIds.some((id) => {
    const decision = decisionsById.get(id);

    return decision?.status === "rejected";
  });
  const noiseCount = selectedDecisionIds.filter((id) => id !== testCase.expectedDecisionId).length;

  return {
    selectedNoteIds: selectedNotes.map((note) => note.id),
    selectedDecisionIds,
    recallExpected: selectedDecisionIds.includes(testCase.expectedDecisionId),
    staleIncluded,
    rejectedIncluded,
    governedBoundary: false,
    noiseCount,
    ceremonyUnits: selectedNotes.length
  };
};

const recallWinner = (
  krn: KRNPacketReadback,
  notes: NotesPacketReadback
): PacketWinner | undefined => {
  if (krn.recallExpected === notes.recallExpected) {
    return undefined;
  }

  return krn.recallExpected ? "krn" : "notes";
};

const materialKrnAdvantage = (
  krn: KRNPacketReadback,
  notes: NotesPacketReadback
): boolean =>
  krn.governedBoundary &&
  (krn.staleExcluded || krn.rejectedPathVisible) &&
  krn.noiseCount <= notes.noiseCount;

const chooseWinner = (
  krn: KRNPacketReadback,
  notes: NotesPacketReadback
): { readonly winner: PacketWinner; readonly reason: string } => {
  const recall = recallWinner(krn, notes);

  if (recall === "krn") {
    return {
      winner: "krn",
      reason: "KRN recalled the governing decision where notes+grep missed it."
    };
  }

  if (recall === "notes") {
    return {
      winner: "notes",
      reason: "Notes+grep recalled the governing decision and KRN did not."
    };
  }

  if (!krn.recallExpected) {
    return {
      winner: "tie",
      reason: "Neither packet recalled the governing decision."
    };
  }

  return materialKrnAdvantage(krn, notes)
    ? {
      winner: "krn",
      reason: "Recall tied, but KRN added governed boundary plus stale/rejected-path handling without more noise."
    }
    : {
      winner: "tie",
      reason: "Recall tied and KRN did not materially beat the notes baseline on the predeclared axes."
    };
};

const evaluateCase = async (
  fixture: NotesBaselineEvalFixture,
  testCase: NotesBaselineCase
): Promise<NotesBaselineEvalCaseResult> => {
  const krn = await buildKrnPacket(fixture, testCase);
  const notes = buildNotesPacket(fixture, testCase);
  const winner = chooseWinner(krn, notes);

  return {
    id: testCase.id,
    task: testCase.task,
    expectedDecisionId: testCase.expectedDecisionId,
    baselineFailureRationale: testCase.baselineFailureRationale,
    winner: winner.winner,
    winReason: winner.reason,
    krn,
    notes
  };
};

export const runNotesBaselineEval = async (
  fixture: NotesBaselineEvalFixture
): Promise<NotesBaselineEvalResult> => {
  const cases = await Promise.all(fixture.cases.map((testCase) => evaluateCase(fixture, testCase)));
  const krnWinCount = cases.filter((testCase) => testCase.winner === "krn").length;
  const notesWinCount = cases.filter((testCase) => testCase.winner === "notes").length;
  const tieCount = cases.filter((testCase) => testCase.winner === "tie").length;
  const krnWinRate = roundRankingMetric(krnWinCount / cases.length);
  const notesWinRate = roundRankingMetric(notesWinCount / cases.length);
  const krnRecallRate = roundRankingMetric(cases.filter((testCase) => testCase.krn.recallExpected).length / cases.length);
  const notesRecallRate = roundRankingMetric(cases.filter((testCase) => testCase.notes.recallExpected).length / cases.length);
  const governedBoundaryRate = roundRankingMetric(cases.filter((testCase) => testCase.krn.governedBoundary).length / cases.length);
  const staleExclusionCases = cases.filter((testCase) => testCase.krn.staleExcluded).length;
  const rejectedPathCases = cases.filter((testCase) => testCase.krn.rejectedPathVisible).length;
  const notesStaleOrRejectedNoiseCases = cases.filter((testCase) =>
    (testCase.krn.staleExcluded || testCase.krn.rejectedPathVisible) &&
    (testCase.notes.staleIncluded || testCase.notes.rejectedIncluded)
  ).length;
  const status =
    krnWinRate >= fixture.minimumKrnWinRate &&
    notesWinRate <= fixture.maximumNotesWinRate &&
    krnRecallRate >= notesRecallRate &&
    governedBoundaryRate === 1 &&
    staleExclusionCases > 0 &&
    rejectedPathCases > 0
      ? "pass"
      : "fail";

  return {
    kind: "krn.notesBaseline.eval.v1",
    fixtureVersion: fixture.version,
    status,
    topK: fixture.topK,
    corpus: {
      name: fixture.corpusName,
      decisionCount: fixture.decisions.length,
      noteCount: fixture.notes.length,
      caseCount: fixture.cases.length,
      staleDecisionCount: fixture.decisions.filter((decision) => decision.status === "stale").length,
      rejectedDecisionCount: fixture.decisions.filter((decision) => decision.status === "rejected").length
    },
    thresholds: {
      minimumKrnWinRate: fixture.minimumKrnWinRate,
      maximumNotesWinRate: fixture.maximumNotesWinRate
    },
    metrics: {
      caseCount: cases.length,
      krnWinCount,
      notesWinCount,
      tieCount,
      krnWinRate,
      notesWinRate,
      krnRecallRate,
      notesRecallRate,
      governedBoundaryRate,
      staleExclusionCases,
      rejectedPathCases,
      notesStaleOrRejectedNoiseCases,
      averageKrnCeremonyUnits: average(cases.map((testCase) => testCase.krn.ceremonyUnits)),
      averageNotesCeremonyUnits: average(cases.map((testCase) => testCase.notes.ceremonyUnits))
    },
    cases,
    proof: {
      proves: [
        "deterministic notes-baseline fixture compares KRN decision packets against a comprehensive flat NOTES.md plus grep baseline",
        "per-case output reports expected decision recall, governed boundary readback, stale decision exclusion, rejected-path visibility, packet noise, and ceremony units",
        "KRN only wins when recall is at parity or better and the packet adds governed boundary plus stale or rejected-path value without more noise",
        "the notes baseline is not a strawman: it contains governing decision text and can tie raw recall"
      ],
      doesNotProve: [
        "live Codex execution or obedience",
        "operator willingness to pay",
        "broad arbitrary-repo advantage",
        "source truth",
        "production semantic retrieval quality",
        "that every KRN packet is less ceremonial than notes",
        "that notes files cannot be manually maintained with falsifiers and rejection records"
      ]
    }
  };
};

if (isCliEntrypoint(import.meta.url)) {
  await writeJsonEvalResult(async () =>
    runNotesBaselineEval(loadNotesBaselineEvalFixture(process.argv[2] ?? ""))
  );
}
