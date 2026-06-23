# Verification

Latest verified slice: MM-33 memory dogfood.

Passed:

- Preflight `pnpm typecheck` passed across all workspace packages.
- Preflight `pnpm test` passed across 45 files and 230 tests.
- DB before counts: execution_runs=14, source_claims=2,
  memory_candidates=1, memory_records=1, memory_versions=1,
  memory_applications=1.
- Live `krn plan --persist` created dogfood execution run
  `daafa66b-dd85-4b7c-bcf5-9ccf60c2b170`.
- Live `krn source claim add --persist` created SourceClaim
  `f0b5c9ee-01aa-41df-9268-7df3f7437068`.
- Live `krn memory candidate add --persist` created MemoryCandidate
  `2b31845c-1e34-4e5e-9862-23d0ce12cb69`.
- Live `krn memory candidate promote --persist --evidence-reviewed-ref ...`
  passed MemoryReviewGate and created MemoryRecord
  `41d1a2ef-3578-4e45-947f-42c6739796de`.
- DB proof shows the record is active, confidence 90, owner
  `memory-governance`, has source lineage, application guidance, invalidation
  rule, reviewGate metadata, and MemoryRecordVersion
  `9200736c-13ac-4ca6-bde9-dc494519cc17`.
- Live follow-up `krn plan --persist` for a matching task included memory_record
  `41d1a2ef-3578-4e45-947f-42c6739796de` in context and created execution run
  `54f6e3e0-d634-4b61-a67c-cde5d558f822`.
- Live `krn memory record apply --persist` recorded MemoryApplication
  `55a8e695-8665-45da-a19e-b8be578708ea` with outcome `helped`.
- DB after counts: execution_runs=16, source_claims=3,
  memory_candidates=2, memory_records=2, memory_versions=2,
  memory_applications=2.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 45 files and 230 tests.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- Final `git diff --check` passed.
- Final forbidden directory scan found no added dashboard/API/MCP/research/
  pattern surfaces.
- Final `krn audit slice --since origin/main ...` passed with 0 findings.

MM-33 behavior proof:

- Promotion used public CLI and MemoryReviewGate, not a direct MemoryRecord
  insert.
- Promoted memory has linked source claim, source lineage, guidance,
  confidence, owner, invalidation strategy, review-gate evidence reference, and
  auditable version.
- Later plan selected the memory into context for a matching task.
- Application feedback recorded the selected memory as `helped`.
- Detailed evidence is in `docs/runs/2026-06-23-memory-dogfood.md`.

Not proven by MM-33:

- Fuzzy semantic anti-memory matching.
- Golden memory behavior runner.
- API/MCP/dashboard readiness.
