import { describe, expect, it } from "vitest";
import type {
  BehaviorFixture
} from "@krn/core";

import {
  runBehaviorFixtures
} from "./behaviorFixtureRunner.js";

const task = (overrides: Partial<BehaviorFixture> = {}): BehaviorFixture => ({
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
      evidenceRefs: ["packages/harness/src/activation/memoryBehaviorFixture.test.ts"]
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

describe("behavior fixture runner", () => {
  it("emits a pass report when every behavior fixture case has behavior proof", () => {
    const report = runBehaviorFixtures({
      tasks: [task()],
      proofs: [{
        caseId: "golden-case-1",
        status: "passed",
        provenance: "krn_behavior_execution",
        summary: "Fixture-backed behavior test passed.",
        evidenceRefs: ["packages/harness/src/activation/memoryBehaviorFixture.test.ts"],
        doesNotProve: "This does not prove Promptfoo smoke executes KRN behavior."
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
      fixtureFindings: [],
      caseResults: [{
        caseId: "golden-case-1",
        status: "passed",
        evidenceRefs: ["packages/harness/src/activation/memoryBehaviorFixture.test.ts"],
        summary: "Fixture-backed behavior test passed."
      }]
    });
  });

  it("fails when a behavior fixture case has no behavior proof", () => {
    const report = runBehaviorFixtures({
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

  it("fails when a fixture is shape-valid but fixture-invalid", () => {
    const report = runBehaviorFixtures({
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
        provenance: "krn_behavior_execution",
        summary: "This proof should not override fixture validation failure.",
        evidenceRefs: ["test"],
        doesNotProve: "This does not prove the BehaviorFixture is valid."
      }]
    });

    expect(report.status).toBe("failed");
    expect(report.fixtureFindings).toEqual([
      "golden-task-1: case golden-case-1 expectedBehavior.evidenceRefs are required"
    ]);
  });

  it("rejects Promptfoo integration smoke as BehaviorFixture proof", () => {
    const report = runBehaviorFixtures({
      tasks: [task()],
      proofs: [{
        caseId: "golden-case-1",
        status: "passed",
        provenance: "promptfoo_integration_smoke",
        summary: "Promptfoo row passed with score 1.",
        evidenceRefs: [".local-lab/promptfoo/krn-golden-smoke-results.jsonl"],
        doesNotProve: "Promptfoo smoke proves runner wiring only."
      }]
    });

    expect(report).toMatchObject({
      status: "failed",
      failedProofCaseIds: ["golden-case-1"]
    });
    expect(report.caseResults[0]?.summary).toBe(
      "Proof provenance promptfoo_integration_smoke is not accepted as BehaviorFixture proof: Promptfoo smoke proves runner wiring only."
    );
  });
});
