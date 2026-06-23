# Verification

Latest verified slice: MM-62 context/source/audit/TS boundary golden cases.

Passed:

- Preflight `git status --short --branch` showed branch `main` aligned with
  `origin/main` plus only the two raw research materials untracked.
- Preflight `git log --oneline -5` showed latest commit
  `330fc63 test(harness): add early golden memory smokes`.
- RED focused `pnpm --filter @krn/harness test --
  goldenBoundaryBehavior.test.ts` failed because the boundary fixture was
  missing.
- GREEN focused `pnpm --filter @krn/harness test --
  goldenBoundaryBehavior.test.ts` passed with 11 files and 64 tests.
- Focused `pnpm --filter @krn/schema test -- goldenTask.test.ts` passed with
  2 files and 22 tests after the boundary fixture used the existing
  `type_boundary` domain enum.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 53 files and 292 tests.
- Final `git diff --check` passed.
- Final forbidden surface/dependency scan found no forbidden packages,
  `.krn` runtime truth directory, forbidden dependencies, server/listener
  surface, pattern CLI surface, or MCP runtime surface.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:ready` passed with 11/11 migrations and pgvector available.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  with explicit intended files and verification flags passed with verdict
  `pass` and 0 findings.

MM-62 behavior proof:

- `boundary-behavior.json` declares behavior cases for context, source, audit,
  and type-boundary protection.
- Harness golden boundary tests use existing activation/audit primitives, not a
  broad runner.
- ContextROI keeps a small packet and marks extra candidates as `over_budget`.
- Source grounding audit emits a blocking finding when `doesNotProve` is
  missing from a source claim.
- Repo surface audit blocks rejected product surfaces such as Research Foundry.
- Type-safety audit flags unchecked `JSON.parse` runtime boundaries.
- No DB schema/migration, repository, runner, CLI, Promptfoo export, broad
  benchmark suite, dashboard/API/MCP/server/plugin, source crawler, runtime
  markdown memory, or `.krn` runtime truth was added.

Not proven by MM-62:

- MM-63 observation/reflection/anti-memory golden cases remain next.
- DB-backed GoldenTask storage remains deferred until a runner/promotion
  lifecycle proves it is necessary.
- The two raw research materials under `docs/materials/` remain untracked dirty
  context and are intentionally not committed.
