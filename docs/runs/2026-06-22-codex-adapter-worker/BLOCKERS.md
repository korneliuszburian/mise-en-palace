# Blockers

No hard blocker for M26.

Known gaps for M22-M26:

- None.

Resolved in M26.01:

- typed Codex adapter contracts named in `GOAL.md` are exported from
  `@krn/codex-adapter`;
- full Codex adapter contracts remain out of `packages/core`;
- adapter contracts include explicit does-not-prove, stop condition, rollback,
  skill hint, hook expectation, MCP ref, goal/ExecPlan ref, and subagent probe
  shapes.

Resolved in M26.02:

- execution brief rendering now starts from a typed `ExecutionBrief` artifact;
- rendered brief includes explicit source claims used, memory records used,
  anti-memory warnings, stop condition, rollback expectation, next action, and
  what-this-does-not-prove;
- hook expectations are phase-aware in the brief output, while still remaining
  expectations rather than hook scripts.

Resolved in M26.03:

- standalone `krn codex brief --run-id <id>` exists;
- command uses persisted harness run readback and renders the typed execution
  brief without writes;
- live DB-backed brief rendering passed for M25 dogfood run
  `bb33bd3d-02df-4ff3-839b-6f545de88b4c`.

Resolved in M26.04:

- dedicated hook expectation projection exists in `@krn/codex-adapter`;
- projection covers `SessionStart`, `PreToolUse`, `PostToolUse`,
  `PreCompact`, and `Stop`;
- projection explicitly remains expectations-only and does not create hook
  scripts, execute hooks, invoke Codex, or mutate memory.

Resolved in M26.05:

- `pnpm db:smoke:codex-adapter` exists;
- smoke creates and reads back a persisted harness run with activated context;
- smoke verifies objective, non-goals, explicit exclusions, evidence contract,
  bounded source/memory references, hook expectations, zero Codex invocations,
  and cleanup remaining marker count zero.

Resolved in M26.06:

- worker job types include `embed_memory_record`;
- the public worker skeleton contract uses `jobType` and `runAfter`;
- public worker lifecycle statuses include `skipped`;
- Drizzle `workerJobs.jobType` and `workerJobs.runAfter` map to the existing
  SQL `type` and `available_at` columns;
- migration `0006_lucky_ken_ellis.sql` adds `skipped` to
  `worker_job_status` without renaming or dropping worker job columns.

Resolved in M26.07:

- `DrizzleWorkerJobRepository` exists in `@krn/db`;
- repository methods cover enqueue, read by id, queued listing, running,
  succeeded, failed, skipped, and cleanup transitions;
- worker job readback narrows `jobType`, target lifecycle status, JSONB
  payload, and timestamps before returning typed records;
- repository code does not import `@krn/workers`, add Redis/Kafka, create a
  daemon, execute jobs, or call embeddings.

Resolved in M26.08:

- `pnpm db:smoke:worker-jobs` exists;
- `krn db smoke worker-jobs` has missing-config reporting;
- live worker job smoke enqueues one job for each M26 worker job type;
- smoke reads queued jobs back, marks all jobs running, and proves controlled
  succeeded/skipped/failed transitions;
- smoke cleanup deletes all marker jobs and proves remaining marker count zero;
- smoke code does not add Redis/Kafka, a daemon, actual job execution, or a
  `packages/db` dependency on `@krn/workers`.

Resolved in M26.09:

- `krn doctor` reports Codex adapter renderer, execution brief smoke command,
  hook expectation projection, Codex execution runner absence, KRN MCP server
  absence, and aggregate Codex adapter readiness;
- `krn doctor` reports worker job schema, worker job repository, worker job
  smoke command, Redis/Kafka queue absence, broad worker daemon absence, and
  aggregate worker job readiness;
- live DB doctor reports Codex adapter readiness and worker job readiness as
  ready;
- doctor remains read-only and does not invoke smoke commands, Codex, MCP, or
  worker runtime.

Resolved in M26.10:

- live persisted KRN-on-KRN plan run created execution run
  `e6b02685-63ed-48a2-a5cd-07b1a9a64fab`;
- `krn codex brief --run-id e6b02685-63ed-48a2-a5cd-07b1a9a64fab` read the
  run back from Postgres and rendered the Codex brief with hook expectations,
  source/memory refs, `Codex invocation: none`, and `Memory mutation: none`;
- live Codex adapter smoke passed with 5 hook expectations, 0 Codex
  invocations, and cleanup count zero;
- live worker job smoke passed with all 6 M26 job types enqueued/read/running,
  controlled succeeded/skipped/failed transitions, and cleanup count zero;
- live evidence capture persisted evidence, review, and feedback records for
  the dogfood run;
- live doctor still reports adapter and worker readiness ready with forbidden
  surfaces absent.

Resolved in M26.11:

- full typecheck and test suite passed after M26.10;
- no-env doctor passed with DB-dependent readiness preview-only and forbidden
  surfaces absent;
- live DB readiness passed with 7/7 migrations and pgvector available;
- Drizzle migration check passed;
- all DB smoke commands named in `GOAL.md` M26.11 passed;
- all smoke commands that report cleanup counts reported cleanup remaining
  marker count zero;
- live DB doctor passed with every readiness section ready and forbidden
  surfaces absent;
- directory gates confirmed no `apps`, `dashboard`, `.krn`, `packages/api`, or
  `packages/dashboard`;
- bounded scans found no MCP server entrypoints, Codex execution runner,
  broad worker runtime, Redis/Kafka queue, separate vector/graph/search DB
  dependencies, `@krn/workers` import in `packages/db`, core `requiredSkills`,
  core runtime imports, or TypeScript hygiene regressions.

Resolved in M26.12:

- current run handoff was updated for final M22-M26 status;
- repo-level `docs/handoff/handoff.md`, `docs/handoff/blockers.md`,
  `docs/handoff/verification.md`, `docs/handoff/progress.md`, and
  `docs/handoff/decisions.md` were refreshed from stale M22-only status to
  M22-M26 completion status;
- final handoff records residual later scope without treating not-built
  dashboard/API/MCP/workers/source-crawler/eval/plugin surfaces as blockers.

Non-goals that remain intentionally blocked:

- KRN MCP server;
- dashboard;
- public API;
- broad worker runtime;
- agent runner;
- sandbox orchestration;
- actual Codex invocation;
- plugin packaging;
- broad subagent system;
- Redis/Kafka queue.
