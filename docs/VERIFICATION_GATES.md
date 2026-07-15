# Verification gates

This is the maintained command map for KRN verification. A command marked
`NON-GATING` may be useful for exploration or reporting but cannot establish a
green repository gate by itself.

## Selection rule

Select the cheapest command that can falsify the current claim. During
implementation, stay on the nearest package, behavior, type, or DB signal. Run
the broad completion set once after the slice stabilizes only when the changed
surface or publication contract requires it. Do not rerun an unchanged green
gate.

| Changed surface | Inner loop | Completion signal |
|---|---|---|
| docs or mechanical metadata | rendered or structural check if one exists | `rtk git diff --check` |
| one package's TypeScript internals | package-supported typecheck | root typecheck only if no narrow command covers it |
| shared tsconfig, cross-package, or public type contract | producer and consumer typecheck | `rtk proxy pnpm typecheck` once |
| one runtime contract or bug | focused public-seam test or repro | affected package suite; root tests only for workspace-wide risk |
| fixture or corpus contract | focused fixture/corpus checker | `rtk pnpm fixtures:check` when shared fixtures changed |
| package surface, architecture, or cleanup | focused behavior/type signal | `rtk pnpm quality:fallow:ci` once after stabilization |
| activation, packet, or required eval behavior | focused eval case | `rtk pnpm eval:required` when the required eval contract changed |
| database schema or store-backed behavior | focused DB test/smoke | relevant configured-store gates below |
| bootstrap, platform, or workspace tooling | changed script smoke | matching toolchain, platform, or workspace check |

Documentation wording, file topology, command lists, private call order, and
cleanup ceremony do not earn tests. A broad command is not stronger evidence
when it cannot disagree with the changed claim.

The existence of an umbrella command and the size of the repository do not
select a gate. Do not replay focused tests, typecheck, or lint through `ci`,
`check`, or `validate` unless the changed-surface row requires that aggregate
or it adds a distinct observer.

## Canonical commands

These are selectable commands, not a mandatory run-all list:

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
