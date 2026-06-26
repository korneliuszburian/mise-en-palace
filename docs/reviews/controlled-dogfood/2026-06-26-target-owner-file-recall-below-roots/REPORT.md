# Target Owner-File Recall Below Named Roots Report

Status: V03-02 complete.

Date: 2026-06-26.

## Executive Verdict

V03-02 repaired the root-level-only target recall gap without adding a crawler,
scoring rewrite, or broad retrieval rewrite. Target activation can now use
explicit `ownerFiles` from the project read model to surface bounded owner-file
candidates below named roots such as `tests/readiness.test.ts`.

When that exact owner-file signal is missing, `krn plan --project` says so
instead of pretending KRN inferred a precise file.

## Scope

Changed:

- `packages/harness/src/activation/ownerFileRecall.ts`
- `packages/harness/src/activation/ownerFileRecall.test.ts`
- `packages/harness/src/compiler/index.test.ts`
- `packages/harness/src/goldenKrnBehaviorGate.ts`
- `packages/harness/src/goldenKrnBehaviorGate.test.ts`
- `packages/cli/src/runPlanCommand.ts`
- `packages/cli/src/runCli.test.ts`
- `packages/cli/src/targetRepoHarnessSmoke.ts`
- `packages/cli/src/targetRepoHarnessSmoke.test.ts`
- `docs/architecture/brain-battle-eval-matrix.md`
- `PLAN.md`
- `GOAL.md`

Not changed:

- activation scoring;
- retrieval scoring;
- DB schema;
- filesystem crawling;
- source crawler;
- dashboard/API/MCP/worker runtime.

## Behavior Added

`TargetActivationReadModel` now supports:

```ts
ownerFiles?: readonly TargetActivationOwnerFile[];
```

Each owner-file signal includes:

```txt
path
root
kind
reason
```

When a task matches an explicit target owner file, activation emits a candidate:

```txt
reason: Target owner file: tests/readiness.test.ts
metadata.targetReadModelKind: owner_file
metadata.targetPath: tests/readiness.test.ts
metadata.targetRoot: tests
```

When a project read model has no owner files, `krn plan --project` reports:

```txt
Target read model: sourceSeeds=<n>, ownerFiles=0, trustExclusions=<n>
Target owner files: unavailable; using root-level source seeds only
```

This is the intended boundary: no broad scan, no fake exact inference.

## DB-Backed Readback

`pnpm db:smoke:target-repo-harness` now prints:

```txt
Target source seeds: AGENTS.md, README.md, docs, src, tests
Target owner files: AGENTS.md, docs/target-runbook.md, src/index.ts, tests/readiness.test.ts
Target trust exclusions: .env*, .git/, node_modules/, .muke/, .supersearch/runtime/, dist/, build/
```

The command passed in the current shell with local Postgres ready.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/harness test -- ownerFileRecall goldenKrnBehaviorGate index` | passed | Owner-file recall helper, GoldenGate proof, and compiler planning path cover target owner files below roots. | Does not prove arbitrary external repo inference. |
| `pnpm --filter @krn/cli test -- runCli targetRepoHarnessSmoke` | passed | CLI plan output and target smoke rendering cover owner-file counts/readback. | Does not prove DB runtime by itself. |
| `pnpm typecheck` through `rtk proxy` | passed | Workspace TypeScript compiles with the new read-model type. | Does not prove behavior beyond type safety. |
| `pnpm db:ready` | passed | Current-shell local Postgres is reachable with 14/14 migrations and pgvector. | Does not prove another operator's DB state. |
| `pnpm db:smoke:target-repo-harness` | passed | Target harness smoke readbacks owner files alongside seeds/trust exclusions. | Does not prove V02-01 or product readiness. |

## Product Impact

Before this slice, target planning could surface `src`, `tests`, or `docs`, but
the exact file below those roots remained weak/unknown.

After this slice, target planning can surface exact owner files when the read
model provides them. If the read model does not provide exact owner-file
signals, the operator sees that limitation directly.

This makes the next target-like evidence loop less ambiguous without expanding
KRN into a crawler.

## What This Does Not Prove

- Real second-operator trial.
- Product readiness.
- Automatic discovery of owner files in arbitrary repositories.
- Correct owner-file inference without explicit read-model signal.
- Activation scoring quality at scale.

## Next Recommended Action

Continue to V03-03:

```txt
Target Evidence Capture And Readback Loop
```

The fixture now has source seeds, owner-file signals, and trust exclusions. The
next product proof should move a target-like run through evidence capture and
readback while preserving proof/non-proof boundaries and no automatic memory or
source mutation.

