# Progress

Goal: M27 - Target Repo Init/Connect Dogfood.

Current slice: Slice 00 preflight and run ledger complete.

Completed:

- Read `AGENTS.md`, `GOAL.md`, `docs/KRN_KERNEL.md`, root `PLAN.md`,
  repo-level handoff docs, the latest M22-M26 run handoff, package manifests,
  and the git commit standard.
- Confirmed latest M22-M26 state from repo docs: brain spine is complete and
  pushed through `030f4bf docs(handoff): complete M22-M26 brain spine handoff`.
- Confirmed the M27 boundary: fixture target repo only by default; no
  dashboard, `apps/`, public API, MCP server, plugin package, broad worker
  daemon, research layer, source crawler, runtime markdown memory, `.krn`
  runtime truth, separate vector/graph/search store, Redis/Kafka, or broad eval
  suite.
- Ran baseline preflight:
  `git status --short --branch`, `git log --oneline -20`,
  `pnpm typecheck`, `pnpm test`, no-env `krn doctor`, live DB readiness, and
  all M22-M26 DB smokes.
- Noted a pre-existing modified `GOAL.md` in the worktree. This run will leave
  it unstaged unless a later slice explicitly changes the goal contract.

Next action:

- Slice 01 inventory current init/connect/project model support across CLI,
  DB repositories, schema, fixtures, and smoke helpers, then record exact M27
  command shape in `DECISIONS.md`.
