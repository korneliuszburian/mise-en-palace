# Verification

## Slice 00

Commands run:

```sh
git status --short --branch
git log --oneline -20
pnpm typecheck
pnpm test
pnpm --filter @krn/cli krn doctor
pnpm db:ready
docker compose ps krn-postgres
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:harness-plan
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:harness-evidence
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:source-graph
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:memory-governance
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:retrieval-substrate
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:activation
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:codex-adapter
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:worker-jobs
```

Results:

- `git status --short --branch`: passed with `## main...origin/main` and a
  pre-existing modified `GOAL.md`.
- `git log --oneline -20`: passed with latest commit
  `030f4bf docs(handoff): complete M22-M26 brain spine handoff`.
- `pnpm typecheck`: passed across 7 workspace packages.
- `pnpm test`: passed across 26 test files and 120 tests.
- no-env `krn doctor`: passed with DB-dependent readiness reported as preview
  only and forbidden surfaces absent.
- Plain `pnpm db:ready`: failed because `KRN_DATABASE_URL` was missing. This
  was expected setup feedback, not a schema failure.
- `docker compose ps krn-postgres`: passed with local pgvector Postgres
  healthy on host port `54329`.
- Live `pnpm db:ready`: passed with 7/7 migrations and pgvector available.
- Live DB smokes passed: `db:smoke`, `db:smoke:harness-plan`,
  `db:smoke:harness-evidence`, `db:smoke:source-graph`,
  `db:smoke:memory-governance`, `db:smoke:retrieval-substrate`,
  `db:smoke:activation`, `db:smoke:codex-adapter`, and
  `db:smoke:worker-jobs`.
- Smoke cleanup marker count was zero where the smoke reports it.

Not proven yet:

- Target repo fixture.
- Target repo init dry-run.
- Target repo connect persistence.
- ProjectKernel persistence for a connected target repo.
- Project-scoped planning from a connected target repo.
- Target repo Codex brief and evidence capture.
