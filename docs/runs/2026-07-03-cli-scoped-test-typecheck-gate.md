# CLI Scoped Test Typecheck Gate

Date: 2026-07-03

## Scope

Beads: `mise-en-palace-v2c0`

Goal: add a small active `tsc` gate for the CLI tests that are already clean
enough to typecheck after the root test topology drain.

## Changed

- Added `packages/cli/tsconfig.tests.clean.json`.
- Added `pnpm -C packages/cli typecheck:tests:clean`.
- Wired the scoped gate into `eval:brain-battle:smoke` so CI exercises it.

The first attempted include set covered more migrated CLI tests and failed on
old fixture shape debt: incomplete `DatabaseRuntime` stubs, incomplete
observation/reflection records, and exact-optional-property mismatches. The
merged gate intentionally covers only the first strict subset:

```txt
packages/cli/src/__tests__/brain.test.ts
packages/cli/src/__tests__/db.test.ts
packages/cli/src/__tests__/doctor.test.ts
packages/cli/src/__tests__/heartbeat.test.ts
```

## Proof

Commands run:

```sh
rtk pnpm -C packages/cli typecheck:tests:clean
rtk pnpm -C packages/cli typecheck
rtk pnpm --filter @krn/cli test -- brain db doctor heartbeat
```

All passed locally.

## Non-Proof

- This is not full CLI test typecheck.
- It does not prove the source, evidence, memory, codex, observe, or reflect
  test fixtures satisfy strict `tsc` yet.
- It does not change runtime CLI behavior or simplify large command files.

## Next

Add another bounded CLI test typecheck slice only after fixing fixture shapes
without casts or runtime behavior changes. The next batch should be selected by
actual `tsc` readiness, not by file count.
