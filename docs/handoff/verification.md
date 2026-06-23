# Verification

Latest verified slice: MM-61 memory behavior golden cases.

Passed:

- Preflight `git status --short --branch` showed branch `main` aligned with
  `origin/main` plus only the two raw research materials untracked.
- Preflight `git log --oneline -5` showed latest commit
  `7d97182 feat(schema): add golden task fixture parsing`.
- RED focused `pnpm --filter @krn/harness test --
  activation/goldenMemoryBehavior.test.ts` failed because the fixture declared
  only three of the required MM-61 memory behavior cases.
- GREEN focused `pnpm --filter @krn/harness test --
  activation/goldenMemoryBehavior.test.ts` passed with 10 files and 56 tests.
- Focused `pnpm --filter @krn/schema test -- goldenTask.test.ts` passed with
  2 files and 21 tests after the fixture was extended.
- Focused `pnpm --filter @krn/harness typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 51 files and 283 tests.
- Final `git diff --check` passed.
- Final forbidden surface/dependency scan found no forbidden packages,
  `.krn` runtime truth directory, forbidden dependencies, server/listener
  surface, pattern CLI surface, or MCP runtime surface.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:ready` passed with 11/11 migrations and pgvector available.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  with explicit intended files and verification flags passed with verdict
  `pass` and 0 findings.

MM-61 behavior proof:

- Fixture now declares five memory behavior cases:
  source-linked memory selection, stale memory exclusion, weak/stale
  abstention, temporal validity, and application guidance.
- Harness golden behavior test uses existing activation primitives, not a broad
  runner.
- Source-linked memory is included when it matches the memory query.
- Stale memory is excluded and context abstains when stale memory is the only
  candidate.
- Weak low-confidence memory produces abstention metadata instead of context.
- Current memory is selected over expired memory.
- Application guidance is preserved as ranked memory `expectedUse` and
  participates in lexical activation text.
- No DB schema/migration, repository, runner, CLI, Promptfoo export, broad
  benchmark suite, dashboard/API/MCP/server/plugin, source crawler, runtime
  markdown memory, or `.krn` runtime truth was added.

Not proven by MM-61:

- MM-61-lite early smoke cases for anti-memory and unsupported SourceDecision
  remain next.
- DB-backed GoldenTask storage remains deferred until a runner/promotion
  lifecycle proves it is necessary.
- The two raw research materials under `docs/materials/` remain untracked dirty
  context and are intentionally not committed.
