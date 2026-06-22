import { describe, expect, it } from "vitest";

import {
  assertObservationItemEvidenceLinkage,
  DrizzleObservationRepository,
  isEvidenceLinkedObservationSourceRangeInput
} from "./DrizzleObservationRepository.js";

const methodNames = [
  "createGroup",
  "addItems",
  "findByRun",
  "findByScope",
  "linkSourceRange",
  "recallRawEvidence",
  "recordFeedback"
] as const;

describe("DrizzleObservationRepository", () => {
  it("exposes MM-11 observation repository methods", () => {
    const prototype = DrizzleObservationRepository.prototype as Record<string, unknown>;

    for (const methodName of methodNames) {
      expect(typeof prototype[methodName]).toBe("function");
    }
  });

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

  it("allows auxiliary source ranges when an existing fact range is already evidence-linked", async () => {
    const capturedAt = new Date("2026-06-22T12:00:00.000Z");
    const repository = new DrizzleObservationRepository({
      query: {
        observationItems: {
          findFirst: async () => ({
            kind: "fact",
            provenanceKind: "run_event"
          })
        },
        observationSourceRanges: {
          findMany: async () => [{
            id: "existing-range",
            observationItemId: "observation-1",
            sourceType: "run_event",
            sourceId: "run-event-1",
            executionRunId: "execution-run-1",
            runEventId: "run-event-1",
            sourceChunkId: null,
            evidenceBundleId: null,
            reviewAssessmentId: null,
            feedbackDeltaId: null,
            locator: "run_events.sequence:1",
            excerpt: null,
            capturedAt,
            metadata: {}
          }]
        }
      },
      insert: () => ({
        values: () => ({
          returning: async () => [{
            id: "aux-range",
            observationItemId: "observation-1",
            sourceType: "operator_input",
            sourceId: "operator-note-1",
            executionRunId: null,
            runEventId: null,
            sourceChunkId: null,
            evidenceBundleId: null,
            reviewAssessmentId: null,
            feedbackDeltaId: null,
            locator: "operator.note",
            excerpt: "auxiliary note",
            capturedAt,
            metadata: {}
          }]
        })
      })
    } as never);

    await expect(repository.linkSourceRange("observation-1", {
      sourceType: "operator_input",
      sourceId: "operator-note-1",
      locator: "operator.note",
      excerpt: "auxiliary note",
      capturedAt: "2026-06-22T12:00:00.000Z"
    })).resolves.toEqual({
      id: "aux-range",
      sourceType: "operator_input",
      sourceId: "operator-note-1",
      locator: "operator.note",
      excerpt: "auxiliary note",
      capturedAt: "2026-06-22T12:00:00.000Z"
    });
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

  it("recalls raw run event evidence from observation source ranges", async () => {
    const capturedAt = new Date("2026-06-22T12:00:00.000Z");
    const repository = new DrizzleObservationRepository({
      query: {
        observationSourceRanges: {
          findMany: async () => [{
            id: "range-1",
            observationItemId: "observation-1",
            sourceType: "run_event",
            sourceId: "run-event-1",
            executionRunId: "execution-run-1",
            runEventId: "run-event-1",
            sourceChunkId: null,
            evidenceBundleId: null,
            reviewAssessmentId: null,
            feedbackDeltaId: null,
            locator: "payload.summary",
            excerpt: "raw event excerpt",
            capturedAt,
            metadata: {}
          }]
        },
        runEvents: {
          findFirst: async () => ({
            id: "run-event-1",
            executionRunId: "execution-run-1",
            sequence: 7,
            type: "tool.trace",
            severity: "info",
            message: "raw run event message",
            payload: {
              tool: "codex"
            },
            occurredAt: capturedAt
          })
        }
      }
    } as never);

    await expect(repository.recallRawEvidence("observation-1")).resolves.toEqual([{
      sourceRange: {
        id: "range-1",
        sourceType: "run_event",
        sourceId: "run-event-1",
        locator: "payload.summary",
        excerpt: "raw event excerpt",
        capturedAt: "2026-06-22T12:00:00.000Z"
      },
      kind: "run_event",
      sourceId: "run-event-1",
      locator: "payload.summary",
      excerpt: "raw event excerpt",
      text: "raw run event message",
      payload: {
        executionRunId: "execution-run-1",
        sequence: 7,
        type: "tool.trace",
        severity: "info",
        payload: {
          tool: "codex"
        },
        occurredAt: "2026-06-22T12:00:00.000Z"
      },
      capturedAt: "2026-06-22T12:00:00.000Z"
    }]);
  });
});
