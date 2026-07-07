import { readFileSync } from "node:fs";

import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./eval-main.js";
import {
  parseBrainSearchPreviewSections,
  parseEvalKnowledgeCards,
  parseEvalSourceClaims,
  isRecord,
  recordArray,
  requiredFiniteNumber,
  requiredNonEmptyStringArray,
  requiredString
} from "./eval-fixture-support.js";
import type {
  EvalKnowledgeCardFixture,
  EvalSourceClaimFixture
} from "./eval-fixture-support.js";
import {
  runBrainSearchCommand
} from "./run-brain-search-command.js";
import type {
  BrainSearchCommand
} from "./run-brain-search-command.js";
import {
  ndcgAtK,
  roundRankingMetric
} from "./ranking-eval-metrics.js";

type BrainRankingCardFixture = EvalKnowledgeCardFixture;
type BrainRankingSourceClaimFixture = EvalSourceClaimFixture;

interface BrainRankingCaseFixture {
  readonly id: string;
  readonly query: string;
  readonly storeOnly: boolean;
  readonly distractorClasses: readonly string[];
  readonly baselineFailureRationale: string;
  readonly expectedSelectedKnowledgeIds: readonly string[];
  readonly knowledgeCards: readonly BrainRankingCardFixture[];
  readonly sourceClaims: readonly BrainRankingSourceClaimFixture[];
}

export interface BrainRankingEvalFixture {
  readonly version: "1";
  readonly corpusName: string;
  readonly distractorClasses: readonly string[];
  readonly topK: number;
  readonly minimumHitRateAtK: number;
  readonly minimumRecallAtK: number;
  readonly minimumNdcgAtK: number;
  readonly cases: readonly BrainRankingCaseFixture[];
}

export interface BrainRankingEvalCaseResult {
  readonly id: string;
  readonly query: string;
  readonly expectedSelectedKnowledgeIds: readonly string[];
  readonly distractorClasses: readonly string[];
  readonly baselineFailureRationale: string;
  readonly selectedKnowledgeIds: readonly string[];
  readonly selectedSources: readonly string[];
  readonly targetFits: readonly string[];
  readonly answerUsefulness: string;
  readonly supportingClaims: number;
  readonly supportingDocuments: number;
  readonly hitAtK: boolean;
  readonly recallAtK: number;
  readonly ndcgAtK: number;
}

export interface BrainRankingEvalResult {
  readonly kind: "krn.brainRanking.eval.v1";
  readonly fixtureVersion: "1";
  readonly status: "pass" | "fail";
  readonly topK: number;
  readonly corpus: {
    readonly name: string;
    readonly caseCount: number;
    readonly distractorClasses: readonly string[];
  };
  readonly thresholds: {
    readonly minimumHitRateAtK: number;
    readonly minimumRecallAtK: number;
    readonly minimumNdcgAtK: number;
  };
  readonly metrics: {
    readonly caseCount: number;
    readonly hitRateAtK: number;
    readonly recallAtK: number;
    readonly ndcgAtK: number;
    readonly catalogBackedCases: number;
    readonly sourceBackedCases: number;
    readonly targetSpecificSelections: number;
    readonly expectedIdCount: number;
    readonly distractorClassCount: number;
  };
  readonly cases: readonly BrainRankingEvalCaseResult[];
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

interface BrainRankingSelectedKnowledgeReadback {
  readonly id: string;
  readonly source: string;
  readonly targetFit: string;
}

interface BrainRankingSourceSearchReadback {
  readonly answerUsefulness: string;
  readonly supportingClaims: number;
  readonly supportingDocuments: number;
}

interface BrainRankingPreviewReadback {
  readonly selectedKnowledge: readonly BrainRankingSelectedKnowledgeReadback[];
  readonly sourceSearch: BrainRankingSourceSearchReadback;
}

const optionalBoolean = (
  record: Record<string, unknown>,
  key: string
): boolean => {
  const value = record[key];

  if (value === undefined) {
    return false;
  }

  if (typeof value !== "boolean") {
    throw new Error(`${key} must be a boolean when present`);
  }

  return value;
};

const parseCase = (
  value: Record<string, unknown>,
  index: number
): BrainRankingCaseFixture => {
  const label = `cases[${index}]`;

  return {
    id: requiredString(value, "id", label),
    query: requiredString(value, "query", label),
    storeOnly: optionalBoolean(value, "storeOnly"),
    distractorClasses: requiredNonEmptyStringArray(value, "distractorClasses", label),
    baselineFailureRationale: requiredString(value, "baselineFailureRationale", label),
    expectedSelectedKnowledgeIds: requiredNonEmptyStringArray(
      value,
      "expectedSelectedKnowledgeIds",
      label
    ),
    knowledgeCards: parseEvalKnowledgeCards(value, "knowledgeCards", label),
    sourceClaims: parseEvalSourceClaims(value, "sourceClaims", label)
  };
};

export const parseBrainRankingEvalFixture = (
  value: unknown
): BrainRankingEvalFixture => {
  if (!isRecord(value)) {
    throw new Error("brain ranking eval fixture must be an object");
  }

  const version = value["version"];

  if (version !== "1") {
    throw new Error("brain ranking eval fixture version must be 1");
  }

  const cases = recordArray(value, "cases", "fixture").map(parseCase);

  if (cases.length < 10) {
    throw new Error("brain ranking eval fixture must contain at least 10 cases");
  }

  return {
    version,
    corpusName: requiredString(value, "corpusName", "fixture"),
    distractorClasses: requiredNonEmptyStringArray(value, "distractorClasses", "fixture"),
    topK: requiredFiniteNumber(value, "topK", "fixture"),
    minimumHitRateAtK: requiredFiniteNumber(value, "minimumHitRateAtK", "fixture"),
    minimumRecallAtK: requiredFiniteNumber(value, "minimumRecallAtK", "fixture"),
    minimumNdcgAtK: requiredFiniteNumber(value, "minimumNdcgAtK", "fixture"),
    cases
  };
};

export const loadBrainRankingEvalFixture = (
  path: string
): BrainRankingEvalFixture => {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));

  return parseBrainRankingEvalFixture(parsed);
};

const sourceSearchPayload = (
  sourceClaims: readonly BrainRankingSourceClaimFixture[]
): string =>
  JSON.stringify({
    kind: "source_search_answer_package",
    answerPackage: {
      answerUsefulness: sourceClaims.length > 0 ? "useful" : "not_useful",
      supportingClaims: sourceClaims,
      supportingDocuments: sourceClaims.length > 0 ? [{ label: "fixture-source-document" }] : [],
      sourceClaimDocumentLinks: [],
      relationSupport: [],
      sourceDecisionSupport: [],
      graphReadback: {
        claimNodes: sourceClaims.length,
        relationEdges: 0,
        temporalEdges: 0,
        contradictionEdges: 0,
        duplicateEdges: 0,
        invalidationEdges: 0,
        graphAware: sourceClaims.length > 0,
        caveats: [
          "brain-ranking eval fixture uses proxy labels, not source truth"
        ]
      },
      missingEvidence: sourceClaims.length > 0 ? [] : ["governed SourceClaim evidence"]
    },
    includedCandidates: sourceClaims.map((claim) => ({
      subjectId: claim.sourceClaimId
    })),
    proof: {
      doesNotProve: ["source truth", "semantic retrieval quality"]
    }
  });

const knowledgePayload = (
  cards: readonly BrainRankingCardFixture[]
): string =>
  JSON.stringify({
    kind: "krn.brainKnowledge.cards.preview.v1",
    returnedCards: cards.length,
    totalCards: cards.length,
    cards,
    proof: {
      doesNotProve: ["brain-knowledge catalog completeness", "semantic ranking quality"]
    }
  });

const parseBrainSearchResult = (
  value: string,
  label: string
): BrainRankingPreviewReadback => {
  const preview = parseBrainSearchPreviewSections(value, label);
  const selectedKnowledge = preview.selectedKnowledge.map((packet, index) => ({
    id: requiredString(packet, "id", `${label}.selectedKnowledge[${index}]`),
    source: requiredString(packet, "source", `${label}.selectedKnowledge[${index}]`),
    targetFit: requiredString(packet, "targetFit", `${label}.selectedKnowledge[${index}]`)
  }));

  return {
    selectedKnowledge,
    sourceSearch: {
      answerUsefulness: requiredString(preview.sourceSearch, "answerUsefulness", `${label}.sourceSearch`),
      supportingClaims: requiredFiniteNumber(preview.sourceSearch, "supportingClaims", `${label}.sourceSearch`),
      supportingDocuments: requiredFiniteNumber(
        preview.sourceSearch,
        "supportingDocuments",
        `${label}.sourceSearch`
      )
    }
  };
};

const evaluateCase = async (
  testCase: BrainRankingCaseFixture,
  topK: number
): Promise<BrainRankingEvalCaseResult> => {
  const command: BrainSearchCommand = {
    kind: "brainSearch",
    query: testCase.query,
    catalogFiles: ["tests/fixtures/brain-ranking/brain-ranking-eval.json#knowledge-cards"],
    storeOnly: testCase.storeOnly,
    limit: 10,
    maxInclusions: 10,
    format: "json"
  };
  const result = await runBrainSearchCommand({
    cwd: process.cwd(),
    env: {},
    now: () => "2026-07-04T00:00:00.000Z",
    createId: (prefix) => `${prefix}-brain-ranking-eval`,
    command,
    async runBrainKnowledge() {
      return {
        stdout: knowledgePayload(testCase.knowledgeCards)
      };
    },
    async runSourceSearch() {
      return {
        stdout: sourceSearchPayload(testCase.sourceClaims)
      };
    }
  });
  const preview = parseBrainSearchResult(result.stdout, testCase.id);
  const selectedKnowledge = preview.selectedKnowledge;
  const selectedIds = selectedKnowledge.map((packet) => packet.id);
  const expectedIds = new Set(testCase.expectedSelectedKnowledgeIds);
  const selectedTopK = selectedIds.slice(0, topK);
  const matchedExpectedIds = new Set(selectedTopK.filter((id) => expectedIds.has(id)));
  const recallAtK =
    expectedIds.size === 0
      ? 0
      : matchedExpectedIds.size / expectedIds.size;

  return {
    id: testCase.id,
    query: testCase.query,
    expectedSelectedKnowledgeIds: testCase.expectedSelectedKnowledgeIds,
    distractorClasses: testCase.distractorClasses,
    baselineFailureRationale: testCase.baselineFailureRationale,
    selectedKnowledgeIds: selectedIds,
    selectedSources: selectedKnowledge.map((packet) => packet.source),
    targetFits: selectedKnowledge.map((packet) => packet.targetFit),
    answerUsefulness: preview.sourceSearch.answerUsefulness,
    supportingClaims: preview.sourceSearch.supportingClaims,
    supportingDocuments: preview.sourceSearch.supportingDocuments,
    hitAtK: selectedTopK.some((id) => expectedIds.has(id)),
    recallAtK: roundRankingMetric(recallAtK),
    ndcgAtK: roundRankingMetric(ndcgAtK(selectedIds, expectedIds, topK))
  };
};

export const runBrainRankingEval = async (
  fixture: BrainRankingEvalFixture
): Promise<BrainRankingEvalResult> => {
  const cases = await Promise.all(
    fixture.cases.map((testCase) => evaluateCase(testCase, fixture.topK))
  );
  const hitRateAtK = cases.filter((testCase) => testCase.hitAtK).length / cases.length;
  const recallAtK = cases.reduce((sum, testCase) => sum + testCase.recallAtK, 0) / cases.length;
  const ndcgAtK = cases.reduce((sum, testCase) => sum + testCase.ndcgAtK, 0) / cases.length;
  const status =
    hitRateAtK >= fixture.minimumHitRateAtK &&
    recallAtK >= fixture.minimumRecallAtK &&
    ndcgAtK >= fixture.minimumNdcgAtK
      ? "pass"
      : "fail";

  return {
    kind: "krn.brainRanking.eval.v1",
    fixtureVersion: fixture.version,
    status,
    topK: fixture.topK,
    corpus: {
      name: fixture.corpusName,
      caseCount: fixture.cases.length,
      distractorClasses: fixture.distractorClasses
    },
    thresholds: {
      minimumHitRateAtK: fixture.minimumHitRateAtK,
      minimumRecallAtK: fixture.minimumRecallAtK,
      minimumNdcgAtK: fixture.minimumNdcgAtK
    },
    metrics: {
      caseCount: cases.length,
      hitRateAtK: roundRankingMetric(hitRateAtK),
      recallAtK: roundRankingMetric(recallAtK),
      ndcgAtK: roundRankingMetric(ndcgAtK),
      catalogBackedCases: cases.filter((testCase) =>
        testCase.selectedSources.includes("catalog_file")
      ).length,
      sourceBackedCases: cases.filter((testCase) =>
        testCase.selectedSources.includes("source_search")
      ).length,
      targetSpecificSelections: cases.reduce(
        (sum, testCase) =>
          sum + testCase.targetFits.filter((targetFit) =>
            targetFit === "target_specific"
          ).length,
        0
      ),
      expectedIdCount: cases.reduce(
        (sum, testCase) => sum + testCase.expectedSelectedKnowledgeIds.length,
        0
      ),
      distractorClassCount: new Set(cases.flatMap((testCase) =>
        testCase.distractorClasses
      )).size
    },
    cases,
    proof: {
      proves: [
        "brain search selected expected proxy-labeled knowledge packets for the fixture query set",
        "brain ranking fixture reports corpus name, corpus size, distractor classes, and per-case baseline failure rationale",
        "brain search reports recall@k over expected proxy-labeled selectedKnowledge ids",
        "catalog-backed and source-backed brain-search readbacks were exercised without DB mutation",
        "future changes that drop expected selectedKnowledge from top-k will fail this eval"
      ],
      doesNotProve: [
        "proxy labels are not broad ranking truth",
        "source truth",
        "broad semantic ranking quality",
        "LLM output quality",
        "external target repository usefulness",
        "product readiness"
      ]
    }
  };
};

const main = async (): Promise<BrainRankingEvalResult> => {
  const fixturePath = process.argv[2] ?? "tests/fixtures/brain-ranking/brain-ranking-eval.json";
  return runBrainRankingEval(loadBrainRankingEvalFixture(fixturePath));
};

if (isCliEntrypoint(import.meta.url)) {
  await writeJsonEvalResult(main);
}
