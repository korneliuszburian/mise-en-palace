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
Slices 00-10 are complete. Target repo fixture dry-run, connect persistence,
init-connect smoke, project-scoped persisted planning, full target repo harness
smoke, and doctor target repo readiness are proven. The latest target harness
smoke connected Project `6e7eee1f-9481-4c0b-9929-0f6493919cad`,
RepoInstallation `91273dd1-ded2-446f-a851-d2cc0004557e`, ProjectKernel
`8baf670f-6d10-4a23-b604-ffb091449da8`, persisted ExecutionRun
`eb26785c-27e1-444e-bbf2-2469c9ba38dd`, rendered a Codex brief, persisted
EvidenceBundle `7d672f4b-b4d8-4040-8631-ca6c2908cee3`, ReviewAssessment
`924cd281-090b-41ae-9a18-863d1d61c065`, FeedbackDelta
`275bdc28-fa69-4803-b92a-f8919fdecd31`, verified target project linkage, and
cleaned marker rows to `0`. DB-aware `krn doctor` now reports
`Target repo readiness: ready (init-connect smoke proven; target repo harness smoke proven)`.

Boundaries:
Use a fixture target repo by default. Do not build dashboard, `apps/`, public
API, MCP server, plugin package, broad worker daemon, research layer, source
crawler, runtime markdown memory, `.krn` runtime truth, separate vector/graph
store, Redis/Kafka, or broad eval suite.

Changed files:
Slice 10 adds target repo readiness checks to `packages/cli/src/runDoctorCommand.ts`,
updates CLI tests, then updates the M27 run ledger and root `PLAN.md` progress.

Blockers/risks:
No hard blocker. `GOAL.md` remains modified user-owned context and is not part
of the Slice 08 implementation commit.

Next action:
Slice 11: final target repo dogfood and anti-rot audit.
