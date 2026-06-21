# Blockers

Hard blockers:

- None for Slices 00-02.

Open runtime residual:

- Minimal runtime persistence smoke path does not exist yet.

Closed in Slice 03:

- Live local Postgres reachability proved through `pnpm db:ready`.
- pgvector extension availability proved against the local Compose DB.
- Drizzle migration application/status proved against the local Compose DB:
  expected `3`, applied `3`.
- Doctor now verifies applied migration count and pgvector readiness without
  applying migrations.

Explicit non-blockers:

- Existing no-store CLI path remains valid.
- `krn doctor` can report preview-only readiness without failing the no-store
  spine.
