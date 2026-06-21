# Blockers

Hard blockers:

- None for Slices 00-02.

Open runtime residual:

- None for the local DB runtime proof after Slice 05.

Closed in Slice 03:

- Live local Postgres reachability proved through `pnpm db:ready`.
- pgvector extension availability proved against the local Compose DB.
- Drizzle migration application/status proved against the local Compose DB:
  expected `3`, applied `3`.
- Doctor now verifies applied migration count and pgvector readiness without
  applying migrations.
- Minimal runtime persistence smoke path proved insert/read/cleanup through the
  Drizzle project repository path.

Explicit non-blockers:

- Existing no-store CLI path remains valid.
- `krn doctor` can report preview-only readiness without failing the no-store
  spine.
