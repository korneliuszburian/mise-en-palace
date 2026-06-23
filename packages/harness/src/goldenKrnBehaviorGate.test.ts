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
  description: "Runs real KRN behavior for memory, anti-memory, activation, observation, evidence, and reflection invariants.",
  owner: "memory-eval",
  domains: ["memory", "anti_memory", "source", "observation", "type_boundary", "reflection"],
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
      id: "golden-case-memory-005-a",
      title: "exact source proof triggers raw recall",
      input: {
        task: "Use exact source proof before implementing activation safety."
      },
      expectedBehavior: {
        outcome: "flag",
        subject: "source_claim:source-claim-exact-proof",
        rationale: "Exact-proof source claims may enter context only with raw evidence recall triggers.",
        evidenceRefs: ["packages/harness/src/goldenKrnBehaviorGate.ts"]
      },
      protectedFailureModes: [{
        id: "failure-mode-real-gate-exact-proof",
        domain: "source",
        severity: "blocking",
        title: "exact proof admitted without raw recall",
        mustNot: "Activation must not include an exact-proof source claim without raw recall evidence hints.",
        detection: "Raw recall triggers omit exact_proof_required for source_claim:source-claim-exact-proof."
      }],
      sourceRefs: ["docs/decisions/ADR-0014-activation-is-admission-control.md"],
      metadata: {}
    },
    {
      id: "golden-case-observation-prefix-001-a",
      title: "unsourced observation prefix is rejected",
      input: {
        observationPrefix: "selected observation item without source ranges"
      },
      expectedBehavior: {
        outcome: "reject",
        subject: "observation_prefix:observation-unsourced-prefix",
        rationale: "Selected observation prefix items must carry source ranges before context assembly accepts them.",
        evidenceRefs: ["packages/harness/src/goldenKrnBehaviorGate.ts"]
      },
      protectedFailureModes: [{
        id: "failure-mode-real-gate-observation-prefix-source-range",
        domain: "observation",
        severity: "blocking",
        title: "unsourced observation prefix admitted",
        mustNot: "ContextAssembly must not accept selected observation prefix items without source ranges.",
        detection: "ContextAssembly contains observationPrefix for observation-unsourced-prefix."
      }],
      sourceRefs: ["docs/decisions/ADR-0013-observation-is-staging-not-memory.md"],
      metadata: {}
    },
    {
      id: "golden-case-evidence-001-a",
      title: "command evidence keeps provenance visible",
      input: {
        commands: ["pnpm test=not_run", "pnpm typecheck=passed"]
      },
      expectedBehavior: {
        outcome: "flag",
        subject: "evidence_command:provenance",
        rationale: "Weak default command rows must remain distinguishable from operator-reported passed evidence.",
        evidenceRefs: ["packages/harness/src/goldenKrnBehaviorGate.ts"]
      },
      protectedFailureModes: [{
        id: "failure-mode-real-gate-evidence-provenance",
        domain: "type_boundary",
        severity: "blocking",
        title: "weak command evidence masquerades as proof",
        mustNot: "EvidenceBundle command rows must not lose default_template versus operator_reported provenance.",
        detection: "normalizeEvidenceCommand returns indistinguishable provenance for default and operator-reported rows."
      }],
      sourceRefs: ["packages/core/src/evidenceBundle.ts"],
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
      caseCount: 6,
      passedCaseCount: 6,
      failedCaseCount: 0,
      missingProofCaseIds: [],
      failedProofCaseIds: []
    });
    expect(report.caseResults.map((result) => result.caseId)).toEqual([
      "golden-case-evidence-001-a",
      "golden-case-memory-005-a",
      "golden-case-memory-smoke-001",
      "golden-case-memory-smoke-002",
      "golden-case-observation-prefix-001-a",
      "golden-case-reflection-001-a"
    ]);
    expect(report.caseResults.map((result) => result.summary)).toEqual([
      "Real EvidenceBundle behavior distinguishes weak default command rows from operator-reported passed evidence.",
      "Real activation behavior included exact-proof source claim only with raw recall trigger.",
      "Real activation behavior abstained on stale memory and produced stale exclusion.",
      "Real activation behavior blocked memory-stale-pattern with anti-memory conflict evidence.",
      "Real context assembly rejected selected observation prefix item without source ranges.",
      "Real reflection behavior blocked final MemoryRecord target generation."
    ]);
  });
});
