# Handoff

Objective:
Continue M26 Codex Adapter Execution Brief + Hook Expectations + Worker Job
Skeleton. M26.11 final M22-M26 anti-rot audit is complete; next
implementation slice is M26.12 final handoff.

Last verified state:
Latest pushed commit before this slice was
`c5a7490 docs(run): record Codex adapter and worker dogfood pass`. M26.11 ran
the final anti-rot audit from `GOAL.md`: clean status/log, local Postgres
healthy, `pnpm typecheck`, `pnpm test`, no-env `krn doctor`, live
`pnpm db:ready`, `pnpm --filter @krn/db db:check`, all DB smokes named in
M26.11, live DB `krn doctor`, forbidden directory checks, bounded runtime
surface scans, and `git diff --check`. Typecheck passed across 7 packages.
Tests passed across 26 files and 120 tests. Live DB readiness passed with 7/7
migrations and pgvector available. Every DB smoke passed. Smoke commands that
report cleanup counts reported cleanup count 0. Live DB doctor reported every
readiness section ready and forbidden surfaces absent. Bounded scans found no
dashboard/API/MCP server/Codex runner/broad worker/runtime markdown memory/
source crawler/broad eval/separate store/Redis/Kafka/core runtime-import drift.

Changed files:
Docs only for this slice so far: root `PLAN.md` and
`docs/runs/2026-06-22-codex-adapter-worker/*`.

Decisions:
M26.11 is verification and anti-rot, not new runtime scope. Broad scans may
match doctor guard strings and negative fixtures; bounded entrypoint,
manifest, package directory, and source-surface checks are the authoritative
forbidden-surface evidence. M26 still does not prove Codex execution, MCP
availability, memory auto-mutation, dashboard/API readiness, worker job
execution, or production worker throughput.

Blockers/risks:
No hard blocker. M26 is incomplete until M26.12 final handoff is complete.
Direct `tsx` CLI commands may need unsandboxed execution because sandboxed
`tsx` IPC can fail with `listen EPERM`.

Context selectors:
`AGENTS.md`, `docs/KRN_KERNEL.md`, `GOAL.md` M26.12,
`docs/runs/2026-06-22-codex-adapter-worker/PROGRESS.md`,
`docs/runs/2026-06-22-codex-adapter-worker/VERIFICATION.md`,
`docs/runs/2026-06-22-codex-adapter-worker/BLOCKERS.md`,
`packages/cli/src/runDoctorCommand.ts`, `packages/cli/src/runPlanCommand.ts`,
`packages/cli/src/runCodexBriefCommand.ts`,
`packages/cli/src/runEvidenceCaptureCommand.ts`,
`packages/cli/src/runDbSmokeCommand.ts`, and
`packages/db/src/workerJobSmoke.ts`.

Next action:
Write M26.12 final handoff: summarize M22-M26 status, source graph status,
memory governance status, retrieval/activation status, Codex adapter / worker
skeleton status, runtime proof commands, residual non-goals, next safest
milestone, and final verification status without overstating unsupported
surfaces.

Do not reread:
`docs/materials/`, broad historical docs, or old repo topology unless M26.12
explicitly needs raw source/audit material.
