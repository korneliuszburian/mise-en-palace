import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";

import { DrizzleRetrievalRepository } from "../drizzle-retrieval-repository.js";
import { DEFAULT_EMBEDDING_DIMENSIONS } from "../../sql/pgvector.js";
import {
  cleanupActivationSmokeRows,
  countActivationSmokeMarkerRows,
  createSmokeHarnessScaffold
} from "../../dev/smoke/db-smoke-support.js";
import { projects, searchDocuments } from "../../schema/index.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const postgresIt = it.skipIf(databaseUrl === undefined || databaseUrl.length === 0);
const migrationsFolder = fileURLToPath(new URL("../../migrations", import.meta.url));

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
  sourceAuthority: "project-decision",
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
  onLexicalSelect?: (fields: unknown) => void;
  onVectorWhere?: (condition: unknown) => void;
  onVectorOrderBy?: (orderBy: unknown) => void;
}) => ({
  select: (fields: unknown) => {
    input.onLexicalSelect?.(fields);

    return {
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
                orderBy: (orderBy: unknown) => {
                  input.onVectorOrderBy?.(orderBy);
                  return {
                    limit: () => Promise.resolve(input.vectorRows ?? [])
                  };
                }
              };
            }
          })
        })
      })
    };
  }
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

const sqlDebugText = (
  value: unknown,
  seen: WeakSet<object> = new WeakSet()
): string => {
  if (Array.isArray(value)) {
    return value.map((item) => sqlDebugText(item, seen)).join("");
  }

  if (!isRecord(value)) {
    return typeof value === "string" ? value : "";
  }

  if (seen.has(value)) {
    return "";
  }
  seen.add(value);

  const queryChunks = value["queryChunks"];

  if (Array.isArray(queryChunks)) {
    return queryChunks.map((item) => sqlDebugText(item, seen)).join("");
  }

  const chunkValue = value["value"];

  if (Array.isArray(chunkValue)) {
    return chunkValue.map((item) => sqlDebugText(item, seen)).join("");
  }

  if (typeof value["columnType"] === "string" && typeof value["name"] === "string") {
    return value["name"];
  }

  return "";
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
  postgresIt("excludes temporally ineligible SearchDocuments from lexical and vector search", async () => {
    const marker = `krn_search_temporal_${crypto.randomUUID().replaceAll("-", "")}`;
    const scaffold = await createSmokeHarnessScaffold({
      databaseUrl: databaseUrl!,
      migrationsFolder,
      smokeId: marker,
      smokeName: "search document temporal eligibility",
      workspacePrefix: "krn-search-temporal",
      projectSlug: "search-temporal",
      cleanupRows: cleanupActivationSmokeRows,
      countMarkerRows: countActivationSmokeMarkerRows,
      rawIntent: `search document temporal eligibility ${marker}`,
      taskContract: {
        title: "Exclude stale search projections",
        objective: "Keep current canonical memory free from stale projection boosts.",
        constraints: ["lexical and vector parity"],
        nonGoals: ["invalidate the canonical memory"],
        acceptance: ["only the current projection is searchable"]
      },
      harnessPlan: {
        summary: "Search projection temporal eligibility",
        nextAction: "Query current, future, expired, and invalidated projections."
      }
    });

    try {
      const selectionNow = "2026-07-15T00:00:00.000Z";
      const memory = await scaffold.memoryRepository.createMemoryRecord({
        projectId: scaffold.project.id,
        key: `memory:search-temporal:${marker}`,
        kind: "constraint",
        status: "active",
        summary: "Current canonical memory",
        body: "Canonical memory stays current while projections expire.",
        owner: "kernel",
        confidence: 90,
        applicationGuidance: "Use for search projection temporal tests.",
        invalidationRule: "Remove after the repository test.",
        sourceLineage: [{ sourceId: `source:${marker}` }],
        isUserPreference: false,
        validFrom: "2026-01-01T00:00:00.000Z",
        metadata: { smokeId: marker }
      });
      const createDocument = (
        suffix: string,
        validity: { validFrom: string; validUntil?: string },
        repetitions: number,
        projectId = scaffold.project.id
      ) => scaffold.retrievalRepository.createSearchDocument({
        projectId,
        subjectType: "memory_record",
        subjectId: memory.id,
        memoryRecordId: memory.id,
        title: `Search temporal ${suffix}`,
        body: "Projection lifecycle must not change canonical memory freshness.",
        searchText: Array.from({ length: repetitions }, () => "expired projection boost").join(" "),
        sourceAuthority: "project-decision",
        validFrom: validity.validFrom,
        ...(validity.validUntil === undefined ? {} : { validUntil: validity.validUntil }),
        metadata: { smokeId: marker, temporalCase: suffix }
      });
      const current = await createDocument(
        "current",
        { validFrom: selectionNow },
        1
      );
      const beforeValid = await createDocument(
        "before-valid",
        { validFrom: "2099-01-01T00:00:00.000Z" },
        2
      );
      const expired = await createDocument(
        "expired",
        {
          validFrom: "2026-01-01T00:00:00.000Z",
          validUntil: selectionNow
        },
        4
      );
      const invalidated = await createDocument(
        "invalidated",
        { validFrom: "2026-01-01T00:00:00.000Z" },
        3
      );
      await scaffold.db
        .update(searchDocuments)
        .set({ invalidatedAt: new Date(selectionNow) })
        .where(eq(searchDocuments.id, invalidated.id));
      const [foreignProject] = await scaffold.db
        .insert(projects)
        .values({
          workspaceId: scaffold.project.workspaceId,
          slug: `search-temporal-foreign-${marker}`,
          displayName: `search-temporal-foreign-${marker}`,
          metadata: { smokeId: marker }
        })
        .returning({ id: projects.id });
      if (foreignProject === undefined) {
        throw new Error("Search temporal test could not create its foreign project");
      }
      const foreign = await createDocument(
        "foreign-current",
        { validFrom: selectionNow },
        5,
        foreignProject.id
      );

      const embeddingModel = await scaffold.retrievalRepository.createEmbeddingModel({
        provider: "local-test",
        model: `search-temporal-${marker}`,
        dimensions: DEFAULT_EMBEDDING_DIMENSIONS,
        distanceMetric: "cosine",
        metadata: { smokeId: marker }
      });
      const unitVector = (position: number) => Array.from(
        { length: DEFAULT_EMBEDDING_DIMENSIONS },
        (_, index) => index === position ? 1 : 0
      );
      for (const [index, document] of [expired, current, beforeValid, invalidated, foreign].entries()) {
        await scaffold.retrievalRepository.createEmbedding({
          projectId: document.id === foreign.id ? foreignProject.id : scaffold.project.id,
          embeddingModelId: embeddingModel.id,
          subjectType: "search_document",
          subjectId: document.id,
          searchDocumentId: document.id,
          embedding: unitVector(index),
          contentHash: `search-temporal:${marker}:${index}`,
          sourceAuthority: "project-decision",
          metadata: { smokeId: marker }
        });
      }

      const lexical = await scaffold.retrievalRepository.searchLexical({
        projectId: scaffold.project.id,
        query: "expired projection boost",
        now: selectionNow,
        limit: 10
      });
      const vector = await scaffold.retrievalRepository.searchVector({
        projectId: scaffold.project.id,
        embeddingModelId: embeddingModel.id,
        embedding: unitVector(0),
        now: selectionNow,
        limit: 10
      });
      const caseIds = {
        current: current.id,
        beforeValid: beforeValid.id,
        expired: expired.id,
        invalidated: invalidated.id,
        foreign: foreign.id
      };

      expect.soft(
        lexical.map(({ id }) => id),
        JSON.stringify({ caseIds, results: lexical.map(({ id, lexicalScore }) => ({ id, lexicalScore })) })
      ).toEqual([current.id]);
      expect.soft(
        vector.map(({ id }) => id),
        JSON.stringify({ caseIds, results: vector.map(({ id, vectorScore }) => ({ id, vectorScore })) })
      ).toEqual([current.id]);
    } finally {
      await scaffold.cleanup();
      await scaffold.client.end();
    }
  });

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

  it("fails closed for a non-ISO search selection time", async () => {
    const repository = new DrizzleRetrievalRepository(createSearchDb({
      lexicalRows: [{ document: searchDocumentRow, lexicalScore: 100 }],
      vectorRows: [{
        document: searchDocumentRow,
        embeddingModel: embeddingModelRow,
        vectorScore: 100
      }]
    }) as never);
    const embedding = Array.from({ length: DEFAULT_EMBEDDING_DIMENSIONS }, () => 0);

    await expect(repository.searchLexical({
      query: "vector retrieval provenance",
      now: "July 15, 2026",
      limit: 1
    })).resolves.toEqual([]);
    await expect(repository.searchVector({
      embeddingModelId: "embedding-model-1",
      embedding,
      now: "July 15, 2026",
      limit: 1
    })).resolves.toEqual([]);
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

  it("orders vector search by raw cosine distance for pgvector index eligibility", async () => {
    let vectorOrderBy: unknown;
    const repository = new DrizzleRetrievalRepository(createSearchDb({
      vectorRows: [],
      onVectorOrderBy(orderBy) {
        vectorOrderBy = orderBy;
      }
    }) as never);

    await repository.searchVector({
      embeddingModelId: "embedding-model-1",
      embedding: Array.from({ length: DEFAULT_EMBEDDING_DIMENSIONS }, () => 0),
      limit: 1
    });

    const renderedSql = sqlDebugText(vectorOrderBy);

    expect(renderedSql).toContain("<=>");
    expect(renderedSql).not.toContain("floor(");
  });

  it("uses each search document language for lexical query parsing", async () => {
    let lexicalSelect: unknown;
    const repository = new DrizzleRetrievalRepository(createSearchDb({
      lexicalRows: [],
      onLexicalSelect(fields) {
        lexicalSelect = fields;
      }
    }) as never);

    await repository.searchLexical({
      query: "zażółć gęślą jaźń",
      limit: 1
    });

    const renderedSql = sqlDebugText(
      isRecord(lexicalSelect) ? lexicalSelect["lexicalScore"] : undefined
    );

    expect(renderedSql).toContain("websearch_to_tsquery(");
    expect(renderedSql).toContain("language::regconfig");
    expect(renderedSql).not.toContain("'english'");
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
