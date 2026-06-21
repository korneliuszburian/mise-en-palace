# Progress

Goal: M21 - persist the first KRN harness run spine.

Current slice: Slice 04 persisted plan complete.

Completed:

- `GOAL.md` now defines M21 as the first Postgres-backed persisted harness
  loop: plan, context, evidence, review, and feedback candidate persistence.
- `GOAL.md` now forces repo-local skill gates for the slices that trigger them.
- Start commit for this run is
  `a312afe docs(goal): define persisted harness spine`.
- Preflight passed on clean `main...origin/main`.
- Run ledger was created under
  `docs/runs/2026-06-21-persisted-harness-spine/`.
- Slice 01 inventory recorded current DB tables, repository methods, CLI gaps,
  migration need, and source-to-decision mappings in
  `HARNESS_PERSISTENCE_INVENTORY.md`.
- Slice 02 decided no new migration is needed for the primary M21 spine.
  Evidence contract persistence will use typed
  `harness_plans.metadata.evidenceContract` unless implementation falsifies
  that path.
- Slice 03 added a persisted run aggregate readback port and Drizzle adapter
  method by `executionRunId`.
- Slice 03 fixed persisted `feedback_deltas` readback so memory and source
  candidate arrays are narrowed from JSONB instead of being dropped.
- Slice 03 added `@krn/db` Vitest coverage and included DB tests in root
  `pnpm test`.
- Slice 04 made `krn plan --task "..."` preview/no-store by default even when
  `KRN_DATABASE_URL` is configured.
- Slice 04 added explicit `krn plan --task "..." --persist`, which requires DB
  config, persists the harness plan, creates a planned execution run, stores the
  evidence contract in `harness_plans.metadata.evidenceContract`, and prints
  persisted IDs.

Verification:

- `git status --short --branch`: passed; clean `main...origin/main`.
- `git log --oneline -10`: passed; newest commit was
  `a312afe docs(goal): define persisted harness spine`.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm --filter @krn/cli krn doctor`: passed without DB config and reported
  preview-only brain-store readiness.
- `pnpm --filter @krn/db db:check`: passed during Slice 01.
- `pnpm typecheck`: passed again during Slice 01.
- `pnpm --filter @krn/db db:check`: passed during Slice 02.
- `pnpm typecheck`: passed during Slice 02.
- `docker compose ps krn-postgres`: passed during Slice 02.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed during Slice 02.
- RED `pnpm --filter @krn/db test`: failed on `mapFeedbackDelta` returning
  empty `memoryCandidates`.
- RED `pnpm --filter @krn/db test`: failed on missing
  `getHarnessRunByExecutionRunId`.
- GREEN `pnpm --filter @krn/db test`: passed with 2 tests.
- `pnpm typecheck`: passed during Slice 03.
- `pnpm test`: passed during Slice 03, including `@krn/db`.
- `pnpm --filter @krn/db db:check`: passed during Slice 03.
- No `any` / double-assertion scan over `packages/core`, `packages/harness/src`,
  and `packages/db/src`: passed.
- RED `pnpm --filter @krn/cli test`: failed on old implicit DB write behavior
  and missing `--persist` parsing/output.
- GREEN `pnpm --filter @krn/cli test`: passed with 11 tests.
- `pnpm typecheck`: passed during Slice 04.
- `pnpm test`: passed during Slice 04.
- `pnpm --filter @krn/db db:check`: passed during Slice 04.
- Live `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn plan --task "persist harness run slice 04 proof" --persist`:
  passed and printed persisted IDs.
- SQL proof for execution run `b529e20e-b8ca-4cb5-9342-58578e880945`: status
  `planned`, `metadata.evidenceContract` present, evidence command count `3`,
  run event count `1`.
- Live preview with DB configured but without `--persist`: passed and left
  `execution_runs` count unchanged at `1`.

Skill gates:

- Used: `codex-adapter-plan` for the Codex-facing GOAL/skill-gate update.
- Used: `evidence-review-loop` for Slice 00 command evidence and ledger shape.
- Used: `brain-store-schema` for Slice 01 schema/repository inventory.
- Used: `source-to-decision` for Slice 01 local-code evidence decisions.
- Used: `brain-store-schema` for Slice 02 schema decision.
- Used: `source-to-decision` for Slice 02 no-migration decision.
- Used: `brain-store-schema` for Slice 03 repository/readback changes.
- Used: `typescript-type-safety` for Slice 03 JSONB narrowing and public
  repository type changes.
- Used: `test-driven-development` for Slice 03 RED/GREEN tests.
- Used: `codex-adapter-plan` for Slice 04 Codex-facing persisted ID output.
- Used: `typescript-type-safety` for Slice 04 CLI/env/runtime boundary changes.
- Used: `test-driven-development` for Slice 04 RED/GREEN CLI tests.
- Not used yet: `handoff-compact`, `target-infra-adr`, `activation-engine`.

Next action:

- Slice 05: add persisted plan smoke/readback test or command that proves the
  persisted run identity can be read back through the repository aggregate.
