# Second-Operator Alpha Trial Packet

Status: operator packet for `V02-01`.

Use this packet when a real operator beyond the author runs a controlled KRN
internal-alpha trial.

## Trial Boundary

This trial tests whether a technical operator can use KRN from checked-in docs
and commands without hidden author context.

Allowed:

- source-workspace install;
- local Postgres via `compose.yaml`;
- root `pnpm krn ...` commands;
- one bounded target-repo plan;
- evidence transcript with failures and support notes.

Not allowed:

- product-ready claim;
- npm/global install;
- dashboard/API/MCP/worker runtime;
- source crawler;
- target secret ingestion;
- automatic Memory Core mutation;
- moving or creating a tag unless the operator explicitly requests it.

## Operator Setup

Operator:

```txt
name:
machine/os:
date:
support channel:
```

Support boundary:

```txt
Allowed support:
- clarify what command to run next;
- explain expected warnings already documented in runbooks;
- help recover from environment setup errors.

Not allowed support:
- author runs the commands for the operator;
- author supplies hidden repo context not present in checked-in docs;
- author edits files during the trial;
- author interprets results before the operator records them.
```

## Required Inputs

Before starting, decide:

```txt
KRN source:
- existing tag v0.1.0-alpha.0
- current main commit
- other explicit commit/tag:

Target repo:
- path or URL:
- read-only / writable:
- contains secrets? yes/no/unknown:

DB mode:
- local Docker/Postgres
- no DB, preview only
```

If using a target repo with secrets or generated runtime directories, do not
ingest broad target content. Use narrow seed/read-model paths only.

## Step 1: Clone And Install

```sh
git clone https://github.com/korneliuszburian/mise-en-palace.git
cd mise-en-palace
git checkout v0.1.0-alpha.0
pnpm install --frozen-lockfile
```

Record:

```txt
clone result:
checkout result:
install result:
warnings:
support used:
```

Expected: install may print ignored build-script warnings. That is not by
itself a failed install.

## Step 2: Verify Source Workspace

```sh
pnpm alpha:verify
```

Record:

```txt
alpha:verify result:
duration:
failed package/test if any:
doctor mode shown:
support used:
```

Expected: this runs typecheck, tests, and preview `pnpm krn doctor`.

## Step 3: Verify DB-Backed Runtime

```sh
docker compose up -d krn-postgres
pnpm db:ready
pnpm db:smoke
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm krn doctor
```

Record:

```txt
compose result:
db:ready result:
db:smoke result:
db-backed doctor result:
support used:
```

If Docker/Postgres is unavailable, stop DB-backed claims and mark DB runtime
truth as unverified.

## Step 4: Target Repo Init / Connect

Use a bounded target repo chosen before the trial.

Dry run:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm krn init --dry-run --repo <target-repo-path>
```

Connect only if the dry-run source seed and forbidden-surface output are
acceptable:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm krn init --connect --repo <target-repo-path> --persist
```

Record:

```txt
dry-run result:
source seeds:
forbidden surfaces:
files written:
connect result:
project id:
repo installation id:
project kernel id:
support used:
```

## Step 5: One Bounded Target Plan

Run one project-scoped plan:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm krn plan --project <project-id> --task "<bounded target task>" --persist
```

The task should be small enough to inspect without a crawler. Examples:

```txt
inspect target test readiness for one package
plan a docs-only target runbook update
plan a narrow TypeScript boundary repair without editing yet
```

Record:

```txt
execution run:
task contract:
context included:
context excluded:
target read model shown? yes/no:
trust exclusions shown? yes/no:
stale KRN owner-file selected? yes/no:
support used:
```

## Step 6: Evidence Summary

Do not edit KRN source during this trial unless separately authorized.

Record command evidence:

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm install --frozen-lockfile` |  |  |  |
| `pnpm alpha:verify` |  |  |  |
| `pnpm db:ready` |  |  |  |
| `pnpm db:smoke` |  |  |  |
| `pnpm krn init --dry-run ...` |  |  |  |
| `pnpm krn init --connect ... --persist` |  |  |  |
| `pnpm krn plan --project ... --persist` |  |  |  |

## Trial Verdict

Choose one:

```txt
completed unaided
completed with documented support
failed due to environment
failed due to KRN docs
failed due to KRN behavior
inconclusive
```

Required notes:

```txt
what worked:
what confused the operator:
what required support:
what failed:
what should change before widening alpha:
```

## What This Trial Can Prove

- A real operator can follow the checked-in source-workspace alpha path.
- The runbook is sufficient or insufficient.
- DB-backed local workflow is workable or too fragile.
- Target init/connect and project-scoped plan are understandable.

## What This Trial Cannot Prove

- Product readiness.
- Arbitrary target repo safety.
- Hosted DB readiness.
- npm/global install readiness.
- Dashboard/API/MCP/worker readiness.
- Memory Brain usefulness at scale.
