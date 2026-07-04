import { readFileSync } from "node:fs";

import type {
  SourceClaim,
  SourceClaimEdge,
  SourceDecisionEdge
} from "@krn/core";
import type {
  SearchDocumentSearchResult
} from "@krn/harness/repositories/internal";

import type {
  DatabaseRuntime
} from "./databaseRuntime.js";
import {
  isCliEntrypoint,
  writeJsonEvalResult
} from "./evalMain.js";
import {
  runSourceSearchCommand
} from "./runSourceSearchCommand.js";
import {
  ndcgAtK,
  roundRankingMetric
} from "./rankingEvalMetrics.js";

interface SourceGraphRankingRow {
  readonly id: string;
  readonly terms: string;
  readonly claim: string;
}

interface SourceGraphRankingRelation {
  readonly from: string;
  readonly to: string;
  readonly kind: SourceClaimEdge["kind"];
}

interface SourceGraphRankingQuery {
  readonly id: string;
  readonly query: string;
  readonly expectedHitIds: readonly string[];
  readonly baselineFailureRationale: string;
}

export interface SourceGraphRankingEvalFixture {
  readonly version: "1";
  readonly corpusName: string;
  readonly distractorClasses: readonly string[];
  readonly topK: number;
  readonly minimumHitRateAtK: number;
  readonly minimumNdcgAtK: number;
  readonly rows: readonly SourceGraphRankingRow[];
  readonly relations: readonly SourceGraphRankingRelation[];
  readonly queries: readonly SourceGraphRankingQuery[];
}

export interface SourceGraphRankingEvalCaseResult {
  readonly id: string;
  readonly query: string;
  readonly expectedHitIds: readonly string[];
  readonly baselineFailureRationale: string;
  readonly includedHitIds: readonly string[];
  readonly supportingClaims: number;
  readonly supportingDocuments: number;
  readonly sourceClaimDocumentLinks: number;
  readonly relationSupport: number;
  readonly expectedHitRelationSupport: number;
  readonly sourceDecisionSupport: number;
  readonly hitAtK: boolean;
  readonly ndcgAtK: number;
}

export interface SourceGraphRankingEvalResult {
  readonly kind: "krn.sourceGraphRanking.eval.v1";
  readonly fixtureVersion: "1";
  readonly status: "pass" | "fail";
  readonly topK: number;
  readonly corpus: {
    readonly name: string;
    readonly rowCount: number;
    readonly queryCount: number;
    readonly distractorClasses: readonly string[];
  };
  readonly thresholds: {
    readonly minimumHitRateAtK: number;
    readonly minimumNdcgAtK: number;
  };
  readonly metrics: {
    readonly queryCount: number;
    readonly corpusRows: number;
    readonly hitRateAtK: number;
    readonly ndcgAtK: number;
    readonly answerRelationReadbackCases: number;
    readonly expectedHitRelationReadbackCases: number;
    readonly searchDocumentLinkReadbackCases: number;
    readonly sourceDecisionSupportCases: number;
    readonly expectedHitIdCount: number;
    readonly distractorClassCount: number;
  };
  readonly cases: readonly SourceGraphRankingEvalCaseResult[];
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

const projectId = "source-graph-ranking-project";
const now = "2026-07-04T00:00:00.000Z";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringValue = (
  value: unknown,
  label: string
): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }

  return value;
};

const numberValue = (
  value: unknown,
  label: string
): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }

  return value;
};

const tupleArray = (
  value: unknown,
  label: string,
  length: number
): readonly unknown[][] => {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }

  return value.map((item, index) => {
    if (!Array.isArray(item) || item.length !== length) {
      throw new Error(`${label}[${index}] must be a ${length}-item tuple`);
    }

    return item;
  });
};

const parseStringArray = (
  value: unknown,
  label: string
): readonly string[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} must be a non-empty string array`);
  }

  return value.map((item, index) => stringValue(item, `${label}[${index}]`));
};

const parseRow = (
  tuple: readonly unknown[],
  index: number
): SourceGraphRankingRow => ({
  id: stringValue(tuple[0], `rows[${index}][0]`),
  terms: stringValue(tuple[1], `rows[${index}][1]`),
  claim: stringValue(tuple[2], `rows[${index}][2]`)
});

const sourceClaimEdgeKinds = new Set<SourceClaimEdge["kind"]>([
  "supports",
  "contradicts",
  "qualifies",
  "depends_on",
  "narrows",
  "duplicates",
  "supersedes",
  "invalidates",
  "expires"
]);

const parseRelationKind = (
  value: unknown,
  label: string
): SourceClaimEdge["kind"] => {
  const kind = stringValue(value, label);

  if (!sourceClaimEdgeKinds.has(kind as SourceClaimEdge["kind"])) {
    throw new Error(`${label} is not a supported SourceClaimEdge kind`);
  }

  return kind as SourceClaimEdge["kind"];
};

const parseRelation = (
  tuple: readonly unknown[],
  index: number
): SourceGraphRankingRelation => ({
  from: stringValue(tuple[0], `relations[${index}][0]`),
  to: stringValue(tuple[1], `relations[${index}][1]`),
  kind: parseRelationKind(tuple[2], `relations[${index}][2]`)
});

const parseQuery = (
  tuple: readonly unknown[],
  index: number
): SourceGraphRankingQuery => ({
  id: stringValue(tuple[0], `queries[${index}][0]`),
  query: stringValue(tuple[1], `queries[${index}][1]`),
  expectedHitIds: parseStringArray(tuple[2], `queries[${index}][2]`),
  baselineFailureRationale: stringValue(tuple[3], `queries[${index}][3]`)
});

export const parseSourceGraphRankingEvalFixture = (
  value: unknown
): SourceGraphRankingEvalFixture => {
  if (!isRecord(value)) {
    throw new Error("source graph ranking eval fixture must be an object");
  }

  if (value["version"] !== "1") {
    throw new Error("source graph ranking eval fixture version must be 1");
  }

  const rows = tupleArray(value["rows"], "rows", 3).map(parseRow);
  const queries = tupleArray(value["queries"], "queries", 4).map(parseQuery);

  if (rows.length < 20) {
    throw new Error("source graph ranking eval fixture must contain at least 20 corpus rows");
  }

  if (queries.length < 15) {
    throw new Error("source graph ranking eval fixture must contain at least 15 queries");
  }

  return {
    version: "1",
    corpusName: stringValue(value["corpusName"], "corpusName"),
    distractorClasses: parseStringArray(value["distractorClasses"], "distractorClasses"),
    topK: numberValue(value["topK"], "topK"),
    minimumHitRateAtK: numberValue(value["minimumHitRateAtK"], "minimumHitRateAtK"),
    minimumNdcgAtK: numberValue(value["minimumNdcgAtK"], "minimumNdcgAtK"),
    rows,
    relations: tupleArray(value["relations"], "relations", 3).map(parseRelation),
    queries
  };
};

export const loadSourceGraphRankingEvalFixture = (
  path: string
): SourceGraphRankingEvalFixture => {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));

  return parseSourceGraphRankingEvalFixture(parsed);
};

const tokens = (value: string): readonly string[] =>
  [...value.toLowerCase().matchAll(/[\p{L}\p{N}]+/gu)].map((match) => match[0]);

const overlapScore = (query: string, text: string): number => {
  const queryTokens = new Set(tokens(query).filter((token) => token.length >= 4));
  const textTokens = new Set(tokens(text));
  let score = 0;

  for (const token of queryTokens) {
    if (textTokens.has(token)) {
      score += 20;
    }
  }

  return score;
};

const rowSourceArtifactId = (row: SourceGraphRankingRow): string =>
  `artifact:${row.id}`;

const rowSourceChunkId = (row: SourceGraphRankingRow): string =>
  `chunk:${row.id}`;

const rowClaim = (row: SourceGraphRankingRow): SourceClaim => ({
  id: row.id,
  sourceArtifactId: rowSourceArtifactId(row),
  claim: `${row.claim} ${row.terms}.`,
  mechanism: `${row.terms}. ${row.terms}.`,
  krnImplication: `Rank ${row.id} for ${row.terms}.`,
  doesNotProve: "This fixture row does not prove production retrieval quality.",
  trustTier: "project-decision",
  supportType: "implementation-boundary",
  consumer: "source graph ranking eval",
  falsifier: `Query terms for ${row.id} do not return the expected source claim in top-k.`,
  status: "accepted",
  metadata: {
    sourceArtifactId: rowSourceArtifactId(row),
    sourceChunkId: rowSourceChunkId(row)
  },
  createdAt: now,
  updatedAt: now
});

const rowDocument = (
  row: SourceGraphRankingRow,
  query: string
): SearchDocumentSearchResult => ({
  id: `doc:${row.id}`,
  projectId,
  subjectType: "source_artifact",
  subjectId: rowSourceArtifactId(row),
  sourceArtifactId: rowSourceArtifactId(row),
  sourceChunkId: rowSourceChunkId(row),
  sourceClaimId: row.id,
  trustTier: "source-code",
  validityStatus: "active",
  language: "english",
  title: `Fixture source document ${row.id}`,
  body: `${row.claim} ${row.terms}`,
  searchText: `${row.claim} ${row.terms}`,
  metadataFilters: {},
  validFrom: now,
  metadata: {},
  createdAt: now,
  updatedAt: now,
  lexicalScore: overlapScore(query, `${row.claim} ${row.terms}`),
  vectorScore: overlapScore(query, row.terms) / 2,
  graphScore: 0
});

const rowDecisionEdge = (row: SourceGraphRankingRow): SourceDecisionEdge => ({
  id: `decision-edge:${row.id}`,
  sourceClaimId: row.id,
  targetType: "eval_candidate",
  targetId: `source-graph-ranking:${row.id}`,
  supportType: "implementation-boundary",
  confidence: "high",
  notes: "Fixture decision edge gives accepted rows visible decision support.",
  metadata: {
    doesNotProve: "Fixture SourceDecisionEdge support does not prove source truth."
  },
  createdAt: now
});

const relationEdge = (
  relation: SourceGraphRankingRelation,
  index: number
): SourceClaimEdge => ({
  id: `relation-edge:${index}`,
  fromSourceClaimId: relation.from,
  toSourceClaimId: relation.to,
  kind: relation.kind,
  metadata: {
    consumer: "source graph ranking eval",
    doesNotProve: "Fixture relation edge does not prove graph retrieval quality.",
    evidenceRef: "tests/fixtures/source-graph-ranking/source-graph-ranking-eval.json"
  },
  createdAt: now
});

const createRuntime = (
  fixture: SourceGraphRankingEvalFixture,
  query: string
) => {
  const claims = fixture.rows.map(rowClaim);
  const documents = fixture.rows
    .map((row) => rowDocument(row, query))
    .sort((left, right) => right.lexicalScore - left.lexicalScore);
  const decisionEdges = fixture.rows.map(rowDecisionEdge);
  const relationEdges = fixture.relations.map(relationEdge);

  return async (): Promise<DatabaseRuntime> => ({
    workspaceId: "workspace-source-graph-ranking",
    projectId,
    compilerDependencies: {
      now: () => now,
      createId: (prefix) => `${prefix}-source-graph-ranking`,
      harnessRunRepository: {} as DatabaseRuntime["compilerDependencies"]["harnessRunRepository"],
      memoryRepository: {
        async listActiveMemory() {
          return [];
        },
        async listAntiMemoryForProject() {
          return [];
        }
      },
      sourceRepository: {
        async listClaimsForProject(_projectId, limit) {
          return claims.slice(0, limit);
        },
        async listSourceClaimEdgesForClaim(sourceClaimId) {
          return relationEdges.filter((edge) =>
            edge.fromSourceClaimId === sourceClaimId ||
            edge.toSourceClaimId === sourceClaimId
          );
        }
      },
      retrievalRepository: {
        async searchLexical() {
          return documents;
        },
        async startRetrievalRun() {
          throw new Error("startRetrievalRun should not be called");
        },
        async completeRetrievalRun() {
          throw new Error("completeRetrievalRun should not be called");
        },
        async addCandidate() {
          throw new Error("addCandidate should not be called");
        },
        async recordActivationDecision() {
          throw new Error("recordActivationDecision should not be called");
        },
        async storeContextSelection() {
          throw new Error("storeContextSelection should not be called");
        }
      }
    },
    harnessRunRepository: {} as DatabaseRuntime["harnessRunRepository"],
    memoryRepository: {} as DatabaseRuntime["memoryRepository"],
    sourceRepository: {
      async createSourceArtifact() {
        throw new Error("createSourceArtifact should not be called");
      },
      async createSourceClaim() {
        throw new Error("createSourceClaim should not be called");
      },
      async listClaimsForProject() {
        throw new Error("listClaimsForProject should not be called");
      },
      async getSourceClaimById() {
        throw new Error("getSourceClaimById should not be called");
      },
      async createSourceClaimEdge() {
        throw new Error("createSourceClaimEdge should not be called");
      },
      async listSourceClaimEdgesForClaim(sourceClaimId) {
        return relationEdges.filter((edge) =>
          edge.fromSourceClaimId === sourceClaimId ||
          edge.toSourceClaimId === sourceClaimId
        );
      },
      async createSourceDecisionEdge() {
        throw new Error("createSourceDecisionEdge should not be called");
      },
      async getSourceDecisionEdgeById() {
        throw new Error("getSourceDecisionEdgeById should not be called");
      },
      async listSourceDecisionEdgesForClaim(sourceClaimId) {
        return decisionEdges.filter((edge) => edge.sourceClaimId === sourceClaimId);
      },
      async createSourceRejection() {
        throw new Error("createSourceRejection should not be called");
      }
    },
    retrievalRepository: {
      async createSearchDocument() {
        throw new Error("createSearchDocument should not be called");
      },
      async searchLexical() {
        return documents;
      },
      async listSearchDocumentsForSourceLinks() {
        return documents;
      }
    },
    async close() {}
  });
};

const parseJsonObject = (
  value: string,
  label: string
): Record<string, unknown> => {
  const parsed: unknown = JSON.parse(value);

  if (!isRecord(parsed)) {
    throw new Error(`${label} must return a JSON object`);
  }

  return parsed;
};

const arrayValue = (
  value: unknown,
  label: string
): readonly unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }

  return value;
};

const recordArray = (
  value: unknown,
  label: string
): readonly Record<string, unknown>[] =>
  arrayValue(value, label).map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`${label}[${index}] must be an object`);
    }

    return item;
  });

const optionalString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const candidateHitId = (candidate: Record<string, unknown>): string | undefined => {
  const sourceClaimId = optionalString(candidate["sourceClaimId"]);
  const searchDocumentId = optionalString(candidate["searchDocumentId"]);

  if (sourceClaimId !== undefined) {
    return `source_claim:${sourceClaimId}`;
  }

  return searchDocumentId === undefined ? undefined : `search_document:${searchDocumentId}`;
};

const sourceClaimIdFromHitId = (hitId: string): string | undefined =>
  hitId.startsWith("source_claim:") ? hitId.slice("source_claim:".length) : undefined;

const evaluateQuery = async (
  fixture: SourceGraphRankingEvalFixture,
  queryCase: SourceGraphRankingQuery
): Promise<SourceGraphRankingEvalCaseResult> => {
  const result = await runSourceSearchCommand({
    cwd: process.cwd(),
    env: {
      KRN_DATABASE_URL: "postgres://fixture/source-graph-ranking"
    },
    now: () => now,
    createId: (prefix) => `${prefix}-source-graph-ranking`,
    command: {
      kind: "sourceSearch",
      query: queryCase.query,
      json: true,
      limit: 20,
      maxInclusions: fixture.topK
    },
    createDatabaseRuntime: createRuntime(fixture, queryCase.query)
  });
  const output = parseJsonObject(result.stdout, queryCase.id);
  const answerPackage = parseJsonObject(
    JSON.stringify(output["answerPackage"]),
    `${queryCase.id}.answerPackage`
  );
  const includedCandidates = recordArray(output["includedCandidates"], `${queryCase.id}.includedCandidates`);
  const includedHitIds = includedCandidates.flatMap((candidate) => {
    const hitId = candidateHitId(candidate);

    return hitId === undefined ? [] : [hitId];
  });
  const expectedHitIds = new Set(queryCase.expectedHitIds);
  const expectedSourceClaimIds = new Set(queryCase.expectedHitIds.flatMap((hitId) => {
    const sourceClaimId = sourceClaimIdFromHitId(hitId);

    return sourceClaimId === undefined ? [] : [sourceClaimId];
  }));
  const relationSupport = recordArray(answerPackage["relationSupport"], `${queryCase.id}.relationSupport`);

  return {
    id: queryCase.id,
    query: queryCase.query,
    expectedHitIds: queryCase.expectedHitIds,
    baselineFailureRationale: queryCase.baselineFailureRationale,
    includedHitIds,
    supportingClaims: recordArray(answerPackage["supportingClaims"], `${queryCase.id}.supportingClaims`).length,
    supportingDocuments: recordArray(answerPackage["supportingDocuments"], `${queryCase.id}.supportingDocuments`).length,
    sourceClaimDocumentLinks: recordArray(
      answerPackage["sourceClaimDocumentLinks"],
      `${queryCase.id}.sourceClaimDocumentLinks`
    ).length,
    relationSupport: relationSupport.length,
    expectedHitRelationSupport: relationSupport.filter((support) => {
      const sourceClaimId = optionalString(support["sourceClaimId"]);

      return sourceClaimId !== undefined && expectedSourceClaimIds.has(sourceClaimId);
    }).length,
    sourceDecisionSupport: recordArray(answerPackage["sourceDecisionSupport"], `${queryCase.id}.sourceDecisionSupport`).length,
    hitAtK: includedHitIds.slice(0, fixture.topK).some((id) => expectedHitIds.has(id)),
    ndcgAtK: roundRankingMetric(ndcgAtK(includedHitIds, expectedHitIds, fixture.topK))
  };
};

export const runSourceGraphRankingEval = async (
  fixture: SourceGraphRankingEvalFixture
): Promise<SourceGraphRankingEvalResult> => {
  const cases = await Promise.all(fixture.queries.map((query) => evaluateQuery(fixture, query)));
  const hitRateAtK = cases.filter((testCase) => testCase.hitAtK).length / cases.length;
  const ndcgAtK = cases.reduce((sum, testCase) => sum + testCase.ndcgAtK, 0) / cases.length;
  const status =
    hitRateAtK >= fixture.minimumHitRateAtK &&
    ndcgAtK >= fixture.minimumNdcgAtK
      ? "pass"
      : "fail";

  return {
    kind: "krn.sourceGraphRanking.eval.v1",
    fixtureVersion: fixture.version,
    status,
    topK: fixture.topK,
    corpus: {
      name: fixture.corpusName,
      rowCount: fixture.rows.length,
      queryCount: fixture.queries.length,
      distractorClasses: fixture.distractorClasses
    },
    thresholds: {
      minimumHitRateAtK: fixture.minimumHitRateAtK,
      minimumNdcgAtK: fixture.minimumNdcgAtK
    },
    metrics: {
      queryCount: cases.length,
      corpusRows: fixture.rows.length,
      hitRateAtK: roundRankingMetric(hitRateAtK),
      ndcgAtK: roundRankingMetric(ndcgAtK),
      answerRelationReadbackCases: cases.filter((testCase) =>
        testCase.relationSupport > 0
      ).length,
      expectedHitRelationReadbackCases: cases.filter((testCase) =>
        testCase.expectedHitRelationSupport > 0
      ).length,
      searchDocumentLinkReadbackCases: cases.filter((testCase) =>
        testCase.sourceClaimDocumentLinks > 0
      ).length,
      sourceDecisionSupportCases: cases.filter((testCase) =>
        testCase.sourceDecisionSupport > 0
      ).length,
      expectedHitIdCount: cases.reduce(
        (sum, testCase) => sum + testCase.expectedHitIds.length,
        0
      ),
      distractorClassCount: fixture.distractorClasses.length
    },
    cases,
    proof: {
      proves: [
          "source search selected expected proxy-labeled source graph rows for the fixture query set",
        "source graph ranking fixture reports corpus name, corpus size, distractor classes, and per-query baseline failure rationale",
        "SourceClaim, source-claim-to-SearchDocument link, SourceDecisionEdge, and SourceClaimEdge readbacks were exercised without DB writes",
        "future changes that drop expected source graph hits from top-k will fail this eval"
      ],
      doesNotProve: [
        "proxy labels are not production retrieval truth",
        "source truth",
        "broad semantic ranking quality",
        "live pgvector retrieval quality",
        "crawler readiness",
        "product readiness"
      ]
    }
  };
};

const main = async (): Promise<SourceGraphRankingEvalResult> => {
  const fixturePath = process.argv[2] ?? "tests/fixtures/source-graph-ranking/source-graph-ranking-eval.json";
  return runSourceGraphRankingEval(loadSourceGraphRankingEvalFixture(fixturePath));
};

if (isCliEntrypoint(import.meta.url)) {
  await writeJsonEvalResult(main);
}
