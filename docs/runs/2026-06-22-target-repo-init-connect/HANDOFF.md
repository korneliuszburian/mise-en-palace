# Handoff

Objective:
Prove KRN can initialize/connect a disposable target repo into the
Postgres-backed brain store and run the persisted harness loop against that
target project.

Last verified state:
M22-M26 Brain Spine is complete through `030f4bf docs(handoff): complete
M22-M26 brain spine handoff`. Baseline M27 preflight passed after exporting
`KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn`: `pnpm typecheck`,
`pnpm test`, no-env `krn doctor`, live `pnpm db:ready`, and all existing DB
smokes from M22-M26.

Current M27 state:
Slices 00-09 are complete. Target repo fixture dry-run, connect persistence,
init-connect smoke, project-scoped persisted planning, and full target repo
harness smoke are proven. The latest full smoke connected Project
`f7d589eb-f532-48f3-b8a1-abd120b51f69`, RepoInstallation
`e6d07b06-e015-457d-8f5d-450d56f77715`, ProjectKernel
`2a752de3-82d3-4181-996b-ae46d49372d0`, persisted ExecutionRun
`f9f2073b-0d69-4810-a8aa-2415af9b7fde`, rendered a Codex brief, persisted
EvidenceBundle `88bd55e1-1bae-48f6-a2c9-17fdd825dee6`, ReviewAssessment
`b7bd5876-0fa3-4daf-833b-4d7b145c47dc`, FeedbackDelta
`d253e142-2f1f-4cc1-b661-4d3b7a33f033`, verified target project linkage, and
cleaned marker rows to `0`.

Boundaries:
Use a fixture target repo by default. Do not build dashboard, `apps/`, public
API, MCP server, plugin package, broad worker daemon, research layer, source
crawler, runtime markdown memory, `.krn` runtime truth, separate vector/graph
store, Redis/Kafka, or broad eval suite.

Changed files:
Slice 09 adds the target-repo-harness smoke command/helper/script, then updates
the M27 run ledger and root `PLAN.md` progress.

Blockers/risks:
No hard blocker. `GOAL.md` remains modified user-owned context and is not part
of the Slice 08 implementation commit.

Next action:
Slice 10: update `krn doctor` target repo readiness.
