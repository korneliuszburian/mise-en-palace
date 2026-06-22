# Handoff

Objective:
Continue M26 Codex Adapter Execution Brief + Hook Expectations + Worker Job
Skeleton. M26.12 final handoff is complete. M22-M26 Brain Spine is complete
through final anti-rot and handoff.

Last verified state:
Latest pushed commit before this slice was
`cd9d859 docs(run): record M22-M26 anti-rot audit`. M22-M26 status is recorded
in repo-level `docs/handoff/*` and this run ledger. M26.11 final anti-rot
passed clean status/log, local Postgres health, `pnpm typecheck`, `pnpm test`,
no-env doctor, live DB readiness, Drizzle `db:check`, all DB smokes named in
`GOAL.md`, live DB doctor, forbidden directory checks, bounded runtime-surface
scans, and `git diff --check`. Typecheck passed across 7 packages. Tests
passed across 26 files and 120 tests. Live DB readiness proved 7/7 migrations
and pgvector. All smoke cleanup counts reported zero where emitted.

Changed files:
Docs only for this slice: root `PLAN.md`,
`docs/runs/2026-06-22-codex-adapter-worker/*`, and `docs/handoff/*`.

Decisions:
Final handoff is continuation state, not new runtime scope. Repo-local handoff
artifacts are the durable replacement for relying on a forked conversation.
M22-M26 prove persistence/readiness/smoke behavior, not Codex execution, MCP
availability, dashboard/API readiness, memory auto-mutation, worker job
execution, or production worker throughput.

Blockers/risks:
No hard blocker remains for M22-M26. Direct `tsx` CLI commands may need
unsandboxed execution because sandboxed `tsx` IPC can fail with
`listen EPERM`.

Context selectors:
`AGENTS.md`, `docs/KRN_KERNEL.md`, `GOAL.md`,
`docs/handoff/handoff.md`, `docs/handoff/verification.md`,
`docs/handoff/blockers.md`, `docs/handoff/progress.md`,
`docs/handoff/decisions.md`,
`docs/runs/2026-06-22-codex-adapter-worker/PROGRESS.md`,
`docs/runs/2026-06-22-codex-adapter-worker/VERIFICATION.md`,
`docs/runs/2026-06-22-codex-adapter-worker/BLOCKERS.md`,
`packages/cli/src/runDoctorCommand.ts`, `packages/cli/src/runPlanCommand.ts`,
`packages/cli/src/runCodexBriefCommand.ts`,
`packages/cli/src/runEvidenceCaptureCommand.ts`,
`packages/cli/src/runDbSmokeCommand.ts`, and
`packages/db/src/workerJobSmoke.ts`.

Next action:
Start the next milestone by designing a bounded maintenance worker lease/claim
contract over the proven `worker_jobs` skeleton.

Do not reread:
`docs/materials/`, broad historical docs, or old repo topology unless a future
explicitly needs raw source/audit material.
