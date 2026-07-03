# Run-Show Readback Boundary Split

Date: 2026-07-03
Beads: `mise-en-palace-h1b4`

## Change

`runRunShowCommand.ts` is now a thin read-only runner. DB runtime setup, missing
run handling, and `json`/`text` dispatch stay in the command module. Run
readback projection, metadata narrowing, JSON resource shaping, and text
formatting moved to `runShowReadback.ts`.

## Proof

- `pnpm --filter @krn/cli test -- runRunShowCommand`
- `pnpm -C packages/cli typecheck`
- `pnpm --filter @krn/cli typecheck:tests:clean`
- `pnpm -w typecheck`
- `pnpm quality:fallow:ci`
- `pnpm --filter @krn/harness test -- contextHygieneInvariants`
- `git diff --check`

## Boundary

Proves the existing run-show output contract still passes focused CLI tests and
that the CLI package/test typecheck accepts the split.

Does not prove DB runtime smoke coverage, new run-readback behavior, or run
projection quality beyond the existing run-show contract tests.
