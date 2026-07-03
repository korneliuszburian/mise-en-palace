import { describe, expect, it } from "vitest";

import { DrizzleRetrievalRepository } from "./DrizzleRetrievalRepository.js";
import { DEFAULT_EMBEDDING_DIMENSIONS } from "../sql/pgvector.js";

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
    const rows: unknown[] = [];
    const db = {
      select: () => ({
        from: () => ({
          innerJoin: () => ({
            where: () => ({
              orderBy: () => ({
                limit: () => Promise.resolve(rows)
              })
            })
          })
        })
      })
    };
    const repository = new DrizzleRetrievalRepository(db as never);

    await expect(repository.searchVector({
      embeddingModelId: "embedding-model-1",
      embedding: Array.from({ length: DEFAULT_EMBEDDING_DIMENSIONS }, () => 0),
      limit: 1
    })).resolves.toEqual([]);
  });
});
