import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  runDeterministicEval
} from "../runDeterministicEval.js";

const brainRankingFixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/brain-ranking/brain-ranking-eval.json", import.meta.url)
);
const sourceGraphRankingFixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/source-graph-ranking/source-graph-ranking-eval.json", import.meta.url)
);
const memoryAdvantageFixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/memory-advantage/company-pattern-memory-advantage.json", import.meta.url)
);
const notesBaselineFixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/notes-baseline/decision-packet-vs-notes.json", import.meta.url)
);
const secondRepoDecisionPacketFixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/second-repo/weak-json-decision-packet-vs-notes.json", import.meta.url)
);
const codexDecisionPacketObedienceFixturePath = fileURLToPath(
  new URL(
    "../../../../tests/fixtures/codex-decision-packet-obedience/recorded-obedience.json",
    import.meta.url
  )
);

describe("runDeterministicEval", () => {
  it("passes when ranking eval fixtures produce bit-identical consecutive output", async () => {
    const result = await runDeterministicEval({
      brainRankingFixturePath,
      sourceGraphRankingFixturePath,
      memoryAdvantageFixturePath,
      notesBaselineFixturePath,
      secondRepoDecisionPacketFixturePath,
      codexDecisionPacketObedienceFixturePath
    });

    expect(result).toMatchObject({
      kind: "krn.deterministicEval.v1",
      status: "pass",
      checks: [
        {
          id: "brain-ranking",
          identical: true,
          firstStatus: "pass",
          secondStatus: "pass"
        },
        {
          id: "source-graph-ranking",
          identical: true,
          firstStatus: "pass",
          secondStatus: "pass"
        },
        {
          id: "memory-advantage",
          identical: true,
          firstStatus: "pass",
          secondStatus: "pass"
        },
        {
          id: "notes-baseline",
          identical: true,
          firstStatus: "pass",
          secondStatus: "pass"
        },
        {
          id: "decision-packet",
          identical: true,
          firstStatus: "pass",
          secondStatus: "pass"
        },
        {
          id: "second-repo-decision-packet",
          identical: true,
          firstStatus: "pass",
          secondStatus: "pass"
        },
        {
          id: "codex-decision-packet-obedience",
          identical: true,
          firstStatus: "pass",
          secondStatus: "pass"
        }
      ]
    });
    expect(result.proof.proves).toContain(
      "retrieval/context proxy evals are stable enough to serve as a regression gate"
    );
    expect(result.proof.proves).toContain(
      "fixed company-pattern memory-advantage fixture output is bit-identical across consecutive runs"
    );
    expect(result.proof.proves).toContain(
      "fixed notes-baseline fixture output is bit-identical across consecutive runs"
    );
    expect(result.proof.proves).toContain(
      "fixed decision-packet fixture output is bit-identical across consecutive runs"
    );
    expect(result.proof.proves).toContain(
      "fixed second-repo decision-packet fixture output is bit-identical across consecutive runs"
    );
    expect(result.proof.proves).toContain(
      "fixed recorded Codex decision-packet obedience fixture output is bit-identical across consecutive runs"
    );
    expect(result.proof.doesNotProve).toContain("arbitrary company-pattern memory advantage");
  });
});
