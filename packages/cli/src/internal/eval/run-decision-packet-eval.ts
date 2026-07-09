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
  DecisionPacketEvalCandidateReadback,
  DecisionPacketEvalResult,
  DecisionPacketScoreBreakdown,
  DecisionPacketEvalFailureClass,
  NotesBaselineResult,
  PacketQualityLabel
} from "./decision-packet-eval-shape.js";
import {
  comparePacketAgainstNotesBaseline,
  decisionPacketCaseStatus,
  decisionPacketEvalKind,
  decisionPacketEvalScorerModel
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
const maximumCaveatedSourceClaimInclusions = 0;
const maximumMissingAbstentions = 0;
const minimumAbstentionScore = 1;
const minimumAverageConsensusConflictScore = 1;
const maximumAverageNoiseDecisions = 2;
const evalCandidateCreatedAt = "2026-07-08T00:00:00.000Z";
const evalCandidateDoesNotProve =
  "DecisionPacket eval candidates identify reviewable deterministic failures; they do not prove source truth, live Codex behavior, production retrieval quality, or that the proposed fix is correct.";
const missingBriefPropagationReason =
  "packet-selected guidance is missing from Codex-facing brief";

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

const hasExpectedEvidenceGap = (
  packet: DecisionPacketEvalCaseReadback["packet"],
  testCase: DecisionPacketCase
): boolean => {
  const expected = testCase.expectedEvidenceGap;

  return expected !== undefined &&
    packet.evidenceGaps.some((gap) =>
      gap.id === expected.id &&
      gap.reason === expected.reason &&
      gap.verificationRequired === expected.verificationRequired
    );
};

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

const sourceClaimIdsForDecisionIds = (
  fixture: DecisionPacketEvalFixture,
  decisionIds: readonly string[]
): readonly string[] => {
  const expected = new Set(decisionIds);

  return fixture.decisions
    .filter((decision) => expected.has(decision.id))
    .map((decision) => decision.sourceClaimId)
    .filter(nonEmpty);
};

const hasAllIds = (
  actual: readonly string[],
  expected: readonly string[]
): boolean => {
  const actualIds = new Set(actual);

  return expected.every((id) => actualIds.has(id));
};

const hasBriefPropagation = (
  fixture: DecisionPacketEvalFixture,
  packet: DecisionPacketEvalCaseReadback["packet"],
  testCase: DecisionPacketCase,
  expectedDecision: DecisionPacketDecision | undefined
): boolean => {
  if (testCase.expectedEvidenceGap !== undefined) {
    return packet.governingDecisionIds.length === 0 &&
      packet.brief.evidenceGapIds.includes(testCase.expectedEvidenceGap.id);
  }

  if (
    testCase.expectedDecisionId === undefined ||
    expectedDecision === undefined
  ) {
    return false;
  }

  const expectedExcludedSourceClaimIds = sourceClaimIdsForDecisionIds(fixture, [
    ...testCase.staleDecisionIds,
    ...testCase.rejectedDecisionIds
  ]);
  const expectedMemoryRef = `memory:decision:${testCase.expectedDecisionId}`;
  const memoryRefIsSelected = packet.memoryRefs.includes(expectedMemoryRef);

  return packet.brief.includedSourceClaimIds.includes(expectedDecision.sourceClaimId) &&
    (!memoryRefIsSelected || packet.brief.includedMemoryRecordIds.includes(expectedMemoryRef)) &&
    hasAllIds(packet.brief.excludedSourceClaimIds, expectedExcludedSourceClaimIds);
};

const reasonFor = (
  condition: boolean,
  passed: string,
  failed: string
): string => condition ? passed : failed;

const packetReasons = (
  fixture: DecisionPacketEvalFixture,
  packet: DecisionPacketEvalCaseReadback["packet"],
  testCase: DecisionPacketCase,
  expectedDecision: DecisionPacketDecision | undefined
): readonly string[] => [
  ...(testCase.expectedDecisionId === undefined
    ? [
        reasonFor(
          packet.governingDecisionIds.length === 0,
          "packet abstains from governing advice for unsupported task",
          "packet gives governing advice for unsupported task"
        ),
        reasonFor(
          hasExpectedEvidenceGap(packet, testCase),
          "packet includes expected evidence-gap abstention",
          "packet misses expected evidence-gap abstention"
        )
      ]
    : [
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
          hasBriefPropagation(fixture, packet, testCase, expectedDecision),
          "packet-selected guidance reaches Codex-facing brief",
          missingBriefPropagationReason
        )
      ]),
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
    packet.caveatedSourceClaimIds.length === 0,
    "packet has no caveated source-claim authority",
    "packet includes caveated source claims without decision support"
  ),
  reasonFor(
    packet.noiseDecisionIds.length <= maximumAverageNoiseDecisions,
    "packet noise is within budget",
    "packet is too noisy for pre-code use"
  )
];

const score = (condition: boolean): number => condition ? 1 : 0;

const expectsAbstention = (
  testCase: DecisionPacketCase
): boolean => testCase.expectedEvidenceGap !== undefined;

const scoreTaskUsefulness = (
  packet: DecisionPacketEvalCaseReadback["packet"],
  testCase: DecisionPacketCase,
  hasEvidenceGap: boolean
): number => expectsAbstention(testCase)
  ? score(packet.governingDecisionIds.length === 0 && hasEvidenceGap)
  : score(
      testCase.expectedDecisionId !== undefined &&
      packet.governingDecisionIds.includes(testCase.expectedDecisionId) &&
      packet.noiseDecisionIds.length <= maximumAverageNoiseDecisions
    );

const scoreEvidenceFidelity = (
  packet: DecisionPacketEvalCaseReadback["packet"],
  testCase: DecisionPacketCase,
  expectedDecision: DecisionPacketDecision | undefined,
  hasEvidenceGap: boolean
): number => expectsAbstention(testCase)
  ? score(hasEvidenceGap)
  : score(hasDecisionBoundary(packet, expectedDecision));

const scoreAbstention = (
  packet: DecisionPacketEvalCaseReadback["packet"],
  testCase: DecisionPacketCase,
  hasEvidenceGap: boolean
): number => expectsAbstention(testCase)
  ? score(packet.governingDecisionIds.length === 0 && hasEvidenceGap)
  : score(packet.evidenceGaps.length === 0);

const scoreConsensusConflict = (
  fixture: DecisionPacketEvalFixture,
  packet: DecisionPacketEvalCaseReadback["packet"],
  testCase: DecisionPacketCase
): number => score(
  (expectsAbstention(testCase) ? packet.governingDecisionIds.length === 0 : true) &&
  packet.severeStaleAuthorityIds.length === 0 &&
  packet.caveatedSourceClaimIds.length === 0 &&
  hasSameIds(packet.staleDecisionIds, testCase.staleDecisionIds) &&
  hasSameIds(packet.rejectedPathIds, testCase.rejectedDecisionIds) &&
  hasSameIds(packet.sourceRejectionIds, expectedSourceRejectionIds(fixture, testCase))
);

const scoreNonProofBoundaries = (
  packet: DecisionPacketEvalCaseReadback["packet"],
  testCase: DecisionPacketCase
): number => expectsAbstention(testCase)
  ? score(packet.nonProofs.length > 0)
  : score(packet.falsifiers.length > 0 && packet.doesNotProve.length > 0);

const scoreDecisionPacket = (
  fixture: DecisionPacketEvalFixture,
  packet: DecisionPacketEvalCaseReadback["packet"],
  testCase: DecisionPacketCase,
  expectedDecision: DecisionPacketDecision | undefined
): DecisionPacketScoreBreakdown => {
  const hasEvidenceGap = hasExpectedEvidenceGap(packet, testCase);
  const taskUsefulness = scoreTaskUsefulness(packet, testCase, hasEvidenceGap);
  const evidenceFidelity = scoreEvidenceFidelity(
    packet,
    testCase,
    expectedDecision,
    hasEvidenceGap
  );
  const temporalCorrectness = score(
    hasSameIds(packet.staleDecisionIds, testCase.staleDecisionIds) &&
    packet.severeStaleAuthorityIds.length === 0
  );
  const sourceSupport = score(packet.caveatedSourceClaimIds.length === 0);
  const rejectionRecall = score(
    hasSameIds(packet.rejectedPathIds, testCase.rejectedDecisionIds) &&
    hasSameIds(packet.sourceRejectionIds, expectedSourceRejectionIds(fixture, testCase))
  );
  const abstention = scoreAbstention(packet, testCase, hasEvidenceGap);
  const consensusConflict = scoreConsensusConflict(fixture, packet, testCase);
  const nonProofBoundaries = scoreNonProofBoundaries(packet, testCase);

  return {
    taskUsefulness,
    evidenceFidelity,
    temporalCorrectness,
    sourceSupport,
    rejectionRecall,
    abstention,
    consensusConflict,
    nonProofBoundaries,
    total:
      taskUsefulness +
      evidenceFidelity +
      temporalCorrectness +
      sourceSupport +
      rejectionRecall +
      abstention +
      consensusConflict +
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

  if (testCase.expectedEvidenceGap !== undefined) {
    if (packet.governingDecisionIds.length > 0) {
      return "noisy";
    }

    return hasExpectedEvidenceGap(packet, testCase) ? "abstained" : "miss";
  }

  if (testCase.expectedDecisionId === undefined) {
    return "miss";
  }

  if (!packet.governingDecisionIds.includes(testCase.expectedDecisionId)) {
    return "miss";
  }

  if (
    !hasDecisionBoundary(packet, expectedDecision) ||
    !hasBriefPropagation(fixture, packet, testCase, expectedDecision) ||
    !hasSameIds(packet.staleDecisionIds, testCase.staleDecisionIds) ||
    packet.caveatedSourceClaimIds.length > maximumCaveatedSourceClaimInclusions ||
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
  const unsupportedDecisionIds = testCase.expectedEvidenceGap === undefined
    ? []
    : topDecisionIds;

  if (unsupportedDecisionIds.length > 0) {
    return {
      qualityLabel: "unsupported",
      topDecisionIds,
      unsafeDecisionIds: [],
      unsupportedDecisionIds,
      failureRationale: testCase.baselineFailureRationale
    };
  }

  const unsafeDecisionIds = topDecisionIds.filter((id) =>
    testCase.staleDecisionIds.includes(id) ||
    testCase.rejectedDecisionIds.includes(id)
  );

  if (unsafeDecisionIds.length > 0) {
    return {
      qualityLabel: "unsafe",
      topDecisionIds,
      unsafeDecisionIds,
      unsupportedDecisionIds,
      failureRationale: testCase.baselineFailureRationale
    };
  }

  return {
    qualityLabel: testCase.expectedDecisionId !== undefined &&
      topDecisionIds.includes(testCase.expectedDecisionId) ? "usable" : "miss",
    topDecisionIds,
    unsafeDecisionIds,
    unsupportedDecisionIds,
    failureRationale: testCase.expectedDecisionId !== undefined &&
      topDecisionIds.includes(testCase.expectedDecisionId)
      ? "Notes baseline retrieved the expected decision without stale or rejected top-k conflict for this fixture case."
      : testCase.baselineFailureRationale
  };
};

const evaluateCase = async (
  fixture: DecisionPacketEvalFixture,
  testCase: DecisionPacketCase
): Promise<DecisionPacketEvalCaseReadback> => {
  const packet = await buildDecisionPacketWithEngine(fixture, testCase);
  const expectedDecision = testCase.expectedDecisionId === undefined
    ? undefined
    : decisionById(fixture.decisions).get(testCase.expectedDecisionId);
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
    ...(testCase.expectedDecisionId === undefined
      ? {}
      : { expectedDecisionId: testCase.expectedDecisionId }),
    ...(testCase.expectedEvidenceGap === undefined
      ? {}
      : { expectedEvidenceGap: testCase.expectedEvidenceGap }),
    expectedStaleDecisionIds: testCase.staleDecisionIds,
    expectedRejectedDecisionIds: testCase.rejectedDecisionIds,
    qualityLabel,
    scores,
    notesBaseline,
    comparisonOutcome,
    status: decisionPacketCaseStatus(qualityLabel),
    reasons: packetReasons(fixture, packet, testCase, expectedDecision),
    packet
  };
};

interface DecisionPacketFailureRule {
  readonly failureClass: DecisionPacketEvalFailureClass;
  readonly matches: (testCase: DecisionPacketEvalCaseReadback) => boolean;
}

const failureClassRules: readonly DecisionPacketFailureRule[] = [
  {
    failureClass: "stale_authority",
    matches: (testCase) => testCase.qualityLabel === "stale_authority"
  },
  {
    failureClass: "missing_abstention",
    matches: (testCase) =>
      testCase.expectedEvidenceGap !== undefined && testCase.qualityLabel !== "abstained"
  },
  {
    failureClass: "missing_evidence_fidelity",
    matches: (testCase) => testCase.scores.evidenceFidelity === 0
  },
  {
    failureClass: "missing_source_support",
    matches: (testCase) => testCase.scores.sourceSupport === 0
  },
  {
    failureClass: "missing_rejected_path",
    matches: (testCase) => testCase.scores.rejectionRecall === 0
  },
  {
    failureClass: "missing_brief_propagation",
    matches: (testCase) => testCase.reasons.includes(missingBriefPropagationReason)
  },
  {
    failureClass: "missed_packet",
    matches: (testCase) => testCase.qualityLabel === "miss"
  }
];

const failureClassForCase = (
  testCase: DecisionPacketEvalCaseReadback
): DecisionPacketEvalFailureClass | undefined => {
  if (testCase.status === "pass") {
    return undefined;
  }

  return failureClassRules.find((rule) => rule.matches(testCase))?.failureClass ?? "noisy_packet";
};

const evalCandidateId = (
  caseId: string,
  failureClass: DecisionPacketEvalFailureClass
): string => `eval-candidate:decision-packet:${caseId}:${failureClass}`;

const caseEvidenceRefs = (
  fixture: DecisionPacketEvalFixture,
  testCase: DecisionPacketEvalCaseReadback,
  failureClass: DecisionPacketEvalFailureClass
): readonly string[] => [
  `fixture:decision-packet:${fixture.version}:case:${testCase.id}`,
  `eval:${decisionPacketEvalKind}:case:${testCase.id}`,
  `failure:${failureClass}`,
  ...(testCase.expectedDecisionId === undefined
    ? []
    : [`expectedDecision:${testCase.expectedDecisionId}`]),
  ...(testCase.expectedEvidenceGap === undefined
    ? []
    : [`expectedEvidenceGap:${testCase.expectedEvidenceGap.id}`])
];

const buildCaseEvalCandidate = (
  fixture: DecisionPacketEvalFixture,
  testCase: DecisionPacketEvalCaseReadback
): DecisionPacketEvalCandidateReadback | undefined => {
  const failureClass = failureClassForCase(testCase);

  if (failureClass === undefined) {
    return undefined;
  }

  const evidenceRefs = caseEvidenceRefs(fixture, testCase, failureClass);

  return {
    id: evalCandidateId(testCase.id, failureClass),
    status: "candidate",
    caseId: testCase.id,
    failureClass,
    title: `DecisionPacket eval failure: ${testCase.id}`,
    scenario: testCase.task,
    expectedSignal:
      `Fix ${failureClass} so DecisionPacket eval case ${testCase.id} returns passing governed guidance or an explicit abstention.`,
    sourceEvidence: [...evidenceRefs],
    evidenceRefs,
    metadata: {
      kind: decisionPacketEvalKind,
      scorerModel: decisionPacketEvalScorerModel,
      fixtureVersion: fixture.version,
      caseId: testCase.id,
      failureClass,
      qualityLabel: testCase.qualityLabel,
      comparisonOutcome: testCase.comparisonOutcome,
      scores: testCase.scores,
      reasons: testCase.reasons,
      expectedDecisionId: testCase.expectedDecisionId ?? null,
      expectedEvidenceGapId: testCase.expectedEvidenceGap?.id ?? null,
      packetSignalIds: {
        governingDecisionIds: testCase.packet.governingDecisionIds,
        staleDecisionIds: testCase.packet.staleDecisionIds,
        rejectedPathIds: testCase.packet.rejectedPathIds,
        caveatedSourceClaimIds: testCase.packet.caveatedSourceClaimIds,
        severeStaleAuthorityIds: testCase.packet.severeStaleAuthorityIds,
        briefIncludedSourceClaimIds: testCase.packet.brief.includedSourceClaimIds,
        briefIncludedMemoryRecordIds: testCase.packet.brief.includedMemoryRecordIds,
        briefExcludedSourceClaimIds: testCase.packet.brief.excludedSourceClaimIds,
        evidenceGapIds: testCase.packet.evidenceGaps.map((gap) => gap.id)
      },
      doesNotProve: evalCandidateDoesNotProve
    },
    createdAt: evalCandidateCreatedAt,
    doesNotProve: evalCandidateDoesNotProve
  };
};

interface DecisionPacketEvalMetricsForCandidates {
  readonly usefulRate: number;
  readonly krnWinRate: number;
  readonly notesWinRate: number;
  readonly severeStaleAuthorityInclusions: number;
  readonly caveatedSourceClaimInclusions: number;
  readonly missingAbstentions: number;
  readonly abstentionScore: number;
  readonly abstentionCaseCount: number;
  readonly averageConsensusConflictScore: number;
  readonly averageNoiseDecisions: number;
}

interface DecisionPacketEvalThresholdCheck {
  readonly id: string;
  readonly passed: (
    fixture: DecisionPacketEvalFixture,
    metrics: DecisionPacketEvalMetricsForCandidates
  ) => boolean;
}

const evalThresholdChecks: readonly DecisionPacketEvalThresholdCheck[] = [
  {
    id: "minimumUsefulRate",
    passed: (_fixture, metrics) => metrics.usefulRate >= minimumUsefulRate
  },
  {
    id: "minimumKrnWinRate",
    passed: (fixture, metrics) => metrics.krnWinRate >= fixture.minimumKrnWinRate
  },
  {
    id: "maximumNotesWinRate",
    passed: (fixture, metrics) => metrics.notesWinRate <= fixture.maximumNotesWinRate
  },
  {
    id: "maximumSevereStaleAuthorityInclusions",
    passed: (_fixture, metrics) =>
      metrics.severeStaleAuthorityInclusions <= maximumSevereStaleAuthorityInclusions
  },
  {
    id: "maximumCaveatedSourceClaimInclusions",
    passed: (_fixture, metrics) =>
      metrics.caveatedSourceClaimInclusions <= maximumCaveatedSourceClaimInclusions
  },
  {
    id: "maximumMissingAbstentions",
    passed: (_fixture, metrics) => metrics.missingAbstentions <= maximumMissingAbstentions
  },
  {
    id: "minimumAbstentionScore",
    passed: (_fixture, metrics) => metrics.abstentionScore >= minimumAbstentionScore
  },
  {
    id: "minimumAbstentionCaseCount",
    passed: (fixture, metrics) =>
      metrics.abstentionCaseCount >= fixture.minimumAbstentionCaseCount
  },
  {
    id: "minimumAverageConsensusConflictScore",
    passed: (_fixture, metrics) =>
      metrics.averageConsensusConflictScore >= minimumAverageConsensusConflictScore
  },
  {
    id: "maximumAverageNoiseDecisions",
    passed: (_fixture, metrics) => metrics.averageNoiseDecisions <= maximumAverageNoiseDecisions
  }
];

const thresholdViolations = (
  fixture: DecisionPacketEvalFixture,
  metrics: DecisionPacketEvalMetricsForCandidates
): readonly string[] =>
  evalThresholdChecks
    .filter((check) => !check.passed(fixture, metrics))
    .map((check) => check.id);

const buildThresholdEvalCandidate = (
  fixture: DecisionPacketEvalFixture,
  violations: readonly string[],
  metrics: DecisionPacketEvalMetricsForCandidates
): DecisionPacketEvalCandidateReadback | undefined => {
  if (violations.length === 0) {
    return undefined;
  }

  const caseId = "decision-packet-eval-suite";
  const failureClass = "threshold_violation";
  const evidenceRefs = [
    `fixture:decision-packet:${fixture.version}:suite`,
    `eval:${decisionPacketEvalKind}:thresholds`,
    ...violations.map((violation) => `threshold:${violation}`)
  ];

  return {
    id: evalCandidateId(caseId, failureClass),
    status: "candidate",
    caseId,
    failureClass,
    title: "DecisionPacket eval threshold violation",
    scenario:
      "DecisionPacket eval suite thresholds failed even though individual cases may not have produced a case-level failure.",
    expectedSignal:
      `Restore DecisionPacket eval thresholds: ${violations.join(", ")}.`,
    sourceEvidence: [...evidenceRefs],
    evidenceRefs,
    metadata: {
      kind: decisionPacketEvalKind,
      scorerModel: decisionPacketEvalScorerModel,
      fixtureVersion: fixture.version,
      caseId,
      failureClass,
      thresholdViolations: violations,
      metrics,
      doesNotProve: evalCandidateDoesNotProve
    },
    createdAt: evalCandidateCreatedAt,
    doesNotProve: evalCandidateDoesNotProve
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
  const abstainedCount = cases.filter((testCase) => testCase.qualityLabel === "abstained").length;
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
  const notesUnsupportedCount = cases.filter((testCase) =>
    testCase.notesBaseline.qualityLabel === "unsupported"
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
  const abstentionCaseCount = cases.filter((testCase) =>
    testCase.expectedEvidenceGap !== undefined
  ).length;
  const correctAbstentionCount = cases.filter((testCase) =>
    testCase.expectedEvidenceGap !== undefined && testCase.qualityLabel === "abstained"
  ).length;
  const usefulRate = rate(usefulCount, cases.length);
  const krnWinRate = rate(krnWinCount, decisiveComparisonCount);
  const notesWinRate = rate(notesWinCount, decisiveComparisonCount);
  const abstentionScore = abstentionCaseCount === 0
    ? 1
    : rate(correctAbstentionCount, abstentionCaseCount);
  const averageConsensusConflictScore = average(cases.map((testCase) =>
    testCase.scores.consensusConflict
  ));
  const averageNoiseDecisions = average(cases.map((testCase) => testCase.packet.noiseDecisionIds.length));
  const severeStaleAuthorityInclusions = cases.reduce(
    (sum, testCase) => sum + testCase.packet.severeStaleAuthorityIds.length,
    0
  );
  const caveatedSourceClaimInclusions = cases.reduce(
    (sum, testCase) => sum + testCase.packet.caveatedSourceClaimIds.length,
    0
  );
  const missingAbstentions = cases.filter((testCase) =>
    testCase.expectedEvidenceGap !== undefined && testCase.qualityLabel !== "abstained"
  ).length;
  const metricsForCandidates = {
    usefulRate,
    krnWinRate,
    notesWinRate,
    severeStaleAuthorityInclusions,
    caveatedSourceClaimInclusions,
    missingAbstentions,
    abstentionScore,
    abstentionCaseCount,
    averageConsensusConflictScore,
    averageNoiseDecisions
  };
  const caseEvalCandidates = cases.flatMap((testCase) => {
    const candidate = buildCaseEvalCandidate(fixture, testCase);

    return candidate === undefined ? [] : [candidate];
  });
  const thresholdEvalCandidate = buildThresholdEvalCandidate(
    fixture,
    thresholdViolations(fixture, metricsForCandidates),
    metricsForCandidates
  );
  const evalCandidates = [
    ...caseEvalCandidates,
    ...(thresholdEvalCandidate === undefined ? [] : [thresholdEvalCandidate])
  ];
  const status =
    usefulRate >= minimumUsefulRate &&
    krnWinRate >= fixture.minimumKrnWinRate &&
    notesWinRate <= fixture.maximumNotesWinRate &&
    severeStaleAuthorityInclusions <= maximumSevereStaleAuthorityInclusions &&
    caveatedSourceClaimInclusions <= maximumCaveatedSourceClaimInclusions &&
    missingAbstentions <= maximumMissingAbstentions &&
    abstentionScore >= minimumAbstentionScore &&
    abstentionCaseCount >= fixture.minimumAbstentionCaseCount &&
    averageConsensusConflictScore >= minimumAverageConsensusConflictScore &&
    averageNoiseDecisions <= maximumAverageNoiseDecisions
      ? "pass"
      : "fail";

  return {
    kind: decisionPacketEvalKind,
    scorerModel: decisionPacketEvalScorerModel,
    fixtureVersion: fixture.version,
    status,
    thresholds: {
      minimumUsefulRate,
      minimumKrnWinRate: fixture.minimumKrnWinRate,
      maximumNotesWinRate: fixture.maximumNotesWinRate,
      maximumSevereStaleAuthorityInclusions,
      maximumCaveatedSourceClaimInclusions,
      maximumMissingAbstentions,
      minimumAbstentionScore,
      minimumAbstentionCaseCount: fixture.minimumAbstentionCaseCount,
      minimumAverageConsensusConflictScore,
      maximumAverageNoiseDecisions
    },
    metrics: {
      caseCount: cases.length,
      usefulCount,
      noisyCount,
      abstainedCount,
      missCount,
      staleAuthorityCount,
      notesUsableCount,
      notesUnsafeCount,
      notesUnsupportedCount,
      notesMissCount,
      krnWinCount,
      notesWinCount,
      tieCount,
      decisiveComparisonCount,
      abstentionCaseCount,
      correctAbstentionCount,
      usefulRate,
      krnWinRate,
      notesWinRate,
      abstentionScore,
      averageConsensusConflictScore,
      averageNoiseDecisions,
      severeStaleAuthorityInclusions,
      caveatedSourceClaimInclusions,
      missingAbstentions
    },
    cases,
    evalCandidates,
    proof: {
      proves: [
        "DecisionPacketEvalCase.v1 is the canonical case/scorer model for deterministic DecisionPacket eval wrappers",
        "deterministic pre-code task packets are built through retrieveActivationCandidates, applyActivationFilters, packet budgeting, assembleContext, and createExecutionBrief",
        "packets include governing decisions, SourceClaim refs, SourceDecisionEdge refs, SourceRejection refs, memory refs, falsifiers, and doesNotProve boundaries",
        "normal coding task packets expose taskStandardDecisions and verificationCommands before Codex starts implementation",
        "packet scoring reports stale-decision exclusions and rejected-path visibility from context exclusions before coding starts",
        "packet scoring reports whether selected governing source and memory signals reached the Codex-facing brief summary",
        "packet scoring reports explicit evidence-gap abstention when no governed decision should guide Codex",
        "packet scoring reports consensus/conflict as a separate axis over stale, rejected, caveated, and unsupported governing context",
        "abstentionScore is a top-level scorer gate for unsupported cases before broad MCP transport can rely on DecisionPacket guidance",
        "packet quality is gated by predeclared useful-rate, KRN-vs-notes win-rate, notes-win-rate, zero severe stale-authority, zero caveated source-claim, zero missing-abstention, minimum abstention case count, minimum abstention-score, minimum consensus/conflict score, and noise thresholds"
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
