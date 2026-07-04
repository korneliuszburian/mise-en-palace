import { readFileSync } from "node:fs";
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
    const rawFixture = JSON.parse(readFileSync(fixturePath, "utf8")) as {
      readonly cases: readonly {
        readonly id: string;
        readonly priorSession: Record<string, unknown>;
      }[];
    };

    expect(result.kind).toBe("krn.memoryAdvantage.eval.v1");
    expect(result.status).toBe("pass");
    expect(result.cases).toHaveLength(12);
    expect(result.corpus).toMatchObject({
      name: "company-pattern-memory-advantage-heldout",
      caseCount: 12,
      heldOutCaseCount: 8,
      distractorClasses: [
        "obsolete-operating-rule",
        "generic-quality-guidance",
        "adjacent-kernel-boundary",
        "docs-sentinel-overfit",
        "target-specific-vs-generic",
        "unsafe-json-casting",
        "runtime-contradiction"
      ]
    });
    expect(result.metrics).toMatchObject({
      caseCount: 12,
      heldOutCaseCount: 8,
      expectedHitCount: 10,
      expectedMissCount: 2,
      distractorClassCount: 7,
      codingTaskCaseCount: 1
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
          "heldout-db-project-brain-search",
          "heldout-coding-task-json-boundary"
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
        caseIds: [
          "forget-obsolete-no-second-opinion-rule",
          "adversarial-unsupported-secret-scan-rule",
          "adversarial-memory-source-conflict-secret-review",
          "temporal-stale-source-claim-decision-link",
          "runtime-memory-source-contradiction-review-context"
        ]
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
    const codingTaskCase = result.cases.find((testCase) =>
      testCase.caseId === "heldout-coding-task-json-boundary"
    );
    expect(codingTaskCase).toMatchObject({
      competency: "learning",
      heldOut: true,
      status: "pass",
      expectedKrnResult: "hit",
      priorSession: {
        id: "session:unknown-first-json-metadata-boundary",
        applicationOutcome: "helped",
        createdMemoryIds: ["memory:pattern:unknown-first-json-metadata-boundary"],
        distractorMemoryIds: ["memory:pattern:cast-json-record-in-command-runner"],
        createdSourceClaimIds: ["source:unknown-first-json-metadata-boundary"]
      },
      "baseline_simple_retrieval": {
        result: "distractor_selected",
        selectedKnowledgeIds: [
          "pattern:cast-json-record-in-command-runner",
          "source:unknown-first-json-metadata-boundary",
          "pattern:unknown-first-json-metadata-boundary"
        ],
        selectedMemoryIds: [
          "pattern:cast-json-record-in-command-runner",
          "pattern:unknown-first-json-metadata-boundary"
        ],
        selectedSourceClaimIds: ["source:unknown-first-json-metadata-boundary"]
      },
      "krn_memory": {
        result: "hit",
        selectedMemoryIds: ["pattern:cast-json-record-in-command-runner"],
        selectedSourceClaimIds: ["source:unknown-first-json-metadata-boundary"],
        requiredKnowledgeId: "source:unknown-first-json-metadata-boundary"
      },
      "coding_task_decision": {
        taskId: "coding-task:cli-json-metadata-boundary",
        implementationConstraint: "External CLI JSON metadata must remain unknown until parsed by a named helper; do not cast parsed JSON directly into command/domain state.",
        expectedKrnDecisionId: "decision:unknown-first-parser",
        decisionDerivationOrder: "source_claims_first",
        memoryFirstCounterfactualDecisionId: "decision:cast-json-record",
        selectedContextSize: {
          bytes: expect.any(Number),
          approximateTokens: expect.any(Number),
          method: "utf8_bytes_div_4"
        },
        baseline: {
          baselineClass: "simple_lexical_retrieval",
          decisionId: "decision:cast-json-record",
          selectedKnowledgeIds: [
            "pattern:cast-json-record-in-command-runner",
            "source:unknown-first-json-metadata-boundary",
            "pattern:unknown-first-json-metadata-boundary"
          ]
        },
        krn: {
          decisionId: "decision:unknown-first-parser",
          selectedKnowledgeIds: [
            "source:unknown-first-json-metadata-boundary",
            "pattern:cast-json-record-in-command-runner"
          ],
          selectedMemoryIds: ["pattern:cast-json-record-in-command-runner"],
          selectedSourceClaimIds: ["source:unknown-first-json-metadata-boundary"]
        },
        status: "pass"
      },
      "reviewed_feedback_effect": {
        priorFeedbackRef: "feedback:unknown-first-json-metadata-boundary-helped",
        priorEvidenceRef: "evidence:unknown-first-json-metadata-boundary",
        priorReviewRef: "review:unknown-first-json-metadata-boundary",
        simpleRetrievalTopKnowledgeId: "pattern:cast-json-record-in-command-runner",
        simpleRetrievalWeakerThanKrn: true,
        krnResult: "hit",
        selectedSourceClaimIds: ["source:unknown-first-json-metadata-boundary"],
        proofStatus: "pass"
      }
    });
    expect(codingTaskCase?.["coding_task_decision"]?.baseline.decisionId).not.toBe(
      codingTaskCase?.["coding_task_decision"]?.krn.decisionId
    );
    expect(codingTaskCase?.["coding_task_decision"]?.selectedContextSize.bytes).toBeGreaterThan(0);

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

    const heldOutHitCases = result.cases.filter((testCase) =>
      testCase.heldOut && testCase.expectedKrnResult === "hit"
    );
    expect(heldOutHitCases.map((testCase) => testCase.caseId)).toEqual([
      "adversarial-memory-source-conflict-secret-review",
      "temporal-stale-source-claim-decision-link",
      "runtime-memory-source-contradiction-review-context",
      "heldout-source-search-command-boundary",
      "heldout-db-project-brain-search",
      "heldout-ranking-corpus-quality",
      "heldout-coding-task-json-boundary"
    ]);
    const heldOutMissCases = result.cases.filter((testCase) =>
      testCase.heldOut && testCase.expectedKrnResult === "miss"
    );
    expect(heldOutMissCases.map((testCase) => testCase.caseId)).toEqual([
      "adversarial-unsupported-secret-scan-rule"
    ]);
    expect(heldOutHitCases.every((testCase) =>
      testCase.baselineFailureRationale.length > 0
    )).toBe(true);
    expect(heldOutHitCases.every((testCase) =>
      testCase["baseline_no_memory"].result === "miss" &&
      testCase["baseline_simple_retrieval"].result === "distractor_selected" &&
      testCase["krn_memory"].result === "hit" &&
      testCase["krn_plan_brief"].result === "hit"
    )).toBe(true);
    expect(heldOutHitCases.map((testCase) =>
      testCase["krn_memory"].requiredKnowledgeId
    )).toEqual([
      "source:secret-review-context-denylist",
      "source:current-source-decision-edge-ranking",
      "source:runtime-secret-context-denylist",
      "pattern:source-search-command-boundary",
      "pattern:brain-search-explicit-project-selector",
      "pattern:ranking-corpus-quality-readback",
      "source:unknown-first-json-metadata-boundary"
    ]);

    const forgettingCase = result.cases.find((testCase) =>
      testCase.caseId === "forget-obsolete-no-second-opinion-rule"
    );
    expect(forgettingCase).toMatchObject({
      competency: "forgetting",
      status: "pass",
      expectedKrnResult: "miss",
      negativeClass: "stale_memory",
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
    const adversarialCase = result.cases.find((testCase) =>
      testCase.caseId === "adversarial-unsupported-secret-scan-rule"
    );
    expect(adversarialCase).toMatchObject({
      competency: "forgetting",
      heldOut: true,
      status: "pass",
      expectedKrnResult: "miss",
      negativeClass: "adversarial_unsupported_memory",
      priorSession: {
        id: "session:adversarial-secret-context-rule",
        applicationOutcome: "hurt",
        createdMemoryIds: ["memory:pattern:secret-path-denylist-for-review-context"],
        excludedMemoryIds: ["memory:pattern:paste-secret-env-files-for-review"],
        createdSourceClaimIds: []
      },
      "baseline_no_memory": {
        result: "miss",
        selectedKnowledgeIds: []
      },
      "baseline_simple_retrieval": {
        result: "top_match_selected",
        selectedKnowledgeIds: [
          "pattern:paste-secret-env-files-for-review",
          "pattern:secret-path-denylist-for-review-context"
        ],
        selectedMemoryIds: [
          "pattern:paste-secret-env-files-for-review",
          "pattern:secret-path-denylist-for-review-context"
        ]
      },
      "krn_memory": {
        result: "miss",
        selectedKnowledgeIds: [],
        selectedMemoryIds: [],
        selectedSourceClaimIds: [],
        requiredKnowledgeId: "pattern:paste-secret-env-files-for-review",
        exclusions: [
          {
            memoryId: "memory:pattern:paste-secret-env-files-for-review",
            reason: "adversarial unsupported memory would send secret-bearing files into review context"
          }
        ]
      },
      "reviewed_feedback_effect": {
        priorFeedbackRef: "feedback:adversarial-secret-context-rule-hurt",
        baselineNoMemoryResult: "miss",
        simpleRetrievalResult: "top_match_selected",
        simpleRetrievalTopKnowledgeId: "pattern:paste-secret-env-files-for-review",
        simpleRetrievalWeakerThanKrn: true,
        krnResult: "miss",
        proofStatus: "pass"
      }
    });
    const adversarialSourceConflictCase = result.cases.find((testCase) =>
      testCase.caseId === "adversarial-memory-source-conflict-secret-review"
    );
    expect(adversarialSourceConflictCase).toMatchObject({
      competency: "forgetting",
      heldOut: true,
      status: "pass",
      expectedKrnResult: "hit",
      negativeClass: "adversarial_memory_source_conflict",
      priorSession: {
        id: "session:adversarial-memory-source-conflict",
        applicationOutcome: "helped",
        createdMemoryIds: ["memory:pattern:secret-review-context-denylist-source-backed"],
        excludedMemoryIds: ["memory:pattern:paste-secret-env-files-for-review-source-conflict"],
        createdSourceClaimIds: ["source:secret-review-context-denylist"]
      },
      "baseline_no_memory": {
        result: "miss",
        selectedKnowledgeIds: []
      },
      "baseline_simple_retrieval": {
        result: "distractor_selected",
        selectedKnowledgeIds: [
          "pattern:paste-secret-env-files-for-review-source-conflict",
          "pattern:secret-review-context-denylist-source-backed",
          "source:secret-review-context-denylist"
        ],
        selectedMemoryIds: [
          "pattern:paste-secret-env-files-for-review-source-conflict",
          "pattern:secret-review-context-denylist-source-backed"
        ],
        selectedSourceClaimIds: ["source:secret-review-context-denylist"]
      },
      "krn_memory": {
        result: "hit",
        selectedKnowledgeIds: ["pattern:secret-review-context-denylist-source-backed"],
        selectedMemoryIds: ["pattern:secret-review-context-denylist-source-backed"],
        selectedSourceClaimIds: ["source:secret-review-context-denylist"],
        requiredKnowledgeId: "source:secret-review-context-denylist",
        supportingClaims: 1,
        supportingDocuments: 1,
        exclusions: [
          {
            memoryId: "memory:pattern:paste-secret-env-files-for-review-source-conflict",
            reason: "adversarial memory conflicts with accepted source evidence for secret-path denylisting"
          }
        ]
      },
      "krn_plan_brief": {
        result: "hit",
        requiredKnowledgeId: "source:secret-review-context-denylist",
        selectedMemoryRecordIds: ["memory:pattern:secret-review-context-denylist-source-backed"],
        selectedSourceClaimIds: ["source:secret-review-context-denylist"],
        renderedMemoryRecordIds: ["memory:pattern:secret-review-context-denylist-source-backed"],
        renderedSourceClaimIds: ["source:secret-review-context-denylist"]
      },
      "reviewed_feedback_effect": {
        priorFeedbackRef: "feedback:adversarial-memory-source-conflict-helped",
        priorEvidenceRef: "evidence:adversarial-memory-source-conflict",
        priorReviewRef: "review:adversarial-memory-source-conflict",
        baselineNoMemoryResult: "miss",
        simpleRetrievalResult: "distractor_selected",
        simpleRetrievalTopKnowledgeId: "pattern:paste-secret-env-files-for-review-source-conflict",
        simpleRetrievalWeakerThanKrn: true,
        krnResult: "hit",
        selectedMemoryIds: ["pattern:secret-review-context-denylist-source-backed"],
        selectedSourceClaimIds: ["source:secret-review-context-denylist"],
        proofStatus: "pass"
      }
    });
    expect(adversarialSourceConflictCase?.["krn_memory"].selectedKnowledgeIds).not.toContain(
      "pattern:paste-secret-env-files-for-review-source-conflict"
    );
    expect(adversarialSourceConflictCase?.["krn_memory"].selectedMemoryIds).not.toContain(
      "pattern:paste-secret-env-files-for-review-source-conflict"
    );
    const temporalStaleSourceCase = result.cases.find((testCase) =>
      testCase.caseId === "temporal-stale-source-claim-decision-link"
    );
    expect(temporalStaleSourceCase).toMatchObject({
      competency: "forgetting",
      heldOut: true,
      status: "pass",
      expectedKrnResult: "hit",
      negativeClass: "temporal_stale_source_claim",
      priorSession: {
        id: "session:temporal-stale-source-claim-decision-link",
        applicationOutcome: "helped",
        createdMemoryIds: ["memory:pattern:source-decision-edge-ranking-current"],
        excludedMemoryIds: [],
        createdSourceClaimIds: ["source:current-source-decision-edge-ranking"],
        excludedSourceClaimIds: ["source:old-crawler-first-without-decision-edge"]
      },
      "baseline_simple_retrieval": {
        result: "distractor_selected",
        selectedKnowledgeIds: [
          "source:old-crawler-first-without-decision-edge",
          "source:current-source-decision-edge-ranking",
          "pattern:source-decision-edge-ranking-current"
        ],
        selectedMemoryIds: ["pattern:source-decision-edge-ranking-current"],
        selectedSourceClaimIds: [
          "source:old-crawler-first-without-decision-edge",
          "source:current-source-decision-edge-ranking"
        ]
      },
      "krn_memory": {
        result: "hit",
        selectedKnowledgeIds: ["pattern:source-decision-edge-ranking-current"],
        selectedMemoryIds: ["pattern:source-decision-edge-ranking-current"],
        selectedSourceClaimIds: ["source:current-source-decision-edge-ranking"],
        requiredKnowledgeId: "source:current-source-decision-edge-ranking",
        supportingClaims: 1,
        supportingDocuments: 1,
        exclusions: [],
        sourceExclusions: [
          {
            sourceClaimId: "source:old-crawler-first-without-decision-edge",
            reason: "temporal stale source claim superseded by current SourceDecisionEdge-linked evidence"
          }
        ]
      },
      "krn_plan_brief": {
        result: "hit",
        requiredKnowledgeId: "source:current-source-decision-edge-ranking",
        selectedMemoryRecordIds: ["memory:pattern:source-decision-edge-ranking-current"],
        selectedSourceClaimIds: ["source:current-source-decision-edge-ranking"],
        renderedMemoryRecordIds: ["memory:pattern:source-decision-edge-ranking-current"],
        renderedSourceClaimIds: ["source:current-source-decision-edge-ranking"]
      },
      "reviewed_feedback_effect": {
        priorFeedbackRef: "feedback:temporal-stale-source-claim-decision-link-helped",
        priorEvidenceRef: "evidence:temporal-stale-source-claim-decision-link",
        priorReviewRef: "review:temporal-stale-source-claim-decision-link",
        baselineNoMemoryResult: "miss",
        simpleRetrievalResult: "distractor_selected",
        simpleRetrievalTopKnowledgeId: "source:old-crawler-first-without-decision-edge",
        simpleRetrievalWeakerThanKrn: true,
        krnResult: "hit",
        selectedMemoryIds: ["pattern:source-decision-edge-ranking-current"],
        selectedSourceClaimIds: ["source:current-source-decision-edge-ranking"],
        proofStatus: "pass"
      }
    });
    expect(temporalStaleSourceCase?.["krn_memory"].selectedSourceClaimIds).not.toContain(
      "source:old-crawler-first-without-decision-edge"
    );
    const runtimeContradictionRawCase = rawFixture.cases.find((testCase) =>
      testCase.id === "runtime-memory-source-contradiction-review-context"
    );
    expect(runtimeContradictionRawCase?.priorSession).not.toHaveProperty("excludedMemoryCards");
    expect(runtimeContradictionRawCase?.priorSession).not.toHaveProperty("excludedSourceClaims");
    const runtimeContradictionCase = result.cases.find((testCase) =>
      testCase.caseId === "runtime-memory-source-contradiction-review-context"
    );
    expect(runtimeContradictionCase).toMatchObject({
      competency: "forgetting",
      heldOut: true,
      status: "pass",
      expectedKrnResult: "hit",
      negativeClass: "runtime_memory_source_contradiction",
      priorSession: {
        id: "session:runtime-memory-source-contradiction",
        applicationOutcome: "helped",
        createdMemoryIds: ["memory:pattern:paste-secrets-from-old-memory-runtime-conflict"],
        excludedMemoryIds: ["memory:pattern:paste-secrets-from-old-memory-runtime-conflict"],
        createdSourceClaimIds: ["source:runtime-secret-context-denylist"]
      },
      "baseline_simple_retrieval": {
        result: "distractor_selected",
        selectedKnowledgeIds: [
          "pattern:paste-secrets-from-old-memory-runtime-conflict",
          "source:runtime-secret-context-denylist"
        ],
        selectedMemoryIds: ["pattern:paste-secrets-from-old-memory-runtime-conflict"],
        selectedSourceClaimIds: ["source:runtime-secret-context-denylist"]
      },
      "krn_memory": {
        result: "hit",
        selectedSourceClaimIds: ["source:runtime-secret-context-denylist"],
        requiredKnowledgeId: "source:runtime-secret-context-denylist",
        exclusions: [
          {
            memoryId: "memory:pattern:paste-secrets-from-old-memory-runtime-conflict",
            reason: "contradicts_source_claim source:runtime-secret-context-denylist: accepted source evidence forbids sending secret-bearing file bodies to review context"
          }
        ]
      },
      "reviewed_feedback_effect": {
        priorFeedbackRef: "feedback:runtime-memory-source-contradiction-helped",
        priorEvidenceRef: "evidence:runtime-memory-source-contradiction",
        priorReviewRef: "review:runtime-memory-source-contradiction",
        simpleRetrievalResult: "distractor_selected",
        simpleRetrievalTopKnowledgeId: "pattern:paste-secrets-from-old-memory-runtime-conflict",
        simpleRetrievalWeakerThanKrn: true,
        krnResult: "hit",
        selectedSourceClaimIds: ["source:runtime-secret-context-denylist"],
        proofStatus: "pass"
      }
    });
    expect(runtimeContradictionCase?.["krn_memory"].selectedMemoryIds).not.toContain(
      "pattern:paste-secrets-from-old-memory-runtime-conflict"
    );
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
      "negative memory/source cases can name their stale or adversarial class and surface explicit excluded ids with reasons"
    );
    expect(result.proof.proves).toContain(
      "baseline class and approximate selected-context readback size are reported for each case"
    );
    expect(result.proof.proves).toContain(
      "the expected memory/source id is present in rendered Codex brief context for hit cases"
    );
    expect(result.proof.proves).toContain(
      "the eval fixture can pass declared stale or unsupported memory/source evidence into the case runner, exclude it before KRN selection, and surface the explicit exclusion reason"
    );
    expect(result.proof.doesNotProve).toContain(
      "production retrieval/recall quality; this eval uses in-memory lexical token overlap"
    );
    expect(result.proof.doesNotProve).toContain(
      "that simple lexical retrieval is a strong baseline; it is a local foil for governed memory/source packaging"
    );
    expect(result.proof.doesNotProve).toContain(
      "runtime stale-memory or stale-source detection for arbitrary production MemoryRecord or SourceClaim rows"
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
