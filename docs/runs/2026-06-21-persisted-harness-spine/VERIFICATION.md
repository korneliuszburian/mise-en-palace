# Verification

Slice 00 preflight:

- `git status --short --branch`: passed; clean `main...origin/main`.
- `git log --oneline -10`: passed. Newest commit:
  `a312afe docs(goal): define persisted harness spine`.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace tests.
- `pnpm --filter @krn/cli krn doctor`: passed without `KRN_DATABASE_URL`;
  reported Postgres not configured, pgvector/migrations skipped, and brain-store
  readiness as preview only.

Scope checks:

- No raw onboarding materials were read.
- No dashboard, API, MCP server, broad worker runtime, research layer, `.krn`,
  runtime markdown memory, separate store, full MemoryStore, full SourceStore,
  or broad eval suite was added.
- Required repo-local skill gates are now explicit in `GOAL.md`.
- Slice 00 is docs/ledger work only; persisted harness behavior remains
  unimplemented until later slices.

Slice 01 inventory:

- Targeted reads of DB harness/events schema, migration SQL, harness repository
  ports, Drizzle repository adapters, DB mappers, compiler, CLI parser, plan
  command, evidence capture command, and database runtime: passed.
- Targeted search for `--persist`, `run-id`, execution run methods, evidence
  persistence methods, and migration table names: passed.
- `pnpm --filter @krn/db db:check`: passed; Drizzle reported schema and
  migrations are consistent.
- `pnpm typecheck`: passed across workspace projects.

Slice 02 schema decision:

- `git status --short --branch`: passed; clean `main...origin/main` at
  `7b04a6c docs(run): record harness persistence inventory` before docs edits.
- `pnpm --filter @krn/db db:check`: passed; Drizzle schema and migrations
  remain consistent.
- `pnpm typecheck`: passed across workspace projects.
- `docker compose ps krn-postgres`: passed; local `krn-postgres` was healthy on
  host port `54329`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected `3`, applied `3`, pgvector available, and
  brain-store readiness ready.

Slice 03 repository/readback:

- Initial `pnpm --filter @krn/db test`: failed because the new DB package test
  script needed workspace links after adding `vitest`.
- `pnpm install`: passed and refreshed workspace links.
- RED `pnpm --filter @krn/db test`: failed as expected because
  `mapFeedbackDelta` returned empty `memoryCandidates`.
- RED `pnpm --filter @krn/db test`: failed as expected because
  `DrizzleHarnessRunRepository.prototype.getHarnessRunByExecutionRunId` was
  missing.
- GREEN `pnpm --filter @krn/db test`: passed with 2 tests.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace tests, now including `@krn/db`.
- `pnpm --filter @krn/db db:check`: passed; Drizzle schema and migrations
  remain consistent.
- `rg -n "as unknown as|as any|\bany\b" packages/core packages/harness/src
  packages/db/src`: passed with no matches.

Slice 04 persisted plan:

- RED `pnpm --filter @krn/cli test`: failed as expected because old `plan`
  behavior tried to use DB automatically, `--persist` parsed as invalid usage,
  and persisted IDs were absent.
- GREEN `pnpm --filter @krn/cli test`: passed with 11 tests.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace tests.
- `pnpm --filter @krn/db db:check`: passed; Drizzle schema and migrations
  remain consistent.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn plan --task "persist harness run slice 04 proof" --persist`:
  passed and printed persisted IDs:
  `operatorIntent=b03aa0fa-2883-49c2-a73b-21bbb4bdb0be`,
  `taskContract=d6e4c531-2bc6-4a3d-a183-c17f51ae64b7`,
  `harnessPlan=82c8a1de-f4c0-421f-83e5-e44b6bcd9677`,
  `contextAssembly=a203c448-0382-460e-903e-f96d86683760`,
  `executionRun=b529e20e-b8ca-4cb5-9342-58578e880945`.
- SQL proof for execution run `b529e20e-b8ca-4cb5-9342-58578e880945`: status
  `planned`, `harness_plans.metadata ? 'evidenceContract' = true`, evidence
  command count `3`, run event count `1`.
- Live preview with DB configured but without `--persist`: passed; SQL
  `execution_runs` count stayed `1` before and after.
- `rg -n "as unknown as|as any|\bany\b" packages/core packages/harness/src
  packages/db/src packages/cli/src`: passed with no matches.

Slice 05 persisted harness plan smoke:

- RED `pnpm --filter @krn/cli test`: failed as expected because
  `db smoke harness-plan` parsed as invalid usage.
- GREEN `pnpm --filter @krn/cli test`: passed with 12 tests.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace tests.
- `pnpm --filter @krn/db db:check`: passed; Drizzle schema and migrations
  remain consistent.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-plan`: passed. Output reported execution run
  `7fc256ef-2868-483c-bd3a-c3283df4b761`, readback `matched`, evidence
  contract commands `3`, run events `1`, cleanup remaining marker count `0`,
  and harness plan smoke `passed`.

Slice 06 persisted evidence capture:

- RED `pnpm --filter @krn/cli test`: failed as expected because
  `evidence capture --run-id --persist` parsed as invalid usage.
- GREEN `pnpm --filter @krn/cli test`: passed with 15 tests.
- `pnpm typecheck`: passed across workspace projects.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn evidence capture --run-id
  b529e20e-b8ca-4cb5-9342-58578e880945 --persist`: passed and printed
  `evidenceBundle=41b27f25-efb7-48ed-92ad-00fb88cdf7c4`,
  `reviewAssessment=384bb648-dcf4-43f6-a60e-9003acff047e`,
  `feedbackDelta=975e26bf-6eae-4fb8-a0ae-80352977331c`.
- SQL proof for execution run `b529e20e-b8ca-4cb5-9342-58578e880945`: evidence
  bundles `1`, review assessments `1`, feedback deltas `1`, run events `2`.
- `pnpm test`: passed across workspace tests.
- `pnpm --filter @krn/db db:check`: passed; Drizzle schema and migrations
  remain consistent.
- `rg -n "as unknown as|as any|\bany\b" packages/core packages/harness/src
  packages/db/src packages/cli/src`: passed with no matches.

Slice 07 persisted evidence smoke:

- RED `pnpm --filter @krn/cli test`: failed as expected because
  `db smoke harness-evidence` parsed as invalid usage.
- GREEN `pnpm --filter @krn/cli test`: passed with 16 tests.
- `pnpm typecheck`: passed across workspace projects.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed. Output reported execution run
  `8db14bdf-6390-485d-9736-89274c5affff`, evidence bundle
  `1dbe1d1b-e537-4670-a6cb-2b878b44c7f2`, review assessment
  `31fe636d-5d61-402b-82bc-64d225cd0c6d`, feedback delta
  `7bc1b78f-4aeb-48cb-b9e5-2d8b456f1fe9`, evidence bundles `1`, review
  assessments `1`, feedback deltas `1`, run events `2`, cleanup remaining
  marker count `0`, and harness evidence smoke `passed`.
- `pnpm test`: passed across workspace tests.
- `pnpm --filter @krn/db db:check`: passed; Drizzle schema and migrations
  remain consistent.
- `rg -n "as unknown as|as any|\bany\b" packages/core packages/harness/src
  packages/db/src packages/cli/src`: passed with no matches.
- `git diff --check`: passed.

Slice 08 doctor harness persistence readiness:

- RED `pnpm --filter @krn/cli test`: failed as expected because doctor did not
  report harness persistence schema/readiness and
  `deriveHarnessPersistenceReadiness` was missing.
- GREEN `pnpm --filter @krn/cli test`: passed with 17 tests.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm --filter @krn/cli krn doctor`: passed without DB config. It reported
  `Harness persistence schema: skipped (Postgres not configured)`, all three
  smoke commands available, and harness persistence readiness as preview-only.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed. It reported Postgres reachable, pgvector
  available, migrations `verified (3/3 applied)`, harness persistence schema
  `ready (10/10 tables present)`, all three smoke commands available, and
  harness persistence readiness `ready (schema present; smoke commands
  available)`.
- `pnpm test`: passed across workspace tests.
- `pnpm --filter @krn/db db:check`: passed; Drizzle schema and migrations
  remain consistent.
- `rg -n "as unknown as|as any|\bany\b" packages/core packages/harness/src
  packages/db/src packages/cli/src`: passed with no matches.
- `git diff --check`: passed.
- Direct SQL counts before and after live doctor were unchanged:
  `execution_runs,evidence_bundles,review_assessments,feedback_deltas,run_events`
  stayed `1,1,1,1,2`.

Slice 09 persisted harness loop dogfood:

- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn plan --task "improve KRN doctor harness persistence readiness"
  --persist`: passed and printed persisted IDs, including execution run
  `66626e90-0cf5-4803-9bc7-f477b28b47c4`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn evidence capture --run-id
  66626e90-0cf5-4803-9bc7-f477b28b47c4 --persist`: passed and printed
  evidence bundle `94cf92cf-a826-406f-bcad-9d9ebb7a0a8e`, review assessment
  `630d46ec-e323-4974-a90e-4a1a03571499`, and feedback delta
  `21c93ea7-2f2e-4e0c-8d80-ed07138e57f8`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed and reported harness persistence readiness
  ready.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-plan`: passed with cleanup remaining marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed with cleanup remaining marker count `0`.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace tests.
- Direct SQL readback for execution run
  `66626e90-0cf5-4803-9bc7-f477b28b47c4`: status `planned`, evidence contract
  present, evidence bundles `1`, review assessments `1`, feedback deltas `1`,
  run events `2`.
- Direct SQL smoke cleanup count for `krn-harness-smoke-%` and
  `krn-evidence-smoke-%` workspaces returned `0,0`.
- Forbidden directory scan for `apps`, `dashboard`, `api`, and `.krn`: passed
  with no output.
- Forbidden store/runtime scan found no KRN runtime dependency or implementation
  use; the only external-store dependency hit remains optional Drizzle peer
  metadata in `pnpm-lock.yaml`, and other matches are docs/non-goal text.

Slice 10 anti-rot audit:

- `git status --short --branch`: passed; clean `main...origin/main`.
- `git log --oneline -12`: passed; newest commits covered M21 Slice 00 through
  Slice 09.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace tests.
- `pnpm --filter @krn/cli krn doctor`: passed without DB config.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed and reported harness persistence readiness
  ready.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations `3/3` and pgvector available.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-plan`: passed with cleanup remaining marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed with cleanup remaining marker count `0`.
- `pnpm --filter @krn/db db:check`: passed.
- Direct SQL cleanup count for `krn-smoke-%`, `krn-harness-smoke-%`, and
  `krn-evidence-smoke-%` workspaces returned `0,0,0`.
- Forbidden directory scan for `apps`, `packages/dashboard`, `packages/api`,
  `packages/mcp`, `packages/research`, and `.krn`: passed with no output.
- Direct package-manifest dependency scan for Redis, Kafka, Qdrant, LanceDB,
  Neo4j, Elasticsearch, and OpenSearch: passed with no matches.
- Eval/benchmark directory scan: passed with no output.
- Core library-safe scan: passed with no forbidden imports or runtime APIs.
- No `any` / double-assertion scan over `packages/core`,
  `packages/harness/src`, `packages/db/src`, and `packages/cli/src`: passed
  with no matches.
- `git diff --check`: passed.

Slice 11 final handoff:

- `git status --short --branch`: passed before final handoff edits; clean
  `main...origin/main`.
- `git log --oneline -14`: passed and showed M21 commits through
  `2984d01 docs(run): record persisted harness anti-rot audit`.
- Final handoff is docs-only and references the Slice 10 full anti-rot audit as
  the completion proof.
