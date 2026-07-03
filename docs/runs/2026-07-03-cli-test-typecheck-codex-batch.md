# CLI Test Typecheck Codex Batch

Date: 2026-07-03

## Scope

Beads: `mise-en-palace-l5l1`

Goal: expand the scoped CLI test typecheck gate by one small strict batch.

## Changed

- Added `packages/cli/src/__tests__/codex.test.ts` to
  `packages/cli/tsconfig.tests.clean.json`.
- Tightened the codex test fixture to match runtime types:
  - removed stale `OperatorIntent.updatedAt`;
  - added read-only throwing source repository stubs;
  - added read-only throwing harness-run write stubs;
  - added missing `listMemoryRecordsForProject` throwing memory stub.

## Proof

Commands run:

```sh
rtk pnpm -C packages/cli typecheck:tests:clean
rtk pnpm -C packages/cli typecheck
rtk pnpm --filter @krn/cli test -- codex
```

All passed locally.

## Non-Proof

- This does not add full CLI test typecheck.
- It does not fix evidence, memory, source, observe, or reflect fixture-shape
  debt.
- It does not change codex runtime behavior or assertions.

## Next

Pick the next smallest failing fixture batch by `tsc` output. Do not use casts
to silence fixture mismatches; either satisfy the runtime interface or leave the
file outside the scoped gate.
