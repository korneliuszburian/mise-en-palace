import { describe, expect, test } from "vitest";

import {
  validateBehaviorFixture,
  type BehaviorFixture
} from "../behaviorFixture.js";

const now = "2026-06-23T09:10:00.000Z";

const behaviorFixture = (overrides: Partial<BehaviorFixture>): BehaviorFixture => ({
  id: "golden-task-1",
  projectId: "project-1",
  status: "draft",
  title: "Memory activation respects anti-memory",
  description: "Protects the behavior where rejected memory must not enter context.",
  owner: "memory-eval",
  domains: ["memory", "anti_memory", "context"],
  cases: [{
    id: "golden-case-1",
    title: "active anti-memory blocks stale memory",
    input: {
      task: "Plan a memory promotion for a stale pattern.",
      scope: "project:project-1"
    },
    expectedBehavior: {
      outcome: "exclude",
      subject: "memory_record:stale-pattern",
      rationale: "Active anti-memory invalidates the stale pattern.",
      evidenceRefs: ["docs/runs/2026-06-23-memory-dogfood.md"]
    },
    protectedFailureModes: [{
      id: "failure-mode-1",
      domain: "anti_memory",
      severity: "blocking",
      title: "stale memory enters context",
      mustNot: "ContextAssembly must not include invalidated memory.",
      detection: "Included context item references memory_record:stale-pattern."
    }],
    sourceRefs: ["KRN_ROADMAP.md#MM-59"],
    metadata: {}
  }],
  metadata: {},
  createdAt: now,
  updatedAt: now,
  ...overrides
});

describe("behavior fixture", () => {
  test("accepts a task with expected behavior and protected failure modes", () => {
    expect(validateBehaviorFixture(behaviorFixture({}))).toEqual([]);
  });

  test("does not require live pipeline ids because BehaviorFixture is fixture-only", () => {
    const task = behaviorFixture({});

    delete task.projectId;

    expect("taskContractId" in task).toBe(false);
    expect("harnessPlanId" in task).toBe(false);
    expect(validateBehaviorFixture(task)).toEqual([]);
  });

  test("rejects artifact-theater cases without behavior expectations", () => {
    expect(validateBehaviorFixture(behaviorFixture({
      cases: [{
        id: "golden-case-1",
        title: "shape-only fixture",
        input: {},
        expectedBehavior: {
          outcome: "flag",
          subject: "",
          rationale: "",
          evidenceRefs: []
        },
        protectedFailureModes: [],
        sourceRefs: [],
        metadata: {}
      }]
    }))).toEqual([
      "case golden-case-1 expectedBehavior.subject is required",
      "case golden-case-1 expectedBehavior.rationale is required",
      "case golden-case-1 expectedBehavior.evidenceRefs are required",
      "case golden-case-1 protectedFailureModes are required",
      "case golden-case-1 sourceRefs are required"
    ]);
  });

  test("rejects case and failure-mode fields that cannot protect behavior", () => {
    expect(validateBehaviorFixture(behaviorFixture({
      cases: [{
        ...behaviorFixture({}).cases[0]!,
        title: " ",
        protectedFailureModes: [{
          id: "failure-mode-1",
          domain: "anti_memory",
          severity: "blocking",
          title: " ",
          mustNot: "",
          detection: " "
        }]
      }]
    }))).toEqual([
      "case golden-case-1 title is required",
      "case golden-case-1 failureMode failure-mode-1 title is required",
      "case golden-case-1 failureMode failure-mode-1 mustNot is required",
      "case golden-case-1 failureMode failure-mode-1 detection is required"
    ]);
  });

  test("rejects private reasoning metadata", () => {
    expect(validateBehaviorFixture(behaviorFixture({
      metadata: {
        chainOfThought: "hidden reasoning must not be stored"
      }
    }))).toEqual(["metadata.chainOfThought is forbidden"]);

    expect(validateBehaviorFixture(behaviorFixture({
      metadata: {
        reasoningTrace: "hidden reasoning must not be stored"
      }
    }))).toEqual(["metadata.reasoningTrace is forbidden"]);

    expect(validateBehaviorFixture(behaviorFixture({
      metadata: {
        reasoning_trace: "hidden reasoning must not be stored"
      }
    }))).toEqual(["metadata.reasoning_trace is forbidden"]);
  });
});
