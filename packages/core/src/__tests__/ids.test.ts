import { describe, expect, test } from "vitest";

import type {
  ActivationDecisionId,
  EmbeddingId,
  EmbeddingModelId,
  ExecutionRunId,
  MemoryRecordId,
  RetrievalCandidateId,
  RetrievalRunId,
  SearchDocumentId,
  SourceClaimId
} from "../ids.js";

describe("branded KRN ids", () => {
  test("remain runtime strings", () => {
    const executionRunId: ExecutionRunId = "execution-run-1";
    const memoryRecordId: MemoryRecordId = "memory-record-1";
    const searchDocumentId: SearchDocumentId = "search-document-1";
    const embeddingModelId: EmbeddingModelId = "embedding-model-1";
    const embeddingId: EmbeddingId = "embedding-1";
    const retrievalRunId: RetrievalRunId = "retrieval-run-1";
    const retrievalCandidateId: RetrievalCandidateId = "retrieval-candidate-1";
    const activationDecisionId: ActivationDecisionId = "activation-decision-1";
    const sourceClaimId: SourceClaimId = "source-claim-1";

    expect(executionRunId).toBe("execution-run-1");
    expect(memoryRecordId).toBe("memory-record-1");
    expect(searchDocumentId).toBe("search-document-1");
    expect(embeddingModelId).toBe("embedding-model-1");
    expect(embeddingId).toBe("embedding-1");
    expect(retrievalRunId).toBe("retrieval-run-1");
    expect(retrievalCandidateId).toBe("retrieval-candidate-1");
    expect(activationDecisionId).toBe("activation-decision-1");
    expect(sourceClaimId).toBe("source-claim-1");
  });
});
