# Internal Alpha Install

This runbook defines the first repeatable KRN internal-alpha install path.

Boundary:

- git-tagged source workspace;
- pnpm-managed dependencies;
- root `pnpm krn ...` operator command;
- no npm package publishing;
- no global binary install;
- no dashboard/API/MCP/plugin package;
- no worker runtime.

## Install

```sh
git clone https://github.com/korneliuszburian/mise-en-palace.git
cd mise-en-palace
git checkout v0.1.0-alpha.0
pnpm install --frozen-lockfile
```

If you are already in a trusted checkout, use:

```sh
git fetch --prune --tags
git checkout v0.1.0-alpha.0
pnpm install --frozen-lockfile
```

Expected install note:

- `pnpm install --frozen-lockfile` may print ignored build-script warnings from
  dependencies. For this alpha, that warning is expected unless a later task
  explicitly approves dependency build scripts. It is not by itself a failed
  install.

## Verify

Run:

```sh
pnpm alpha:verify
```

This currently runs:

```sh
pnpm typecheck
pnpm test
pnpm krn doctor
```

Expected runtime:

- `pnpm alpha:verify` runs workspace typecheck and the full test suite before
  `pnpm krn doctor`. On a normal local checkout it can take long enough to look
  quiet while package tests run sequentially.
- A passing `pnpm alpha:verify` proves source-workspace typecheck/tests and a
  preview doctor run. It does not prove DB-backed runtime readiness by itself.

For DB-backed work, also start the local brain store and verify DB readiness:

```sh
docker compose up -d krn-postgres
pnpm db:ready
pnpm db:smoke
```

DB runtime truth may be claimed only for commands that ran in the current
shell.

Doctor modes:

- `pnpm krn doctor` without `KRN_DATABASE_URL` is expected to report preview-only
  readiness for brain-store-backed paths.
- `pnpm db:ready` and `pnpm db:smoke` are the DB-backed proof commands for the
  local alpha.
- Use `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm krn doctor`
  when you want the doctor command itself to inspect the local Postgres-backed
  state.

## Operator Command

Use the root operator command:

```sh
pnpm krn doctor
pnpm krn plan --task "..."
pnpm krn evidence capture --help
```

Normal operator workflow should not require:

```sh
pnpm --filter @krn/cli krn ...
tsx packages/cli/src/index.ts ...
```

Those are internal workspace details.

## Versioning

The first internal-alpha tag is:

```txt
v0.1.0-alpha.0
```

Internal-alpha tags use:

```txt
vMAJOR.MINOR.PATCH-alpha.N
```

Tag only clean `main` commits with green CI, or explicitly mark the tag as not
releasable in release notes.

## What This Proves

This install path proves:

- a tagged source checkout can install dependencies reproducibly;
- root `pnpm krn` runs the CLI without package-internal commands;
- the workspace can run its alpha verification command;
- DB-backed flows can be verified when local Postgres/pgvector is running.

## What This Does Not Prove

This does not prove:

- npm package readiness;
- global binary install readiness;
- dashboard/API/MCP/plugin readiness;
- worker runtime readiness;
- hosted production deployment;
- product-ready Memory Brain quality.

## Rollback

If the tag target is bad:

1. if the tag has not been consumed, delete and recreate it on a corrected
   commit;
2. if the tag has been consumed, create a new corrective alpha tag;
3. keep package manifests private until a later packaging task proves npm
   readiness.
