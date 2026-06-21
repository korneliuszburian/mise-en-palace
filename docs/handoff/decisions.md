# Decisions

- KRN is a Codex operating layer, not an alternative executor or
  dashboard-first app.
- PostgreSQL with pgvector remains the canonical brain store for the first
  spine.
- `KRN_DATABASE_URL` is the canonical local DB runtime variable.
- Drizzle owns schema and migrations; Zod owns unknown-input parsing.
- Markdown remains docs/export/audit/handoff material, not runtime Memory Core.
- `packages/core` stays pure and Codex-agnostic.
- CLI remains an adapter over harness services, not the architecture.
- `krn plan` may run as no-store preview when `KRN_DATABASE_URL` is absent.
- `krn doctor` stays read-only and reports DB readiness from inspection only.
- `pnpm db:ready` is the mutating migration readiness proof command.
- `pnpm db:smoke` is the minimal persistence smoke proof command.
- Repo-local operational skills should be required in `GOAL.md` when their
  triggers apply.
- M21 uses explicit `--persist` for user-facing plan/evidence writes.
- M21 smoke commands live under `krn db smoke ...` and root
  `pnpm db:smoke:*` scripts so persistence proof is explicit.
- M21 stays inside the existing Postgres/Drizzle boundary unless a future slice
  proves a new durable surface is required.
- Persisted evidence capture creates feedback candidates only; it does not
  auto-apply memory, source, policy, or eval updates.
- `krn doctor` reports harness persistence readiness from read-only inspection
  only; it does not execute smoke commands or create proof rows.
- Slice 09 dogfood rows are retained as local proof rows; smoke rows remain
  marker-scoped and cleaned up.
- Slice 10 anti-rot is proof-only; it records current behavior and forbidden
  surfaces without adding product behavior.
