# Handoff

Objective:
Prove local KRN brain-store runtime: DB config, migrations, pgvector, minimal
persistence smoke path, and actionable `krn doctor` readiness.

Last verified state:
Slice 01 inventory passed: targeted DB runtime inventory, `pnpm --filter
@krn/db db:check`, and `pnpm typecheck`.

Changed files:

- `GOAL.md`
- `PLAN.md`
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
and migrations exist, including pgvector migration SQL, but local setup,
migration verification, and runtime persistence smoke proof are still absent.

Blockers/risks:
Live DB proof remains unproven until a local `KRN_DATABASE_URL` points at a
reachable pgvector Postgres and migration/smoke commands exist. Doctor currently
checks only for migration table presence, not exact migration readiness.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`, package manifests,
and DB schema/migration files.

Next action:
Run Slice 02 and add the smallest local DB setup path.

Do not reread:
`docs/materials/` or broad historical docs.
