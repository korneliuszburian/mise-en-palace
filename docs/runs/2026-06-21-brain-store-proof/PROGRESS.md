# Progress

Goal: prove the local KRN brain-store runtime path without expanding product
scope.

Current slice: Slice 04 doctor DB readiness refinement complete and verified.

Preflight state:

- Branch: `main...origin/main`.
- Dirty state before Slice 00 ledger: `GOAL.md` modified for M20.
- Latest verified M19 commit: `4b86738 docs(run): add final KRN infra handoff`.
- Latest eight commits were inspected with `git log --oneline -8`.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.

Required-reading note:

- `GOAL.md` initially referenced `docs/handoff/HANDOFF.md`; repo-normalized
  path is `docs/handoff/handoff.md`. Slice 00 corrected the path in `GOAL.md`.
- `GOAL.md` now explicitly requires the matching repo-local operational skills
  for M20 DB, infra, TypeScript, and handoff work.

Inventory state:

- `KRN_DATABASE_URL` is canonical in current runtime code.
- Drizzle schema and migrations exist, including pgvector migration SQL.
- `.env.example`, `compose.yaml`, and `docs/runbooks/local-brain-store.md`
  now define a local Postgres/pgvector setup path.
- `pnpm db:ready` now applies/verifies migrations and checks pgvector.
- DB smoke command does not exist yet.
- `krn doctor` checks DB reachability, pgvector extension presence, and whether
  `__drizzle_migrations` exists, but not exact applied migration state.
- `pnpm typecheck`: passed after inventory docs.
- `pnpm --filter @krn/db db:check`: passed; Drizzle reported generated
  migrations consistent with config.

Local setup state:

- `compose.yaml` defines one `pgvector/pgvector:pg16` service on host port
  `54329`.
- `.env.example` documents `KRN_DATABASE_URL`.
- `packages/db/drizzle.config.ts` includes `dbCredentials.url` only when
  `KRN_DATABASE_URL` is set, so `drizzle-kit migrate` has a real DB target.
- `docs/runbooks/local-brain-store.md` documents start, config, generated
  migration validation, and current proof boundary.
- `docker compose config`: passed.
- `pnpm --filter @krn/db db:check`: passed after config change.
- `pnpm typecheck`: passed after config/docs change.

Migration readiness state:

- Added `pnpm db:ready`, backed by `krn db readiness`.
- Without `KRN_DATABASE_URL`, `pnpm db:ready` exits `1` with a clear blocked
  report and next action.
- With local Compose Postgres healthy and
  `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn`, `pnpm db:ready`
  exits `0`.
- Live local DB proof passed: Postgres reachable, migrations expected `3`,
  migrations applied `3`, pgvector available, brain-store readiness ready.
- Postgres notice output from long generated constraint names is suppressed in
  the readiness client so the report is deterministic.

Doctor readiness state:

- `krn doctor` remains read-only.
- Without `KRN_DATABASE_URL`, doctor exits `0` and reports preview-only
  persisted brain-store readiness.
- With the local Compose DB and `KRN_DATABASE_URL`, doctor exits `0` and reports
  Postgres reachable, pgvector available, migrations `verified (3/3 applied)`,
  and brain-store readiness ready.
- Doctor readiness logic now distinguishes migrations unverified from pgvector
  missing.

Next slice:

- Slice 05 minimal persistence smoke test.
