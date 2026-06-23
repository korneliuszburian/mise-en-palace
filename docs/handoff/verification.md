# Verification

Latest verified slice: MM-59 GoldenTask domain model.

Passed:

- Preflight `git status --short --branch` showed branch `main` aligned with
  `origin/main` plus only the two raw research materials untracked.
- Preflight `git log --oneline -5` showed latest commit
  `9db4306 feat(cli): dogfood feedback capture`.
- RED focused `pnpm --filter @krn/core test -- goldenTask.test.ts` failed
  because `./goldenTask.js` did not exist.
- GREEN focused `pnpm --filter @krn/core test -- goldenTask.test.ts` passed
  with 7 files and 37 tests.
- Focused `pnpm --filter @krn/core typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 50 files and 275 tests.
- Final `git diff --check` passed.
- Final forbidden surface/dependency scan found no forbidden packages,
  `.krn` runtime truth directory, forbidden dependencies, server/listener
  surface, pattern CLI surface, or MCP runtime surface.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:ready` passed with 11/11 migrations and pgvector available.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  with explicit intended files and verification flags passed with verdict
  `pass` and 0 findings.

MM-59 behavior proof:

- RED focused `pnpm --filter @krn/core test -- goldenTask.test.ts` failed
  because `./goldenTask.js` did not exist.
- GREEN focused `pnpm --filter @krn/core test -- goldenTask.test.ts` passed
  with 7 files and 37 tests.
- Focused `pnpm --filter @krn/core typecheck` passed.
- `GoldenTask`, `GoldenCase`, `ExpectedBehavior`, and
  `ProtectedFailureMode` are pure core contracts.
- `validateGoldenTaskContract` accepts a behavior-focused golden case with
  expected behavior, evidence refs, source refs, and protected failure modes.
- The validator rejects shape-only artifact-theater cases without expected
  behavior subject/rationale/evidence, protected failure modes, or source refs.
- The validator rejects private reasoning metadata such as `chainOfThought`.
- No storage/fixture strategy, DB schema/migration, repository, runner, CLI,
  Promptfoo export, broad benchmark suite, dashboard/API/MCP/server/plugin, or
  source crawler surface was added.

Not proven by MM-59:

- GoldenTask storage or fixture strategy remains MM-60.
- Golden memory behavior cases remain MM-61+.
- The two raw research materials under `docs/materials/` remain untracked dirty
  context and are intentionally not committed.
