# Blockers

Hard blockers:

- None for Slice 00.

Observed setup issue:

- Plain `pnpm db:ready` failed because `KRN_DATABASE_URL` was not exported.
  Local pgvector Postgres was healthy on port `54329`, and the same readiness
  command passed with
  `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn`.

Residual later scope:

- Target repo fixture does not exist yet.
- `krn init --dry-run --repo <fixture>` support is not proven yet.
- `krn init --connect --repo <fixture> --persist` support is not proven yet.
- Project-scoped persisted planning from an init/connect project is not proven
  yet.
- Target-repo Codex brief readback and evidence capture are not proven yet.
- Init/connect and target-repo-harness DB smokes do not exist yet.

Explicit non-blockers:

- No dashboard/API/MCP/plugin/runtime markdown memory exists by design.
- The pre-existing modified `GOAL.md` is user-owned context and is not a
  blocker for M27 work as long as commits stage only intentional files.
