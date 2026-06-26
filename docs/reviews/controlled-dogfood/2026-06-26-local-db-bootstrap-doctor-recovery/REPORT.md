# Local DB Bootstrap And Doctor Recovery

Status: V03-00 completion report.

Date: 2026-06-26

## Executive Verdict

V03-00 reduced the local DB bootstrap ambiguity that appeared in V02-08. `krn
db readiness` and `krn doctor` now render explicit DB modes and recovery
commands for preview/no-DB, configured-but-unreachable, connected-but-not-ready,
and ready states.

The recovery path was proven in the current shell: `pnpm db:ready` first failed
with `CONNECT_TIMEOUT localhost:54329`, then the emitted next action
`docker compose up -d krn-postgres; docker compose ps krn-postgres; pnpm
db:ready` brought local Postgres back and DB readiness/smoke passed.

This does not complete V02-01 and does not prove product readiness.

## Read

- `GOAL.md`
- `PLAN.md`
- `docs/KRN_KERNEL.md`
- `.agents/skills/evidence-review-loop/SKILL.md`
- `.agents/skills/brain-store-schema/SKILL.md`
- `package.json`
- `compose.yaml`
- `.github/workflows/ci.yml`
- `packages/cli/src/runDbReadinessCommand.ts`
- `packages/cli/src/runDoctorCommand.ts`
- `packages/cli/src/doctorDbChecks.ts`
- `packages/cli/src/doctorReadiness.ts`
- `packages/cli/src/runDbReadinessCommand.test.ts`
- `packages/cli/src/runCli.test.ts`
- `docs/runbooks/local-brain-store.md`
- `docs/runbooks/internal-alpha-install.md`

## Changed

- Added a pure CLI DB recovery guidance helper.
- Added `DB mode` output to `krn db readiness`.
- Added `Postgres mode` and `Postgres next action` output to `krn doctor`.
- Added recovery output for:
  - missing `KRN_DATABASE_URL`;
  - configured but unreachable local Postgres;
  - connected but not ready;
  - ready.
- Added deterministic tests for DB recovery guidance and doctor preview output.
- Updated the local brain-store runbook with DB modes and proof boundaries.
- Updated root `PLAN.md` / `GOAL.md` for V03 activation.

## DB Used

Yes, local current-shell DB was used after recovery.

Initial local DB state:

```txt
pnpm db:ready -> failed
DB mode: configured but unreachable
Postgres/migrations: failed (write CONNECT_TIMEOUT localhost:54329)
```

Recovery commands:

```sh
docker compose up -d krn-postgres
docker compose ps krn-postgres
pnpm db:ready
pnpm db:smoke
```

Recovered DB state:

```txt
DB mode: ready
Migrations expected: 14
Migrations applied: 14
pgvector: available
Persistence smoke: passed
```

## Commands Run

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git status --short --branch` | passed, dirty with active V03 edits | Worktree contained the active V03 changes. | Does not prove behavior correctness. |
| `pnpm --filter @krn/cli test -- runDbReadinessCommand runCli doctorReadiness` | passed | CLI recovery guidance and doctor preview output have deterministic coverage. | Does not prove live DB readiness. |
| `pnpm krn doctor` | passed | Preview/no-DB doctor mode now includes `Postgres mode` and next action. | Does not prove DB-backed runtime truth. |
| `pnpm db:ready` | failed before recovery | The configured local DB endpoint was unreachable and output gave a next action. | Does not prove schema or migrations were broken. |
| `docker compose up -d krn-postgres` | passed | The local Postgres service can be started from the documented compose service. | Does not prove migrations or pgvector by itself. |
| `docker compose ps krn-postgres` | passed | The service was visible after start. | Health was still starting at the moment of this check. |
| `pnpm db:ready` | passed after recovery | Local DB was reachable with 14/14 migrations applied and pgvector available. | Does not prove hosted DB or future shell state. |
| `pnpm db:smoke` | passed after recovery | Minimal persistence insert/read/cleanup works in the current shell. | Does not prove full Memory Brain product quality. |
| `KRN_DATABASE_URL=... pnpm krn doctor` | passed | DB-backed doctor reports brain-store and dependent readiness as ready. | Does not prove another operator can run it unaided. |
| `pnpm typecheck` | passed | Workspace TypeScript compiles after the CLI/output changes. | Does not prove runtime DB behavior. |
| `pnpm test` | passed | Full workspace tests pass after the CLI/output changes. | Does not prove operator usability or V02-01. |
| `pnpm alpha:verify` | passed | Source-workspace alpha verification passes with preview doctor output. | Does not prove DB-backed runtime because alpha doctor runs without `KRN_DATABASE_URL`. |
| `pnpm eval:brain-battle:smoke` | passed | Existing deterministic brain-battle guards still pass after V03-00. | Does not prove product readiness. |
| `pnpm eval:promptfoo:smoke` | passed, 2/2 | Promptfoo adapter/config/provider smoke still runs. | Does not execute KRN behavior. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness. |

## What This Proves

- Missing DB configuration is separated from configured-but-unreachable DB.
- `CONNECT_TIMEOUT localhost:54329` now produces a concrete recovery command.
- Starting local Postgres through the emitted path can recover the current shell.
- `krn doctor` now exposes preview/no-DB and ready DB modes without mutating DB.
- DB readiness and smoke can pass locally after the recovery path.

## What This Does Not Prove

- V02-01 second-operator proof.
- Product readiness.
- Widened internal-alpha readiness.
- Hosted DB readiness.
- That every machine has Docker working.
- That all DB-backed operator friction is resolved.

## Candidates Proposed

| Candidate | Reviewability | Evidence | Does not prove |
|---|---|---|---|
| MemoryCandidate: DB-backed truth requires explicit DB mode plus current-shell `pnpm db:ready` / `pnpm db:smoke` proof. | ready | V03-00 CLI output, runbook update, current-shell recovery proof. | Does not prove future shells are ready. |
| EvalCandidate: doctor/readiness output should guard preview/no-DB, configured-but-unreachable, connected-but-not-ready, and ready DB modes. | ready | `dbRecoveryGuidance` tests and doctor output. | Does not prove DB internals are correct. |

No MemoryRecord, AntiMemoryRecord, SourceClaim, SourceDecision, or final eval
state was mutated.

## Next Recommended Action

Continue to `V03-01 — Target Fixture Battle Harness` after full verification,
commit, push, and CI confirmation for V03-00.
