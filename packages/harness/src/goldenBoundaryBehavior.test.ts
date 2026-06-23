import {
  existsSync,
  readFileSync
} from "node:fs";
import { describe, expect, it } from "vitest";
import type {
  MemoryRecord,
  TaskContract
} from "@krn/core";

import {
  runRepoSurfaceAudit,
  runSourceGroundingAudit,
  runTypeSafetyAudit
} from "./audit/auditChecks.js";
import {
  applyContextROI,
  assembleContext,
  buildMemoryQuery,
  rankCandidates,
  toMemoryCandidate
} from "./activation/index.js";

const now = "2026-06-23T10:00:00.000Z";

const task = (overrides: Partial<TaskContract>): TaskContract => ({
  id: "task-boundary-1",
  operatorIntentId: "intent-boundary-1",
  projectId: "project-1",
  title: "Assemble bounded context with source and audit gates",
  objective: "Use only small source-grounded context and reject unsafe boundary shortcuts.",
  constraints: ["no broad context dump", "no unchecked runtime input"],
  nonGoals: ["do not add broad eval suite"],
  acceptance: ["boundary golden cases protect real behavior"],
  status: "active",
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const memoryRecord = (overrides: Partial<MemoryRecord>): MemoryRecord => ({
  id: "memory-boundary-1",
  projectId: "project-1",
  key: "bounded-context",
  kind: "procedure",
  status: "active",
  summary: "Bounded context must stay small and source-grounded",
  body: "KRN should include only the most relevant memory instead of dumping all available context.",
  owner: "boundary-eval",
  confidence: 95,
  applicationGuidance: "Use when assembling context for risky implementation work.",
  sourceLineage: [{ sourceId: "source-claim-boundary-1" }],
  isUserPreference: false,
  positiveFeedbackCount: 1,
  negativeFeedbackCount: 0,
  metadata: {},
  validFrom: "2026-06-01T00:00:00.000Z",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  ...overrides
});

const boundaryCaseIds = (): string[] => {
  const fixtureUrl = new URL(
    "../../../tests/fixtures/golden-tasks/boundary-behavior.json",
    import.meta.url
  );

  if (!existsSync(fixtureUrl)) {
    return [];
  }

  const parsed = JSON.parse(readFileSync(fixtureUrl, "utf8")) as Array<{
    cases?: Array<{ id?: unknown }>;
  }>;

  return parsed.flatMap((goldenTask) =>
    goldenTask.cases?.flatMap((goldenCase) =>
      typeof goldenCase.id === "string" ? [goldenCase.id] : []
    ) ?? []
  ).sort();
};

describe("golden boundary behavior cases", () => {
  it("declares MM-62 boundary behavior cases as fixtures", () => {
    expect(boundaryCaseIds()).toEqual([
      "golden-case-audit-001-a",
      "golden-case-context-001-a",
      "golden-case-source-001-a",
      "golden-case-type-001-a"
    ]);
  });

  it("rejects broad context dumps through ContextROI exclusions", () => {
    const ranked = rankCandidates([
      toMemoryCandidate(memoryRecord({
        id: "memory-context-primary",
        summary: "Bounded context dump protection for source-grounded work."
      })),
      toMemoryCandidate(memoryRecord({
        id: "memory-context-extra-1",
        summary: "Extra context item that should remain out of the packet."
      })),
      toMemoryCandidate(memoryRecord({
        id: "memory-context-extra-2",
        summary: "Another extra context item that should remain out."
      }))
    ], buildMemoryQuery(task({
      objective: "Protect against broad context dump in a source-grounded implementation task."
    })));
    const context = assembleContext({
      id: "context-boundary-bounded",
      harnessPlanId: "plan-boundary-1",
      candidates: applyContextROI(ranked, {
        maxInclusions: 1,
        minimumScore: 0
      }),
      createdAt: now
    });

    expect(context.inclusions).toHaveLength(1);
    expect(context.exclusions.map((item) => item.reason)).toEqual([
      "over_budget",
      "over_budget"
    ]);
  });

  it("requires source claims to include doesNotProve", () => {
    const findings = runSourceGroundingAudit({
      sliceId: "MM-62",
      capturedAt: now,
      files: [],
      changedFiles: [],
      intendedFiles: [],
      verificationCommands: [],
      sourceClaims: [{
        id: "source-claim-missing-does-not-prove",
        claim: "A source proves the whole memory architecture is correct.",
        mechanism: "The source demonstrates one relevant mechanism.",
        krnImplication: "KRN may adopt the mechanism after review.",
        doesNotProve: "",
        consumer: "MM-62 source golden case",
        status: "accepted"
      }]
    });

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        category: "source_grounding",
        severity: "blocking",
        title: "Source claim lacks source-to-decision fields"
      })
    ]));
  });

  it("finds forbidden product surfaces through audit", () => {
    const findings = runRepoSurfaceAudit({
      sliceId: "MM-62",
      capturedAt: now,
      files: [{
        path: "packages/research-foundry/src/index.ts",
        content: "export const researchFoundry = true;"
      }],
      changedFiles: [],
      intendedFiles: [],
      verificationCommands: []
    });

    expect(findings).toEqual([expect.objectContaining({
      category: "architecture",
      severity: "blocking",
      title: "Forbidden Research Foundry surface"
    })]);
  });

  it("enforces unknown-first boundaries by flagging unchecked parsing", () => {
    const findings = runTypeSafetyAudit({
      sliceId: "MM-62",
      capturedAt: now,
      files: [{
        path: "packages/cli/src/runtimeInput.ts",
        content: "export const parse = (raw: string) => JSON.parse(raw);"
      }],
      changedFiles: [],
      intendedFiles: [],
      verificationCommands: []
    });

    expect(findings).toEqual([expect.objectContaining({
      category: "type_safety",
      severity: "warning",
      title: "Unchecked JSON.parse boundary"
    })]);
  });
});
