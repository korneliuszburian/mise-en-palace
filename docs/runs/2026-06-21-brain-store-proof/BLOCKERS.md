# Blockers

Hard blockers:

- None for Slice 00.

Open runtime residual:

- Local `KRN_DATABASE_URL` is absent.
- Live Postgres reachability is unproven.
- pgvector extension availability is unproven against a live DB.
- Drizzle migration application/status is unproven against a live DB.
- Minimal runtime persistence smoke path does not exist yet.

Explicit non-blockers:

- Existing no-store CLI path remains valid.
- `krn doctor` can report preview-only readiness without failing the no-store
  spine.
