# Progress

Goal: M27 - Target Repo Init/Connect Dogfood.

Current slice: Slice 03 init/connect schema support complete.

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
- Slice 01 inventoried current support for CLI `init`, repo detection, project
  creation, repo installation persistence, project kernel persistence,
  AGENTS/Codex overlay proposal, fixture repos, and DB smoke helpers.
- Slice 01 confirmed the DB has Project, RepoInstallation, and ProjectKernel
  tables plus create/read methods for the existing harness path, but missing
  first-class repo fingerprint lookup/idempotency support.
- Slice 01 confirmed `krn init` and `krn plan --project` are not supported yet.
- Slice 02 added disposable fixture repo
  `tests/fixtures/target-repos/typescript-basic/` with package manager/script
  signals and TypeScript source.
- Slice 03 added first-class repo fingerprint schema support on
  `repo_installations`, with generated migration `0007_conscious_scarlet_witch`.

Next action:

- Slice 04 finish and commit repository methods for init/connect idempotency,
  listing, and fixture cleanup.
