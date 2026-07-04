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
      caseCount: 2,
      passedCaseCount: 2,
      failedCaseCount: 0,
      baselineMissingEvidenceCount: 2,
      krnValidEvidenceShapeCount: 2,
      contractChangedCount: 2
    });
    expect(result.metrics.totalSelectedContextBytes).toBeGreaterThan(0);
    expect(result.proof.proves).toContain(
      "baseline output claims fail the shared Codex-output evidence-shape validator when evidence refs are missing"
    );
    expect(result.proof.doesNotProve).toContain("live Codex execution");

    const interdependentCase = result.cases.find((testCase) =>
      testCase.caseId === "heldout-multi-session-codex-output-evidence"
    );
    expect(interdependentCase).toMatchObject({
      status: "pass",
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
  });
});
