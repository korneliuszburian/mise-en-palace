import { readFileSync } from "node:fs";
import {
  mkdtemp,
  rm,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type {
  MemoryRecord,
  SourceClaim,
  SourceDecisionEdge
} from "@krn/core";
import {
  createExecutionBrief,
  renderExecutionBriefText
} from "@krn/codex-adapter";
import {
  compileHarnessPlan
} from "@krn/harness";
import type {
  SearchDocumentRecord,
  SearchDocumentSearchResult
} from "@krn/core/repositories/internal";
import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./eval-main.js";
import {
  parseBrainSearchPreviewSections,
  parseEvalKnowledgeReadModels,
  parseEvalSourceClaims,
  isRecord,
  recordArray,
  requiredFiniteNumber,
  requiredString,
  requiredStringArray
} from "./eval-fixture-support.js";
import type {
  EvalKnowledgeReadModelFixture,
  EvalSourceClaimFixture
} from "./eval-fixture-support.js";
import {
  runBrainSearchCommand
} from "../../run-brain-search-command.js";
import type {
  BrainSearchCommand
} from "../../run-brain-search-command.js";
import type {
  DatabaseRuntime
} from "../../database-runtime.js";
import {
  createNoStoreCompilerDependencies
} from "../../no-store-repositories.js";

type MemoryAdvantageCompetency = "retrieval" | "learning" | "long_range" | "forgetting";
type MemoryAdvantageNegativeClass =
  | "stale_memory"
  | "adversarial_unsupported_memory"
  | "adversarial_memory_source_conflict"
  | "temporal_stale_source_claim"
  | "runtime_memory_source_contradiction";
type MemoryAdvantageFalsificationClass =
  | "short_context_no_advantage"
  | "single_turn_no_memory_needed"
  | "retrieval_not_needed"
  | "breaks_interdependent_advantage";
type MemoryAdvantageDelta = "win" | "neutral" | "loss";
type AdvantageLimitationClass =
  | "baseline_already_sufficient"
  | "inherent_parity"
  | "retrieval_miss"
  | "grounding_failure"
  | "fixture_stale"
  | "regression_candidate";
type AdvantageLimitationScope =
  | "neutral_no_advantage"
  | "broken_prior_advantage"
  | "loss";
export type SourceContributionClass =
  | "source_required_for_hit"
  | "memory_only_sufficient"
  | "source_zero_delta"
  | "source_noise"
  | "no_source_selected";
type ExpectedKrnResult = "hit" | "miss";
type MemoryAdvantageBaselineClass = "no_memory_no_source";
type SimpleRetrievalBaselineClass = "simple_lexical_retrieval";
type SimpleRetrievalResult =
  | "top_match_selected"
  | "distractor_selected"
  | "miss";
interface MemoryAdvantageRuntimeMemoryExclusionFixture {
  readonly relation: "contradicts_source_claim";
  readonly sourceClaimId: string;
  readonly reason: string;
}

interface MemoryAdvantageReadModelFixture extends EvalKnowledgeReadModelFixture {
  readonly runtimeExclusion?: MemoryAdvantageRuntimeMemoryExclusionFixture;
}

type MemoryAdvantageSourceClaimFixture = EvalSourceClaimFixture;
type MemoryAdvantageCatalogReadModelFixture =
  MemoryAdvantageReadModelFixture | MemoryAdvantageExcludedMemoryFixture;

interface MemoryAdvantageCaseFixture {
  readonly id: string;
  readonly competency: MemoryAdvantageCompetency;
  readonly heldOut: boolean;
  readonly interdependentSession?: boolean;
  readonly rememberedStandardChallenge: RememberedStandardChallengeFixture | undefined;
  readonly query: string;
  readonly distractorClasses: readonly string[];
  readonly baselineFailureRationale: string;
  readonly negativeClass?: MemoryAdvantageNegativeClass;
  readonly falsificationClass?: MemoryAdvantageFalsificationClass;
  readonly codingTask?: MemoryAdvantageCodingTaskFixture;
  readonly executionContract?: MemoryAdvantageExecutionContractFixture;
  readonly priorSession: MemoryAdvantagePriorSessionFixture;
  readonly expectedKrnResult: ExpectedKrnResult;
  readonly expectedSelectedKnowledgeId: string;
}

interface RememberedStandardChallengeFixture {
  readonly standardId: string;
  readonly expectedDecision: string;
  readonly baselineFailureMode: string;
  readonly falsifier: string;
}

interface MemoryAdvantageDecisionOptionFixture {
  readonly id: string;
  readonly label: string;
  readonly triggerKnowledgeIds: readonly string[];
}

interface MemoryAdvantageCodingTaskFixture {
  readonly id: string;
  readonly implementationConstraint: string;
  readonly defaultDecisionId: string;
  readonly expectedKrnDecisionId: string;
  readonly decisionOptions: readonly MemoryAdvantageDecisionOptionFixture[];
}

interface MemoryAdvantageExecutionContractFixture {
  readonly id: string;
  readonly objective: string;
  readonly defaultContractId: string;
  readonly expectedKrnContractId: string;
  readonly contractOptions: readonly MemoryAdvantageDecisionOptionFixture[];
  readonly proof: string;
  readonly doesNotProve: string;
}

interface MemoryAdvantagePriorSessionFixture {
  readonly id: string;
  readonly task: string;
  readonly evidenceRef: string;
  readonly reviewRef: string;
  readonly feedbackRef: string;
  readonly applicationOutcome: string;
  readonly memoryReadModels: readonly MemoryAdvantageReadModelFixture[];
  readonly excludedMemoryReadModels: readonly MemoryAdvantageExcludedMemoryFixture[];
  readonly distractorMemoryReadModels: readonly MemoryAdvantageReadModelFixture[];
  readonly sourceClaims: readonly MemoryAdvantageSourceClaimFixture[];
  readonly excludedSourceClaims: readonly MemoryAdvantageExcludedSourceClaimFixture[];
  readonly distractorSourceClaims: readonly MemoryAdvantageSourceClaimFixture[];
}

interface MemoryAdvantageExcludedMemoryFixture extends MemoryAdvantageReadModelFixture {
  readonly exclusionReason: string;
}

interface MemoryAdvantageExcludedSourceClaimFixture extends MemoryAdvantageSourceClaimFixture {
  readonly exclusionReason: string;
}

export interface MemoryAdvantageEvalFixture {
  readonly version: "1";
  readonly corpusName: string;
  readonly distractorClasses: readonly string[];
  readonly cases: readonly MemoryAdvantageCaseFixture[];
}

interface MemoryAdvantageCaseReadback {
  readonly caseId: string;
  readonly competency: MemoryAdvantageCompetency;
  readonly heldOut: boolean;
  readonly interdependentSession: boolean;
  readonly rememberedStandardChallenge: RememberedStandardChallengeFixture | undefined;
  readonly query: string;
  readonly distractorClasses: readonly string[];
  readonly baselineFailureRationale: string;
  readonly negativeClass?: MemoryAdvantageNegativeClass;
  readonly falsificationClass?: MemoryAdvantageFalsificationClass;
  readonly advantageDelta: {
    readonly result: MemoryAdvantageDelta;
    readonly reason: string;
    readonly simpleRetrievalAlreadySufficient: boolean;
    readonly limitation?: AdvantageLimitationReadback;
  };
  readonly status: "pass" | "fail";
  readonly expectedKrnResult: ExpectedKrnResult;
  readonly baselineClass: MemoryAdvantageBaselineClass;
  readonly priorSession: {
    readonly id: string;
    readonly task: string;
    readonly evidenceRef: string;
    readonly reviewRef: string;
    readonly feedbackRef: string;
    readonly applicationOutcome: string;
    readonly createdMemoryIds: readonly string[];
    readonly excludedMemoryIds: readonly string[];
    readonly distractorMemoryIds: readonly string[];
    readonly createdSourceClaimIds: readonly string[];
    readonly excludedSourceClaimIds: readonly string[];
    readonly distractorSourceClaimIds: readonly string[];
  };
  readonly "baseline_no_memory": {
    readonly baselineClass: MemoryAdvantageBaselineClass;
    readonly result: "miss" | "unexpected_hit";
    readonly answerUsefulness: string;
    readonly selectedKnowledgeIds: readonly string[];
    readonly selectedMemoryIds: readonly string[];
    readonly selectedSourceClaimIds: readonly string[];
    readonly selectedContextSize: ApproximateSelectedContextSize;
    readonly missingEvidence: readonly string[];
  };
  readonly "baseline_simple_retrieval": {
    readonly baselineClass: SimpleRetrievalBaselineClass;
    readonly result: SimpleRetrievalResult;
    readonly selectedKnowledgeIds: readonly string[];
    readonly selectedMemoryIds: readonly string[];
    readonly selectedSourceClaimIds: readonly string[];
    readonly selectedContextSize: ApproximateSelectedContextSize;
  };
  readonly "baseline_plan_brief": PlanBriefReadback;
  readonly "krn_memory": {
    readonly result: "hit" | "miss";
    readonly answerUsefulness: string;
    readonly selectedKnowledgeIds: readonly string[];
    readonly selectedMemoryIds: readonly string[];
    readonly selectedSources: readonly string[];
    readonly selectedSourceClaimIds: readonly string[];
    readonly selectedContextSize: ApproximateSelectedContextSize;
    readonly writtenKnowledgeIds: readonly string[];
    readonly requiredKnowledgeId: string;
    readonly supportingClaims: number;
    readonly supportingDocuments: number;
    readonly exclusions: readonly MemoryAdvantageMemoryExclusionReadback[];
    readonly sourceExclusions: readonly MemoryAdvantageSourceClaimExclusionReadback[];
  };
  readonly "source_contribution": SourceContributionReadback;
  readonly "implementation_decision": ImplementationDecisionReadback;
  readonly "krn_plan_brief": PlanBriefReadback;
  readonly "coding_task_decision"?: CodingTaskDecisionReadback;
  readonly "execution_contract_decision"?: ExecutionContractDecisionReadback;
  readonly "reviewed_feedback_effect": ReviewedFeedbackEffectReadback;
}

interface CodingTaskDecisionReadback {
  readonly taskId: string;
  readonly implementationConstraint: string;
  readonly expectedKrnDecisionId: string;
  readonly decisionDerivationOrder: "source_claims_first";
  readonly memoryFirstCounterfactualDecisionId: string;
  readonly selectedContextSize: ApproximateSelectedContextSize;
  readonly baseline: {
    readonly baselineClass: SimpleRetrievalBaselineClass;
    readonly decisionId: string;
    readonly selectedKnowledgeIds: readonly string[];
  };
  readonly krn: {
    readonly decisionId: string;
    readonly selectedKnowledgeIds: readonly string[];
    readonly selectedMemoryIds: readonly string[];
    readonly selectedSourceClaimIds: readonly string[];
  };
  readonly status: "pass" | "fail";
}

interface ExecutionContractDecisionReadback {
  readonly contractId: string;
  readonly objective: string;
  readonly expectedKrnContractId: string;
  readonly derivationOrder: "source_claims_first";
  readonly proof: string;
  readonly doesNotProve: string;
  readonly selectedContextSize: ApproximateSelectedContextSize;
  readonly baseline: {
    readonly baselineClass: SimpleRetrievalBaselineClass;
    readonly contractId: string;
    readonly decisionOrderedKnowledgeIds: readonly string[];
    readonly selectedMemoryIds: readonly string[];
    readonly selectedSourceClaimIds: readonly string[];
  };
  readonly krn: {
    readonly contractId: string;
    readonly decisionOrderedKnowledgeIds: readonly string[];
    readonly selectedMemoryIds: readonly string[];
    readonly selectedSourceClaimIds: readonly string[];
  };
  readonly status: "pass" | "fail";
}

interface PlanBriefReadback {
  readonly baselineClass: MemoryAdvantageBaselineClass;
  readonly result: "hit" | "miss" | "unexpected_hit";
  readonly requiredKnowledgeId: string;
  readonly selectedMemoryRecordIds: readonly string[];
  readonly selectedSourceClaimIds: readonly string[];
  readonly renderedMemoryRecordIds: readonly string[];
  readonly renderedSourceClaimIds: readonly string[];
  readonly contextInclusionCount: number;
  readonly contextSize: ApproximateSelectedContextSize;
  readonly renderedBriefSize: ApproximateSelectedContextSize;
}

interface MemoryAdvantageMemoryExclusionReadback {
  readonly memoryId: string;
  readonly reason: string;
}

interface MemoryAdvantageSourceClaimExclusionReadback {
  readonly sourceClaimId: string;
  readonly reason: string;
}

interface ApproximateSelectedContextSize {
  readonly bytes: number;
  readonly approximateTokens: number;
  readonly method: "utf8_bytes_div_4";
}

interface ReviewedFeedbackEffectReadback {
  readonly priorFeedbackRef: string;
  readonly priorEvidenceRef: string;
  readonly priorReviewRef: string;
  readonly applicationOutcome: string;
  readonly laterTaskQuery: string;
  readonly requiredKnowledgeId: string;
  readonly baselineNoMemoryResult: "miss" | "unexpected_hit";
  readonly simpleRetrievalResult: SimpleRetrievalResult;
  readonly simpleRetrievalTopKnowledgeId: string | null;
  readonly simpleRetrievalWeakerThanKrn: boolean;
  readonly krnResult: "hit" | "miss";
  readonly selectedMemoryIds: readonly string[];
  readonly selectedSourceClaimIds: readonly string[];
  readonly selectedContextSize: ApproximateSelectedContextSize;
  readonly planBriefContextSize: ApproximateSelectedContextSize;
  readonly proofStatus: "pass" | "fail";
}

interface AdvantageLimitationReadback {
  readonly scope: AdvantageLimitationScope;
  readonly classification: AdvantageLimitationClass;
  readonly reason: string;
  readonly proof: string;
  readonly doesNotProve: string;
}

interface SourceContributionReadback {
  readonly selectedSourceClaimIds: readonly string[];
  readonly sourceDisabled: {
    readonly result: "hit" | "miss";
    readonly selectedKnowledgeIds: readonly string[];
    readonly selectedMemoryIds: readonly string[];
    readonly selectedContextSize: ApproximateSelectedContextSize;
  };
  readonly contribution: SourceContributionClass;
  readonly zeroDeltaSourceClaimIds: readonly string[];
  readonly pruneCandidateSourceClaimIds: readonly string[];
  readonly proof: string;
  readonly doesNotProve: string;
}

interface ImplementationDecisionReadback {
  readonly decision_before_memory: string;
  readonly decision_after_krn: string;
  readonly selectedEvidenceRefs: readonly string[];
  readonly selectedEvidenceIds: readonly string[];
  readonly decisionChanged: boolean;
  readonly decisionChangeClass: "win" | "neutral" | "rejection_protection" | "regression";
  readonly reason: string;
  readonly doesNotProve: string;
}

export interface MemoryAdvantageEvalResult {
  readonly kind: "krn.memoryAdvantage.eval.v1";
  readonly fixtureVersion: "1";
  readonly status: "pass" | "fail";
  readonly corpus: {
    readonly name: string;
    readonly caseCount: number;
    readonly heldOutCaseCount: number;
    readonly distractorClasses: readonly string[];
  };
  readonly competencies: Record<MemoryAdvantageCompetency, {
    readonly status: "pass" | "fail";
    readonly caseIds: readonly string[];
  }>;
  readonly metrics: {
    readonly caseCount: number;
    readonly heldOutCaseCount: number;
    readonly expectedHitCount: number;
    readonly expectedMissCount: number;
    readonly advantageWinCount: number;
    readonly noAdvantageCaseCount: number;
    readonly advantageLossCount: number;
    readonly brokenPriorAdvantageCaseCount: number;
    readonly distractorClassCount: number;
    readonly interdependentSessionCaseCount: number;
    readonly totalKrnMemoryContextBytes: number;
    readonly totalKrnPlanBriefContextBytes: number;
    readonly totalRenderedBriefBytes: number;
    readonly codingTaskCaseCount: number;
    readonly implementationDecisionCaseCount: number;
    readonly implementationDecisionWinCount: number;
    readonly implementationDecisionNeutralCount: number;
    readonly implementationDecisionRejectionProtectionCount: number;
    readonly implementationDecisionRegressionCount: number;
    readonly executionContractCaseCount: number;
    readonly rememberedStandardChallengeCaseCount: number;
    readonly rememberedStandardChallengeWinCount: number;
    readonly sourceDisabledAblationCaseCount: number;
    readonly sourceRequiredCaseCount: number;
    readonly sourceZeroDeltaCaseCount: number;
    readonly sourcePruneCandidateCount: number;
  };
  readonly cases: readonly MemoryAdvantageCaseReadback[];
  readonly claimGuard: {
    readonly broadProductClaim: "allowed" | "blocked";
    readonly reason: string;
    readonly winCaseIds: readonly string[];
    readonly neutralCaseIds: readonly string[];
    readonly lossCaseIds: readonly string[];
  };
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

interface BrainSearchPreviewReadback {
  readonly selectedKnowledgeIds: readonly string[];
  readonly selectedSources: readonly string[];
  readonly selectedSourceClaimIds: readonly string[];
  readonly writtenKnowledgeIds: readonly string[];
  readonly answerUsefulness: string;
  readonly supportingClaims: number;
  readonly supportingDocuments: number;
  readonly missingEvidence: readonly string[];
}

const now = "2026-07-04T00:00:00.000Z";
const projectId = "project:memory-advantage";
const baselineClass: MemoryAdvantageBaselineClass = "no_memory_no_source";
const simpleRetrievalBaselineClass: SimpleRetrievalBaselineClass = "simple_lexical_retrieval";
const memoryCompetencies = ["retrieval", "learning", "long_range", "forgetting"] as const;
const memoryNegativeClasses = [
  "stale_memory",
  "adversarial_unsupported_memory",
  "adversarial_memory_source_conflict",
  "temporal_stale_source_claim",
  "runtime_memory_source_contradiction"
] as const;
const memoryFalsificationClasses = [
  "short_context_no_advantage",
  "single_turn_no_memory_needed",
  "retrieval_not_needed",
  "breaks_interdependent_advantage"
] as const;
const expectedKrnResults = ["hit", "miss"] as const;

const requiredEnum = <TValue extends string>(
  record: Record<string, unknown>,
  key: string,
  label: string,
  values: readonly TValue[]
): TValue => {
  const value = requiredString(record, key, label);

  if (!values.includes(value as TValue)) {
    throw new Error(`${label}.${key} must be one of ${values.join(", ")}`);
  }

  return value as TValue;
};

const parseExcludedMemoryReadModels = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly MemoryAdvantageExcludedMemoryFixture[] => {
  const readModels = parseEvalKnowledgeReadModels(record, key, label);

  return mapParsedReadModelsWithRaw(record, key, label, readModels, "must be an object", (readModel, rawReadModel, index) => {
    return {
      ...readModel,
      exclusionReason: requiredString(rawReadModel, "exclusionReason", `${label}.${key}[${index}]`)
    };
  });
};

const parseRuntimeMemoryExclusion = (
  value: unknown,
  label: string
): MemoryAdvantageRuntimeMemoryExclusionFixture | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    throw new Error(`${label}.runtimeExclusion must be an object`);
  }

  const relation = requiredString(value, "relation", `${label}.runtimeExclusion`);

  if (relation !== "contradicts_source_claim") {
    throw new Error(`${label}.runtimeExclusion.relation must be contradicts_source_claim`);
  }

  return {
    relation,
    sourceClaimId: requiredString(value, "sourceClaimId", `${label}.runtimeExclusion`),
    reason: requiredString(value, "reason", `${label}.runtimeExclusion`)
  };
};

const parseMemoryAdvantageReadModels = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly MemoryAdvantageReadModelFixture[] => {
  const readModels = parseEvalKnowledgeReadModels(record, key, label);

  return mapParsedReadModelsWithRaw(record, key, label, readModels, "must be present", (readModel, rawReadModel, index) => {
    const runtimeExclusion = parseRuntimeMemoryExclusion(rawReadModel["runtimeExclusion"], `${label}.${key}[${index}]`);

    return runtimeExclusion === undefined
      ? readModel
      : {
          ...readModel,
          runtimeExclusion
        };
  });
};

const mapParsedReadModelsWithRaw = <TReadModel extends EvalKnowledgeReadModelFixture, TResult>(
  record: Record<string, unknown>,
  key: string,
  label: string,
  readModels: readonly TReadModel[],
  missingMessage: string,
  mapReadModel: (readModel: TReadModel, rawReadModel: Record<string, unknown>, index: number) => TResult
): readonly TResult[] => {
  const rawReadModels = recordArray(record, key, label);

  return readModels.map((readModel, index) => {
    const rawReadModel = rawReadModels[index];

    if (rawReadModel === undefined) {
      throw new Error(`${label}.${key}[${index}] ${missingMessage}`);
    }

    return mapReadModel(readModel, rawReadModel, index);
  });
};

const parseExcludedSourceClaims = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly MemoryAdvantageExcludedSourceClaimFixture[] => {
  const claims = parseEvalSourceClaims(record, key, label);
  const rawClaims = recordArray(record, key, label);

  return claims.map((claim, index) => {
    const rawClaim = rawClaims[index];
    if (rawClaim === undefined) {
      throw new Error(`${label}.${key}[${index}] must be present`);
    }

    return {
      ...claim,
      exclusionReason: requiredString(rawClaim, "exclusionReason", `${label}.${key}[${index}]`)
    };
  });
};

const parseOptionalEvalKnowledgeReadModels = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly MemoryAdvantageReadModelFixture[] =>
  record[key] === undefined ? [] : parseMemoryAdvantageReadModels(record, key, label);

const parseOptionalEvalSourceClaims = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly MemoryAdvantageSourceClaimFixture[] =>
  record[key] === undefined ? [] : parseEvalSourceClaims(record, key, label);

const parseOptionalExcludedMemoryReadModels = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly MemoryAdvantageExcludedMemoryFixture[] =>
  record[key] === undefined ? [] : parseExcludedMemoryReadModels(record, key, label);

const parseOptionalExcludedSourceClaims = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly MemoryAdvantageExcludedSourceClaimFixture[] =>
  record[key] === undefined ? [] : parseExcludedSourceClaims(record, key, label);

const parseDecisionOptions = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly MemoryAdvantageDecisionOptionFixture[] => {
  const decisionOptions = recordArray(record, key, label).map((option, index) => ({
    id: requiredString(option, "id", `${label}.${key}[${index}]`),
    label: requiredString(option, "label", `${label}.${key}[${index}]`),
    triggerKnowledgeIds: requiredStringArray(option, "triggerKnowledgeIds", `${label}.${key}[${index}]`)
  }));

  if (decisionOptions.length === 0) {
    throw new Error(`${label}.${key} must not be empty`);
  }

  return decisionOptions;
};

const assertDecisionOptionReference = (
  decisionOptions: readonly MemoryAdvantageDecisionOptionFixture[],
  optionId: string,
  label: string
): void => {
  if (!decisionOptions.some((option) => option.id === optionId)) {
    throw new Error(`${label} must reference one of the declared option ids`);
  }
};

const parseCodingTask = (
  value: unknown,
  label: string
): MemoryAdvantageCodingTaskFixture | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    throw new Error(`${label}.codingTask must be an object`);
  }

  const decisionOptions = parseDecisionOptions(value, "decisionOptions", `${label}.codingTask`);
  const defaultDecisionId = requiredString(value, "defaultDecisionId", `${label}.codingTask`);
  const expectedKrnDecisionId = requiredString(value, "expectedKrnDecisionId", `${label}.codingTask`);
  assertDecisionOptionReference(decisionOptions, defaultDecisionId, `${label}.codingTask.defaultDecisionId`);
  assertDecisionOptionReference(decisionOptions, expectedKrnDecisionId, `${label}.codingTask.expectedKrnDecisionId`);

  return {
    id: requiredString(value, "id", `${label}.codingTask`),
    implementationConstraint: requiredString(value, "implementationConstraint", `${label}.codingTask`),
    defaultDecisionId,
    expectedKrnDecisionId,
    decisionOptions
  };
};

const parseExecutionContract = (
  value: unknown,
  label: string
): MemoryAdvantageExecutionContractFixture | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    throw new Error(`${label}.executionContract must be an object`);
  }

  const contractOptions = parseDecisionOptions(value, "contractOptions", `${label}.executionContract`);
  const defaultContractId = requiredString(value, "defaultContractId", `${label}.executionContract`);
  const expectedKrnContractId = requiredString(value, "expectedKrnContractId", `${label}.executionContract`);
  assertDecisionOptionReference(contractOptions, defaultContractId, `${label}.executionContract.defaultContractId`);
  assertDecisionOptionReference(
    contractOptions,
    expectedKrnContractId,
    `${label}.executionContract.expectedKrnContractId`
  );

  if (defaultContractId === expectedKrnContractId) {
    throw new Error(`${label}.executionContract default and expected KRN contracts must differ`);
  }

  return {
    id: requiredString(value, "id", `${label}.executionContract`),
    objective: requiredString(value, "objective", `${label}.executionContract`),
    defaultContractId,
    expectedKrnContractId,
    contractOptions,
    proof: requiredString(value, "proof", `${label}.executionContract`),
    doesNotProve: requiredString(value, "doesNotProve", `${label}.executionContract`)
  };
};

const parseRememberedStandardChallenge = (
  value: unknown,
  label: string
): RememberedStandardChallengeFixture | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    throw new Error(`${label}.rememberedStandardChallenge must be an object`);
  }

  return {
    standardId: requiredString(value, "standardId", `${label}.rememberedStandardChallenge`),
    expectedDecision: requiredString(value, "expectedDecision", `${label}.rememberedStandardChallenge`),
    baselineFailureMode: requiredString(value, "baselineFailureMode", `${label}.rememberedStandardChallenge`),
    falsifier: requiredString(value, "falsifier", `${label}.rememberedStandardChallenge`)
  };
};

const assertNoMemoryReadModelLifecycleConflict = (
  priorSession: MemoryAdvantagePriorSessionFixture,
  label: string
): void => {
  const activeIds = new Set(priorSession.memoryReadModels.map((readModel) => readModel.id));
  const conflictingReadModel = priorSession.excludedMemoryReadModels.find((readModel) => activeIds.has(readModel.id));

  if (conflictingReadModel !== undefined) {
    throw new Error(`${label}.priorSession cannot mark ${conflictingReadModel.id} as both active and excluded`);
  }
};

const assertInterdependentSessionCase = (
  testCase: MemoryAdvantageCaseFixture,
  label: string
): void => {
  if (testCase.interdependentSession !== true) {
    return;
  }

  if (!testCase.heldOut) {
    throw new Error(`${label}.interdependentSession cases must be held out`);
  }

  if (testCase.executionContract === undefined) {
    throw new Error(`${label}.interdependentSession cases must declare executionContract`);
  }
};

const parseCase = (
  value: Record<string, unknown>,
  index: number
): MemoryAdvantageCaseFixture => {
  const label = `cases[${index}]`;
  const priorSession = value["priorSession"];

  if (!isRecord(priorSession)) {
    throw new Error(`${label}.priorSession must be an object`);
  }

  const memoryReadModels = parseMemoryAdvantageReadModels(priorSession, "memoryReadModels", `${label}.priorSession`);
  const sourceClaims = parseEvalSourceClaims(priorSession, "sourceClaims", `${label}.priorSession`);

  const negativeClass = value["negativeClass"] === undefined
    ? undefined
    : requiredEnum(value, "negativeClass", label, memoryNegativeClasses);
  const falsificationClass = value["falsificationClass"] === undefined
    ? undefined
    : requiredEnum(value, "falsificationClass", label, memoryFalsificationClasses);
  const rememberedStandardChallenge = parseRememberedStandardChallenge(value["rememberedStandardChallenge"], label);
  const codingTask = parseCodingTask(value["codingTask"], label);
  const executionContract = parseExecutionContract(value["executionContract"], label);
  const parsedCase: MemoryAdvantageCaseFixture = {
    id: requiredString(value, "id", label),
    competency: requiredEnum(value, "competency", label, memoryCompetencies),
    heldOut: value["heldOut"] === true,
    ...(value["interdependentSession"] === true ? { interdependentSession: true } : {}),
    rememberedStandardChallenge,
    query: requiredString(value, "query", label),
    distractorClasses: requiredStringArray(value, "distractorClasses", label),
    baselineFailureRationale: requiredString(value, "baselineFailureRationale", label),
    ...(negativeClass === undefined ? {} : { negativeClass }),
    ...(falsificationClass === undefined ? {} : { falsificationClass }),
    ...(codingTask === undefined ? {} : { codingTask }),
    ...(executionContract === undefined ? {} : { executionContract }),
    priorSession: {
      id: requiredString(priorSession, "id", `${label}.priorSession`),
      task: requiredString(priorSession, "task", `${label}.priorSession`),
      evidenceRef: requiredString(priorSession, "evidenceRef", `${label}.priorSession`),
      reviewRef: requiredString(priorSession, "reviewRef", `${label}.priorSession`),
      feedbackRef: requiredString(priorSession, "feedbackRef", `${label}.priorSession`),
      applicationOutcome: requiredString(priorSession, "applicationOutcome", `${label}.priorSession`),
      memoryReadModels,
      excludedMemoryReadModels: parseOptionalExcludedMemoryReadModels(
        priorSession,
        "excludedMemoryReadModels",
        `${label}.priorSession`
      ),
      distractorMemoryReadModels: parseOptionalEvalKnowledgeReadModels(
        priorSession,
        "distractorMemoryReadModels",
        `${label}.priorSession`
      ),
      sourceClaims,
      excludedSourceClaims: parseOptionalExcludedSourceClaims(
        priorSession,
        "excludedSourceClaims",
        `${label}.priorSession`
      ),
      distractorSourceClaims: parseOptionalEvalSourceClaims(
        priorSession,
        "distractorSourceClaims",
        `${label}.priorSession`
      )
    },
    expectedKrnResult: requiredEnum(value, "expectedKrnResult", label, expectedKrnResults),
    expectedSelectedKnowledgeId: requiredString(value, "expectedSelectedKnowledgeId", label)
  };

  assertNoMemoryReadModelLifecycleConflict(parsedCase.priorSession, label);
  assertInterdependentSessionCase(parsedCase, label);
  return parsedCase;
};

export const parseMemoryAdvantageEvalFixture = (
  value: unknown
): MemoryAdvantageEvalFixture => {
  if (!isRecord(value)) {
    throw new Error("memory advantage eval fixture must be an object");
  }

  const version = value["version"];

  if (version !== "1") {
    throw new Error("memory advantage eval fixture version must be 1");
  }

  const cases = recordArray(value, "cases", "fixture").map(parseCase);

  if (cases.length === 0) {
    throw new Error("memory advantage eval fixture must contain at least one case");
  }

  return {
    version,
    corpusName: requiredString(value, "corpusName", "fixture"),
    distractorClasses: requiredStringArray(value, "distractorClasses", "fixture"),
    cases
  };
};

export const loadMemoryAdvantageEvalFixture = (
  path: string
): MemoryAdvantageEvalFixture => {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));

  return parseMemoryAdvantageEvalFixture(parsed);
};

const parseBrainSearchPreview = (
  stdout: string,
  label: string,
  writtenKnowledgeIds: readonly string[]
): BrainSearchPreviewReadback => {
  const preview = parseBrainSearchPreviewSections(stdout, label);

  return {
    selectedKnowledgeIds: preview.selectedKnowledge.map((packet, index) =>
      requiredString(packet, "id", `${label}.selectedKnowledge[${index}]`)
    ),
    selectedSources: preview.selectedKnowledge.map((packet, index) =>
      requiredString(packet, "source", `${label}.selectedKnowledge[${index}]`)
    ),
    selectedSourceClaimIds: requiredStringArray(
      preview.sourceSearch,
      "supportingClaimIds",
      `${label}.sourceSearch`
    ),
    writtenKnowledgeIds,
    answerUsefulness: requiredString(preview.sourceSearch, "answerUsefulness", `${label}.sourceSearch`),
    supportingClaims: requiredFiniteNumber(preview.sourceSearch, "supportingClaims", `${label}.sourceSearch`),
    supportingDocuments: requiredFiniteNumber(
      preview.sourceSearch,
      "supportingDocuments",
      `${label}.sourceSearch`
    ),
    missingEvidence: requiredStringArray(preview.sourceSearch, "missingEvidence", `${label}.sourceSearch`)
  };
};

const tokenScore = (query: string, text: string): number => {
  const queryTerms = new Set(
    query.toLowerCase().split(/[^a-z0-9]+/u).filter((term) => term.length >= 4)
  );
  const textTerms = new Set(
    text.toLowerCase().split(/[^a-z0-9]+/u).filter((term) => term.length >= 4)
  );
  let hits = 0;

  for (const term of queryTerms) {
    if (textTerms.has(term)) {
      hits += 1;
    }
  }

  return hits * 20;
};

const selectedMemoryIds = (
  selectedKnowledgeIds: readonly string[]
): readonly string[] =>
  // Brain-search emits source-search packets with source-prefixed ids; catalog memory readModels keep their fixture ids.
  selectedKnowledgeIds.filter((id) => !id.startsWith("source:"));

const approximateSelectedContextSize = (
  readback: Pick<
    BrainSearchPreviewReadback,
    "selectedKnowledgeIds" | "selectedSourceClaimIds" | "selectedSources"
  >
): ApproximateSelectedContextSize => {
  const selectedContextParts = [
    ...readback.selectedKnowledgeIds,
    ...readback.selectedSourceClaimIds,
    ...readback.selectedSources
  ];
  const bytes = selectedContextParts.length === 0
    ? 0
    : Buffer.byteLength(selectedContextParts.join("\n"), "utf8");

  return {
    bytes,
    approximateTokens: Math.ceil(bytes / 4),
    method: "utf8_bytes_div_4"
  };
};

const approximateSelectedContextSizeFromParts = (
  selectedContextParts: readonly string[]
): ApproximateSelectedContextSize => {
  const bytes = selectedContextParts.length === 0
    ? 0
    : Buffer.byteLength(selectedContextParts.join("\n"), "utf8");

  return {
    bytes,
    approximateTokens: Math.ceil(bytes / 4),
    method: "utf8_bytes_div_4"
  };
};

const assertLexicalOverlap = (
  testCase: MemoryAdvantageCaseFixture
): void => {
  const query = testCase.query;
  const hasMemoryReadModelOverlap = testCase.priorSession.memoryReadModels.some((readModel) =>
    tokenScore(query, [readModel.title, readModel.summary, readModel.nextAction].join(" ")) > 0
  );
  const hasExcludedReadModelOverlap = testCase.priorSession.excludedMemoryReadModels.some((readModel) =>
    tokenScore(query, [readModel.title, readModel.summary, readModel.nextAction].join(" ")) > 0
  );
  const hasClaimOverlap = testCase.priorSession.sourceClaims.some((claim) =>
    tokenScore(query, [claim.claim, claim.mechanism, claim.krnImplication].join(" ")) > 0
  );
  const hasExcludedClaimOverlap = testCase.priorSession.excludedSourceClaims.some((claim) =>
    tokenScore(query, [claim.claim, claim.mechanism, claim.krnImplication].join(" ")) > 0
  );

  if (testCase.expectedKrnResult === "hit" && (!(hasMemoryReadModelOverlap || hasExcludedReadModelOverlap) || !hasClaimOverlap)) {
    throw new Error(
      `${testCase.id} must have lexical overlap with a retained or excluded memory readModel and source claim text`
    );
  }

  if (testCase.expectedKrnResult === "miss" && !(hasExcludedReadModelOverlap || hasExcludedClaimOverlap)) {
    throw new Error(`${testCase.id} must have lexical overlap with an excluded memory readModel or source claim`);
  }
};

const sourceClaimFromFixture = (
  fixture: MemoryAdvantageSourceClaimFixture
): SourceClaim => ({
  id: fixture.sourceClaimId,
  sourceArtifactId: `artifact:${fixture.sourceClaimId}`,
  claim: fixture.claim,
  mechanism: fixture.mechanism,
  krnImplication: fixture.krnImplication,
  doesNotProve: fixture.doesNotProve,
  sourceAuthority: "project-decision",
  supportType: "decision",
  consumer: fixture.consumer,
  falsifier: fixture.falsifier,
  status: "accepted",
  metadata: {
    eval: "memory-advantage"
  },
  createdAt: now,
  updatedAt: now
});

const searchDocumentFromClaim = (
  claim: SourceClaim
): SearchDocumentRecord => ({
  id: `search:${claim.id}`,
  projectId,
  subjectType: "source_artifact",
  subjectId: claim.sourceArtifactId,
  sourceArtifactId: claim.sourceArtifactId,
  sourceAuthority: claim.sourceAuthority,
  validityStatus: "active",
  language: "en",
  title: claim.claim,
  body: [claim.claim, claim.mechanism, claim.krnImplication].join(" "),
  searchText: [claim.claim, claim.mechanism, claim.krnImplication, claim.consumer].join(" "),
  metadataFilters: {},
  validFrom: now,
  metadata: {
    eval: "memory-advantage"
  },
  createdAt: now,
  updatedAt: now
});

const memoryRecordFromReadModel = (
  readModel: MemoryAdvantageReadModelFixture
): MemoryRecord => ({
  id: `memory:${readModel.id}`,
  projectId,
  key: readModel.id,
  kind: "procedure",
  status: "active",
  summary: readModel.title,
  body: readModel.summary,
  owner: "memory-advantage-eval",
  confidence: 95,
  applicationGuidance: readModel.nextAction,
  sourceLineage: readModel.consumers.map((consumer) => ({
    sourceId: consumer,
    note: "memory advantage eval fixture"
  })),
  isUserPreference: false,
  validFrom: now,
  positiveFeedbackCount: 0,
  negativeFeedbackCount: 0,
  metadata: {
    eval: "memory-advantage",
    doesNotProve: readModel.doesNotProve,
    falsifier: readModel.falsifier
  },
  createdAt: now,
  updatedAt: now
});

const isExcludedMemoryReadModel = (
  readModel: MemoryAdvantageCatalogReadModelFixture
): readModel is MemoryAdvantageExcludedMemoryFixture =>
  "exclusionReason" in readModel;

const hasRuntimeExclusion = (
  readModel: MemoryAdvantageReadModelFixture
): boolean =>
  readModel.runtimeExclusion !== undefined;

const selectableMemoryReadModels = (
  readModels: readonly MemoryAdvantageCatalogReadModelFixture[]
): readonly MemoryAdvantageReadModelFixture[] =>
  readModels.filter((readModel): readModel is MemoryAdvantageReadModelFixture =>
    !isExcludedMemoryReadModel(readModel) && !hasRuntimeExclusion(readModel)
  );

const throwingRepositoryMethod = (method: string): never => {
  throw new Error(`${method} should not be called by memory advantage eval`);
};

const sourceDecisionEdgeForEvalClaim = (
  sourceClaimId: SourceClaim["id"]
): SourceDecisionEdge => ({
  id: `decision-edge:${sourceClaimId}`,
  sourceClaimId,
  targetType: "eval_candidate",
  targetId: "eval:memory-advantage",
  supportType: "decision",
  confidence: "high",
  notes: "Memory advantage eval fixture links accepted source evidence to the eval candidate.",
  metadata: {
    eval: "memory-advantage"
  },
  createdAt: now
});

const sourceDecisionEdgesForEvalClaim = (
  claims: readonly SourceClaim[],
  sourceClaimId: SourceClaim["id"]
): SourceDecisionEdge[] =>
  claims.some((claim) => claim.id === sourceClaimId)
    ? [sourceDecisionEdgeForEvalClaim(sourceClaimId)]
    : [];

const createMemoryAdvantageRuntime = (
  readModels: readonly MemoryAdvantageCatalogReadModelFixture[],
  sourceClaims: readonly MemoryAdvantageSourceClaimFixture[]
): DatabaseRuntime => {
  const claims = sourceClaims.map(sourceClaimFromFixture);
  const documents = claims.map(searchDocumentFromClaim);
  const memories = selectableMemoryReadModels(readModels).map(memoryRecordFromReadModel);
  const createRuntimeId = (prefix: string) => `${prefix}-memory-advantage-store`;
  const baseCompilerDependencies = createNoStoreCompilerDependencies({
    now: () => now,
    createId: createRuntimeId
  });
  const searchLexical = async (input: { query: string; limit?: number }) =>
    documents
      .map((document): SearchDocumentSearchResult => ({
        ...document,
        lexicalScore: tokenScore(input.query, document.searchText)
      }))
      .filter((document) => document.lexicalScore > 0)
      .sort((left, right) => right.lexicalScore - left.lexicalScore)
      .slice(0, input.limit ?? documents.length);

  return {
    workspaceId: "workspace:memory-advantage",
    projectId,
    compilerDependencies: {
      ...baseCompilerDependencies,
      memoryRepository: {
        listActiveMemory: async () => memories,
        listAntiMemoryForProject: async () => []
      },
      sourceRepository: {
        listClaimsForProject: async () => claims,
        listSourceClaimEdgesForClaim: async () => [],
        listSourceDecisionEdgesForClaim: async (sourceClaimId) =>
          sourceDecisionEdgesForEvalClaim(claims, sourceClaimId)
      },
      retrievalRepository: {
        ...baseCompilerDependencies.retrievalRepository,
        searchLexical,
        storeContextSelection: async () => undefined
      }
    },
    harnessRunRepository: {
      createExecutionRun: async () => throwingRepositoryMethod("createExecutionRun"),
      getHarnessRunByExecutionRunId: async () => throwingRepositoryMethod("getHarnessRunByExecutionRunId"),
      createEvidenceBundle: async () => throwingRepositoryMethod("createEvidenceBundle"),
      createReviewAssessment: async () => throwingRepositoryMethod("createReviewAssessment"),
      createFeedbackDelta: async () => throwingRepositoryMethod("createFeedbackDelta"),
      listFeedbackDeltasForProject: async () => []
    },
    sourceRepository: {
      createSourceArtifact: async () => throwingRepositoryMethod("createSourceArtifact"),
      createSourceClaim: async () => throwingRepositoryMethod("createSourceClaim"),
      getSourceClaimById: async (id) => claims.find((claim) => claim.id === id),
      listClaimsForProject: async () => claims,
      createSourceClaimEdge: async () => throwingRepositoryMethod("createSourceClaimEdge"),
      listSourceClaimEdgesForClaim: async () => [],
      createSourceDecisionEdge: async () => throwingRepositoryMethod("createSourceDecisionEdge"),
      getSourceDecisionEdgeById: async () => undefined,
      createSourceRejection: async () => throwingRepositoryMethod("createSourceRejection"),
      listSourceDecisionEdgesForClaim: async (sourceClaimId) =>
        [...sourceDecisionEdgesForEvalClaim(claims, sourceClaimId)]
    },
    retrievalRepository: {
      createSearchDocument: async () => throwingRepositoryMethod("createSearchDocument"),
      searchLexical,
      listSearchDocumentsForSourceLinks: async (input) =>
        documents.filter((document) =>
          input.sourceClaimIds === undefined ||
          (document.sourceClaimId !== undefined && input.sourceClaimIds.includes(document.sourceClaimId))
        )
    },
    memoryRepository: {
      createMemoryCandidate: async () => throwingRepositoryMethod("createMemoryCandidate"),
      getMemoryCandidateById: async () => throwingRepositoryMethod("getMemoryCandidateById"),
      promoteReviewedMemoryCandidate: async () => throwingRepositoryMethod("promoteReviewedMemoryCandidate"),
      rejectMemoryCandidate: async () => throwingRepositoryMethod("rejectMemoryCandidate"),
      getMemoryRecordById: async (id) => memories.find((memory) => memory.id === id),
      listMemoryRecordsForProject: async () => memories,
      listActiveMemory: async () => memories.filter((memory) => memory.status === "active"),
      invalidateMemoryRecord: async () => throwingRepositoryMethod("invalidateMemoryRecord"),
      recordMemoryApplication: async () => throwingRepositoryMethod("recordMemoryApplication"),
      createMemoryFeedbackEvent: async () => throwingRepositoryMethod("createMemoryFeedbackEvent"),
      createAntiMemoryCandidate: async () => throwingRepositoryMethod("createAntiMemoryCandidate"),
      getAntiMemoryCandidateById: async () => throwingRepositoryMethod("getAntiMemoryCandidateById"),
      promoteReviewedAntiMemoryCandidate: async () => throwingRepositoryMethod("promoteReviewedAntiMemoryCandidate"),
      rejectAntiMemoryCandidate: async () => throwingRepositoryMethod("rejectAntiMemoryCandidate")
    },
    close: async () => undefined
  };
};

const writeKnowledgeCatalog = async (
  catalogReadModels: readonly MemoryAdvantageCatalogReadModelFixture[]
): Promise<{
  readonly root: string;
  readonly catalogFile: string;
  readonly writtenReadModelIds: readonly string[];
}> => {
  const root = await mkdtemp(join(tmpdir(), "krn-memory-advantage-"));
  const catalogFile = join(root, "catalog.json");
  const readModels = selectableMemoryReadModels(catalogReadModels).map((readModel) => ({
    id: readModel.id,
    kind: "procedure",
    status: "active",
    title: readModel.title,
    summary: readModel.summary,
    confidence: "high",
    reviewability: "ready",
    sourceRefs: readModel.consumers,
    evidenceRefs: [`fixture:${readModel.id}`],
    consumers: readModel.consumers,
    falsifier: readModel.falsifier,
    doesNotProve: readModel.doesNotProve,
    temporal: {
      kind: "current",
      observedAt: "2026-07-04"
    },
    dissent: {
      kind: "none"
    },
    nextAction: readModel.nextAction
  }));
  const readModelFiles = await Promise.all(readModels.map(async (readModel, index) => {
    const readModelFile = `readModel-${index + 1}.json`;

    await writeFile(join(root, readModelFile), JSON.stringify(readModel, null, 2), "utf8");
    return readModelFile;
  }));

  await writeFile(catalogFile, JSON.stringify({
    readModelFiles,
    knowledgeFiles: [],
    usefulnessFeedbackFiles: []
  }, null, 2), "utf8");

  return {
    root,
    catalogFile,
    writtenReadModelIds: readModels.map((readModel) => readModel.id)
  };
};

const runCaseVariant = async (
  testCase: MemoryAdvantageCaseFixture,
  readModels: readonly MemoryAdvantageCatalogReadModelFixture[],
  sourceClaims: readonly MemoryAdvantageSourceClaimFixture[],
  idSuffix: string,
  storeOnly: boolean
): Promise<BrainSearchPreviewReadback> => {
  const knowledgeStore =
    storeOnly || selectableMemoryReadModels(readModels).length === 0
      ? undefined
      : await writeKnowledgeCatalog(readModels);
  const command: BrainSearchCommand = {
    kind: "brainSearch",
    query: testCase.query,
    catalogFiles: knowledgeStore === undefined ? [] : [knowledgeStore.catalogFile],
    storeOnly,
    limit: 5,
    maxInclusions: 5,
    format: "json"
  };

  try {
    const result = await runBrainSearchCommand({
      cwd: process.cwd(),
      env: {
        KRN_DATABASE_URL: "memory-advantage://store"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-memory-advantage-${idSuffix}`,
      command,
      createDatabaseRuntime: async () => createMemoryAdvantageRuntime(readModels, sourceClaims)
    });

    return parseBrainSearchPreview(
      result.stdout,
      `${testCase.id}.${idSuffix}`,
      knowledgeStore?.writtenReadModelIds ?? []
    );
  } finally {
    if (knowledgeStore !== undefined) {
      await rm(knowledgeStore.root, {
        recursive: true,
        force: true
      });
    }
  }
};

const isBaselineMiss = (
  readback: BrainSearchPreviewReadback
): boolean =>
  readback.answerUsefulness === "not_useful" && readback.selectedKnowledgeIds.length === 0;

const isKrnHit = (
  readback: BrainSearchPreviewReadback,
  testCase: MemoryAdvantageCaseFixture
): boolean => {
  if (readback.answerUsefulness !== "useful") {
    return false;
  }

  return testCase.expectedSelectedKnowledgeId.startsWith("source:")
    ? readback.selectedSourceClaimIds.includes(testCase.expectedSelectedKnowledgeId)
    : readback.selectedKnowledgeIds.includes(testCase.expectedSelectedKnowledgeId);
};

const buildMemoryExclusions = (
  testCase: MemoryAdvantageCaseFixture
): readonly MemoryAdvantageMemoryExclusionReadback[] => {
  const explicitExclusions = testCase.priorSession.excludedMemoryReadModels.map((readModel) => ({
    memoryId: `memory:${readModel.id}`,
    reason: readModel.exclusionReason
  }));
  const runtimeExclusions = [
    ...testCase.priorSession.memoryReadModels,
    ...testCase.priorSession.distractorMemoryReadModels
  ].flatMap((readModel) =>
    readModel.runtimeExclusion === undefined
      ? []
      : [{
          memoryId: `memory:${readModel.id}`,
          reason: `${readModel.runtimeExclusion.relation} ${readModel.runtimeExclusion.sourceClaimId}: ${readModel.runtimeExclusion.reason}`
        }]
  );

  return [
    ...explicitExclusions,
    ...runtimeExclusions
  ];
};

const buildSourceClaimExclusions = (
  testCase: MemoryAdvantageCaseFixture
): readonly MemoryAdvantageSourceClaimExclusionReadback[] =>
  testCase.priorSession.excludedSourceClaims.map((claim) => ({
    sourceClaimId: claim.sourceClaimId,
    reason: claim.exclusionReason
  }));

interface SimpleRetrievalCandidate {
  readonly id: string;
  readonly kind: "memory" | "source_claim";
  readonly score: number;
}

const simpleRetrievalCandidates = (
  testCase: MemoryAdvantageCaseFixture
): readonly SimpleRetrievalCandidate[] => {
  const memoryCandidates = [
    ...testCase.priorSession.memoryReadModels,
    ...testCase.priorSession.excludedMemoryReadModels,
    ...testCase.priorSession.distractorMemoryReadModels
  ].map((readModel): SimpleRetrievalCandidate => ({
    id: readModel.id,
    kind: "memory",
    score: tokenScore(testCase.query, [readModel.title, readModel.summary, readModel.nextAction].join(" "))
  }));
  const sourceClaimCandidates = [
    ...testCase.priorSession.sourceClaims,
    ...testCase.priorSession.excludedSourceClaims,
    ...testCase.priorSession.distractorSourceClaims
  ].map((claim): SimpleRetrievalCandidate => ({
    id: claim.sourceClaimId,
    kind: "source_claim",
    score: tokenScore(
      testCase.query,
      [claim.claim, claim.mechanism, claim.krnImplication].join(" ")
    )
  }));

  return [
    ...memoryCandidates,
    ...sourceClaimCandidates
  ]
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, 5);
};

const simpleRetrievalResult = (
  selectedKnowledgeIds: readonly string[],
  expectedSelectedKnowledgeId: string
): SimpleRetrievalResult => {
  if (selectedKnowledgeIds.length === 0) {
    return "miss";
  }

  return selectedKnowledgeIds[0] === expectedSelectedKnowledgeId
    ? "top_match_selected"
    : "distractor_selected";
};

const runSimpleRetrievalBaseline = (
  testCase: MemoryAdvantageCaseFixture
): MemoryAdvantageCaseReadback["baseline_simple_retrieval"] => {
  const candidates = simpleRetrievalCandidates(testCase);
  const selectedKnowledgeIds = candidates.map((candidate) => candidate.id);
  const selectedMemoryIds = candidates
    .filter((candidate) => candidate.kind === "memory")
    .map((candidate) => candidate.id);
  const selectedSourceClaimIds = candidates
    .filter((candidate) => candidate.kind === "source_claim")
    .map((candidate) => candidate.id);

  return {
    baselineClass: simpleRetrievalBaselineClass,
    result: simpleRetrievalResult(selectedKnowledgeIds, testCase.expectedSelectedKnowledgeId),
    selectedKnowledgeIds,
    selectedMemoryIds,
    selectedSourceClaimIds,
    selectedContextSize: approximateSelectedContextSizeFromParts(selectedKnowledgeIds)
  };
};

const deriveDecisionOptionId = (
  defaultOptionId: string,
  decisionOptions: readonly MemoryAdvantageDecisionOptionFixture[],
  selectedKnowledgeIds: readonly string[]
): string => {
  for (const selectedKnowledgeId of selectedKnowledgeIds) {
    const option = decisionOptions.find((decisionOption) =>
      decisionOption.triggerKnowledgeIds.includes(selectedKnowledgeId)
    );

    if (option !== undefined) {
      return option.id;
    }
  }

  return defaultOptionId;
};

const deriveCodingDecisionId = (
  codingTask: MemoryAdvantageCodingTaskFixture,
  selectedKnowledgeIds: readonly string[]
): string => {
  return deriveDecisionOptionId(codingTask.defaultDecisionId, codingTask.decisionOptions, selectedKnowledgeIds);
};

const buildCodingTaskDecision = (
  testCase: MemoryAdvantageCaseFixture,
  simpleRetrieval: MemoryAdvantageCaseReadback["baseline_simple_retrieval"],
  krnMemory: MemoryAdvantageCaseReadback["krn_memory"]
): CodingTaskDecisionReadback | undefined => {
  const { codingTask } = testCase;

  if (codingTask === undefined) {
    return undefined;
  }

  // Source claims are decision-grade evidence in this proxy; they must be evaluated before retained memory knowledge.
  const krnSelectedKnowledgeIds = [
    ...krnMemory.selectedSourceClaimIds,
    ...krnMemory.selectedKnowledgeIds
  ];
  const memoryFirstKrnSelectedKnowledgeIds = [
    ...krnMemory.selectedKnowledgeIds,
    ...krnMemory.selectedSourceClaimIds
  ];
  const baselineDecisionId = deriveCodingDecisionId(codingTask, simpleRetrieval.selectedKnowledgeIds);
  const krnDecisionId = deriveCodingDecisionId(codingTask, krnSelectedKnowledgeIds);
  const memoryFirstCounterfactualDecisionId = deriveCodingDecisionId(codingTask, memoryFirstKrnSelectedKnowledgeIds);
  const status = baselineDecisionId !== krnDecisionId &&
    krnDecisionId === codingTask.expectedKrnDecisionId
    ? "pass"
    : "fail";

  return {
    taskId: codingTask.id,
    implementationConstraint: codingTask.implementationConstraint,
    expectedKrnDecisionId: codingTask.expectedKrnDecisionId,
    decisionDerivationOrder: "source_claims_first",
    memoryFirstCounterfactualDecisionId,
    selectedContextSize: krnMemory.selectedContextSize,
    baseline: {
      baselineClass: simpleRetrieval.baselineClass,
      decisionId: baselineDecisionId,
      selectedKnowledgeIds: simpleRetrieval.selectedKnowledgeIds
    },
    krn: {
      decisionId: krnDecisionId,
      selectedKnowledgeIds: krnSelectedKnowledgeIds,
      selectedMemoryIds: krnMemory.selectedMemoryIds,
      selectedSourceClaimIds: krnMemory.selectedSourceClaimIds
    },
    status
  };
};

const buildExecutionContractDecision = (
  testCase: MemoryAdvantageCaseFixture,
  simpleRetrieval: MemoryAdvantageCaseReadback["baseline_simple_retrieval"],
  krnMemory: MemoryAdvantageCaseReadback["krn_memory"]
): ExecutionContractDecisionReadback | undefined => {
  const { executionContract } = testCase;

  if (executionContract === undefined) {
    return undefined;
  }

  const krnSelectedKnowledgeIds = [
    ...krnMemory.selectedSourceClaimIds,
    ...krnMemory.selectedKnowledgeIds
  ];
  const baselineContractId = deriveDecisionOptionId(
    executionContract.defaultContractId,
    executionContract.contractOptions,
    simpleRetrieval.selectedKnowledgeIds
  );
  const krnContractId = deriveDecisionOptionId(
    executionContract.defaultContractId,
    executionContract.contractOptions,
    krnSelectedKnowledgeIds
  );
  const contractMatchesExpected = krnContractId === executionContract.expectedKrnContractId;
  const expectedDeltaSatisfied = testCase.falsificationClass === "breaks_interdependent_advantage"
    ? baselineContractId === krnContractId
    : baselineContractId !== krnContractId;
  const status = expectedDeltaSatisfied && contractMatchesExpected
    ? "pass"
    : "fail";

  return {
    contractId: executionContract.id,
    objective: executionContract.objective,
    expectedKrnContractId: executionContract.expectedKrnContractId,
    derivationOrder: "source_claims_first",
    proof: executionContract.proof,
    doesNotProve: executionContract.doesNotProve,
    selectedContextSize: krnMemory.selectedContextSize,
    baseline: {
      baselineClass: simpleRetrieval.baselineClass,
      contractId: baselineContractId,
      decisionOrderedKnowledgeIds: simpleRetrieval.selectedKnowledgeIds,
      selectedMemoryIds: simpleRetrieval.selectedMemoryIds,
      selectedSourceClaimIds: simpleRetrieval.selectedSourceClaimIds
    },
    krn: {
      contractId: krnContractId,
      decisionOrderedKnowledgeIds: krnSelectedKnowledgeIds,
      selectedMemoryIds: krnMemory.selectedMemoryIds,
      selectedSourceClaimIds: krnMemory.selectedSourceClaimIds
    },
    status
  };
};

const isSimpleRetrievalWeakerThanKrn = (
  testCase: MemoryAdvantageCaseFixture,
  simpleRetrieval: MemoryAdvantageCaseReadback["baseline_simple_retrieval"],
  krnResult: "hit" | "miss"
): boolean => {
  if (testCase.expectedKrnResult === "hit") {
    return krnResult === "hit" && simpleRetrieval.result !== "top_match_selected";
  }

  return krnResult === "miss" && simpleRetrieval.result === "top_match_selected";
};

const buildReviewedFeedbackEffect = (
  testCase: MemoryAdvantageCaseFixture,
  baselineNoMemory: MemoryAdvantageCaseReadback["baseline_no_memory"],
  simpleRetrieval: MemoryAdvantageCaseReadback["baseline_simple_retrieval"],
  krnMemory: MemoryAdvantageCaseReadback["krn_memory"],
  krnPlanBrief: PlanBriefReadback
): ReviewedFeedbackEffectReadback => {
  const simpleRetrievalWeakerThanKrn = isSimpleRetrievalWeakerThanKrn(
    testCase,
    simpleRetrieval,
    krnMemory.result
  );
  const krnMatchesExpected = testCase.expectedKrnResult === "hit"
    ? krnMemory.result === "hit"
    : krnMemory.result === "miss";
  const proofStatus =
    baselineNoMemory.result === "miss" &&
    krnMatchesExpected &&
    (simpleRetrievalWeakerThanKrn || baselineNoMemory.selectedKnowledgeIds.length === 0)
      ? "pass"
      : "fail";

  return {
    priorFeedbackRef: testCase.priorSession.feedbackRef,
    priorEvidenceRef: testCase.priorSession.evidenceRef,
    priorReviewRef: testCase.priorSession.reviewRef,
    applicationOutcome: testCase.priorSession.applicationOutcome,
    laterTaskQuery: testCase.query,
    requiredKnowledgeId: testCase.expectedSelectedKnowledgeId,
    baselineNoMemoryResult: baselineNoMemory.result,
    simpleRetrievalResult: simpleRetrieval.result,
    simpleRetrievalTopKnowledgeId: simpleRetrieval.selectedKnowledgeIds[0] ?? null,
    simpleRetrievalWeakerThanKrn,
    krnResult: krnMemory.result,
    selectedMemoryIds: krnMemory.selectedMemoryIds,
    selectedSourceClaimIds: krnMemory.selectedSourceClaimIds,
    selectedContextSize: krnMemory.selectedContextSize,
    planBriefContextSize: krnPlanBrief.contextSize,
    proofStatus
  };
};

const expectedKrnReadbackResult = (
  expectedKrnResult: ExpectedKrnResult
): "hit" | "miss" =>
  expectedKrnResult === "hit" ? "hit" : "miss";

const simpleRetrievalAlreadySufficient = (
  testCase: MemoryAdvantageCaseFixture,
  simpleRetrieval: MemoryAdvantageCaseReadback["baseline_simple_retrieval"],
  krnMemory: MemoryAdvantageCaseReadback["krn_memory"]
): boolean =>
  simpleRetrieval.result === "top_match_selected" &&
  krnMemory.result === expectedKrnReadbackResult(testCase.expectedKrnResult);

const isKrnAdvantageWin = (
  testCase: MemoryAdvantageCaseFixture,
  simpleRetrieval: MemoryAdvantageCaseReadback["baseline_simple_retrieval"],
  krnMemory: MemoryAdvantageCaseReadback["krn_memory"]
): boolean =>
  (testCase.expectedKrnResult === "hit" &&
    krnMemory.result === "hit" &&
    simpleRetrieval.result !== "top_match_selected") ||
  (testCase.expectedKrnResult === "miss" &&
    krnMemory.result === "miss" &&
    simpleRetrieval.result === "top_match_selected");

const advantageDeltaResult = (
  testCase: MemoryAdvantageCaseFixture,
  simpleRetrieval: MemoryAdvantageCaseReadback["baseline_simple_retrieval"],
  krnMemory: MemoryAdvantageCaseReadback["krn_memory"]
): MemoryAdvantageDelta => {
  if (testCase.falsificationClass !== undefined && simpleRetrievalAlreadySufficient(testCase, simpleRetrieval, krnMemory)) {
    return "neutral";
  }

  return isKrnAdvantageWin(testCase, simpleRetrieval, krnMemory) ? "win" : "loss";
};

const advantageDeltaReason = (
  result: MemoryAdvantageDelta,
  falsificationClass: MemoryAdvantageFalsificationClass | undefined
): string => {
  const reasons: Record<MemoryAdvantageDelta, string> = {
    win: "KRN selected or refused the expected knowledge where simple lexical retrieval did not",
    neutral: `${falsificationClass ?? "neutral"}: simple lexical retrieval already selected the expected knowledge id`,
    loss: "KRN did not outperform the simple lexical baseline for the declared expectation"
  };

  return reasons[result];
};

const advantageLimitationScope = (
  result: MemoryAdvantageDelta,
  falsificationClass: MemoryAdvantageFalsificationClass | undefined
): AdvantageLimitationScope | undefined => {
  if (result === "win") {
    return undefined;
  }

  if (falsificationClass === "breaks_interdependent_advantage") {
    return "broken_prior_advantage";
  }

  return result === "neutral" ? "neutral_no_advantage" : "loss";
};

const classifyAdvantageLimitation = (
  testCase: MemoryAdvantageCaseFixture,
  result: MemoryAdvantageDelta,
  simpleRetrieval: MemoryAdvantageCaseReadback["baseline_simple_retrieval"],
  krnMemory: MemoryAdvantageCaseReadback["krn_memory"]
): AdvantageLimitationClass => {
  if (simpleRetrievalAlreadySufficient(testCase, simpleRetrieval, krnMemory)) {
    return "baseline_already_sufficient";
  }

  if (krnMemory.result !== expectedKrnReadbackResult(testCase.expectedKrnResult)) {
    return "retrieval_miss";
  }

  if (result === "loss") {
    return "grounding_failure";
  }

  return testCase.falsificationClass === undefined
    ? "regression_candidate"
    : "inherent_parity";
};

const advantageLimitationReason = (
  testCase: MemoryAdvantageCaseFixture,
  classification: AdvantageLimitationClass
): string => {
  const reasons: Record<AdvantageLimitationClass, string> = {
    baseline_already_sufficient:
      "The simple lexical baseline already selected the expected knowledge or contract, so this case bounds the advantage claim instead of supporting it.",
    inherent_parity:
      "The task shape is intentionally easy enough that memory is not expected to improve the result.",
    retrieval_miss:
      "KRN did not select the expected result for this case, so the failure should be investigated as retrieval or fixture drift.",
    grounding_failure:
      "KRN selected a plausible result but did not outperform the simple lexical baseline for the declared expectation.",
    fixture_stale:
      "The case appears stale relative to the current fixture expectation.",
    regression_candidate:
      "The case lacks an explicit falsification class, so a non-win should be treated as a possible regression until triaged."
  };

  return `${testCase.falsificationClass ?? "no_falsification_class"}: ${reasons[classification]}`;
};

const buildAdvantageLimitation = (
  testCase: MemoryAdvantageCaseFixture,
  result: MemoryAdvantageDelta,
  simpleRetrieval: MemoryAdvantageCaseReadback["baseline_simple_retrieval"],
  krnMemory: MemoryAdvantageCaseReadback["krn_memory"]
): AdvantageLimitationReadback | undefined => {
  const scope = advantageLimitationScope(result, testCase.falsificationClass);

  if (scope === undefined) {
    return undefined;
  }

  const classification = classifyAdvantageLimitation(testCase, result, simpleRetrieval, krnMemory);

  return {
    scope,
    classification,
    reason: advantageLimitationReason(testCase, classification),
    proof: `simpleRetrieval=${simpleRetrieval.result}; krn=${krnMemory.result}; expected=${testCase.expectedKrnResult}`,
    doesNotProve: "This classification does not prove broad memory superiority, fixture truth, or production ranking quality."
  };
};

const buildAdvantageDelta = (
  testCase: MemoryAdvantageCaseFixture,
  simpleRetrieval: MemoryAdvantageCaseReadback["baseline_simple_retrieval"],
  krnMemory: MemoryAdvantageCaseReadback["krn_memory"]
): MemoryAdvantageCaseReadback["advantageDelta"] => {
  const result = advantageDeltaResult(testCase, simpleRetrieval, krnMemory);
  const limitation = buildAdvantageLimitation(testCase, result, simpleRetrieval, krnMemory);

  return {
    result,
    reason: advantageDeltaReason(result, testCase.falsificationClass),
    simpleRetrievalAlreadySufficient: simpleRetrievalAlreadySufficient(testCase, simpleRetrieval, krnMemory),
    ...(limitation === undefined ? {} : { limitation })
  };
};

export interface SourceContributionSignals {
  readonly selectedSource: boolean;
  readonly krnHit: boolean;
  readonly sourceDisabledHit: boolean;
  readonly sourceDisabledUseful: boolean;
  readonly advantageWin: boolean;
}

const sourceContributionRules = [
  {
    contribution: "source_required_for_hit",
    matches: (signals: SourceContributionSignals) =>
      signals.selectedSource && signals.krnHit && !signals.sourceDisabledHit
  },
  {
    contribution: "memory_only_sufficient",
    matches: (signals: SourceContributionSignals) =>
      signals.selectedSource && signals.krnHit && signals.sourceDisabledHit && signals.advantageWin
  },
  {
    contribution: "source_zero_delta",
    matches: (signals: SourceContributionSignals) =>
      signals.selectedSource && signals.krnHit && signals.sourceDisabledHit && !signals.advantageWin
  },
  {
    contribution: "source_noise",
    matches: (signals: SourceContributionSignals) =>
      signals.selectedSource && !signals.krnHit && signals.sourceDisabledUseful
  }
] satisfies readonly {
  readonly contribution: SourceContributionClass;
  readonly matches: (signals: SourceContributionSignals) => boolean;
}[];

export const classifySourceContribution = (
  signals: SourceContributionSignals
): SourceContributionClass =>
  sourceContributionRules.find((rule) => rule.matches(signals))?.contribution ?? "no_source_selected";

export const sourcePruneCandidateIds = (
  contribution: SourceContributionClass,
  selectedSourceClaimIds: readonly string[]
): readonly string[] =>
  contribution === "source_zero_delta" || contribution === "source_noise"
    ? selectedSourceClaimIds
    : [];

const sourceContributionClass = (
  krnMemory: MemoryAdvantageCaseReadback["krn_memory"],
  sourceDisabled: BrainSearchPreviewReadback,
  sourceDisabledResult: "hit" | "miss",
  advantageDelta: MemoryAdvantageCaseReadback["advantageDelta"]
): SourceContributionClass => {
  const signals: SourceContributionSignals = {
    selectedSource: krnMemory.selectedSourceClaimIds.length > 0,
    krnHit: krnMemory.result === "hit",
    sourceDisabledHit: sourceDisabledResult === "hit",
    sourceDisabledUseful:
      sourceDisabled.answerUsefulness === "useful" &&
      sourceDisabled.selectedKnowledgeIds.length > 0,
    advantageWin: advantageDelta.result === "win"
  };

  return classifySourceContribution(signals);
};

const buildSourceContribution = (
  testCase: MemoryAdvantageCaseFixture,
  krnMemory: MemoryAdvantageCaseReadback["krn_memory"],
  sourceDisabled: BrainSearchPreviewReadback,
  advantageDelta: MemoryAdvantageCaseReadback["advantageDelta"]
): SourceContributionReadback => {
  const sourceDisabledResult = isKrnHit(sourceDisabled, testCase) ? "hit" : "miss";
  const contribution = sourceContributionClass(krnMemory, sourceDisabled, sourceDisabledResult, advantageDelta);
  const zeroDeltaSourceClaimIds = contribution === "source_zero_delta"
    ? krnMemory.selectedSourceClaimIds
    : [];
  const pruneCandidateSourceClaimIds = sourcePruneCandidateIds(
    contribution,
    krnMemory.selectedSourceClaimIds
  );

  return {
    selectedSourceClaimIds: krnMemory.selectedSourceClaimIds,
    sourceDisabled: {
      result: sourceDisabledResult,
      selectedKnowledgeIds: sourceDisabled.selectedKnowledgeIds,
      selectedMemoryIds: selectedMemoryIds(sourceDisabled.selectedKnowledgeIds),
      selectedContextSize: approximateSelectedContextSize(sourceDisabled)
    },
    contribution,
    zeroDeltaSourceClaimIds,
    pruneCandidateSourceClaimIds,
    proof: "Source contribution is measured by rerunning the case with SourceClaim/SearchDocument inputs disabled while keeping memory readModels available.",
    doesNotProve: "This ablation does not prove source truth, optimal ranking, latency cost, or that a zero-delta source should be deleted automatically."
  };
};

const firstOrNone = (values: readonly string[]): string =>
  values[0] ?? "none";

const decisionFromSelection = (
  prefix: "select" | "reject" | "defer",
  id: string
): string => `${prefix}:${id}`;

const decisionBeforeMemory = (
  simpleRetrieval: MemoryAdvantageCaseReadback["baseline_simple_retrieval"]
): string => {
  if (simpleRetrieval.result === "miss") {
    return decisionFromSelection("defer", "missing-evidence");
  }

  return decisionFromSelection("select", firstOrNone(simpleRetrieval.selectedKnowledgeIds));
};

const decisionAfterKrn = (
  testCase: MemoryAdvantageCaseFixture,
  krnMemory: MemoryAdvantageCaseReadback["krn_memory"]
): string => {
  if (krnMemory.result === "hit") {
    return decisionFromSelection("select", testCase.expectedSelectedKnowledgeId);
  }

  const rejectedMemoryId = krnMemory.exclusions[0]?.memoryId;
  const rejectedSourceClaimId = krnMemory.sourceExclusions[0]?.sourceClaimId;

  if (rejectedMemoryId !== undefined) {
    return decisionFromSelection("reject", rejectedMemoryId);
  }

  if (rejectedSourceClaimId !== undefined) {
    return decisionFromSelection("reject", rejectedSourceClaimId);
  }

  return decisionFromSelection("defer", "missing-evidence");
};

const selectedEvidenceIds = (
  krnMemory: MemoryAdvantageCaseReadback["krn_memory"]
): readonly string[] => [
  ...krnMemory.selectedMemoryIds.map((id) => `memory:${id}`),
  ...krnMemory.selectedSourceClaimIds,
  ...krnMemory.exclusions.map((exclusion) => `excluded-memory:${exclusion.memoryId}`),
  ...krnMemory.sourceExclusions.map((exclusion) => `excluded-source:${exclusion.sourceClaimId}`)
];

const decisionChangeClass = (
  advantageDelta: MemoryAdvantageCaseReadback["advantageDelta"],
  krnMemory: MemoryAdvantageCaseReadback["krn_memory"],
  before: string,
  after: string
): ImplementationDecisionReadback["decisionChangeClass"] => {
  if (krnMemory.exclusions.length > 0 || krnMemory.sourceExclusions.length > 0) {
    return "rejection_protection";
  }

  if (before === after) {
    return "neutral";
  }

  if (advantageDelta.result === "loss") {
    return "regression";
  }

  return advantageDelta.result;
};

const decisionChangeReason = (
  input: {
    testCase: MemoryAdvantageCaseFixture;
    advantageDelta: MemoryAdvantageCaseReadback["advantageDelta"];
    before: string;
    after: string;
    krnMemory: MemoryAdvantageCaseReadback["krn_memory"];
  }
): string => {
  if (input.krnMemory.exclusions.length > 0 || input.krnMemory.sourceExclusions.length > 0) {
    return `KRN rejected stale or unsafe evidence before selecting authority for ${input.testCase.expectedSelectedKnowledgeId}.`;
  }

  if (input.before === input.after) {
    return `Memory did not change the implementation decision: ${input.advantageDelta.reason}`;
  }

  return `Memory changed the implementation decision: ${input.advantageDelta.reason}`;
};

const buildImplementationDecision = (
  testCase: MemoryAdvantageCaseFixture,
  simpleRetrieval: MemoryAdvantageCaseReadback["baseline_simple_retrieval"],
  krnMemory: MemoryAdvantageCaseReadback["krn_memory"],
  advantageDelta: MemoryAdvantageCaseReadback["advantageDelta"]
): ImplementationDecisionReadback => {
  const before = decisionBeforeMemory(simpleRetrieval);
  const after = decisionAfterKrn(testCase, krnMemory);

  return {
    decision_before_memory: before,
    decision_after_krn: after,
    selectedEvidenceRefs: [
      testCase.priorSession.evidenceRef,
      testCase.priorSession.reviewRef,
      testCase.priorSession.feedbackRef
    ],
    selectedEvidenceIds: selectedEvidenceIds(krnMemory),
    decisionChanged: before !== after,
    decisionChangeClass: decisionChangeClass(advantageDelta, krnMemory, before, after),
    reason: decisionChangeReason({
      testCase,
      advantageDelta,
      before,
      after,
      krnMemory
    }),
    doesNotProve:
      "This deterministic proxy does not prove live Codex would follow the decision without an execution-output evidence check."
  };
};

const expectedMemoryRecordId = (
  expectedSelectedKnowledgeId: string
): string | undefined =>
  expectedSelectedKnowledgeId.startsWith("source:")
    ? undefined
    : `memory:${expectedSelectedKnowledgeId}`;

const expectedSourceClaimId = (
  expectedSelectedKnowledgeId: string
): string | undefined =>
  expectedSelectedKnowledgeId.startsWith("source:")
    ? expectedSelectedKnowledgeId
    : undefined;

const selectedContextIds = (
  contextAssembly: { readonly inclusions: ContextAssemblyInclusionReadback[] }
): {
  readonly memoryRecordIds: readonly string[];
  readonly sourceClaimIds: readonly string[];
} => ({
  memoryRecordIds: contextAssembly.inclusions
    .filter((inclusion) => inclusion.subjectType === "memory_record")
    .map((inclusion) => inclusion.subjectId),
  sourceClaimIds: contextAssembly.inclusions
    .filter((inclusion) => inclusion.subjectType === "source_claim")
    .map((inclusion) => inclusion.subjectId)
});

type ContextAssemblyInclusionReadback = {
  readonly subjectType: string;
  readonly subjectId: string;
};

const renderedBriefHit = (input: {
  readonly expectedSelectedKnowledgeId: string;
  readonly selectedMemoryRecordIds: readonly string[];
  readonly selectedSourceClaimIds: readonly string[];
  readonly renderedMemoryRecordIds: readonly string[];
  readonly renderedSourceClaimIds: readonly string[];
  readonly renderedBrief: string;
}): boolean => {
  const requiredMemoryRecordId = expectedMemoryRecordId(input.expectedSelectedKnowledgeId);
  const requiredSourceClaimId = expectedSourceClaimId(input.expectedSelectedKnowledgeId);
  const memoryHit = requiredMemoryRecordId !== undefined &&
    input.selectedMemoryRecordIds.includes(requiredMemoryRecordId) &&
    input.renderedMemoryRecordIds.includes(requiredMemoryRecordId) &&
    input.renderedBrief.includes(requiredMemoryRecordId);
  const sourceHit = requiredSourceClaimId !== undefined &&
    input.selectedSourceClaimIds.includes(requiredSourceClaimId) &&
    input.renderedSourceClaimIds.includes(requiredSourceClaimId) &&
    input.renderedBrief.includes(requiredSourceClaimId);

  return memoryHit || sourceHit;
};

const planBriefResult = (
  baseline: boolean,
  hit: boolean
): PlanBriefReadback["result"] => {
  if (baseline) {
    return hit ? "unexpected_hit" : "miss";
  }

  return hit ? "hit" : "miss";
};

const planBriefContextPayloadParts = (
  readModels: readonly MemoryAdvantageCatalogReadModelFixture[],
  sourceClaims: readonly MemoryAdvantageSourceClaimFixture[],
  memoryRecordIds: readonly string[],
  sourceClaimIds: readonly string[]
): readonly string[] => {
  const memoryById = new Map(
    selectableMemoryReadModels(readModels).map((readModel) => [
      `memory:${readModel.id}`,
      [readModel.title, readModel.summary, readModel.nextAction].join("\n")
    ])
  );
  const sourceClaimById = new Map(
    sourceClaims.map((claim) => [
      claim.sourceClaimId,
      [claim.claim, claim.mechanism, claim.krnImplication, claim.doesNotProve].join("\n")
    ])
  );

  return [
    ...memoryRecordIds.flatMap((id) => {
      const payload = memoryById.get(id);
      return payload === undefined ? [] : [payload];
    }),
    ...sourceClaimIds.flatMap((id) => {
      const payload = sourceClaimById.get(id);
      return payload === undefined ? [] : [payload];
    })
  ];
};

const compilePlanBriefReadback = async (
  testCase: MemoryAdvantageCaseFixture,
  readModels: readonly MemoryAdvantageCatalogReadModelFixture[],
  sourceClaims: readonly MemoryAdvantageSourceClaimFixture[],
  baseline: boolean
): Promise<PlanBriefReadback> => {
  const runtime = createMemoryAdvantageRuntime(readModels, sourceClaims);
  const compiled = await compileHarnessPlan({
    workspaceId: runtime.workspaceId,
    projectId: runtime.projectId,
    operatorIntent: {
      rawIntent: testCase.query,
      source: "cli",
      metadata: {
        eval: "memory-advantage",
        caseId: testCase.id,
        variant: baseline ? "baseline_plan_brief" : "krn_plan_brief"
      }
    },
    taskContract: {
      title: `Memory advantage eval: ${testCase.id}`,
      objective: testCase.query,
      constraints: [
        "Use only retrieved KRN memory/source context.",
        "Do not infer unavailable prior-session project rules."
      ],
      nonGoals: [
        "Do not execute Codex.",
        "Do not mutate memory."
      ],
      acceptance: [
        "Required prior-session memory or source evidence is present in the rendered Codex brief when available."
      ]
    },
    tokenBudget: 2048,
    metadata: {
      eval: "memory-advantage",
      caseId: testCase.id
    }
  }, runtime.compilerDependencies);
  const brief = createExecutionBrief({
    taskContract: compiled.taskContract,
    contextAssembly: compiled.contextAssembly,
    capabilityPlan: compiled.capabilityPlan,
    evidenceContract: compiled.evidenceContract,
    nextAction: compiled.nextAction
  });
  const renderedBrief = renderExecutionBriefText(brief);
  const { memoryRecordIds, sourceClaimIds } = selectedContextIds(compiled.contextAssembly);
  const hit = renderedBriefHit({
    expectedSelectedKnowledgeId: testCase.expectedSelectedKnowledgeId,
    selectedMemoryRecordIds: memoryRecordIds,
    selectedSourceClaimIds: sourceClaimIds,
    renderedMemoryRecordIds: brief.memoryRecordsSelected,
    renderedSourceClaimIds: brief.sourceClaimsSelected,
    renderedBrief
  });

  return {
    baselineClass,
    result: planBriefResult(baseline, hit),
    requiredKnowledgeId: testCase.expectedSelectedKnowledgeId,
    selectedMemoryRecordIds: memoryRecordIds,
    selectedSourceClaimIds: sourceClaimIds,
    renderedMemoryRecordIds: brief.memoryRecordsSelected,
    renderedSourceClaimIds: brief.sourceClaimsSelected,
    contextInclusionCount: compiled.contextAssembly.inclusions.length,
    contextSize: approximateSelectedContextSizeFromParts(planBriefContextPayloadParts(
      readModels,
      sourceClaims,
      memoryRecordIds,
      sourceClaimIds
    )),
    renderedBriefSize: approximateSelectedContextSizeFromParts([renderedBrief])
  };
};

const isExpectedKrnResultSatisfied = (
  testCase: MemoryAdvantageCaseFixture,
  readback: BrainSearchPreviewReadback
): boolean => {
  const krnHit = isKrnHit(readback, testCase);

  if (testCase.expectedKrnResult === "hit") {
    return krnHit;
  }

  return !krnHit && readback.selectedKnowledgeIds.length === 0;
};

const caseStatus = (
  testCase: MemoryAdvantageCaseFixture,
  baseline: BrainSearchPreviewReadback,
  krnMemory: BrainSearchPreviewReadback,
  baselinePlanBrief: PlanBriefReadback,
  krnPlanBrief: PlanBriefReadback,
  hasExplicitExclusion: boolean,
  codingTaskDecision: CodingTaskDecisionReadback | undefined,
  executionContractDecision: ExecutionContractDecisionReadback | undefined
): "pass" | "fail" => {
  const canProveExpectedMiss = testCase.expectedKrnResult === "hit" || hasExplicitExclusion;
  const planBriefSatisfied = testCase.expectedKrnResult === "hit"
    ? baselinePlanBrief.result === "miss" && krnPlanBrief.result === "hit"
    : baselinePlanBrief.result === "miss" && krnPlanBrief.result === "miss";
  const codingTaskSatisfied = codingTaskDecision === undefined || codingTaskDecision.status === "pass";
  const executionContractSatisfied =
    executionContractDecision === undefined || executionContractDecision.status === "pass";
  const checks = [
    isBaselineMiss(baseline),
    isExpectedKrnResultSatisfied(testCase, krnMemory),
    planBriefSatisfied,
    canProveExpectedMiss,
    codingTaskSatisfied,
    executionContractSatisfied
  ];

  return checks.every((check) => check) ? "pass" : "fail";
};

const evaluateCase = async (
  testCase: MemoryAdvantageCaseFixture
): Promise<MemoryAdvantageCaseReadback> => {
  assertLexicalOverlap(testCase);
  const baseline = await runCaseVariant(testCase, [], [], "baseline", true);
  const simpleRetrieval = runSimpleRetrievalBaseline(testCase);
  const baselinePlanBrief = await compilePlanBriefReadback(testCase, [], [], true);
  const krnMemory = await runCaseVariant(
    testCase,
    [
      ...testCase.priorSession.memoryReadModels,
      ...testCase.priorSession.distractorMemoryReadModels,
      ...testCase.priorSession.excludedMemoryReadModels
    ],
    [
      ...testCase.priorSession.sourceClaims,
      ...testCase.priorSession.distractorSourceClaims
    ],
    "krn",
    false
  );
  const sourceDisabled = await runCaseVariant(
    testCase,
    [
      ...testCase.priorSession.memoryReadModels,
      ...testCase.priorSession.distractorMemoryReadModels,
      ...testCase.priorSession.excludedMemoryReadModels
    ],
    [],
    "source-disabled",
    false
  );
  const krnPlanBrief = await compilePlanBriefReadback(
    testCase,
    [
      ...testCase.priorSession.memoryReadModels,
      ...testCase.priorSession.distractorMemoryReadModels,
      ...testCase.priorSession.excludedMemoryReadModels
    ],
    [
      ...testCase.priorSession.sourceClaims,
      ...testCase.priorSession.distractorSourceClaims
    ],
    false
  );
  const baselineMiss = isBaselineMiss(baseline);
  const krnHit = isKrnHit(krnMemory, testCase);
  const exclusions = buildMemoryExclusions(testCase);
  const sourceExclusions = buildSourceClaimExclusions(testCase);
  const baselineSelectedMemoryIds = selectedMemoryIds(baseline.selectedKnowledgeIds);
  const krnSelectedMemoryIds = selectedMemoryIds(krnMemory.selectedKnowledgeIds);
  const baselineNoMemory = {
    baselineClass,
    result: baselineMiss ? "miss" : "unexpected_hit",
    answerUsefulness: baseline.answerUsefulness,
    selectedKnowledgeIds: baseline.selectedKnowledgeIds,
    selectedMemoryIds: baselineSelectedMemoryIds,
    selectedSourceClaimIds: baseline.selectedSourceClaimIds,
    selectedContextSize: approximateSelectedContextSize(baseline),
    missingEvidence: baseline.missingEvidence
  } as const;
  const krnMemoryReadback = {
    result: krnHit ? "hit" : "miss",
    answerUsefulness: krnMemory.answerUsefulness,
    selectedKnowledgeIds: krnMemory.selectedKnowledgeIds,
    selectedMemoryIds: krnSelectedMemoryIds,
    selectedSources: krnMemory.selectedSources,
    selectedSourceClaimIds: krnMemory.selectedSourceClaimIds,
    selectedContextSize: approximateSelectedContextSize(krnMemory),
    writtenKnowledgeIds: krnMemory.writtenKnowledgeIds,
    requiredKnowledgeId: testCase.expectedSelectedKnowledgeId,
    supportingClaims: krnMemory.supportingClaims,
    supportingDocuments: krnMemory.supportingDocuments,
    exclusions,
    sourceExclusions
  } as const;
  const codingTaskDecision = buildCodingTaskDecision(testCase, simpleRetrieval, krnMemoryReadback);
  const executionContractDecision = buildExecutionContractDecision(testCase, simpleRetrieval, krnMemoryReadback);
  const advantageDelta = buildAdvantageDelta(testCase, simpleRetrieval, krnMemoryReadback);
  const sourceContribution = buildSourceContribution(testCase, krnMemoryReadback, sourceDisabled, advantageDelta);
  const implementationDecision = buildImplementationDecision(
    testCase,
    simpleRetrieval,
    krnMemoryReadback,
    advantageDelta
  );
  const status = caseStatus(
    testCase,
    baseline,
    krnMemory,
    baselinePlanBrief,
    krnPlanBrief,
    exclusions.length > 0 || sourceExclusions.length > 0,
    codingTaskDecision,
    executionContractDecision
  );

  return {
    caseId: testCase.id,
    competency: testCase.competency,
    heldOut: testCase.heldOut,
    interdependentSession: testCase.interdependentSession === true,
    rememberedStandardChallenge: testCase.rememberedStandardChallenge,
    query: testCase.query,
    distractorClasses: testCase.distractorClasses,
    baselineFailureRationale: testCase.baselineFailureRationale,
    ...(testCase.negativeClass === undefined ? {} : { negativeClass: testCase.negativeClass }),
    ...(testCase.falsificationClass === undefined ? {} : { falsificationClass: testCase.falsificationClass }),
    advantageDelta,
    status,
    expectedKrnResult: testCase.expectedKrnResult,
    baselineClass,
    priorSession: {
      id: testCase.priorSession.id,
      task: testCase.priorSession.task,
      evidenceRef: testCase.priorSession.evidenceRef,
      reviewRef: testCase.priorSession.reviewRef,
      feedbackRef: testCase.priorSession.feedbackRef,
      applicationOutcome: testCase.priorSession.applicationOutcome,
      createdMemoryIds: testCase.priorSession.memoryReadModels.map((readModel) => `memory:${readModel.id}`),
      excludedMemoryIds: exclusions.map((exclusion) => exclusion.memoryId),
      distractorMemoryIds: testCase.priorSession.distractorMemoryReadModels.map((readModel) => `memory:${readModel.id}`),
      createdSourceClaimIds: testCase.priorSession.sourceClaims.map((claim) => claim.sourceClaimId),
      excludedSourceClaimIds: sourceExclusions.map((exclusion) => exclusion.sourceClaimId),
      distractorSourceClaimIds: testCase.priorSession.distractorSourceClaims.map((claim) => claim.sourceClaimId)
    },
    "baseline_no_memory": baselineNoMemory,
    "baseline_simple_retrieval": simpleRetrieval,
    "baseline_plan_brief": baselinePlanBrief,
    "krn_memory": krnMemoryReadback,
    "source_contribution": sourceContribution,
    "implementation_decision": implementationDecision,
    "krn_plan_brief": krnPlanBrief,
    ...(codingTaskDecision === undefined ? {} : { "coding_task_decision": codingTaskDecision }),
    ...(executionContractDecision === undefined
      ? {}
      : { "execution_contract_decision": executionContractDecision }),
    "reviewed_feedback_effect": buildReviewedFeedbackEffect(
      testCase,
      baselineNoMemory,
      simpleRetrieval,
      krnMemoryReadback,
      krnPlanBrief
    )
  };
};

const buildCompetencyCoverage = (
  cases: readonly MemoryAdvantageCaseReadback[]
): MemoryAdvantageEvalResult["competencies"] => {
  const summarize = (competency: MemoryAdvantageCompetency) => {
    const matchingCases = cases.filter((testCase) => testCase.competency === competency);

    return {
      status:
        matchingCases.length > 0 && matchingCases.every((testCase) => testCase.status === "pass")
          ? "pass"
          : "fail",
      caseIds: matchingCases.map((testCase) => testCase.caseId)
    } as const;
  };

  return {
    retrieval: summarize("retrieval"),
    learning: summarize("learning"),
    long_range: summarize("long_range"),
    forgetting: summarize("forgetting")
  };
};

const buildClaimGuard = (
  cases: readonly MemoryAdvantageCaseReadback[]
): MemoryAdvantageEvalResult["claimGuard"] => {
  const winCaseIds = cases
    .filter((testCase) => testCase.advantageDelta.result === "win")
    .map((testCase) => testCase.caseId);
  const neutralCaseIds = cases
    .filter((testCase) => testCase.advantageDelta.result === "neutral")
    .map((testCase) => testCase.caseId);
  const lossCaseIds = cases
    .filter((testCase) => testCase.advantageDelta.result === "loss")
    .map((testCase) => testCase.caseId);
  const broadProductClaim = neutralCaseIds.length === 0 && lossCaseIds.length === 0
    ? "allowed"
    : "blocked";

  return {
    broadProductClaim,
    reason: broadProductClaim === "allowed"
      ? "Every case beats the simple lexical baseline in this bounded fixture."
      : "Neutral or loss cases mean the benchmark can support bounded claims only, not broad Memory Core superiority.",
    winCaseIds,
    neutralCaseIds,
    lossCaseIds
  };
};

export const runMemoryAdvantageEval = async (
  fixture: MemoryAdvantageEvalFixture
): Promise<MemoryAdvantageEvalResult> => {
  const cases = await Promise.all(fixture.cases.map(evaluateCase));
  const competencies = buildCompetencyCoverage(cases);
  const status = cases.every((testCase) => testCase.status === "pass") &&
    memoryCompetencies.every((competency) => competencies[competency].status === "pass")
    ? "pass"
    : "fail";

  return {
    kind: "krn.memoryAdvantage.eval.v1",
    fixtureVersion: fixture.version,
    status,
    corpus: {
      name: fixture.corpusName,
      caseCount: cases.length,
      heldOutCaseCount: cases.filter((testCase) => testCase.heldOut).length,
      distractorClasses: fixture.distractorClasses
    },
    competencies,
    metrics: {
      caseCount: cases.length,
      heldOutCaseCount: cases.filter((testCase) => testCase.heldOut).length,
      expectedHitCount: cases.filter((testCase) =>
        testCase.expectedKrnResult === "hit"
      ).length,
      expectedMissCount: cases.filter((testCase) =>
        testCase.expectedKrnResult === "miss"
      ).length,
      advantageWinCount: cases.filter((testCase) =>
        testCase.advantageDelta.result === "win"
      ).length,
      noAdvantageCaseCount: cases.filter((testCase) =>
        testCase.advantageDelta.result === "neutral"
      ).length,
      advantageLossCount: cases.filter((testCase) =>
        testCase.advantageDelta.result === "loss"
      ).length,
      brokenPriorAdvantageCaseCount: cases.filter((testCase) =>
        testCase.falsificationClass === "breaks_interdependent_advantage"
      ).length,
      distractorClassCount: fixture.distractorClasses.length,
      interdependentSessionCaseCount: cases.filter((testCase) =>
        testCase.interdependentSession
      ).length,
      totalKrnMemoryContextBytes: cases.reduce(
        (sum, testCase) => sum + testCase["krn_memory"].selectedContextSize.bytes,
        0
      ),
      totalKrnPlanBriefContextBytes: cases.reduce(
        (sum, testCase) => sum + testCase["krn_plan_brief"].contextSize.bytes,
        0
      ),
      totalRenderedBriefBytes: cases.reduce(
        (sum, testCase) => sum + testCase["krn_plan_brief"].renderedBriefSize.bytes,
        0
      ),
      codingTaskCaseCount: cases.filter((testCase) => testCase["coding_task_decision"] !== undefined).length,
      implementationDecisionCaseCount: cases.filter((testCase) =>
        testCase["implementation_decision"].decision_before_memory.length > 0 &&
        testCase["implementation_decision"].decision_after_krn.length > 0
      ).length,
      implementationDecisionWinCount: cases.filter((testCase) =>
        testCase["implementation_decision"].decisionChangeClass === "win"
      ).length,
      implementationDecisionNeutralCount: cases.filter((testCase) =>
        testCase["implementation_decision"].decisionChangeClass === "neutral"
      ).length,
      implementationDecisionRejectionProtectionCount: cases.filter((testCase) =>
        testCase["implementation_decision"].decisionChangeClass === "rejection_protection"
      ).length,
      implementationDecisionRegressionCount: cases.filter((testCase) =>
        testCase["implementation_decision"].decisionChangeClass === "regression"
      ).length,
      executionContractCaseCount: cases.filter((testCase) =>
        testCase["execution_contract_decision"] !== undefined
      ).length,
      rememberedStandardChallengeCaseCount: cases.filter((testCase) =>
        testCase.rememberedStandardChallenge !== undefined
      ).length,
      rememberedStandardChallengeWinCount: cases.filter((testCase) =>
        testCase.rememberedStandardChallenge !== undefined && testCase.advantageDelta.result === "win"
      ).length,
      sourceDisabledAblationCaseCount: cases.length,
      sourceRequiredCaseCount: cases.filter((testCase) =>
        testCase["source_contribution"].contribution === "source_required_for_hit"
      ).length,
      sourceZeroDeltaCaseCount: cases.filter((testCase) =>
        testCase["source_contribution"].contribution === "source_zero_delta"
      ).length,
      sourcePruneCandidateCount: cases.reduce(
        (sum, testCase) => sum + testCase["source_contribution"].pruneCandidateSourceClaimIds.length,
        0
      )
    },
    cases,
    claimGuard: buildClaimGuard(cases),
    proof: {
      proves: [
        "the fixture query is unsupported when no KRN memory or source evidence is available",
        "the memory advantage output reports corpus metadata, per-case baseline failure rationale, and aggregate context-size cost proxies",
        "a simple lexical retrieval baseline is reported so no-memory misses are not the only comparator",
        "a priorSession fixture supplies evidence, review, feedback refs, and nested learned memory/source inputs before the later task can hit",
        "at least one interdependent multi-session case marks that Session B depends on Session A evidence or feedback",
        "falsification cases report neutral no-advantage deltas when simple lexical retrieval already selects the expected knowledge",
        "non-winning advantage deltas carry limitation classifications with deterministic simple-retrieval, KRN, and expected-result proof tuples",
        "at least one interdependent-style case can break the earlier memory-advantage shape by showing the baseline selects the same evidence-shaped contract",
        "remembered-standard memory/source inputs from the in-memory eval store are selected through real brain/source command paths while distractors can be present",
        "retained-standard challenge cases state the remembered standard, expected decision, baseline failure mode, and falsifier before counting as memory advantage evidence",
        "at least one remembered-standard case fails the no-memory plan/brief baseline and passes when KRN memory/source context reaches the rendered Codex brief",
        "retrieval, learning, long_range, and forgetting competencies are covered by named deterministic cases",
        "negative memory/source cases can name their stale or adversarial class and surface explicit excluded ids with reasons",
        "the expected memory/source id is present in selectedKnowledge for hit cases",
        "the expected memory/source id is present in rendered Codex brief context for hit cases",
        "reviewed feedback refs are reported beside the later task query, selected memory/source ids, baseline outcome, KRN outcome, and context-size cost",
        "implementation-decision readback reports decision_before_memory, decision_after_krn, selected evidence refs, selected evidence ids, and a deterministic changed/neutral/rejection class for every case",
        "coding-task cases can derive baseline and KRN implementation decisions mechanically from selected memory/source ids",
        "baseline class and approximate selected-context readback size are reported for each case",
        "the eval fixture can pass declared stale or unsupported memory/source evidence into the case runner, exclude it before KRN selection, and surface the explicit exclusion reason",
        "the eval fixture can derive one contradiction exclusion from runtime memory metadata without using excludedMemoryReadModels or excludedSourceClaims",
        "execution-contract cases can report baseline and KRN contract choices mechanically derived from selected memory/source ids",
        "source contribution readback reruns each case with SourceClaim/SearchDocument inputs disabled and reports required, zero-delta, and source prune candidate classes",
        "broad product claims are blocked when any case is neutral against or loses to the cheaper simple lexical baseline",
        "the memory-advantage fixture output is deterministic enough for regression checks"
      ],
      doesNotProve: [
        "arbitrary task superiority over vanilla Codex",
        "that every positive KRN hit demonstrates advantage over the simple lexical baseline; neutral cases are reported separately",
        "production retrieval/recall quality; this eval uses in-memory lexical token overlap",
        "that simple lexical retrieval is a strong baseline; it is a local foil for governed memory/source packaging",
        "runtime stale-memory or stale-source detection for arbitrary production MemoryRecord or SourceClaim rows",
        "arbitrary contradiction discovery without explicit runtime relation metadata",
        "exact tokenizer cost or model-specific context pricing; selected-context size uses local utf8 bytes divided by four",
        "readModel or source-claim content payload size; selected-context size measures selection identifier overhead only",
        "automatic Memory Core promotion from evidence or feedback",
        "live Postgres runtime behavior",
        "LLM output quality",
        "that Codex would implement the reported coding-task decision without a separate execution-output check",
        "that Codex would implement the reported execution contract without a separate execution-output evidence-shape gate",
        "arbitrary Codex output quality",
        "source truth",
        "broad memory retrieval quality",
        "product readiness"
      ]
    }
  };
};

const main = async (): Promise<MemoryAdvantageEvalResult> => {
  const fixturePath =
    process.argv[2] ?? "tests/fixtures/memory-advantage/remembered-standard-memory-advantage.json";
  return runMemoryAdvantageEval(loadMemoryAdvantageEvalFixture(fixturePath));
};

if (isCliEntrypoint(import.meta.url)) {
  await writeJsonEvalResult(main);
}
