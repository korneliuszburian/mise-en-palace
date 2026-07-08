import { describe, expect, it } from "vitest";

import {
  contextExclusionReasons,
  embeddingModelStatuses,
  retrievalActivationDecisionStatuses,
  retrievalCandidateKinds,
  retrievalCandidateStatuses,
  retrievalRunModes,
  retrievalRunStatuses,
  retrievalSubjectTypes,
  retrievalValidityStatuses
} from "@krn/core";

import * as retrievalSchema from "../retrieval.js";

describe("retrieval substrate schema", () => {
  it("keeps DB retrieval enums aligned with the core retrieval model", () => {
    expect(retrievalSchema.embeddingModelStatus.enumValues).toEqual(embeddingModelStatuses);
    expect(retrievalSchema.retrievalSubjectType.enumValues).toEqual(retrievalSubjectTypes);
    expect(retrievalSchema.retrievalValidityStatus.enumValues).toEqual(retrievalValidityStatuses);
    expect(retrievalSchema.retrievalRunStatus.enumValues).toEqual(retrievalRunStatuses);
    expect(retrievalSchema.retrievalRunMode.enumValues).toEqual(retrievalRunModes);
    expect(retrievalSchema.retrievalCandidateKind.enumValues).toEqual(retrievalCandidateKinds);
    expect(retrievalSchema.retrievalCandidateStatus.enumValues).toEqual(retrievalCandidateStatuses);
    expect(retrievalSchema.activationDecisionStatus.enumValues).toEqual(
      retrievalActivationDecisionStatuses
    );
    expect(retrievalSchema.contextExclusionReason.enumValues).toEqual(contextExclusionReasons);
  });

  it("exposes M24 search document and embedding linkage", () => {
    expect("searchText" in retrievalSchema.searchDocuments).toBe(true);
    expect("evidenceBundleId" in retrievalSchema.searchDocuments).toBe(true);
    expect("reviewAssessmentId" in retrievalSchema.searchDocuments).toBe(true);
    expect("sourceDecisionId" in retrievalSchema.searchDocuments).toBe(true);
    expect("runEventId" in retrievalSchema.searchDocuments).toBe(true);
    expect("searchDocumentId" in retrievalSchema.embeddings).toBe(true);
  });

  it("exposes retrieval run, candidate, and activation fields", () => {
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
});
