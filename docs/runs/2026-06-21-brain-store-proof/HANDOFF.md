# Handoff

Objective:
Prove local KRN brain-store runtime: DB config, migrations, pgvector, minimal
persistence smoke path, and actionable `krn doctor` readiness.

Last verified state:
Slice 06 final audit passed before handoff edits: clean `git status`, recent
M20 commit log, healthy local Compose DB, `pnpm typecheck`, `pnpm test`,
no-env doctor, live-DB doctor, `pnpm db:ready`, `pnpm db:smoke`, and direct
smoke cleanup count `0`.

Changed files:

- `GOAL.md`
- `PLAN.md`
- `.env.example`
- `compose.yaml`
- `docs/runbooks/local-brain-store.md`
- `package.json`
- `packages/cli/src/index.ts`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/runCli.test.ts`
- `packages/cli/src/runDbReadinessCommand.ts`
- `packages/cli/src/runDbSmokeCommand.ts`
- `packages/db/src/index.ts`
- `packages/db/drizzle.config.ts`
- `packages/db/src/migrationReadiness.ts`
- `packages/db/src/persistenceSmoke.ts`
- `docs/runs/2026-06-21-brain-store-proof/DB_RUNTIME_INVENTORY.md`
- `docs/handoff/blockers.md`
- `docs/handoff/verification.md`
- `docs/handoff/handoff.md`
- `docs/handoff/progress.md`
- `docs/handoff/decisions.md`
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

Migration readiness:
`pnpm db:ready` now fails clearly without `KRN_DATABASE_URL`; with the local
Compose DB it applies/verifies migrations and reports pgvector availability.
Live proof passed with migrations expected `3`, applied `3`, pgvector available,
and brain-store readiness ready.

Doctor readiness:
`krn doctor` remains read-only and now reports exact migration verification
against generated migration count. Missing DB config remains preview-only and
exit `0`; local configured DB reports migrations `verified (3/3 applied)` and
brain-store readiness ready.

Persistence smoke:
`pnpm db:smoke` now ensures readiness, inserts a smoke workspace/project through
`DrizzleProjectRepository`, reads the project back, deletes the smoke workspace,
and reports cleanup completed. Direct DB check confirmed zero `krn-smoke-%`
workspaces remained after the live smoke run.

Blockers/risks:
No local DB runtime proof blocker remains. Full evidence/memory/source/eval
persistence and worker execution remain later scope.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`, package manifests,
and DB schema/migration files.

Next action:
Commit `docs(handoff): update brain-store proof status`, push, and return final
M20 status.

Do not reread:
`docs/materials/` or broad historical docs.
