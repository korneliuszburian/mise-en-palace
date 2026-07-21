import { describe, expect, it } from "vitest";

import {
  assertObservationItemEvidenceLinkage,
  DrizzleObservationRepository,
  isEvidenceLinkedObservationSourceRangeInput
} from "../drizzle-observation-repository.js";

describe("DrizzleObservationRepository", () => {
  it("requires project scope for scoped observation reads", async () => {
    const repository = new DrizzleObservationRepository({} as never);

    await expect(repository.findByScope({})).rejects.toThrow(
      "findByScope requires projectId"
    );
  });

  it("recognizes source ranges with typed evidence links", () => {
    expect(
      isEvidenceLinkedObservationSourceRangeInput({
        sourceType: "run_event",
        sourceId: "run-event-1",
        runEventId: "run-event-1",
        locator: "payload.summary",
        capturedAt: "2026-06-22T12:00:00.000Z"
      })
    ).toBe(true);

    expect(
      isEvidenceLinkedObservationSourceRangeInput({
        sourceType: "run_event",
        sourceId: "run-event-1",
        locator: "payload.summary",
        capturedAt: "2026-06-22T12:00:00.000Z"
      })
    ).toBe(false);

    expect(
      isEvidenceLinkedObservationSourceRangeInput({
        sourceType: "run_event",
        sourceId: "run-event-1",
        evidenceBundleId: "evidence-bundle-1",
        locator: "payload.summary",
        capturedAt: "2026-06-22T12:00:00.000Z"
      })
    ).toBe(false);
  });

  it("blocks factual observations without evidence-linked source ranges", () => {
    expect(() =>
      assertObservationItemEvidenceLinkage({
        kind: "fact",
        provenanceKind: "run_event",
        sourceRanges: [{
          sourceType: "run_event",
          sourceId: "run-event-1",
          locator: "payload.summary",
          capturedAt: "2026-06-22T12:00:00.000Z"
        }]
      })
    ).toThrow("Truth-bearing observation requires an evidence-linked source range");
  });

  it("requires source type to match exactly one typed evidence link", () => {
    expect(() =>
      assertObservationItemEvidenceLinkage({
        kind: "fact",
        provenanceKind: "run_event",
        sourceRanges: [{
          sourceType: "run_event",
          sourceId: "run-event-1",
          evidenceBundleId: "evidence-bundle-1",
          locator: "payload.summary",
          capturedAt: "2026-06-22T12:00:00.000Z"
        }]
      })
    ).toThrow("Observation source range run_event requires runEventId");

    expect(() =>
      assertObservationItemEvidenceLinkage({
        kind: "fact",
        provenanceKind: "run_event",
        sourceRanges: [{
          sourceType: "run_event",
          sourceId: "run-event-1",
          runEventId: "run-event-1",
          evidenceBundleId: "evidence-bundle-1",
          locator: "payload.summary",
          capturedAt: "2026-06-22T12:00:00.000Z"
        }]
      })
    ).toThrow("Observation source range must contain exactly one typed evidence link");
  });

  it("requires typed evidence links for truth-bearing observation kinds", () => {
    expect(() =>
      assertObservationItemEvidenceLinkage({
        kind: "risk",
        provenanceKind: "review_assessment",
        sourceRanges: [{
          sourceType: "review_assessment",
          sourceId: "review-assessment-1",
          locator: "findings[0]",
          capturedAt: "2026-06-22T12:00:00.000Z"
        }]
      })
    ).toThrow("Truth-bearing observation requires an evidence-linked source range");
  });

  it("allows explicit local operator notes to remain unsourced", () => {
    expect(() =>
      assertObservationItemEvidenceLinkage({
        kind: "operator_note",
        provenanceKind: "local_operator_note",
        sourceRanges: []
      })
    ).not.toThrow();
  });
});
