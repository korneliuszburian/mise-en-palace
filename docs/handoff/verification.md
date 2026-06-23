# Verification

Latest verified slice: MM-44A observation prefix integration gate.

Passed:

- RED focused `pnpm --filter @krn/harness test -- index.test.ts` failed
  because an unsourced prefix-only context still assembled.
- GREEN focused `pnpm --filter @krn/harness test -- index.test.ts` passed with
  9 files and 47 tests.
- Focused `pnpm --filter @krn/harness typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 46 files and 252 tests.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- Final DB-aware `pnpm db:smoke:activation` passed with cleanup count `0` and
  reported `Observation prefix items: 1`.
- Final `git diff --check` passed.
- Final forbidden surface scan found only existing guard/test/fixture
  references and no new runtime dashboard/API/MCP/research/pattern/source
  crawler surface.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  passed with verdict `pass` and 0 findings.

MM-44A behavior proof:

- `assembleContext` rejects selected observation prefix metadata if any prefix
  item lacks source ranges.
- Rejection records `metadata.observationPrefixGate` with
  `missing_source_ranges` and rejected observation ids.
- A prefix-only context remains `abstained` when the prefix fails the
  source-range gate.
- Valid source-ranged prefix metadata remains available from MM-44, and
  activation smoke still reports `Observation prefix items: 1`.

Not proven by MM-44A:

- Actual raw evidence fetching from activation trigger metadata remains future
  scope.
- Activation before/after dogfood remains MM-45.
