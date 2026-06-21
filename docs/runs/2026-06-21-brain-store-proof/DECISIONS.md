# Decisions

- Adopt M20 as the current `GOAL.md`; M19 remains completed at commit
  `4b86738`.
- Preserve the existing first-spine architecture: PostgreSQL with pgvector,
  Drizzle migrations, Zod IO boundaries, CLI as adapter, and no dashboard/API.
- Use `KRN_DATABASE_URL` as the canonical runtime configuration variable.
- Keep run proof in `docs/runs/2026-06-21-brain-store-proof/`; do not create
  `.krn` runtime truth or markdown memory.
- Correct `docs/handoff/HANDOFF.md` references to lowercase
  `docs/handoff/handoff.md` to match the normalized repo structure.
- Require the matching repo-local operational skills in `GOAL.md` for this
  goal: `brain-store-schema`, `target-infra-adr`, `typescript-type-safety`, and
  `handoff-compact`.
- Keep `KRN_DATABASE_URL` as the canonical DB runtime variable. Current code
  already uses it in `krn plan`, `krn doctor`, and `krn evidence capture`.
- Treat existing migrations as generated schema artifacts, not live runtime
  proof. M20 still needs a command that applies or verifies them against a
  reachable DB.
- Treat doctor migration status as incomplete until it checks more than the
  existence of `__drizzle_migrations`.
- Adopt `compose.yaml` as the local-only Postgres/pgvector setup path. The
  single service is `pgvector/pgvector:pg16`, exposed on host port `54329`.
- Keep local DB credentials intentionally disposable in `.env.example` and
  Docker Compose; do not add cloud config.
- Let `packages/db/drizzle.config.ts` read `KRN_DATABASE_URL` only for Drizzle
  commands that need a DB target. This keeps `db:check` usable without local DB
  configuration and makes `drizzle-kit migrate` target the same canonical URL.
- Adopt `pnpm db:ready` as the canonical migration readiness command. It is
  allowed to apply migrations, unlike read-only `krn doctor`.
- Implement migration readiness in `@krn/db` over the existing
  postgres-js/Drizzle runtime, with CLI responsible only for env/cwd/repo-root
  adaptation and output formatting.
- Verify migration readiness by comparing applied rows in
  `drizzle.__drizzle_migrations` with the generated migration file count, then
  checking pgvector in `pg_extension`.
- Suppress Postgres NOTICE output in the readiness client because generated
  constraint names may exceed PostgreSQL identifier length and would otherwise
  pollute command output.
- Keep `krn doctor` read-only. It may inspect migration readiness through
  `@krn/db`, but it must not apply migrations.
- Doctor exits `0` for missing `KRN_DATABASE_URL` because the no-store preview
  spine remains valid. Doctor exits non-zero for configured DB states that are
  blocked by unreachable Postgres, missing pgvector, or unverified migrations.
- Adopt `pnpm db:smoke` as the minimal persistence proof command. It may apply
  migrations through readiness check, then writes only a temporary smoke
  workspace/project.
- Use `DrizzleProjectRepository` for smoke insert/read so the proof exercises
  the repository adapter path, not only raw SQL.
- Cleanup deletes the smoke workspace and relies on existing cascade behavior
  to remove the smoke project.
- Close the M20 runtime residual in `docs/handoff/blockers.md`; remaining full
  evidence/memory/source/eval persistence and worker execution are later scope,
  not blockers for this local brain-store proof.
