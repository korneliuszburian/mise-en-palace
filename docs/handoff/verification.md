# Verification

Latest verified slice: QG-03 zombie/dead-code/export-surface audit.

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
- QG-04 through QG-06 remain next.
- MM-66 EvalCandidate promotion gate remains blocked behind QG.
- DB-backed GoldenTask storage remains deferred until a runner/promotion
  lifecycle proves it is necessary.
- The two raw research materials under `docs/materials/` remain untracked dirty
  context and are intentionally not committed.
