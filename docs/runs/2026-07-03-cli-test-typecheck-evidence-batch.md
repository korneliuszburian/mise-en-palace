# CLI Test Typecheck Evidence Batch

Date: 2026-07-03

## Scope

Beads: `mise-en-palace-i8m1`

Goal: expand the scoped CLI test typecheck gate by one remaining command batch.

## Changed

- Added `packages/cli/src/__tests__/evidence.test.ts` to
  `packages/cli/tsconfig.tests.clean.json`.
- Typed the evidence harness-run repository as both compiler and runtime readback
  support.
- Added read-only throwing source/memory stubs required by `DatabaseRuntime`.

## Proof

Commands run:

```sh
rtk pnpm -C packages/cli typecheck:tests:clean
rtk pnpm -C packages/cli typecheck
rtk pnpm --filter @krn/cli test -- evidence
```

All passed locally.

## Non-Proof

- This does not add full CLI test typecheck.
- It does not fix memory or source fixture-shape debt.
- It does not change evidence runtime behavior or assertions.
