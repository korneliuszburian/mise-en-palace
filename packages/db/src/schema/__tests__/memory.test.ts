import { describe, expect, it } from "vitest";

import {
  memoryApplicationOutcomes,
  memoryCandidateStatuses,
  memoryFeedbackDirections,
  memoryFeedbackEventTypes,
  memoryRecordKinds,
  memoryRecordStatuses
} from "@krn/core";

import * as memorySchema from "../memory.js";

describe("memory governance schema", () => {
  it("keeps DB memory enums aligned with the core memory model", () => {
    expect(memorySchema.memoryRecordKind.enumValues).toEqual(memoryRecordKinds);
    expect(memorySchema.memoryRecordStatus.enumValues).toEqual(memoryRecordStatuses);
    expect(memorySchema.memoryCandidateStatus.enumValues).toEqual(memoryCandidateStatuses);
    expect(memorySchema.memoryFeedbackDirection.enumValues).toEqual(memoryFeedbackDirections);
    expect(memorySchema.memoryApplicationOutcome.enumValues).toEqual(memoryApplicationOutcomes);
    expect(memorySchema.memoryFeedbackEventType.enumValues).toEqual(memoryFeedbackEventTypes);
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

  it("exposes reviewed anti-memory candidate storage fields", () => {
    expect("executionRunId" in memorySchema.antiMemoryCandidates).toBe(true);
    expect("feedbackDeltaId" in memorySchema.antiMemoryCandidates).toBe(true);
    expect("proposedBy" in memorySchema.antiMemoryCandidates).toBe(true);
    expect("maintenanceIdentity" in memorySchema.antiMemoryCandidates).toBe(true);
    expect("status" in memorySchema.antiMemoryCandidates).toBe(true);
    expect("reviewer" in memorySchema.antiMemoryCandidates).toBe(true);
    expect("reviewedAt" in memorySchema.antiMemoryCandidates).toBe(true);
    expect("rejectionReason" in memorySchema.antiMemoryCandidates).toBe(true);
    expect("createdFromCandidateId" in memorySchema.antiMemoryRecords).toBe(true);
  });

  it("keeps required memory source lineage explicit at insert time", () => {
    expect(memorySchema.memoryRecords.sourceLineage.hasDefault).toBe(false);
    expect(memorySchema.memoryRecordVersions.sourceLineage.hasDefault).toBe(false);
    expect(memorySchema.memoryCandidates.sourceLineage.hasDefault).toBe(false);

    expect(memorySchema.memoryCandidates.sourceClaimIds.hasDefault).toBe(true);
    expect(memorySchema.antiMemoryRecords.sourceLineage.hasDefault).toBe(true);
    expect(memorySchema.antiMemoryRecords.invalidatedBySourceClaimIds.hasDefault).toBe(true);
  });
});
