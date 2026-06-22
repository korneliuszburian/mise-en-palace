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

  it("redacts secret-shaped values even when keys look neutral", () => {
    const input = buildObserverInput({
      executionRunId: "run-1",
      generatedAt: capturedAt,
      events: [{
        id: "event-1",
        sequence: 1,
        type: "tool.result",
        severity: "warning",
        message: "tool emitted neutral secret values",
        payload: {
          value: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret.signature",
          line: "Authorization: Api-Key key_live_1234567890abcdef1234567890abcdef",
          header: "Cookie: sessionid=abcdef1234567890abcdef1234567890; path=/",
          block: "-----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----",
          nested: {
            output: "ghp_1234567890abcdef1234567890abcdef123456"
          }
        },
        occurredAt: capturedAt
      }],
      evidenceBundles: [],
      reviewAssessments: [],
      feedbackDeltas: []
    });

    const payload = input.items[0]?.payload ?? "";

    expect(payload).toContain("[REDACTED]");
    expect(payload).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    expect(payload).not.toContain("key_live_1234567890abcdef");
    expect(payload).not.toContain("sessionid=abcdef");
    expect(payload).not.toContain("BEGIN PRIVATE KEY");
    expect(payload).not.toContain("ghp_1234567890abcdef");
    expect(input.redactions).toEqual([{
      sourceId: "event-1",
      paths: [
        "payload.block",
        "payload.header",
        "payload.line",
        "payload.nested.output",
        "payload.value"
      ]
    }]);
  });

  it("redacts before truncating so hidden secret suffixes cannot survive", () => {
    const input = buildObserverInput({
      executionRunId: "run-1",
      generatedAt: capturedAt,
      maxPayloadCharacters: 120,
      events: [{
        id: "event-1",
        sequence: 1,
        type: "tool.result",
        severity: "warning",
        message: "tool emitted long payload with delayed secret",
        payload: {
          output: "x".repeat(400),
          secretSuffix: `${"x".repeat(120)} Bearer delayed-secret-token-1234567890abcdef`
        },
        occurredAt: capturedAt
      }],
      evidenceBundles: [],
      reviewAssessments: [],
      feedbackDeltas: []
    });

    const payload = input.items[0]?.payload ?? "";

    expect(payload).not.toContain("delayed-secret-token");
    expect(input.redactions).toEqual([{
      sourceId: "event-1",
      paths: ["payload.secretSuffix"]
    }]);
    expect(input.truncations).toEqual([{
      sourceId: "event-1",
      field: "payload",
      originalCharacters: expect.any(Number),
      retainedCharacters: 120
    }]);
  });
});
