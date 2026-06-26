# Target Evidence Capture And Readback Loop Report

Status: V03-03 complete.

Date: 2026-06-26.

## Executive Verdict

V03-03 proves the target-like harness smoke can move from persisted plan to
evidence, review, feedback, and aggregate readback without ad hoc SQL. The
readback preserves proof/non-proof boundaries: target fixture commands remain
`default_template/not_run`, and the smoke reports `MemoryRecord mutation: none`.

This is still local target-fixture proof, not V02-01 or external target product
readiness.

## Scope

Changed:

- `packages/cli/src/targetRepoHarnessSmoke.ts`
- `packages/cli/src/targetRepoHarnessSmoke.test.ts`
- `docs/architecture/brain-battle-eval-matrix.md`
- `PLAN.md`
- `GOAL.md`

Not changed:

- DB schema;
- evidence capture CLI semantics;
- review gates;
- memory/source mutation behavior;
- dashboard/API/MCP/worker runtime.

## Behavior Added

`pnpm db:smoke:target-repo-harness` now writes and then readbacks:

- `EvidenceBundle`;
- `ReviewAssessment`;
- `FeedbackDelta`.

It verifies:

- evidence readback matched;
- review assessment readback matched;
- feedback delta readback matched;
- command proof boundary stayed `weak_default_not_run`;
- no memory/source/eval candidate mutation path was produced.

The operator output now includes:

```txt
Evidence readback: matched
Command proof boundary: weak_default_not_run
Review assessment readback: matched
Feedback delta readback: matched
MemoryRecord mutation: none
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/cli test -- targetRepoHarnessSmoke runCli` | passed | CLI target smoke output and command routing cover evidence/review/feedback readback fields. | Does not prove live DB runtime. |
| `pnpm typecheck` through `rtk proxy` | passed | Workspace TypeScript compiles after readback fields. | Does not prove runtime behavior. |
| `pnpm db:ready` | passed | Current-shell local Postgres is reachable with 14/14 migrations and pgvector. | Does not prove remote or another operator DB state. |
| `pnpm db:smoke:target-repo-harness` | passed | Target-like DB-backed run writes and readbacks plan/evidence/review/feedback and preserves proof boundaries. | Does not prove commands executed, memory quality, source truth, review correctness, or product readiness. |

## Product Impact

Before this slice, target harness smoke created evidence/review/feedback records
but did not explicitly prove the post-evidence aggregate readback path or the
command proof boundary.

After this slice, target harness smoke is a stronger V03 guard: it proves the
operator can read back target-like evidence without SQL and without accidentally
treating not-run target fixture commands as passed proof.

## What This Does Not Prove

- Real second-operator controlled alpha trial.
- External target repository readiness.
- Commands executed in the target fixture.
- Review correctness.
- Memory usefulness.
- Product readiness.

## Next Recommended Action

Continue to V03-04:

```txt
Target Memory Usefulness Loop
```

The target-like run now has plan/evidence/review/feedback readback. The next
question is whether KRN can measure memory usefulness for target-like tasks
without automatic Memory Core mutation.

