# Handoff

Objective:
Continue M26 Codex Adapter Execution Brief + Hook Expectations + Worker Job
Skeleton. M26.10 dogfood Codex adapter and worker skeleton is complete; next
implementation slice is M26.11 final M22-M26 anti-rot audit.

Last verified state:
Latest pushed commit before this slice was
`9748fce feat(cli): report Codex adapter and worker readiness in doctor`.
M26.10 used live Postgres at
`postgres://krn:krn@localhost:54329/krn`. `pnpm db:ready` passed with 7/7
migrations and pgvector available. Persisted `krn plan --task "render Codex
execution brief for activated harness run" --persist` created execution run
`e6b02685-63ed-48a2-a5cd-07b1a9a64fab` with 3 context inclusions and 0
exclusions. `krn codex brief --run-id
e6b02685-63ed-48a2-a5cd-07b1a9a64fab` rendered the persisted run read-only
from Postgres with `Codex invocation: none`, `Memory mutation: none`, source
and memory refs, skill hints, 5 hook expectations, and `What This Does Not
Prove`. `pnpm db:smoke:codex-adapter` passed with execution run
`6339a33d-12ad-4927-b8e5-82bbb2bc3055`, readback matched, 5 hook
expectations, 0 Codex invocations, and cleanup count 0. `pnpm
db:smoke:worker-jobs` passed with 6 jobs enqueued/read/running, 2 succeeded, 2
skipped, 2 failed, 6 deleted, and cleanup count 0. `krn evidence capture
--run-id e6b02685-63ed-48a2-a5cd-07b1a9a64fab --persist` created evidence
bundle `3ccbf304-fb5a-482a-a30e-8dff95d2a160`, review assessment
`7cbc61c2-b4c1-4056-a890-21fe5e89c873`, and feedback delta
`a1f834b7-b3fd-4a81-945e-309451d93cf7`. Live DB `krn doctor` passed with
Codex adapter readiness and worker job readiness ready.

Changed files:
Docs only for this slice so far: root `PLAN.md` and
`docs/runs/2026-06-22-codex-adapter-worker/*`.

Decisions:
M26.10 is a dogfood proof, not a runtime expansion. It proves persisted
adapter readback, hook expectation rendering, worker job persistence
lifecycle, evidence ledger persistence, and doctor readiness. It does not
prove Codex execution, MCP availability, memory mutation, worker job execution,
or production worker throughput. Evidence capture persists review records but
does not execute quality commands; final verification commands must be run
separately before the Slice 10 commit.

Blockers/risks:
No hard blocker. M26 is incomplete until M26.11 final anti-rot and final
handoff are complete. Direct `tsx` CLI commands may need unsandboxed execution
because sandboxed `tsx` IPC can fail with `listen EPERM`.

Context selectors:
`AGENTS.md`, `docs/KRN_KERNEL.md`, `GOAL.md` M26.11,
`docs/runs/2026-06-22-codex-adapter-worker/PROGRESS.md`,
`docs/runs/2026-06-22-codex-adapter-worker/VERIFICATION.md`,
`docs/runs/2026-06-22-codex-adapter-worker/BLOCKERS.md`,
`packages/cli/src/runDoctorCommand.ts`, `packages/cli/src/runPlanCommand.ts`,
`packages/cli/src/runCodexBriefCommand.ts`,
`packages/cli/src/runEvidenceCaptureCommand.ts`,
`packages/cli/src/runDbSmokeCommand.ts`, and
`packages/db/src/workerJobSmoke.ts`.

Next action:
Run M26.11 final anti-rot audit: status/log, full typecheck/test, no-env and
live doctor, all DB smokes named in `GOAL.md` M26.11, migration check,
forbidden-surface scans, cleanup checks, then record results.

Do not reread:
`docs/materials/`, broad historical docs, or old repo topology unless M26.11
explicitly needs raw source/audit material.
