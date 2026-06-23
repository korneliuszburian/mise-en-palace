# Verification

Latest verified slice: MM-60 GoldenTask storage or fixture strategy.

Passed:

- Preflight `git status --short --branch` showed branch `main` aligned with
  `origin/main` plus only the two raw research materials untracked.
- Preflight `git log --oneline -5` showed latest commit
  `39b96c6 feat(core): add golden task domain contracts`.
- RED focused `pnpm --filter @krn/schema test -- goldenTask.test.ts` failed
  because `./goldenTask.js` did not exist.
- GREEN focused `pnpm --filter @krn/schema test -- goldenTask.test.ts` passed
  with 2 files and 21 tests.
- Focused `pnpm --filter @krn/schema typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 51 files and 277 tests.
- Final `git diff --check` passed.
- Final forbidden surface/dependency scan found no forbidden packages,
  `.krn` runtime truth directory, forbidden dependencies, server/listener
  surface, pattern CLI surface, or MCP runtime surface.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:ready` passed with 11/11 migrations and pgvector available.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  with explicit intended files and verification flags passed with verdict
  `pass` and 0 findings.

MM-60 behavior proof:

- File-backed GoldenTask fixtures are the initial strategy.
- `tests/fixtures/golden-tasks/memory-behavior.json` is a seed/test fixture,
  not runtime memory or Memory Core.
- `parseGoldenTaskFixtures` validates unknown JSON fixture input at the schema
  boundary.
- Fixture loading is deterministic: tasks, cases, and protected failure modes
  are sorted by id.
- Shape-only fixtures without expected behavior source/evidence refs and
  protected failure modes are rejected.
- No DB schema/migration, repository, runner, CLI, Promptfoo export, broad
  benchmark suite, dashboard/API/MCP/server/plugin, source crawler, runtime
  markdown memory, or `.krn` runtime truth was added.

Not proven by MM-60:

- Golden memory behavior cases remain MM-61+.
- DB-backed GoldenTask storage remains deferred until a runner/promotion
  lifecycle proves it is necessary.
- The two raw research materials under `docs/materials/` remain untracked dirty
  context and are intentionally not committed.
