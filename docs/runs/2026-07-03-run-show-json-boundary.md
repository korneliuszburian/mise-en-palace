# Run Show JSON Boundary

Date: 2026-07-03

Bead: `mise-en-palace-or40`

## Scope

Harden the smallest run-show readback JSON boundary without rewriting
`krn run show`.

Applied retained pattern:

```txt
pattern:ts-boundary-unknown-first-result-state
```

## Change

`packages/cli/src/runShowReadback.ts` now narrows metadata objects with an
explicit `isMetadataRecord` guard instead of casting arbitrary objects to
`Record<string, unknown>`.

`packages/cli/src/__tests__/runRunShowCommand.test.ts` now uses the same
unknown-first shape for the JSON resource guard.

## Verification

```txt
pnpm --filter @krn/cli test -- runRunShowCommand
pnpm -C packages/cli typecheck
pnpm quality:fallow:ci
git diff --check
```

## Proof Boundary

Proves:

- run-show metadata record narrowing no longer relies on a production
  `as Record<string, unknown>` cast;
- existing run-show text and JSON behavior remains covered by the focused test
  suite;
- parsed JSON in tests is held as `unknown` before narrowing.

Does not prove:

- every CLI JSON boundary is clean;
- run-show command size is ideal;
- DB-backed run-show smoke quality beyond existing CI gates;
- KRN product readiness.
