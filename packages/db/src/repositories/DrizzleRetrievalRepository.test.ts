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
      embedding: [Number.NaN],
      limit: 1
    })).rejects.toThrow("searchVector embedding must contain 1536 finite numbers");
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
      embedding: Array.from({ length: DEFAULT_EMBEDDING_DIMENSIONS }, () => 0),
      limit: 1
    })).resolves.toEqual([]);
  });
});
