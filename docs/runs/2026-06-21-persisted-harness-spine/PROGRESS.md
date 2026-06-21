# Progress

Goal: M21 - persist the first KRN harness run spine.

Current slice: Slice 09 persisted harness loop dogfood complete.

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
- Slice 05 added `pnpm db:smoke:harness-plan`, which creates a marked persisted
  harness plan run, reads it back through the repository aggregate, verifies
  core fields, and cleans up the marker.
- Slice 06 added explicit `krn evidence capture --run-id <id> --persist`,
  which loads the persisted run, writes an evidence bundle, creates a review
  assessment, creates feedback delta candidates, and prints persisted IDs.
- Slice 07 added `pnpm db:smoke:harness-evidence`, which creates a marked
  persisted harness run, captures linked evidence/review/feedback records,
  verifies readback counts, and cleans up marker rows.
- Slice 08 updated read-only `krn doctor` to report harness persistence schema
  readiness, project/harness/evidence smoke command availability, and overall
  harness persistence readiness.
- Slice 09 dogfooded the persisted harness loop with live DB and recorded the
  persisted run under `DOGFOOD.md`.

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
- RED `pnpm --filter @krn/cli test`: failed on missing `db smoke harness-plan`
  parser support.
- GREEN `pnpm --filter @krn/cli test`: passed with 12 tests.
- `pnpm typecheck`: passed during Slice 05.
- `pnpm test`: passed during Slice 05.
- `pnpm --filter @krn/db db:check`: passed during Slice 05.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-plan`: passed. Execution run
  `7fc256ef-2868-483c-bd3a-c3283df4b761`, readback matched, evidence command
  count `3`, run events `1`, cleanup remaining marker count `0`.
- RED `pnpm --filter @krn/cli test`: failed on missing
  `evidence capture --run-id --persist` parser/implementation.
- GREEN `pnpm --filter @krn/cli test`: passed with 15 tests.
- `pnpm typecheck`: passed during Slice 06.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn evidence capture --run-id
  b529e20e-b8ca-4cb5-9342-58578e880945 --persist`: passed and printed
  persisted IDs.
- SQL proof for execution run `b529e20e-b8ca-4cb5-9342-58578e880945`: evidence
  bundles `1`, review assessments `1`, feedback deltas `1`, run events `2`.
- `pnpm test`: passed during Slice 06.
- `pnpm --filter @krn/db db:check`: passed during Slice 06.
- No `any` / double-assertion scan over `packages/core`, `packages/harness/src`,
  `packages/db/src`, and `packages/cli/src`: passed.
- RED `pnpm --filter @krn/cli test`: failed on missing
  `db smoke harness-evidence` parser support.
- GREEN `pnpm --filter @krn/cli test`: passed with 16 tests.
- `pnpm typecheck`: passed during Slice 07.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed. Execution run
  `8db14bdf-6390-485d-9736-89274c5affff`, evidence bundle
  `1dbe1d1b-e537-4670-a6cb-2b878b44c7f2`, review assessment
  `31fe636d-5d61-402b-82bc-64d225cd0c6d`, feedback delta
  `7bc1b78f-4aeb-48cb-b9e5-2d8b456f1fe9`, linked counts `1/1/1`, run events
  `2`, cleanup remaining marker count `0`.
- `pnpm test`: passed during Slice 07.
- `pnpm --filter @krn/db db:check`: passed during Slice 07.
- No `any` / double-assertion scan over `packages/core`, `packages/harness/src`,
  `packages/db/src`, and `packages/cli/src`: passed.
- `git diff --check`: passed during Slice 07.
- RED `pnpm --filter @krn/cli test`: failed on missing doctor harness
  persistence readiness output and missing
  `deriveHarnessPersistenceReadiness`.
- GREEN `pnpm --filter @krn/cli test`: passed with 17 tests.
- `pnpm typecheck`: passed during Slice 08.
- No-env `pnpm --filter @krn/cli krn doctor`: passed and reported harness
  persistence preview-only with all smoke commands available.
- Live `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed and reported harness persistence schema
  `ready (10/10 tables present)` and readiness
  `ready (schema present; smoke commands available)`.
- `pnpm test`: passed during Slice 08.
- `pnpm --filter @krn/db db:check`: passed during Slice 08.
- No `any` / double-assertion scan over `packages/core`, `packages/harness/src`,
  `packages/db/src`, and `packages/cli/src`: passed.
- `git diff --check`: passed during Slice 08.
- Direct SQL read-only proof around live doctor kept
  `execution_runs,evidence_bundles,review_assessments,feedback_deltas,run_events`
  counts unchanged at `1,1,1,1,2`.
- Live `krn plan --task "improve KRN doctor harness persistence readiness"
  --persist`: passed and created execution run
  `66626e90-0cf5-4803-9bc7-f477b28b47c4`.
- Live `krn evidence capture --run-id
  66626e90-0cf5-4803-9bc7-f477b28b47c4 --persist`: passed and created
  evidence bundle `94cf92cf-a826-406f-bcad-9d9ebb7a0a8e`, review assessment
  `630d46ec-e323-4974-a90e-4a1a03571499`, and feedback delta
  `21c93ea7-2f2e-4e0c-8d80-ed07138e57f8`.
- Live `krn doctor`: passed and reported harness persistence readiness ready.
- Live `pnpm db:smoke:harness-plan`: passed with cleanup remaining marker count
  `0`.
- Live `pnpm db:smoke:harness-evidence`: passed with cleanup remaining marker
  count `0`.
- `pnpm typecheck`: passed during Slice 09.
- `pnpm test`: passed during Slice 09.
- Direct SQL dogfood readback for execution run
  `66626e90-0cf5-4803-9bc7-f477b28b47c4`: status `planned`, evidence contract
  present, evidence bundles `1`, review assessments `1`, feedback deltas `1`,
  run events `2`.
- Direct SQL smoke cleanup count for `krn-harness-smoke-%` and
  `krn-evidence-smoke-%` workspaces returned `0,0`.
- Forbidden directory scan for `apps`, `dashboard`, `api`, and `.krn`: passed
  with no output.

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
- Used: `brain-store-schema` for Slice 05 persisted smoke/readback/cleanup.
- Used: `typescript-type-safety` for Slice 05 DB smoke report and cleanup
  boundary.
- Used: `test-driven-development` for Slice 05 RED/GREEN CLI parser test.
- Used: `evidence-review-loop` for Slice 06 evidence/review/feedback
  persistence.
- Used: `typescript-type-safety` for Slice 06 CLI arg/env/run-id boundaries.
- Used: `test-driven-development` for Slice 06 RED/GREEN CLI tests.
- Used: `brain-store-schema` for Slice 07 persisted smoke/readback/cleanup.
- Used: `evidence-review-loop` for Slice 07 linked evidence/review/feedback
  smoke proof.
- Used: `typescript-type-safety` for Slice 07 DB smoke report and CLI parser
  boundary.
- Used: `test-driven-development` for Slice 07 RED/GREEN CLI parser test.
- Used: `brain-store-schema` for Slice 08 read-only schema presence checks.
- Used: `codex-adapter-plan` for Slice 08 operator-facing doctor output.
- Used: `typescript-type-safety` for Slice 08 DB/CLI readiness boundaries.
- Used: `test-driven-development` for Slice 08 RED/GREEN doctor tests.
- Used: `evidence-review-loop` for Slice 09 persisted dogfood proof capture.
- Used: `handoff-compact` for Slice 09 continuation state refresh.
- Not used yet: `target-infra-adr`, `activation-engine`.

Next action:

- Slice 10: anti-rot audit across tests, live DB proof commands, and forbidden
  surface checks.
