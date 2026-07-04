import { readFileSync } from "node:fs";

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

type MemoryAdvantageCardFixture = EvalKnowledgeCardFixture;
type MemoryAdvantageSourceClaimFixture = EvalSourceClaimFixture;

interface MemoryAdvantageCaseFixture {
  readonly id: string;
  readonly query: string;
  readonly expectedSelectedKnowledgeId: string;
  readonly memoryCards: readonly MemoryAdvantageCardFixture[];
  readonly sourceClaims: readonly MemoryAdvantageSourceClaimFixture[];
}

export interface MemoryAdvantageEvalFixture {
  readonly version: "1";
  readonly cases: readonly MemoryAdvantageCaseFixture[];
}

interface MemoryAdvantageCaseReadback {
  readonly caseId: string;
  readonly query: string;
  readonly "baseline_no_memory": {
    readonly result: "miss" | "unexpected_hit";
    readonly answerUsefulness: string;
    readonly selectedKnowledgeIds: readonly string[];
    readonly missingEvidence: readonly string[];
  };
  readonly "krn_memory": {
    readonly result: "hit" | "miss";
    readonly answerUsefulness: string;
    readonly selectedKnowledgeIds: readonly string[];
    readonly selectedSources: readonly string[];
    readonly requiredKnowledgeId: string;
    readonly supportingClaims: number;
    readonly supportingDocuments: number;
  };
}

export interface MemoryAdvantageEvalResult {
  readonly kind: "krn.memoryAdvantage.eval.v1";
  readonly fixtureVersion: "1";
  readonly status: "pass" | "fail";
  readonly cases: readonly MemoryAdvantageCaseReadback[];
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

interface BrainSearchPreviewReadback {
  readonly selectedKnowledgeIds: readonly string[];
  readonly selectedSources: readonly string[];
  readonly answerUsefulness: string;
  readonly supportingClaims: number;
  readonly supportingDocuments: number;
  readonly missingEvidence: readonly string[];
}

const parseCase = (
  value: Record<string, unknown>,
  index: number
): MemoryAdvantageCaseFixture => {
  const label = `cases[${index}]`;

  return {
    id: requiredString(value, "id", label),
    query: requiredString(value, "query", label),
    expectedSelectedKnowledgeId: requiredString(value, "expectedSelectedKnowledgeId", label),
    memoryCards: parseEvalKnowledgeCards(value, "memoryCards", label),
    sourceClaims: parseEvalSourceClaims(value, "sourceClaims", label)
  };
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
    cases
  };
};

export const loadMemoryAdvantageEvalFixture = (
  path: string
): MemoryAdvantageEvalFixture => {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));

  return parseMemoryAdvantageEvalFixture(parsed);
};

const knowledgePayload = (
  cards: readonly MemoryAdvantageCardFixture[]
): string =>
  JSON.stringify({
    kind: "krn.brainKnowledge.cards.preview.v1",
    returnedCards: cards.length,
    totalCards: cards.length,
    cards,
    proof: {
      doesNotProve: ["company-pattern catalog completeness", "LLM output quality"]
    }
  });

const sourceSearchPayload = (
  sourceClaims: readonly MemoryAdvantageSourceClaimFixture[]
): string =>
  JSON.stringify({
    kind: "source_search_answer_package",
    answerPackage: {
      answerUsefulness: sourceClaims.length > 0 ? "useful" : "not_useful",
      supportingClaims: sourceClaims,
      supportingDocuments: sourceClaims.length > 0 ? [{ label: "company-pattern-source" }] : [],
      sourceClaimDocumentLinks: [],
      relationSupport: [],
      sourceDecisionSupport: sourceClaims.map((claim) => ({
        sourceDecisionEdgeId: `decision-edge:${claim.sourceClaimId}`,
        sourceClaimId: claim.sourceClaimId,
        confidence: "high"
      })),
      graphReadback: {
        claimNodes: sourceClaims.length,
        relationEdges: 0,
        temporalEdges: 0,
        contradictionEdges: 0,
        duplicateEdges: 0,
        invalidationEdges: 0,
        graphAware: sourceClaims.length > 0,
        caveats: []
      },
      missingEvidence: sourceClaims.length > 0 ? [] : ["governed company-pattern memory/source evidence"]
    },
    includedCandidates: sourceClaims.map((claim) => ({
      subjectId: claim.sourceClaimId
    })),
    proof: {
      doesNotProve: ["source truth", "arbitrary task superiority"]
    }
  });

const parseBrainSearchPreview = (
  stdout: string,
  label: string
): BrainSearchPreviewReadback => {
  const preview = parseBrainSearchPreviewSections(stdout, label);

  return {
    selectedKnowledgeIds: preview.selectedKnowledge.map((packet, index) =>
      requiredString(packet, "id", `${label}.selectedKnowledge[${index}]`)
    ),
    selectedSources: preview.selectedKnowledge.map((packet, index) =>
      requiredString(packet, "source", `${label}.selectedKnowledge[${index}]`)
    ),
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

const runCaseVariant = async (
  testCase: MemoryAdvantageCaseFixture,
  cards: readonly MemoryAdvantageCardFixture[],
  sourceClaims: readonly MemoryAdvantageSourceClaimFixture[],
  idSuffix: string
): Promise<BrainSearchPreviewReadback> => {
  const command: BrainSearchCommand = {
    kind: "brainSearch",
    query: testCase.query,
    catalogFiles: [],
    storeOnly: false,
    limit: 5,
    maxInclusions: 5,
    format: "json"
  };
  const result = await runBrainSearchCommand({
    cwd: process.cwd(),
    env: {},
    now: () => "2026-07-04T00:00:00.000Z",
    createId: (prefix) => `${prefix}-memory-advantage-${idSuffix}`,
    command,
    async runKnowledgeCards() {
      return {
        stdout: knowledgePayload(cards)
      };
    },
    async runSourceSearch() {
      return {
        stdout: sourceSearchPayload(sourceClaims)
      };
    }
  });

  return parseBrainSearchPreview(result.stdout, `${testCase.id}.${idSuffix}`);
};

const evaluateCase = async (
  testCase: MemoryAdvantageCaseFixture
): Promise<MemoryAdvantageCaseReadback> => {
  const baseline = await runCaseVariant(testCase, [], [], "baseline");
  const krnMemory = await runCaseVariant(
    testCase,
    testCase.memoryCards,
    testCase.sourceClaims,
    "krn"
  );
  const baselineMiss =
    baseline.answerUsefulness === "not_useful" && baseline.selectedKnowledgeIds.length === 0;
  const krnHit =
    krnMemory.answerUsefulness === "useful" &&
    krnMemory.selectedKnowledgeIds.includes(testCase.expectedSelectedKnowledgeId);

  return {
    caseId: testCase.id,
    query: testCase.query,
    "baseline_no_memory": {
      result: baselineMiss ? "miss" : "unexpected_hit",
      answerUsefulness: baseline.answerUsefulness,
      selectedKnowledgeIds: baseline.selectedKnowledgeIds,
      missingEvidence: baseline.missingEvidence
    },
    "krn_memory": {
      result: krnHit ? "hit" : "miss",
      answerUsefulness: krnMemory.answerUsefulness,
      selectedKnowledgeIds: krnMemory.selectedKnowledgeIds,
      selectedSources: krnMemory.selectedSources,
      requiredKnowledgeId: testCase.expectedSelectedKnowledgeId,
      supportingClaims: krnMemory.supportingClaims,
      supportingDocuments: krnMemory.supportingDocuments
    }
  };
};

export const runMemoryAdvantageEval = async (
  fixture: MemoryAdvantageEvalFixture
): Promise<MemoryAdvantageEvalResult> => {
  const cases = await Promise.all(fixture.cases.map(evaluateCase));
  const status = cases.every((testCase) =>
    testCase["baseline_no_memory"].result === "miss" &&
    testCase["krn_memory"].result === "hit"
  )
    ? "pass"
    : "fail";

  return {
    kind: "krn.memoryAdvantage.eval.v1",
    fixtureVersion: fixture.version,
    status,
    cases,
    proof: {
      proves: [
        "the fixture query is unsupported when no KRN memory or source evidence is available",
        "fixture-provided company-pattern memory/source context processed through brain search makes the same query useful",
        "the expected memory/source id is present in selectedKnowledge",
        "the memory-advantage fixture output is deterministic enough for regression checks"
      ],
      doesNotProve: [
        "arbitrary task superiority over vanilla Codex",
        "KRN retrieval or selection quality",
        "LLM output quality",
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
