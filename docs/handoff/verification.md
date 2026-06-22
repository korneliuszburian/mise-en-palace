# Verification

Latest verified slice: MM-30A anti-memory enforcement expansion.

Passed:

- Focused RED activation test failed because search documents explicitly linked
  to an invalidated source claim or memory record were not excluded.
- Focused RED observation-prefix test failed because an observation matching
  anti-memory `key/appliesTo` still entered the prefix.
- Focused GREEN activation test passed with 9 files and 35 tests.
- Focused GREEN observation-prefix test passed with 9 files and 35 tests.
- Focused harness typecheck passed.
- `pnpm typecheck` passed across all workspace packages.
- `pnpm test` passed across 45 files and 227 tests.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- `git diff --check` passed.
- Forbidden directory scan found no added dashboard/API/MCP/research/pattern
  surfaces.

MM-30A behavior proof:

- Anti-memory still blocks invalidated source-claim candidates.
- Anti-memory still blocks explicit memory-record candidates by subject id,
  candidate metadata key, anti-memory key, or `appliesTo`.
- Search-document candidates are blocked when metadata explicitly links them to
  an invalidated source claim or memory record.
- Observation prefix items are blocked when their id or subject explicitly
  matches anti-memory `key` or `appliesTo`.
- Blocked activation candidates carry `conflictReason: anti_memory_block` and
  `antiMemoryRecordId` metadata.
- Observation prefix exclusions carry `reason: anti_memory` before prefix text is
  rendered.

Not proven by MM-30A:

- Fuzzy semantic anti-memory matching.
- Memory abstain behavior.
- Golden memory behavior runner.
- API/MCP/dashboard readiness.
