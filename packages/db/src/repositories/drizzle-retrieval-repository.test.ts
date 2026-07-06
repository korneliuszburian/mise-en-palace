import { describe, expect, it } from "vitest";

import { DrizzleRetrievalRepository } from "./drizzle-retrieval-repository.js";
import { DEFAULT_EMBEDDING_DIMENSIONS } from "../sql/pgvector.js";

const createdAt = new Date("2026-07-04T00:00:00.000Z");

const searchDocumentRow = {
  id: "search-document-1",
  projectId: "project-1",
  subjectType: "search_document",
  subjectId: "search-document-1",
  sourceArtifactId: null,
  sourceChunkId: null,
  sourceClaimId: null,
  memoryRecordId: null,
  antiMemoryRecordId: null,
  evidenceBundleId: null,
  reviewAssessmentId: null,
  sourceDecisionId: null,
  runEventId: null,
  trustTier: "project-decision",
  validityStatus: "active",
  language: "english",
  title: "Vector retrieval provenance",
  body: "Vector retrieval must expose embedding model provenance.",
  searchText: "Vector retrieval provenance",
  searchVector: null,
  metadataFilters: {},
  validFrom: createdAt,
  validUntil: null,
  invalidatedAt: null,
  metadata: {},
  createdAt,
  updatedAt: createdAt
} as const;

const embeddingModelRow = {
  id: "embedding-model-1",
  provider: "local-smoke",
  model: "smoke-1536",
  dimensions: DEFAULT_EMBEDDING_DIMENSIONS,
  distanceMetric: "cosine",
  status: "active",
  metadata: {},
  createdAt,
  updatedAt: createdAt
} as const;

const createSearchDb = (input: {
  lexicalRows?: readonly unknown[];
  vectorRows?: readonly unknown[];
  onVectorWhere?: (condition: unknown) => void;
}) => ({
  select: () => ({
    from: () => ({
      where: () => ({
        orderBy: () => ({
          limit: () => Promise.resolve(input.lexicalRows ?? [])
        })
      }),
      innerJoin: () => ({
        innerJoin: () => ({
          where: (condition: unknown) => {
            input.onVectorWhere?.(condition);
            return {
              orderBy: () => ({
                limit: () => Promise.resolve(input.vectorRows ?? [])
              })
            };
          }
        })
      })
    })
  })
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sqlParamValues = (
  value: unknown,
  seen: WeakSet<object> = new WeakSet()
): readonly unknown[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => sqlParamValues(item, seen));
  }

  if (!isRecord(value)) {
    return [];
  }

  if (seen.has(value)) {
    return [];
  }
  seen.add(value);

  if ("encoder" in value && "value" in value) {
    return [value["value"]];
  }

  const queryChunks = value["queryChunks"];
  if (Array.isArray(queryChunks)) {
    return queryChunks.flatMap((item) => sqlParamValues(item, seen));
  }

  return [];
};

const methodNames = [
  "createSearchDocument",
  "searchLexical",
  "searchVector",
  "searchHybrid",
  "listSearchDocumentsForSourceLinks",
  "createEmbeddingModel",
  "createEmbedding",
  "createRetrievalRun",
  "createRetrievalCandidate",
  "createActivationDecision",
  "listCandidatesForRetrievalRun",
  "listActivationDecisionsForRun",
  "cleanupTestRetrievalRecords"
] as const;

describe("DrizzleRetrievalRepository", () => {
  it("exposes M24 retrieval substrate repository methods", () => {
    for (const methodName of methodNames) {
      expect(typeof DrizzleRetrievalRepository.prototype[methodName]).toBe("function");
    }
  });

  it("rejects invalid vector search embeddings before SQL construction", async () => {
    const repository = new DrizzleRetrievalRepository({} as never);

    await expect(repository.searchVector({
      embeddingModelId: "embedding-model-1",
      embedding: [Number.NaN],
      limit: 1
    })).rejects.toThrow("searchVector embedding must contain 1536 finite numbers");
  });

  it("requires vector search to name an embedding model scope", async () => {
    const repository = new DrizzleRetrievalRepository({} as never);

    await expect(repository.searchVector({
      embedding: Array.from({ length: DEFAULT_EMBEDDING_DIMENSIONS }, () => 0),
      limit: 1
    } as never)).rejects.toThrow(
      "searchVector embeddingModelId is required to avoid mixed-model vector comparison"
    );
  });

  it("requires hybrid search to name an embedding model scope", async () => {
    const repository = new DrizzleRetrievalRepository({} as never);

    await expect(repository.searchHybrid({
      query: "source graph",
      embedding: Array.from({ length: DEFAULT_EMBEDDING_DIMENSIONS }, () => 0),
      limit: 1
    } as never)).rejects.toThrow(
      "searchHybrid embeddingModelId is required to avoid mixed-model vector comparison"
    );
  });

  it("accepts finite embeddings with the configured pgvector dimensions", async () => {
    const repository = new DrizzleRetrievalRepository(createSearchDb({ vectorRows: [] }) as never);

    await expect(repository.searchVector({
      embeddingModelId: "embedding-model-1",
      embedding: Array.from({ length: DEFAULT_EMBEDDING_DIMENSIONS }, () => 0),
      limit: 1
    })).resolves.toEqual([]);
  });

  it("scopes vector search SQL to the requested embedding model", async () => {
    let vectorWhere: unknown;
    const repository = new DrizzleRetrievalRepository(createSearchDb({
      vectorRows: [],
      onVectorWhere(condition) {
        vectorWhere = condition;
      }
    }) as never);

    await repository.searchVector({
      embeddingModelId: "embedding-model-1",
      embedding: Array.from({ length: DEFAULT_EMBEDDING_DIMENSIONS }, () => 0),
      limit: 1
    });

    expect(sqlParamValues(vectorWhere)).toContain("embedding-model-1");
  });

  it("exposes embedding model provenance for vector and hybrid results but not lexical-only results", async () => {
    const repository = new DrizzleRetrievalRepository(createSearchDb({
      lexicalRows: [{
        document: searchDocumentRow,
        lexicalScore: 120
      }],
      vectorRows: [{
        document: searchDocumentRow,
        embeddingModel: embeddingModelRow,
        vectorScore: 980
      }]
    }) as never);

    await expect(repository.searchLexical({
      query: "vector retrieval provenance",
      limit: 1
    })).resolves.toMatchObject([{
      id: "search-document-1",
      lexicalScore: 120
    }]);

    const lexicalResults = await repository.searchLexical({
      query: "vector retrieval provenance",
      limit: 1
    });
    expect(lexicalResults[0]?.embeddingModel).toBeUndefined();

    await expect(repository.searchVector({
      embeddingModelId: "embedding-model-1",
      embedding: Array.from({ length: DEFAULT_EMBEDDING_DIMENSIONS }, () => 0),
      limit: 1
    })).resolves.toMatchObject([{
      id: "search-document-1",
      vectorScore: 980,
      embeddingModel: {
        embeddingModelId: "embedding-model-1",
        provider: "local-smoke",
        model: "smoke-1536",
        dimensions: DEFAULT_EMBEDDING_DIMENSIONS
      }
    }]);

    await expect(repository.searchHybrid({
      query: "vector retrieval provenance",
      embeddingModelId: "embedding-model-1",
      embedding: Array.from({ length: DEFAULT_EMBEDDING_DIMENSIONS }, () => 0),
      limit: 1
    })).resolves.toMatchObject([{
      id: "search-document-1",
      lexicalScore: 120,
      vectorScore: 980,
      embeddingModel: {
        embeddingModelId: "embedding-model-1",
        provider: "local-smoke",
        model: "smoke-1536",
        dimensions: DEFAULT_EMBEDDING_DIMENSIONS
      }
    }]);
  });
});
