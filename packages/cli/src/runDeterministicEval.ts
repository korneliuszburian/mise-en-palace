import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./evalMain.js";
import {
  loadBrainRankingEvalFixture,
  runBrainRankingEval
} from "./runBrainRankingEval.js";
import {
  loadMemoryAdvantageEvalFixture,
  runMemoryAdvantageEval
} from "./runMemoryAdvantageEval.js";
import {
  loadNotesBaselineEvalFixture,
  runNotesBaselineEval
} from "./runNotesBaselineEval.js";
import {
  loadSourceGraphRankingEvalFixture,
  runSourceGraphRankingEval
} from "./runSourceGraphRankingEval.js";

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
  const firstNotesBaseline = runNotesBaselineEval(notesBaselineFixture);
  const secondNotesBaseline = runNotesBaselineEval(notesBaselineFixture);

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
  const brainRankingFixturePath =
    process.argv[2] ?? "tests/fixtures/brain-ranking/brain-ranking-eval.json";
  const sourceGraphRankingFixturePath =
    process.argv[3] ?? "tests/fixtures/source-graph-ranking/source-graph-ranking-eval.json";
  const memoryAdvantageFixturePath =
    process.argv[4] ?? "tests/fixtures/memory-advantage/company-pattern-memory-advantage.json";
  const notesBaselineFixturePath =
    process.argv[5] ?? "tests/fixtures/notes-baseline/decision-packet-vs-notes.json";
  return runDeterministicEval({
    brainRankingFixturePath,
    sourceGraphRankingFixturePath,
    memoryAdvantageFixturePath,
    notesBaselineFixturePath
  });
};

if (isCliEntrypoint(import.meta.url)) {
  await writeJsonEvalResult(main);
}
