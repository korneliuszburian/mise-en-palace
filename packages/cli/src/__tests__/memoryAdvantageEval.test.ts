import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  runMemoryAdvantageEval,
  loadMemoryAdvantageEvalFixture
} from "../runMemoryAdvantageEval.js";

const fixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/memory-advantage/company-pattern-memory-advantage.json", import.meta.url)
);

describe("runMemoryAdvantageEval", () => {
  it("proves one controlled company-pattern memory advantage over no-memory baseline", async () => {
    const result = await runMemoryAdvantageEval(loadMemoryAdvantageEvalFixture(fixturePath));

    expect(result.kind).toBe("krn.memoryAdvantage.eval.v1");
    expect(result.status).toBe("pass");
    expect(result.cases).toHaveLength(1);
    expect(result.cases[0]).toMatchObject({
      caseId: "second-opinion-after-large-slice",
      "baseline_no_memory": {
        result: "miss",
        answerUsefulness: "not_useful",
        selectedKnowledgeIds: []
      },
      "krn_memory": {
        result: "hit",
        answerUsefulness: "useful",
        requiredKnowledgeId: "pattern:second-opinion-after-large-slice",
        selectedKnowledgeIds: ["pattern:second-opinion-after-large-slice"],
        selectedSources: ["catalog_file"],
        supportingClaims: 1,
        supportingDocuments: 1
      }
    });
    expect(result.cases[0]?.["baseline_no_memory"].missingEvidence).toContain(
      "governed company-pattern memory/source evidence"
    );
    expect(result.proof.proves).toContain(
      "fixture-provided company-pattern memory/source context processed through brain search makes the same query useful"
    );
    expect(result.proof.doesNotProve).toContain("KRN retrieval or selection quality");
    expect(result.proof.doesNotProve).toContain("arbitrary task superiority over vanilla Codex");
  });
});
