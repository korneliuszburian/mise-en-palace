# Blockers

Hard blockers:

- None for Slices 00-02.

Open runtime residual:

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
