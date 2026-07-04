import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./evalMain.js";
import {
  loadBrainRankingEvalFixture,
  runBrainRankingEval
} from "./runBrainRankingEval.js";
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
}): Promise<DeterministicEvalResult> => {
  const brainRankingFixture = loadBrainRankingEvalFixture(input.brainRankingFixturePath);
  const firstBrainRanking = await runBrainRankingEval(brainRankingFixture);
  const secondBrainRanking = await runBrainRankingEval(brainRankingFixture);

  const sourceGraphRankingFixture = loadSourceGraphRankingEvalFixture(
    input.sourceGraphRankingFixturePath
  );
  const firstSourceGraphRanking = await runSourceGraphRankingEval(sourceGraphRankingFixture);
  const secondSourceGraphRanking = await runSourceGraphRankingEval(sourceGraphRankingFixture);

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
        "retrieval/context proxy evals are stable enough to serve as a regression gate"
      ],
      doesNotProve: [
        "production retrieval quality",
        "source truth",
        "LLM output quality",
        "company-pattern memory advantage",
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
  return runDeterministicEval({
    brainRankingFixturePath,
    sourceGraphRankingFixturePath
  });
};

if (isCliEntrypoint(import.meta.url)) {
  await writeJsonEvalResult(main);
}
