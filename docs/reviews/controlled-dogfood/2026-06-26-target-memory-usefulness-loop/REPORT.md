# Target Memory Usefulness Loop Report

Status: V03-04 complete.

Date: 2026-06-26.

## Executive Verdict

V03-04 makes target-like memory usefulness measurable in the existing target
harness smoke. The smoke creates an explicit smoke-scoped MemoryRecord before
planning, verifies the plan included it, records `MemoryApplication
outcome=helped`, readbacks the updated positive feedback count, and reports
that no automatic MemoryRecord promotion/mutation path ran.

This is a local target fixture usefulness proof, not product-wide memory
quality.

## Scope

Changed:

- `packages/cli/src/targetRepoHarnessSmoke.ts`
- `packages/cli/src/targetRepoHarnessSmoke.test.ts`
- `docs/architecture/brain-battle-eval-matrix.md`
- `PLAN.md`
- `GOAL.md`

Not changed:

- MemoryReviewGate promotion rules;
- anti-memory review behavior;
- activation scoring;
- DB schema;
- automatic memory promotion;
- dashboard/API/MCP/worker runtime.

## Behavior Added

`pnpm db:smoke:target-repo-harness` now:

1. creates an explicit smoke-scoped `MemoryRecord`;
2. runs target-like planning;
3. verifies the context included that memory;
4. records `MemoryApplication outcome=helped`;
5. readbacks positive feedback count;
6. cleans all smoke rows.

The operator output includes:

```txt
Memory seed record: <id>
Memory included: yes
Memory application: <id>
Memory usefulness outcome: helped
Memory usefulness readback: matched
Memory positive feedback count: 1
Automatic MemoryRecord mutation: none
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/cli test -- targetRepoHarnessSmoke runCli` | passed | CLI target smoke output covers memory usefulness fields. | Does not prove live DB runtime. |
| `pnpm typecheck` through `rtk proxy` | passed | Workspace TypeScript compiles after memory usefulness reporting. | Does not prove runtime behavior. |
| `pnpm db:ready` | passed | Current-shell local Postgres is reachable with 14/14 migrations and pgvector. | Does not prove another operator's DB state. |
| `pnpm db:smoke:target-repo-harness` | passed | Target-like DB-backed run included memory, recorded helped feedback, readback positive feedback count, and cleaned up. | Does not prove product-wide memory usefulness or external target readiness. |

## Product Impact

Before this slice, target harness smoke could prove target plan/evidence/readback
but not whether memory helped.

After this slice, target harness smoke carries a measurable memory usefulness
loop:

```txt
explicit MemoryRecord seed
  -> target-like plan inclusion
  -> MemoryApplication outcome=helped
  -> positive feedback readback
  -> cleanup
```

The loop is deliberately not automatic promotion. It is a smoke-scoped memory
record used to prove measurement mechanics.

## What This Does Not Prove

- Memory usefulness on arbitrary target repositories.
- Candidate promotion quality.
- Stale/hurt memory repair beyond existing guards.
- Product readiness.
- Real second-operator controlled alpha trial.

## Next Recommended Action

Continue to V03-05:

```txt
First-Run Operator Friction Repair
```

The target fixture now proves target seeds, owner files, evidence/readback, and
memory usefulness. The next step should reduce first-run ambiguity before a real
operator attempts V02-01.

