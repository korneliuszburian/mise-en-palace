import { describe, expect, it } from "vitest";

import { DrizzleRetrievalRepository } from "./DrizzleRetrievalRepository.js";

const methodNames = [
  "createSearchDocument",
  "searchLexical",
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
});
