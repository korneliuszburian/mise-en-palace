# Verification

Latest verified slice: MM-64 golden eval runner.

Passed:

- Preflight `git status --short --branch` showed branch `main` aligned with
  `origin/main` plus only the two raw research materials untracked.
- Preflight `git log --oneline -5` showed latest commit
  `61ea185 test(harness): add observation reflection golden cases`.
- RED focused `pnpm --filter @krn/harness test --
  goldenRunner.test.ts` failed because `goldenRunner.js` did not exist.
- GREEN focused `pnpm --filter @krn/harness test --
  goldenRunner.test.ts` passed with 13 files and 72 tests.
- Focused `pnpm --filter @krn/harness typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 55 files and 301 tests.
- Final `git diff --check` passed.
- Final forbidden surface/dependency scan found no forbidden packages,
  `.krn` runtime truth directory, forbidden dependencies, server/listener
  surface, pattern CLI surface, or MCP runtime surface.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:ready` passed with 11/11 migrations and pgvector available.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  with explicit intended files and verification flags passed with verdict
  `pass` and 0 findings.

MM-64 behavior proof:

- `runGoldenTaskFixtures` emits a pass report when every GoldenCase has an
  explicit passed behavior proof.
- The runner fails missing behavior proofs, so fixture shape alone cannot pass.
- The runner fails contract-invalid GoldenTask fixtures even when a proof is
  supplied.
- The runner is pure harness code and does not read files, write DB rows, call
  CLI, or create a broad benchmark lane.
- No DB schema/migration, repository, runner, CLI, Promptfoo export, broad
  benchmark suite, dashboard/API/MCP/server/plugin, source crawler, runtime
  markdown memory, or `.krn` runtime truth was added.

Not proven by MM-64:

- MM-65 optional Promptfoo-compatible export remains next.
- DB-backed GoldenTask storage remains deferred until a runner/promotion
  lifecycle proves it is necessary.
- The two raw research materials under `docs/materials/` remain untracked dirty
  context and are intentionally not committed.
