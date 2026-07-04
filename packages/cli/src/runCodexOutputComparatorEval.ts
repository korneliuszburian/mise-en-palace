import {
  validateClaimedCodexOutputEvidence
} from "@krn/harness";
import type {
  ClaimedCodexOutputEvidence
} from "@krn/harness";
import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./evalMain.js";
import {
  loadMemoryAdvantageEvalFixture,
  runMemoryAdvantageEval
} from "./runMemoryAdvantageEval.js";
import type {
  MemoryAdvantageEvalFixture,
  MemoryAdvantageEvalResult
} from "./runMemoryAdvantageEval.js";

type ComparatorStatus = "pass" | "fail";
type EvidenceShapeStatus = "valid" | "missing_evidence";

interface CodexOutputComparatorCaseReadback {
  readonly caseId: string;
  readonly objective: string;
  readonly status: ComparatorStatus;
  readonly baseline: {
    readonly contractId: string;
    readonly evidenceShape: EvidenceShapeStatus;
    readonly validationFindings: readonly string[];
    readonly selectedKnowledgeIds: readonly string[];
  };
  readonly krn: {
    readonly contractId: string;
    readonly evidenceShape: EvidenceShapeStatus;
    readonly validationFindings: readonly string[];
    readonly selectedKnowledgeIds: readonly string[];
    readonly selectedMemoryIds: readonly string[];
    readonly selectedSourceClaimIds: readonly string[];
  };
  readonly expectedEvidenceShape: {
    readonly requiresEvidenceRefs: true;
    readonly requiresVerification: true;
    readonly requiresChangedFiles: true;
    readonly requiresDoesNotProve: true;
  };
  readonly selectedContextSize: {
    readonly bytes: number;
    readonly approximateTokens: number;
    readonly method: "utf8_bytes_div_4";
  };
  readonly renderedBriefHit: boolean;
  readonly exclusions: {
    readonly memoryIds: readonly string[];
    readonly sourceClaimIds: readonly string[];
  };
  readonly proof: string;
  readonly doesNotProve: string;
}

export interface CodexOutputComparatorEvalResult {
  readonly kind: "krn.codexOutputComparator.eval.v1";
  readonly status: ComparatorStatus;
  readonly sourceEvalKind: MemoryAdvantageEvalResult["kind"];
  readonly metrics: {
    readonly caseCount: number;
    readonly passedCaseCount: number;
    readonly failedCaseCount: number;
    readonly baselineMissingEvidenceCount: number;
    readonly krnValidEvidenceShapeCount: number;
    readonly contractChangedCount: number;
    readonly totalSelectedContextBytes: number;
  };
  readonly cases: readonly CodexOutputComparatorCaseReadback[];
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

const expectedEvidenceShape = {
  requiresEvidenceRefs: true,
  requiresVerification: true,
  requiresChangedFiles: true,
  requiresDoesNotProve: true
} as const;

const evidenceShape = (
  findings: readonly string[]
): EvidenceShapeStatus =>
  findings.length === 0 ? "valid" : "missing_evidence";

const uniqueIds = (
  ids: readonly string[]
): readonly string[] => [...new Set(ids)];

const baselineOutput = (
  caseId: string,
  contractId: string
): ClaimedCodexOutputEvidence => ({
  summary: `Baseline Codex would follow ${contractId} for ${caseId}.`,
  claimsKrnContextUse: true,
  verification: [
    "deterministic-comparator:baseline-contract-derived"
  ],
  changedFiles: [
    "packages/cli/src/runCodexOutputComparatorEval.ts"
  ],
  doesNotProve: "Baseline output is a deterministic missing-evidence proxy, not live Codex execution."
});

const krnOutput = (
  input: {
    caseId: string;
    contractId: string;
    evidenceRefs: readonly string[];
  }
): ClaimedCodexOutputEvidence => ({
  summary: `KRN-grounded Codex output would follow ${input.contractId} for ${input.caseId}.`,
  claimsKrnContextUse: true,
  evidenceRefs: input.evidenceRefs,
  verification: [
    "pnpm eval:memory-advantage=passed"
  ],
  changedFiles: [
    "packages/cli/src/runMemoryAdvantageEval.ts",
    "packages/cli/src/runCodexOutputComparatorEval.ts"
  ],
  doesNotProve: "KRN comparator output evidence shape does not prove live Codex followed the rendered brief."
});

const selectedEvidenceRefs = (
  testCase: MemoryAdvantageEvalResult["cases"][number]
): readonly string[] => [
  testCase.priorSession.evidenceRef,
  testCase.priorSession.reviewRef,
  testCase.priorSession.feedbackRef,
  ...testCase["krn_memory"].selectedMemoryIds,
  ...testCase["krn_memory"].selectedSourceClaimIds
];

const buildComparatorCase = (
  testCase: MemoryAdvantageEvalResult["cases"][number]
): CodexOutputComparatorCaseReadback | undefined => {
  const decision = testCase["execution_contract_decision"];

  if (decision === undefined) {
    return undefined;
  }

  if (testCase.advantageDelta.result !== "win") {
    return undefined;
  }

  const baselineFindings = validateClaimedCodexOutputEvidence(baselineOutput(
    testCase.caseId,
    decision.baseline.contractId
  ));
  const krnFindings = validateClaimedCodexOutputEvidence(krnOutput({
    caseId: testCase.caseId,
    contractId: decision.krn.contractId,
    evidenceRefs: selectedEvidenceRefs(testCase)
  }));
  const contractChanged = decision.baseline.contractId !== decision.krn.contractId;
  const status =
    decision.status === "pass" &&
    contractChanged &&
    baselineFindings.includes("evidenceRefs are required for claimed KRN output evidence") &&
    krnFindings.length === 0
      ? "pass"
      : "fail";

  return {
    caseId: testCase.caseId,
    objective: decision.objective,
    status,
    baseline: {
      contractId: decision.baseline.contractId,
      evidenceShape: evidenceShape(baselineFindings),
      validationFindings: baselineFindings,
      selectedKnowledgeIds: uniqueIds(decision.baseline.decisionOrderedKnowledgeIds)
    },
    krn: {
      contractId: decision.krn.contractId,
      evidenceShape: evidenceShape(krnFindings),
      validationFindings: krnFindings,
      selectedKnowledgeIds: uniqueIds(decision.krn.decisionOrderedKnowledgeIds),
      selectedMemoryIds: decision.krn.selectedMemoryIds,
      selectedSourceClaimIds: decision.krn.selectedSourceClaimIds
    },
    expectedEvidenceShape,
    selectedContextSize: decision.selectedContextSize,
    renderedBriefHit: testCase["krn_plan_brief"].result === "hit",
    exclusions: {
      memoryIds: testCase["krn_memory"].exclusions.map((exclusion) => exclusion.memoryId),
      sourceClaimIds: testCase["krn_memory"].sourceExclusions.map((exclusion) => exclusion.sourceClaimId)
    },
    proof: decision.proof,
    doesNotProve: decision.doesNotProve
  };
};

export const runCodexOutputComparatorEval = async (
  fixture: MemoryAdvantageEvalFixture
): Promise<CodexOutputComparatorEvalResult> => {
  const sourceEval = await runMemoryAdvantageEval(fixture);
  const cases = sourceEval.cases.flatMap((testCase) => {
    const comparatorCase = buildComparatorCase(testCase);
    return comparatorCase === undefined ? [] : [comparatorCase];
  });
  const status = cases.length > 0 && cases.every((testCase) => testCase.status === "pass")
    ? "pass"
    : "fail";

  return {
    kind: "krn.codexOutputComparator.eval.v1",
    status,
    sourceEvalKind: sourceEval.kind,
    metrics: {
      caseCount: cases.length,
      passedCaseCount: cases.filter((testCase) => testCase.status === "pass").length,
      failedCaseCount: cases.filter((testCase) => testCase.status === "fail").length,
      baselineMissingEvidenceCount: cases.filter((testCase) =>
        testCase.baseline.evidenceShape === "missing_evidence"
      ).length,
      krnValidEvidenceShapeCount: cases.filter((testCase) =>
        testCase.krn.evidenceShape === "valid"
      ).length,
      contractChangedCount: cases.filter((testCase) =>
        testCase.baseline.contractId !== testCase.krn.contractId
      ).length,
      totalSelectedContextBytes: cases.reduce(
        (sum, testCase) => sum + testCase.selectedContextSize.bytes,
        0
      )
    },
    cases,
    proof: {
      proves: [
        "execution-contract memory advantage cases can be compared as baseline Codex contract versus KRN-grounded contract",
        "baseline output claims fail the shared Codex-output evidence-shape validator when evidence refs are missing",
        "KRN-grounded comparator output carries selected memory/source evidence refs, verification, changed files, and doesNotProve",
        "the comparator reports selected context-size proxy, exclusions, and rendered brief hit status for each compared case"
      ],
      doesNotProve: [
        "live Codex execution",
        "that Codex followed the rendered brief",
        "LLM output quality",
        "arbitrary task superiority over vanilla Codex",
        "production retrieval quality",
        "source truth",
        "product readiness"
      ]
    }
  };
};

const main = async (): Promise<CodexOutputComparatorEvalResult> => {
  const fixturePath =
    process.argv[2] ?? "tests/fixtures/memory-advantage/company-pattern-memory-advantage.json";

  return runCodexOutputComparatorEval(loadMemoryAdvantageEvalFixture(fixturePath));
};

if (isCliEntrypoint(import.meta.url)) {
  await writeJsonEvalResult(main);
}
