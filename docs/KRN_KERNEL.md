# KRN Kernel Contract

## Product Thesis

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies:

- bounded context;
- service/store-backed memory;
- source grounding;
- policy;
- skills;
- eval expectations;
- traces;
- review gates;
- feedback.

## Kernel Law

Do not build more context. Build the machinery that selects, applies, verifies,
and forgets context.

## Live Primitive Map

The kernel law maps to live primitives:

| Verb | Live primitive | Current proof |
| --- | --- | --- |
| select | `packages/harness/src/activation/activationEngine.ts:retrieveActivationCandidates`, `packages/harness/src/activation/rankCandidates.ts:rankCandidates`, `packages/harness/src/activation/activationFilters.ts:applyActivationFilters` | DB brain-loop smoke persists activation decisions and next-run recall. |
| apply | `packages/harness/src/compiler/compileHarnessPlan.ts:compileHarnessPlan`, `packages/harness/src/activation/assembleContext.ts:assembleContext`, `packages/db/src/repositories/DrizzleMemoryRepository.ts:recordMemoryApplication` | DB brain-loop smoke records memory application after included context. |
| verify | `packages/db/src/brainLoopSmoke.ts:runBrainLoopSmokeCheck`, `packages/db/src/repositories/DrizzleHarnessRunRepository.ts:createEvidenceBundle`, `packages/db/src/repositories/DrizzleHarnessRunRepository.ts:createReviewAssessment`, `packages/db/src/repositories/DrizzleHarnessRunRepository.ts:createFeedbackDelta` | DB brain-loop smoke reads back evidence, review, feedback, context, activation, and cleanup. |
| forget | `packages/core/src/memory.ts:assessMemoryRecordReviewSignals`, `packages/db/src/repositories/DrizzleMemoryRepository.ts:recordMemoryApplication`, `packages/harness/src/activation/activationFilters.ts:applyActivationFilters` | DB brain-loop smoke records repeated hurt feedback, then the next activation excludes the downgraded memory. |

## Current Product Boundary

This repo is a controlled-internal-alpha KRN harness workspace for technical
operators. It is not product-ready and not widened internal alpha.

The current durable boundary is:

- compact root `GOAL.md`, `PLAN.md`, and `PLANS.md` for active execution truth;
- Beads, archived ledgers, and archived reports for detailed completed history
  and next-task synthesis;
- source-to-decision and pattern-intake gates for retained patterns;
- repo-local skills for repeated execution workflows;
- typed harness spine from operator intent through feedback/candidate outputs;
- store-backed memory/source/evidence/review behavior with markdown as docs,
  exports, seeds, or audit trails only;
- deterministic guards and smoke paths before broad product surfaces.

## What KRN Is Not

- prompt pack;
- dashboard-first app;
- benchmark lab;
- alternative executor for Codex;
- IDE agent;
- generic multi-agent framework;
- stack-specific agent zoo;
- markdown memory folder;
- archive of intentions.

## Runtime Truth

- Project memory must be store/service-backed.
- Markdown may be source, export, audit, seed, or backup.
- Raw onboarding material is quarantined in `docs/materials/`.
- Active context must be small, selected, and task-specific.

## Canonical Harness Spine

The accepted typed-model spine is:

```text
OperatorIntent -> TaskContract -> HarnessPlan -> ContextAssembly
  -> ExecutionContract -> CodexAdapterPlan -> ExecutionRun
  -> EvidenceBundle -> ReviewAssessment -> FeedbackDelta
  -> MemoryCandidate / SourceDecision / EvalCandidate
```

`ContextPacket` is a rendered artifact from `ContextAssembly`, not the central
domain model. Skill needs are `CapabilityRequirement` in core and
`CodexSkillBinding` in the Codex adapter layer.

## Decision Rule

Every retained source or pattern must pass the full chain:

```text
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

If a next step requires broad historical reread, copying old topology, or
building dashboard/evals before typed primitives and dogfood traces, stop and
re-scope.
