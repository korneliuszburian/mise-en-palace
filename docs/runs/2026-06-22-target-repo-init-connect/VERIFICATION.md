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
