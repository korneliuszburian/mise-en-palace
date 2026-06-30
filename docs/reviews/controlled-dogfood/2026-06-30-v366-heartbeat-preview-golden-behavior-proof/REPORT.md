# V366 Heartbeat Preview Golden Behavior Proof

Status: complete bounded behavior-proof slice.

## Executive Verdict

V366 protects the V365 heartbeat preview review/eval closure with a focused
worker-level behavior proof. The proof fails if `buildBrainHeartbeatPreview`
stops emitting a candidate-only `reviewEvalClosure` with evidence refs,
`doesNotProve`, reviewability, next action, forbidden writes, and no mutation.

This is a regression proof, not a daemon, scheduler, crawler, embedding lane,
schema change, UI/API/MCP surface, consensus runtime, or autonomous Memory Core
mutation.

## Source To Decision

```yaml
source_id: docs/reviews/controlled-dogfood/2026-06-30-v365-heartbeat-preview-review-eval-closure/REPORT.md
title: V365 heartbeat preview review/eval closure
trust_tier: repo-local evidence
source_class: dogfood report
mechanism: V365 made heartbeat preview emit and render a review/eval closure
  decision with next action, evidence refs, does-not-prove, candidate ids, and
  no-mutation boundary.
krn_implication: Before building any autonomous heartbeat runtime, the
  operator-facing closure needs a small behavior proof that guards the
  candidate-only review/eval contract.
decision_kind: adopt
decision: Add a focused worker behavior proof for heartbeat preview
  review/eval closure output.
does_not_prove: This proof does not prove candidate truth, scheduler readiness,
  autonomous execution, product usefulness, or Memory Core mutation.
consumer: packages/workers/src/brainHeartbeatPreview.test.ts
falsifier: The proof requires daemon/scheduler/schema work, mutates memory or
  source truth, or fails to assert evidence refs, doesNotProve, next action,
  reviewability, and no mutation.
```

## Changed

- `packages/workers/src/brainHeartbeatPreview.test.ts`
  - adds `guards review eval closure behavior proof without mutation`;
  - asserts exact `reviewEvalClosure` decision, next action, evidence refs,
    `doesNotProve`, forbidden writes, and mutation boundary;
  - asserts every emitted heartbeat candidate remains review-ready,
    evidence-backed, action-bearing, does-not-prove annotated, and
    candidate-only.

No runtime source changed.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/workers test -- brainHeartbeatPreview` | passed | workers heartbeat preview tests pass, including the V366 behavior proof | live DB state, product usefulness, CI status |
| `pnpm db:ready` | passed | local Postgres is reachable, 14 migrations are applied, pgvector is available | CI DB state or product readiness |
| `pnpm run typecheck` | passed | strict TypeScript workspace compile succeeds | runtime usefulness |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | full local test suite passes, including root context-hygiene invariants after plan condensation | product readiness |
| `pnpm quality:fallow:ci` | passed | changed JS/TS files pass Fallow changed-files gate | architectural optimality |
| `git diff --check` | passed | diff has no whitespace errors | behavior correctness |
| `krn heartbeat preview --memory-limit 10 --source-claim-limit 10 --max-candidates 5` | passed | live DB readback still renders `ready_for_behavior_proof`, next action, evidence refs, reviewability, and no mutation | candidate truth, scheduler readiness, autonomous execution |

## Review Burden Delta

Before: V365 exposed the closure, but the behavior was protected only as part
of broader preview/CLI assertions.

After: the exact closure contract has a named proof focused on the thing that
must not regress before autonomous heartbeat work.

Delta: reduced for reviewing future heartbeat preview changes.

## What This Proves

- Heartbeat preview closure currently emits `ready_for_behavior_proof`.
- The closure preserves `nextAction: add_golden_behavior_case`.
- Candidate ids and evidence refs are present.
- `doesNotProve` and forbidden writes are present.
- Emitted candidates remain review-ready and candidate-only.
- No mutation boundary is preserved.

## What This Does Not Prove

- Candidate truth.
- Memory or source truth.
- Scheduler readiness.
- Autonomous worker execution.
- Consensus correctness.
- Product readiness.

## Next Recommended Task

V367 Consensus Eval/Candidate Lane.

Goal: add the smallest candidate-only consensus/eval surface that can evaluate
bounded claim or candidate disagreements without producing final truth,
mutating Memory Core, starting agent runtime, or creating a broad consensus
platform.
