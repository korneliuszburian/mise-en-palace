# Handoff

Objective:
Continue M26 Codex Adapter Execution Brief + Hook Expectations + Worker Job
Skeleton. M26.09 doctor Codex adapter / worker readiness is complete; next
implementation slice is M26.10 dogfood Codex adapter and worker skeleton.

Last verified state:
Latest pushed commit before this slice was
`a752943 test(db): add worker job skeleton smoke path`. This slice added
read-only `krn doctor` checks for Codex adapter renderer, execution brief smoke
command, hook expectation projection, Codex execution runner absence, KRN MCP
server absence, worker job schema, worker job repository, worker job smoke
command, Redis/Kafka queue absence, broad worker daemon absence, and aggregate
adapter/worker readiness. RED CLI tests failed on missing doctor output and
missing derive helpers. GREEN focused CLI test passed with 62 tests. Live DB
doctor passed before and after smokes with Codex adapter readiness and worker
job readiness ready. Live `pnpm db:smoke:codex-adapter` and
`pnpm db:smoke:worker-jobs` passed. Full `pnpm typecheck`, `pnpm test`, and
`git diff --check` passed.

Changed files:
`packages/cli/src/runDoctorCommand.ts`, `packages/cli/src/runCli.test.ts`,
root `PLAN.md`, and `docs/runs/2026-06-22-codex-adapter-worker/*`.

Decisions:
Doctor remains read-only. It reports surface availability and forbidden
runtime checks but does not invoke Codex, MCP, smoke commands, or worker
runtimes. Smoke proof remains explicit operator-run evidence from
`pnpm db:smoke:codex-adapter` and `pnpm db:smoke:worker-jobs`.

Blockers/risks:
No hard blocker. M26 is incomplete until M26.10 dogfood, M26.11 final anti-rot,
and final handoff are complete. Direct `tsx` CLI commands may need unsandboxed
execution because sandboxed `tsx` IPC can fail with `listen EPERM`.

Context selectors:
`AGENTS.md`, `docs/KRN_KERNEL.md`, `GOAL.md` M26.10,
`docs/runs/2026-06-22-codex-adapter-worker/PROGRESS.md`,
`docs/runs/2026-06-22-codex-adapter-worker/VERIFICATION.md`,
`packages/cli/src/runDoctorCommand.ts`, `packages/cli/src/runPlanCommand.ts`,
`packages/cli/src/runCodexBriefCommand.ts`,
`packages/cli/src/runEvidenceCaptureCommand.ts`,
`packages/cli/src/runDbSmokeCommand.ts`, and
`packages/db/src/workerJobSmoke.ts`.

Next action:
Start M26.10 dogfood Codex adapter and worker skeleton.

Do not reread:
`docs/materials/`, broad historical docs, or old repo topology unless M26.10
explicitly needs raw source/audit material.
