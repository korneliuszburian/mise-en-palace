import { describe, expect, it } from "vitest";
import type {
  GoldenTask
} from "@krn/core";

import {
  exportGoldenTasksToPromptfooSnapshot
} from "./goldenPromptfooExport.js";
import type {
  GoldenBehaviorProof
} from "./goldenRunner.js";

const baseTask = (overrides: Partial<GoldenTask> = {}): GoldenTask => ({
  id: "golden-task-memory",
  projectId: "project-1",
  status: "active",
  title: "Memory behavior stays governed",
  description: "Protects memory behavior with explicit proof.",
  owner: "memory-eval",
  domains: ["memory"],
  cases: [{
    id: "golden-case-stale-abstain",
    title: "stale memory abstains",
    input: {
      task: "Assemble context for stale memory behavior."
    },
    expectedBehavior: {
      outcome: "abstain",
      subject: "context_assembly",
      rationale: "Stale memory must not become confident context.",
      evidenceRefs: ["packages/harness/src/activation/goldenMemoryBehavior.test.ts"]
    },
    protectedFailureModes: [{
      id: "failure-mode-stale-memory-used",
      domain: "memory",
      severity: "blocking",
      title: "stale memory used",
      mustNot: "Stale memory must not enter context.",
      detection: "ContextAssembly includes stale memory."
    }],
    sourceRefs: ["docs/plans/memory-ideal-state/PLAN.md#MM-65"],
    metadata: {
      publicNote: "snapshot only"
    }
  }],
  metadata: {},
  createdAt: "2026-06-23T10:00:00.000Z",
  updatedAt: "2026-06-23T10:00:00.000Z",
  ...overrides
});

const passingProof: GoldenBehaviorProof = {
  caseId: "golden-case-stale-abstain",
  status: "passed",
  provenance: "krn_behavior_execution",
  summary: "Fixture-backed behavior proof passed.",
  evidenceRefs: ["packages/harness/src/activation/goldenMemoryBehavior.test.ts"],
  doesNotProve: "This does not prove Promptfoo smoke executes KRN behavior."
};

describe("golden Promptfoo snapshot export", () => {
  it("exports one deterministic snapshot-only Promptfoo test per golden case", () => {
    const snapshot = exportGoldenTasksToPromptfooSnapshot({
      tasks: [baseTask()],
      proofs: [passingProof],
      description: "KRN golden behavior snapshot"
    });

    expect(snapshot).toEqual({
      description: "KRN golden behavior snapshot",
      prompts: [{
        id: "krn-golden-behavior-proof",
        raw: "{{task}}"
      }],
      providers: [{
        id: "krn-local-proof-snapshot",
        config: {
          doesNotExecuteModel: true,
          mode: "snapshot_only",
          promptfooDependency: "not_required"
        }
      }],
      tests: [{
        vars: {
          task: "Assemble context for stale memory behavior.",
          taskId: "golden-task-memory",
          caseId: "golden-case-stale-abstain",
          title: "stale memory abstains",
          expectedOutcome: "abstain",
          expectedSubject: "context_assembly"
        },
        assert: [{
          type: "javascript",
          value: "output.includes('golden-case-stale-abstain')"
        }],
        metadata: {
          behaviorProofStatus: "passed",
          domains: ["memory"],
          doesNotExecuteModel: true,
          evidenceRefs: ["packages/harness/src/activation/goldenMemoryBehavior.test.ts"],
          owner: "memory-eval",
          protectedFailureModeIds: ["failure-mode-stale-memory-used"],
          snapshotOnly: true,
          sourceRefs: ["docs/plans/memory-ideal-state/PLAN.md#MM-65"]
        }
      }],
      metadata: {
        caseCount: 1,
        generatedBy: "krn",
        promptfooDependency: "not_required",
        snapshotOnly: true,
        taskCount: 1
      }
    });
  });

  it("marks cases without behavior proof as missing instead of passing", () => {
    const snapshot = exportGoldenTasksToPromptfooSnapshot({
      tasks: [baseTask()],
      proofs: []
    });

    expect(snapshot.tests).toEqual([expect.objectContaining({
      metadata: expect.objectContaining({
        behaviorProofStatus: "missing",
        snapshotOnly: true
      })
    })]);
  });
});
