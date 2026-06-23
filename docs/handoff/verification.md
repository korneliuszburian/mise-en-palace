# Verification

Latest verified slice: MM-61-lite early golden memory smoke cases.

Passed:

- Preflight `git status --short --branch` showed branch `main` aligned with
  `origin/main` plus only the two raw research materials untracked.
- Preflight `git log --oneline -5` showed latest commit
  `0f54a84 test(harness): add golden memory behavior cases`.
- RED focused `pnpm --filter @krn/harness test --
  activation/goldenMemoryBehavior.test.ts` failed because the fixture lacked
  the required MM-61-lite smoke cases.
- GREEN focused `pnpm --filter @krn/harness test --
  activation/goldenMemoryBehavior.test.ts` passed with 10 files and 59 tests.
- Focused `pnpm --filter @krn/schema test -- goldenTask.test.ts` passed with
  2 files and 21 tests after deterministic task/case expectations were
  updated for the source smoke fixture.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 52 files and 286 tests.
- Final `git diff --check` passed.
- Final forbidden surface/dependency scan found no forbidden packages,
  `.krn` runtime truth directory, forbidden dependencies, server/listener
  surface, pattern CLI surface, or MCP runtime surface.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:ready` passed with 11/11 migrations and pgvector available.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  with explicit intended files and verification flags passed with verdict
  `pass` and 0 findings.

MM-61-lite behavior proof:

- Fixture now declares early smoke cases for stale memory abstention,
  anti-memory blocking, and unsupported SourceDecision rejection in addition
  to the existing MM-61 memory behavior cases.
- Harness golden behavior test uses existing activation primitives, not a broad
  runner.
- Stale memory is excluded and context abstains instead of confidently using it.
- Active anti-memory blocks a tempting high-confidence stale memory pattern
  by explicit key/appliesTo conflict evidence.
- Source grounding audit emits a blocking finding for SourceDecision records
  that lack a linked SourceClaim.
- No DB schema/migration, repository, runner, CLI, Promptfoo export, broad
  benchmark suite, dashboard/API/MCP/server/plugin, source crawler, runtime
  markdown memory, or `.krn` runtime truth was added.

Not proven by MM-61-lite:

- MM-62 context/source/audit/TS boundary golden cases remain next.
- DB-backed GoldenTask storage remains deferred until a runner/promotion
  lifecycle proves it is necessary.
- The two raw research materials under `docs/materials/` remain untracked dirty
  context and are intentionally not committed.
