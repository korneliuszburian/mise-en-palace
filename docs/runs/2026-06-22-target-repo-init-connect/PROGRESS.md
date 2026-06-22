# Progress

Goal: M27 - Target Repo Init/Connect Dogfood.

Current slice: Slice 12 anti-rot audit complete.

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
- Slice 07 added `pnpm db:smoke:init-connect`.
- Slice 07 smoke persists and reads back Project, RepoInstallation, and
  ProjectKernel, verifies idempotent reuse, and cleans marker rows to zero.
- Slice 08 added `krn plan --project <project-id> --task "..." --persist`.
- Slice 08 loads an existing Project, ProjectKernel, and RepoInstallation list
  by explicit project ID; missing explicit projects fail without fallback to the
  default `mise-en-palace` project.
- Slice 08 proved a real project-scoped persisted plan for connected fixture
  Project `9da67341-0124-407e-b3fa-197f7f850a57`, ProjectKernel
  `db32f8c2-dc8d-4e26-b4b5-89ca84f721f6`, RepoInstallation
  `e40219ed-a6b1-4842-9ef4-9bf851cdb65e`, and ExecutionRun
  `d001b7b4-fa25-4156-8538-fb7dc316d3d3`.
- Slice 09 added `pnpm db:smoke:target-repo-harness`.
- Slice 09 smoke connects the fixture, creates a project-scoped persisted plan,
  renders a Codex brief, persists evidence/review/feedback records, verifies
  target-project linkage, and cleans marker rows to zero.
- Slice 09 live smoke passed with Project
  `f7d589eb-f532-48f3-b8a1-abd120b51f69`, RepoInstallation
  `e6d07b06-e015-457d-8f5d-450d56f77715`, ProjectKernel
  `2a752de3-82d3-4181-996b-ae46d49372d0`, ExecutionRun
  `f9f2073b-0d69-4810-a8aa-2415af9b7fde`, EvidenceBundle
  `88bd55e1-1bae-48f6-a2c9-17fdd825dee6`, ReviewAssessment
  `b7bd5876-0fa3-4daf-833b-4d7b145c47dc`, FeedbackDelta
  `d253e142-2f1f-4cc1-b661-4d3b7a33f033`, target project linked `yes`, and
  cleanup remaining marker count `0`.
- Slice 10 added target repo readiness to `krn doctor`.
- Slice 10 doctor reports target init command availability, target fixture
  availability, Project/RepoInstallation/ProjectKernel schema presence,
  init-connect smoke proof, target-repo-harness smoke proof,
  cross-project leakage proof status, forbidden target surfaces, and derived
  target repo readiness.
- Slice 10 no-env doctor reports target repo readiness as `preview only`.
- Slice 10 DB-aware doctor reports target repo readiness as
  `ready (init-connect smoke proven; target repo harness smoke proven)`.
- Slice 10 re-ran live smokes. Init-connect smoke passed with Project
  `83dc9748-df97-45f5-893f-4b7bee6fe3ba`, RepoInstallation
  `ccc307bb-2f8d-4f6e-8db4-1eeaaaa2f96f`, ProjectKernel
  `b4f01d52-a660-4ac3-83c7-6c0448536b41`, and cleanup remaining marker count
  `0`.
- Slice 10 target repo harness smoke passed with Project
  `6e7eee1f-9481-4c0b-9929-0f6493919cad`, RepoInstallation
  `91273dd1-ded2-446f-a851-d2cc0004557e`, ProjectKernel
  `8baf670f-6d10-4a23-b604-ffb091449da8`, ExecutionRun
  `eb26785c-27e1-444e-bbf2-2469c9ba38dd`, EvidenceBundle
  `7d672f4b-b4d8-4040-8631-ca6c2908cee3`, ReviewAssessment
  `924cd281-090b-41ae-9a18-863d1d61c065`, FeedbackDelta
  `275bdc28-fa69-4803-b92a-f8919fdecd31`, target project linked `yes`, and
  cleanup remaining marker count `0`.
- Slice 11 dogfooded the fixture flow end to end:
  `init --dry-run`, `init --connect --persist`, `plan --project --persist`,
  `codex brief --run-id`, `evidence capture --run-id --persist`, DB-aware
  `doctor`, and both target repo smokes.
- Slice 11 connect reused Project `9da67341-0124-407e-b3fa-197f7f850a57`,
  RepoInstallation `e40219ed-a6b1-4842-9ef4-9bf851cdb65e`, and ProjectKernel
  `db32f8c2-dc8d-4e26-b4b5-89ca84f721f6`.
- Slice 11 project-scoped plan persisted ExecutionRun
  `eb16411b-d304-420e-adc7-1fdb86857c1d`. Activation abstained with no
  inclusions/exclusions, which is expected for the empty fixture context and
  proves gap-aware behavior rather than broad context dumping.
- Slice 11 Codex brief read the run from Postgres in read-only mode with Codex
  invocation `none` and memory mutation `none`.
- Slice 11 evidence capture persisted EvidenceBundle
  `6c85abdd-7b6d-468a-833e-0e12a445b6a6`, ReviewAssessment
  `e6e20c8b-11bd-41a5-adbb-18eadd1cbec0`, and FeedbackDelta
  `500f4cf0-3b03-449d-9993-65287808c6d6`; it reported memory mutation `none`
  and no MemoryCandidate or MemoryRecord row creation.
- Slice 11 review burden is medium because the worktree intentionally contains
  user-owned dirty `GOAL.md` plus untracked memory research materials.
- Slice 11 final smoke rerun passed with init-connect Project
  `ae8b0c69-4202-4250-ae7d-4ab9155f97d9` and target-harness ExecutionRun
  `c0720c89-4a7c-4607-bf91-1afaf420c01b`; both cleanup remaining marker counts
  were `0`.
- Slice 12 anti-rot audit passed. `pnpm typecheck`, `pnpm test`, DB-aware
  `krn doctor`, `pnpm db:ready`, all M22-M27 DB smokes, forbidden directory
  scan, forbidden dependency scan, core library-safety scan, and
  `git diff --check` passed.
- Slice 12 latest target repo harness smoke passed with ExecutionRun
  `ece37032-cb48-477d-bc41-07eb2e742a99`, target project linked `yes`, and
  cleanup remaining marker count `0`.
- Slice 12 confirmed no dashboard, `apps/`, API, MCP server, broad worker
  runtime, research layer, source crawler, runtime markdown memory, `.krn`,
  separate vector/graph/search store, Redis/Kafka, broad eval suite, or
  forbidden dependency.

Next action:

- Slice 13 final handoff.
