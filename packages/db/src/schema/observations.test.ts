import { describe, expect, it } from "vitest";

import * as observationSchema from "./observations.js";

describe("observation schema", () => {
  it("exposes observation vocabulary enums", () => {
    expect(observationSchema.observationKind.enumValues).toEqual(expect.arrayContaining([
      "fact",
      "decision",
      "correction",
      "risk",
      "procedure",
      "conflict",
      "slang",
      "gap",
      "preference",
      "operator_note"
    ]));
    expect(observationSchema.observationStatus.enumValues).toContain("observed");
    expect(observationSchema.observationProvenanceKind.enumValues).toContain("run_event");
    expect(observationSchema.observationSourceRangeType.enumValues).toContain("evidence_bundle");
  });

  it("exposes observation group and item stable query fields", () => {
    expect("projectId" in observationSchema.observationGroups).toBe(true);
    expect("executionRunId" in observationSchema.observationGroups).toBe(true);
    expect("scope" in observationSchema.observationGroups).toBe(true);

    expect("groupId" in observationSchema.observationItems).toBe(true);
    expect("projectId" in observationSchema.observationItems).toBe(true);
    expect("executionRunId" in observationSchema.observationItems).toBe(true);
    expect("kind" in observationSchema.observationItems).toBe(true);
    expect("status" in observationSchema.observationItems).toBe(true);
    expect("priority" in observationSchema.observationItems).toBe(true);
    expect("confidence" in observationSchema.observationItems).toBe(true);
    expect("provenanceKind" in observationSchema.observationItems).toBe(true);
  });

  it("exposes temporal columns on observation items", () => {
    expect("observedAt" in observationSchema.observationItems).toBe(true);
    expect("eventTime" in observationSchema.observationItems).toBe(true);
    expect("ingestedAt" in observationSchema.observationItems).toBe(true);
    expect("referencedAt" in observationSchema.observationItems).toBe(true);
    expect("relativeTimeBase" in observationSchema.observationItems).toBe(true);
    expect("validFrom" in observationSchema.observationItems).toBe(true);
    expect("validUntil" in observationSchema.observationItems).toBe(true);
  });

  it("exposes source ranges and typed edge tables", () => {
    expect("observationItemId" in observationSchema.observationSourceRanges).toBe(true);
    expect("sourceType" in observationSchema.observationSourceRanges).toBe(true);
    expect("sourceId" in observationSchema.observationSourceRanges).toBe(true);
    expect("evidenceBundleId" in observationSchema.observationSourceRanges).toBe(true);
    expect("sourceChunkId" in observationSchema.observationSourceRanges).toBe(true);
    expect("runEventId" in observationSchema.observationSourceRanges).toBe(true);

    expect("observationItemId" in observationSchema.observationEntityEdges).toBe(true);
    expect("entityKind" in observationSchema.observationEntityEdges).toBe(true);
    expect("entityId" in observationSchema.observationEntityEdges).toBe(true);
    expect("relation" in observationSchema.observationEntityEdges).toBe(true);

    expect("observationItemId" in observationSchema.observationClaimEdges).toBe(true);
    expect("sourceClaimId" in observationSchema.observationClaimEdges).toBe(true);
    expect("relation" in observationSchema.observationClaimEdges).toBe(true);
  });

  it("exposes observation feedback event table", () => {
    expect("observationItemId" in observationSchema.observationFeedbackEvents).toBe(true);
    expect("projectId" in observationSchema.observationFeedbackEvents).toBe(true);
    expect("eventType" in observationSchema.observationFeedbackEvents).toBe(true);
    expect("usefulness" in observationSchema.observationFeedbackEvents).toBe(true);
  });
});
