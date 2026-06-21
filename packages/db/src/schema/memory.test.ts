import { describe, expect, it } from "vitest";

import * as memorySchema from "./memory.js";

describe("memory governance schema", () => {
  it("exposes M23 review and promotion vocabulary", () => {
    expect(memorySchema.memoryCandidateStatus.enumValues).toEqual(
      expect.arrayContaining(["proposed", "accepted", "rejected", "superseded"])
    );
    expect(memorySchema.memoryRecordStatus.enumValues).toEqual(
      expect.arrayContaining(["active", "deprecated", "invalidated"])
    );
    expect("memoryApplicationOutcome" in memorySchema).toBe(true);
    expect("memoryFeedbackEventType" in memorySchema).toBe(true);
  });

  it("exposes M23 memory candidate lineage and review fields", () => {
    expect("executionRunId" in memorySchema.memoryCandidates).toBe(true);
    expect("feedbackDeltaId" in memorySchema.memoryCandidates).toBe(true);
    expect("sourceClaimIds" in memorySchema.memoryCandidates).toBe(true);
    expect("invalidationRule" in memorySchema.memoryCandidates).toBe(true);
    expect("validFrom" in memorySchema.memoryCandidates).toBe(true);
    expect("validUntil" in memorySchema.memoryCandidates).toBe(true);
    expect("reviewer" in memorySchema.memoryCandidates).toBe(true);
    expect("reviewedAt" in memorySchema.memoryCandidates).toBe(true);
  });

  it("exposes M23 memory record versioning and application fields", () => {
    expect("currentVersionId" in memorySchema.memoryRecords).toBe(true);
    expect("createdFromCandidateId" in memorySchema.memoryRecordVersions).toBe(true);
    expect("invalidationRule" in memorySchema.memoryRecordVersions).toBe(true);
    expect("validFrom" in memorySchema.memoryRecordVersions).toBe(true);
    expect("validUntil" in memorySchema.memoryRecordVersions).toBe(true);
    expect("executionRunId" in memorySchema.memoryApplications).toBe(true);
    expect("notes" in memorySchema.memoryApplications).toBe(true);
  });

  it("exposes M23 memory feedback and anti-memory fields", () => {
    expect("executionRunId" in memorySchema.memoryFeedbackEvents).toBe(true);
    expect("eventType" in memorySchema.memoryFeedbackEvents).toBe(true);
    expect("reason" in memorySchema.memoryFeedbackEvents).toBe(true);
    expect("evidenceRef" in memorySchema.memoryFeedbackEvents).toBe(true);
    expect("executionRunId" in memorySchema.antiMemoryRecords).toBe(true);
    expect("rejectedClaim" in memorySchema.antiMemoryRecords).toBe(true);
    expect("reason" in memorySchema.antiMemoryRecords).toBe(true);
    expect("invalidatedBySourceClaimIds" in memorySchema.antiMemoryRecords).toBe(true);
    expect("appliesTo" in memorySchema.antiMemoryRecords).toBe(true);
    expect("mayRevisitWhen" in memorySchema.antiMemoryRecords).toBe(true);
  });
});
