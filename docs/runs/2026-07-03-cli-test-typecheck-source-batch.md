# CLI Source Test Fixture Typecheck Batch

Date: 2026-07-03

## Scope

Add `packages/cli/src/__tests__/source.test.ts` to the scoped CLI test
typecheck gate:

```txt
packages/cli/tsconfig.tests.clean.json
```

This is a fixture-shape cleanup only. It does not change source command runtime
behavior or test assertions.

## Changes

- Added `source.test.ts` to the clean CLI test `tsc` include set.
- Added local source-command test stubs for the full `DatabaseRuntime` surface:
  - `unusedSourceRepository`
  - `createSourceHarnessRunRepository`
- Added the missing `listMemoryRecordsForProject` memory repository stub.
- Repaired optional record output under `exactOptionalPropertyTypes` by omitting
  undefined optional fields instead of returning `field: undefined`.

## Verification

```txt
rtk pnpm -C packages/cli typecheck:tests:clean
rtk pnpm --filter @krn/cli test -- source
```

Both passed locally before this report was written.

## Proof

This proves the source command test file now satisfies the scoped strict test
typecheck gate and still runs under Vitest.

## Non-Proof

This does not prove full CLI test typecheck, runtime command simplification,
DB runtime behavior, source authority correctness, or assertion-for-assertion
semantic review beyond the unchanged tests.

## Next

Finish the remaining CLI memory test fixture batch with the same bounded rule:
fix fixture shape only, no runtime command rewrite and no helper mega-fixture.
