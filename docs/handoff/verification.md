# Verification

Latest verified slice: MM-41 activation filter pass.

Passed:

- RED focused activation test failed because `applyActivationFilters` did not
  exist.
- GREEN focused `pnpm --filter @krn/harness test -- index.test.ts` passed with
  9 files and 43 tests.
- Focused `pnpm --filter @krn/harness typecheck` passed.
- Focused `pnpm --filter @krn/db typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 46 files and 248 tests.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- Final DB-aware `pnpm db:smoke:activation` passed with cleanup count `0`.
- Final `git diff --check` passed.
- Final forbidden surface scan found only existing guard/test/fixture
  references and no new runtime dashboard/API/MCP/research/pattern/source
  crawler surface.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  passed with verdict `pass` and 0 findings.

MM-41 behavior proof:

- `applyActivationFilters` composes anti-memory conflict detection, trust
  filtering, and temporal/invalidation filtering after candidate merge.
- Merged source/search candidates blocked by anti-memory remain one excluded
  candidate with `metadata.searchDocumentIds`.
- Expired memory is excluded as `stale`; low-confidence memory is excluded as
  `low_trust`.
- Activation smoke passed through the unified filter pass: retrieval candidates
  `5`, activation decisions `5`, search candidates `1`, included decisions
  `2`, conflict decisions `1`, stale decisions `1`, context exclusions `3`.

Not proven by MM-41:

- Observation prefix integration.
- ContextROI/diversity rewrite beyond the existing v1 path.
