# Verification

Slice 00 preflight:

- `git status --short --branch`: passed; clean `main...origin/main`.
- `git log --oneline -10`: passed. Newest commit:
  `a312afe docs(goal): define persisted harness spine`.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace tests.
- `pnpm --filter @krn/cli krn doctor`: passed without `KRN_DATABASE_URL`;
  reported Postgres not configured, pgvector/migrations skipped, and brain-store
  readiness as preview only.

Scope checks:

- No raw onboarding materials were read.
- No dashboard, API, MCP server, broad worker runtime, research layer, `.krn`,
  runtime markdown memory, separate store, full MemoryStore, full SourceStore,
  or broad eval suite was added.
- Required repo-local skill gates are now explicit in `GOAL.md`.
- Slice 00 is docs/ledger work only; persisted harness behavior remains
  unimplemented until later slices.
