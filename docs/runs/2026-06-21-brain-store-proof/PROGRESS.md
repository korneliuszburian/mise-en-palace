# Progress

Goal: prove the local KRN brain-store runtime path without expanding product
scope.

Current slice: Slice 02 local DB setup path complete and verified.

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
- Migration readiness command and DB smoke command do not exist yet.
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

Next slice:

- Slice 03 migration verification command.
