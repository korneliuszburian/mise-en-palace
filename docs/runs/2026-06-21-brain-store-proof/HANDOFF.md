# Handoff

Objective:
Prove local KRN brain-store runtime: DB config, migrations, pgvector, minimal
persistence smoke path, and actionable `krn doctor` readiness.

Last verified state:
Slice 02 local setup passed: `docker compose config`, `pnpm --filter @krn/db
db:check`, and `pnpm typecheck`.

Changed files:

- `GOAL.md`
- `PLAN.md`
- `.env.example`
- `compose.yaml`
- `docs/runbooks/local-brain-store.md`
- `packages/db/drizzle.config.ts`
- `docs/runs/2026-06-21-brain-store-proof/DB_RUNTIME_INVENTORY.md`
- `docs/runs/2026-06-21-brain-store-proof/PROGRESS.md`
- `docs/runs/2026-06-21-brain-store-proof/HANDOFF.md`
- `docs/runs/2026-06-21-brain-store-proof/DECISIONS.md`
- `docs/runs/2026-06-21-brain-store-proof/BLOCKERS.md`
- `docs/runs/2026-06-21-brain-store-proof/VERIFICATION.md`

Decisions:
Keep this proof bounded to local Postgres/pgvector/migration readiness and one
minimal persistence smoke path. `GOAL.md` also requires the matching repo-local
operational skills for DB, infra, TypeScript, and handoff changes.

Inventory:
`KRN_DATABASE_URL` is already canonical in current runtime code. Drizzle schema
and migrations exist, including pgvector migration SQL.

Local setup:
`.env.example`, `compose.yaml`, and `docs/runbooks/local-brain-store.md` now
define a local Postgres/pgvector setup path. Drizzle config reads
`KRN_DATABASE_URL` only when present so `drizzle-kit migrate` can target the
canonical local URL while `db:check` remains usable without DB config.

Blockers/risks:
Live DB proof remains unproven until the local Postgres service is started and
migration/smoke commands exist. Doctor currently checks only for migration table
presence, not exact migration readiness.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`, package manifests,
and DB schema/migration files.

Next action:
Run Slice 03 and add the migration verification command.

Do not reread:
`docs/materials/` or broad historical docs.
