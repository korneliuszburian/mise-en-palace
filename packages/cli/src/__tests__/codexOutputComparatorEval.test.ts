import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  runCodexOutputComparatorEval
} from "../runCodexOutputComparatorEval.js";
import {
  loadMemoryAdvantageEvalFixture
} from "../runMemoryAdvantageEval.js";

const fixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/memory-advantage/company-pattern-memory-advantage.json", import.meta.url)
);

describe("runCodexOutputComparatorEval", () => {
  it("compares vanilla and KRN-grounded output contracts without live Codex", async () => {
    const result = await runCodexOutputComparatorEval(loadMemoryAdvantageEvalFixture(fixturePath));

    expect(result.kind).toBe("krn.codexOutputComparator.eval.v1");
    expect(result.status).toBe("pass");
    expect(result.sourceEvalKind).toBe("krn.memoryAdvantage.eval.v1");
    expect(result.metrics).toMatchObject({
      comparisonCount: 50,
      sourcePromptCount: 25,
      passedCaseCount: 50,
      failedCaseCount: 0,
      baselineMissingEvidenceCount: 50,
      krnValidEvidenceShapeCount: 50,
      contentChangedCount: 42,
      executionContractComparisonCount: 3,
      executionContractChangedCount: 2,
      advantageWinPromptCount: 19,
      neutralPromptCount: 4,
      lossPromptCount: 2,
      comparisonWinCount: 38,
      comparisonNeutralCount: 8,
      comparisonLossCount: 4
    });
    expect(result.metrics.totalSelectedContextBytes).toBeGreaterThan(0);
    expect(result.proof.proves).toContain(
      "baseline output claims fail the shared Codex-output evidence-shape validator when evidence refs are missing"
    );
    expect(result.proof.doesNotProve).toContain("live Codex execution");

    const interdependentCase = result.cases.find((testCase) =>
      testCase.comparisonId === "heldout-multi-session-codex-output-evidence:simple_retrieval"
    );
    expect(interdependentCase).toMatchObject({
      caseId: "heldout-multi-session-codex-output-evidence",
      baselineKind: "simple_retrieval",
      status: "pass",
      usefulnessLabel: "krn_improves_over_simple_retrieval",
      contentDelta: "contract_changed",
      contractSource: "execution_contract",
      advantageDelta: {
        result: "win"
      },
      baseline: {
        contractId: "contract:summary-only-krn-context-claim",
        evidenceShape: "missing_evidence",
        selectedKnowledgeIds: [
          "pattern:summary-only-krn-context-claim",
          "source:codex-output-evidence-shape-required",
          "pattern:codex-output-evidence-shape-required"
        ]
      },
      krn: {
        contractId: "contract:evidence-shaped-krn-context-claim",
        evidenceShape: "valid",
        selectedKnowledgeIds: ["source:codex-output-evidence-shape-required"],
        selectedMemoryIds: [],
        selectedSourceClaimIds: ["source:codex-output-evidence-shape-required"]
      },
      expectedEvidenceShape: {
        requiresEvidenceRefs: true,
        requiresVerification: true,
        requiresChangedFiles: true,
        requiresDoesNotProve: true
      },
      selectedContextSize: {
        method: "utf8_bytes_div_4"
      },
      exclusions: {
        memoryIds: [],
        sourceClaimIds: []
      },
      renderedBriefHit: true
    });
    expect(interdependentCase?.baseline.validationFindings).toContain(
      "evidenceRefs are required for claimed KRN output evidence"
    );
    expect(interdependentCase?.krn.validationFindings).toEqual([]);
    expect(interdependentCase?.selectedContextSize.bytes).toBeGreaterThan(0);
    expect(interdependentCase?.doesNotProve).toContain("live Codex");

    const neutralInterdependentCase = result.cases.find((testCase) =>
      testCase.comparisonId === "neutral-breaks-codex-output-evidence-advantage:simple_retrieval"
    );
    expect(neutralInterdependentCase).toMatchObject({
      caseId: "neutral-breaks-codex-output-evidence-advantage",
      baselineKind: "simple_retrieval",
      status: "pass",
      usefulnessLabel: "baseline_already_sufficient",
      contentDelta: "baseline_sufficient",
      contractSource: "execution_contract",
      advantageDelta: {
        result: "neutral",
        simpleRetrievalAlreadySufficient: true
      },
      baseline: {
        contractId: "contract:neutral-evidence-shaped-claim",
        selectedKnowledgeIds: [
          "pattern:neutral-codex-output-evidence-shape-required",
          "source:neutral-codex-output-evidence-shape-required",
          "pattern:neutral-summary-only-claim"
        ]
      },
      krn: {
        contractId: "contract:neutral-evidence-shaped-claim",
        selectedSourceClaimIds: ["source:neutral-codex-output-evidence-shape-required"]
      }
    });
    expect(result.cases.filter((testCase) =>
      testCase.usefulnessLabel === "baseline_already_sufficient"
    )).toHaveLength(4);
    expect(result.cases.filter((testCase) =>
      testCase.usefulnessLabel === "krn_refuses_harmful_retrieval"
    )).toHaveLength(4);
    expect(result.cases.filter((testCase) =>
      testCase.usefulnessLabel === "loss_reported"
    )).toHaveLength(4);

    const lossCase = result.cases.find((testCase) =>
      testCase.comparisonId === "learn-company-review-standard:no_memory"
    );
    expect(lossCase).toMatchObject({
      usefulnessLabel: "loss_reported",
      contentDelta: "selection_changed",
      advantageDelta: {
        result: "loss"
      }
    });
  });
});
