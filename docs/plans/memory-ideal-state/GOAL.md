# Goal: Controlled Memory Brain Execution

The canonical execution plan for the Memory Brain is:

```txt
docs/plans/memory-ideal-state/PLAN.md
```

Use that file as the living ExecPlan. It owns:

- current status;
- progress checkboxes;
- gate and slice order;
- operating protocol;
- forbidden surfaces;
- verification requirements;
- recovery and rollback rules.

## Current Status

- M27 is complete.
- MM-00 is complete at commit `80f9ef9`.
- MM-00 through MM-65, MM-16R, QG-00, QG-01, QG-02, QG-03, QG-04, and QG-04A
  are complete in the controlled plan.
- QG-00 repo-wide current-state inventory is recorded at
  `docs/plans/memory-ideal-state/QG-00-REPO-INVENTORY.md`.
- MM-56A added the KRN code vocabulary and TypeScript elegance standard at
  `docs/standards/code-vocabulary.md`.
- MM-57 added `krn review assess`, a manual review write path for
  ReviewAssessment plus FeedbackDelta with no Memory Core mutation.
- MM-58 dogfooded feedback capture on one KRN slice and proved proposal-only
  candidate generation, review burden/diff risk capture, and no Memory Core
  mutation.
- MM-59 added pure GoldenTask domain contracts for behavior-focused golden
  cases and protected failure modes.
- MM-60 chose file-backed GoldenTask fixtures for the initial strategy and
  added schema-owned deterministic fixture parsing.
- MM-61 added memory behavior golden cases and fixture-backed harness tests for
  source-linked memory, stale/weak abstention, temporal validity, and
  application guidance.
- MM-61-lite added early golden smoke cases for stale memory abstention,
  explicit anti-memory blocking, and unsupported SourceDecision rejection.
- MM-62 added context/source/audit/TS boundary golden cases for broad context
  dump rejection, source `doesNotProve`, forbidden surface audit, and
  unknown-first boundary enforcement.
- MM-63 added observation/reflection/anti-memory golden cases for observation
  staging, reflection candidate-only output, anti-memory prefix blocking, and
  visible gap reports.
- MM-64 added a pure harness GoldenTask runner that emits pass/fail reports
  from validated task contracts plus explicit behavior proofs.
- MM-65 added a pure harness Promptfoo-compatible snapshot export for
  GoldenTask cases, with no Promptfoo dependency and no model execution.
- QG-04 recorded the repo-wide smell/bloat audit at
  `docs/plans/memory-ideal-state/QG-04-SMELL-BLOAT-AUDIT.md`.
- QG-04A consolidated CLI filesystem and JSON boundary helpers into
  `packages/cli/src/cliFileBoundary.ts`.
- QG-04B through QG-04H, then QG-05 through QG-06, remain queued as the
  blocking quality correction gate: parser/doctor modularization, schema/core
  vocabulary cleanup, DB mapper split, official Promptfoo integration decision,
  and audit automation.

## Next Action

Read `docs/plans/memory-ideal-state/PLAN.md` top to bottom and continue from
the first unchecked Progress item: QG-04B command parser modularization.

## Hard Non-Goals

Do not create:

- Research Foundry;
- Pattern Vault;
- meta-researcher runtime;
- autoresearch product behavior;
- research DB/CLI;
- pattern inspect/promote CLI;
- broad eval suite before dogfood/golden memory cases;
- source crawler;
- runtime markdown memory;
- `.krn` runtime truth;
- hidden chain-of-thought storage.

Golden memory behavior tests are allowed only inside the normal eval lane
described by `PLAN.md`.
