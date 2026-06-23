import { describe, expect, it } from "vitest";
import type {
  GoldenTask
} from "@krn/core";

import {
  runGoldenTaskFixtures
} from "./goldenRunner.js";

const task = (overrides: Partial<GoldenTask> = {}): GoldenTask => ({
  id: "golden-task-1",
  projectId: "project-1",
  status: "draft",
  title: "Memory behavior stays governed",
  description: "Protects memory behavior with real proof.",
  owner: "memory-eval",
  domains: ["memory"],
  cases: [{
    id: "golden-case-1",
    title: "stale memory abstains",
    input: {},
    expectedBehavior: {
      outcome: "abstain",
      subject: "context_assembly",
      rationale: "Stale memory must not become confident context.",
      evidenceRefs: ["packages/harness/src/activation/goldenMemoryBehavior.test.ts"]
    },
    protectedFailureModes: [{
      id: "failure-mode-1",
      domain: "memory",
      severity: "blocking",
      title: "stale memory used",
      mustNot: "Stale memory must not enter context.",
      detection: "ContextAssembly includes stale memory."
    }],
    sourceRefs: ["docs/plans/memory-ideal-state/PLAN.md#MM-64"],
    metadata: {}
  }],
  metadata: {},
  createdAt: "2026-06-23T10:00:00.000Z",
  updatedAt: "2026-06-23T10:00:00.000Z",
  ...overrides
});

describe("golden task runner", () => {
  it("emits a pass report when every golden case has behavior proof", () => {
    const report = runGoldenTaskFixtures({
      tasks: [task()],
      proofs: [{
        caseId: "golden-case-1",
        status: "passed",
        summary: "Fixture-backed behavior test passed.",
        evidenceRefs: ["packages/harness/src/activation/goldenMemoryBehavior.test.ts"]
      }]
    });

    expect(report).toEqual({
      status: "passed",
      taskCount: 1,
      caseCount: 1,
      protectedFailureModeCount: 1,
      passedCaseCount: 1,
      failedCaseCount: 0,
      missingProofCaseIds: [],
      failedProofCaseIds: [],
      contractFindings: [],
      caseResults: [{
        caseId: "golden-case-1",
        status: "passed",
        evidenceRefs: ["packages/harness/src/activation/goldenMemoryBehavior.test.ts"],
        summary: "Fixture-backed behavior test passed."
      }]
    });
  });

  it("fails when a golden case has no behavior proof", () => {
    const report = runGoldenTaskFixtures({
      tasks: [task()],
      proofs: []
    });

    expect(report.status).toBe("failed");
    expect(report.missingProofCaseIds).toEqual(["golden-case-1"]);
    expect(report.caseResults).toEqual([expect.objectContaining({
      caseId: "golden-case-1",
      status: "missing"
    })]);
  });

  it("fails when a fixture is shape-valid but contract-invalid", () => {
    const report = runGoldenTaskFixtures({
      tasks: [task({
        cases: [{
          ...task().cases[0]!,
          expectedBehavior: {
            ...task().cases[0]!.expectedBehavior,
            evidenceRefs: []
          }
        }]
      })],
      proofs: [{
        caseId: "golden-case-1",
        status: "passed",
        summary: "This proof should not override contract failure.",
        evidenceRefs: ["test"]
      }]
    });

    expect(report.status).toBe("failed");
    expect(report.contractFindings).toEqual([
      "golden-task-1: case golden-case-1 expectedBehavior.evidenceRefs are required"
    ]);
  });
});
