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
Slices 00-11 are complete. Target repo fixture dry-run, connect persistence,
init-connect smoke, project-scoped persisted planning, Codex brief readback,
evidence capture, full target repo harness smoke, and doctor target repo
readiness are proven. The latest direct dogfood reused Project
`9da67341-0124-407e-b3fa-197f7f850a57`, RepoInstallation
`e40219ed-a6b1-4842-9ef4-9bf851cdb65e`, and ProjectKernel
`db32f8c2-dc8d-4e26-b4b5-89ca84f721f6`, persisted ExecutionRun
`eb16411b-d304-420e-adc7-1fdb86857c1d`, rendered a Codex brief read-only,
persisted EvidenceBundle `6c85abdd-7b6d-468a-833e-0e12a445b6a6`,
ReviewAssessment `e6e20c8b-11bd-41a5-adbb-18eadd1cbec0`, and FeedbackDelta
`500f4cf0-3b03-449d-9993-65287808c6d6`. Evidence capture created no
MemoryCandidate or MemoryRecord row. DB-aware `krn doctor` reports
`Target repo readiness: ready (init-connect smoke proven; target repo harness smoke proven)`.

Boundaries:
Use a fixture target repo by default. Do not build dashboard, `apps/`, public
API, MCP server, plugin package, broad worker daemon, research layer, source
crawler, runtime markdown memory, `.krn` runtime truth, separate vector/graph
store, Redis/Kafka, or broad eval suite.

Changed files:
Slice 11 is docs-only. It records the fixture dogfood proof in the M27 run
ledger and root `PLAN.md`.

Blockers/risks:
No hard blocker. `GOAL.md` remains modified user-owned context and is not part
of the Slice 08 implementation commit.

Next action:
Slice 12: anti-rot audit.
