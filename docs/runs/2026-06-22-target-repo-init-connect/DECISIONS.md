# Decisions

- Treat `GOAL.md` M27 as the active execution contract.
- Use `docs/runs/2026-06-22-target-repo-init-connect/` as the compact M27 run
  ledger. It is audit/handoff material only, not runtime memory.
- Keep target repo proof fixture-first. Any file writes must be restricted to a
  disposable fixture target repo and explicitly documented.

## Slice 00 Decisions

- Source: `docs/KRN_KERNEL.md`.
  Mechanism: runtime truth is store/service-backed, while markdown is allowed
  only as docs, exports, audit, seed, or backup.
  KRN implication: M27 may add run ledger and handoff docs, but target repo
  identity and harness state must persist through Postgres-backed objects.
  Decision: use markdown only for this run ledger; do not create `.krn`
  runtime truth or markdown memory in the target repo.
  Rejection/falsifier: if init/connect stores product truth in files instead
  of Project, RepoInstallation, ProjectKernel, and harness tables, the slice
  violates the kernel contract.

- Source: `GOAL.md` M27.
  Mechanism: the target behavior starts with a fixture repo, then dry-run init,
  connect persistence, project-scoped planning, Codex brief readback, and
  evidence capture.
  KRN implication: M27 should tighten existing CLI/DB/harness paths rather than
  introduce dashboard/API/MCP/plugin/runtime systems.
  Decision: implement the smallest final-compatible `krn init --dry-run --repo`
  and `krn init --connect --repo <fixture> --persist` path if current support
  is missing.
  Rejection/falsifier: if M27 requires an external real repo mutation,
  dashboard, API, or new runtime store to prove the flow, the implementation is
  out of scope.

- Source: repo-level `docs/handoff/*` and latest M22-M26 run handoff.
  Mechanism: M22-M26 already prove persisted harness plan/evidence, source
  graph, memory governance, retrieval/search, activation, Codex adapter
  readback, and worker job skeleton smokes.
  KRN implication: M27 should reuse those proven repository and smoke patterns
  instead of rebuilding the prior spine.
  Decision: Slice 01 will inventory the existing schema/repository/CLI support
  and only add missing target-repo registration and project-scoped harness
  behavior.
  Rejection/falsifier: broad historical rereads or copying old topology would
  contradict the repo instructions and the current handoff state.

## Slice 00 Skill Record

- `superpowers:using-superpowers`: used to enforce skill selection before task
  actions.
- `superpowers:test-driven-development`: loaded before behavior changes; later
  code slices must write and run failing tests before production code.
- `typescript-type-safety`: used for upcoming TypeScript/CLI boundary work.
- `brain-store-schema`: used for upcoming Postgres repository/schema checks.
