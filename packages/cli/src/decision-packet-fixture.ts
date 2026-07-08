import { readFileSync } from "node:fs";

import {
  assertUniqueIds,
  isRecord,
  numberValue,
  recordArray,
  stringArrayValue,
  stringValue
} from "./fixture-parse-support.js";
import {
  parseDecisionCorpusBaseRow
} from "./decision-corpus-status.js";
import type {
  DecisionCorpusStatus
} from "./decision-corpus-status.js";

type DecisionStatus = DecisionCorpusStatus;

export interface DecisionPacketRow {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly status: DecisionStatus;
  readonly taskScopes: readonly string[];
  readonly evidenceRef: string;
  readonly sourceClaimId: string;
  readonly sourceDecisionEdgeId?: string;
  readonly sourceRejectionId?: string;
  readonly falsifier: string;
  readonly doesNotProve: string;
}

export interface DecisionPacketNote {
  readonly id: string;
  readonly decisionId: string;
  readonly text: string;
}

export interface DecisionPacketObservationPrefixItem {
  readonly observationId: string;
  readonly kind: string;
  readonly summary: string;
  readonly reason: string;
}

export interface DecisionPacketExpectedEvidenceGap {
  readonly id: string;
  readonly reason: string;
  readonly verificationRequired: string;
}

export interface DecisionPacketCase {
  readonly id: string;
  readonly task: string;
  readonly expectedDecisionId?: string;
  readonly expectedEvidenceGap?: DecisionPacketExpectedEvidenceGap;
  readonly staleDecisionIds: readonly string[];
  readonly rejectedDecisionIds: readonly string[];
  readonly observationPrefixItems?: readonly DecisionPacketObservationPrefixItem[];
  readonly baselineFailureRationale: string;
}

export interface DecisionPacketEvalFixture {
  readonly version: "1";
  readonly corpusName: string;
  readonly topK: number;
  readonly minimumKrnWinRate: number;
  readonly maximumNotesWinRate: number;
  readonly minimumAbstentionCaseCount: number;
  readonly decisions: readonly DecisionPacketRow[];
  readonly notes: readonly DecisionPacketNote[];
  readonly cases: readonly DecisionPacketCase[];
}

const optionalStringArrayValue = (
  value: unknown,
  label: string
): readonly string[] => value === undefined ? [] : stringArrayValue(value, label);

const optionalStringValue = (
  value: unknown,
  label: string
): string | undefined => value === undefined ? undefined : stringValue(value, label);

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
  const decision = parseDecisionCorpusBaseRow(value, index);

  if (decision.status === "rejected" && sourceRejectionId === undefined) {
    throw new Error(`decisions[${index}].sourceRejectionId is required for rejected decisions`);
  }

  return {
    ...decision,
    taskScopes: optionalStringArrayValue(value["taskScopes"], `decisions[${index}].taskScopes`),
    sourceClaimId: stringValue(value["sourceClaimId"], `decisions[${index}].sourceClaimId`),
    ...(sourceDecisionEdgeId === undefined ? {} : { sourceDecisionEdgeId }),
    ...(sourceRejectionId === undefined ? {} : { sourceRejectionId })
  };
};

const parseNote = (
  value: Record<string, unknown>,
  index: number
): DecisionPacketNote => ({
  id: stringValue(value["id"], `notes[${index}].id`),
  decisionId: stringValue(value["decisionId"], `notes[${index}].decisionId`),
  text: stringValue(value["text"], `notes[${index}].text`)
});

const parseObservationPrefixItem = (
  value: Record<string, unknown>,
  index: number,
  caseIndex: number
): DecisionPacketObservationPrefixItem => ({
  observationId: stringValue(
    value["observationId"],
    `cases[${caseIndex}].observationPrefixItems[${index}].observationId`
  ),
  kind: stringValue(
    value["kind"],
    `cases[${caseIndex}].observationPrefixItems[${index}].kind`
  ),
  summary: stringValue(
    value["summary"],
    `cases[${caseIndex}].observationPrefixItems[${index}].summary`
  ),
  reason: stringValue(
    value["reason"],
    `cases[${caseIndex}].observationPrefixItems[${index}].reason`
  )
});

const optionalObservationPrefixItems = (
  value: unknown,
  caseIndex: number
): readonly DecisionPacketObservationPrefixItem[] =>
  value === undefined
    ? []
    : recordArray(value, `cases[${caseIndex}].observationPrefixItems`)
        .map((item, index) => parseObservationPrefixItem(item, index, caseIndex));

const optionalExpectedEvidenceGap = (
  value: unknown,
  caseIndex: number
): DecisionPacketExpectedEvidenceGap | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    throw new Error(`cases[${caseIndex}].expectedEvidenceGap must be an object`);
  }

  return {
    id: stringValue(value["id"], `cases[${caseIndex}].expectedEvidenceGap.id`),
    reason: stringValue(value["reason"], `cases[${caseIndex}].expectedEvidenceGap.reason`),
    verificationRequired: stringValue(
      value["verificationRequired"],
      `cases[${caseIndex}].expectedEvidenceGap.verificationRequired`
    )
  };
};

const parseCase = (
  value: Record<string, unknown>,
  index: number
): DecisionPacketCase => {
  const expectedDecisionId = optionalStringValue(
    value["expectedDecisionId"],
    `cases[${index}].expectedDecisionId`
  );
  const expectedEvidenceGap = optionalExpectedEvidenceGap(value["expectedEvidenceGap"], index);

  if ((expectedDecisionId === undefined) === (expectedEvidenceGap === undefined)) {
    throw new Error(
      `cases[${index}] must define exactly one of expectedDecisionId or expectedEvidenceGap`
    );
  }

  return {
    id: stringValue(value["id"], `cases[${index}].id`),
    task: stringValue(value["task"], `cases[${index}].task`),
    ...(expectedDecisionId === undefined ? {} : { expectedDecisionId }),
    ...(expectedEvidenceGap === undefined ? {} : { expectedEvidenceGap }),
    staleDecisionIds: optionalStringArrayValue(value["staleDecisionIds"], `cases[${index}].staleDecisionIds`),
    rejectedDecisionIds: optionalStringArrayValue(value["rejectedDecisionIds"], `cases[${index}].rejectedDecisionIds`),
    observationPrefixItems: optionalObservationPrefixItems(value["observationPrefixItems"], index),
    baselineFailureRationale: stringValue(value["baselineFailureRationale"], `cases[${index}].baselineFailureRationale`)
  };
};

const assertFixtureSize = (
  fixture: {
    readonly decisions: readonly DecisionPacketRow[];
    readonly notes: readonly DecisionPacketNote[];
    readonly cases: readonly DecisionPacketCase[];
  }
): void => {
  if (fixture.decisions.length < 15) {
    throw new Error("decision-packet fixture must contain at least 15 decisions");
  }

  if (fixture.notes.length < fixture.decisions.length) {
    throw new Error("decision-packet fixture must contain at least one note per decision");
  }

  if (fixture.cases.length < 15 || fixture.cases.length > 30) {
    throw new Error("decision-packet fixture must contain 15-30 cases");
  }
};

const assertCaseDecisionRefs = (
  testCase: DecisionPacketCase,
  decisionIds: ReadonlySet<string>
): void => {
  const unknownRefs = [
    ...(testCase.expectedDecisionId === undefined ? [] : [testCase.expectedDecisionId]),
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
    readonly notes: readonly DecisionPacketNote[];
    readonly cases: readonly DecisionPacketCase[];
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

export const parseDecisionPacketEvalFixture = (
  value: unknown
): DecisionPacketEvalFixture => {
  if (!isRecord(value)) {
    throw new Error("decision-packet fixture must be an object");
  }

  if (value["version"] !== "1") {
    throw new Error("decision-packet fixture version must be 1");
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
    minimumAbstentionCaseCount: value["minimumAbstentionCaseCount"] === undefined
      ? 0
      : numberValue(value["minimumAbstentionCaseCount"], "minimumAbstentionCaseCount"),
    decisions,
    notes,
    cases
  };
};

export const loadDecisionPacketEvalFixture = (
  path: string
): DecisionPacketEvalFixture => {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));

  return parseDecisionPacketEvalFixture(parsed);
};
