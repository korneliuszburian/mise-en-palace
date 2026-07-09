import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  classifySourceContribution,
  sourcePruneCandidateIds,
  runMemoryAdvantageEval,
  loadMemoryAdvantageEvalFixture,
  parseMemoryAdvantageEvalFixture
} from "../internal/eval/run-memory-advantage-eval.js";

const fixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/memory-advantage/remembered-standard-memory-advantage.json", import.meta.url)
);

const mutableFixtureCase = (
  fixture: { cases: Array<Record<string, unknown>> },
  caseId: string
): Record<string, unknown> => {
  const matchingCase = fixture.cases.find((testCase) => testCase["id"] === caseId);

  if (matchingCase === undefined) {
    throw new Error(`missing fixture case ${caseId}`);
  }

  return matchingCase;
};

const expectExecutionContractFixtureError = (
  mutate: (executionContract: Record<string, unknown>) => Record<string, unknown>,
  expectedMessage: string
): void => {
  const malformedContractFixture = JSON.parse(readFileSync(fixturePath, "utf8")) as {
    cases: Array<Record<string, unknown>>;
  };
  const malformedContractCase = mutableFixtureCase(
    malformedContractFixture,
    "heldout-coding-task-json-boundary"
  );
  const executionContract = malformedContractCase["executionContract"] as Record<string, unknown>;
  malformedContractCase["executionContract"] = mutate(executionContract);

  expect(() => parseMemoryAdvantageEvalFixture(malformedContractFixture)).toThrow(expectedMessage);
};

const expectInterdependentFixtureError = (
  mutate: (testCase: Record<string, unknown>) => void,
  expectedMessage: string
): void => {
  const malformedFixture = JSON.parse(readFileSync(fixturePath, "utf8")) as {
    cases: Array<Record<string, unknown>>;
  };
  const malformedCase = mutableFixtureCase(
    malformedFixture,
    "heldout-multi-session-codex-output-evidence"
  );
  mutate(malformedCase);

  expect(() => parseMemoryAdvantageEvalFixture(malformedFixture)).toThrow(expectedMessage);
};

const expectRememberedStandardChallengeFixtureError = (
  mutate: (testCase: Record<string, unknown>) => void,
  expectedMessage: string
): void => {
  const malformedFixture = JSON.parse(readFileSync(fixturePath, "utf8")) as {
    cases: Array<Record<string, unknown>>;
  };
  const malformedCase = mutableFixtureCase(
    malformedFixture,
    "neutral-single-turn-typecheck"
  );
  mutate(malformedCase);

  expect(() => parseMemoryAdvantageEvalFixture(malformedFixture)).toThrow(expectedMessage);
};

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
    expect(result.cases).toHaveLength(25);
    expect(result.corpus).toMatchObject({
      name: "remembered-standard-memory-advantage-heldout",
      caseCount: 25,
      heldOutCaseCount: 21,
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
      caseCount: 25,
      heldOutCaseCount: 21,
      expectedHitCount: 23,
      expectedMissCount: 2,
      advantageWinCount: 19,
      noAdvantageCaseCount: 4,
      advantageLossCount: 2,
      brokenPriorAdvantageCaseCount: 1,
      distractorClassCount: 7,
      codingTaskCaseCount: 1,
      executionContractCaseCount: 3,
      rememberedStandardChallengeCaseCount: 7,
      rememberedStandardChallengeWinCount: 6,
      interdependentSessionCaseCount: 2,
      sourceDisabledAblationCaseCount: 25,
      sourceRequiredCaseCount: 23,
      sourceZeroDeltaCaseCount: 0,
      sourcePruneCandidateCount: 0
    });
    expect(result.claimGuard).toMatchObject({
      broadProductClaim: "blocked",
      reason: "Neutral or loss cases mean the benchmark can support bounded claims only, not broad Memory Core superiority.",
      neutralCaseIds: [
        "neutral-short-context-external-review",
        "neutral-single-turn-typecheck",
        "neutral-retrieval-not-needed-docs",
        "neutral-breaks-codex-output-evidence-advantage"
      ]
    });
    expect(result.claimGuard.lossCaseIds).toHaveLength(2);
    expect(result.claimGuard.winCaseIds).toHaveLength(19);
    expect(result.proof.proves).toContain(
      "broad product claims are blocked when any case is neutral against or loses to the cheaper simple lexical baseline"
    );
    expect(result.metrics.totalKrnMemoryContextBytes).toBeGreaterThan(0);
    expect(result.metrics.totalKrnPlanBriefContextBytes).toBeGreaterThan(0);
    expect(result.metrics.totalRenderedBriefBytes).toBeGreaterThan(0);
    expect(result.competencies).toMatchObject({
      retrieval: {
        status: "pass",
        caseIds: [
          "retrieve-external-review-policy",
          "heldout-source-search-command-boundary",
          "neutral-short-context-external-review",
          "neutral-retrieval-not-needed-docs",
          "retained-standard-source-to-decision-chain",
          "retained-standard-no-decorative-skills"
        ]
      },
      learning: {
        status: "pass",
        caseIds: [
          "learn-company-review-standard",
          "heldout-db-project-memory-search",
          "heldout-coding-task-json-boundary",
          "heldout-multi-session-codex-output-evidence",
          "neutral-single-turn-typecheck",
          "neutral-breaks-codex-output-evidence-advantage",
          "retained-standard-narrow-verification-not-every-command",
          "heldout-coding-decision-idempotency-key"
        ]
      },
      long_range: {
        status: "pass",
        caseIds: [
          "long-range-source-authority-boundary",
          "heldout-ranking-corpus-quality",
          "retained-standard-store-backed-memory-no-markdown",
          "retained-standard-no-guard-only-treadmill",
          "retained-standard-no-worker-daemon-without-product-loop",
          "heldout-coding-decision-retry-backoff"
        ]
      },
      forgetting: {
        status: "pass",
        caseIds: [
          "forget-obsolete-mandatory-reviewer-rule",
          "adversarial-unsupported-secret-scan-rule",
          "adversarial-memory-source-conflict-secret-review",
          "temporal-stale-source-claim-decision-link",
          "runtime-memory-source-contradiction-review-context"
        ]
      }
    });

    const retrievalCase = result.cases.find((testCase) =>
      testCase.caseId === "retrieve-external-review-policy"
    );
    expect(retrievalCase).toMatchObject({
      competency: "retrieval",
      status: "pass",
      expectedKrnResult: "hit",
      baselineClass: "no_memory_no_source",
      priorSession: {
        id: "session:external-review-policy-adoption",
        evidenceRef: "evidence:external-review-policy-adoption",
        reviewRef: "review:external-review-policy-adoption",
        feedbackRef: "feedback:external-review-policy-adoption-helped",
        applicationOutcome: "helped",
        createdMemoryIds: ["memory:knowledge:external-review-advisory-after-large-slice"],
        excludedMemoryIds: [],
        distractorMemoryIds: ["memory:knowledge:close-large-migration-from-local-tests"],
        createdSourceClaimIds: ["source:external-review-advisory-after-large-slice"],
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
          "source:external-review-advisory-after-large-slice",
          "knowledge:close-large-migration-from-local-tests",
          "knowledge:external-review-advisory-after-large-slice"
        ],
        selectedMemoryIds: [
          "knowledge:close-large-migration-from-local-tests",
          "knowledge:external-review-advisory-after-large-slice"
        ],
        selectedSourceClaimIds: ["source:external-review-advisory-after-large-slice"],
        selectedContextSize: {
          bytes: expect.any(Number),
          approximateTokens: expect.any(Number),
          method: "utf8_bytes_div_4"
        }
      },
      "baseline_plan_brief": {
        baselineClass: "no_memory_no_source",
        result: "miss",
        requiredKnowledgeId: "knowledge:external-review-advisory-after-large-slice",
        selectedMemoryRecordIds: [],
        selectedSourceClaimIds: [],
        renderedMemoryRecordIds: [],
        renderedSourceClaimIds: [],
        contextInclusionCount: 1,
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
        requiredKnowledgeId: "knowledge:external-review-advisory-after-large-slice",
        selectedKnowledgeIds: ["knowledge:external-review-advisory-after-large-slice"],
        selectedMemoryIds: ["knowledge:external-review-advisory-after-large-slice"],
        selectedSources: ["catalog_file"],
        selectedSourceClaimIds: ["source:external-review-advisory-after-large-slice"],
        selectedContextSize: {
          bytes: expect.any(Number),
          approximateTokens: expect.any(Number),
          method: "utf8_bytes_div_4"
        },
        supportingClaims: 1,
        supportingDocuments: 1
      },
      "source_contribution": {
        selectedSourceClaimIds: ["source:external-review-advisory-after-large-slice"],
        sourceDisabled: {
          result: "miss",
          selectedKnowledgeIds: ["knowledge:external-review-advisory-after-large-slice"],
          selectedMemoryIds: ["knowledge:external-review-advisory-after-large-slice"],
          selectedContextSize: {
            bytes: expect.any(Number),
            approximateTokens: expect.any(Number),
            method: "utf8_bytes_div_4"
          }
        },
        contribution: "source_required_for_hit",
        zeroDeltaSourceClaimIds: [],
        pruneCandidateSourceClaimIds: []
      },
      "krn_plan_brief": {
        baselineClass: "no_memory_no_source",
        result: "hit",
        requiredKnowledgeId: "knowledge:external-review-advisory-after-large-slice",
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
      "SourceClaim evidence in the answer package for this query",
      "included SearchDocument evidence in the answer package for this query"
    ]);
    expect(retrievalCase?.["krn_memory"].selectedKnowledgeIds).toContain(
      "knowledge:external-review-advisory-after-large-slice"
    );
    expect(retrievalCase?.["krn_memory"].selectedSourceClaimIds).toContain(
      "source:external-review-advisory-after-large-slice"
    );
    expect(retrievalCase?.["baseline_simple_retrieval"].selectedMemoryIds[0]).toBe(
      "knowledge:close-large-migration-from-local-tests"
    );
    expect(retrievalCase?.["krn_memory"].selectedContextSize.bytes).toBeGreaterThan(0);
    expect(retrievalCase?.["krn_memory"].selectedContextSize.approximateTokens).toBeGreaterThan(0);
    expect(retrievalCase?.["baseline_plan_brief"].renderedBriefSize.bytes).toBeGreaterThan(0);
    expect(retrievalCase?.["krn_plan_brief"].contextSize.bytes).toBeGreaterThan(0);
    expect(retrievalCase?.["krn_plan_brief"].renderedBriefSize.approximateTokens).toBeGreaterThan(0);
    expect(retrievalCase?.["krn_plan_brief"].contextInclusionCount).toBeGreaterThanOrEqual(2);
    expect(retrievalCase?.["krn_plan_brief"].selectedMemoryRecordIds).toContain(
      "memory:knowledge:external-review-advisory-after-large-slice"
    );
    expect(retrievalCase?.["krn_plan_brief"].selectedSourceClaimIds).toContain(
      "source:external-review-advisory-after-large-slice"
    );
    expect(retrievalCase?.["krn_plan_brief"].renderedMemoryRecordIds).toContain(
      "memory:knowledge:external-review-advisory-after-large-slice"
    );
    expect(retrievalCase?.["krn_plan_brief"].renderedSourceClaimIds).toContain(
      "source:external-review-advisory-after-large-slice"
    );

    const learningCase = result.cases.find((testCase) =>
      testCase.caseId === "learn-company-review-standard"
    );
    expect(learningCase?.["krn_memory"].selectedKnowledgeIds).toContain(
      "knowledge:company-review-standard-after-eval-change"
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
      requiredKnowledgeId: "knowledge:company-review-standard-after-eval-change",
      baselineNoMemoryResult: "miss",
      simpleRetrievalResult: "top_match_selected",
      simpleRetrievalTopKnowledgeId: "knowledge:company-review-standard-after-eval-change",
      simpleRetrievalWeakerThanKrn: false,
      krnResult: "hit",
      selectedMemoryIds: ["knowledge:company-review-standard-after-eval-change"],
      selectedSourceClaimIds: ["source:company-review-standard-after-eval-change"],
      proofStatus: "pass"
    });
    expect(learningCase?.["reviewed_feedback_effect"].selectedContextSize.bytes).toBeGreaterThan(0);
    expect(learningCase?.["reviewed_feedback_effect"].planBriefContextSize.bytes).toBeGreaterThan(0);

    const heldOutLearningCase = result.cases.find((testCase) =>
      testCase.caseId === "heldout-db-project-memory-search"
    );
    expect(heldOutLearningCase?.["reviewed_feedback_effect"]).toMatchObject({
      priorFeedbackRef: "feedback:memory-search-project-selector-helped",
      priorEvidenceRef: "evidence:memory-search-project-selector",
      priorReviewRef: "review:memory-search-project-selector",
      requiredKnowledgeId: "knowledge:memory-search-explicit-project-selector",
      baselineNoMemoryResult: "miss",
      simpleRetrievalResult: "distractor_selected",
      simpleRetrievalTopKnowledgeId: "source:memory-search-explicit-project-selector",
      simpleRetrievalWeakerThanKrn: true,
      krnResult: "hit",
      selectedMemoryIds: ["knowledge:memory-search-explicit-project-selector"],
      selectedSourceClaimIds: ["source:memory-search-explicit-project-selector"],
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
        createdMemoryIds: ["memory:knowledge:unknown-first-json-metadata-boundary"],
        distractorMemoryIds: ["memory:knowledge:cast-json-record-in-command-runner"],
        createdSourceClaimIds: ["source:unknown-first-json-metadata-boundary"]
      },
      "baseline_simple_retrieval": {
        result: "distractor_selected",
        selectedKnowledgeIds: [
          "knowledge:cast-json-record-in-command-runner",
          "source:unknown-first-json-metadata-boundary",
          "knowledge:unknown-first-json-metadata-boundary"
        ],
        selectedMemoryIds: [
          "knowledge:cast-json-record-in-command-runner",
          "knowledge:unknown-first-json-metadata-boundary"
        ],
        selectedSourceClaimIds: ["source:unknown-first-json-metadata-boundary"]
      },
      "krn_memory": {
        result: "hit",
        selectedMemoryIds: ["knowledge:cast-json-record-in-command-runner"],
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
            "knowledge:cast-json-record-in-command-runner",
            "source:unknown-first-json-metadata-boundary",
            "knowledge:unknown-first-json-metadata-boundary"
          ]
        },
        krn: {
          decisionId: "decision:unknown-first-parser",
          selectedKnowledgeIds: [
            "source:unknown-first-json-metadata-boundary",
            "knowledge:cast-json-record-in-command-runner"
          ],
          selectedMemoryIds: ["knowledge:cast-json-record-in-command-runner"],
          selectedSourceClaimIds: ["source:unknown-first-json-metadata-boundary"]
        },
        status: "pass"
      },
      "execution_contract_decision": {
        contractId: "execution-contract:cli-json-metadata-boundary",
        objective: "Implement CLI JSON metadata readback for a command that receives untrusted parsed JSON.",
        expectedKrnContractId: "contract:unknown-first-parser",
        derivationOrder: "source_claims_first",
        proof: "The baseline contract and KRN contract are derived from selected ids; KRN evaluates accepted source claims before retained memory knowledge.",
        doesNotProve: "This does not prove Codex implemented the contract, only that KRN memory/source changes the deterministic execution-contract decision.",
        selectedContextSize: {
          bytes: expect.any(Number),
          approximateTokens: expect.any(Number),
          method: "utf8_bytes_div_4"
        },
        baseline: {
          baselineClass: "simple_lexical_retrieval",
          contractId: "contract:cast-json-record",
          decisionOrderedKnowledgeIds: [
            "knowledge:cast-json-record-in-command-runner",
            "source:unknown-first-json-metadata-boundary",
            "knowledge:unknown-first-json-metadata-boundary"
          ],
          selectedMemoryIds: [
            "knowledge:cast-json-record-in-command-runner",
            "knowledge:unknown-first-json-metadata-boundary"
          ],
          selectedSourceClaimIds: ["source:unknown-first-json-metadata-boundary"]
        },
        krn: {
          contractId: "contract:unknown-first-parser",
          decisionOrderedKnowledgeIds: [
            "source:unknown-first-json-metadata-boundary",
            "knowledge:cast-json-record-in-command-runner"
          ],
          selectedMemoryIds: ["knowledge:cast-json-record-in-command-runner"],
          selectedSourceClaimIds: ["source:unknown-first-json-metadata-boundary"]
        },
        status: "pass"
      },
      "reviewed_feedback_effect": {
        priorFeedbackRef: "feedback:unknown-first-json-metadata-boundary-helped",
        priorEvidenceRef: "evidence:unknown-first-json-metadata-boundary",
        priorReviewRef: "review:unknown-first-json-metadata-boundary",
        simpleRetrievalTopKnowledgeId: "knowledge:cast-json-record-in-command-runner",
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
    expect(codingTaskCase?.["execution_contract_decision"]?.baseline.contractId).not.toBe(
      codingTaskCase?.["execution_contract_decision"]?.krn.contractId
    );
    expect(codingTaskCase?.["execution_contract_decision"]?.selectedContextSize.bytes).toBeGreaterThan(0);

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
    const nonHeldOutHitCases = result.cases.filter((testCase) =>
      !testCase.heldOut && testCase.expectedKrnResult === "hit"
    );
    expect(heldOutHitCases.map((testCase) => testCase.caseId)).toEqual([
      "adversarial-memory-source-conflict-secret-review",
      "temporal-stale-source-claim-decision-link",
      "runtime-memory-source-contradiction-review-context",
      "heldout-source-search-command-boundary",
      "heldout-db-project-memory-search",
      "heldout-ranking-corpus-quality",
      "heldout-coding-task-json-boundary",
      "heldout-multi-session-codex-output-evidence",
      "neutral-short-context-external-review",
      "neutral-single-turn-typecheck",
      "neutral-retrieval-not-needed-docs",
      "neutral-breaks-codex-output-evidence-advantage",
      "retained-standard-store-backed-memory-no-markdown",
      "retained-standard-source-to-decision-chain",
      "retained-standard-narrow-verification-not-every-command",
      "retained-standard-no-guard-only-treadmill",
      "retained-standard-no-worker-daemon-without-product-loop",
      "retained-standard-no-decorative-skills",
      "heldout-coding-decision-idempotency-key",
      "heldout-coding-decision-retry-backoff"
    ]);
    expect(nonHeldOutHitCases.map((testCase) => testCase.caseId)).toEqual([
      "retrieve-external-review-policy",
      "learn-company-review-standard",
      "long-range-source-authority-boundary"
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
    const advantageWinningHeldOutHitCases = heldOutHitCases.filter((testCase) =>
      testCase.advantageDelta.result === "win"
    );
    expect(advantageWinningHeldOutHitCases.every((testCase) =>
      testCase["baseline_no_memory"].result === "miss" &&
      testCase["baseline_simple_retrieval"].result === "distractor_selected" &&
      testCase["krn_memory"].result === "hit" &&
      testCase["krn_plan_brief"].result === "hit"
    )).toBe(true);
    expect(advantageWinningHeldOutHitCases.map((testCase) =>
      testCase["krn_memory"].requiredKnowledgeId
    )).toEqual([
      "source:secret-review-context-denylist",
      "source:current-source-decision-edge-ranking",
      "source:runtime-secret-context-denylist",
      "knowledge:source-search-command-boundary",
      "knowledge:memory-search-explicit-project-selector",
      "knowledge:ranking-corpus-quality-readback",
      "source:unknown-first-json-metadata-boundary",
      "source:codex-output-evidence-shape-required",
      "source:store-backed-memory-no-markdown",
      "source:source-to-decision-chain-required",
      "source:narrow-verification-policy",
      "source:no-guard-only-treadmill",
      "source:no-worker-daemon-without-product-loop",
      "source:no-decorative-skills",
      "source:idempotency-key-on-writes",
      "source:bounded-exponential-backoff-jitter"
    ]);
    const retainedStandardChallengeCases = result.cases.filter((testCase) =>
      testCase.rememberedStandardChallenge !== undefined
    );
    expect(retainedStandardChallengeCases).toHaveLength(7);
    expect(retainedStandardChallengeCases.map((testCase) => testCase.caseId)).toEqual([
      "neutral-single-turn-typecheck",
      "retained-standard-store-backed-memory-no-markdown",
      "retained-standard-source-to-decision-chain",
      "retained-standard-narrow-verification-not-every-command",
      "retained-standard-no-guard-only-treadmill",
      "retained-standard-no-worker-daemon-without-product-loop",
      "retained-standard-no-decorative-skills"
    ]);
    expect(retainedStandardChallengeCases.every((testCase) =>
      testCase["baseline_no_memory"].result === "miss" &&
      testCase["krn_memory"].result === "hit" &&
      testCase.rememberedStandardChallenge?.standardId.startsWith("standard:") === true &&
      testCase.rememberedStandardChallenge.expectedDecision.length > 0 &&
      testCase.rememberedStandardChallenge.baselineFailureMode.length > 0 &&
      testCase.rememberedStandardChallenge.falsifier.length > 0
    )).toBe(true);
    const retainedStandardChallengeWins = retainedStandardChallengeCases.filter((testCase) =>
      testCase.advantageDelta.result === "win"
    );
    expect(retainedStandardChallengeWins).toHaveLength(6);
    expect(retainedStandardChallengeWins.every((testCase) =>
      testCase["baseline_simple_retrieval"].result === "distractor_selected"
    )).toBe(true);
    const retainedStandardNeutralCase = retainedStandardChallengeCases.find((testCase) =>
      testCase.caseId === "neutral-single-turn-typecheck"
    );
    expect(retainedStandardNeutralCase?.advantageDelta).toMatchObject({
      result: "neutral",
      simpleRetrievalAlreadySufficient: true
    });
    const noAdvantageCases = result.cases.filter((testCase) =>
      testCase.advantageDelta.result === "neutral"
    );
    expect(noAdvantageCases.map((testCase) => testCase.caseId)).toEqual([
      "neutral-short-context-external-review",
      "neutral-single-turn-typecheck",
      "neutral-retrieval-not-needed-docs",
      "neutral-breaks-codex-output-evidence-advantage"
    ]);
    expect(noAdvantageCases.every((testCase) =>
      testCase["baseline_simple_retrieval"].result === "top_match_selected" &&
      testCase["krn_memory"].result === "hit" &&
      testCase["source_contribution"].contribution === "source_required_for_hit" &&
      testCase["krn_plan_brief"].result === "hit" &&
      testCase.advantageDelta.simpleRetrievalAlreadySufficient &&
      testCase.advantageDelta.limitation?.classification === "baseline_already_sufficient"
    )).toBe(true);
    expect(noAdvantageCases.map((testCase) => testCase.advantageDelta.limitation?.scope)).toEqual([
      "neutral_no_advantage",
      "neutral_no_advantage",
      "neutral_no_advantage",
      "broken_prior_advantage"
    ]);

    const brokenPriorCase = noAdvantageCases.find((testCase) =>
      testCase.falsificationClass === "breaks_interdependent_advantage"
    );
    expect(brokenPriorCase?.advantageDelta.limitation).toMatchObject({
      scope: "broken_prior_advantage",
      classification: "baseline_already_sufficient",
      proof: "simpleRetrieval=top_match_selected; krn=hit; expected=hit"
    });
    expect(brokenPriorCase?.advantageDelta.limitation?.reason).toContain(
      "breaks_interdependent_advantage"
    );

    const interdependentCase = result.cases.find((testCase) =>
      testCase.caseId === "heldout-multi-session-codex-output-evidence"
    );
    expect(interdependentCase).toMatchObject({
      competency: "learning",
      heldOut: true,
      interdependentSession: true,
      status: "pass",
      expectedKrnResult: "hit",
      priorSession: {
        id: "session:codex-output-evidence-shape-review",
        evidenceRef: "evidence:codex-output-evidence-shape-review",
        reviewRef: "review:external-f2fw-r1-r2",
        feedbackRef: "feedback:codex-output-evidence-shape-helped",
        applicationOutcome: "helped",
        createdMemoryIds: ["memory:knowledge:codex-output-evidence-shape-required"],
        distractorMemoryIds: ["memory:knowledge:summary-only-krn-context-claim"],
        createdSourceClaimIds: ["source:codex-output-evidence-shape-required"]
      },
      "baseline_no_memory": {
        result: "miss"
      },
      "baseline_simple_retrieval": {
        result: "distractor_selected",
        selectedKnowledgeIds: [
          "knowledge:summary-only-krn-context-claim",
          "source:codex-output-evidence-shape-required",
          "knowledge:codex-output-evidence-shape-required"
        ]
      },
      "krn_memory": {
        result: "hit",
        requiredKnowledgeId: "source:codex-output-evidence-shape-required",
        selectedKnowledgeIds: ["source:codex-output-evidence-shape-required"],
        selectedSourceClaimIds: ["source:codex-output-evidence-shape-required"]
      },
      "execution_contract_decision": {
        contractId: "execution-contract:codex-output-evidence-shape",
        expectedKrnContractId: "contract:evidence-shaped-krn-context-claim",
        baseline: {
          contractId: "contract:summary-only-krn-context-claim"
        },
        krn: {
          contractId: "contract:evidence-shaped-krn-context-claim",
          selectedSourceClaimIds: ["source:codex-output-evidence-shape-required"]
        },
        status: "pass"
      },
      "reviewed_feedback_effect": {
        priorFeedbackRef: "feedback:codex-output-evidence-shape-helped",
        priorEvidenceRef: "evidence:codex-output-evidence-shape-review",
        priorReviewRef: "review:external-f2fw-r1-r2",
        requiredKnowledgeId: "source:codex-output-evidence-shape-required",
        baselineNoMemoryResult: "miss",
        simpleRetrievalResult: "distractor_selected",
        simpleRetrievalTopKnowledgeId: "knowledge:summary-only-krn-context-claim",
        simpleRetrievalWeakerThanKrn: true,
        krnResult: "hit",
        proofStatus: "pass"
      }
    });
    expect(interdependentCase?.["execution_contract_decision"]?.baseline.contractId).not.toBe(
      interdependentCase?.["execution_contract_decision"]?.krn.contractId
    );

    const forgettingCase = result.cases.find((testCase) =>
      testCase.caseId === "forget-obsolete-mandatory-reviewer-rule"
    );
    expect(forgettingCase).toMatchObject({
      competency: "forgetting",
      status: "pass",
      expectedKrnResult: "miss",
      negativeClass: "stale_memory",
      priorSession: {
        id: "session:obsolete-mandatory-reviewer-rule",
        applicationOutcome: "hurt",
        createdMemoryIds: ["memory:knowledge:routine-dependency-pin-cleanup"],
        excludedMemoryIds: ["memory:knowledge:obsolete-mandatory-reviewer-rule"],
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
        selectedKnowledgeIds: ["knowledge:obsolete-mandatory-reviewer-rule"],
        selectedMemoryIds: ["knowledge:obsolete-mandatory-reviewer-rule"],
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
        writtenKnowledgeIds: ["knowledge:routine-dependency-pin-cleanup"],
        requiredKnowledgeId: "knowledge:obsolete-mandatory-reviewer-rule",
        supportingClaims: 0,
        supportingDocuments: 0,
        exclusions: [
          {
            memoryId: "memory:knowledge:obsolete-mandatory-reviewer-rule",
            reason: "stale memory contradicted by current external-review advisory policy"
          }
        ]
      },
      "source_contribution": {
        selectedSourceClaimIds: [],
        sourceDisabled: {
          result: "miss",
          selectedKnowledgeIds: []
        },
        contribution: "no_source_selected",
        zeroDeltaSourceClaimIds: [],
        pruneCandidateSourceClaimIds: []
      },
      "krn_plan_brief": {
        result: "miss",
        requiredKnowledgeId: "knowledge:obsolete-mandatory-reviewer-rule"
      },
      "reviewed_feedback_effect": {
        priorFeedbackRef: "feedback:obsolete-mandatory-reviewer-rule-hurt",
        applicationOutcome: "hurt",
        requiredKnowledgeId: "knowledge:obsolete-mandatory-reviewer-rule",
        baselineNoMemoryResult: "miss",
        simpleRetrievalResult: "top_match_selected",
        simpleRetrievalTopKnowledgeId: "knowledge:obsolete-mandatory-reviewer-rule",
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
        createdMemoryIds: ["memory:knowledge:secret-path-denylist-for-review-context"],
        excludedMemoryIds: ["memory:knowledge:paste-secret-env-files-for-review"],
        createdSourceClaimIds: []
      },
      "baseline_no_memory": {
        result: "miss",
        selectedKnowledgeIds: []
      },
      "baseline_simple_retrieval": {
        result: "top_match_selected",
        selectedKnowledgeIds: [
          "knowledge:paste-secret-env-files-for-review",
          "knowledge:secret-path-denylist-for-review-context"
        ],
        selectedMemoryIds: [
          "knowledge:paste-secret-env-files-for-review",
          "knowledge:secret-path-denylist-for-review-context"
        ]
      },
      "krn_memory": {
        result: "miss",
        selectedKnowledgeIds: [],
        selectedMemoryIds: [],
        selectedSourceClaimIds: [],
        requiredKnowledgeId: "knowledge:paste-secret-env-files-for-review",
        exclusions: [
          {
            memoryId: "memory:knowledge:paste-secret-env-files-for-review",
            reason: "adversarial unsupported memory would send secret-bearing files into review context"
          }
        ]
      },
      "reviewed_feedback_effect": {
        priorFeedbackRef: "feedback:adversarial-secret-context-rule-hurt",
        baselineNoMemoryResult: "miss",
        simpleRetrievalResult: "top_match_selected",
        simpleRetrievalTopKnowledgeId: "knowledge:paste-secret-env-files-for-review",
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
        createdMemoryIds: ["memory:knowledge:secret-review-context-denylist-source-backed"],
        excludedMemoryIds: ["memory:knowledge:paste-secret-env-files-for-review-source-conflict"],
        createdSourceClaimIds: ["source:secret-review-context-denylist"]
      },
      "baseline_no_memory": {
        result: "miss",
        selectedKnowledgeIds: []
      },
      "baseline_simple_retrieval": {
        result: "distractor_selected",
        selectedKnowledgeIds: [
          "knowledge:paste-secret-env-files-for-review-source-conflict",
          "knowledge:secret-review-context-denylist-source-backed",
          "source:secret-review-context-denylist"
        ],
        selectedMemoryIds: [
          "knowledge:paste-secret-env-files-for-review-source-conflict",
          "knowledge:secret-review-context-denylist-source-backed"
        ],
        selectedSourceClaimIds: ["source:secret-review-context-denylist"]
      },
      "krn_memory": {
        result: "hit",
        selectedKnowledgeIds: ["knowledge:secret-review-context-denylist-source-backed"],
        selectedMemoryIds: ["knowledge:secret-review-context-denylist-source-backed"],
        selectedSourceClaimIds: ["source:secret-review-context-denylist"],
        requiredKnowledgeId: "source:secret-review-context-denylist",
        supportingClaims: 1,
        supportingDocuments: 1,
        exclusions: [
          {
            memoryId: "memory:knowledge:paste-secret-env-files-for-review-source-conflict",
            reason: "adversarial memory conflicts with accepted source evidence for secret-path denylisting"
          }
        ]
      },
      "krn_plan_brief": {
        result: "hit",
        requiredKnowledgeId: "source:secret-review-context-denylist",
        selectedMemoryRecordIds: ["memory:knowledge:secret-review-context-denylist-source-backed"],
        selectedSourceClaimIds: ["source:secret-review-context-denylist"],
        renderedMemoryRecordIds: ["memory:knowledge:secret-review-context-denylist-source-backed"],
        renderedSourceClaimIds: ["source:secret-review-context-denylist"]
      },
      "reviewed_feedback_effect": {
        priorFeedbackRef: "feedback:adversarial-memory-source-conflict-helped",
        priorEvidenceRef: "evidence:adversarial-memory-source-conflict",
        priorReviewRef: "review:adversarial-memory-source-conflict",
        baselineNoMemoryResult: "miss",
        simpleRetrievalResult: "distractor_selected",
        simpleRetrievalTopKnowledgeId: "knowledge:paste-secret-env-files-for-review-source-conflict",
        simpleRetrievalWeakerThanKrn: true,
        krnResult: "hit",
        selectedMemoryIds: ["knowledge:secret-review-context-denylist-source-backed"],
        selectedSourceClaimIds: ["source:secret-review-context-denylist"],
        proofStatus: "pass"
      }
    });
    expect(adversarialSourceConflictCase?.["krn_memory"].selectedKnowledgeIds).not.toContain(
      "knowledge:paste-secret-env-files-for-review-source-conflict"
    );
    expect(adversarialSourceConflictCase?.["krn_memory"].selectedMemoryIds).not.toContain(
      "knowledge:paste-secret-env-files-for-review-source-conflict"
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
        createdMemoryIds: ["memory:knowledge:source-decision-edge-ranking-current"],
        excludedMemoryIds: [],
        createdSourceClaimIds: ["source:current-source-decision-edge-ranking"],
        excludedSourceClaimIds: ["source:old-crawler-first-without-decision-edge"]
      },
      "baseline_simple_retrieval": {
        result: "distractor_selected",
        selectedKnowledgeIds: [
          "source:old-crawler-first-without-decision-edge",
          "source:current-source-decision-edge-ranking",
          "knowledge:source-decision-edge-ranking-current"
        ],
        selectedMemoryIds: ["knowledge:source-decision-edge-ranking-current"],
        selectedSourceClaimIds: [
          "source:old-crawler-first-without-decision-edge",
          "source:current-source-decision-edge-ranking"
        ]
      },
      "krn_memory": {
        result: "hit",
        selectedKnowledgeIds: ["knowledge:source-decision-edge-ranking-current"],
        selectedMemoryIds: ["knowledge:source-decision-edge-ranking-current"],
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
        selectedMemoryRecordIds: ["memory:knowledge:source-decision-edge-ranking-current"],
        selectedSourceClaimIds: ["source:current-source-decision-edge-ranking"],
        renderedMemoryRecordIds: ["memory:knowledge:source-decision-edge-ranking-current"],
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
        selectedMemoryIds: ["knowledge:source-decision-edge-ranking-current"],
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
    expect(runtimeContradictionRawCase?.priorSession).not.toHaveProperty("excludedMemoryReadModels");
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
        createdMemoryIds: ["memory:knowledge:paste-secrets-from-old-memory-runtime-conflict"],
        excludedMemoryIds: ["memory:knowledge:paste-secrets-from-old-memory-runtime-conflict"],
        createdSourceClaimIds: ["source:runtime-secret-context-denylist"]
      },
      "baseline_simple_retrieval": {
        result: "distractor_selected",
        selectedKnowledgeIds: [
          "knowledge:paste-secrets-from-old-memory-runtime-conflict",
          "source:runtime-secret-context-denylist"
        ],
        selectedMemoryIds: ["knowledge:paste-secrets-from-old-memory-runtime-conflict"],
        selectedSourceClaimIds: ["source:runtime-secret-context-denylist"]
      },
      "krn_memory": {
        result: "hit",
        selectedSourceClaimIds: ["source:runtime-secret-context-denylist"],
        requiredKnowledgeId: "source:runtime-secret-context-denylist",
        exclusions: [
          {
            memoryId: "memory:knowledge:paste-secrets-from-old-memory-runtime-conflict",
            reason: "contradicts_source_claim source:runtime-secret-context-denylist: accepted source evidence forbids sending secret-bearing file bodies to review context"
          }
        ]
      },
      "reviewed_feedback_effect": {
        priorFeedbackRef: "feedback:runtime-memory-source-contradiction-helped",
        priorEvidenceRef: "evidence:runtime-memory-source-contradiction",
        priorReviewRef: "review:runtime-memory-source-contradiction",
        simpleRetrievalResult: "distractor_selected",
        simpleRetrievalTopKnowledgeId: "knowledge:paste-secrets-from-old-memory-runtime-conflict",
        simpleRetrievalWeakerThanKrn: true,
        krnResult: "hit",
        selectedSourceClaimIds: ["source:runtime-secret-context-denylist"],
        proofStatus: "pass"
      }
    });
    expect(runtimeContradictionCase?.["krn_memory"].selectedMemoryIds).not.toContain(
      "knowledge:paste-secrets-from-old-memory-runtime-conflict"
    );
    expect(result.proof.proves).toContain(
      "the memory advantage output reports corpus metadata, per-case baseline failure rationale, and aggregate context-size cost proxies"
    );
    expect(result.proof.proves).toContain(
      "a priorSession fixture supplies evidence, review, feedback refs, and nested learned memory/source inputs before the later task can hit"
    );
    expect(result.proof.proves).toContain(
      "at least one interdependent multi-session case marks that Session B depends on Session A evidence or feedback"
    );
    expect(result.proof.proves).toContain(
      "reviewed feedback refs are reported beside the later task query, selected memory/source ids, baseline outcome, KRN outcome, and context-size cost"
    );
    expect(result.proof.proves).toContain(
      "a simple lexical retrieval baseline is reported so no-memory misses are not the only comparator"
    );
    expect(result.proof.proves).toContain(
      "non-winning advantage deltas carry limitation classifications with deterministic simple-retrieval, KRN, and expected-result proof tuples"
    );
    expect(result.proof.proves).toContain(
      "remembered-standard memory/source inputs from the in-memory eval store are selected through real brain/source command paths while distractors can be present"
    );
    expect(result.proof.proves).toContain(
      "retained-standard challenge cases state the remembered standard, expected decision, baseline failure mode, and falsifier before counting as memory advantage evidence"
    );
    expect(result.proof.proves).toContain(
      "at least one remembered-standard case fails the no-memory plan/brief baseline and passes when KRN memory/source context reaches the rendered Codex brief"
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
    expect(result.proof.proves).toContain(
      "execution-contract cases can report baseline and KRN contract choices mechanically derived from selected memory/source ids"
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
      "readModel or source-claim content payload size; selected-context size measures selection identifier overhead only"
    );
    expect(result.proof.doesNotProve).toContain("automatic Memory Core promotion from evidence or feedback");
    expect(result.proof.doesNotProve).toContain("live Postgres runtime behavior");
    expect(result.proof.doesNotProve).toContain("arbitrary task superiority over vanilla Codex");
    expect(result.proof.doesNotProve).toContain(
      "that Codex would implement the reported execution contract without a separate execution-output evidence-shape gate"
    );
    expect(result.proof.doesNotProve).toContain("arbitrary Codex output quality");
  });

  it("classifies source contribution ablation signals", () => {
    expect(classifySourceContribution({
      selectedSource: true,
      krnHit: true,
      sourceDisabledHit: false,
      sourceDisabledUseful: false,
      advantageWin: true
    })).toBe("source_required_for_hit");
    expect(classifySourceContribution({
      selectedSource: true,
      krnHit: true,
      sourceDisabledHit: true,
      sourceDisabledUseful: true,
      advantageWin: true
    })).toBe("memory_only_sufficient");
    expect(classifySourceContribution({
      selectedSource: true,
      krnHit: true,
      sourceDisabledHit: true,
      sourceDisabledUseful: true,
      advantageWin: false
    })).toBe("source_zero_delta");
    expect(classifySourceContribution({
      selectedSource: true,
      krnHit: false,
      sourceDisabledHit: false,
      sourceDisabledUseful: true,
      advantageWin: false
    })).toBe("source_noise");
    expect(classifySourceContribution({
      selectedSource: false,
      krnHit: true,
      sourceDisabledHit: true,
      sourceDisabledUseful: true,
      advantageWin: true
    })).toBe("no_source_selected");
  });

  it("marks zero-delta and noise source contribution as prune candidates", () => {
    const selectedSourceClaimIds = ["source:zero-delta", "source:noise"];

    expect(sourcePruneCandidateIds("source_zero_delta", selectedSourceClaimIds)).toEqual(selectedSourceClaimIds);
    expect(sourcePruneCandidateIds("source_noise", selectedSourceClaimIds)).toEqual(selectedSourceClaimIds);
    expect(sourcePruneCandidateIds("source_required_for_hit", selectedSourceClaimIds)).toEqual([]);
    expect(sourcePruneCandidateIds("memory_only_sufficient", selectedSourceClaimIds)).toEqual([]);
    expect(sourcePruneCandidateIds("no_source_selected", selectedSourceClaimIds)).toEqual([]);
  });

  it("rejects execution-contract fixture drift before evaluation", () => {
    expectExecutionContractFixtureError((executionContract) => ({
      ...executionContract,
      expectedKrnContractId: "contract:missing"
    }),
      "cases[11].executionContract.expectedKrnContractId must reference one of the declared option ids"
    );
    expectExecutionContractFixtureError((executionContract) => {
      const missingExpectedContract = { ...executionContract };
      delete missingExpectedContract["expectedKrnContractId"];
      return missingExpectedContract;
    }, "cases[11].executionContract.expectedKrnContractId must be a non-empty string");
    expectExecutionContractFixtureError((executionContract) => ({
      ...executionContract,
      defaultContractId: "contract:missing"
    }), "cases[11].executionContract.defaultContractId must reference one of the declared option ids");
    expectExecutionContractFixtureError((executionContract) => ({
      ...executionContract,
      defaultContractId: "contract:unknown-first-parser"
    }), "cases[11].executionContract default and expected KRN contracts must differ");
  });

  it("rejects interdependent-session fixture drift before evaluation", () => {
    expectInterdependentFixtureError((testCase) => {
      testCase["heldOut"] = false;
    }, "cases[12].interdependentSession cases must be held out");
    expectInterdependentFixtureError((testCase) => {
      delete testCase["executionContract"];
    }, "cases[12].interdependentSession cases must declare executionContract");
    expectInterdependentFixtureError((testCase) => {
      delete testCase["priorSession"];
    }, "cases[12].priorSession must be an object");
  });

  it("rejects remembered-standard challenge fixture drift before evaluation", () => {
    expectRememberedStandardChallengeFixtureError((testCase) => {
      testCase["rememberedStandardChallenge"] = "not-object";
    }, "cases[14].rememberedStandardChallenge must be an object");
    expectRememberedStandardChallengeFixtureError((testCase) => {
      const challenge = testCase["rememberedStandardChallenge"] as Record<string, unknown>;
      delete challenge["standardId"];
    }, "cases[14].rememberedStandardChallenge.standardId must be a non-empty string");
    expectRememberedStandardChallengeFixtureError((testCase) => {
      const challenge = testCase["rememberedStandardChallenge"] as Record<string, unknown>;
      delete challenge["expectedDecision"];
    }, "cases[14].rememberedStandardChallenge.expectedDecision must be a non-empty string");
    expectRememberedStandardChallengeFixtureError((testCase) => {
      const challenge = testCase["rememberedStandardChallenge"] as Record<string, unknown>;
      delete challenge["baselineFailureMode"];
    }, "cases[14].rememberedStandardChallenge.baselineFailureMode must be a non-empty string");
    expectRememberedStandardChallengeFixtureError((testCase) => {
      const challenge = testCase["rememberedStandardChallenge"] as Record<string, unknown>;
      delete challenge["falsifier"];
    }, "cases[14].rememberedStandardChallenge.falsifier must be a non-empty string");
  });
});
