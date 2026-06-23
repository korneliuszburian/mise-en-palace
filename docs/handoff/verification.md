# Verification

Latest verified slice: MM-43 activation raw evidence recall trigger.

Passed:

- GREEN focused `pnpm --filter @krn/harness test -- index.test.ts` passed with
  9 files and 45 tests.
- Focused `pnpm --filter @krn/harness typecheck` passed.
- Focused `pnpm --filter @krn/db typecheck` passed.
- Focused `pnpm --filter @krn/cli typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 46 files and 250 tests.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- Final DB-aware `pnpm db:smoke:activation` passed with cleanup count `0`.
- Final `git diff --check` passed.
- Final forbidden surface scan found only existing guard/test/fixture
  references and no new runtime dashboard/API/MCP/research/pattern/source
  crawler surface.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  passed with verdict `pass` and 0 findings.

MM-43 behavior proof:

- `buildActivationRawRecallTriggers` creates trigger records for exact-proof
  source/search inclusions and low-trust inclusions.
- `persistActivationTrace` records raw recall requirements on inclusion
  activation decisions and summarizes trigger count/details on retrieval run
  metadata.
- Activation smoke passed and reported `Raw evidence recall triggers: 1`.
- Retrieval candidates `5`, activation decisions `5`, search candidates `1`,
  included decisions `2`, conflict decisions `1`, stale decisions `1`, context
  exclusions `3`, cleanup count `0`.

Not proven by MM-43:

- Observation prefix integration.
- Actual raw evidence fetching from activation trigger metadata.
