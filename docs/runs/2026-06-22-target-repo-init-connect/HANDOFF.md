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
Slices 00-08 are complete. Target repo fixture dry-run, connect persistence,
init-connect smoke, and project-scoped persisted planning are proven. The
latest real project-scoped plan used Project
`9da67341-0124-407e-b3fa-197f7f850a57`, ProjectKernel
`db32f8c2-dc8d-4e26-b4b5-89ca84f721f6`, RepoInstallation
`e40219ed-a6b1-4842-9ef4-9bf851cdb65e`, and persisted ExecutionRun
`d001b7b4-fa25-4156-8538-fb7dc316d3d3`.

Boundaries:
Use a fixture target repo by default. Do not build dashboard, `apps/`, public
API, MCP server, plugin package, broad worker daemon, research layer, source
crawler, runtime markdown memory, `.krn` runtime truth, separate vector/graph
store, Redis/Kafka, or broad eval suite.

Changed files:
Slice 08 changes CLI plan parsing/runtime and DB runtime project resolution,
then updates the M27 run ledger and root `PLAN.md` progress.

Blockers/risks:
No hard blocker. `GOAL.md` remains modified user-owned context and is not part
of the Slice 08 implementation commit.

Next action:
Slice 09: add `pnpm db:smoke:target-repo-harness` to connect the fixture,
create a project-scoped persisted plan, render Codex brief, persist evidence
capture, verify target-project linkage, and cleanup marker rows to zero.
