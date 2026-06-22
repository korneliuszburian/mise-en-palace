import { describe, expect, it } from "vitest";

import * as retrievalSchema from "./retrieval.js";

describe("retrieval substrate schema", () => {
  it("exposes M24 retrieval source vocabulary", () => {
    expect(retrievalSchema.retrievalSubjectType.enumValues).toEqual(
      expect.arrayContaining([
        "source_claim",
        "memory_record",
        "evidence_bundle",
        "review_assessment",
        "architecture_decision",
        "run_event"
      ])
    );
    expect("retrievalRunMode" in retrievalSchema).toBe(true);
    expect(retrievalSchema.retrievalRunMode.enumValues).toEqual(
      expect.arrayContaining(["lexical", "vector", "hybrid", "graph", "mixed"])
    );
  });

  it("exposes M24 search document and embedding linkage", () => {
    expect("searchText" in retrievalSchema.searchDocuments).toBe(true);
    expect("evidenceBundleId" in retrievalSchema.searchDocuments).toBe(true);
    expect("reviewAssessmentId" in retrievalSchema.searchDocuments).toBe(true);
    expect("sourceDecisionId" in retrievalSchema.searchDocuments).toBe(true);
    expect("runEventId" in retrievalSchema.searchDocuments).toBe(true);
    expect("searchDocumentId" in retrievalSchema.embeddings).toBe(true);
  });

  it("exposes M24 retrieval run, candidate, and activation fields", () => {
    expect("executionRunId" in retrievalSchema.retrievalRuns).toBe(true);
    expect("mode" in retrievalSchema.retrievalRuns).toBe(true);
    expect("budget" in retrievalSchema.retrievalRuns).toBe(true);
    expect("createdAt" in retrievalSchema.retrievalRuns).toBe(true);
    expect("searchDocumentId" in retrievalSchema.retrievalCandidates).toBe(true);
    expect("score" in retrievalSchema.retrievalCandidates).toBe(true);
    expect("retrievalCandidateId" in retrievalSchema.activationDecisions).toBe(true);
    expect("contextBudgetCost" in retrievalSchema.activationDecisions).toBe(true);
    expect("expectedDecisionImpact" in retrievalSchema.activationDecisions).toBe(true);
  });

  it("exposes M24 activation decision vocabulary", () => {
    expect(retrievalSchema.activationDecisionStatus.enumValues).toEqual(
      expect.arrayContaining(["included", "excluded", "deferred", "conflict", "stale"])
    );
  });
});
