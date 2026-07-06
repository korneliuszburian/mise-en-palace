import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./evalMain.js";
import {
  roundRankingMetric
} from "./rankingEvalMetrics.js";
import {
  rankDecisionRows
} from "./decisionPacketScoring.js";
import type {
  NotesBaselineEvalFixture
} from "./runNotesBaselineEval.js";
import {
  loadNotesBaselineEvalFixture
} from "./runNotesBaselineEval.js";

type PacketQualityLabel = "useful" | "noisy" | "stale_authority" | "miss";
type DecisionPacketStatus = "pass" | "fail";

type DecisionPacketDecision = NotesBaselineEvalFixture["decisions"][number];
type DecisionPacketCase = NotesBaselineEvalFixture["cases"][number];

interface DecisionPacketReadback {
  readonly governingDecisionIds: readonly string[];
  readonly sourceClaimIds: readonly string[];
  readonly sourceDecisionEdgeIds: readonly string[];
  readonly memoryRefs: readonly string[];
  readonly staleDecisionIds: readonly string[];
  readonly rejectedPathIds: readonly string[];
  readonly falsifiers: readonly string[];
  readonly doesNotProve: readonly string[];
  readonly nonProofs: readonly string[];
  readonly noiseDecisionIds: readonly string[];
  readonly severeStaleAuthorityIds: readonly string[];
}

interface DecisionPacketCaseResult {
  readonly id: string;
  readonly task: string;
  readonly expectedDecisionId: string;
  readonly expectedStaleDecisionIds: readonly string[];
  readonly expectedRejectedDecisionIds: readonly string[];
  readonly qualityLabel: PacketQualityLabel;
  readonly status: DecisionPacketStatus;
  readonly reasons: readonly string[];
  readonly packet: DecisionPacketReadback;
}

export interface DecisionPacketEvalResult {
  readonly kind: "krn.decisionPacket.eval.v1";
  readonly fixtureVersion: "1";
  readonly status: DecisionPacketStatus;
  readonly thresholds: {
    readonly minimumUsefulRate: number;
    readonly maximumSevereStaleAuthorityInclusions: number;
    readonly maximumAverageNoiseDecisions: number;
  };
  readonly metrics: {
    readonly caseCount: number;
    readonly usefulCount: number;
    readonly noisyCount: number;
    readonly missCount: number;
    readonly staleAuthorityCount: number;
    readonly usefulRate: number;
    readonly averageNoiseDecisions: number;
    readonly severeStaleAuthorityInclusions: number;
  };
  readonly cases: readonly DecisionPacketCaseResult[];
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

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

const buildPacket = (
  fixture: NotesBaselineEvalFixture,
  testCase: DecisionPacketCase
): DecisionPacketReadback => {
  const decisionsById = decisionById(fixture.decisions);
  const topRanked = rankDecisionRows(fixture.decisions, testCase.task)
    .slice(0, fixture.topK);
  const governingDecisionIds = topRanked
    .filter((decision) => decision.status === "current")
    .map((decision) => decision.id);
  const governingDecisions = governingDecisionIds
    .map((id) => decisionsById.get(id))
    .filter((decision): decision is DecisionPacketDecision => decision !== undefined);
  const staleDecisionIds = testCase.staleDecisionIds.filter((id) =>
    decisionsById.get(id)?.status === "stale" &&
    !governingDecisionIds.includes(id)
  );
  const rejectedPathIds = testCase.rejectedDecisionIds.filter((id) => {
    const decision = decisionsById.get(id);

    return decision?.status === "rejected" && nonEmpty(decision.sourceRejectionId);
  });
  const severeStaleAuthorityIds = topRanked
    .filter((decision) => decision.status === "stale" || decision.status === "rejected")
    .map((decision) => decision.id);

  return {
    governingDecisionIds,
    sourceClaimIds: governingDecisions.map((decision) => decision.sourceClaimId),
    sourceDecisionEdgeIds: governingDecisions.flatMap((decision) =>
      nonEmpty(decision.sourceDecisionEdgeId) ? [decision.sourceDecisionEdgeId] : []
    ),
    memoryRefs: governingDecisionIds.map((id) => `memory:decision:${id}`),
    staleDecisionIds,
    rejectedPathIds,
    falsifiers: governingDecisions.map((decision) => decision.falsifier).filter(nonEmpty),
    doesNotProve: governingDecisions.map((decision) => decision.doesNotProve).filter(nonEmpty),
    nonProofs: [
      "packet quality only",
      "does not prove live Codex obedience",
      "does not prove source truth"
    ],
    noiseDecisionIds: governingDecisionIds.filter((id) => id !== testCase.expectedDecisionId),
    severeStaleAuthorityIds
  };
};

const hasDecisionBoundary = (
  packet: DecisionPacketReadback,
  expectedDecision: DecisionPacketDecision | undefined
): boolean =>
  expectedDecision !== undefined &&
  packet.governingDecisionIds.includes(expectedDecision.id) &&
  nonEmpty(expectedDecision.sourceClaimId) &&
  nonEmpty(expectedDecision.sourceDecisionEdgeId) &&
  nonEmpty(expectedDecision.falsifier) &&
  nonEmpty(expectedDecision.doesNotProve) &&
  packet.nonProofs.length > 0;

const packetReasons = (
  packet: DecisionPacketReadback,
  testCase: DecisionPacketCase
): readonly string[] => [
  ...(packet.governingDecisionIds.includes(testCase.expectedDecisionId)
    ? ["packet includes expected governing decision"]
    : ["packet misses expected governing decision"]),
  ...(packet.sourceDecisionEdgeIds.length > 0
    ? ["packet includes SourceDecisionEdge refs"]
    : ["packet is missing SourceDecisionEdge refs"]),
  ...(packet.falsifiers.length > 0 && packet.doesNotProve.length > 0
    ? ["packet includes falsifier and doesNotProve boundaries"]
    : ["packet is missing falsifier or doesNotProve boundaries"]),
  ...(testCase.staleDecisionIds.length === packet.staleDecisionIds.length
    ? ["packet excludes expected stale decisions with readback"]
    : ["packet misses stale-decision exclusion readback"]),
  ...(testCase.rejectedDecisionIds.length === packet.rejectedPathIds.length
    ? ["packet includes expected rejected-path readback"]
    : ["packet misses rejected-path readback"]),
  ...(packet.severeStaleAuthorityIds.length === 0
    ? ["packet has no severe stale-authority inclusions"]
    : ["packet includes stale or rejected authority as governing context"]),
  ...(packet.noiseDecisionIds.length <= maximumAverageNoiseDecisions
    ? ["packet noise is within budget"]
    : ["packet is too noisy for pre-code use"])
];

const classifyPacket = (
  packet: DecisionPacketReadback,
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
    testCase.staleDecisionIds.length !== packet.staleDecisionIds.length ||
    testCase.rejectedDecisionIds.length !== packet.rejectedPathIds.length ||
    packet.noiseDecisionIds.length > maximumAverageNoiseDecisions
  ) {
    return "noisy";
  }

  return "useful";
};

const evaluateCase = (
  fixture: NotesBaselineEvalFixture,
  testCase: DecisionPacketCase
): DecisionPacketCaseResult => {
  const packet = buildPacket(fixture, testCase);
  const expectedDecision = decisionById(fixture.decisions).get(testCase.expectedDecisionId);
  const qualityLabel = classifyPacket(packet, testCase, expectedDecision);

  return {
    id: testCase.id,
    task: testCase.task,
    expectedDecisionId: testCase.expectedDecisionId,
    expectedStaleDecisionIds: testCase.staleDecisionIds,
    expectedRejectedDecisionIds: testCase.rejectedDecisionIds,
    qualityLabel,
    status: qualityLabel === "useful" ? "pass" : "fail",
    reasons: packetReasons(packet, testCase),
    packet
  };
};

const average = (
  values: readonly number[]
): number => values.length === 0
  ? 0
  : roundRankingMetric(values.reduce((sum, value) => sum + value, 0) / values.length);

export const runDecisionPacketEval = (
  fixture: NotesBaselineEvalFixture
): DecisionPacketEvalResult => {
  const cases = fixture.cases.map((testCase) => evaluateCase(fixture, testCase));
  const usefulCount = cases.filter((testCase) => testCase.qualityLabel === "useful").length;
  const noisyCount = cases.filter((testCase) => testCase.qualityLabel === "noisy").length;
  const missCount = cases.filter((testCase) => testCase.qualityLabel === "miss").length;
  const staleAuthorityCount = cases.filter((testCase) =>
    testCase.qualityLabel === "stale_authority"
  ).length;
  const usefulRate = roundRankingMetric(usefulCount / cases.length);
  const averageNoiseDecisions = average(cases.map((testCase) => testCase.packet.noiseDecisionIds.length));
  const severeStaleAuthorityInclusions = cases.reduce(
    (sum, testCase) => sum + testCase.packet.severeStaleAuthorityIds.length,
    0
  );
  const status =
    usefulRate >= minimumUsefulRate &&
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
      maximumSevereStaleAuthorityInclusions,
      maximumAverageNoiseDecisions
    },
    metrics: {
      caseCount: cases.length,
      usefulCount,
      noisyCount,
      missCount,
      staleAuthorityCount,
      usefulRate,
      averageNoiseDecisions,
      severeStaleAuthorityInclusions
    },
    cases,
    proof: {
      proves: [
        "deterministic pre-code task packets include governing decisions, SourceClaim refs, SourceDecisionEdge refs, memory refs, falsifiers, and doesNotProve boundaries",
        "packet scoring reports stale-decision exclusions and rejected-path visibility before coding starts",
        "packet quality is gated by a predeclared useful-rate threshold and zero severe stale-authority inclusions"
      ],
      doesNotProve: [
        "live Codex execution or obedience",
        "source truth",
        "operator willingness to pay",
        "broad arbitrary-repo packet quality",
        "production semantic retrieval quality",
        "that packet review burden is acceptable for every task",
        "that memory refs correspond to existing MemoryRecord rows"
      ]
    }
  };
};

if (isCliEntrypoint(import.meta.url)) {
  await writeJsonEvalResult(async () =>
    runDecisionPacketEval(loadNotesBaselineEvalFixture(process.argv[2] ?? ""))
  );
}
