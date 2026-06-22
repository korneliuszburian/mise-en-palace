# Progress

Goal: M27 - Target Repo Init/Connect Dogfood.

Current slice: Slice 06 init connect complete.

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
- Slice 04 added project repository methods for repo fingerprint lookup, repo
  path lookup, repo installation listing, and fixture cleanup.
- Slice 05 added `krn init --dry-run --repo <path>` with read-only target repo
  detection, ProjectKernel proposal, Codex overlay proposal, `No files written`
  output, and a next connect command.
- Slice 06 added `krn init --connect --repo <path> --persist` with DB-backed
  Project, RepoInstallation, and ProjectKernel create/reuse behavior.
- Slice 06 connected the fixture repo and proved idempotency by reusing Project
  `9da67341-0124-407e-b3fa-197f7f850a57`, RepoInstallation
  `e40219ed-a6b1-4842-9ef4-9bf851cdb65e`, and ProjectKernel
  `db32f8c2-dc8d-4e26-b4b5-89ca84f721f6` on the second run.

Next action:

- Slice 07 add `pnpm db:smoke:init-connect`.
