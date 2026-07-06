import { readFileSync } from "node:fs";

import {
  validateClaimedCodexOutputEvidence
} from "@krn/harness";
import type {
  ClaimedCodexOutputEvidence
} from "@krn/harness";
import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./eval-main.js";
import {
  isRecord,
  recordArray,
  stringArrayValue,
  stringValue
} from "./eval-parse-support.js";
import {
  loadNotesBaselineEvalFixture
} from "./run-notes-baseline-eval.js";
import {
  runDecisionPacketEval
} from "./run-decision-packet-eval.js";
import type {
  DecisionPacketEvalResult
} from "./run-decision-packet-eval.js";

type ObedienceStatus = "pass" | "fail";
type DecisionPacketCaseReadback = DecisionPacketEvalResult["cases"][number];

interface RecordedCodexDecisionPacketOutput {
  readonly summary: string;
  readonly evidenceRefs: readonly string[];
  readonly verification: readonly string[];
  readonly changedFiles: readonly string[];
  readonly doesNotProve: string;
}

interface ObedienceCaseFixture {
  readonly id: string;
  readonly decisionPacketCaseId: string;
  readonly expectedGoverningDecisionId: string;
  readonly expectedStaleDecisionIds: readonly string[];
  readonly expectedRejectedPathIds: readonly string[];
  readonly expectedBriefReceiptRef: string;
  readonly output: RecordedCodexDecisionPacketOutput;
}

interface CodexDecisionPacketObedienceFixture {
  readonly version: "1";
  readonly notesBaselineFixturePath: string;
  readonly cases: readonly ObedienceCaseFixture[];
}

interface CodexDecisionPacketObedienceCaseReadback {
  readonly id: string;
  readonly decisionPacketCaseId: string;
  readonly status: ObedienceStatus;
  readonly briefIncludesPacket: boolean;
  readonly outputEvidenceShape: "valid" | "missing_evidence";
  readonly outputObeysGoverningDecision: boolean;
  readonly outputPreservesStaleBoundary: boolean;
  readonly outputPreservesRejectedPath: boolean;
  readonly outputPreservesNonProof: boolean;
  readonly validationFindings: readonly string[];
  readonly missingObedienceSignals: readonly string[];
}

export interface CodexDecisionPacketObedienceEvalResult {
  readonly kind: "krn.codexDecisionPacketObedience.eval.v1";
  readonly fixtureVersion: "1";
  readonly status: ObedienceStatus;
  readonly sourceEvalKind: "krn.decisionPacket.eval.v1";
  readonly metrics: {
    readonly caseCount: number;
    readonly passedCaseCount: number;
    readonly failedCaseCount: number;
    readonly validEvidenceShapeCount: number;
    readonly governedDecisionObedienceCount: number;
    readonly staleBoundaryObedienceCount: number;
    readonly rejectedPathObedienceCount: number;
    readonly nonProofObedienceCount: number;
  };
  readonly cases: readonly CodexDecisionPacketObedienceCaseReadback[];
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

const parseOutput = (
  value: unknown,
  label: string
): RecordedCodexDecisionPacketOutput => {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }

  return {
    summary: stringValue(value["summary"], `${label}.summary`),
    evidenceRefs: stringArrayValue(value["evidenceRefs"], `${label}.evidenceRefs`),
    verification: stringArrayValue(value["verification"], `${label}.verification`),
    changedFiles: stringArrayValue(value["changedFiles"], `${label}.changedFiles`),
    doesNotProve: stringValue(value["doesNotProve"], `${label}.doesNotProve`)
  };
};

const parseFixture = (
  value: unknown
): CodexDecisionPacketObedienceFixture => {
  if (!isRecord(value)) {
    throw new Error("codex decision-packet obedience fixture must be an object");
  }

  const version = stringValue(value["version"], "version");

  if (version !== "1") {
    throw new Error("version must be 1");
  }

  return {
    version,
    notesBaselineFixturePath: stringValue(value["notesBaselineFixturePath"], "notesBaselineFixturePath"),
    cases: recordArray(value["cases"], "cases").map((testCase, index) => ({
      id: stringValue(testCase["id"], `cases[${index}].id`),
      decisionPacketCaseId: stringValue(testCase["decisionPacketCaseId"], `cases[${index}].decisionPacketCaseId`),
      expectedGoverningDecisionId: stringValue(
        testCase["expectedGoverningDecisionId"],
        `cases[${index}].expectedGoverningDecisionId`
      ),
      expectedStaleDecisionIds: stringArrayValue(
        testCase["expectedStaleDecisionIds"],
        `cases[${index}].expectedStaleDecisionIds`
      ),
      expectedRejectedPathIds: stringArrayValue(
        testCase["expectedRejectedPathIds"],
        `cases[${index}].expectedRejectedPathIds`
      ),
      expectedBriefReceiptRef: typeof testCase["expectedBriefReceiptRef"] === "string"
        ? testCase["expectedBriefReceiptRef"]
        : "recorded-obedience:decision-packet-brief-read",
      output: parseOutput(testCase["output"], `cases[${index}].output`)
    }))
  };
};

export const loadCodexDecisionPacketObedienceFixture = (
  fixturePath: string
): CodexDecisionPacketObedienceFixture => {
  const json: unknown = JSON.parse(readFileSync(fixturePath, "utf8"));

  return parseFixture(json);
};

const outputEvidence = (
  output: RecordedCodexDecisionPacketOutput
): ClaimedCodexOutputEvidence => ({
  summary: output.summary,
  claimsKrnContextUse: true,
  evidenceRefs: output.evidenceRefs,
  verification: output.verification,
  changedFiles: output.changedFiles,
  doesNotProve: output.doesNotProve
});

const renderDecisionPacketBrief = (
  packet: {
    readonly governingDecisionIds: readonly string[];
    readonly staleDecisionIds: readonly string[];
    readonly rejectedPathIds: readonly string[];
    readonly sourceDecisionEdgeIds: readonly string[];
    readonly falsifiers: readonly string[];
    readonly nonProofs: readonly string[];
  }
): string => [
  "KRN Decision Packet Brief",
  `governingDecisionIds: ${packet.governingDecisionIds.join(", ")}`,
  `sourceDecisionEdgeIds: ${packet.sourceDecisionEdgeIds.join(", ")}`,
  `staleDecisionIds: ${packet.staleDecisionIds.join(", ")}`,
  `rejectedPathIds: ${packet.rejectedPathIds.join(", ")}`,
  `falsifiers: ${packet.falsifiers.join(" | ")}`,
  `nonProofs: ${packet.nonProofs.join(" | ")}`
].join("\n");

const includesAll = (
  haystack: readonly string[],
  needles: readonly string[]
): boolean => needles.every((needle) => haystack.includes(needle));

const outputEvidenceMentions = (
  output: RecordedCodexDecisionPacketOutput,
  values: readonly string[]
): boolean => values.every((value) =>
  [...output.evidenceRefs, ...output.verification].some((entry) => entry.includes(value))
);

const missingSignals = (
  input: {
    readonly briefIncludesPacket: boolean;
    readonly outputObeysGoverningDecision: boolean;
    readonly outputPreservesStaleBoundary: boolean;
    readonly outputPreservesRejectedPath: boolean;
    readonly outputPreservesNonProof: boolean;
  }
): readonly string[] => [
  ...(input.briefIncludesPacket ? [] : ["missing decision-packet brief receipt"]),
  ...(input.outputObeysGoverningDecision ? [] : ["missing governing decision evidence"]),
  ...(input.outputPreservesStaleBoundary ? [] : ["missing stale-boundary evidence"]),
  ...(input.outputPreservesRejectedPath ? [] : ["missing rejected-path evidence"]),
  ...(input.outputPreservesNonProof ? [] : ["missing non-proof boundary"])
];

const briefHasRequiredPacketSignals = (
  input: {
    readonly brief: string;
    readonly sourceCase: DecisionPacketCaseReadback;
    readonly testCase: ObedienceCaseFixture;
  }
): boolean => {
  const { brief, sourceCase, testCase } = input;

  if (!brief.includes(testCase.expectedGoverningDecisionId)) {
    return false;
  }

  if (!includesAll(sourceCase.packet.staleDecisionIds, testCase.expectedStaleDecisionIds)) {
    return false;
  }

  if (!includesAll(sourceCase.packet.rejectedPathIds, testCase.expectedRejectedPathIds)) {
    return false;
  }

  return sourceCase.packet.nonProofs.length > 0;
};

const caseStatus = (
  input: {
    readonly sourceCase: DecisionPacketCaseReadback;
    readonly briefIncludesPacket: boolean;
    readonly validationFindings: readonly string[];
    readonly missingObedienceSignals: readonly string[];
  }
): ObedienceStatus => {
  if (input.sourceCase.status !== "pass") {
    return "fail";
  }

  if (!input.briefIncludesPacket) {
    return "fail";
  }

  if (input.validationFindings.length > 0) {
    return "fail";
  }

  return input.missingObedienceSignals.length === 0 ? "pass" : "fail";
};

const evaluateCase = (
  testCase: ObedienceCaseFixture,
  sourceCase: DecisionPacketCaseReadback
): CodexDecisionPacketObedienceCaseReadback => {
  const brief = renderDecisionPacketBrief(sourceCase.packet);
  const validationFindings = validateClaimedCodexOutputEvidence(outputEvidence(testCase.output));
  const briefIncludesPacket =
    briefHasRequiredPacketSignals({ brief, sourceCase, testCase }) &&
    outputEvidenceMentions(testCase.output, [testCase.expectedBriefReceiptRef]);
  const outputObeysGoverningDecision = outputEvidenceMentions(testCase.output, [testCase.expectedGoverningDecisionId]);
  const outputPreservesStaleBoundary = outputEvidenceMentions(testCase.output, testCase.expectedStaleDecisionIds);
  const outputPreservesRejectedPath = outputEvidenceMentions(testCase.output, testCase.expectedRejectedPathIds);
  const outputPreservesNonProof = sourceCase.packet.nonProofs.every((nonProof) =>
    testCase.output.doesNotProve.includes(nonProof)
  );
  const missingObedienceSignals = missingSignals({
    briefIncludesPacket,
    outputObeysGoverningDecision,
    outputPreservesStaleBoundary,
    outputPreservesRejectedPath,
    outputPreservesNonProof
  });
  const status = caseStatus({
    sourceCase,
    briefIncludesPacket,
    validationFindings,
    missingObedienceSignals
  });

  return {
    id: testCase.id,
    decisionPacketCaseId: testCase.decisionPacketCaseId,
    status,
    briefIncludesPacket,
    outputEvidenceShape: validationFindings.length === 0 ? "valid" : "missing_evidence",
    outputObeysGoverningDecision,
    outputPreservesStaleBoundary,
    outputPreservesRejectedPath,
    outputPreservesNonProof,
    validationFindings,
    missingObedienceSignals
  };
};

const metricsForCases = (
  cases: readonly CodexDecisionPacketObedienceCaseReadback[]
): CodexDecisionPacketObedienceEvalResult["metrics"] => ({
  caseCount: cases.length,
  passedCaseCount: cases.filter((testCase) => testCase.status === "pass").length,
  failedCaseCount: cases.filter((testCase) => testCase.status === "fail").length,
  validEvidenceShapeCount: cases.filter((testCase) => testCase.outputEvidenceShape === "valid").length,
  governedDecisionObedienceCount: cases.filter((testCase) => testCase.outputObeysGoverningDecision).length,
  staleBoundaryObedienceCount: cases.filter((testCase) => testCase.outputPreservesStaleBoundary).length,
  rejectedPathObedienceCount: cases.filter((testCase) => testCase.outputPreservesRejectedPath).length,
  nonProofObedienceCount: cases.filter((testCase) => testCase.outputPreservesNonProof).length
});

export const runCodexDecisionPacketObedienceEval = (
  fixture: CodexDecisionPacketObedienceFixture
): CodexDecisionPacketObedienceEvalResult => {
  const decisionPacket = runDecisionPacketEval(loadNotesBaselineEvalFixture(fixture.notesBaselineFixturePath));
  const cases = fixture.cases.map((testCase): CodexDecisionPacketObedienceCaseReadback => {
    const sourceCase = decisionPacket.cases.find((candidate) => candidate.id === testCase.decisionPacketCaseId);

    if (sourceCase === undefined) {
      throw new Error(`missing decision-packet case ${testCase.decisionPacketCaseId}`);
    }

    return evaluateCase(testCase, sourceCase);
  });
  const status = cases.length > 0 && cases.every((testCase) => testCase.status === "pass")
    ? "pass"
    : "fail";

  return {
    kind: "krn.codexDecisionPacketObedience.eval.v1",
    fixtureVersion: fixture.version,
    status,
    sourceEvalKind: decisionPacket.kind,
    metrics: metricsForCases(cases),
    cases,
    proof: {
      proves: [
        "recorded Codex-output evidence can be checked against the decision-packet brief fields",
        "the checker requires valid claimed-output evidence shape before accepting KRN-context-use claims",
        "the checker requires governing decision, stale-boundary, rejected-path, and non-proof signals to survive into the recorded output"
      ],
      doesNotProve: [
        "live Codex execution",
        "broad model obedience",
        "LLM output quality",
        "source truth",
        "arbitrary repository portability",
        "product readiness"
      ]
    }
  };
};

if (isCliEntrypoint(import.meta.url)) {
  await writeJsonEvalResult(async () =>
    runCodexDecisionPacketObedienceEval(
      loadCodexDecisionPacketObedienceFixture(
        process.argv[2] ?? "tests/fixtures/codex-decision-packet-obedience/recorded-obedience.json"
      )
    )
  );
}
