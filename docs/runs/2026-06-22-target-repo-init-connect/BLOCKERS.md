# Blockers

Hard blockers:

- None for Slice 00.

Observed setup issue:

- Plain `pnpm db:ready` failed because `KRN_DATABASE_URL` was not exported.
  Local pgvector Postgres was healthy on port `54329`, and the same readiness
  command passed with
  `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn`.

Residual later scope:

- Full M27 dogfood and final anti-rot audit are not complete yet.

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
