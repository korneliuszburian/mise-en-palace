# Verification gates

This is the maintained command map for KRN verification. A command marked
`NON-GATING` may be useful for exploration or reporting but cannot establish a
green repository gate by itself.

## Canonical gates

Run the relevant local contract before closing work:

```sh
rtk pnpm toolchain:check
rtk pnpm platform:check
rtk pnpm workspace:check
rtk pnpm fixtures:check
rtk proxy pnpm typecheck
rtk proxy pnpm test
rtk pnpm quality:fallow:ci
rtk pnpm eval:required
rtk git diff --check
```

For DB-backed changes, also run the current store proof with
`KRN_DATABASE_URL` configured:

```sh
rtk pnpm db:migrate
rtk pnpm db:ready
rtk pnpm --filter @krn/db db:check
rtk pnpm db:smoke
rtk pnpm eval:db
```

The GitHub workflow is the remote gate: its fast job covers toolchain,
platform, workspace, typecheck, tests, Fallow, required evals, and committed
whitespace; its DB job covers readiness, the same configured-store root test
followed by a second readiness check, schema, DB smokes, and `eval:db`; its
security job runs on every configured trigger. Security uses a provider range
when one exists and deliberately scans full history for schedule and manual
runs; a full-history finding is security evidence, not a reason to broaden
Fallow's changed-files range.

`quality:fallow:ci` prints its resolved base, head, and changed-file count. PR
and ordinary push runs use their provider base; local, scheduled, manual, and
initial-push runs derive `HEAD^..HEAD` when a parent exists. A reviewer may
supply the verified `KRN_FALLOW_COMMIT_BASE=<commit>` explicitly. Missing
provider bases, a missing parent, and invalid explicit bases fail closed. This
is Fallow-only: the secret policy retains its separate full-history fallback.

## Proof artifact envelope

DB readiness/smoke output, eval JSON, paired-trial records, doctor proof, and
persisted evidence carry a secret-free `krn.environmentFingerprint.v1`. It
binds the artifact to the git/lockfile, runtime, database, evaluator/checker,
protocol, and schema inputs; it identifies execution conditions but does not
prove that the command or product behavior succeeded.

## Non-gating lanes

- `rtk pnpm quality:fallow:report` prints `FALLOW REPORT (NON-GATING)` and
  tolerates report-tool findings or startup failure. Use
  `quality:fallow:ci` for the actual gate.
- `rtk pnpm eval:lab` is exploratory and does not replace `eval:required` or
  `eval:db`.
- `rtk pnpm eval:recorded-replay` is a dated recorded replay, not live Codex
  evidence.

If Postgres or Codex is unavailable, record the relevant result as blocked or
unverified. A tolerated report exit is never a product or runtime proof.
