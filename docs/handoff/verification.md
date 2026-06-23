# Verification

Latest verified slice: MM-40 hybrid candidate merge.

Passed:

- RED focused activation test failed because `mergeActivationCandidates` did
  not exist.
- GREEN focused `pnpm --filter @krn/harness test -- index.test.ts` passed with
  9 files and 42 tests.
- Focused `pnpm --filter @krn/harness typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 46 files and 247 tests.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- Final DB-aware `pnpm db:smoke:activation` passed with cleanup count `0`.
- Final `git diff --check` passed.
- Final forbidden surface scan found only existing guard/test/fixture
  references and no new runtime dashboard/API/MCP/research/pattern/source
  crawler surface.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  passed with verdict `pass` and 0 findings.

MM-40 behavior proof:

- `mergeActivationCandidates` merges a SourceClaim candidate and linked
  SearchDocument candidate into one canonical source candidate.
- Merged candidates preserve merged candidate ids, merged kinds,
  searchDocumentIds, lexical score, and graph score signals.
- `retrieveActivationCandidates` now returns merged candidates before conflict,
  trust, temporal, and context ROI filters run.
- Activation smoke passed after readback counted merged search signals through
  `metadata.searchDocumentIds`: retrieval candidates `5`, activation decisions
  `5`, search candidates `1`, context exclusions `3`.

Not proven by MM-40:

- Trust/temporal/anti-memory filter integration beyond the existing v1 path.
- Observation prefix integration.
