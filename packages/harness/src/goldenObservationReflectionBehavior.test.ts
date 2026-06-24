import {
  existsSync,
  readFileSync
} from "node:fs";
import { describe, expect, it } from "vitest";
import type {
  AntiMemoryRecord,
  ObservationItem,
  ReflectionOutput,
  TaskContract
} from "@krn/core";
import {
  buildReflectionCandidateGenerationPlan,
  buildReflectionIssueReports,
  validateObservationContract
} from "@krn/core";

import {
  selectObservationPrefix
} from "./observations/observationPrefix.js";

const now = "2026-06-23T10:00:00.000Z";

const sourcedRange = {
  id: "range-1",
  sourceType: "run_event",
  sourceId: "run-event-1",
  locator: "run_events.sequence:1",
  capturedAt: now
} as const;

const observation = (overrides: Partial<ObservationItem>): ObservationItem => ({
  id: "observation-1",
  groupId: "group-1",
  scope: {
    projectId: "project-1"
  },
  kind: "fact",
  status: "candidate",
  priority: "high",
  confidence: "high",
  provenanceKind: "run_event",
  subject: "observe-run",
  summary: "Observe run creates source-ranged observation staging records.",
  body: "Observation staging is not Memory Core.",
  temporalScope: {
    observedAt: now,
    ingestedAt: now,
    validFrom: now
  },
  sourceRanges: [sourcedRange],
  entityLinks: [],
  claimLinks: [],
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const reflectionOutput = (overrides: Partial<ReflectionOutput>): ReflectionOutput => ({
  id: "reflection-1",
  scope: {
    projectId: "project-1",
    executionRunId: "run-1"
  },
  status: "candidate",
  summary: "Reflection proposes candidates only.",
  findings: [],
  contradictions: [],
  gaps: [],
  candidateLinks: [{
    targetType: "memory_candidate",
    targetId: "memory-candidate-1",
    summary: "Create reviewed memory candidate, not active memory.",
    evidenceRefs: ["observation-1:range-1"]
  }],
  memoryCandidates: [{
    kind: "procedure",
    summary: "Use source-ranged observations for reflection.",
    body: "Reflection may propose a memory candidate after observation review.",
    owner: "memory-review",
    confidence: 70,
    applicationGuidance: "Apply only after MemoryReviewGate approval.",
    sourceLineage: [{ sourceId: "observation-1" }],
    isUserPreference: false,
    validFrom: now,
    evidence: {
      provenance: "run_event",
      evidenceRefs: ["observation-1:range-1"],
      doesNotProve: "This does not prove the candidate is approved Memory Core truth."
    },
    metadata: {}
  }],
  sourceClaimCandidates: [],
  antiMemoryCandidates: [],
  policyCandidates: [],
  evalCandidates: [],
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const task: TaskContract = {
  id: "task-1",
  operatorIntentId: "intent-1",
  projectId: "project-1",
  title: "Use observation prefix safely",
  objective: "Use observe run evidence without activating rejected patterns.",
  constraints: ["observation is not memory"],
  nonGoals: ["do not promote memory from reflection"],
  acceptance: ["anti-memory blocks rejected observation prefix"],
  status: "active",
  metadata: {},
  createdAt: now,
  updatedAt: now
};

const antiMemoryRecord = (overrides: Partial<AntiMemoryRecord>): AntiMemoryRecord => ({
  id: "anti-observation-1",
  projectId: "project-1",
  key: "observe-run",
  rejectedClaim: "Rejected observe-run observation should enter context.",
  reason: "The observation pattern was rejected by reviewed anti-memory.",
  invalidatedBySourceClaimIds: [],
  appliesTo: "observe-run",
  summary: "Block rejected observation prefix pattern",
  body: "Do not activate observations matching observe-run.",
  owner: "memory-review",
  confidence: 90,
  sourceLineage: [{ sourceId: "source-claim-1" }],
  metadata: {},
  validFrom: now,
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const goldenFixtureCaseIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((goldenTask) => {
    if (!isJsonObject(goldenTask) || !Array.isArray(goldenTask.cases)) {
      return [];
    }

    return goldenTask.cases.flatMap((goldenCase) =>
      isJsonObject(goldenCase) && typeof goldenCase.id === "string"
        ? [goldenCase.id]
        : []
    );
  }).sort();
};

const goldenCaseIds = (): string[] => {
  const fixtureUrl = new URL(
    "../../../tests/fixtures/golden-tasks/observation-reflection-behavior.json",
    import.meta.url
  );

  if (!existsSync(fixtureUrl)) {
    return [];
  }

  const parsed: unknown = JSON.parse(readFileSync(fixtureUrl, "utf8"));

  return goldenFixtureCaseIds(parsed);
};

describe("golden observation and reflection behavior cases", () => {
  it("declares MM-63 observation/reflection/anti-memory cases as fixtures", () => {
    expect(goldenCaseIds()).toEqual([
      "golden-case-anti-memory-001-a",
      "golden-case-gap-001-a",
      "golden-case-observation-001-a",
      "golden-case-reflection-001-a"
    ]);
  });

  it("keeps observation staging separate from Memory Core", () => {
    expect(validateObservationContract(observation({
      promotionTarget: "memory_core"
    }))).toEqual({
      ok: false,
      errors: ["memory_promotion_forbidden"]
    });
  });

  it("keeps reflection candidate-only and blocks final truth targets", () => {
    expect(buildReflectionCandidateGenerationPlan(reflectionOutput({}))).toMatchObject({
      status: "ready",
      counts: {
        memoryCandidates: 1
      }
    });
    expect(buildReflectionCandidateGenerationPlan(reflectionOutput({
      candidateLinks: [{
        targetType: "memory_record",
        targetId: "memory-1",
        summary: "This would bypass MemoryReviewGate.",
        evidenceRefs: []
      }]
    }))).toMatchObject({
      status: "blocked",
      blockedReasons: ["candidateLinks.0.targetType:final_truth_target"]
    });
  });

  it("blocks rejected observation prefix patterns with anti-memory", () => {
    const prefix = selectObservationPrefix({
      task,
      projectId: "project-1",
      observations: [observation({
        id: "observation-rejected-pattern"
      })],
      antiMemoryRecords: [antiMemoryRecord({})],
      now
    });

    expect(prefix.items).toHaveLength(0);
    expect(prefix.exclusions).toEqual([expect.objectContaining({
      observationId: "observation-rejected-pattern",
      reason: "anti_memory"
    })]);
  });

  it("surfaces reflection gaps for unsourced factual observations", () => {
    const reports = buildReflectionIssueReports({
      now,
      observations: [observation({
        id: "observation-unsourced",
        sourceRanges: []
      })]
    });

    expect(reports.gaps).toEqual([expect.objectContaining({
      id: "gap-missing-source-range-observation-unsourced",
      missingEvidence: "source range",
      metadata: expect.objectContaining({
        reason: "missing_source_range"
      })
    })]);
  });
});
