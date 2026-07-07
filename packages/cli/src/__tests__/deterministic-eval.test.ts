import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  runDeterministicEval
} from "../run-deterministic-eval.js";

const decisionPacketFixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/notes-baseline/decision-packet-vs-notes.json", import.meta.url)
);
const secondRepoDecisionPacketFixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/second-repo/weak-json-decision-packet-vs-notes.json", import.meta.url)
);
const thirdRepoDecisionPacketFixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/second-repo/env-config-decision-packet-vs-notes.json", import.meta.url)
);
const codexDecisionPacketObedienceFixturePath = fileURLToPath(
  new URL(
    "../../../../tests/fixtures/codex-decision-packet-obedience/recorded-obedience.json",
    import.meta.url
  )
);

describe("runDeterministicEval", () => {
  it("passes when decision-packet eval fixtures produce bit-identical consecutive output", async () => {
    const result = await runDeterministicEval({
      decisionPacketFixturePath,
      secondRepoDecisionPacketFixturePath: [
        secondRepoDecisionPacketFixturePath,
        thirdRepoDecisionPacketFixturePath
      ],
      codexDecisionPacketObedienceFixturePath
    });

    expect(result).toMatchObject({
      kind: "krn.deterministicEval.v1",
      status: "pass",
      checks: [
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
      "decision-packet family evals are stable enough to serve as a regression gate"
    );
    expect(result.proof.proves).toContain(
      "fixed decision-packet fixture output is bit-identical across consecutive runs"
    );
    expect(result.proof.proves).toContain(
      "fixed target-repo decision-packet fixture output is bit-identical across consecutive runs"
    );
    expect(result.proof.proves).toContain(
      "fixed recorded Codex decision-packet obedience fixture output is bit-identical across consecutive runs"
    );
    expect(result.proof.doesNotProve).toContain("arbitrary company-pattern memory advantage");
  });
});
