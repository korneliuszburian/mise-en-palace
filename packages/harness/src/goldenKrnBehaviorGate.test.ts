import { describe, expect, it } from "vitest";
import type {
  GoldenTask
} from "@krn/core";

import {
  runKrnBehaviorGoldenGate
} from "./goldenKrnBehaviorGate.js";

const now = "2026-06-23T10:00:00.000Z";

const task: GoldenTask = {
  id: "golden-task-real-behavior-gate",
  projectId: "project-1",
  status: "active",
  title: "KRN memory behavior regression gate",
  description: "Runs real KRN behavior for memory, anti-memory, and reflection invariants.",
  owner: "memory-eval",
  domains: ["memory", "anti_memory", "reflection"],
  cases: [
    {
      id: "golden-case-memory-smoke-001",
      title: "stale memory abstains",
      input: {
        task: "Use the stale memory update pattern."
      },
      expectedBehavior: {
        outcome: "abstain",
        subject: "context_assembly",
        rationale: "Stale memory must become exclusion evidence, not confident context.",
        evidenceRefs: ["packages/harness/src/goldenKrnBehaviorGate.ts"]
      },
      protectedFailureModes: [{
        id: "failure-mode-real-gate-stale-memory",
        domain: "memory",
        severity: "blocking",
        title: "stale memory used confidently",
        mustNot: "ContextAssembly must not include stale memory.",
        detection: "ContextAssembly includes memory-smoke-stale."
      }],
      sourceRefs: ["docs/decisions/ADR-0014-activation-is-admission-control.md"],
      metadata: {}
    },
    {
      id: "golden-case-memory-smoke-002",
      title: "anti-memory blocks tempting stale pattern",
      input: {
        task: "Use stale pattern guidance for a memory update."
      },
      expectedBehavior: {
        outcome: "exclude",
        subject: "memory_record:memory-stale-pattern",
        rationale: "Active anti-memory must block the matching memory key.",
        evidenceRefs: ["packages/harness/src/goldenKrnBehaviorGate.ts"]
      },
      protectedFailureModes: [{
        id: "failure-mode-real-gate-anti-memory",
        domain: "anti_memory",
        severity: "blocking",
        title: "anti-memory block bypassed",
        mustNot: "Activation must not include memory-stale-pattern.",
        detection: "ContextAssembly includes memory-stale-pattern."
      }],
      sourceRefs: ["docs/decisions/ADR-0014-activation-is-admission-control.md"],
      metadata: {}
    },
    {
      id: "golden-case-reflection-001-a",
      title: "reflection creates candidates only",
      input: {
        reflection: "candidate-only reflection output"
      },
      expectedBehavior: {
        outcome: "reject",
        subject: "reflection_output:memory_record_target",
        rationale: "Reflection must not target MemoryRecord final truth.",
        evidenceRefs: ["packages/harness/src/goldenKrnBehaviorGate.ts"]
      },
      protectedFailureModes: [{
        id: "failure-mode-real-gate-reflection-final-truth",
        domain: "reflection",
        severity: "blocking",
        title: "reflection mutates final truth",
        mustNot: "Reflection candidate generation must not accept memory_record targets.",
        detection: "buildReflectionCandidateGenerationPlan returns ready."
      }],
      sourceRefs: ["docs/decisions/ADR-0013-observation-is-staging-not-memory.md"],
      metadata: {}
    }
  ],
  metadata: {},
  createdAt: now,
  updatedAt: now
};

describe("KRN behavior golden gate", () => {
  it("generates passing GoldenTask proofs by executing real KRN behavior", () => {
    const report = runKrnBehaviorGoldenGate({
      tasks: [task],
      now
    });

    expect(report).toMatchObject({
      status: "passed",
      taskCount: 1,
      caseCount: 3,
      passedCaseCount: 3,
      failedCaseCount: 0,
      missingProofCaseIds: [],
      failedProofCaseIds: []
    });
    expect(report.caseResults.map((result) => result.caseId)).toEqual([
      "golden-case-memory-smoke-001",
      "golden-case-memory-smoke-002",
      "golden-case-reflection-001-a"
    ]);
    expect(report.caseResults.map((result) => result.summary)).toEqual([
      "Real activation behavior abstained on stale memory and produced stale exclusion.",
      "Real activation behavior blocked memory-stale-pattern with anti-memory conflict evidence.",
      "Real reflection behavior blocked final MemoryRecord target generation."
    ]);
  });
});
