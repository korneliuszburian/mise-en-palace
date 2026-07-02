# Harness Root Test Topology

Date: 2026-07-02
Task: `mise-en-palace-o5xg`

## Scope

Moved only the root harness tests that are part of the `eval:brain-battle:smoke`
filter contract into `packages/harness/src/__tests__/`.

Moved:

- `activePlanInvariants.test.ts`
- `brainBattleMatrixInvariants.test.ts`
- `contextHygieneInvariants.test.ts`
- `goldenKrnBehaviorGate.test.ts`
- `patternChainInvariants.test.ts`
- `skillInvariants.test.ts`
- `sourceMapInvariants.test.ts`
- `typescriptBoundaryInvariants.test.ts`

Preserved:

- file basenames;
- test titles;
- smoke filter names;
- runtime harness source files;
- invariant semantics.

## Count Delta

- Harness root colocated tests before this slice: 21.
- Harness root colocated tests after this slice: 13.
- Harness smoke-filter tests now under `src/__tests__`: 8.

## Active Evidence Ref Updates

Updated active matrix/pattern/brain-knowledge evidence refs to point at the new
`packages/harness/src/__tests__/...` paths.

Historical review reports and historical ledgers were intentionally not
rewritten.

## Rejected Moves

Left the remaining harness root tests in place for later bounded slices:

- golden/promptfoo/runner tests;
- brain knowledge read-model tests;
- security/ADR/type-target pattern tests;
- broad integration tests;
- package index test.

Those have different fixture or ownership risk and should not be bundled into a
smoke-filter topology migration.

## Verification

Passed before commit:

```sh
pnpm --filter @krn/harness test -- goldenKrnBehaviorGate activePlanInvariants contextHygieneInvariants sourceMapInvariants skillInvariants patternChainInvariants brainBattleMatrixInvariants typescriptBoundaryInvariants
pnpm eval:brain-battle:smoke
pnpm --filter @krn/cli test -- runInitCommand
pnpm --filter @krn/harness test -- ownerFileRecall
pnpm -C packages/harness typecheck
pnpm -C packages/cli typecheck
pnpm typecheck
pnpm test
pnpm quality:fallow:ci
git diff --check
```

The first focused smoke run failed on a hardcoded stale path to
`packages/harness/src/sourceMapInvariants.test.ts`; this slice fixed it to
`packages/harness/src/__tests__/sourceMapInvariants.test.ts` and reran the
focused smoke successfully.

The first full `eval:brain-battle:smoke` run then failed on stale CLI
source-seed candidates for `sourceMapInvariants.test.ts` and
`skillInvariants.test.ts`; this slice updated the detector and owner-file recall
fixtures to the new `src/__tests__` paths and reran the full smoke successfully.

## Proof

- The moved harness tests are still discovered by the same Vitest filters.
- `eval:brain-battle:smoke` harness filter names remain compatible because
  basenames and test names were preserved.
- CLI source-seed detection and activation owner-file recall now point to the
  moved invariant owner files.
- Active evidence refs no longer point to the old root paths for these moved
  smoke-filter tests.

## Does Not Prove

- Harness topology is complete.
- CLI, DB, or remaining harness root tests are safe to move.
- Test files are included in package `tsc`; current package typecheck proves
  runtime harness source still typechecks.
- Naming has been shortened.
- KRN product behavior improved.
