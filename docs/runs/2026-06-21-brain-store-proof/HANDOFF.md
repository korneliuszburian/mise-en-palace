# Handoff

Objective:
Prove local KRN brain-store runtime: DB config, migrations, pgvector, minimal
persistence smoke path, and actionable `krn doctor` readiness.

Last verified state:
Slice 04 doctor readiness passed: RED/GREEN CLI test, `pnpm typecheck`,
missing-env `krn doctor`, live-DB `krn doctor`, and full `pnpm test`.

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
- `packages/db/src/index.ts`
- `packages/db/drizzle.config.ts`
- `packages/db/src/migrationReadiness.ts`
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

Blockers/risks:
Minimal persistence smoke proof is still absent.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`, package manifests,
and DB schema/migration files.

Next action:
Run Slice 05 and add the minimal persistence smoke path.

Do not reread:
`docs/materials/` or broad historical docs.
