import { readFileSync } from "node:fs";

import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./evalMain.js";
import {
  runBrainSearchCommand
} from "./runBrainSearchCommand.js";
import type {
  BrainSearchCommand
} from "./runBrainSearchCommand.js";

interface BrainRankingCardFixture {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly consumers: readonly string[];
  readonly falsifier: string;
  readonly doesNotProve: string;
  readonly nextAction: string;
}

interface BrainRankingSourceClaimFixture {
  readonly sourceClaimId: string;
  readonly claim: string;
  readonly mechanism: string;
  readonly krnImplication: string;
  readonly consumer: string;
  readonly falsifier: string;
  readonly doesNotProve: string;
}

interface BrainRankingCaseFixture {
  readonly id: string;
  readonly query: string;
  readonly storeOnly: boolean;
  readonly expectedSelectedKnowledgeIds: readonly string[];
  readonly knowledgeCards: readonly BrainRankingCardFixture[];
  readonly sourceClaims: readonly BrainRankingSourceClaimFixture[];
}

export interface BrainRankingEvalFixture {
  readonly version: "1";
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requiredString = (record: Record<string, unknown>, key: string, label: string): string => {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label}.${key} must be a non-empty string`);
  }

  return value;
};

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

const requiredFiniteNumber = (
  record: Record<string, unknown>,
  key: string,
  label: string
): number => {
  const value = record[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label}.${key} must be a finite number`);
  }

  return value;
};

const requiredStringArray = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly string[] => {
  const value = record[key];

  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label}.${key} must be a non-empty string array`);
  }

  return value.map((item, index) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new Error(`${label}.${key}[${index}] must be a non-empty string`);
    }

    return item;
  });
};

const recordArray = (
  record: Record<string, unknown>,
  key: string,
  label: string
): readonly Record<string, unknown>[] => {
  const value = record[key];

  if (!Array.isArray(value)) {
    throw new Error(`${label}.${key} must be an array`);
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`${label}.${key}[${index}] must be an object`);
    }

    return item;
  });
};

const parseCard = (
  value: Record<string, unknown>,
  label: string
): BrainRankingCardFixture => ({
  id: requiredString(value, "id", label),
  title: requiredString(value, "title", label),
  summary: requiredString(value, "summary", label),
  consumers: requiredStringArray(value, "consumers", label),
  falsifier: requiredString(value, "falsifier", label),
  doesNotProve: requiredString(value, "doesNotProve", label),
  nextAction: requiredString(value, "nextAction", label)
});

const parseSourceClaim = (
  value: Record<string, unknown>,
  label: string
): BrainRankingSourceClaimFixture => ({
  sourceClaimId: requiredString(value, "sourceClaimId", label),
  claim: requiredString(value, "claim", label),
  mechanism: requiredString(value, "mechanism", label),
  krnImplication: requiredString(value, "krnImplication", label),
  consumer: requiredString(value, "consumer", label),
  falsifier: requiredString(value, "falsifier", label),
  doesNotProve: requiredString(value, "doesNotProve", label)
});

const parseCase = (
  value: Record<string, unknown>,
  index: number
): BrainRankingCaseFixture => {
  const label = `cases[${index}]`;

  return {
    id: requiredString(value, "id", label),
    query: requiredString(value, "query", label),
    storeOnly: optionalBoolean(value, "storeOnly"),
    expectedSelectedKnowledgeIds: requiredStringArray(
      value,
      "expectedSelectedKnowledgeIds",
      label
    ),
    knowledgeCards: recordArray(value, "knowledgeCards", label).map((card, cardIndex) =>
      parseCard(card, `${label}.knowledgeCards[${cardIndex}]`)
    ),
    sourceClaims: recordArray(value, "sourceClaims", label).map((claim, claimIndex) =>
      parseSourceClaim(claim, `${label}.sourceClaims[${claimIndex}]`)
    )
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
  const parsed: unknown = JSON.parse(value);

  if (!isRecord(parsed) || parsed["kind"] !== "krn.brainSearch.preview.v1") {
    throw new Error(`${label} did not return a brain search preview`);
  }

  const knowledgeCards = parsed["knowledgeCards"];
  const sourceSearch = parsed["sourceSearch"];

  if (!isRecord(knowledgeCards) || !isRecord(sourceSearch)) {
    throw new Error(`${label} brain search preview is missing readback sections`);
  }

  const selectedKnowledge = recordArray(
    knowledgeCards,
    "selectedKnowledge",
    `${label}.knowledgeCards`
  ).map((packet, index) => ({
    id: requiredString(packet, "id", `${label}.selectedKnowledge[${index}]`),
    source: requiredString(packet, "source", `${label}.selectedKnowledge[${index}]`),
    targetFit: requiredString(packet, "targetFit", `${label}.selectedKnowledge[${index}]`)
  }));

  return {
    selectedKnowledge,
    sourceSearch: {
      answerUsefulness: requiredString(sourceSearch, "answerUsefulness", `${label}.sourceSearch`),
      supportingClaims: requiredFiniteNumber(sourceSearch, "supportingClaims", `${label}.sourceSearch`),
      supportingDocuments: requiredFiniteNumber(
        sourceSearch,
        "supportingDocuments",
        `${label}.sourceSearch`
      )
    }
  };
};

const dcg = (
  selectedIds: readonly string[],
  expectedIds: ReadonlySet<string>,
  topK: number
): number =>
  selectedIds.slice(0, topK).reduce((score, id, index) =>
    score + (expectedIds.has(id) ? 1 / Math.log2(index + 2) : 0), 0);

const idealDcg = (
  expectedCount: number,
  topK: number
): number => {
  let score = 0;

  for (let index = 0; index < Math.min(expectedCount, topK); index += 1) {
    score += 1 / Math.log2(index + 2);
  }

  return score;
};

const roundMetric = (value: number): number =>
  Math.round(value * 10000) / 10000;

const evaluateCase = async (
  testCase: BrainRankingCaseFixture,
  topK: number
): Promise<BrainRankingEvalCaseResult> => {
  const command: BrainSearchCommand = {
    kind: "brainSearch",
    query: testCase.query,
    catalogFiles: ["docs/brain-knowledge/catalog.json"],
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
    async runKnowledgeCards() {
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
  const ideal = idealDcg(expectedIds.size, topK);
  const ndcgAtK = ideal === 0 ? 0 : dcg(selectedIds, expectedIds, topK) / ideal;
  const recallAtK =
    expectedIds.size === 0
      ? 0
      : matchedExpectedIds.size / expectedIds.size;

  return {
    id: testCase.id,
    query: testCase.query,
    expectedSelectedKnowledgeIds: testCase.expectedSelectedKnowledgeIds,
    selectedKnowledgeIds: selectedIds,
    selectedSources: selectedKnowledge.map((packet) => packet.source),
    targetFits: selectedKnowledge.map((packet) => packet.targetFit),
    answerUsefulness: preview.sourceSearch.answerUsefulness,
    supportingClaims: preview.sourceSearch.supportingClaims,
    supportingDocuments: preview.sourceSearch.supportingDocuments,
    hitAtK: selectedTopK.some((id) => expectedIds.has(id)),
    recallAtK: roundMetric(recallAtK),
    ndcgAtK: roundMetric(ndcgAtK)
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
    thresholds: {
      minimumHitRateAtK: fixture.minimumHitRateAtK,
      minimumRecallAtK: fixture.minimumRecallAtK,
      minimumNdcgAtK: fixture.minimumNdcgAtK
    },
    metrics: {
      caseCount: cases.length,
      hitRateAtK: roundMetric(hitRateAtK),
      recallAtK: roundMetric(recallAtK),
      ndcgAtK: roundMetric(ndcgAtK),
      catalogBackedCases: cases.filter((testCase) =>
        testCase.selectedSources.includes("catalog_file")
      ).length,
      sourceBackedCases: cases.filter((testCase) =>
        testCase.selectedSources.includes("source_search")
      ).length,
      targetSpecificSelections: cases.reduce(
        (sum, testCase) =>
          sum + testCase.targetFits.filter((targetFit) => targetFit === "target_specific").length,
        0
      )
    },
    cases,
    proof: {
      proves: [
        "brain search selected expected proxy-labeled knowledge packets for the fixture query set",
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
