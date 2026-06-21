# Progress

Goal: M21 - persist the first KRN harness run spine.

Current slice: Slice 02 minimal schema path complete.

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

Skill gates:

- Used: `codex-adapter-plan` for the Codex-facing GOAL/skill-gate update.
- Used: `evidence-review-loop` for Slice 00 command evidence and ledger shape.
- Used: `brain-store-schema` for Slice 01 schema/repository inventory.
- Used: `source-to-decision` for Slice 01 local-code evidence decisions.
- Used: `brain-store-schema` for Slice 02 schema decision.
- Used: `source-to-decision` for Slice 02 no-migration decision.
- Not used yet: `typescript-type-safety`, `handoff-compact`,
  `target-infra-adr`, `activation-engine`.

Next action:

- Slice 03: add repository/readback methods for the persisted harness run
  aggregate and fix feedback delta readback.
