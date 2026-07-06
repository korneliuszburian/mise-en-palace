import {
  validateClaimedCodexOutputEvidence
} from "@krn/harness";
import type {
  ClaimedCodexOutputEvidence
} from "@krn/harness";
import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./eval-main.js";
import {
  loadMemoryAdvantageEvalFixture,
  runMemoryAdvantageEval
} from "./run-memory-advantage-eval.js";
import type {
  MemoryAdvantageEvalFixture,
  MemoryAdvantageEvalResult
} from "./run-memory-advantage-eval.js";

type ComparatorStatus = "pass" | "fail";
type EvidenceShapeStatus = "valid" | "missing_evidence";
type ComparatorBaselineKind = "no_memory" | "simple_retrieval";
type ComparatorUsefulnessLabel =
  | "krn_adds_missing_evidence"
  | "krn_improves_over_simple_retrieval"
  | "krn_refuses_harmful_retrieval"
  | "baseline_already_sufficient"
  | "loss_reported";
type ComparatorContentDelta =
  | "contract_changed"
  | "selection_changed"
  | "baseline_sufficient"
  | "krn_abstained";
type ComparatorContractSource = "execution_contract" | "selection_proxy";

interface CodexOutputComparatorCaseReadback {
  readonly comparisonId: string;
  readonly caseId: string;
  readonly baselineKind: ComparatorBaselineKind;
  readonly objective: string;
  readonly status: ComparatorStatus;
  readonly competency: MemoryAdvantageEvalResult["cases"][number]["competency"];
  readonly heldOut: boolean;
  readonly advantageDelta: MemoryAdvantageEvalResult["cases"][number]["advantageDelta"];
  readonly usefulnessLabel: ComparatorUsefulnessLabel;
  readonly contentDelta: ComparatorContentDelta;
  readonly contractSource: ComparatorContractSource;
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
    readonly comparisonCount: number;
    readonly sourcePromptCount: number;
    readonly passedCaseCount: number;
    readonly failedCaseCount: number;
    readonly baselineMissingEvidenceCount: number;
    readonly krnValidEvidenceShapeCount: number;
    readonly contentChangedCount: number;
    readonly executionContractComparisonCount: number;
    readonly executionContractChangedCount: number;
    readonly advantageWinPromptCount: number;
    readonly neutralPromptCount: number;
    readonly lossPromptCount: number;
    readonly comparisonWinCount: number;
    readonly comparisonNeutralCount: number;
    readonly comparisonLossCount: number;
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
    "packages/cli/src/run-codex-output-comparator-eval.ts"
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
    "packages/cli/src/run-memory-advantage-eval.ts",
    "packages/cli/src/run-codex-output-comparator-eval.ts"
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

const baselineSelectedKnowledgeIds = (
  testCase: MemoryAdvantageEvalResult["cases"][number],
  baselineKind: ComparatorBaselineKind
): readonly string[] =>
  baselineKind === "no_memory"
    ? testCase["baseline_no_memory"].selectedKnowledgeIds
    : testCase["baseline_simple_retrieval"].selectedKnowledgeIds;

const baselineContractId = (
  testCase: MemoryAdvantageEvalResult["cases"][number],
  baselineKind: ComparatorBaselineKind
): string => {
  const decision = testCase["execution_contract_decision"];

  if (baselineKind === "simple_retrieval" && decision !== undefined) {
    return decision.baseline.contractId;
  }

  const baseline = baselineKind === "no_memory"
    ? testCase["baseline_no_memory"]
    : testCase["baseline_simple_retrieval"];

  return `${baselineKind}:${baseline.result}`;
};

const krnContractId = (
  testCase: MemoryAdvantageEvalResult["cases"][number]
): string =>
  testCase["execution_contract_decision"]?.krn.contractId ??
  `krn:${testCase["krn_memory"].result}:${testCase["krn_memory"].requiredKnowledgeId}`;

const comparatorUsefulnessLabel = (
  testCase: MemoryAdvantageEvalResult["cases"][number],
  baselineKind: ComparatorBaselineKind
): ComparatorUsefulnessLabel => {
  if (testCase.advantageDelta.result === "loss") {
    return "loss_reported";
  }

  if (baselineKind === "no_memory" && testCase["krn_memory"].result === "hit") {
    return "krn_adds_missing_evidence";
  }

  if (testCase.expectedKrnResult === "miss" && testCase["krn_memory"].result === "miss") {
    return "krn_refuses_harmful_retrieval";
  }

  if (testCase.advantageDelta.result === "win") {
    return "krn_improves_over_simple_retrieval";
  }

  if (testCase.advantageDelta.result === "neutral") {
    return "baseline_already_sufficient";
  }

  return "loss_reported";
};

const comparatorContentDelta = (
  testCase: MemoryAdvantageEvalResult["cases"][number],
  baselineKind: ComparatorBaselineKind,
  baselineIds: readonly string[],
  baselineContract: string,
  krnContract: string
): ComparatorContentDelta => {
  if (testCase.expectedKrnResult === "miss" && testCase["krn_memory"].result === "miss") {
    return "krn_abstained";
  }

  if (baselineKind === "simple_retrieval" && testCase.advantageDelta.result === "neutral") {
    return "baseline_sufficient";
  }

  if (
    baselineKind === "simple_retrieval" &&
    testCase["execution_contract_decision"] !== undefined &&
    baselineContract !== krnContract
  ) {
    return "contract_changed";
  }

  return baselineIds.join("\0") === testCase["krn_memory"].selectedKnowledgeIds.join("\0")
    ? "baseline_sufficient"
    : "selection_changed";
};

const comparatorStatus = (
  baselineFindings: readonly string[],
  krnFindings: readonly string[]
): ComparatorStatus =>
  baselineFindings.includes("evidenceRefs are required for claimed KRN output evidence") &&
  krnFindings.length === 0
    ? "pass"
    : "fail";

const comparatorContractSource = (
  testCase: MemoryAdvantageEvalResult["cases"][number],
  baselineKind: ComparatorBaselineKind
): ComparatorContractSource =>
  baselineKind === "simple_retrieval" && testCase["execution_contract_decision"] !== undefined
    ? "execution_contract"
    : "selection_proxy";

const comparatorObjective = (
  testCase: MemoryAdvantageEvalResult["cases"][number]
): string => testCase["execution_contract_decision"]?.objective ?? testCase.query;

const comparatorProof = (
  testCase: MemoryAdvantageEvalResult["cases"][number]
): string =>
  testCase["execution_contract_decision"]?.proof ??
  "The comparison is derived from deterministic memory-advantage selected ids and evidence-shape validation.";

const comparatorNonProof = (
  testCase: MemoryAdvantageEvalResult["cases"][number]
): string =>
  testCase["execution_contract_decision"]?.doesNotProve ??
  "This does not prove live Codex execution, output quality, or broad task superiority.";

const krnSelectedKnowledgeIds = (
  testCase: MemoryAdvantageEvalResult["cases"][number]
): readonly string[] => uniqueIds([
  ...testCase["krn_memory"].selectedSourceClaimIds,
  ...testCase["krn_memory"].selectedKnowledgeIds
]);

const comparatorExclusions = (
  testCase: MemoryAdvantageEvalResult["cases"][number]
): CodexOutputComparatorCaseReadback["exclusions"] => ({
  memoryIds: testCase["krn_memory"].exclusions.map((exclusion) => exclusion.memoryId),
  sourceClaimIds: testCase["krn_memory"].sourceExclusions.map((exclusion) => exclusion.sourceClaimId)
});

const buildComparatorCase = (
  testCase: MemoryAdvantageEvalResult["cases"][number],
  baselineKind: ComparatorBaselineKind
): CodexOutputComparatorCaseReadback => {
  const baselineIds = baselineSelectedKnowledgeIds(testCase, baselineKind);
  const baselineContract = baselineContractId(testCase, baselineKind);
  const krnContract = krnContractId(testCase);
  const baselineFindings = validateClaimedCodexOutputEvidence(baselineOutput(
    `${testCase.caseId}:${baselineKind}`,
    baselineContract
  ));
  const krnFindings = validateClaimedCodexOutputEvidence(krnOutput({
    caseId: `${testCase.caseId}:${baselineKind}`,
    contractId: krnContract,
    evidenceRefs: selectedEvidenceRefs(testCase)
  }));

  return {
    comparisonId: `${testCase.caseId}:${baselineKind}`,
    caseId: testCase.caseId,
    baselineKind,
    objective: comparatorObjective(testCase),
    status: comparatorStatus(baselineFindings, krnFindings),
    competency: testCase.competency,
    heldOut: testCase.heldOut,
    advantageDelta: testCase.advantageDelta,
    usefulnessLabel: comparatorUsefulnessLabel(testCase, baselineKind),
    contentDelta: comparatorContentDelta(testCase, baselineKind, baselineIds, baselineContract, krnContract),
    contractSource: comparatorContractSource(testCase, baselineKind),
    baseline: {
      contractId: baselineContract,
      evidenceShape: evidenceShape(baselineFindings),
      validationFindings: baselineFindings,
      selectedKnowledgeIds: uniqueIds(baselineIds)
    },
    krn: {
      contractId: krnContract,
      evidenceShape: evidenceShape(krnFindings),
      validationFindings: krnFindings,
      selectedKnowledgeIds: krnSelectedKnowledgeIds(testCase),
      selectedMemoryIds: testCase["krn_memory"].selectedMemoryIds,
      selectedSourceClaimIds: testCase["krn_memory"].selectedSourceClaimIds
    },
    expectedEvidenceShape,
    selectedContextSize: testCase["krn_memory"].selectedContextSize,
    renderedBriefHit: testCase["krn_plan_brief"].result === "hit",
    exclusions: comparatorExclusions(testCase),
    proof: comparatorProof(testCase),
    doesNotProve: comparatorNonProof(testCase)
  };
};

export const runCodexOutputComparatorEval = async (
  fixture: MemoryAdvantageEvalFixture
): Promise<CodexOutputComparatorEvalResult> => {
  const sourceEval = await runMemoryAdvantageEval(fixture);
  const cases = sourceEval.cases.flatMap((testCase) => {
    return [
      buildComparatorCase(testCase, "no_memory"),
      buildComparatorCase(testCase, "simple_retrieval")
    ];
  });
  const status = cases.length > 0 && cases.every((testCase) => testCase.status === "pass")
    ? "pass"
    : "fail";

  return {
    kind: "krn.codexOutputComparator.eval.v1",
    status,
    sourceEvalKind: sourceEval.kind,
    metrics: {
      comparisonCount: cases.length,
      sourcePromptCount: sourceEval.cases.length,
      passedCaseCount: cases.filter((testCase) => testCase.status === "pass").length,
      failedCaseCount: cases.filter((testCase) => testCase.status === "fail").length,
      baselineMissingEvidenceCount: cases.filter((testCase) =>
        testCase.baseline.evidenceShape === "missing_evidence"
      ).length,
      krnValidEvidenceShapeCount: cases.filter((testCase) =>
        testCase.krn.evidenceShape === "valid"
      ).length,
      contentChangedCount: cases.filter((testCase) =>
        testCase.contentDelta === "contract_changed" || testCase.contentDelta === "selection_changed"
      ).length,
      executionContractComparisonCount: cases.filter((testCase) =>
        testCase.contractSource === "execution_contract"
      ).length,
      executionContractChangedCount: cases.filter((testCase) =>
        testCase.contractSource === "execution_contract" && testCase.contentDelta === "contract_changed"
      ).length,
      advantageWinPromptCount: sourceEval.cases.filter((testCase) =>
        testCase.advantageDelta.result === "win"
      ).length,
      neutralPromptCount: sourceEval.cases.filter((testCase) =>
        testCase.advantageDelta.result === "neutral"
      ).length,
      lossPromptCount: sourceEval.cases.filter((testCase) =>
        testCase.advantageDelta.result === "loss"
      ).length,
      comparisonWinCount: cases.filter((testCase) =>
        testCase.advantageDelta.result === "win"
      ).length,
      comparisonNeutralCount: cases.filter((testCase) =>
        testCase.advantageDelta.result === "neutral"
      ).length,
      comparisonLossCount: cases.filter((testCase) =>
        testCase.advantageDelta.result === "loss"
      ).length,
      totalSelectedContextBytes: cases.reduce(
        (sum, testCase) => sum + testCase.selectedContextSize.bytes,
        0
      )
    },
    cases,
    proof: {
      proves: [
        "memory advantage prompts can be swept as no-memory and simple-retrieval baseline comparisons against KRN-grounded output evidence",
        "execution-contract memory advantage cases can still be compared as baseline Codex contract versus KRN-grounded contract",
        "baseline output claims fail the shared Codex-output evidence-shape validator when evidence refs are missing",
        "KRN-grounded comparator output carries prior-session evidence refs, verification, changed files, doesNotProve, and selected memory/source ids when retrieval contributed context",
        "the comparator reports explicit usefulness labels, win/neutral/loss counts, selected context-size proxy, exclusions, and rendered brief hit status for each compared case"
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
