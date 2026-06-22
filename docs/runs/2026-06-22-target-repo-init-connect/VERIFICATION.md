# Verification

## Slice 00

Commands run:

```sh
git status --short --branch
git log --oneline -20
pnpm typecheck
pnpm test
pnpm --filter @krn/cli krn doctor
pnpm db:ready
docker compose ps krn-postgres
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:harness-plan
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:harness-evidence
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:source-graph
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:memory-governance
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:retrieval-substrate
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:activation
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:codex-adapter
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:worker-jobs
```

Results:

- `git status --short --branch`: passed with `## main...origin/main` and a
  pre-existing modified `GOAL.md`.
- `git log --oneline -20`: passed with latest commit
  `030f4bf docs(handoff): complete M22-M26 brain spine handoff`.
- `pnpm typecheck`: passed across 7 workspace packages.
- `pnpm test`: passed across 26 test files and 120 tests.
- no-env `krn doctor`: passed with DB-dependent readiness reported as preview
  only and forbidden surfaces absent.
- Plain `pnpm db:ready`: failed because `KRN_DATABASE_URL` was missing. This
  was expected setup feedback, not a schema failure.
- `docker compose ps krn-postgres`: passed with local pgvector Postgres
  healthy on host port `54329`.
- Live `pnpm db:ready`: passed with 7/7 migrations and pgvector available.
- Live DB smokes passed: `db:smoke`, `db:smoke:harness-plan`,
  `db:smoke:harness-evidence`, `db:smoke:source-graph`,
  `db:smoke:memory-governance`, `db:smoke:retrieval-substrate`,
  `db:smoke:activation`, `db:smoke:codex-adapter`, and
  `db:smoke:worker-jobs`.
- Smoke cleanup marker count was zero where the smoke reports it.

Not proven yet:

- Target repo fixture.
- Target repo init dry-run.
- Target repo connect persistence.
- ProjectKernel persistence for a connected target repo.
- Project-scoped planning from a connected target repo.
- Target repo Codex brief and evidence capture.

## Slice 01

Commands run:

```sh
rg -n "init|connect|RepoInstallation|repoInstallation|ProjectKernel|projectKernel|createProject|getProject|projectId|repoFingerprint|workspace|plan --project|--project|codex brief|evidence capture|db smoke" packages/cli/src packages/db/src packages/harness/src packages/core/src package.json -g '*.ts' -g '*.json'
find packages/cli/src packages/db/src packages/harness/src packages/core/src -maxdepth 3 -type f | sort
find tests packages -path '*/fixtures/*' -o -path '*fixtures*' -type f 2>/dev/null | sort
sed -n '1,260p' packages/harness/src/repositories/projectRepository.ts
sed -n '1,320p' packages/db/src/repositories/DrizzleProjectRepository.ts
sed -n '1,260p' packages/db/src/schema/harness.ts
sed -n '1,260p' packages/cli/src/databaseRuntime.ts
sed -n '1,620p' packages/cli/src/parseArgs.ts
sed -n '1360,1435p' packages/cli/src/parseArgs.ts
sed -n '1,360p' packages/cli/src/runPlanCommand.ts
sed -n '1,260p' packages/cli/src/runCli.ts
sed -n '1,360p' packages/cli/src/runCli.test.ts
sed -n '1,620p' packages/cli/src/runDbSmokeCommand.ts
sed -n '1,360p' packages/cli/src/runDoctorCommand.ts
sed -n '1,420p' packages/cli/src/runCodexBriefCommand.ts
sed -n '1,420p' packages/cli/src/runEvidenceCaptureCommand.ts
sed -n '1,360p' packages/harness/src/repositories/types.ts
sed -n '390,445p' packages/db/src/repositories/mappers.ts
sed -n '1,220p' packages/db/src/persistenceSmoke.ts
sed -n '1,280p' packages/db/src/harnessPlanSmoke.ts
sed -n '1,260p' packages/harness/src/compiler/compileHarnessPlan.ts
pnpm --filter @krn/cli krn init --dry-run --repo tests/fixtures/target-repos/typescript-basic
pnpm --filter @krn/cli krn plan --project project-1 --task "improve test script readiness" --persist
pnpm typecheck
```

Results:

- Current `krn init --dry-run --repo ...` exits unsupported with status 2.
- Current `krn plan --project ...` exits unsupported with status 2.
- `tests/fixtures/target-repos/` does not exist.
- Project/repo/kernel schema exists, including created/updated timestamps and
  metadata.
- Repo path support exists only as `repo_installations.local_path_hint`; repo
  fingerprint does not exist as a first-class column.
- Project repository methods exist for create/read by workspace/project slug
  and latest kernel, but not for repo fingerprint/path lookup, listing
  installations, or cleanup.
- Existing plan compiler and activation path already accept project ID once the
  CLI resolves it.
- Existing smoke helpers provide reusable marker, readback, and cleanup
  patterns.
- `pnpm typecheck` passed after inventory docs were updated.

## Slice 02

Commands run:

```sh
pnpm typecheck
pnpm test
```

Results:

- Added `tests/fixtures/target-repos/typescript-basic/package.json`.
- Added `tests/fixtures/target-repos/typescript-basic/tsconfig.json`.
- Added `tests/fixtures/target-repos/typescript-basic/src/index.ts`.
- Fixture contains package manager/script signals, TypeScript config, and
  TypeScript source.
- Fixture does not contain `.krn`, `.codex`, `.agents`, dashboard, `apps/`, or
  runtime markdown memory.
- `pnpm typecheck` passed across 7 workspace packages.
- `pnpm test` passed across 26 test files and 120 tests.

## Slice 03

Commands run:

```sh
pnpm --filter @krn/db test -- schema/harness.test.ts repositories/DrizzleProjectRepository.test.ts
pnpm --filter @krn/db test -- schema/harness.test.ts repositories/DrizzleProjectRepository.test.ts
pnpm db:generate
sed -n '1,200p' packages/db/src/migrations/0007_conscious_scarlet_witch.sql
pnpm typecheck
pnpm --filter @krn/db db:check
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
```

Results:

- RED targeted DB tests failed because `repoFingerprint` and target repo
  repository methods were missing.
- Added nullable `repo_installations.repo_fingerprint`.
- Added `repo_installations_local_path_hint_idx`.
- Added unique `repo_installations_repo_fingerprint_unique`.
- Generated migration `packages/db/src/migrations/0007_conscious_scarlet_witch.sql`.
- SQL inspection confirmed the migration only adds `repo_fingerprint`, the
  local path index, and the repo fingerprint unique index.
- `pnpm --filter @krn/db db:check` passed.
- `pnpm typecheck` passed across 7 workspace packages.
- Live `pnpm db:ready` passed with 8/8 migrations and pgvector available.

## Slice 04

Commands run:

```sh
pnpm --filter @krn/db test -- repositories/DrizzleProjectRepository.test.ts
pnpm typecheck
pnpm test
```

Results:

- Added `getProjectByRepoFingerprint`.
- Added `getProjectByRepoPath`.
- Added `listRepoInstallationsForProject`.
- Added `cleanupFixtureProjectRecords`.
- `createRepoInstallation` now persists optional `repoFingerprint`.
- Targeted repository test passed.
- `pnpm typecheck` passed across 7 workspace packages.
- `pnpm test` passed across 28 test files and 122 tests.

## Slice 05

Commands run:

```sh
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm --filter @krn/cli krn init --dry-run --repo tests/fixtures/target-repos/typescript-basic
git status --short --branch
pnpm typecheck
pnpm test
```

Results:

- RED CLI test failed because `init` was unsupported.
- Added `krn init --dry-run --repo <path>` parser and dispatcher support.
- Added read-only target repo detection for absolute path, package manager,
  TypeScript presence, package scripts, existing `AGENTS.md`, existing
  `.codex`, existing `.agents/skills`, forbidden surfaces, and repo
  fingerprint.
- Added ProjectKernel proposal and Codex overlay proposal output.
- Added `No files written` output and next connect command.
- Real fixture dry-run passed and printed `No files written`.
- Initial real command exposed package-cwd path resolution under
  `pnpm --filter`; added a regression test and fixed repo-root fallback via
  `pnpm-workspace.yaml` discovery.
- Git status after dry-run showed only intended source changes and the
  pre-existing modified `GOAL.md`; the fixture repo was not mutated.
- `pnpm typecheck` passed across 7 workspace packages.
- `pnpm test` passed across 28 test files and 124 tests.

## Slice 06

Commands run:

```sh
pnpm --filter @krn/cli test -- runCli.test.ts
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn init --connect --repo tests/fixtures/target-repos/typescript-basic --persist
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn init --connect --repo tests/fixtures/target-repos/typescript-basic --persist
pnpm typecheck
pnpm test
```

Results:

- RED CLI tests failed because `init --connect` was unsupported.
- Added `krn init --connect --repo <path> --persist` parser and dispatcher
  support.
- Added missing DB guard:
  `KRN_DATABASE_URL is required for krn init --connect --persist`.
- Added DB-backed connect runtime using `DrizzleProjectRepository`.
- Connect creates or reuses workspace `local`, a target project, repo
  installation, and ProjectKernel.
- Connect writes no files.
- First fixture connect created Project
  `9da67341-0124-407e-b3fa-197f7f850a57`, RepoInstallation
  `e40219ed-a6b1-4842-9ef4-9bf851cdb65e`, and ProjectKernel
  `db32f8c2-dc8d-4e26-b4b5-89ca84f721f6`.
- Second fixture connect reused the same Project, RepoInstallation, and
  ProjectKernel IDs.
- `pnpm typecheck` passed across 7 workspace packages.
- `pnpm test` passed across 28 test files and 126 tests.

## Slice 07

Commands run:

```sh
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm typecheck
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:init-connect
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:init-connect
pnpm test
```

Results:

- RED CLI tests failed because `db:smoke:init-connect` script and parser target
  were missing.
- Added root script `pnpm db:smoke:init-connect`.
- Added `krn db smoke init-connect` parser/CLI smoke routing.
- Added `runInitConnectSmokeCheck` in `@krn/db`.
- Smoke persists marker-scoped Project, RepoInstallation, and ProjectKernel.
- Smoke reads project back by repo fingerprint and path, lists repo
  installations, reads latest ProjectKernel, verifies idempotent reuse, and
  cleans marker rows.
- First live smoke failed because the smoke used the same `local_path_hint` as
  the earlier manual fixture connect. The smoke was updated to use a
  marker-scoped path hint so it remains isolated from existing fixture
  registration rows.
- Live `pnpm db:smoke:init-connect` passed with Project
  `f82ac45f-8b68-493c-9c4b-f594aa843b5c`, RepoInstallation
  `b6c30792-904a-4077-8f86-b3eda770ff73`, ProjectKernel
  `55e43209-6101-49b1-9c46-564e3d2abaec`, idempotency matches, and cleanup
  remaining marker count `0`.
- `pnpm typecheck` passed across 7 workspace packages.
- `pnpm test` passed across 28 test files and 128 tests.

## Slice 08

Commands run:

```sh
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm typecheck
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn plan --project 9da67341-0124-407e-b3fa-197f7f850a57 --task "improve test script readiness" --persist
pnpm test
git diff --check
```

Results:

- RED CLI tests failed because `plan --project ... --persist` exited with
  status `2`; the parser rejected `--project` before runtime resolution.
- Added `--project <project-id>` and `--project=<project-id>` parser support
  for `krn plan`.
- Added plan runtime `projectId` plumbing from parser to `runPlanCommand` and
  `createDatabaseRuntime`.
- Added explicit DB runtime project resolution:
  `getProject`, `getLatestProjectKernel`, and
  `listRepoInstallationsForProject`.
- Missing explicit Project fails as
  `Project not found for --project <id>`; it does not fallback to the default
  project.
- Missing explicit ProjectKernel fails as
  `ProjectKernel not found for --project <id>`.
- Project-scoped plan output prints Project ID, ProjectKernel ID, and
  RepoInstallation IDs before persisted run IDs.
- Focused CLI test passed with 70 tests.
- First `pnpm typecheck` caught an `exactOptionalPropertyTypes` issue where an
  optional `projectScopedMetadata` property was set to `undefined`; fixed with
  conditional object spreads.
- Second `pnpm typecheck` passed across 7 workspace packages.
- Live DB project-scoped plan passed for connected fixture Project
  `9da67341-0124-407e-b3fa-197f7f850a57`.
- Live DB project-scoped plan loaded ProjectKernel
  `db32f8c2-dc8d-4e26-b4b5-89ca84f721f6` and RepoInstallation
  `e40219ed-a6b1-4842-9ef4-9bf851cdb65e`.
- Live DB project-scoped plan persisted ExecutionRun
  `d001b7b4-fa25-4156-8538-fb7dc316d3d3`.
- `pnpm test` passed across 28 files and 130 tests.
- `git diff --check` passed.

## Slice 09

Commands run:

```sh
pnpm --filter @krn/cli test -- runCli.test.ts targetRepoHarnessSmoke.test.ts
pnpm --filter @krn/cli test -- runCli.test.ts targetRepoHarnessSmoke.test.ts
pnpm typecheck
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:target-repo-harness
pnpm test
git diff --check
```

Results:

- RED focused CLI tests failed because `targetRepoHarnessSmoke` did not exist,
  `krn db smoke target-repo-harness` was rejected with status `2`, and the
  root package script was missing.
- Added root script `pnpm db:smoke:target-repo-harness`.
- Added parser target `krn db smoke target-repo-harness`.
- Added `packages/cli/src/targetRepoHarnessSmoke.ts` with format helper and
  live smoke helper.
- Added missing-DB output:
  `Target repo harness smoke: skipped (database not configured)`.
- Focused CLI tests passed with 73 tests.
- `pnpm typecheck` passed across 7 workspace packages.
- Live `pnpm db:smoke:target-repo-harness` passed.
- Live smoke connected fixture Project
  `f7d589eb-f532-48f3-b8a1-abd120b51f69`, RepoInstallation
  `e6d07b06-e015-457d-8f5d-450d56f77715`, and ProjectKernel
  `2a752de3-82d3-4181-996b-ae46d49372d0`.
- Live smoke persisted ExecutionRun
  `f9f2073b-0d69-4810-a8aa-2415af9b7fde`, rendered Codex brief `yes`,
  persisted EvidenceBundle `88bd55e1-1bae-48f6-a2c9-17fdd825dee6`,
  ReviewAssessment `b7bd5876-0fa3-4daf-833b-4d7b145c47dc`, and FeedbackDelta
  `d253e142-2f1f-4cc1-b661-4d3b7a33f033`.
- Target project linkage was verified as `yes`.
- Cleanup remaining marker count was `0`.
- `pnpm test` passed across 29 files and 133 tests.
- `git diff --check` passed.

## Slice 10

Commands run:

```sh
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm --filter @krn/cli krn doctor
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:init-connect
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:target-repo-harness
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn doctor
pnpm typecheck
pnpm test
```

Results:

- RED focused CLI tests failed because `Target repo readiness` was absent from
  `krn doctor` and `deriveTargetRepoReadiness` was not exported.
- Added target repo doctor checks for init/connect command availability,
  fixture availability, Project/RepoInstallation/ProjectKernel schema,
  init-connect smoke proof, target-repo-harness smoke proof, cross-project
  leakage proof, and forbidden target surfaces.
- Added `deriveTargetRepoReadiness` states:
  `preview only`, `unverified (init-connect smoke missing)`,
  `partially ready`, `ready`, and blocked states for forbidden target surfaces,
  missing schema, missing fixture/command, Postgres unreachable, and brain
  store not ready.
- Focused CLI test passed with 74 tests.
- No-env `krn doctor` passed and reported:
  `Target repo readiness: preview only (set KRN_DATABASE_URL and run init-connect and target repo harness smokes for proof)`.
- Live `pnpm db:smoke:init-connect` passed with Project
  `83dc9748-df97-45f5-893f-4b7bee6fe3ba`, RepoInstallation
  `ccc307bb-2f8d-4f6e-8db4-1eeaaaa2f96f`, ProjectKernel
  `b4f01d52-a660-4ac3-83c7-6c0448536b41`, and cleanup remaining marker count
  `0`.
- Live `pnpm db:smoke:target-repo-harness` passed with Project
  `6e7eee1f-9481-4c0b-9929-0f6493919cad`, RepoInstallation
  `91273dd1-ded2-446f-a851-d2cc0004557e`, ProjectKernel
  `8baf670f-6d10-4a23-b604-ffb091449da8`, ExecutionRun
  `eb26785c-27e1-444e-bbf2-2469c9ba38dd`, EvidenceBundle
  `7d672f4b-b4d8-4040-8631-ca6c2908cee3`, ReviewAssessment
  `924cd281-090b-41ae-9a18-863d1d61c065`, FeedbackDelta
  `275bdc28-fa69-4803-b92a-f8919fdecd31`, target project linked `yes`, and
  cleanup remaining marker count `0`.
- DB-aware `krn doctor` passed and reported:
  `Target repo readiness: ready (init-connect smoke proven; target repo harness smoke proven)`.
- `pnpm typecheck` passed across 7 workspace packages.
- `pnpm test` passed across 29 files and 134 tests.

## Slice 11

Commands run:

```sh
pnpm --filter @krn/cli krn init --dry-run --repo tests/fixtures/target-repos/typescript-basic
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn init --connect --repo tests/fixtures/target-repos/typescript-basic --persist
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn plan --project 9da67341-0124-407e-b3fa-197f7f850a57 --task "improve test script readiness" --persist
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn codex brief --run-id eb16411b-d304-420e-adc7-1fdb86857c1d
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn evidence capture --run-id eb16411b-d304-420e-adc7-1fdb86857c1d --persist
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn doctor
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:init-connect
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:target-repo-harness
```

Results:

- Dry-run target repo init passed for
  `tests/fixtures/target-repos/typescript-basic`.
- Dry-run output detected repo fingerprint `sha256:055f1087253b102b`,
  package manager `package-json`, TypeScript `present`, scripts `build, test`,
  no existing AGENTS/.codex/.agents surface, forbidden surfaces `absent`, and
  `No files written`.
- Connect persisted/reused Project `9da67341-0124-407e-b3fa-197f7f850a57`,
  RepoInstallation `e40219ed-a6b1-4842-9ef4-9bf851cdb65e`, and ProjectKernel
  `db32f8c2-dc8d-4e26-b4b5-89ca84f721f6`.
- Project-scoped plan persisted OperatorIntent
  `8252bd88-0dc1-4cf8-8be6-bd23126bea4f`, TaskContract
  `e07cd43c-ad91-42a4-a537-b44b0428f01b`, HarnessPlan
  `df37ecb3-5d25-4532-ba58-a910e41f17da`, ContextAssembly
  `deefab35-1da8-4e3e-9298-1a20d1cb1256`, and ExecutionRun
  `eb16411b-d304-420e-adc7-1fdb86857c1d`.
- Activation context status was `abstained` with zero inclusions and exclusions.
  This is expected for the empty fixture and is recorded as honest gap behavior,
  not a failure.
- `krn codex brief --run-id eb16411b-d304-420e-adc7-1fdb86857c1d` read the
  persisted run from Postgres in read-only mode. Codex invocation was `none`;
  memory mutation was `none`.
- `krn evidence capture --run-id eb16411b-d304-420e-adc7-1fdb86857c1d --persist`
  persisted EvidenceBundle `6c85abdd-7b6d-468a-833e-0e12a445b6a6`,
  ReviewAssessment `e6e20c8b-11bd-41a5-adbb-18eadd1cbec0`, and FeedbackDelta
  `500f4cf0-3b03-449d-9993-65287808c6d6`.
- Evidence capture reported changed files from pre-existing user context:
  modified `GOAL.md` and untracked `docs/materials/2026-06-22-big-brain*.md`.
  Diff risk was `medium`; review burden was to summarize changed files,
  command proof, residual risk, and rollback path.
- Evidence capture reported memory mutation `none`, no MemoryCandidate row, and
  no MemoryRecord row.
- DB-aware `krn doctor` passed and reported:
  `Target repo readiness: ready (init-connect smoke proven; target repo harness smoke proven)`.
- Final init-connect smoke passed with Project
  `ae8b0c69-4202-4250-ae7d-4ab9155f97d9`, RepoInstallation
  `ccf625ac-67ca-4d69-a860-08e9c3aeba01`, ProjectKernel
  `4ccc76d0-3992-4ac6-ba64-bf9435ead246`, and cleanup remaining marker count
  `0`.
- Final target repo harness smoke passed with Project
  `76b82d6c-2a4b-41da-a47d-0d6b79969e49`, RepoInstallation
  `7f8388be-213f-4ecb-a846-e942a3ab4cfc`, ProjectKernel
  `0b52fa7f-43f7-4f90-b735-77b7047528c9`, ExecutionRun
  `c0720c89-4a7c-4607-bf91-1afaf420c01b`, EvidenceBundle
  `94511fb9-b12e-4037-8682-637176bcd7d6`, ReviewAssessment
  `fffe2d44-96cd-4d43-ae21-1a88420f4093`, FeedbackDelta
  `94166a2b-1f0d-4ee4-b58c-ae8bfb071dec`, target project linked `yes`, and
  cleanup remaining marker count `0`.
