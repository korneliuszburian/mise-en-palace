import { describe, expect, it } from "vitest";

import { buildObserverInput } from "./observerInput.js";

const capturedAt = "2026-06-22T12:00:00.000Z";

describe("observer input builder", () => {
  it("normalizes run evidence into deterministic observer input", () => {
    const input = buildObserverInput({
      executionRunId: "run-1",
      generatedAt: capturedAt,
      events: [
        {
          id: "event-2",
          sequence: 2,
          type: "tool.result",
          severity: "info",
          message: "tool result captured",
          payload: { command: "pnpm test", status: "passed" },
          occurredAt: "2026-06-22T12:00:02.000Z"
        },
        {
          id: "event-1",
          sequence: 1,
          type: "tool.start",
          severity: "info",
          message: "tool started",
          payload: { command: "pnpm test" },
          occurredAt: "2026-06-22T12:00:01.000Z"
        }
      ],
      evidenceBundles: [{
        id: "evidence-1",
        executionRunId: "run-1",
        status: "verified",
        changedFiles: ["packages/harness/src/observations/observerInput.ts"],
        commands: [{ command: "pnpm test", status: "passed", exitCode: 0 }],
        diffRisk: "medium",
        reviewBurden: "medium",
        rollbackPath: "git revert <commit>",
        metadata: {},
        createdAt: capturedAt,
        updatedAt: capturedAt
      }],
      reviewAssessments: [{
        id: "review-1",
        evidenceBundleId: "evidence-1",
        status: "accepted",
        reviewer: "extended-reviewer",
        summary: "No blocking findings.",
        findings: [],
        metadata: {},
        createdAt: capturedAt,
        updatedAt: capturedAt
      }],
      feedbackDeltas: []
    });

    expect(input).toMatchObject({
      executionRunId: "run-1",
      generatedAt: capturedAt,
      counts: {
        events: 2,
        evidenceBundles: 1,
        reviewAssessments: 1,
        feedbackDeltas: 0
      }
    });
    expect(input.items.map((item) => item.sourceId)).toEqual([
      "event-1",
      "event-2",
      "evidence-1",
      "review-1"
    ]);
    expect(input.items[0]).toMatchObject({
      sourceType: "run_event",
      locator: "run_events.sequence:1",
      text: "tool.start: tool started"
    });
  });

  it("redacts secrets and truncates oversized raw payloads", () => {
    const input = buildObserverInput({
      executionRunId: "run-1",
      generatedAt: capturedAt,
      maxPayloadCharacters: 80,
      events: [{
        id: "event-1",
        sequence: 1,
        type: "tool.result",
        severity: "warning",
        message: "tool emitted metadata",
        payload: {
          accessToken: "secret-token",
          nested: {
            authorization: "Bearer secret"
          },
          output: "x".repeat(240)
        },
        occurredAt: capturedAt
      }],
      evidenceBundles: [],
      reviewAssessments: [],
      feedbackDeltas: []
    });

    expect(input.items[0]?.payload).toContain("[REDACTED]");
    expect(input.items[0]?.payload).not.toContain("secret-token");
    expect(input.items[0]?.payload).not.toContain("Bearer secret");
    expect(input.items[0]?.payload.length).toBeLessThanOrEqual(95);
    expect(input.redactions).toEqual([{
      sourceId: "event-1",
      paths: ["payload.accessToken", "payload.nested.authorization"]
    }]);
    expect(input.truncations).toEqual([{
      sourceId: "event-1",
      field: "payload",
      originalCharacters: expect.any(Number),
      retainedCharacters: 80
    }]);
  });
});
