import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./eval-main.js";
import {
  loadBrainRankingEvalFixture,
  runBrainRankingEval
} from "./run-brain-ranking-eval.js";
import {
  loadMemoryAdvantageEvalFixture,
  runMemoryAdvantageEval
} from "./run-memory-advantage-eval.js";
import {
  runDecisionPacketEval
} from "./run-decision-packet-eval.js";
import {
  loadCodexDecisionPacketObedienceFixture,
  runCodexDecisionPacketObedienceEval
} from "./run-codex-decision-packet-obedience-eval.js";
import {
  loadNotesBaselineEvalFixture,
  runNotesBaselineEval
} from "./run-notes-baseline-eval.js";
import {
  runSecondRepoDecisionPacketEval
} from "./run-second-repo-decision-packet-eval.js";
import {
  loadSourceGraphRankingEvalFixture,
  runSourceGraphRankingEval
} from "./run-source-graph-ranking-eval.js";

interface DeterministicEvalCheck {
  readonly id: string;
  readonly kind: string;
  readonly status: "pass" | "fail";
  readonly identical: boolean;
  readonly firstStatus: string;
  readonly secondStatus: string;
}

export interface DeterministicEvalResult {
  readonly kind: "krn.deterministicEval.v1";
  readonly status: "pass" | "fail";
  readonly checks: readonly DeterministicEvalCheck[];
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

const stableJson = (value: unknown): string =>
  JSON.stringify(value);

const deterministicCheck = (input: {
  id: string;
  kind: string;
  first: { status: string };
  second: { status: string };
}): DeterministicEvalCheck => {
  const identical = stableJson(input.first) === stableJson(input.second);

  return {
    id: input.id,
    kind: input.kind,
    status: identical && input.first.status === "pass" && input.second.status === "pass"
      ? "pass"
      : "fail",
    identical,
    firstStatus: input.first.status,
    secondStatus: input.second.status
  };
};

export const runDeterministicEval = async (input: {
  brainRankingFixturePath: string;
  sourceGraphRankingFixturePath: string;
  memoryAdvantageFixturePath: string;
  notesBaselineFixturePath: string;
  secondRepoDecisionPacketFixturePath: string | readonly string[];
  codexDecisionPacketObedienceFixturePath: string;
}): Promise<DeterministicEvalResult> => {
  const brainRankingFixture = loadBrainRankingEvalFixture(input.brainRankingFixturePath);
  const firstBrainRanking = await runBrainRankingEval(brainRankingFixture);
  const secondBrainRanking = await runBrainRankingEval(brainRankingFixture);

  const sourceGraphRankingFixture = loadSourceGraphRankingEvalFixture(
    input.sourceGraphRankingFixturePath
  );
  const firstSourceGraphRanking = await runSourceGraphRankingEval(sourceGraphRankingFixture);
  const secondSourceGraphRanking = await runSourceGraphRankingEval(sourceGraphRankingFixture);

  const memoryAdvantageFixture = loadMemoryAdvantageEvalFixture(input.memoryAdvantageFixturePath);
  const firstMemoryAdvantage = await runMemoryAdvantageEval(memoryAdvantageFixture);
  const secondMemoryAdvantage = await runMemoryAdvantageEval(memoryAdvantageFixture);

  const notesBaselineFixture = loadNotesBaselineEvalFixture(input.notesBaselineFixturePath);
  const firstNotesBaseline = await runNotesBaselineEval(notesBaselineFixture);
  const secondNotesBaseline = await runNotesBaselineEval(notesBaselineFixture);
  const firstDecisionPacket = await runDecisionPacketEval(notesBaselineFixture);
  const secondDecisionPacket = await runDecisionPacketEval(notesBaselineFixture);
  const firstSecondRepoDecisionPacket = await runSecondRepoDecisionPacketEval(
    input.secondRepoDecisionPacketFixturePath
  );
  const secondSecondRepoDecisionPacket = await runSecondRepoDecisionPacketEval(
    input.secondRepoDecisionPacketFixturePath
  );
  const codexDecisionPacketObedienceFixture = loadCodexDecisionPacketObedienceFixture(
    input.codexDecisionPacketObedienceFixturePath
  );
  const firstCodexDecisionPacketObedience = await runCodexDecisionPacketObedienceEval(
    codexDecisionPacketObedienceFixture
  );
  const secondCodexDecisionPacketObedience = await runCodexDecisionPacketObedienceEval(
    codexDecisionPacketObedienceFixture
  );

  const checks = [
    deterministicCheck({
      id: "brain-ranking",
      kind: firstBrainRanking.kind,
      first: firstBrainRanking,
      second: secondBrainRanking
    }),
    deterministicCheck({
      id: "source-graph-ranking",
      kind: firstSourceGraphRanking.kind,
      first: firstSourceGraphRanking,
      second: secondSourceGraphRanking
    }),
    deterministicCheck({
      id: "memory-advantage",
      kind: firstMemoryAdvantage.kind,
      first: firstMemoryAdvantage,
      second: secondMemoryAdvantage
    }),
    deterministicCheck({
      id: "notes-baseline",
      kind: firstNotesBaseline.kind,
      first: firstNotesBaseline,
      second: secondNotesBaseline
    }),
    deterministicCheck({
      id: "decision-packet",
      kind: firstDecisionPacket.kind,
      first: firstDecisionPacket,
      second: secondDecisionPacket
    }),
    deterministicCheck({
      id: "second-repo-decision-packet",
      kind: firstSecondRepoDecisionPacket.kind,
      first: firstSecondRepoDecisionPacket,
      second: secondSecondRepoDecisionPacket
    }),
    deterministicCheck({
      id: "codex-decision-packet-obedience",
      kind: firstCodexDecisionPacketObedience.kind,
      first: firstCodexDecisionPacketObedience,
      second: secondCodexDecisionPacketObedience
    })
  ];
  const status = checks.every((check) => check.status === "pass") ? "pass" : "fail";

  return {
    kind: "krn.deterministicEval.v1",
    status,
    checks,
    proof: {
      proves: [
        "fixed brain-ranking fixture output is bit-identical across consecutive runs",
        "fixed source-graph-ranking fixture output is bit-identical across consecutive runs",
        "fixed company-pattern memory-advantage fixture output is bit-identical across consecutive runs",
        "fixed notes-baseline fixture output is bit-identical across consecutive runs",
        "fixed decision-packet fixture output is bit-identical across consecutive runs",
        "fixed target-repo decision-packet fixture output is bit-identical across consecutive runs",
        "fixed recorded Codex decision-packet obedience fixture output is bit-identical across consecutive runs",
        "retrieval/context proxy evals are stable enough to serve as a regression gate"
      ],
      doesNotProve: [
        "production retrieval quality",
        "source truth",
        "LLM output quality",
        "arbitrary company-pattern memory advantage",
        "product readiness"
      ]
    }
  };
};

const main = async (): Promise<DeterministicEvalResult> => {
  const args = process.argv.slice(2);
  const brainRankingFixturePath =
    args[0] ?? "tests/fixtures/brain-ranking/brain-ranking-eval.json";
  const sourceGraphRankingFixturePath =
    args[1] ?? "tests/fixtures/source-graph-ranking/source-graph-ranking-eval.json";
  const memoryAdvantageFixturePath =
    args[2] ?? "tests/fixtures/memory-advantage/company-pattern-memory-advantage.json";
  const notesBaselineFixturePath =
    args[3] ?? "tests/fixtures/notes-baseline/decision-packet-vs-notes.json";
  const secondRepoDecisionPacketFixturePaths = args.length >= 6
    ? args.slice(4, -1)
    : [args[4] ?? "tests/fixtures/second-repo/weak-json-decision-packet-vs-notes.json"];
  const codexDecisionPacketObedienceFixturePath =
    args.length >= 6
      ? args[args.length - 1]!
      : "tests/fixtures/codex-decision-packet-obedience/recorded-obedience.json";
  return runDeterministicEval({
    brainRankingFixturePath,
    sourceGraphRankingFixturePath,
    memoryAdvantageFixturePath,
    notesBaselineFixturePath,
    secondRepoDecisionPacketFixturePath: secondRepoDecisionPacketFixturePaths,
    codexDecisionPacketObedienceFixturePath
  });
};

if (isCliEntrypoint(import.meta.url)) {
  await writeJsonEvalResult(main);
}
