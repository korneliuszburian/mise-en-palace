# Verification

Latest verified slice: MM-30 anti-memory enforcement.

Passed:

- Focused RED activation test failed because AntiMemoryRecord with
  `appliesTo: "brain-store"` did not block a memory activation candidate whose
  metadata key was `brain-store`.
- Focused GREEN activation test passed with 9 files and 33 tests.
- Focused harness typecheck passed.
- `pnpm typecheck` passed across all workspace packages.
- `pnpm test` passed across 45 files and 225 tests.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- `git diff --check` passed.
- Forbidden directory scan found no added dashboard/API/MCP/research/pattern
  surfaces.

MM-30 behavior proof:

- Anti-memory still blocks invalidated source-claim candidates.
- Anti-memory now also blocks explicit memory-record candidates by subject id,
  candidate metadata key, anti-memory key, or `appliesTo`.
- Blocked candidates carry `conflictReason: anti_memory_block` and
  `antiMemoryRecordId` metadata.
- Conflict sets include the blocked memory candidate id and anti-memory id.
- Context assembly can exclude the blocked memory candidate with unsafe
  anti-memory explanation.

Not proven by MM-30:

- Search-document anti-memory expansion.
- Observation-prefix anti-memory expansion.
- Fuzzy semantic anti-memory matching.
- Golden memory behavior runner.
- API/MCP/dashboard readiness.
