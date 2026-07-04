import { describe, expect, it } from "vitest";
import type {
  BehaviorFixture
} from "@krn/core";

import {
  runKrnBehaviorGate
} from "../krnBehaviorGate.js";

const now = "2026-06-23T10:00:00.000Z";

const task: BehaviorFixture = {
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
        evidenceRefs: ["packages/harness/src/krnBehaviorGate.ts"]
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
        evidenceRefs: ["packages/harness/src/krnBehaviorGate.ts"]
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
        evidenceRefs: ["packages/harness/src/krnBehaviorGate.ts"]
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
      id: "golden-case-context-roi-001-a",
      title: "ContextROI keeps brief context bounded",
      input: {
        task: "Assemble a small Codex brief context packet."
      },
      expectedBehavior: {
        outcome: "exclude",
        subject: "context_assembly:context-roi",
        rationale: "Context assembly should include only bounded high-value context and keep over-budget exclusions explicit.",
        evidenceRefs: ["packages/harness/src/krnBehaviorGate.ts"]
      },
      protectedFailureModes: [{
        id: "failure-mode-real-gate-context-roi",
        domain: "context",
        severity: "blocking",
        title: "context dump admitted",
        mustNot: "ContextAssembly must not include every candidate when ContextROI budget is one item.",
        detection: "ContextAssembly has more than one inclusion or omits over_budget exclusions."
      }],
      sourceRefs: ["tests/fixtures/behavior-fixtures/boundary-behavior.json"],
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
        evidenceRefs: ["packages/harness/src/krnBehaviorGate.ts"]
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
        evidenceRefs: ["packages/harness/src/krnBehaviorGate.ts"]
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
      id: "golden-case-codex-output-evidence-shape-001-a",
      title: "claimed Codex output carries evidence shape",
      input: {
        output: "Codex claims it followed selected KRN context."
      },
      expectedBehavior: {
        outcome: "reject",
        subject: "codex_output:evidence_shape",
        rationale: "A run output that claims it followed KRN context must carry evidence refs, verification evidence, changed files, and explicit non-proof.",
        evidenceRefs: ["packages/harness/src/krnBehaviorGate.ts"]
      },
      protectedFailureModes: [{
        id: "failure-mode-real-gate-codex-output-evidence-shape",
        domain: "capability",
        severity: "blocking",
        title: "Codex output claims KRN context without evidence",
        mustNot: "Claimed Codex output must not say it followed KRN context without evidence refs and doesNotProve.",
        detection: "Codex-output evidence-shape validation rejects claimsKrnContextUse=true when evidenceRefs or doesNotProve are missing."
      }],
      sourceRefs: [
        "packages/codex-adapter/src/renderExecutionBrief.ts",
        "docs/architecture/behavior-gate-matrix.md"
      ],
      metadata: {}
    },
    {
      id: "golden-case-graph-qa-001-a",
      title: "relation-grounded QA readback preserves answer delta",
      input: {
        task: "Answer graph QA from relation-grounded source context."
      },
      expectedBehavior: {
        outcome: "flag",
        subject: "graph_qa:relation_grounded_answer",
        rationale: "A tiny graph QA proof must show the no-relation baseline, edge-aware context, grounded answer, and proof boundary.",
        evidenceRefs: ["packages/harness/src/krnBehaviorGate.ts"]
      },
      protectedFailureModes: [{
        id: "failure-mode-real-gate-graph-qa-readback",
        domain: "source",
        severity: "blocking",
        title: "relation-grounded QA delta is not reviewable",
        mustNot: "Graph QA proof must not hide whether baseline or edge-aware context grounded the answer.",
        detection: "Relation-grounded QA readback omits baseline verdict, edge-aware verdict, used SourceClaim ids, or doesNotProve."
      }],
      sourceRefs: [
        "docs/reviews/controlled-dogfood/2026-06-29-v335-small-graph-brain-qa-case/REPORT.md",
        "packages/harness/src/activation/relationGroundedQaReadback.ts"
      ],
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
        rationale: "Reflection must not target direct MemoryRecord authority.",
        evidenceRefs: ["packages/harness/src/krnBehaviorGate.ts"]
      },
      protectedFailureModes: [{
        id: "failure-mode-real-gate-reflection-direct-authority",
        domain: "reflection",
        severity: "blocking",
        title: "reflection mutates direct authority",
        mustNot: "Reflection candidate generation must not accept memory_record targets.",
        detection: "buildReflectionCandidateGenerationPlan returns ready."
      }],
      sourceRefs: ["docs/decisions/ADR-0013-observation-is-staging-not-memory.md"],
      metadata: {}
    },
    {
      id: "golden-case-target-fixture-battle-001-a",
      title: "target fixture exposes source seeds and trust exclusions",
      input: {
        task: "Repair TypeScript fixture tests and source readiness while keeping docs and target trust exclusions explicit."
      },
      expectedBehavior: {
        outcome: "flag",
        subject: "target_fixture:typescript-basic",
        rationale: "Target fixture planning must surface target docs/src/tests source seeds and generated or secret-shaped trust exclusions.",
        evidenceRefs: ["packages/harness/src/krnBehaviorGate.ts"]
      },
      protectedFailureModes: [{
        id: "failure-mode-real-gate-target-fixture-battle",
        domain: "context",
        severity: "blocking",
        title: "target fixture loses source seeds or trust exclusions",
        mustNot: "Target fixture planning must not collapse back to static KRN owner files or omit fixture trust exclusions.",
        detection: "Target fixture candidates omit docs/src/tests, trust exclusions, or include owner_file_recall metadata."
      }],
      sourceRefs: [
        "tests/fixtures/target-repos/typescript-basic/AGENTS.md",
        "docs/architecture/behavior-gate-matrix.md"
      ],
      metadata: {}
    },
    {
      id: "golden-case-target-owner-file-below-roots-001-a",
      title: "target owner-file recall surfaces files below named roots",
      input: {
        task: "Repair TypeScript fixture readiness test owner file."
      },
      expectedBehavior: {
        outcome: "include",
        subject: "target_owner_file:tests/readiness.test.ts",
        rationale: "When the target read model provides bounded owner files, KRN should surface the exact owner file below the named root instead of stopping at `tests/`.",
        evidenceRefs: ["packages/harness/src/krnBehaviorGate.ts"]
      },
      protectedFailureModes: [{
        id: "failure-mode-real-gate-target-owner-file-below-roots",
        domain: "context",
        severity: "blocking",
        title: "target plan stops at root when owner file is known",
        mustNot: "Target planning must not stop at root-level source seeds when a bounded owner-file signal exists.",
        detection: "Target candidates omit targetReadModelKind=owner_file for tests/readiness.test.ts."
      }],
      sourceRefs: [
        "tests/fixtures/target-repos/typescript-basic/tests/readiness.test.ts",
        "docs/architecture/behavior-gate-matrix.md"
      ],
      metadata: {}
    },
    {
      id: "golden-case-target-trust-exclusions-001-a",
      title: "target read model exposes source seeds and trust exclusions",
      input: {
        task: "Repair muke-v2 eval tests and keep target trust exclusions explicit."
      },
      expectedBehavior: {
        outcome: "flag",
        subject: "target_read_model:trust_exclusions",
        rationale: "Target-repo planning must surface project-scoped source seeds and trust exclusions instead of selecting static KRN owner files.",
        evidenceRefs: ["packages/harness/src/krnBehaviorGate.ts"]
      },
      protectedFailureModes: [{
        id: "failure-mode-real-gate-target-trust-exclusions",
        domain: "context",
        severity: "blocking",
        title: "target plan loses trust exclusions",
        mustNot: "Target-repo activation must not omit trust exclusions or select static KRN owner files for target project planning.",
        detection: "Target read-model candidates omit target-trust-exclusions or include owner_file_recall metadata."
      }],
      sourceRefs: [
        "docs/reviews/controlled-dogfood/2026-06-25-target-activation-read-model/REPORT.md"
      ],
      metadata: {}
    },
    {
      id: "golden-case-source-decorative-rejection-001-a",
      title: "decorative source retention is rejected",
      input: {
        claim: "This source should be retained because it sounds useful."
      },
      expectedBehavior: {
        outcome: "reject",
        subject: "source_claim:source-claim-decorative",
        rationale: "Source claims must carry source-to-decision fields and decision-grade support before they can guide KRN behavior.",
        evidenceRefs: ["packages/harness/src/krnBehaviorGate.ts"]
      },
      protectedFailureModes: [{
        id: "failure-mode-real-gate-decorative-source",
        domain: "source",
        severity: "blocking",
        title: "decorative source retained as authority",
        mustNot: "KRN must not retain a decorative/background source claim as decision authority when mechanism, implication, consumer, falsifier, or doesNotProve are missing.",
        detection: "assessSourceClaimReviewSignals emits no blocking signal for a decorative SourceClaim."
      }],
      sourceRefs: [
        "packages/core/src/source.ts",
        "docs/architecture/behavior-gate-matrix.md"
      ],
      metadata: {}
    },
    {
      id: "golden-case-source-artifact-preview-reuse-001-a",
      title: "source artifact preview claim can shape later activation context",
      input: {
        task: "Use source artifact preview evidence before building crawler work."
      },
      expectedBehavior: {
        outcome: "include",
        subject: "source_claim:source-claim-artifact-preview-reuse",
        rationale: "A reviewable source artifact preview claim should be reusable as bounded source activation context.",
        evidenceRefs: ["packages/harness/src/krnBehaviorGate.ts"]
      },
      protectedFailureModes: [{
        id: "failure-mode-real-gate-source-artifact-preview-reuse",
        domain: "source",
        severity: "blocking",
        title: "source artifact preview claim cannot shape later context",
        mustNot: "A ready source artifact preview claim must not disappear before source activation readback.",
        detection: "ContextAssembly omits source-claim-artifact-preview-reuse or extraction produces no ready claim."
      }],
      sourceRefs: [
        "packages/core/src/sourceArtifactPreviewExtraction.ts",
        "packages/harness/src/activation/contextRoi.ts"
      ],
      metadata: {}
    }
  ],
  metadata: {},
  createdAt: now,
  updatedAt: now
};

describe("KRN deterministic behavior gate", () => {
  it("generates passing BehaviorFixture proofs by executing real KRN behavior", () => {
    const report = runKrnBehaviorGate({
      tasks: [task],
      now
    });

    expect(report).toMatchObject({
      status: "passed",
      taskCount: 1,
      caseCount: 14,
      passedCaseCount: 14,
      failedCaseCount: 0,
      missingProofCaseIds: [],
      failedProofCaseIds: []
    });
    expect(report.caseResults.map((result) => result.caseId)).toEqual([
      "golden-case-codex-output-evidence-shape-001-a",
      "golden-case-context-roi-001-a",
      "golden-case-evidence-001-a",
      "golden-case-graph-qa-001-a",
      "golden-case-memory-005-a",
      "golden-case-memory-smoke-001",
      "golden-case-memory-smoke-002",
      "golden-case-observation-prefix-001-a",
      "golden-case-reflection-001-a",
      "golden-case-source-artifact-preview-reuse-001-a",
      "golden-case-source-decorative-rejection-001-a",
      "golden-case-target-fixture-battle-001-a",
      "golden-case-target-owner-file-below-roots-001-a",
      "golden-case-target-trust-exclusions-001-a"
    ]);
    expect(report.caseResults.map((result) => result.summary)).toEqual([
      "Real Codex-output evidence-shape gate accepted reviewed evidence refs and rejected KRN-context claims missing evidence refs, verification, changed files, or non-proof.",
      "Real ContextROI behavior kept a small packet with expectedUse and explicit over_budget exclusions.",
      "Real EvidenceBundle behavior distinguishes weak default command rows from operator-reported passed evidence.",
      "Real relation-grounded QA readback showed baseline insufficient and edge-aware context grounded the answer.",
      "Real activation behavior included exact-proof source claim only with raw recall trigger.",
      "Real activation behavior abstained on stale memory and produced stale exclusion.",
      "Real activation behavior blocked memory-stale-pattern with anti-memory conflict evidence.",
      "Real context assembly rejected selected observation prefix item without source ranges.",
      "Real reflection behavior blocked direct MemoryRecord target generation.",
      "Real source artifact preview extraction produced a reviewable claim that shaped later source activation context.",
      "Real source review behavior blocked decorative source retention when source-to-decision fields and decision-grade support were missing.",
      "Real target fixture behavior surfaced docs/src/tests source seeds and trust exclusions without selecting static KRN owner files.",
      "Real target owner-file recall surfaced a bounded owner file below tests/ without selecting static KRN owner files.",
      "Real target owner-file recall behavior surfaced target source seeds and trust exclusions without selecting static KRN owner files."
    ]);
  });
});
