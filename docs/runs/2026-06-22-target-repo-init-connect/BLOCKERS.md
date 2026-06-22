# Blockers

Hard blockers:

- None for Slice 00.

Observed setup issue:

- Plain `pnpm db:ready` failed because `KRN_DATABASE_URL` was not exported.
  Local pgvector Postgres was healthy on port `54329`, and the same readiness
  command passed with
  `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn`.

Residual later scope:

- Final handoff is not complete yet.

Explicit non-blockers:

- No dashboard/API/MCP/plugin/runtime markdown memory exists by design.
- The pre-existing modified `GOAL.md` is user-owned context and is not a
  blocker for M27 work as long as commits stage only intentional files.
- Target repo fixture, init dry-run, connect persistence, init-connect smoke,
  and project-scoped persisted planning are now proven.
- Project-scoped persisted planning from an init/connect project is now proven
  by ExecutionRun `d001b7b4-fa25-4156-8538-fb7dc316d3d3`.
- Target-repo Codex brief rendering and evidence capture are now proven by
  `pnpm db:smoke:target-repo-harness` with cleanup remaining marker count `0`.
- Doctor target repo readiness is now proven by DB-aware `krn doctor` reporting
  `Target repo readiness: ready (init-connect smoke proven; target repo harness smoke proven)`.
- Direct fixture dogfood is now proven through dry-run, connect, project-scoped
  plan, Codex brief readback, persisted evidence capture, doctor, and both
  target repo smokes.
- The direct dogfood plan abstained because the fixture has no project-scoped
  context. This is honest gap behavior, not a blocker.
- Anti-rot passed across typecheck, tests, doctor, DB readiness, all smokes,
  forbidden surface scans, forbidden dependency scan, core library-safety scan,
  and `git diff --check`.
