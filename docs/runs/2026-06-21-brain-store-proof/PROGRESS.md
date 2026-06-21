# Progress

Goal: prove the local KRN brain-store runtime path without expanding product
scope.

Current slice: Slice 01 DB runtime inventory complete and verified.

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
- No `.env.example`, Compose file, migration readiness command, or DB smoke
  command exists yet.
- `krn doctor` checks DB reachability, pgvector extension presence, and whether
  `__drizzle_migrations` exists, but not exact applied migration state.
- `pnpm typecheck`: passed after inventory docs.
- `pnpm --filter @krn/db db:check`: passed; Drizzle reported generated
  migrations consistent with config.

Next slice:

- Slice 02 local DB setup path.
