# Verification

Latest verified slice: MM-42 ContextROI diversity and dedup.

Passed:

- RED focused activation test failed because ContextROI selected
  `memory-secondary` instead of the independent search support.
- GREEN focused `pnpm --filter @krn/harness test -- index.test.ts` passed with
  9 files and 44 tests.
- Focused `pnpm --filter @krn/harness typecheck` passed.
- Focused `pnpm --filter @krn/db typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 46 files and 249 tests.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- Final DB-aware `pnpm db:smoke:activation` passed with cleanup count `0`.
- Final `git diff --check` passed.
- Final forbidden surface scan found only existing guard/test/fixture
  references and no new runtime dashboard/API/MCP/research/pattern/source
  crawler surface.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  passed with verdict `pass` and 0 findings.

MM-42 behavior proof:

- `applyContextROI` deduplicates candidates by canonical source/memory subject.
- Requested diversity keeps memory/source/search support before filling
  remaining budget.
- Duplicate candidates remain explicit `duplicate` exclusions; non-selected
  but otherwise useful candidates remain `over_budget` exclusions.
- Activation smoke passed through the diversity-aware ContextROI policy:
  retrieval candidates `5`, activation decisions `5`, search candidates `1`,
  included decisions `2`, conflict decisions `1`, stale decisions `1`,
  context exclusions `3`.

Not proven by MM-42:

- Observation prefix integration.
- Raw evidence recall trigger from activation trace.
