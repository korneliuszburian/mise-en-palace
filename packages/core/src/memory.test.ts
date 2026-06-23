import { describe, expect, it } from "vitest";

import {
  assessMemoryRecordReviewSignals,
  type MemoryRecord
} from "./memory.js";

const now = "2026-06-23T20:05:00.000Z";

const memoryRecord = (overrides: Partial<MemoryRecord>): MemoryRecord => ({
  id: "memory-record-1",
  projectId: "project-1",
  key: "memory-key",
  kind: "procedure",
  status: "active",
  summary: "Use governed memory",
  body: "Memory records must remain useful and reviewed.",
  owner: "kernel",
  confidence: 90,
  applicationGuidance: "Use during memory governance work.",
  sourceLineage: [{ sourceId: "source-claim-1" }],
  isUserPreference: false,
  positiveFeedbackCount: 1,
  negativeFeedbackCount: 0,
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

describe("memory review signals", () => {
  it("requires review for unresolved negative feedback and high-confidence stale memory", () => {
    expect(assessMemoryRecordReviewSignals(memoryRecord({
      status: "stale",
      confidence: 95,
      positiveFeedbackCount: 0,
      negativeFeedbackCount: 3
    }))).toEqual([
      {
        kind: "stale_high_confidence",
        severity: "blocking",
        memoryRecordId: "memory-record-1",
        reason:
          "High-confidence stale memory must be reviewed, invalidated, or demoted before activation relies on it."
      },
      {
        kind: "unresolved_negative_feedback",
        severity: "blocking",
        memoryRecordId: "memory-record-1",
        reason:
          "Repeated hurt/stale feedback must produce a governed demotion or invalidation review."
      },
      {
        kind: "no_application_feedback",
        severity: "warning",
        memoryRecordId: "memory-record-1",
        reason:
          "Active or stale memory without positive application feedback has not proven usefulness in KRN runs."
      }
    ]);
  });

  it("does not emit review signals for a useful active memory record", () => {
    expect(assessMemoryRecordReviewSignals(memoryRecord({}))).toEqual([]);
  });
});
