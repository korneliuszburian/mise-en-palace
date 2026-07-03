# Run-Show DB Smoke

Date: 2026-07-03
Beads: `mise-en-palace-ij82`

## Change

Added `krn db smoke run-show` and root `pnpm db:smoke:run-show`.
The smoke seeds a persisted harness run through the existing DB dev scaffold,
invokes the real `runRunShowCommand` against Postgres, checks both text and JSON
readback, and cleans marker rows.

## Proof

- `pnpm db:smoke:run-show`
- `pnpm --filter @krn/cli test -- db parseDbArgs runDbSmokeCommand`
- `pnpm -C packages/cli typecheck`
- `pnpm -C packages/db typecheck`

Second opinion:

- `second-opinion-claude` returned `approve_with_fixes` LOW.
- Accepted finding F1: error-path cleanup could leave marker rows if readback
  mismatch threw before the success cleanup call.
- Fix: `runShowDbSmoke.ts` now runs cleanup in `finally` unless success cleanup
  already completed.

## Boundary

Proves run-show can read a DB-backed persisted run through the real CLI command
path without mutation and with cleanup.

Does not prove run-show projection quality beyond the existing run-show tests,
nor broad DB smoke coverage for every command.
