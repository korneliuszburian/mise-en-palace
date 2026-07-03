# CLI Init/Observe/Reflect Test Typecheck Widening

Date: 2026-07-03

## Scope

Widen the scoped CLI test typecheck gate to include one command-family batch:

```txt
packages/cli/src/__tests__/runInitCommand.test.ts
packages/cli/src/__tests__/runObserveCommand.test.ts
packages/cli/src/__tests__/runReflectCommand.test.ts
```

## Changes

- Added the batch to `packages/cli/tsconfig.tests.clean.json`.
- Kept runtime command code and assertions unchanged.
- Repaired the observe command test fixture so mocked `addItems` returns full
  `ObservationItem` source ranges with deterministic IDs, rather than
  returning create-input ranges.

## Type Boundary

Boundary classification: test fixture.

`ts-boundary-unknown-first-result-state` does not apply: this slice does not
introduce a new external input boundary. It tightens a test mock so its returned
domain records match the runtime repository contract.

Public type changes: none.

Type-safety exceptions: none.

## Verification

```txt
rtk pnpm -C packages/cli typecheck:tests:clean
rtk pnpm --filter @krn/cli test -- runInitCommand runObserveCommand runReflectCommand
```

Both passed locally before this report was written.

## Proof

This proves the selected init/observe/reflect command tests satisfy the scoped
strict test typecheck gate and still run under Vitest.

## Non-Proof

This does not prove full CLI test typecheck, runtime command simplification,
all command-family fixtures, or command topology cleanup.

## Next

After CI, close `mise-en-palace-9mok` or create a narrower follow-up for the
remaining large command tests.
