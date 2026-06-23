# Verification

Latest verified slice: MM-39 ActivationQuery model.

Passed:

- RED focused activation test failed because `buildActivationQuery` did not
  exist.
- GREEN focused `pnpm --filter @krn/harness test -- index.test.ts` passed with
  9 files and 41 tests.
- Focused `pnpm --filter @krn/harness typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 46 files and 246 tests.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- Final DB-aware `pnpm db:smoke:activation` passed with cleanup count `0`.
- Final `git diff --check` passed.
- Final forbidden surface scan found only existing guard/test/fixture
  references and no new runtime dashboard/API/MCP/research/pattern/source
  crawler surface.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  passed with verdict `pass` and 0 findings.

MM-39 behavior proof:

- `ActivationQuery` carries task id, project id, focus, needs, scope, budget,
  risk, text, and terms.
- `buildActivationQuery` can build a mixed memory/source/observation query from
  a TaskContract plus explicit budget/risk/extra terms.
- `buildMemoryQuery` and `buildSourceQuery` use the unified builder with
  focused defaults.

Not proven by MM-39:

- Hybrid candidate merge.
- Trust/temporal/anti-memory filter integration beyond the existing v1 path.
