import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type {
  MemoryRecord,
  TaskContract
} from "@krn/core";

import {
  applyContextROI,
  applyTemporalFilter,
  applyTrustFilter,
  assembleContext,
  buildMemoryQuery,
  rankCandidates,
  toMemoryCandidate
} from "./index.js";

const now = "2026-06-23T10:00:00.000Z";

const task = (overrides: Partial<TaskContract>): TaskContract => ({
  id: "task-1",
  operatorIntentId: "intent-1",
  projectId: "project-1",
  title: "Use reviewed memory safely",
  objective: "Select source-linked memory and avoid stale weak context.",
  constraints: ["no runtime markdown memory"],
  nonGoals: ["do not add broad eval suite"],
  acceptance: ["golden memory behavior is protected"],
  status: "active",
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const memoryRecord = (overrides: Partial<MemoryRecord>): MemoryRecord => ({
  id: "memory-1",
  projectId: "project-1",
  key: "reviewed-memory",
  kind: "procedure",
  status: "active",
  summary: "Reviewed memory supports safe activation",
  body: "Source-linked memory should be selected only while current and trustworthy.",
  owner: "memory-eval",
  confidence: 95,
  applicationGuidance: "Use when planning memory behavior work.",
  sourceLineage: [{ sourceId: "source-claim-1" }],
  isUserPreference: false,
  positiveFeedbackCount: 0,
  negativeFeedbackCount: 0,
  metadata: {},
  validFrom: "2026-06-01T00:00:00.000Z",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  ...overrides
});

const goldenCaseIds = (): string[] => {
  const fixtureUrl = new URL(
    "../../../../tests/fixtures/golden-tasks/memory-behavior.json",
    import.meta.url
  );
  const parsed = JSON.parse(readFileSync(fixtureUrl, "utf8")) as Array<{
    cases?: Array<{ id?: unknown }>;
  }>;

  return parsed.flatMap((goldenTask) =>
    goldenTask.cases?.flatMap((goldenCase) =>
      typeof goldenCase.id === "string" ? [goldenCase.id] : []
    ) ?? []
  ).sort();
};

describe("golden memory behavior cases", () => {
  it("declares the required MM-61 memory behavior cases as fixtures", () => {
    expect(goldenCaseIds()).toEqual([
      "golden-case-memory-001-a",
      "golden-case-memory-002-a",
      "golden-case-memory-002-b",
      "golden-case-memory-003-a",
      "golden-case-memory-004-a"
    ]);
  });

  it("selects source-linked memory", () => {
    const query = buildMemoryQuery(task({
      objective: "Use reviewed source-linked memory for safe activation."
    }));
    const ranked = rankCandidates([
      toMemoryCandidate(memoryRecord({
        id: "memory-source-linked",
        summary: "Reviewed source-linked memory supports activation."
      }))
    ], query);
    const context = assembleContext({
      id: "context-source-linked",
      harnessPlanId: "plan-1",
      candidates: applyContextROI(ranked, { maxInclusions: 1 }),
      createdAt: now
    });

    expect(context.inclusions.map((item) => item.subjectId)).toEqual(["memory-source-linked"]);
  });

  it("rejects stale memory and abstains when only stale memory remains", () => {
    const ranked = rankCandidates([
      toMemoryCandidate(memoryRecord({
        id: "memory-stale",
        validUntil: "2026-06-01T00:00:00.000Z"
      }))
    ], buildMemoryQuery(task({})));
    const context = assembleContext({
      id: "context-stale",
      harnessPlanId: "plan-1",
      candidates: applyTemporalFilter(ranked, now),
      createdAt: now
    });

    expect(context.status).toBe("abstained");
    expect(context.exclusions[0]).toMatchObject({
      subjectId: "memory-stale",
      reason: "stale"
    });
  });

  it("abstains when memory support is weak", () => {
    const ranked = rankCandidates([
      toMemoryCandidate(memoryRecord({
        id: "memory-weak",
        confidence: 35
      }))
    ], buildMemoryQuery(task({})));
    const context = assembleContext({
      id: "context-weak",
      harnessPlanId: "plan-1",
      candidates: applyTrustFilter(ranked, { minimumTrustTier: "medium" }),
      createdAt: now
    });

    expect(context.status).toBe("abstained");
    expect(context.metadata.activationAbstention).toMatchObject({
      reason: "weak_context"
    });
  });

  it("respects temporal validity by selecting current memory over expired memory", () => {
    const ranked = rankCandidates([
      toMemoryCandidate(memoryRecord({
        id: "memory-expired",
        validUntil: "2026-06-01T00:00:00.000Z"
      })),
      toMemoryCandidate(memoryRecord({
        id: "memory-current",
        validUntil: "2026-07-01T00:00:00.000Z"
      }))
    ], buildMemoryQuery(task({})));
    const context = assembleContext({
      id: "context-temporal",
      harnessPlanId: "plan-1",
      candidates: applyContextROI(applyTemporalFilter(ranked, now), {
        maxInclusions: 1
      }),
      createdAt: now
    });

    expect(context.inclusions.map((item) => item.subjectId)).toEqual(["memory-current"]);
    expect(context.exclusions.map((item) => item.subjectId)).toContain("memory-expired");
  });

  it("uses application guidance as activation text and expected use", () => {
    const guidance = "Use when planning rollback path for memory dogfood.";
    const ranked = rankCandidates([
      toMemoryCandidate(memoryRecord({
        id: "memory-guidance",
        summary: "Generic implementation lesson",
        body: "The detailed applicability is in guidance.",
        applicationGuidance: guidance
      }))
    ], buildMemoryQuery(task({
      objective: "Plan rollback path for memory dogfood."
    })));

    expect(ranked[0]).toMatchObject({
      subjectId: "memory-guidance",
      expectedUse: guidance
    });
    expect(ranked[0]?.lexicalScore).toBeGreaterThan(0);
  });
});
