# Verification

Latest verified slice: MM-29 memory feedback application and ranking.

Passed:

- Focused RED activation test failed because memory with
  `negativeFeedbackCount: 4` still ranked above clean memory.
- Focused GREEN activation test passed with 9 files and 31 tests.
- Focused harness typecheck passed.
- `pnpm typecheck` passed across all workspace packages.
- `pnpm test` passed across 45 files and 223 tests.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- `git diff --check` passed.
- Forbidden directory scan found no added dashboard/API/MCP/research/pattern
  surfaces.

MM-29 behavior proof:

- Memory activation candidates now carry `feedbackScore`.
- Positive feedback adds a small ranking boost.
- Negative feedback applies a larger ranking penalty.
- Candidate metadata exposes `positiveFeedbackCount`, `negativeFeedbackCount`,
  and `feedbackPenalty`.
- A memory record with repeated negative feedback ranks below a clean memory
  record with the same task match.

Not proven by MM-29:

- Review-required demotion/invalidation candidates.
- Automatic status changes from feedback.
- Broad anti-memory enforcement.
- Golden memory behavior runner.
- API/MCP/dashboard readiness.
