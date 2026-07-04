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
        selectedSourceClaimIds: ["source:second-opinion-after-large-slice"],
        supportingClaims: 1,
        supportingDocuments: 1
      }
    });
    expect(result.cases[0]?.["baseline_no_memory"].missingEvidence).toEqual([
      "governed SourceClaim evidence in the answer package for this query",
      "included SearchDocument evidence in the answer package for this query"
    ]);
    expect(result.cases[0]?.["krn_memory"].selectedKnowledgeIds).toContain(
      "pattern:second-opinion-after-large-slice"
    );
    expect(result.cases[0]?.["krn_memory"].selectedSourceClaimIds).toContain(
      "source:second-opinion-after-large-slice"
    );
    expect(result.proof.proves).toContain(
      "company-pattern memory/source inputs from the in-memory eval store are selected through real brain/source command paths"
    );
    expect(result.proof.doesNotProve).toContain(
      "production retrieval/recall quality; this eval uses in-memory lexical token overlap"
    );
    expect(result.proof.doesNotProve).toContain("live Postgres runtime behavior");
    expect(result.proof.doesNotProve).toContain("arbitrary task superiority over vanilla Codex");
  });
});
