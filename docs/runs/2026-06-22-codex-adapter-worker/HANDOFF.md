# Handoff

Objective:
Continue M26 Codex Adapter Execution Brief + Hook Expectations + Worker Job
Skeleton. M26.08 worker job smoke path is complete; next implementation slice
is M26.09 doctor Codex adapter / worker readiness.

Last verified state:
Latest pushed commit before this slice was
`a43d965 feat(db): add worker job repository methods`. This slice added
`pnpm db:smoke:worker-jobs`, `krn db smoke worker-jobs`, CLI report
formatting, and `runWorkerJobSmokeCheck` in `@krn/db`. RED CLI tests failed on
missing `./workerJobSmoke.js` and parser exit code `2`; RED DB tests failed on
missing `./workerJobSmoke.js`. GREEN focused tests passed. Live escalated
`KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
db:smoke:worker-jobs` passed: enqueued `6`, queued readback `6`, running `6`,
succeeded `2`, skipped `2`, failed `2`, cleanup deleted `6`, remaining marker
count `0`. Full `pnpm typecheck`, `pnpm test`, and `git diff --check` passed.

Changed files:
`package.json`, `packages/cli/src/parseArgs.ts`,
`packages/cli/src/runCli.test.ts`, `packages/cli/src/runDbSmokeCommand.ts`,
`packages/cli/src/workerJobSmoke.ts`, `packages/cli/src/workerJobSmoke.test.ts`,
`packages/db/src/index.ts`, `packages/db/src/workerJobSmoke.ts`,
`packages/db/src/workerJobSmoke.test.ts`, root `PLAN.md`, and
`docs/runs/2026-06-22-codex-adapter-worker/*`.

Decisions:
Worker job smoke proves the DB skeleton lifecycle only. It enqueues one job per
M26 type, verifies queued readback, marks all jobs running, then proves a
controlled succeeded/skipped/failed split. It does not execute maintenance
work, call embeddings, add Redis/Kafka, start a daemon, spawn processes, or
import `@krn/workers` into `packages/db`.

Blockers/risks:
No hard blocker. M26 is incomplete until doctor readiness, dogfood, final
anti-rot, and final handoff are complete. The sandboxed live smoke attempt hit
`tsx` IPC `listen EPERM`; the same command passed outside sandbox.

Context selectors:
`AGENTS.md`, `docs/KRN_KERNEL.md`, `GOAL.md` M26.09,
`docs/runs/2026-06-22-codex-adapter-worker/PROGRESS.md`,
`docs/runs/2026-06-22-codex-adapter-worker/VERIFICATION.md`,
`packages/cli/src/runDoctorCommand.ts`, `packages/cli/src/runDbSmokeCommand.ts`,
`packages/cli/src/parseArgs.ts`, `packages/db/src/workerJobSmoke.ts`,
`packages/cli/src/codexAdapterSmoke.ts`, and
`packages/db/src/repositories/DrizzleWorkerJobRepository.ts`.

Next action:
Start M26.09 doctor Codex adapter / worker readiness.

Do not reread:
`docs/materials/`, broad historical docs, or old repo topology unless a later
M26 slice explicitly needs raw source/audit material.
