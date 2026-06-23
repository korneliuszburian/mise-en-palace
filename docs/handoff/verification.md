# Verification

Latest verified slice: MM-65 optional Promptfoo-compatible export.

Passed:

- Preflight `git status --short --branch` showed branch `main` aligned with
  `origin/main` plus only the two raw research materials untracked.
- Preflight `git log --oneline -5` showed latest commit
  `f3cbea6 feat(harness): add promptfoo golden export`.
- MM-65 final verification passed before commit `f3cbea6`: `pnpm typecheck`,
  `pnpm test` with 56 files / 303 tests, `pnpm db:ready`, `git diff --check`,
  forbidden surface/dependency scan, and `krn audit slice --fail-on warning`.

QG audit facts gathered after MM-65:

- Test files are currently colocated under `packages/*/src/**/*.test.ts`.
- Current strict TS settings are strong but not yet enforced by a single
  repo-wide quality gate document and automated audit.
- `README.md` was stale relative to the MM-65 implementation state.
- Existing audits do not yet prove absence of zombie exports, dead code, stale
  public docs, broad barrel overexposure, test-helper runtime leaks, or
  placeholder adapters.

Not proven by MM-65/QG pre-audit:

- Official Promptfoo integration is not adopted or rejected yet.
- QG-00 through QG-06 remain next.
- MM-66 EvalCandidate promotion gate remains blocked behind QG.
- DB-backed GoldenTask storage remains deferred until a runner/promotion
  lifecycle proves it is necessary.
- The two raw research materials under `docs/materials/` remain untracked dirty
  context and are intentionally not committed.
