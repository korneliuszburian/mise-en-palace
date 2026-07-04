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
    readonly selectedSourceClaimIds: readonly string[];
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
  readonly selectedSourceClaimIds: readonly string[];
  readonly answerUsefulness: string;
  readonly supportingClaims: number;
  readonly supportingDocuments: number;
  readonly missingEvidence: readonly string[];
}

const now = "2026-07-04T00:00:00.000Z";
const projectId = "project:memory-advantage";

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
    selectedSourceClaimIds: requiredStringArray(
      preview.sourceSearch,
      "supportingClaimIds",
      `${label}.sourceSearch`
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

const assertLexicalOverlap = (
  testCase: MemoryAdvantageCaseFixture
): void => {
  const query = testCase.query;
  const hasCardOverlap = testCase.memoryCards.some((card) =>
    tokenScore(query, [card.title, card.summary, card.nextAction].join(" ")) > 0
  );
  const hasClaimOverlap = testCase.sourceClaims.some((claim) =>
    tokenScore(query, [claim.claim, claim.mechanism, claim.krnImplication].join(" ")) > 0
  );

  if (!hasCardOverlap || !hasClaimOverlap) {
    throw new Error(`${testCase.id} must have lexical overlap with memory card and source claim text`);
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

const throwingRepositoryMethod = (method: string): never => {
  throw new Error(`${method} should not be called by memory advantage eval`);
};

const createMemoryAdvantageRuntime = (
  cards: readonly MemoryAdvantageCardFixture[],
  sourceClaims: readonly MemoryAdvantageSourceClaimFixture[]
): DatabaseRuntime => {
  const claims = sourceClaims.map(sourceClaimFromFixture);
  const documents = claims.map(searchDocumentFromClaim);
  const memories = cards.map(memoryRecordFromCard);
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
      harnessRunRepository: {
        createOperatorIntent: async () => throwingRepositoryMethod("createOperatorIntent"),
        createTaskContract: async () => throwingRepositoryMethod("createTaskContract"),
        createHarnessPlan: async () => throwingRepositoryMethod("createHarnessPlan"),
        createContextAssembly: async () => throwingRepositoryMethod("createContextAssembly")
      },
      memoryRepository: {
        listActiveMemory: async () => memories,
        listAntiMemoryForProject: async () => []
      },
      sourceRepository: {
        listClaimsForProject: async () => claims,
        listSourceClaimEdgesForClaim: async () => []
      },
      retrievalRepository: {
        searchLexical,
        startRetrievalRun: async () => throwingRepositoryMethod("startRetrievalRun"),
        completeRetrievalRun: async () => throwingRepositoryMethod("completeRetrievalRun"),
        addCandidate: async () => throwingRepositoryMethod("addCandidate"),
        recordActivationDecision: async () => throwingRepositoryMethod("recordActivationDecision"),
        storeContextSelection: async () => throwingRepositoryMethod("storeContextSelection")
      },
      now: () => now,
      createId: (prefix) => `${prefix}-memory-advantage-store`
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
  cards: readonly MemoryAdvantageCardFixture[]
): Promise<{ readonly root: string; readonly catalogFile: string }> => {
  const root = await mkdtemp(join(tmpdir(), "krn-memory-advantage-"));
  const catalogFile = join(root, "catalog.json");
  const readModelCards = cards.map((card) => ({
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
    catalogFile
  };
};

const runCaseVariant = async (
  testCase: MemoryAdvantageCaseFixture,
  cards: readonly MemoryAdvantageCardFixture[],
  sourceClaims: readonly MemoryAdvantageSourceClaimFixture[],
  idSuffix: string,
  storeOnly: boolean
): Promise<BrainSearchPreviewReadback> => {
  const knowledgeStore = storeOnly ? undefined : await writeKnowledgeCatalog(cards);
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

    return parseBrainSearchPreview(result.stdout, `${testCase.id}.${idSuffix}`);
  } finally {
    if (knowledgeStore !== undefined) {
      await rm(knowledgeStore.root, {
        recursive: true,
        force: true
      });
    }
  }
};

const evaluateCase = async (
  testCase: MemoryAdvantageCaseFixture
): Promise<MemoryAdvantageCaseReadback> => {
  assertLexicalOverlap(testCase);
  const baseline = await runCaseVariant(testCase, [], [], "baseline", true);
  const krnMemory = await runCaseVariant(
    testCase,
    testCase.memoryCards,
    testCase.sourceClaims,
    "krn",
    false
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
      selectedSourceClaimIds: krnMemory.selectedSourceClaimIds,
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
        "company-pattern memory/source inputs from the in-memory eval store are selected through real brain/source command paths",
        "the expected memory/source id is present in selectedKnowledge",
        "the memory-advantage fixture output is deterministic enough for regression checks"
      ],
      doesNotProve: [
        "arbitrary task superiority over vanilla Codex",
        "production retrieval/recall quality; this eval uses in-memory lexical token overlap",
        "live Postgres runtime behavior",
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
