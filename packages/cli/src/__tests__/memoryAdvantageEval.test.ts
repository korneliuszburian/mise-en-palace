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
    expect(result.cases).toHaveLength(7);
    expect(result.corpus).toMatchObject({
      name: "company-pattern-memory-advantage-heldout",
      caseCount: 7,
      heldOutCaseCount: 3,
      distractorClasses: [
        "obsolete-operating-rule",
        "generic-quality-guidance",
        "adjacent-kernel-boundary",
        "docs-sentinel-overfit",
        "target-specific-vs-generic"
      ]
    });
    expect(result.metrics).toMatchObject({
      caseCount: 7,
      heldOutCaseCount: 3,
      expectedHitCount: 6,
      expectedMissCount: 1,
      distractorClassCount: 5
    });
    expect(result.metrics.totalKrnMemoryContextBytes).toBeGreaterThan(0);
    expect(result.metrics.totalKrnPlanBriefContextBytes).toBeGreaterThan(0);
    expect(result.metrics.totalRenderedBriefBytes).toBeGreaterThan(0);
    expect(result.competencies).toMatchObject({
      retrieval: {
        status: "pass",
        caseIds: [
          "retrieve-second-opinion-procedure",
          "heldout-source-search-command-boundary"
        ]
      },
      learning: {
        status: "pass",
        caseIds: [
          "learn-company-review-standard",
          "heldout-db-project-brain-search"
        ]
      },
      long_range: {
        status: "pass",
        caseIds: [
          "long-range-source-authority-boundary",
          "heldout-ranking-corpus-quality"
        ]
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
        distractorMemoryIds: ["memory:pattern:close-large-migration-from-local-tests"],
        createdSourceClaimIds: ["source:second-opinion-after-large-slice"],
        distractorSourceClaimIds: []
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
      "baseline_simple_retrieval": {
        baselineClass: "simple_lexical_retrieval",
        result: "distractor_selected",
        selectedKnowledgeIds: [
          "pattern:close-large-migration-from-local-tests",
          "source:second-opinion-after-large-slice",
          "pattern:second-opinion-after-large-slice"
        ],
        selectedMemoryIds: [
          "pattern:close-large-migration-from-local-tests",
          "pattern:second-opinion-after-large-slice"
        ],
        selectedSourceClaimIds: ["source:second-opinion-after-large-slice"],
        selectedContextSize: {
          bytes: expect.any(Number),
          approximateTokens: expect.any(Number),
          method: "utf8_bytes_div_4"
        }
      },
      "baseline_plan_brief": {
        baselineClass: "no_memory_no_source",
        result: "miss",
        requiredKnowledgeId: "pattern:second-opinion-after-large-slice",
        selectedMemoryRecordIds: [],
        selectedSourceClaimIds: [],
        renderedMemoryRecordIds: [],
        renderedSourceClaimIds: [],
        contextInclusionCount: 0,
        contextSize: {
          bytes: 0,
          approximateTokens: 0,
          method: "utf8_bytes_div_4"
        },
        renderedBriefSize: {
          bytes: expect.any(Number),
          approximateTokens: expect.any(Number),
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
      },
      "krn_plan_brief": {
        baselineClass: "no_memory_no_source",
        result: "hit",
        requiredKnowledgeId: "pattern:second-opinion-after-large-slice",
        contextSize: {
          bytes: expect.any(Number),
          approximateTokens: expect.any(Number),
          method: "utf8_bytes_div_4"
        },
        renderedBriefSize: {
          bytes: expect.any(Number),
          approximateTokens: expect.any(Number),
          method: "utf8_bytes_div_4"
        }
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
    expect(retrievalCase?.["baseline_simple_retrieval"].selectedKnowledgeIds[0]).toBe(
      "pattern:close-large-migration-from-local-tests"
    );
    expect(retrievalCase?.["krn_memory"].selectedContextSize.bytes).toBeGreaterThan(0);
    expect(retrievalCase?.["krn_memory"].selectedContextSize.approximateTokens).toBeGreaterThan(0);
    expect(retrievalCase?.["baseline_plan_brief"].renderedBriefSize.bytes).toBeGreaterThan(0);
    expect(retrievalCase?.["krn_plan_brief"].contextSize.bytes).toBeGreaterThan(0);
    expect(retrievalCase?.["krn_plan_brief"].renderedBriefSize.approximateTokens).toBeGreaterThan(0);
    expect(retrievalCase?.["krn_plan_brief"].contextInclusionCount).toBeGreaterThanOrEqual(2);
    expect(retrievalCase?.["krn_plan_brief"].selectedMemoryRecordIds).toContain(
      "memory:pattern:second-opinion-after-large-slice"
    );
    expect(retrievalCase?.["krn_plan_brief"].selectedSourceClaimIds).toContain(
      "source:second-opinion-after-large-slice"
    );
    expect(retrievalCase?.["krn_plan_brief"].renderedMemoryRecordIds).toContain(
      "memory:pattern:second-opinion-after-large-slice"
    );
    expect(retrievalCase?.["krn_plan_brief"].renderedSourceClaimIds).toContain(
      "source:second-opinion-after-large-slice"
    );

    const learningCase = result.cases.find((testCase) =>
      testCase.caseId === "learn-company-review-standard"
    );
    expect(learningCase?.["krn_memory"].selectedKnowledgeIds).toContain(
      "pattern:company-review-standard-after-eval-change"
    );
    expect(learningCase?.["krn_memory"].selectedSourceClaimIds).toContain(
      "source:company-review-standard-after-eval-change"
    );
    expect(learningCase?.["reviewed_feedback_effect"]).toMatchObject({
      priorFeedbackRef: "feedback:memory-eval-review-standard-helped",
      priorEvidenceRef: "evidence:memory-eval-review-standard",
      priorReviewRef: "review:memory-eval-review-standard",
      applicationOutcome: "helped",
      laterTaskQuery: "when a slice changes KRN memory eval behavior what company review standard should Codex apply before closing",
      requiredKnowledgeId: "pattern:company-review-standard-after-eval-change",
      baselineNoMemoryResult: "miss",
      simpleRetrievalResult: "top_match_selected",
      simpleRetrievalTopKnowledgeId: "pattern:company-review-standard-after-eval-change",
      simpleRetrievalWeakerThanKrn: false,
      krnResult: "hit",
      selectedMemoryIds: ["pattern:company-review-standard-after-eval-change"],
      selectedSourceClaimIds: ["source:company-review-standard-after-eval-change"],
      proofStatus: "pass"
    });
    expect(learningCase?.["reviewed_feedback_effect"].selectedContextSize.bytes).toBeGreaterThan(0);
    expect(learningCase?.["reviewed_feedback_effect"].planBriefContextSize.bytes).toBeGreaterThan(0);

    const heldOutLearningCase = result.cases.find((testCase) =>
      testCase.caseId === "heldout-db-project-brain-search"
    );
    expect(heldOutLearningCase?.["reviewed_feedback_effect"]).toMatchObject({
      priorFeedbackRef: "feedback:brain-search-project-selector-helped",
      priorEvidenceRef: "evidence:brain-search-project-selector",
      priorReviewRef: "review:brain-search-project-selector",
      requiredKnowledgeId: "pattern:brain-search-explicit-project-selector",
      baselineNoMemoryResult: "miss",
      simpleRetrievalResult: "distractor_selected",
      simpleRetrievalTopKnowledgeId: "source:brain-search-explicit-project-selector",
      simpleRetrievalWeakerThanKrn: true,
      krnResult: "hit",
      selectedMemoryIds: ["pattern:brain-search-explicit-project-selector"],
      selectedSourceClaimIds: ["source:brain-search-explicit-project-selector"],
      proofStatus: "pass"
    });

    const longRangeCase = result.cases.find((testCase) =>
      testCase.caseId === "long-range-source-authority-boundary"
    );
    expect(longRangeCase?.["krn_memory"].selectedKnowledgeIds).toContain(
      "source:accepted-source-claims-only"
    );
    expect(longRangeCase?.["krn_memory"].selectedSourceClaimIds).toContain(
      "source:accepted-source-claims-only"
    );
    expect(longRangeCase?.["baseline_plan_brief"].result).toBe("miss");
    expect(longRangeCase?.["krn_plan_brief"].result).toBe("hit");
    expect(longRangeCase?.["krn_plan_brief"].renderedSourceClaimIds).toContain(
      "source:accepted-source-claims-only"
    );
    expect(longRangeCase?.["reviewed_feedback_effect"]).toMatchObject({
      priorFeedbackRef: "feedback:source-authority-boundary-helped",
      priorEvidenceRef: "evidence:source-authority-boundary",
      priorReviewRef: "review:source-authority-boundary",
      requiredKnowledgeId: "source:accepted-source-claims-only",
      baselineNoMemoryResult: "miss",
      simpleRetrievalResult: "top_match_selected",
      simpleRetrievalTopKnowledgeId: "source:accepted-source-claims-only",
      simpleRetrievalWeakerThanKrn: false,
      krnResult: "hit",
      selectedMemoryIds: [],
      selectedSourceClaimIds: ["source:accepted-source-claims-only"],
      proofStatus: "pass"
    });

    const heldOutCases = result.cases.filter((testCase) => testCase.heldOut);
    expect(heldOutCases.map((testCase) => testCase.caseId)).toEqual([
      "heldout-source-search-command-boundary",
      "heldout-db-project-brain-search",
      "heldout-ranking-corpus-quality"
    ]);
    expect(heldOutCases.every((testCase) =>
      testCase.baselineFailureRationale.length > 0
    )).toBe(true);
    expect(heldOutCases.every((testCase) =>
      testCase["baseline_no_memory"].result === "miss" &&
      testCase["baseline_simple_retrieval"].result === "distractor_selected" &&
      testCase["krn_memory"].result === "hit" &&
      testCase["krn_plan_brief"].result === "hit"
    )).toBe(true);
    expect(heldOutCases.map((testCase) =>
      testCase["krn_memory"].requiredKnowledgeId
    )).toEqual([
      "pattern:source-search-command-boundary",
      "pattern:brain-search-explicit-project-selector",
      "pattern:ranking-corpus-quality-readback"
    ]);

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
        distractorMemoryIds: [],
        createdSourceClaimIds: [],
        distractorSourceClaimIds: []
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
      "baseline_simple_retrieval": {
        baselineClass: "simple_lexical_retrieval",
        result: "top_match_selected",
        selectedKnowledgeIds: ["pattern:obsolete-no-second-opinion-rule"],
        selectedMemoryIds: ["pattern:obsolete-no-second-opinion-rule"],
        selectedSourceClaimIds: [],
        selectedContextSize: {
          bytes: expect.any(Number),
          approximateTokens: expect.any(Number),
          method: "utf8_bytes_div_4"
        }
      },
      "baseline_plan_brief": {
        result: "miss",
        selectedMemoryRecordIds: [],
        selectedSourceClaimIds: []
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
      },
      "krn_plan_brief": {
        result: "miss",
        requiredKnowledgeId: "pattern:obsolete-no-second-opinion-rule"
      },
      "reviewed_feedback_effect": {
        priorFeedbackRef: "feedback:obsolete-second-opinion-rule-hurt",
        applicationOutcome: "hurt",
        requiredKnowledgeId: "pattern:obsolete-no-second-opinion-rule",
        baselineNoMemoryResult: "miss",
        simpleRetrievalResult: "top_match_selected",
        simpleRetrievalTopKnowledgeId: "pattern:obsolete-no-second-opinion-rule",
        simpleRetrievalWeakerThanKrn: true,
        krnResult: "miss",
        selectedMemoryIds: [],
        selectedSourceClaimIds: [],
        proofStatus: "pass"
      }
    });
    expect(result.proof.proves).toContain(
      "the memory advantage output reports corpus metadata, per-case baseline failure rationale, and aggregate context-size cost proxies"
    );
    expect(result.proof.proves).toContain(
      "a priorSession fixture supplies evidence, review, feedback refs, and nested learned memory/source inputs before the later task can hit"
    );
    expect(result.proof.proves).toContain(
      "reviewed feedback refs are reported beside the later task query, selected memory/source ids, baseline outcome, KRN outcome, and context-size cost"
    );
    expect(result.proof.proves).toContain(
      "a simple lexical retrieval baseline is reported so no-memory misses are not the only comparator"
    );
    expect(result.proof.proves).toContain(
      "company-pattern memory/source inputs from the in-memory eval store are selected through real brain/source command paths while distractors can be present"
    );
    expect(result.proof.proves).toContain(
      "at least one company-pattern case fails the no-memory plan/brief baseline and passes when KRN memory/source context reaches the rendered Codex brief"
    );
    expect(result.proof.proves).toContain(
      "retrieval, learning, long_range, and forgetting competencies are covered by named deterministic cases"
    );
    expect(result.proof.proves).toContain(
      "baseline class and approximate selected-context readback size are reported for each case"
    );
    expect(result.proof.proves).toContain(
      "the expected memory/source id is present in rendered Codex brief context for hit cases"
    );
    expect(result.proof.proves).toContain(
      "the eval fixture can pass declared stale or unsupported memory into the case runner, exclude it before catalog write, and surface the explicit exclusion reason"
    );
    expect(result.proof.doesNotProve).toContain(
      "production retrieval/recall quality; this eval uses in-memory lexical token overlap"
    );
    expect(result.proof.doesNotProve).toContain(
      "that simple lexical retrieval is a strong baseline; it is a local foil for governed memory/source packaging"
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
    expect(result.proof.doesNotProve).toContain("arbitrary Codex output quality");
  });
});
