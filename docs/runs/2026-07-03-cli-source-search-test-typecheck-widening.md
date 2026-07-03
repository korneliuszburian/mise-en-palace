# CLI Source Search Test Typecheck Widening

Date: 2026-07-03

## Scope

Widen the scoped CLI test typecheck gate to include a source command batch:

```txt
packages/cli/src/__tests__/runSourceClaimEdgesCommand.test.ts
packages/cli/src/__tests__/runSourceSearchCommand.test.ts
```

`runSourceArtifactPreviewCommand.test.ts` is intentionally left out because it is
large enough to deserve a separate slice.

## Changes

- Added the batch to `packages/cli/tsconfig.tests.clean.json`.
- Kept runtime command code and assertions unchanged.
- Added required read-only `listClaimsForProject` stubs to source repository
  test doubles.
- Tightened the source-search test fixture so it returns mutable lexical search
  arrays and a non-optional `CreateSourceSearchDatabaseRuntime`.
- Removed an unused test-local command type alias exposed by the stricter gate.

## Type Boundary

Boundary classification: test fixture.

`ts-boundary-unknown-first-result-state` does not apply: this slice does not
introduce a new external input boundary. It tightens test doubles to match the
runtime repository contracts.

Public type changes: none.

Type-safety exceptions: none.

## Verification

```txt
rtk pnpm -C packages/cli typecheck:tests:clean
rtk pnpm --filter @krn/cli test -- runSourceSearchCommand runSourceClaimEdgesCommand
```

Both passed locally before this report was written.

## Proof

This proves the selected source-search and source-claim-edges command tests
satisfy the scoped strict test typecheck gate and still run under Vitest.

## Non-Proof

This does not prove full CLI test typecheck, source artifact preview readiness,
runtime command simplification, source truth, or retrieval quality.

## Next

After CI, close `mise-en-palace-xz8v` or create a narrower follow-up for the
remaining command tests.
