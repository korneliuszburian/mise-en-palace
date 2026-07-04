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
  it("proves controlled memory competencies over a no-memory baseline", async () => {
    const result = await runMemoryAdvantageEval(loadMemoryAdvantageEvalFixture(fixturePath));

    expect(result.kind).toBe("krn.memoryAdvantage.eval.v1");
    expect(result.status).toBe("pass");
    expect(result.cases).toHaveLength(4);
    expect(result.competencies).toMatchObject({
      retrieval: {
        status: "pass",
        caseIds: ["retrieve-second-opinion-procedure"]
      },
      learning: {
        status: "pass",
        caseIds: ["learn-company-review-standard"]
      },
      long_range: {
        status: "pass",
        caseIds: ["long-range-source-authority-boundary"]
      },
      forgetting: {
        status: "pass",
        caseIds: ["forget-obsolete-no-second-opinion-rule"]
      }
    });

    const retrievalCase = result.cases.find((testCase) =>
      testCase.caseId === "retrieve-second-opinion-procedure"
    );
    expect(retrievalCase).toMatchObject({
      competency: "retrieval",
      status: "pass",
      expectedKrnResult: "hit",
      baselineClass: "no_memory_no_source",
      priorSession: {
        id: "session:second-opinion-skill-refinement",
        evidenceRef: "evidence:second-opinion-skill-refinement",
        reviewRef: "review:second-opinion-skill-refinement",
        feedbackRef: "feedback:second-opinion-skill-refinement-helped",
        applicationOutcome: "helped",
        createdMemoryIds: ["memory:pattern:second-opinion-after-large-slice"],
        excludedMemoryIds: [],
        createdSourceClaimIds: ["source:second-opinion-after-large-slice"]
      },
      "baseline_no_memory": {
        baselineClass: "no_memory_no_source",
        result: "miss",
        answerUsefulness: "not_useful",
        selectedKnowledgeIds: [],
        selectedMemoryIds: [],
        selectedSourceClaimIds: [],
        selectedContextSize: {
          bytes: 0,
          approximateTokens: 0,
          method: "utf8_bytes_div_4"
        }
      },
      "krn_memory": {
        result: "hit",
        answerUsefulness: "useful",
        requiredKnowledgeId: "pattern:second-opinion-after-large-slice",
        selectedKnowledgeIds: ["pattern:second-opinion-after-large-slice"],
        selectedMemoryIds: ["pattern:second-opinion-after-large-slice"],
        selectedSources: ["catalog_file"],
        selectedSourceClaimIds: ["source:second-opinion-after-large-slice"],
        selectedContextSize: {
          bytes: expect.any(Number),
          approximateTokens: expect.any(Number),
          method: "utf8_bytes_div_4"
        },
        supportingClaims: 1,
        supportingDocuments: 1
      }
    });
    expect(retrievalCase?.["baseline_no_memory"].missingEvidence).toEqual([
      "governed SourceClaim evidence in the answer package for this query",
      "included SearchDocument evidence in the answer package for this query"
    ]);
    expect(retrievalCase?.["krn_memory"].selectedKnowledgeIds).toContain(
      "pattern:second-opinion-after-large-slice"
    );
    expect(retrievalCase?.["krn_memory"].selectedSourceClaimIds).toContain(
      "source:second-opinion-after-large-slice"
    );
    expect(retrievalCase?.["krn_memory"].selectedContextSize.bytes).toBeGreaterThan(0);
    expect(retrievalCase?.["krn_memory"].selectedContextSize.approximateTokens).toBeGreaterThan(0);

    const learningCase = result.cases.find((testCase) =>
      testCase.caseId === "learn-company-review-standard"
    );
    expect(learningCase?.["krn_memory"].selectedKnowledgeIds).toContain(
      "pattern:company-review-standard-after-eval-change"
    );
    expect(learningCase?.["krn_memory"].selectedSourceClaimIds).toContain(
      "source:company-review-standard-after-eval-change"
    );

    const longRangeCase = result.cases.find((testCase) =>
      testCase.caseId === "long-range-source-authority-boundary"
    );
    expect(longRangeCase?.["krn_memory"].selectedKnowledgeIds).toContain(
      "source:accepted-source-claims-only"
    );
    expect(longRangeCase?.["krn_memory"].selectedSourceClaimIds).toContain(
      "source:accepted-source-claims-only"
    );

    const forgettingCase = result.cases.find((testCase) =>
      testCase.caseId === "forget-obsolete-no-second-opinion-rule"
    );
    expect(forgettingCase).toMatchObject({
      competency: "forgetting",
      status: "pass",
      expectedKrnResult: "miss",
      priorSession: {
        id: "session:obsolete-second-opinion-rule",
        applicationOutcome: "hurt",
        createdMemoryIds: ["memory:pattern:routine-dependency-pin-cleanup"],
        excludedMemoryIds: ["memory:pattern:obsolete-no-second-opinion-rule"],
        createdSourceClaimIds: []
      },
      "baseline_no_memory": {
        result: "miss",
        answerUsefulness: "not_useful",
        selectedKnowledgeIds: [],
        selectedMemoryIds: [],
        selectedSourceClaimIds: [],
        selectedContextSize: {
          bytes: 0,
          approximateTokens: 0,
          method: "utf8_bytes_div_4"
        }
      },
      "krn_memory": {
        result: "miss",
        answerUsefulness: "not_useful",
        selectedKnowledgeIds: [],
        selectedMemoryIds: [],
        selectedSourceClaimIds: [],
        selectedContextSize: {
          bytes: 0,
          approximateTokens: 0,
          method: "utf8_bytes_div_4"
        },
        writtenKnowledgeIds: ["pattern:routine-dependency-pin-cleanup"],
        requiredKnowledgeId: "pattern:obsolete-no-second-opinion-rule",
        supportingClaims: 0,
        supportingDocuments: 0,
        exclusions: [
          {
            memoryId: "memory:pattern:obsolete-no-second-opinion-rule",
            reason: "stale memory contradicted by later governed second-opinion operating rule"
          }
        ]
      }
    });
    expect(result.proof.proves).toContain(
      "a priorSession fixture supplies evidence, review, feedback refs, and nested learned memory/source inputs before the later task can hit"
    );
    expect(result.proof.proves).toContain(
      "company-pattern memory/source inputs from the in-memory eval store are selected through real brain/source command paths"
    );
    expect(result.proof.proves).toContain(
      "retrieval, learning, long_range, and forgetting competencies are covered by named deterministic cases"
    );
    expect(result.proof.proves).toContain(
      "baseline class and approximate selected-context readback size are reported for each case"
    );
    expect(result.proof.proves).toContain(
      "the eval fixture can pass declared stale or unsupported memory into the case runner, exclude it before catalog write, and surface the explicit exclusion reason"
    );
    expect(result.proof.doesNotProve).toContain(
      "production retrieval/recall quality; this eval uses in-memory lexical token overlap"
    );
    expect(result.proof.doesNotProve).toContain(
      "runtime stale-memory detection for stored fixture cards or arbitrary production MemoryRecord rows"
    );
    expect(result.proof.doesNotProve).toContain(
      "exact tokenizer cost or model-specific context pricing; selected-context size uses local utf8 bytes divided by four"
    );
    expect(result.proof.doesNotProve).toContain(
      "card or source-claim content payload size; selected-context size measures selection identifier overhead only"
    );
    expect(result.proof.doesNotProve).toContain("automatic Memory Core promotion from evidence or feedback");
    expect(result.proof.doesNotProve).toContain("live Postgres runtime behavior");
    expect(result.proof.doesNotProve).toContain("arbitrary task superiority over vanilla Codex");
  });
});
