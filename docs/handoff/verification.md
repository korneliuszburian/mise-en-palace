# Verification

Latest verified slice: MM-28 memory invalidation/versioning behavior.

Passed:

- Focused RED DB repository exposure test failed because
  `invalidateMemoryRecord` did not exist.
- Focused GREEN DB repository tests passed with 22 files and 58 tests.
- Focused DB and CLI typechecks passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:memory-governance` passed.
- `pnpm typecheck` passed across all workspace packages.
- `pnpm test` passed across 45 files and 222 tests.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- `git diff --check` passed.
- Forbidden directory scan found no added dashboard/API/MCP/research/pattern
  surfaces.

MM-28 behavior proof:

- `invalidateMemoryRecord` requires reviewer and reason.
- Invalidation marks MemoryRecord status as `invalidated`.
- Invalidation stores `invalidatedAt`, `invalidationReason`, and
  `invalidationReview` metadata without deleting the record.
- Live memory-governance smoke reported `Memory record invalidated status:
  invalidated`.
- Live memory-governance smoke reported `Active memory after invalidation: 0`.
- Live memory-governance smoke still reported an existing MemoryRecordVersion
  after invalidation.
- Cleanup remaining marker count was `0`.

Not proven by MM-28:

- Feedback-driven demotion/invalidation.
- Supersede chains beyond preserving existing version rows.
- Broad anti-memory enforcement.
- Golden memory behavior runner.
- API/MCP/dashboard readiness.
