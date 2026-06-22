import { describe, expect, test } from "vitest";

import {
  requiresObservationSourceRange,
  validateObservationContract,
  type ObservationItem,
  type ObservationKind,
  type ObservationProvenanceKind
} from "./index.js";

const now = "2026-06-22T12:00:00.000Z";

const sourceRange = {
  id: "range-1",
  sourceType: "run_event",
  sourceId: "run-event-1",
  locator: "event.payload.summary",
  excerpt: "Operator corrected the target repo memory behavior.",
  capturedAt: now
} as const;

const validObservation = (
  overrides: Partial<ObservationItem> = {}
): ObservationItem => ({
  id: "observation-1",
  groupId: "group-1",
  scope: {
    projectId: "project-1",
    workspaceId: "workspace-1"
  },
  kind: "fact",
  status: "observed",
  priority: "medium",
  confidence: "medium",
  provenanceKind: "run_event",
  subject: "target repo memory behavior",
  summary: "Operator corrected the target repo memory behavior.",
  body: "The correction came from the recorded run event.",
  temporalScope: {
    observedAt: now,
    eventTime: now,
    ingestedAt: now,
    referenceTime: now,
    validFrom: now
  },
  sourceRanges: [sourceRange],
  entityLinks: [],
  claimLinks: [],
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

describe("observation domain contracts", () => {
  test("rejects factual observations without a source range", () => {
    const observation = validObservation({
      kind: "fact",
      provenanceKind: "run_event",
      sourceRanges: []
    });

    expect(validateObservationContract(observation)).toEqual({
      ok: false,
      errors: ["source_range_required"]
    });
  });

  test("allows user preference to omit source ranges only with explicit provenance", () => {
    expect(
      validateObservationContract(
        validObservation({
          kind: "preference",
          provenanceKind: "user_preference",
          sourceRanges: []
        })
      )
    ).toEqual({ ok: true, errors: [] });

    expect(
      validateObservationContract(
        validObservation({
          kind: "preference",
          provenanceKind: "run_event",
          sourceRanges: []
        })
      )
    ).toEqual({ ok: false, errors: ["source_range_required"] });
  });

  test("rejects observations that contain promotion-to-memory semantics", () => {
    expect(
      validateObservationContract(
        validObservation({
          promotionTarget: "memory_core"
        })
      )
    ).toEqual({ ok: false, errors: ["memory_promotion_forbidden"] });
  });

  test("rejects chain-of-thought fields on observation metadata", () => {
    expect(
      validateObservationContract(
        validObservation({
          metadata: {
            chainOfThought: "private reasoning trace"
          }
        })
      )
    ).toEqual({ ok: false, errors: ["chain_of_thought_forbidden"] });
  });

  test("source-range requirement matrix covers every observation kind", () => {
    const requiredKinds: ObservationKind[] = [
      "fact",
      "decision",
      "correction",
      "risk",
      "procedure",
      "conflict",
      "slang",
      "gap"
    ];

    const optionalKinds: ObservationKind[] = ["preference", "operator_note"];
    const regularProvenance: ObservationProvenanceKind = "run_event";

    for (const kind of requiredKinds) {
      expect(requiresObservationSourceRange(kind, regularProvenance)).toBe(true);
      expect(requiresObservationSourceRange(kind, "user_preference")).toBe(false);
      expect(requiresObservationSourceRange(kind, "local_operator_note")).toBe(false);
    }

    for (const kind of optionalKinds) {
      expect(requiresObservationSourceRange(kind, regularProvenance)).toBe(true);
      expect(requiresObservationSourceRange(kind, "user_preference")).toBe(false);
      expect(requiresObservationSourceRange(kind, "local_operator_note")).toBe(false);
    }
  });
});
