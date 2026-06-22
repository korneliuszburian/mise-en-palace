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
Slice 00 run ledger is created. No runtime code has changed yet. The next
slice is inventory only.

Boundaries:
Use a fixture target repo by default. Do not build dashboard, `apps/`, public
API, MCP server, plugin package, broad worker daemon, research layer, source
crawler, runtime markdown memory, `.krn` runtime truth, separate vector/graph
store, Redis/Kafka, or broad eval suite.

Changed files:
This slice adds only the M27 run ledger and updates root `PLAN.md` progress.

Blockers/risks:
No hard blocker. `KRN_DATABASE_URL` was not exported in the initial shell, so
the first plain `pnpm db:ready` failed as expected; live DB proof passed with
the local URL.

Next action:
Inventory `krn init`, repo detection, project/repo installation/kernel
persistence, AGENTS/Codex overlay proposal support, fixture repos, and smoke
helpers. Record what exists, what is missing, and the exact M27 command shape
before adding behavior.
