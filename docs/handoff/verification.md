# Verification

Latest verified slice: MM-27 MemoryReviewGate and governed promotion.

Passed:

- Focused RED harness test first failed because `memoryReviewGate` did not
  exist.
- Focused GREEN harness gate tests passed with 9 files and 30 tests.
- Focused CLI promote tests passed with 6 files and 88 tests.
- Focused DB memory repository tests passed with 22 files and 58 tests.
- `pnpm typecheck` passed across all workspace packages.
- `pnpm test` passed across 45 files and 222 tests.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:memory-governance` passed and still proves internal low-level DB
  promotion/version smoke.
- `git diff --check` passed.
- Forbidden directory scan found no added dashboard/API/MCP/research/pattern
  surfaces.

MM-27 behavior proof:

- `promoteMemoryCandidateThroughGate` rejects missing `evidenceReviewedRef`.
- The gate rejects missing linked SourceClaim records.
- The gate checks candidate reviewability before calling low-level repository
  promotion.
- Public `krn memory candidate promote --persist` requires
  `--evidence-reviewed-ref`.
- Public promote passes through MemoryReviewGate and prints `Review gate:
  passed`.
- Promotion metadata preserves `reviewGate.evidenceReviewedRef` for promoted
  memory/version metadata.
- `krn memory candidate reject --persist` remains available for negative review
  decisions.
- Low-level repository promotion remains internal DB/smoke infrastructure.

Not proven by MM-27:

- Memory invalidation/demotion.
- Feedback-driven demotion.
- Broad anti-memory enforcement.
- Golden memory behavior runner.
- API/MCP/dashboard readiness.
