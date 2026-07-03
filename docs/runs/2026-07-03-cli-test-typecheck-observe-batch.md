# CLI Test Typecheck Observe Batch

Date: 2026-07-03

## Scope

Beads: `mise-en-palace-kg9z`

Goal: expand the scoped CLI test typecheck gate by one remaining command batch.

## Changed

- Added `packages/cli/src/__tests__/observe.test.ts` to
  `packages/cli/tsconfig.tests.clean.json`.
- Added local typed helpers for observation group/item test doubles.
- Replaced partial `{ id }` observation item returns with complete
  `ObservationItem` records.
- Removed one stale unused observation fixture.

## Proof

Commands run:

```sh
rtk pnpm -C packages/cli typecheck:tests:clean
rtk pnpm --filter @krn/cli test -- observe
```

Both passed locally.

## Non-Proof

- This does not add full CLI test typecheck.
- It does not fix evidence, memory, or source fixture-shape debt.
- It does not change observe runtime behavior or assertions.
