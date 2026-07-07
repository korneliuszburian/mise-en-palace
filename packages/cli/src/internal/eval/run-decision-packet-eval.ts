import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./eval-main.js";
import {
  roundRankingMetric
} from "./ranking-eval-metrics.js";
import {
  tokenOverlapScore
} from "./eval-text-scoring.js";
import type {
  DecisionPacketEvalCaseReadback,
  DecisionPacketEvalResult,
  DecisionPacketScoreBreakdown,
  NotesBaselineResult,
  PacketQualityLabel
} from "./decision-packet-eval-shape.js";
import {
  comparePacketAgainstNotesBaseline,
  decisionPacketCaseStatus
} from "./decision-packet-eval-shape.js";
import {
  buildDecisionPacketWithEngine
} from "../../decision-packet-engine.js";
import type {
  DecisionPacketRow,
  DecisionPacketCase,
  DecisionPacketEvalFixture,
  DecisionPacketNote
} from "../../decision-packet-fixture.js";
import {
  loadDecisionPacketEvalFixture
} from "../../decision-packet-fixture.js";

export type {
  DecisionPacketEvalCaseReadback,
  DecisionPacketEvalResult
} from "./decision-packet-eval-shape.js";

type DecisionPacketDecision = DecisionPacketRow;

const minimumUsefulRate = 0.8;
const maximumSevereStaleAuthorityInclusions = 0;
const maximumAverageNoiseDecisions = 2;

const decisionById = (
  decisions: readonly DecisionPacketDecision[]
): ReadonlyMap<string, DecisionPacketDecision> =>
  new Map(decisions.map((decision) => [decision.id, decision]));

const nonEmpty = (
  value: string | undefined
): value is string => value !== undefined && value.trim().length > 0;

const hasDecisionBoundary = (
  packet: DecisionPacketEvalCaseReadback["packet"],
  expectedDecision: DecisionPacketDecision | undefined
): boolean =>
  expectedDecision !== undefined &&
  packet.governingDecisionIds.includes(expectedDecision.id) &&
  nonEmpty(expectedDecision.sourceClaimId) &&
  nonEmpty(expectedDecision.sourceDecisionEdgeId) &&
  nonEmpty(expectedDecision.falsifier) &&
  nonEmpty(expectedDecision.doesNotProve) &&
  packet.nonProofs.length > 0;

const hasSameIds = (
  actual: readonly string[],
  expected: readonly string[]
): boolean => {
  if (actual.length !== expected.length) {
    return false;
  }

  const actualIds = new Set(actual);

  return expected.every((id) => actualIds.has(id));
};

const expectedSourceRejectionIds = (
  fixture: DecisionPacketEvalFixture,
  testCase: DecisionPacketCase
): readonly string[] => {
  const rejected = new Set(testCase.rejectedDecisionIds);

  return fixture.decisions
    .filter((decision) => decision.status === "rejected" && rejected.has(decision.id))
    .flatMap((decision) =>
      nonEmpty(decision.sourceRejectionId) ? [decision.sourceRejectionId] : []
    );
};

const reasonFor = (
  condition: boolean,
  passed: string,
  failed: string
): string => condition ? passed : failed;

const packetReasons = (
  fixture: DecisionPacketEvalFixture,
  packet: DecisionPacketEvalCaseReadback["packet"],
  testCase: DecisionPacketCase
): readonly string[] => [
  reasonFor(
    packet.governingDecisionIds.includes(testCase.expectedDecisionId),
    "packet includes expected governing decision",
    "packet misses expected governing decision"
  ),
  reasonFor(
    packet.sourceDecisionEdgeIds.length > 0,
    "packet includes SourceDecisionEdge refs",
    "packet is missing SourceDecisionEdge refs"
  ),
  reasonFor(
    packet.falsifiers.length > 0 && packet.doesNotProve.length > 0,
    "packet includes falsifier and doesNotProve boundaries",
    "packet is missing falsifier or doesNotProve boundaries"
  ),
  reasonFor(
    hasSameIds(packet.staleDecisionIds, testCase.staleDecisionIds),
    "packet excludes expected stale decisions with readback",
    "packet misses stale-decision exclusion readback"
  ),
  reasonFor(
    hasSameIds(packet.rejectedPathIds, testCase.rejectedDecisionIds),
    "packet includes expected rejected-path readback",
    "packet misses rejected-path readback"
  ),
  reasonFor(
    hasSameIds(packet.sourceRejectionIds, expectedSourceRejectionIds(fixture, testCase)),
    "packet includes SourceRejection refs for rejected paths",
    "packet misses SourceRejection refs for rejected paths"
  ),
  reasonFor(
    packet.severeStaleAuthorityIds.length === 0,
    "packet has no severe stale-authority inclusions",
    "packet includes stale or rejected authority as governing context"
  ),
  reasonFor(
    packet.noiseDecisionIds.length <= maximumAverageNoiseDecisions,
    "packet noise is within budget",
    "packet is too noisy for pre-code use"
  )
];

const score = (condition: boolean): number => condition ? 1 : 0;

const scoreDecisionPacket = (
  fixture: DecisionPacketEvalFixture,
  packet: DecisionPacketEvalCaseReadback["packet"],
  testCase: DecisionPacketCase,
  expectedDecision: DecisionPacketDecision | undefined
): DecisionPacketScoreBreakdown => {
  const taskUsefulness = score(
    packet.governingDecisionIds.includes(testCase.expectedDecisionId) &&
    packet.noiseDecisionIds.length <= maximumAverageNoiseDecisions
  );
  const evidenceFidelity = score(hasDecisionBoundary(packet, expectedDecision));
  const temporalCorrectness = score(
    hasSameIds(packet.staleDecisionIds, testCase.staleDecisionIds) &&
    packet.severeStaleAuthorityIds.length === 0
  );
  const rejectionRecall = score(
    hasSameIds(packet.rejectedPathIds, testCase.rejectedDecisionIds) &&
    hasSameIds(packet.sourceRejectionIds, expectedSourceRejectionIds(fixture, testCase))
  );
  const nonProofBoundaries = score(packet.falsifiers.length > 0 && packet.doesNotProve.length > 0);

  return {
    taskUsefulness,
    evidenceFidelity,
    temporalCorrectness,
    rejectionRecall,
    nonProofBoundaries,
    total:
      taskUsefulness +
      evidenceFidelity +
      temporalCorrectness +
      rejectionRecall +
      nonProofBoundaries
  };
};

export const classifyDecisionPacketForEval = (
  fixture: DecisionPacketEvalFixture,
  packet: DecisionPacketEvalCaseReadback["packet"],
  testCase: DecisionPacketCase,
  expectedDecision: DecisionPacketDecision | undefined
): PacketQualityLabel => {
  if (packet.severeStaleAuthorityIds.length > 0) {
    return "stale_authority";
  }

  if (!packet.governingDecisionIds.includes(testCase.expectedDecisionId)) {
    return "miss";
  }

  if (
    !hasDecisionBoundary(packet, expectedDecision) ||
    !hasSameIds(packet.staleDecisionIds, testCase.staleDecisionIds) ||
    !hasSameIds(packet.rejectedPathIds, testCase.rejectedDecisionIds) ||
    !hasSameIds(packet.sourceRejectionIds, expectedSourceRejectionIds(fixture, testCase)) ||
    packet.noiseDecisionIds.length > maximumAverageNoiseDecisions
  ) {
    return "noisy";
  }

  return "useful";
};

const noteDecisionIds = (
  notes: readonly DecisionPacketNote[]
): readonly string[] => notes.map((note) => note.decisionId);

const topNotesFor = (
  fixture: DecisionPacketEvalFixture,
  testCase: DecisionPacketCase
): readonly DecisionPacketNote[] =>
  [...fixture.notes]
    .map((note) => ({
      note,
      score: tokenOverlapScore(testCase.task, note.text)
    }))
    .sort((left, right) =>
      right.score - left.score ||
      left.note.decisionId.localeCompare(right.note.decisionId) ||
      left.note.id.localeCompare(right.note.id)
    )
    .slice(0, fixture.topK)
    .map((item) => item.note);

const evaluateNotesBaseline = (
  fixture: DecisionPacketEvalFixture,
  testCase: DecisionPacketCase
): NotesBaselineResult => {
  const topDecisionIds = noteDecisionIds(topNotesFor(fixture, testCase));
  const unsafeDecisionIds = topDecisionIds.filter((id) =>
    testCase.staleDecisionIds.includes(id) ||
    testCase.rejectedDecisionIds.includes(id)
  );

  if (unsafeDecisionIds.length > 0) {
    return {
      qualityLabel: "unsafe",
      topDecisionIds,
      unsafeDecisionIds,
      failureRationale: testCase.baselineFailureRationale
    };
  }

  return {
    qualityLabel: topDecisionIds.includes(testCase.expectedDecisionId) ? "usable" : "miss",
    topDecisionIds,
    unsafeDecisionIds,
    failureRationale: topDecisionIds.includes(testCase.expectedDecisionId)
      ? "Notes baseline retrieved the expected decision without stale or rejected top-k conflict for this fixture case."
      : testCase.baselineFailureRationale
  };
};

const evaluateCase = async (
  fixture: DecisionPacketEvalFixture,
  testCase: DecisionPacketCase
): Promise<DecisionPacketEvalCaseReadback> => {
  const packet = await buildDecisionPacketWithEngine(fixture, testCase);
  const expectedDecision = decisionById(fixture.decisions).get(testCase.expectedDecisionId);
  const qualityLabel = classifyDecisionPacketForEval(fixture, packet, testCase, expectedDecision);
  const scores = scoreDecisionPacket(fixture, packet, testCase, expectedDecision);
  const notesBaseline = evaluateNotesBaseline(fixture, testCase);
  const comparisonOutcome = comparePacketAgainstNotesBaseline(
    qualityLabel,
    notesBaseline.qualityLabel
  );

  return {
    id: testCase.id,
    task: testCase.task,
    expectedDecisionId: testCase.expectedDecisionId,
    expectedStaleDecisionIds: testCase.staleDecisionIds,
    expectedRejectedDecisionIds: testCase.rejectedDecisionIds,
    qualityLabel,
    scores,
    notesBaseline,
    comparisonOutcome,
    status: decisionPacketCaseStatus(qualityLabel),
    reasons: packetReasons(fixture, packet, testCase),
    packet
  };
};

const average = (
  values: readonly number[]
): number => values.length === 0
  ? 0
  : roundRankingMetric(values.reduce((sum, value) => sum + value, 0) / values.length);

const rate = (
  count: number,
  total: number
): number => total === 0 ? 0 : roundRankingMetric(count / total);

export const runDecisionPacketEval = async (
  fixture: DecisionPacketEvalFixture
): Promise<DecisionPacketEvalResult> => {
  const cases = await Promise.all(fixture.cases.map((testCase) => evaluateCase(fixture, testCase)));
  const usefulCount = cases.filter((testCase) => testCase.qualityLabel === "useful").length;
  const noisyCount = cases.filter((testCase) => testCase.qualityLabel === "noisy").length;
  const missCount = cases.filter((testCase) => testCase.qualityLabel === "miss").length;
  const staleAuthorityCount = cases.filter((testCase) =>
    testCase.qualityLabel === "stale_authority"
  ).length;
  const notesUsableCount = cases.filter((testCase) =>
    testCase.notesBaseline.qualityLabel === "usable"
  ).length;
  const notesUnsafeCount = cases.filter((testCase) =>
    testCase.notesBaseline.qualityLabel === "unsafe"
  ).length;
  const notesMissCount = cases.filter((testCase) =>
    testCase.notesBaseline.qualityLabel === "miss"
  ).length;
  const krnWinCount = cases.filter((testCase) =>
    testCase.comparisonOutcome === "krn_win"
  ).length;
  const notesWinCount = cases.filter((testCase) =>
    testCase.comparisonOutcome === "notes_win"
  ).length;
  const tieCount = cases.filter((testCase) =>
    testCase.comparisonOutcome === "tie"
  ).length;
  const decisiveComparisonCount = krnWinCount + notesWinCount;
  const usefulRate = rate(usefulCount, cases.length);
  const krnWinRate = rate(krnWinCount, decisiveComparisonCount);
  const notesWinRate = rate(notesWinCount, decisiveComparisonCount);
  const averageNoiseDecisions = average(cases.map((testCase) => testCase.packet.noiseDecisionIds.length));
  const severeStaleAuthorityInclusions = cases.reduce(
    (sum, testCase) => sum + testCase.packet.severeStaleAuthorityIds.length,
    0
  );
  const status =
    usefulRate >= minimumUsefulRate &&
    krnWinRate >= fixture.minimumKrnWinRate &&
    notesWinRate <= fixture.maximumNotesWinRate &&
    severeStaleAuthorityInclusions <= maximumSevereStaleAuthorityInclusions &&
    averageNoiseDecisions <= maximumAverageNoiseDecisions
      ? "pass"
      : "fail";

  return {
    kind: "krn.decisionPacket.eval.v1",
    fixtureVersion: fixture.version,
    status,
    thresholds: {
      minimumUsefulRate,
      minimumKrnWinRate: fixture.minimumKrnWinRate,
      maximumNotesWinRate: fixture.maximumNotesWinRate,
      maximumSevereStaleAuthorityInclusions,
      maximumAverageNoiseDecisions
    },
    metrics: {
      caseCount: cases.length,
      usefulCount,
      noisyCount,
      missCount,
      staleAuthorityCount,
      notesUsableCount,
      notesUnsafeCount,
      notesMissCount,
      krnWinCount,
      notesWinCount,
      tieCount,
      decisiveComparisonCount,
      usefulRate,
      krnWinRate,
      notesWinRate,
      averageNoiseDecisions,
      severeStaleAuthorityInclusions
    },
    cases,
    proof: {
      proves: [
        "deterministic pre-code task packets are built through retrieveActivationCandidates, applyActivationFilters, packet budgeting, assembleContext, and createExecutionBrief",
        "packets include governing decisions, SourceClaim refs, SourceDecisionEdge refs, SourceRejection refs, memory refs, falsifiers, and doesNotProve boundaries",
        "packet scoring reports stale-decision exclusions and rejected-path visibility from context exclusions before coding starts",
        "packet quality is gated by predeclared useful-rate, KRN-vs-notes win-rate, notes-win-rate, and zero severe stale-authority thresholds"
      ],
      doesNotProve: [
        "live Codex execution or obedience",
        "source truth",
        "operator willingness to pay",
        "broad arbitrary-repo packet quality",
        "production semantic retrieval quality",
        "real shell grep ranking; notes baseline uses deterministic lexical token overlap over the fixture notes",
        "that packet review burden is acceptable for every task",
        "that memory refs correspond to existing MemoryRecord rows"
      ]
    }
  };
};

if (isCliEntrypoint(import.meta.url)) {
  await writeJsonEvalResult(async () =>
    runDecisionPacketEval(loadDecisionPacketEvalFixture(process.argv[2] ?? ""))
  );
}
