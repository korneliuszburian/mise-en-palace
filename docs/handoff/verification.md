# Verification

Latest verified slice: QG-04B command parser modularization.

Passed:

- QG-00 preflight `git status --short --branch` showed branch `main` aligned
  with `origin/main` plus only the two raw research materials untracked.
- QG-00 preflight `git log --oneline -8` showed latest commit
  `7e0c6b8 docs(memory): add blocking quality correction gate`.
- QG-00 preflight `git rev-parse HEAD` returned
  `7e0c6b8691c79e4ccba85bae9ac004f2fe63b5ad`.
- `pnpm typecheck` passed.
- `pnpm test` passed with 56 colocated test files.
- QG-00 inventory recorded package/test/export/script/docs/non-goal facts at
  `docs/plans/memory-ideal-state/QG-00-REPO-INVENTORY.md`.
- QG-01 focused RED test failed before implementation because
  `runBoundaryAudit` did not catch production imports from test modules, public
  test-helper exports, or production fixture imports.
- QG-01 focused GREEN test passed after boundary audit enforcement was added.
- QG-02 focused RED test failed before implementation because
  `runTypeSafetyAudit` did not catch double assertions, `@ts-ignore`, or
  undocumented `@ts-expect-error`.
- QG-02 focused GREEN test passed after type-safety audit enforcement was
  added.
- QG-02 records general code quality, naming, monolith-boundary, export,
  comments, test, and error-handling rules in
  `docs/standards/code-quality.md`.
- QG-03 `pnpm dlx knip --reporter json` initially found unused exports/types,
  duplicate activation aliases, and one fixture file finding.
- QG-03 cleanup removed clear zombie exports and converted local-only exported
  types to local types.
- QG-03 post-cleanup Knip reported only the accepted target-repo fixture file.
- QG-04 line-count scan identified the largest production files:
  `parseArgs.ts`, `runDoctorCommand.ts`, `auditChecks.ts`,
  `DrizzleObservationRepository.ts`, and `mappers.ts`.
- QG-04 duplicate-helper scan identified repeated CLI filesystem/JSON helpers,
  memory confidence parsing, schema metadata guards, and review signal
  normalization.
- QG-04 removed low-risk `placeholder` vocabulary from retrieval substrate
  smoke code and mapper tests.
- QG-04 focused `pnpm --filter @krn/db test -- mappers` passed with 23 files
  and 65 tests.
- QG-04 full `pnpm typecheck` passed.
- QG-04 full `pnpm test` passed.
- QG-04 `git diff --check` passed.
- QG-04 stale status scan passed.
- QG-04 `krn audit slice --fail-on warning` passed with verdict `pass` and 0
  findings.
- QG-04 recorded repair slices QG-04A through QG-04H at
  `docs/plans/memory-ideal-state/QG-04-SMELL-BLOAT-AUDIT.md`.
- QG-04A RED focused `pnpm --filter @krn/cli test -- cliFileBoundary` failed
  because `./cliFileBoundary.js` did not exist.
- QG-04A GREEN focused `pnpm --filter @krn/cli test -- cliFileBoundary` passed
  with 7 files and 96 tests.
- QG-04A focused `pnpm --filter @krn/cli test` passed with 7 files and 96
  tests.
- QG-04A focused `pnpm --filter @krn/cli typecheck` passed.
- QG-04A full `pnpm typecheck` passed.
- QG-04A full `pnpm test` passed.
- QG-04A duplicate-helper scan found only canonical helper definitions in
  `packages/cli/src/cliFileBoundary.ts`.
- QG-04A `git diff --check` passed.
- QG-04A forbidden directory scan found no added forbidden surfaces.
- QG-04A stale status scan passed.
- QG-04A `krn audit slice --fail-on warning` passed with verdict `pass` and 0
  findings.
- QG-04B RED focused `pnpm --filter @krn/cli test -- parseMemoryArgs` failed
  because `./parseMemoryArgs.js` did not exist.
- QG-04B GREEN focused `pnpm --filter @krn/cli test -- parseMemoryArgs`
  passed with 19 files and 129 tests.
- QG-04B focused `pnpm --filter @krn/cli typecheck` passed.
- QG-04B focused `pnpm --filter @krn/cli test` passed with 19 files and 129
  tests.
- QG-04B full `pnpm typecheck` passed.
- QG-04B full `pnpm test` passed.
- QG-04B `git diff --check` passed.
- QG-04B forbidden directory scan found no added forbidden surfaces.
- QG-04B `krn audit slice --since origin/main --fail-on warning` passed with
  verdict `pass` and 0 findings.
- QG-04B reduced `packages/cli/src/parseArgs.ts` to 379 lines and moved the
  remaining `memory` command-family grammar to
  `packages/cli/src/parseMemoryArgs.ts`.
- QG-04C RED focused `pnpm --filter @krn/cli test -- doctorRepoChecks` failed
  because `./doctorRepoChecks.js` did not exist.
- QG-04C GREEN focused `pnpm --filter @krn/cli test -- doctorRepoChecks`
  passed with 20 files and 131 tests.
- QG-04C RED focused `pnpm --filter @krn/cli test -- doctorStaticChecks`
  failed because `./doctorStaticChecks.js` did not exist.
- QG-04C GREEN focused `pnpm --filter @krn/cli test -- doctorStaticChecks`
  passed with 21 files and 133 tests.
- QG-04C focused `pnpm --filter @krn/cli typecheck` passed.
- QG-04C focused `pnpm --filter @krn/cli test` passed with 21 files and 133
  tests.
- QG-04C partial extraction reduced `packages/cli/src/runDoctorCommand.ts` from
  2086 to 1688 lines by moving repo/static read-only checks to focused modules.

QG audit facts gathered during QG-00:

- Test files are currently colocated under `packages/*/src/**/*.test.ts`.
- Current strict TS settings are strong but not yet enforced by a single
  repo-wide quality gate document and automated audit.
- `README.md` was stale relative to the MM-65 implementation state.
- Existing audits do not yet prove absence of zombie exports, dead code, stale
  public docs, broad barrel overexposure, test-helper runtime leaks, or
  placeholder adapters.

Not proven by MM-65/QG pre-audit:

- Official Promptfoo integration is not adopted or rejected yet.
- QG-04C through QG-06 remain next.
- MM-66 EvalCandidate promotion gate remains blocked behind QG.
- DB-backed GoldenTask storage remains deferred until a runner/promotion
  lifecycle proves it is necessary.
- The two raw research materials under `docs/materials/` remain untracked dirty
  context and are intentionally not committed.
