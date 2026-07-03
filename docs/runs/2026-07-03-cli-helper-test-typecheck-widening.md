# CLI Helper Test Typecheck Widening

Date: 2026-07-03

## Scope

Widen the scoped CLI test typecheck gate to include a small helper group:

```txt
packages/cli/src/__tests__/cliCommandRegistry.test.ts
packages/cli/src/__tests__/cliFileBoundary.test.ts
packages/cli/src/__tests__/databaseRuntime.test.ts
packages/cli/src/__tests__/projectResolutionFormat.test.ts
packages/cli/src/__tests__/retainedPatternSelection.test.ts
```

## Changes

- Added the helper group to `packages/cli/tsconfig.tests.clean.json`.
- Tightened `databaseRuntime.test.ts` mock typing for the optional
  `createSourceChunk` source repository port.
- Replaced a partial `{ id }` source chunk fixture with a full
  `SourceChunkRecord` fixture.

## Verification

```txt
rtk pnpm -C packages/cli typecheck:tests:clean
rtk pnpm --filter @krn/cli test -- cliCommandRegistry cliFileBoundary projectResolutionFormat retainedPatternSelection databaseRuntime
```

Both passed locally before this report was written.

## Proof

This proves the selected helper tests satisfy the scoped strict test typecheck
gate and still run under Vitest.

## Non-Proof

This does not prove full CLI test typecheck, runtime command simplification,
DB runtime behavior beyond existing tests, or command topology cleanup.

## Next

After CI, close `mise-en-palace-77of`. A later task can evaluate whether to add
small smoke/readiness tests or stop widening before it becomes broad cleanup
work.
