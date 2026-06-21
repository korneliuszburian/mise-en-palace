# Blockers

Hard blockers:

- None for Slices 00-02.

Open runtime residual:

- `krn doctor` only checks for `__drizzle_migrations`, not applied migration
  count/tag/order.
- Minimal runtime persistence smoke path does not exist yet.

Closed in Slice 03:

- Live local Postgres reachability proved through `pnpm db:ready`.
- pgvector extension availability proved against the local Compose DB.
- Drizzle migration application/status proved against the local Compose DB:
  expected `3`, applied `3`.

Explicit non-blockers:

- Existing no-store CLI path remains valid.
- `krn doctor` can report preview-only readiness without failing the no-store
  spine.
