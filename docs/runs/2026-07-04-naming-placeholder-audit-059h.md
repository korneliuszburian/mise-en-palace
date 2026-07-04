# Naming Placeholder Audit

Date: 2026-07-04
Bead: `mise-en-palace-059h`

## Scope

Audited vague placeholder names such as `helper`, `utils`, `common`, `final`,
`new`, `normalized`, `manager`, `processor`, `data`, and `result` across active
TypeScript surfaces.

This slice intentionally avoided broad symbol churn. The first applied rename
set only touched internal CLI support files with small import surfaces.

## Must Rename

- `packages/cli/src/parseArgHelpers.ts` -> `packages/cli/src/parseCliOptions.ts`
  because the file owns shared CLI option/token parsing, not generic helpers.
- `packages/cli/src/doctorCheckHelpers.ts` ->
  `packages/cli/src/doctorReadinessSupport.ts` because the file supports doctor
  readiness checks with package-script and tree-reading helpers.

## Leave

- `packages/cli/src/__tests__/helpers/testRuntime.ts`: test-only helper
  directory is an established local convention and the file contains runtime
  stubs/factories, not a production abstraction.
- Local test variables named `result`: acceptable where the subject under test
  returns a result object and the scope is a single assertion block.
- Historical docs and archive mentions of `final`, `normalized`, or `helper`:
  not active code names and not worth churn in this slice.
- `normalized` in TypeScript boundary docs: allowed where it describes a real
  canonicalization pattern, not a placeholder name.

## Follow-Up

- Audit broad runtime symbols named `result` only where they cross function
  boundaries or obscure domain semantics. Do not rename local test results.
- Revisit `common`/`mappers`/`support` DB naming only with a concrete owner
  boundary slice; avoid package-wide vanity renames.
- Add a static naming invariant only if repeated regressions appear. Today the
  standards document plus Beads issue is enough.

## Verification

```sh
pnpm --filter @krn/cli test -- parse
pnpm run typecheck
pnpm quality:fallow:ci
git diff --check
```

## Non-Proof

This does not prove all naming in the repo is ideal, does not audit archived
ledgers, and does not justify broad public API renames.
