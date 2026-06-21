# Blockers

Hard blockers:

- None for Slice 00.

Open runtime residual:

- No checked-in `.env.example` documents `KRN_DATABASE_URL`.
- No repo-local Compose file starts a local pgvector Postgres.
- Live Postgres reachability is unproven.
- pgvector extension availability is represented in schema/migrations but
  unproven against a live DB.
- Drizzle migrations exist, but migration application/status is unproven
  against a live DB.
- `krn doctor` only checks for `__drizzle_migrations`, not applied migration
  count/tag/order.
- Minimal runtime persistence smoke path does not exist yet.

Explicit non-blockers:

- Existing no-store CLI path remains valid.
- `krn doctor` can report preview-only readiness without failing the no-store
  spine.
