# Target Fixture Battle Harness Report

Status: V03-01 complete.

Date: 2026-06-26.

## Executive Verdict

V03-01 added a deterministic local target fixture and guarded target
init/connect/plan behavior without claiming external operator proof. The
fixture now has realistic source seeds and trust-exclusion surfaces, and the
target repo harness smoke readbacks those fields from a DB-backed run.

This moves KRN closer to product reality, but it does not complete V02-01 and
does not prove exact owner-file recall below named target roots.

## Scope

Changed:

- `tests/fixtures/target-repos/typescript-basic/AGENTS.md`
- `tests/fixtures/target-repos/typescript-basic/README.md`
- `tests/fixtures/target-repos/typescript-basic/docs/target-runbook.md`
- `tests/fixtures/target-repos/typescript-basic/tests/readiness.test.ts`
- `tests/fixtures/target-repos/typescript-basic/.env.example`
- `tests/fixtures/target-repos/typescript-basic/.muke/state.fixture.json`
- `tests/fixtures/target-repos/typescript-basic/.supersearch/runtime/cache.fixture.json`
- `tests/fixtures/target-repos/typescript-basic/tsconfig.json`
- `packages/cli/src/targetRepoHarnessSmoke.ts`
- `packages/cli/src/targetRepoHarnessSmoke.test.ts`
- `packages/cli/src/runCli.test.ts`
- `packages/harness/src/goldenKrnBehaviorGate.ts`
- `packages/harness/src/goldenKrnBehaviorGate.test.ts`
- `docs/architecture/brain-battle-eval-matrix.md`
- `PLAN.md`
- `GOAL.md`

Not changed:

- activation scoring;
- retrieval scoring;
- DB schema;
- source crawler;
- eval platform;
- dashboard/API/MCP/worker runtime.

## Behavior Added

The local TypeScript target fixture now includes:

| Surface | Purpose |
|---|---|
| `AGENTS.md` | Target-local Codex/KRN guidance and trust boundary. |
| `README.md` | Target fixture overview. |
| `docs/target-runbook.md` | Target planning guidance. |
| `src/` | Implementation source root. |
| `tests/` | Test owner-file root. |
| `.env.example` | Secret-shaped fixture path. |
| `.muke/` | Generated target-state fixture path. |
| `.supersearch/runtime/` | Runtime generated-state fixture path. |

`db:smoke:target-repo-harness` now records and renders:

```txt
Target source seeds: AGENTS.md, README.md, docs, src, tests
Target trust exclusions: .env*, .git/, node_modules/, .muke/, .supersearch/runtime/, dist/, build/
```

`eval:brain-battle:smoke` now includes:

```txt
golden-case-target-fixture-battle-001-a
```

The guard fails if target fixture planning loses docs/src/tests seeds, omits
generated or secret-shaped trust exclusions, or falls back to static KRN
owner-file recall metadata for target planning.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `git fetch --prune` | passed | Local repo has fetched remote refs for this slice. | Does not prove remote CI for the final commit. |
| `git status --short --branch` | clean before edits | Work started from a clean local worktree. | Does not prove no future uncommitted files after edits. |
| `pnpm --filter @krn/harness test -- goldenKrnBehaviorGate` | passed | GoldenGate includes deterministic target fixture behavior proof. | Does not prove real external target repo behavior. |
| `pnpm --filter @krn/cli test -- targetRepoHarnessSmoke runCli` | passed | CLI fixture dry-run and target smoke rendering are covered. | Does not prove DB-backed runtime without DB smoke. |
| `pnpm typecheck` through `rtk proxy` | passed | Workspace TypeScript compiles. | Does not prove runtime behavior beyond type safety. |
| `pnpm eval:brain-battle:smoke` | passed | Brain-battle smoke executes the new target fixture guard. | Does not prove broad brain quality or external operator readiness. |
| `pnpm db:ready` | passed | Current-shell local Postgres is reachable with 14/14 migrations and pgvector. | Does not prove remote or another operator's DB state. |
| `pnpm db:smoke:target-repo-harness` | passed | DB-backed target harness smoke persists/readbacks target seeds, trust exclusions, brief, evidence, review, feedback, and cleanup. | Does not prove exact file recall below target roots. |

## Product Impact

This slice reduces fake target proof risk. KRN now has a target fixture that is
small but not empty: it contains the surfaces a real target repo would expose
to first-run planning, including guidance docs, source/tests, and untrusted
generated or secret-shaped paths.

The harness smoke now makes those target planning signals visible in operator
output instead of hiding them in implicit fixture assumptions.

## Brain Usefulness

| Area | Verdict | Evidence |
|---|---|---|
| Target fixture realism | positive | Fixture now has target guidance, docs, source, tests, and untrusted generated/secret-shaped paths. |
| Deterministic guard | positive | `golden-case-target-fixture-battle-001-a` passes inside `eval:brain-battle:smoke`. |
| DB-backed target readback | positive | `pnpm db:smoke:target-repo-harness` readbacks source seeds and trust exclusions. |
| Activation quality | insufficient evidence | This slice protects target read-model shape, not exact owner-file inference below roots. |
| External operator proof | not proven | This remains local fixture evidence only. |

## What This Does Not Prove

- V02-01 real second-operator controlled alpha trial.
- Product readiness.
- Exact target owner-file recall below `src/`, `tests/`, or `docs/`.
- Target behavior on arbitrary external repositories.
- Source crawler quality, because no crawler was added.

## Next Recommended Action

Continue to V03-02:

```txt
Target Owner-File Recall Below Named Roots
```

The fixture now supplies named target roots. The next product question is
whether KRN can safely infer bounded owner-file candidates below those roots,
or whether it must explain that the signal is missing.

