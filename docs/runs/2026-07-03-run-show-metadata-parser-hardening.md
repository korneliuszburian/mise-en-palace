# Run-Show Metadata Parser Hardening

Date: 2026-07-03.

Beads: `mise-en-palace-oez2`.

## Change

`krn run show` now parses metadata record values through an explicit
unknown-first result state before reading known metadata groups. Malformed
metadata falls back to existing safe readback behavior instead of being treated
as a trusted object.

The output contract is preserved. The new regression proves malformed
`projectResolution`, changed-file classification, and candidate reviewability
metadata do not leak invalid values into JSON readback.

## Pattern

Applied retained pattern `ts-boundary-unknown-first-result-state` from brain
knowledge readback.

## Verification

- `pnpm --filter @krn/cli test -- runRunShowCommand`
- `pnpm --filter @krn/cli typecheck:tests:clean`
- `pnpm -w typecheck`
- `pnpm quality:fallow:ci`
- `git diff --check`

## Boundary

Proves: run-show metadata record groups are narrowed before known metadata
readback, and malformed readback degrades to explicit fallback states.

Does not prove: every CLI command has equivalent metadata parsers, DB data is
clean, or run-show proves command execution/source truth/product readiness.
