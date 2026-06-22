# Progress

Goal: M25 - Activation Engine V1 integrated into persisted harness plan.

Current slice: Slice 00 activation engine inventory in progress.

Completed:

- M24 retrieval/search substrate is complete and pushed through
  `34ff368 docs(handoff): update retrieval substrate status`.
- M25 run ledger was created under
  `docs/runs/2026-06-22-activation-engine/`.
- Slice 00 inventoried the current activation surface in
  `ACTIVATION_ENGINE_INVENTORY.md`.
- Slice 00 recorded source-to-decision implications in `DECISIONS.md`.

Verification:

- `git status --short --branch`: passed with clean `## main...origin/main`
  before M25 ledger creation.
- Targeted read of `docs/KRN_KERNEL.md`: passed.
- Targeted read of `GOAL.md` M25 section: passed.
- Targeted read of M24 retrieval handoff: passed.
- Targeted reads of current activation modules, compiler, repositories,
  context/retrieval schema, CLI plan runtime, no-store runtime, DB runtime,
  package scripts, and doctor/smoke surfaces: passed.
- `pnpm --filter @krn/cli krn plan --task "improve KRN doctor source graph
  readiness"`: passed with preview abstention, context included `0`, and
  context excluded `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn plan --task "improve KRN doctor source graph readiness"
  --persist`: passed with context included `3`, context excluded `0`, and
  persisted IDs recorded in `ACTIVATION_ENGINE_INVENTORY.md`.
- Post-run DB audit for context assembly
  `8ee85cac-8fa7-418a-8a27-9ca06e763d0d`: passed with context items `3`,
  context exclusions `0`, activation decisions `3`, and retrieval candidates
  `3`.
- `pnpm typecheck`: passed.
- `git diff --check`: passed.

Next:

- Commit Slice 00 as `docs(run): record activation engine inventory`.
- Start M25.01 by adding/tightening activation domain contracts without DB/CLI
  imports in core.
