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
