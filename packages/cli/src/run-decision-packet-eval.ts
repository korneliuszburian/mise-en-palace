import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./eval-main.js";
import {
  roundRankingMetric
} from "./ranking-eval-metrics.js";
import {
  buildDecisionPacketWithEngine,
  type EngineDecisionPacket
} from "./decision-packet-engine.js";
import type {
  DecisionPacketRow,
  DecisionPacketCase,
  DecisionPacketEvalFixture
} from "./decision-packet-fixture.js";
import {
  loadDecisionPacketEvalFixture
} from "./decision-packet-fixture.js";

type PacketQualityLabel = "useful" | "noisy" | "stale_authority" | "miss";
type DecisionPacketStatus = "pass" | "fail";

type DecisionPacketDecision = DecisionPacketRow;

type DecisionPacketReadback = EngineDecisionPacket;

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

const evaluateCase = async (
  fixture: DecisionPacketEvalFixture,
  testCase: DecisionPacketCase
): Promise<DecisionPacketCaseResult> => {
  const packet = await buildDecisionPacketWithEngine(fixture, testCase);
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
        "deterministic pre-code task packets are built through retrieveActivationCandidates, applyActivationFilters, packet budgeting, assembleContext, and createExecutionBrief",
        "packets include governing decisions, SourceClaim refs, SourceDecisionEdge refs, memory refs, falsifiers, and doesNotProve boundaries",
        "packet scoring reports stale-decision exclusions and rejected-path visibility from context exclusions before coding starts",
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
    runDecisionPacketEval(loadDecisionPacketEvalFixture(process.argv[2] ?? ""))
  );
}
