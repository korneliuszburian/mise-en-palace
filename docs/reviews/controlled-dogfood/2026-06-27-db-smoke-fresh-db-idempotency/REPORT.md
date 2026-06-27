# DB Smoke Fresh DB Idempotency Scenario

Status: complete.
Scenario ID: V04-SC-001.
Mode: db-backed-replay.
Date: 2026-06-27.

## Product Question

Does generic `pnpm db:smoke` still fail after fresh DB recovery with enum
re-create errors, as observed during the headless `wilq-seo` target trial?

## Boundary

Allowed reads:

- `package.json`;
- `.github/workflows/ci.yml`;
- DB smoke and migration readiness source;
- recent DB/headless target reports.

Allowed writes:

- KRN plan/report docs.

Forbidden writes:

- DB migration changes without reproduction;
- living target repo changes;
- broad DB smoke rewrite.

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `git fetch --prune` | passed | Remote refs were current before V04 continuation. | Does not prove behavior. |
| `git status --short --branch` | clean before M3 edits | Work began from clean `main...origin/main`. | Does not prove DB truth. |
| `gh run watch 28273097780 --exit-status` | passed | Commit `9849754` passed CI including DB ready/check/smoke. | Does not prove local scratch DB behavior. |
| `pnpm db:ready` | passed on main local DB | Current shell DB has 14/14 migrations and pgvector. | Does not prove fresh DB idempotency. |
| `pnpm db:smoke` | passed on main local DB | Generic persistence smoke works on current local DB. | Does not reproduce fresh-volume state. |
| `docker compose exec -T krn-postgres psql ... create database krn_v04_smoke` | passed | A scratch DB was created without changing the main `krn` DB. | Does not prove migrations yet. |
| `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn_v04_smoke pnpm db:ready` | passed | Fresh scratch DB can apply 14/14 migrations and pgvector is available. | Does not prove all smoke targets. |
| `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn_v04_smoke pnpm db:smoke` | passed | Generic DB smoke passes after fresh DB migration. | Does not prove every named DB smoke. |
| repeated `KRN_DATABASE_URL=.../krn_v04_smoke pnpm db:smoke` | passed | Generic DB smoke is repeatable on the migrated scratch DB. | Does not prove Docker volume recreation itself. |
| `docker compose exec -T krn-postgres psql ... drop database krn_v04_smoke` | passed | Scratch DB was cleaned up. | Does not change main DB. |

## Findings

- The reported generic `db:smoke` enum re-create failure did not reproduce on
  current `main`.
- CI for `9849754` already ran `pnpm db:ready`, Drizzle check, and
  `pnpm db:smoke` successfully against a fresh GitHub Actions Postgres service.
- Local scratch DB replay also passed `db:ready`, `db:smoke`, and repeated
  `db:smoke`.
- The smallest correct action is not a source repair. The previous failure
  should stay as historical evidence unless it reappears with command output.

## Condensation Decision

- Finding: Generic `pnpm db:smoke` idempotency after fresh DB migration is not
  currently reproducible.
- Frequency: first as current V04 scenario; historical failure exists in the
  headless target report.
- Condensation target: none for source repair; evidence ledger/report only.
- Decision: rejected as an active repair candidate for now.
- Implemented now: yes, as scenario report and plan update.
- Evidence: CI run `28273097780`; local current DB `pnpm db:ready` /
  `pnpm db:smoke`; scratch DB `db:ready` / repeated `db:smoke`.
- Why not more: changing migration or smoke code without reproduction would
  create speculative DB churn.
- Next bounded repair: continue to Controlled Scenario Factory and Knowledge
  Condensation Gate surfaces, then run a scenario that exercises another brain
  function.

## What This Proves

- Current generic DB smoke passes locally and in CI.
- Fresh scratch DB migration plus generic smoke is repeatable in this shell.
- The V04 M3 candidate can be rejected without source changes.

## What This Does Not Prove

- Every named DB smoke target is idempotent.
- Docker volume deletion/recreation can never expose the old error.
- Product readiness.
- V02-01 second-operator usability.
