# Handoff

Objective:
Persist SourceClaims and source-to-decision edges through the existing
Postgres/Drizzle-backed KRN control plane.

Last verified state:
M22 Slice 00 preflight is complete. `GOAL.md` now defines M22. The working tree
started from clean `main...origin/main` except for that M22 goal update.
`pnpm typecheck`, `pnpm test`, no-DB `krn doctor`, live `pnpm db:ready`, live
`pnpm db:smoke`, live `pnpm db:smoke:harness-plan`, and live
`pnpm db:smoke:harness-evidence` passed.

Changed files:

- `GOAL.md`
- `docs/runs/2026-06-21-source-graph-persistence/PROGRESS.md`
- `docs/runs/2026-06-21-source-graph-persistence/HANDOFF.md`
- `docs/runs/2026-06-21-source-graph-persistence/DECISIONS.md`
- `docs/runs/2026-06-21-source-graph-persistence/BLOCKERS.md`
- `docs/runs/2026-06-21-source-graph-persistence/VERIFICATION.md`

Decisions:
M22 should reuse the existing Postgres/Drizzle boundary and link source claims
to harness artifacts. Decorative sources must become SourceRejections, not
trusted SourceClaims.

Blockers/risks:
No Slice 00 blocker. Slice 01 must inventory the current source graph surface
before deciding whether schema/migration work is needed.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`,
`docs/runs/2026-06-21-persisted-harness-spine/`, package manifests, DB
schema/migrations/repositories, existing source/core/schema types, CLI
`plan`/`doctor`/`evidence capture`, and M22 run ledger files.

Next action:
Slice 01: inventory existing source graph schema, repositories, core types, IO
schemas, CLI support, smoke paths, naming fit, and intentional non-scope.

Do not reread:
`docs/materials/` or broad historical docs.
