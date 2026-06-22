# Progress

Goal: M26 - Codex Adapter Execution Brief + Hook Expectations + Worker Job
Skeleton.

Current slice: Slice 00 Codex adapter and worker inventory complete.

Completed:

- M25 activation engine is complete and pushed through
  `0933299 docs(handoff): update activation engine status`.
- M26 run ledger was created under
  `docs/runs/2026-06-22-codex-adapter-worker/`.
- Slice 00 inventoried the current Codex adapter package, `krn plan` brief
  rendering, capability plan, hook expectation seed, Goal/ExecPlan reference
  renderers, worker package, `worker_jobs`/`outbox_events` schema, CLI smoke
  routing, doctor routing, and package scripts.
- Slice 00 recorded source-to-decision implications in `DECISIONS.md`.

Verification:

- `git status --short --branch`: passed with clean `## main...origin/main`
  before M26 ledger creation.
- Targeted read of `docs/KRN_KERNEL.md`: passed.
- Targeted read of `GOAL.md` M26 section: passed.
- Targeted reads of Codex adapter, harness compiler, capability/evidence
  contract, DB events schema, worker package, CLI plan/smoke/doctor routing,
  package scripts, package boundaries, and ADR-0009: passed.
- `pnpm --filter @krn/cli krn plan --task "render Codex execution brief for
  activated harness run"`: passed with preview abstention, zero writes, and
  rendered `KRN Codex Execution Brief`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed and showed readiness through activation, with
  no Codex adapter or worker readiness section yet.
- `pnpm typecheck`: passed across 7 workspace packages.
- `git diff --check`: passed.

Next:

- Commit Slice 00 as
  `docs(run): record Codex adapter and worker inventory`.
- Start M26.01 Codex adapter contracts.
