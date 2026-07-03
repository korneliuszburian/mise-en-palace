# CLI Memory Test Fixture Typecheck Batch

Date: 2026-07-03

## Scope

Add `packages/cli/src/__tests__/memory.test.ts` to the scoped CLI test
typecheck gate:

```txt
packages/cli/tsconfig.tests.clean.json
```

This is fixture-shape cleanup only. It does not change memory command runtime
behavior or test assertions.

## Changes

- Added `memory.test.ts` to the clean CLI test `tsc` include set.
- Added local memory-command test stubs for the full `DatabaseRuntime` surface:
  - `unusedSourceRepository`
  - `createMemoryHarnessRunRepository`
- Added the missing `listMemoryRecordsForProject` memory repository stub.
- Completed partial per-test memory repository stubs with `unusedMemoryRepository`
  spreads.
- Repaired `MemoryCandidate`, `MemoryRecord`, `MemoryApplication`, and
  `MemoryFeedbackEvent` fixture records under `exactOptionalPropertyTypes`.

## Verification

```txt
rtk pnpm -C packages/cli typecheck:tests:clean
rtk pnpm --filter @krn/cli test -- memory
```

Both passed locally before this report was written.

## Proof

This proves the memory command test file now satisfies the scoped strict test
typecheck gate and still runs under Vitest.

## Non-Proof

This does not prove full CLI test typecheck, runtime command simplification,
DB runtime behavior, memory governance correctness, or assertion-for-assertion
semantic review beyond the unchanged tests.

## Next

Wait for CI for this slice, then close the Beads issue. A separate follow-up can
decide whether to widen the scoped test typecheck gate to parse/helper tests.
