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
  readonly relationLinkedExpected: boolean;
  readonly expectedRelationKinds: readonly SourceClaimEdge["kind"][];
  readonly corpusSplit: SourceGraphRankingCorpusSplit;
  readonly expectedRelationDirections: readonly SourceGraphRankingRelationDirection[];
}

type SourceGraphRankingCorpusSplit = "main" | "held_out";
type SourceGraphRankingRelationDirection = "incoming" | "outgoing";

interface SourceGraphFlatComparison {
  readonly includedHitIds: readonly string[];
  readonly relationSupport: number;
  readonly expectedHitRelationSupport: number;
  readonly relationKinds: readonly SourceClaimEdge["kind"][];
  readonly expectedHitRelationKinds: readonly SourceClaimEdge["kind"][];
  readonly relationDirections: readonly SourceGraphRankingRelationDirection[];
  readonly expectedHitRelationDirections: readonly SourceGraphRankingRelationDirection[];
  readonly hitAtK: boolean;
  readonly ndcgAtK: number;
  readonly weakness: "missing_expected_relation_support";
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

interface SourceGraphQueryRun {
  readonly includedHitIds: readonly string[];
  readonly supportingClaims: number;
  readonly supportingDocuments: number;
  readonly sourceClaimDocumentLinks: number;
  readonly relationSupport: number;
  readonly expectedHitRelationSupport: number;
  readonly relationKinds: readonly SourceClaimEdge["kind"][];
  readonly expectedHitRelationKinds: readonly SourceClaimEdge["kind"][];
  readonly relationDirections: readonly SourceGraphRankingRelationDirection[];
  readonly expectedHitRelationDirections: readonly SourceGraphRankingRelationDirection[];
  readonly incomingStaleEdge: boolean;
  readonly sourceDecisionSupport: number;
  readonly hitAtK: boolean;
  readonly ndcgAtK: number;
}

export interface SourceGraphRankingEvalCaseResult extends SourceGraphQueryRun {
  readonly id: string;
  readonly corpusSplit: SourceGraphRankingCorpusSplit;
  readonly query: string;
  readonly expectedHitIds: readonly string[];
  readonly baselineFailureRationale: string;
  readonly relationLinkedExpected: boolean;
  readonly expectedRelationKinds: readonly SourceClaimEdge["kind"][];
  readonly expectedRelationDirections: readonly SourceGraphRankingRelationDirection[];
  readonly flatComparison?: SourceGraphFlatComparison;
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
    readonly heldOutQueryCount: number;
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
    readonly relationLinkedCaseCount: number;
    readonly flatBaselineWeakerCases: number;
    readonly flatBaselineMissingExpectedRelationSupportCases: number;
    readonly relationShapeCaseCount: number;
    readonly relationShapeCoveredCases: number;
    readonly relationShapeKinds: readonly SourceClaimEdge["kind"][];
    readonly heldOutQueryCount: number;
    readonly heldOutHitRateAtK: number;
    readonly heldOutNdcgAtK: number;
    readonly heldOutRelationShapeCaseCount: number;
    readonly heldOutRelationShapeKinds: readonly SourceClaimEdge["kind"][];
    readonly relationDirectionCaseCount: number;
    readonly relationDirectionCoveredCases: number;
    readonly relationDirections: readonly SourceGraphRankingRelationDirection[];
    readonly observedRelationDirections: readonly SourceGraphRankingRelationDirection[];
    readonly heldOutRelationDirections: readonly SourceGraphRankingRelationDirection[];
    readonly heldOutObservedRelationDirections: readonly SourceGraphRankingRelationDirection[];
    readonly staleEdgeReadbackCases: number;
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

const booleanValue = (
  value: unknown,
  label: string
): boolean => {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }

  return value;
};

const parseCorpusSplit = (
  value: unknown,
  label: string
): SourceGraphRankingCorpusSplit => {
  if (value === undefined) {
    return "main";
  }

  const split = stringValue(value, label);

  if (split !== "main" && split !== "held_out") {
    throw new Error(`${label} must be main or held_out`);
  }

  return split;
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

const parseRelationKindArray = (
  value: unknown,
  label: string
): readonly SourceClaimEdge["kind"][] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }

  return value.map((item, index) => parseRelationKind(item, `${label}[${index}]`));
};

const parseRelationDirection = (
  value: unknown,
  label: string
): SourceGraphRankingRelationDirection => {
  const direction = stringValue(value, label);

  if (direction !== "incoming" && direction !== "outgoing") {
    throw new Error(`${label} must be incoming or outgoing`);
  }

  return direction;
};

const parseRelationDirectionArray = (
  value: unknown,
  label: string
): readonly SourceGraphRankingRelationDirection[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }

  return value.map((item, index) => parseRelationDirection(item, `${label}[${index}]`));
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

const requiredRelationShapeKinds = [
  "duplicates",
  "invalidates",
  "supports"
] as const satisfies readonly SourceClaimEdge["kind"][];

const requiredRelationDirections = [
  "incoming",
  "outgoing"
] as const satisfies readonly SourceGraphRankingRelationDirection[];

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
): SourceGraphRankingQuery => {
  const relationLinkedExpected = tuple[4] === undefined
    ? false
    : booleanValue(tuple[4], `queries[${index}][4]`);
  const expectedRelationKinds = parseRelationKindArray(tuple[5], `queries[${index}][5]`);
  const corpusSplit = parseCorpusSplit(tuple[6], `queries[${index}][6]`);
  const expectedRelationDirections = parseRelationDirectionArray(tuple[7], `queries[${index}][7]`);

  if (expectedRelationKinds.length > 0 && !relationLinkedExpected) {
    throw new Error(`queries[${index}] expectedRelationKinds require relationLinkedExpected=true`);
  }

  if (expectedRelationDirections.length > 0 && !relationLinkedExpected) {
    throw new Error(`queries[${index}] expectedRelationDirections require relationLinkedExpected=true`);
  }

  return {
    id: stringValue(tuple[0], `queries[${index}][0]`),
    query: stringValue(tuple[1], `queries[${index}][1]`),
    expectedHitIds: parseStringArray(tuple[2], `queries[${index}][2]`),
    baselineFailureRationale: stringValue(tuple[3], `queries[${index}][3]`),
    relationLinkedExpected,
    expectedRelationKinds,
    corpusSplit,
    expectedRelationDirections
  };
};

const parseQueryTuples = (
  value: unknown
): readonly SourceGraphRankingQuery[] => {
  if (!Array.isArray(value)) {
    throw new Error("queries must be an array");
  }

  return value.map((item, index) => {
    if (!Array.isArray(item) || (item.length < 4 || item.length > 8)) {
      throw new Error(`queries[${index}] must be a 4-, 5-, 6-, 7-, or 8-item tuple`);
    }

    return parseQuery(item, index);
  });
};

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
  const queries = parseQueryTuples(value["queries"]);

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
  query: string,
  options: { readonly includeRelations: boolean }
) => {
  const claims = fixture.rows.map(rowClaim);
  const documents = fixture.rows
    .map((row) => rowDocument(row, query))
    .sort((left, right) => right.lexicalScore - left.lexicalScore);
  const decisionEdges = fixture.rows.map(rowDecisionEdge);
  const relationEdges = options.includeRelations
    ? fixture.relations.map(relationEdge)
    : [];

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

const relationKindFromReadback = (
  value: unknown
): SourceClaimEdge["kind"] | undefined => {
  const kind = optionalString(value);

  return kind !== undefined && sourceClaimEdgeKinds.has(kind as SourceClaimEdge["kind"])
    ? kind as SourceClaimEdge["kind"]
    : undefined;
};

const uniqueRelationKinds = (
  kinds: readonly SourceClaimEdge["kind"][]
): readonly SourceClaimEdge["kind"][] =>
  Array.from(new Set(kinds)).sort();

const relationDirectionFromReadback = (
  value: unknown
): SourceGraphRankingRelationDirection | undefined => {
  const direction = optionalString(value);

  return direction === "incoming" || direction === "outgoing" ? direction : undefined;
};

const uniqueRelationDirections = (
  directions: readonly SourceGraphRankingRelationDirection[]
): readonly SourceGraphRankingRelationDirection[] =>
  Array.from(new Set(directions)).sort();

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

const runQueryPath = async (
  fixture: SourceGraphRankingEvalFixture,
  queryCase: SourceGraphRankingQuery,
  options: { readonly includeRelations: boolean }
): Promise<SourceGraphQueryRun> => {
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
    createDatabaseRuntime: createRuntime(fixture, queryCase.query, options)
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
  const relationKinds = uniqueRelationKinds(relationSupport.flatMap((support) => {
    const kind = relationKindFromReadback(support["kind"]);

    return kind === undefined ? [] : [kind];
  }));
  const expectedHitRelationKinds = uniqueRelationKinds(relationSupport.flatMap((support) => {
    const sourceClaimId = optionalString(support["sourceClaimId"]);
    const kind = relationKindFromReadback(support["kind"]);

    return sourceClaimId !== undefined && expectedSourceClaimIds.has(sourceClaimId) && kind !== undefined
      ? [kind]
      : [];
  }));
  const relationDirections = uniqueRelationDirections(relationSupport.flatMap((support) => {
    const direction = relationDirectionFromReadback(support["direction"]);

    return direction === undefined ? [] : [direction];
  }));
  const expectedHitRelationDirections = uniqueRelationDirections(relationSupport.flatMap((support) => {
    const sourceClaimId = optionalString(support["sourceClaimId"]);
    const direction = relationDirectionFromReadback(support["direction"]);

    return sourceClaimId !== undefined && expectedSourceClaimIds.has(sourceClaimId) && direction !== undefined
      ? [direction]
      : [];
  }));
  const incomingStaleEdge = relationSupport.some((support) => {
    const sourceClaimId = optionalString(support["sourceClaimId"]);
    const kind = relationKindFromReadback(support["kind"]);
    const direction = relationDirectionFromReadback(support["direction"]);

    return sourceClaimId !== undefined &&
      expectedSourceClaimIds.has(sourceClaimId) &&
      (kind === "invalidates" || kind === "supersedes") &&
      direction === "incoming";
  });

  return {
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
    relationKinds,
    expectedHitRelationKinds,
    relationDirections,
    expectedHitRelationDirections,
    incomingStaleEdge,
    sourceDecisionSupport: recordArray(answerPackage["sourceDecisionSupport"], `${queryCase.id}.sourceDecisionSupport`).length,
    hitAtK: includedHitIds.slice(0, fixture.topK).some((id) => expectedHitIds.has(id)),
    ndcgAtK: roundRankingMetric(ndcgAtK(includedHitIds, expectedHitIds, fixture.topK))
  };
};

const flatWeakness = (
  linked: SourceGraphQueryRun,
  flat: SourceGraphQueryRun
): SourceGraphFlatComparison["weakness"] | undefined => {
  if (
    linked.expectedHitRelationSupport > 0 &&
    flat.expectedHitRelationSupport === 0
  ) {
    return "missing_expected_relation_support";
  }

  return undefined;
};

const evaluateQuery = async (
  fixture: SourceGraphRankingEvalFixture,
  queryCase: SourceGraphRankingQuery
): Promise<SourceGraphRankingEvalCaseResult> => {
  const linked = await runQueryPath(fixture, queryCase, { includeRelations: true });
  const flat = queryCase.relationLinkedExpected
    ? await runQueryPath(fixture, queryCase, { includeRelations: false })
    : undefined;
  const weakness = flat === undefined ? undefined : flatWeakness(linked, flat);
  const result = {
    id: queryCase.id,
    corpusSplit: queryCase.corpusSplit,
    query: queryCase.query,
    expectedHitIds: queryCase.expectedHitIds,
    baselineFailureRationale: queryCase.baselineFailureRationale,
    relationLinkedExpected: queryCase.relationLinkedExpected,
    expectedRelationKinds: queryCase.expectedRelationKinds,
    expectedRelationDirections: queryCase.expectedRelationDirections,
    ...linked
  };

  if (flat === undefined || weakness === undefined) {
    return result;
  }

  return {
    ...result,
    flatComparison: {
      includedHitIds: flat.includedHitIds,
      relationSupport: flat.relationSupport,
      expectedHitRelationSupport: flat.expectedHitRelationSupport,
      relationKinds: flat.relationKinds,
      expectedHitRelationKinds: flat.expectedHitRelationKinds,
      relationDirections: flat.relationDirections,
      expectedHitRelationDirections: flat.expectedHitRelationDirections,
      hitAtK: flat.hitAtK,
      ndcgAtK: flat.ndcgAtK,
      weakness
    }
  };
};

const averageRankingMetric = (
  cases: readonly SourceGraphRankingEvalCaseResult[],
  metric: "hitAtK" | "ndcgAtK"
): number => {
  if (cases.length === 0) {
    return 0;
  }

  const sum = cases.reduce((total, testCase) =>
    total + (metric === "hitAtK" ? Number(testCase.hitAtK) : testCase.ndcgAtK), 0
  );

  return roundRankingMetric(sum / cases.length);
};

export const runSourceGraphRankingEval = async (
  fixture: SourceGraphRankingEvalFixture
): Promise<SourceGraphRankingEvalResult> => {
  const cases = await Promise.all(fixture.queries.map((query) => evaluateQuery(fixture, query)));
  const hitRateAtK = cases.filter((testCase) => testCase.hitAtK).length / cases.length;
  const ndcgAtK = cases.reduce((sum, testCase) => sum + testCase.ndcgAtK, 0) / cases.length;
  const relationLinkedCases = cases.filter((testCase) => testCase.relationLinkedExpected);
  const flatBaselineWeakerCases = relationLinkedCases.filter((testCase) =>
    testCase.flatComparison !== undefined
  );
  const relationShapeCases = cases.filter((testCase) => testCase.expectedRelationKinds.length > 0);
  const relationShapeCoveredCases = relationShapeCases.filter((testCase) =>
    testCase.expectedRelationKinds.every((kind) => testCase.expectedHitRelationKinds.includes(kind))
  );
  const relationShapeKinds = uniqueRelationKinds(relationShapeCases.flatMap((testCase) =>
    testCase.expectedRelationKinds
  ));
  const heldOutCases = cases.filter((testCase) => testCase.corpusSplit === "held_out");
  const heldOutRelationShapeCases = heldOutCases.filter((testCase) => testCase.expectedRelationKinds.length > 0);
  const heldOutRelationShapeKinds = uniqueRelationKinds(heldOutRelationShapeCases.flatMap((testCase) =>
    testCase.expectedRelationKinds
  ));
  const relationDirectionCases = cases.filter((testCase) => testCase.expectedRelationDirections.length > 0);
  const heldOutRelationDirectionCases = heldOutCases.filter((testCase) =>
    testCase.expectedRelationDirections.length > 0
  );
  const relationDirectionCoveredCases = relationDirectionCases.filter((testCase) =>
    testCase.expectedRelationDirections.every((direction) =>
      testCase.expectedHitRelationDirections.includes(direction)
    )
  );
  const relationDirections = uniqueRelationDirections(relationDirectionCases.flatMap((testCase) =>
    testCase.expectedRelationDirections
  ));
  const observedRelationDirections = uniqueRelationDirections(relationDirectionCases.flatMap((testCase) =>
    testCase.expectedHitRelationDirections
  ));
  const heldOutRelationDirections = uniqueRelationDirections(heldOutCases.flatMap((testCase) =>
    testCase.expectedRelationDirections
  ));
  const heldOutObservedRelationDirections = uniqueRelationDirections(heldOutRelationDirectionCases.flatMap((testCase) =>
    testCase.expectedHitRelationDirections
  ));
  const staleEdgeReadbackCases = cases.filter((testCase) =>
    testCase.hitAtK && testCase.incomingStaleEdge
  ).length;
  const hasRequiredRelationShapeKinds = requiredRelationShapeKinds.every((kind) =>
    relationShapeKinds.includes(kind)
  );
  const hasRequiredRelationDirections = requiredRelationDirections.every((direction) =>
    relationDirections.includes(direction) &&
    observedRelationDirections.includes(direction) &&
    heldOutRelationDirections.includes(direction) &&
    heldOutObservedRelationDirections.includes(direction)
  );
  const hasHeldOutRelationCorpus = heldOutCases.length > 0 && heldOutRelationShapeKinds.length >= 2;
  const status =
    hitRateAtK >= fixture.minimumHitRateAtK &&
    ndcgAtK >= fixture.minimumNdcgAtK &&
    hasHeldOutRelationCorpus &&
    relationLinkedCases.length > 0 &&
    flatBaselineWeakerCases.length === relationLinkedCases.length &&
    relationShapeCoveredCases.length === relationShapeCases.length &&
    relationDirectionCoveredCases.length === relationDirectionCases.length &&
    relationDirectionCases.length >= requiredRelationDirections.length &&
    hasRequiredRelationDirections &&
    hasRequiredRelationShapeKinds
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
      heldOutQueryCount: heldOutCases.length,
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
      distractorClassCount: fixture.distractorClasses.length,
      relationLinkedCaseCount: relationLinkedCases.length,
      flatBaselineWeakerCases: flatBaselineWeakerCases.length,
      flatBaselineMissingExpectedRelationSupportCases: flatBaselineWeakerCases.filter((testCase) =>
        testCase.flatComparison?.weakness === "missing_expected_relation_support"
      ).length,
      relationShapeCaseCount: relationShapeCases.length,
      relationShapeCoveredCases: relationShapeCoveredCases.length,
      relationShapeKinds,
      heldOutQueryCount: heldOutCases.length,
      heldOutHitRateAtK: averageRankingMetric(heldOutCases, "hitAtK"),
      heldOutNdcgAtK: averageRankingMetric(heldOutCases, "ndcgAtK"),
      heldOutRelationShapeCaseCount: heldOutRelationShapeCases.length,
      heldOutRelationShapeKinds,
      relationDirectionCaseCount: relationDirectionCases.length,
      relationDirectionCoveredCases: relationDirectionCoveredCases.length,
      relationDirections,
      observedRelationDirections,
      heldOutRelationDirections,
      heldOutObservedRelationDirections,
      staleEdgeReadbackCases
    },
    cases,
    proof: {
      proves: [
        "source search selected expected proxy-labeled source graph rows for the fixture query set",
        "source graph ranking fixture reports corpus name, corpus size, distractor classes, and per-query baseline failure rationale",
        "relation-linked cases compare linked SourceClaimEdge readback against a flat no-relation path and require the flat path to be weaker in relation-support readback",
        `relation-shape cases report expected and observed SourceClaimEdge kinds for ${requiredRelationShapeKinds.join(", ")} readback`,
        "held-out relation corpus split reports held-out query count, hit-rate/NDCG, relation-shape kinds, and flat comparison",
        "relation-direction cases report expected and observed incoming/outgoing SourceClaimEdge directions for expected hits",
        "relation-shape coverage spans supports, duplicates, invalidates, supersedes, expires, and contradicts SourceClaimEdge kinds",
        "stale-edge cases surface incoming invalidating relation readback while the expected claim remains selectable in top-k",
        "SourceClaim, source-claim-to-SearchDocument link, SourceDecisionEdge, and SourceClaimEdge readbacks were exercised without DB writes",
        "future changes that drop expected source graph hits from top-k will fail this eval"
      ],
      doesNotProve: [
        "proxy labels are not production retrieval truth",
        "source truth",
        "broad semantic ranking quality",
        "live pgvector retrieval quality",
        "graph database need",
        "autonomous memory evolution",
        "API or MCP readiness",
        "crawler readiness",
        "product readiness",
        "stale-edge readback is not score-based rank demotion"
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
