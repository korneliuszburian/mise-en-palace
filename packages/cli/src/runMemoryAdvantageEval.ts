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
  SourceClaim
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
} from "@krn/harness/repositories/internal";
import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./evalMain.js";
import {
  parseBrainSearchPreviewSections,
  parseEvalKnowledgeCards,
  parseEvalSourceClaims,
  isRecord,
  recordArray,
  requiredFiniteNumber,
  requiredString,
  requiredStringArray
} from "./evalFixtureSupport.js";
import type {
  EvalKnowledgeCardFixture,
  EvalSourceClaimFixture
} from "./evalFixtureSupport.js";
import {
  runBrainSearchCommand
} from "./runBrainSearchCommand.js";
import type {
  BrainSearchCommand
} from "./runBrainSearchCommand.js";
import type {
  DatabaseRuntime
} from "./databaseRuntime.js";
import {
  createNoStoreCompilerDependencies
} from "./noStoreRepositories.js";

type MemoryAdvantageCompetency = "retrieval" | "learning" | "long_range" | "forgetting";
type MemoryAdvantageNegativeClass =
  | "stale_memory"
  | "adversarial_unsupported_memory"
  | "adversarial_memory_source_conflict"
  | "temporal_stale_source_claim";
type ExpectedKrnResult = "hit" | "miss";
type MemoryAdvantageBaselineClass = "no_memory_no_source";
type SimpleRetrievalBaselineClass = "simple_lexical_retrieval";
type SimpleRetrievalResult =
  | "top_match_selected"
  | "distractor_selected"
  | "miss";
type MemoryAdvantageCardFixture = EvalKnowledgeCardFixture;
type MemoryAdvantageSourceClaimFixture = EvalSourceClaimFixture;
type MemoryAdvantageCatalogCardFixture =
  MemoryAdvantageCardFixture | MemoryAdvantageExcludedMemoryFixture;

interface MemoryAdvantageCaseFixture {
  readonly id: string;
  readonly competency: MemoryAdvantageCompetency;
  readonly heldOut: boolean;
  readonly query: string;
  readonly distractorClasses: readonly string[];
  readonly baselineFailureRationale: string;
  readonly negativeClass?: MemoryAdvantageNegativeClass;
  readonly codingTask?: MemoryAdvantageCodingTaskFixture;
  readonly priorSession: MemoryAdvantagePriorSessionFixture;
  readonly expectedKrnResult: ExpectedKrnResult;
  readonly expectedSelectedKnowledgeId: string;
}

interface MemoryAdvantageCodingTaskFixture {
  readonly id: string;
  readonly implementationConstraint: string;
  readonly defaultDecisionId: string;
  readonly expectedKrnDecisionId: string;
  readonly decisionOptions: readonly MemoryAdvantageCodingDecisionOptionFixture[];
}

interface MemoryAdvantageCodingDecisionOptionFixture {
  readonly id: string;
  readonly label: string;
  readonly triggerKnowledgeIds: readonly string[];
}

interface MemoryAdvantagePriorSessionFixture {
  readonly id: string;
  readonly task: string;
  readonly evidenceRef: string;
  readonly reviewRef: string;
  readonly feedbackRef: string;
  readonly applicationOutcome: string;
  readonly memoryCards: readonly MemoryAdvantageCardFixture[];
  readonly excludedMemoryCards: readonly MemoryAdvantageExcludedMemoryFixture[];
  readonly distractorMemoryCards: readonly MemoryAdvantageCardFixture[];
  readonly sourceClaims: readonly MemoryAdvantageSourceClaimFixture[];
  readonly excludedSourceClaims: readonly MemoryAdvantageExcludedSourceClaimFixture[];
  readonly distractorSourceClaims: readonly MemoryAdvantageSourceClaimFixture[];
}

interface MemoryAdvantageExcludedMemoryFixture extends MemoryAdvantageCardFixture {
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
  readonly query: string;
  readonly distractorClasses: readonly string[];
  readonly baselineFailureRationale: string;
  readonly negativeClass?: MemoryAdvantageNegativeClass;
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
  readonly "krn_plan_brief": PlanBriefReadback;
  readonly "coding_task_decision"?: CodingTaskDecisionReadback;
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
    readonly distractorClassCount: number;
    readonly totalKrnMemoryContextBytes: number;
    readonly totalKrnPlanBriefContextBytes: number;
    readonly totalRenderedBriefBytes: number;
    readonly codingTaskCaseCount: number;
  };
  readonly cases: readonly MemoryAdvantageCaseReadback[];
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
  "temporal_stale_source_claim"
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

const parseExcludedMemoryCards = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly MemoryAdvantageExcludedMemoryFixture[] => {
  const cards = parseEvalKnowledgeCards(record, key, label);
  const rawCards = recordArray(record, key, label);

  return cards.map((card, index) => {
    const rawCard = rawCards[index];

    if (rawCard === undefined) {
      throw new Error(`${label}.${key}[${index}] must be an object`);
    }

    return {
      ...card,
      exclusionReason: requiredString(rawCard, "exclusionReason", `${label}.${key}[${index}]`)
    };
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

const parseOptionalEvalKnowledgeCards = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly MemoryAdvantageCardFixture[] =>
  record[key] === undefined ? [] : parseEvalKnowledgeCards(record, key, label);

const parseOptionalEvalSourceClaims = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly MemoryAdvantageSourceClaimFixture[] =>
  record[key] === undefined ? [] : parseEvalSourceClaims(record, key, label);

const parseOptionalExcludedSourceClaims = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly MemoryAdvantageExcludedSourceClaimFixture[] =>
  record[key] === undefined ? [] : parseExcludedSourceClaims(record, key, label);

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

  const decisionOptions = recordArray(value, "decisionOptions", `${label}.codingTask`).map((option, index) => ({
    id: requiredString(option, "id", `${label}.codingTask.decisionOptions[${index}]`),
    label: requiredString(option, "label", `${label}.codingTask.decisionOptions[${index}]`),
    triggerKnowledgeIds: requiredStringArray(option, "triggerKnowledgeIds", `${label}.codingTask.decisionOptions[${index}]`)
  }));

  if (decisionOptions.length === 0) {
    throw new Error(`${label}.codingTask.decisionOptions must not be empty`);
  }

  return {
    id: requiredString(value, "id", `${label}.codingTask`),
    implementationConstraint: requiredString(value, "implementationConstraint", `${label}.codingTask`),
    defaultDecisionId: requiredString(value, "defaultDecisionId", `${label}.codingTask`),
    expectedKrnDecisionId: requiredString(value, "expectedKrnDecisionId", `${label}.codingTask`),
    decisionOptions
  };
};

const assertNoMemoryCardLifecycleConflict = (
  priorSession: MemoryAdvantagePriorSessionFixture,
  label: string
): void => {
  const activeIds = new Set(priorSession.memoryCards.map((card) => card.id));
  const conflictingCard = priorSession.excludedMemoryCards.find((card) => activeIds.has(card.id));

  if (conflictingCard !== undefined) {
    throw new Error(`${label}.priorSession cannot mark ${conflictingCard.id} as both active and excluded`);
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

  const memoryCards = parseEvalKnowledgeCards(priorSession, "memoryCards", `${label}.priorSession`);
  const sourceClaims = parseEvalSourceClaims(priorSession, "sourceClaims", `${label}.priorSession`);

  const negativeClass = value["negativeClass"] === undefined
    ? undefined
    : requiredEnum(value, "negativeClass", label, memoryNegativeClasses);
  const codingTask = parseCodingTask(value["codingTask"], label);
  const parsedCase: MemoryAdvantageCaseFixture = {
    id: requiredString(value, "id", label),
    competency: requiredEnum(value, "competency", label, memoryCompetencies),
    heldOut: value["heldOut"] === true,
    query: requiredString(value, "query", label),
    distractorClasses: requiredStringArray(value, "distractorClasses", label),
    baselineFailureRationale: requiredString(value, "baselineFailureRationale", label),
    ...(negativeClass === undefined ? {} : { negativeClass }),
    ...(codingTask === undefined ? {} : { codingTask }),
    priorSession: {
      id: requiredString(priorSession, "id", `${label}.priorSession`),
      task: requiredString(priorSession, "task", `${label}.priorSession`),
      evidenceRef: requiredString(priorSession, "evidenceRef", `${label}.priorSession`),
      reviewRef: requiredString(priorSession, "reviewRef", `${label}.priorSession`),
      feedbackRef: requiredString(priorSession, "feedbackRef", `${label}.priorSession`),
      applicationOutcome: requiredString(priorSession, "applicationOutcome", `${label}.priorSession`),
      memoryCards,
      excludedMemoryCards: parseExcludedMemoryCards(priorSession, "excludedMemoryCards", `${label}.priorSession`),
      distractorMemoryCards: parseOptionalEvalKnowledgeCards(
        priorSession,
        "distractorMemoryCards",
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

  assertNoMemoryCardLifecycleConflict(parsedCase.priorSession, label);
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
  // Brain-search emits source-search packets with source-prefixed ids; catalog memory cards keep their fixture ids.
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
  const hasCardOverlap = testCase.priorSession.memoryCards.some((card) =>
    tokenScore(query, [card.title, card.summary, card.nextAction].join(" ")) > 0
  );
  const hasExcludedCardOverlap = testCase.priorSession.excludedMemoryCards.some((card) =>
    tokenScore(query, [card.title, card.summary, card.nextAction].join(" ")) > 0
  );
  const hasClaimOverlap = testCase.priorSession.sourceClaims.some((claim) =>
    tokenScore(query, [claim.claim, claim.mechanism, claim.krnImplication].join(" ")) > 0
  );
  const hasExcludedClaimOverlap = testCase.priorSession.excludedSourceClaims.some((claim) =>
    tokenScore(query, [claim.claim, claim.mechanism, claim.krnImplication].join(" ")) > 0
  );

  if (testCase.expectedKrnResult === "hit" && (!(hasCardOverlap || hasExcludedCardOverlap) || !hasClaimOverlap)) {
    throw new Error(
      `${testCase.id} must have lexical overlap with a retained or excluded memory card and source claim text`
    );
  }

  if (testCase.expectedKrnResult === "miss" && !(hasExcludedCardOverlap || hasExcludedClaimOverlap)) {
    throw new Error(`${testCase.id} must have lexical overlap with an excluded memory card or source claim`);
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
  trustTier: "project-decision",
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
  trustTier: claim.trustTier,
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

const memoryRecordFromCard = (
  card: MemoryAdvantageCardFixture
): MemoryRecord => ({
  id: `memory:${card.id}`,
  projectId,
  key: card.id,
  kind: "pattern",
  status: "active",
  summary: card.title,
  body: card.summary,
  owner: "memory-advantage-eval",
  confidence: 95,
  applicationGuidance: card.nextAction,
  sourceLineage: card.consumers.map((consumer) => ({
    sourceId: consumer,
    note: "memory advantage eval fixture"
  })),
  isUserPreference: false,
  validFrom: now,
  positiveFeedbackCount: 0,
  negativeFeedbackCount: 0,
  metadata: {
    eval: "memory-advantage",
    doesNotProve: card.doesNotProve,
    falsifier: card.falsifier
  },
  createdAt: now,
  updatedAt: now
});

const isExcludedMemoryCard = (
  card: MemoryAdvantageCatalogCardFixture
): card is MemoryAdvantageExcludedMemoryFixture =>
  "exclusionReason" in card;

const selectableMemoryCards = (
  cards: readonly MemoryAdvantageCatalogCardFixture[]
): readonly MemoryAdvantageCardFixture[] =>
  cards.filter((card): card is MemoryAdvantageCardFixture => !isExcludedMemoryCard(card));

const throwingRepositoryMethod = (method: string): never => {
  throw new Error(`${method} should not be called by memory advantage eval`);
};

const createMemoryAdvantageRuntime = (
  cards: readonly MemoryAdvantageCatalogCardFixture[],
  sourceClaims: readonly MemoryAdvantageSourceClaimFixture[]
): DatabaseRuntime => {
  const claims = sourceClaims.map(sourceClaimFromFixture);
  const documents = claims.map(searchDocumentFromClaim);
  const memories = selectableMemoryCards(cards).map(memoryRecordFromCard);
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
        listSourceClaimEdgesForClaim: async () => []
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
      createFeedbackDelta: async () => throwingRepositoryMethod("createFeedbackDelta")
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
        claims.some((claim) => claim.id === sourceClaimId)
          ? [{
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
              createdAt: now,
              updatedAt: now
            }]
          : []
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
  cards: readonly MemoryAdvantageCatalogCardFixture[]
): Promise<{
  readonly root: string;
  readonly catalogFile: string;
  readonly writtenCardIds: readonly string[];
}> => {
  const root = await mkdtemp(join(tmpdir(), "krn-memory-advantage-"));
  const catalogFile = join(root, "catalog.json");
  const readModelCards = selectableMemoryCards(cards).map((card) => ({
    id: card.id,
    kind: "pattern",
    status: "active",
    title: card.title,
    summary: card.summary,
    confidence: "high",
    reviewability: "ready",
    sourceRefs: card.consumers,
    evidenceRefs: [`fixture:${card.id}`],
    consumers: card.consumers,
    falsifier: card.falsifier,
    doesNotProve: card.doesNotProve,
    temporal: {
      kind: "current",
      observedAt: "2026-07-04"
    },
    dissent: {
      kind: "none"
    },
    nextAction: card.nextAction
  }));
  const cardFiles = await Promise.all(readModelCards.map(async (card, index) => {
    const cardFile = `card-${index + 1}.json`;

    await writeFile(join(root, cardFile), JSON.stringify(card, null, 2), "utf8");
    return cardFile;
  }));

  await writeFile(catalogFile, JSON.stringify({
    cardFiles,
    patternFiles: [],
    usefulnessFeedbackFiles: []
  }, null, 2), "utf8");

  return {
    root,
    catalogFile,
    writtenCardIds: readModelCards.map((card) => card.id)
  };
};

const runCaseVariant = async (
  testCase: MemoryAdvantageCaseFixture,
  cards: readonly MemoryAdvantageCatalogCardFixture[],
  sourceClaims: readonly MemoryAdvantageSourceClaimFixture[],
  idSuffix: string,
  storeOnly: boolean
): Promise<BrainSearchPreviewReadback> => {
  const knowledgeStore =
    storeOnly || selectableMemoryCards(cards).length === 0
      ? undefined
      : await writeKnowledgeCatalog(cards);
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
      createDatabaseRuntime: async () => createMemoryAdvantageRuntime(cards, sourceClaims)
    });

    return parseBrainSearchPreview(
      result.stdout,
      `${testCase.id}.${idSuffix}`,
      knowledgeStore?.writtenCardIds ?? []
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
): readonly MemoryAdvantageMemoryExclusionReadback[] =>
  testCase.priorSession.excludedMemoryCards.map((card) => ({
    memoryId: `memory:${card.id}`,
    reason: card.exclusionReason
  }));

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
    ...testCase.priorSession.memoryCards,
    ...testCase.priorSession.excludedMemoryCards,
    ...testCase.priorSession.distractorMemoryCards
  ].map((card): SimpleRetrievalCandidate => ({
    id: card.id,
    kind: "memory",
    score: tokenScore(testCase.query, [card.title, card.summary, card.nextAction].join(" "))
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

const deriveCodingDecisionId = (
  codingTask: MemoryAdvantageCodingTaskFixture,
  selectedKnowledgeIds: readonly string[]
): string => {
  for (const selectedKnowledgeId of selectedKnowledgeIds) {
    const option = codingTask.decisionOptions.find((decisionOption) =>
      decisionOption.triggerKnowledgeIds.includes(selectedKnowledgeId)
    );

    if (option !== undefined) {
      return option.id;
    }
  }

  return codingTask.defaultDecisionId;
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

  // Source claims are decision-grade evidence in this proxy; they must be evaluated before memory patterns.
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
  cards: readonly MemoryAdvantageCatalogCardFixture[],
  sourceClaims: readonly MemoryAdvantageSourceClaimFixture[],
  memoryRecordIds: readonly string[],
  sourceClaimIds: readonly string[]
): readonly string[] => {
  const memoryById = new Map(
    selectableMemoryCards(cards).map((card) => [
      `memory:${card.id}`,
      [card.title, card.summary, card.nextAction].join("\n")
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
  cards: readonly MemoryAdvantageCatalogCardFixture[],
  sourceClaims: readonly MemoryAdvantageSourceClaimFixture[],
  baseline: boolean
): Promise<PlanBriefReadback> => {
  const runtime = createMemoryAdvantageRuntime(cards, sourceClaims);
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
    harnessPlan: compiled.harnessPlan,
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
    renderedMemoryRecordIds: brief.memoryRecordsUsed,
    renderedSourceClaimIds: brief.sourceClaimsUsed,
    renderedBrief
  });

  return {
    baselineClass,
    result: planBriefResult(baseline, hit),
    requiredKnowledgeId: testCase.expectedSelectedKnowledgeId,
    selectedMemoryRecordIds: memoryRecordIds,
    selectedSourceClaimIds: sourceClaimIds,
    renderedMemoryRecordIds: brief.memoryRecordsUsed,
    renderedSourceClaimIds: brief.sourceClaimsUsed,
    contextInclusionCount: compiled.contextAssembly.inclusions.length,
    contextSize: approximateSelectedContextSizeFromParts(planBriefContextPayloadParts(
      cards,
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
  codingTaskDecision: CodingTaskDecisionReadback | undefined
): "pass" | "fail" => {
  const canProveExpectedMiss = testCase.expectedKrnResult === "hit" || hasExplicitExclusion;
  const planBriefSatisfied = testCase.expectedKrnResult === "hit"
    ? baselinePlanBrief.result === "miss" && krnPlanBrief.result === "hit"
    : baselinePlanBrief.result === "miss" && krnPlanBrief.result === "miss";
  const codingTaskSatisfied = codingTaskDecision === undefined || codingTaskDecision.status === "pass";
  const checks = [
    isBaselineMiss(baseline),
    isExpectedKrnResultSatisfied(testCase, krnMemory),
    planBriefSatisfied,
    canProveExpectedMiss,
    codingTaskSatisfied
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
      ...testCase.priorSession.memoryCards,
      ...testCase.priorSession.distractorMemoryCards,
      ...testCase.priorSession.excludedMemoryCards
    ],
    [
      ...testCase.priorSession.sourceClaims,
      ...testCase.priorSession.distractorSourceClaims
    ],
    "krn",
    false
  );
  const krnPlanBrief = await compilePlanBriefReadback(
    testCase,
    [
      ...testCase.priorSession.memoryCards,
      ...testCase.priorSession.distractorMemoryCards,
      ...testCase.priorSession.excludedMemoryCards
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
  const status = caseStatus(
    testCase,
    baseline,
    krnMemory,
    baselinePlanBrief,
    krnPlanBrief,
    exclusions.length > 0 || sourceExclusions.length > 0,
    codingTaskDecision
  );

  return {
    caseId: testCase.id,
    competency: testCase.competency,
    heldOut: testCase.heldOut,
    query: testCase.query,
    distractorClasses: testCase.distractorClasses,
    baselineFailureRationale: testCase.baselineFailureRationale,
    ...(testCase.negativeClass === undefined ? {} : { negativeClass: testCase.negativeClass }),
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
      createdMemoryIds: testCase.priorSession.memoryCards.map((card) => `memory:${card.id}`),
      excludedMemoryIds: exclusions.map((exclusion) => exclusion.memoryId),
      distractorMemoryIds: testCase.priorSession.distractorMemoryCards.map((card) => `memory:${card.id}`),
      createdSourceClaimIds: testCase.priorSession.sourceClaims.map((claim) => claim.sourceClaimId),
      excludedSourceClaimIds: sourceExclusions.map((exclusion) => exclusion.sourceClaimId),
      distractorSourceClaimIds: testCase.priorSession.distractorSourceClaims.map((claim) => claim.sourceClaimId)
    },
    "baseline_no_memory": baselineNoMemory,
    "baseline_simple_retrieval": simpleRetrieval,
    "baseline_plan_brief": baselinePlanBrief,
    "krn_memory": krnMemoryReadback,
    "krn_plan_brief": krnPlanBrief,
    ...(codingTaskDecision === undefined ? {} : { "coding_task_decision": codingTaskDecision }),
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
      distractorClassCount: fixture.distractorClasses.length,
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
      codingTaskCaseCount: cases.filter((testCase) => testCase["coding_task_decision"] !== undefined).length
    },
    cases,
    proof: {
      proves: [
        "the fixture query is unsupported when no KRN memory or source evidence is available",
        "the memory advantage output reports corpus metadata, per-case baseline failure rationale, and aggregate context-size cost proxies",
        "a simple lexical retrieval baseline is reported so no-memory misses are not the only comparator",
        "a priorSession fixture supplies evidence, review, feedback refs, and nested learned memory/source inputs before the later task can hit",
        "company-pattern memory/source inputs from the in-memory eval store are selected through real brain/source command paths while distractors can be present",
        "at least one company-pattern case fails the no-memory plan/brief baseline and passes when KRN memory/source context reaches the rendered Codex brief",
        "retrieval, learning, long_range, and forgetting competencies are covered by named deterministic cases",
        "negative memory/source cases can name their stale or adversarial class and surface explicit excluded ids with reasons",
        "the expected memory/source id is present in selectedKnowledge for hit cases",
        "the expected memory/source id is present in rendered Codex brief context for hit cases",
        "reviewed feedback refs are reported beside the later task query, selected memory/source ids, baseline outcome, KRN outcome, and context-size cost",
        "coding-task cases can derive baseline and KRN implementation decisions mechanically from selected memory/source ids",
        "baseline class and approximate selected-context readback size are reported for each case",
        "the eval fixture can pass declared stale or unsupported memory/source evidence into the case runner, exclude it before KRN selection, and surface the explicit exclusion reason",
        "the memory-advantage fixture output is deterministic enough for regression checks"
      ],
      doesNotProve: [
        "arbitrary task superiority over vanilla Codex",
        "production retrieval/recall quality; this eval uses in-memory lexical token overlap",
        "that simple lexical retrieval is a strong baseline; it is a local foil for governed memory/source packaging",
        "runtime stale-memory or stale-source detection for arbitrary production MemoryRecord or SourceClaim rows",
        "exact tokenizer cost or model-specific context pricing; selected-context size uses local utf8 bytes divided by four",
        "card or source-claim content payload size; selected-context size measures selection identifier overhead only",
        "automatic Memory Core promotion from evidence or feedback",
        "live Postgres runtime behavior",
        "LLM output quality",
        "that Codex would implement the reported coding-task decision without a separate execution-output check",
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
    process.argv[2] ?? "tests/fixtures/memory-advantage/company-pattern-memory-advantage.json";
  return runMemoryAdvantageEval(loadMemoryAdvantageEvalFixture(fixturePath));
};

if (isCliEntrypoint(import.meta.url)) {
  await writeJsonEvalResult(main);
}
