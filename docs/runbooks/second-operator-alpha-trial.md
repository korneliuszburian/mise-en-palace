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

Target repo reads, writes, and dirty-state handling are governed by
`docs/runbooks/target-repo-testing.md`.

`V02-01` requires a real second operator. A local/headless target run may produce
useful evidence, but it must not be used as a substitute for this trial.

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
- owner files known? yes/no:
- owner files if known:
  - path|root|kind|reason

DB mode:
- local Docker/Postgres
- no DB, preview only
```

V12 intake form:

```txt
operator_name:
operator_machine_os:
operator_timezone:
trial_date:
support_channel:

KRN source:
target_repo:
target_repo_mode:
  read-only / writable
target_repo_dirty_state:
  clean / dirty / unknown
target_repo_contains_secrets:
  yes / no / unknown
target_owner_files:
  none / listed below
  - path|root|kind|reason

DB mode:
  local Docker/Postgres / no DB preview only
support boundary:
bounded target task:
success criteria:
stop conditions:
```

If any required V12 intake field is missing, do not start a real
second-operator or widened-alpha trial. Record the missing fields and keep
`V02-01` blocked/deferred.

If using a target repo with secrets or generated runtime directories, do not
ingest broad target content. Use narrow seed/read-model paths only.

## Trial Modes And Claim Boundaries

Choose exactly one trial mode before starting:

| Mode | Who operates | Target writes | What it can prove | What it cannot prove |
| --- | --- | --- | --- | --- |
| `real-second-operator` | A real operator beyond the author runs or directs the flow. | Only within the chosen scenario's allowed writes. | Can satisfy `V02-01` if transcript/evidence are complete. | Does not prove product readiness by itself. |
| `widened-alpha` | A non-author or explicitly delegated technical operator runs the packet with bounded support. | Only if `target_repo_mode=writable` and allowed writes are named. | Can support widened internal-alpha readiness. | Does not satisfy product-ready alone. |
| `headless-engineering` | Codex/author runs a controlled local scenario. | Only under an explicit headless repair scope. | Engineering proof and knowledge distillation. | Does not satisfy `V02-01` or widened-alpha proof. |
| `observation-only` | Codex/operator observes and runs read-only commands. | None. | Target evidence and friction discovery. | Does not prove repair success or second-operator usability. |

Do not upgrade a trial's claim after the fact. If the run started as
`headless-engineering` or `observation-only`, it stays that way.

## Trial Scenario Menu

Choose exactly one scenario before running Step 4. Do not combine scenarios in
one trial.

| Scenario | Expected context roots | Trust exclusions | Allowed writes | Verification commands | Review-burden fields | Does not prove |
| --- | --- | --- | --- | --- | --- | --- |
| Docs-only target runbook repair | `README.md`, `docs/`, `AGENTS.md` or equivalent repo instruction file | `.env*`, `.git/`, `node_modules/`, generated runtime/build folders | target docs only, one narrow report if needed | `git diff --check`; target docs formatter if present | changed docs, command proof, missing runtime proof, rollback path | Does not prove source code behavior or target test health. |
| Narrow TypeScript boundary repair | `package.json`, `tsconfig*.json`, one owning `src/` file, matching test file | `.env*`, generated output, dependency/vendor folders, unrelated packages | one package/module source and focused tests only | package `typecheck`; focused package test; `git diff --check` | intended files, unrelated dirty files, invalid input coverage, residual type-risk | Does not prove full target repo quality or broad architecture health. |
| Target test-readiness investigation | `package.json`, test config, one failing test owner path, existing failure output | secret files, generated snapshots unless explicitly selected, broad logs | read-only unless operator explicitly approves a scoped test/doc fix | exact failing test command; if changed, focused retest and `git diff --check` | failing command, suspected owner file, skipped broader suite, next smallest repair | Does not prove the whole target suite is green. |
| Config/CI command proof mapping | `package.json`, CI config, documented scripts, one package README if relevant | secrets, generated CI caches, lockfile changes unless install is the task | docs/runbook or script metadata only unless separately approved | listed script dry-run/help; `git diff --check`; no secret echo | command provenance, script side effects, unsupported assumptions, rollback path | Does not prove hosted CI behavior unless hosted CI ran. |

Every selected scenario must record:

```txt
scenario:
expected context roots:
trust exclusions surfaced:
allowed writes:
forbidden writes:
verification commands:
review burden:
does-not-prove:
```

If KRN-selected context does not match the chosen scenario roots, record the
miss and continue only if manual source inspection can keep the trial bounded.

## Transcript Schema

Capture the transcript as structured notes. Exact chat logs may be appended,
but the report must include this normalized shape:

```txt
trial_mode:
operator:
KRN source:
target repo:
target repo mode:
DB mode:
support boundary:
scenario:
bounded target task:

step:
command_or_action:
operator_observation:
result:
support_used:
evidence_ref:
what_this_proves:
what_this_does_not_prove:
next_decision:
```

Support must be classified:

```txt
none:
documented_support:
environment_recovery:
hidden_author_context:
author_ran_commands:
```

Any `hidden_author_context` or `author_ran_commands` entry prevents the run from
counting as unaided second-operator proof.

## Failure Taxonomy

Classify every failure with one primary cause:

| Failure | Meaning | Next action |
| --- | --- | --- |
| `environment_setup` | Machine, Docker, package manager, or shell setup blocked the run. | Improve setup docs or support boundary. |
| `db_runtime` | Postgres, migrations, pgvector, or smoke commands failed. | Use `docs/runbooks/local-brain-store.md`; do not claim DB-backed truth. |
| `target_repo_state` | Target repo dirty state, secrets, generated files, or active concurrent work blocked safe progress. | Switch to observation-only or choose another target. |
| `krn_docs_gap` | Checked-in docs did not tell the operator what to do. | Repair runbook/docs before rerun. |
| `krn_cli_behavior` | CLI output or command behavior blocked the trial despite correct usage. | Open bounded KRN repair. |
| `context_selection` | KRN selected missing/stale/noisy context for the bounded task. | Record selected/used/helped/missing context. |
| `support_boundary_breach` | Trial required hidden author context or author-run commands. | Do not count as V02-01; repair packet/support boundary. |
| `inconclusive` | Evidence is insufficient to classify the failure. | Record missing evidence and rerun only with clearer capture. |

Do not collapse failures into "operator error" unless the packet clearly stated
the correct action and the transcript proves it was ignored.

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
pnpm db:smoke:init-connect
pnpm db:smoke:target-repo-harness
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm krn doctor
```

Record:

```txt
compose result:
db:ready result:
db:smoke result:
init-connect smoke result:
target repo harness smoke result:
db-backed doctor result:
support used:
```

If Docker/Postgres is unavailable, stop DB-backed claims and mark DB runtime
truth as unverified.

The target harness smoke is local fixture proof. It does not complete the real
target repo trial.

## Step 4: Target Repo Init / Connect

Use a bounded target repo chosen before the trial.

Dry run:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm krn init --dry-run --repo <target-repo-path>
```

If exact owner files are known for the chosen bounded scenario, pass them
explicitly. This is an operator-provided read-model contract, not crawler proof:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm krn init --dry-run --repo <target-repo-path> \
  --owner-file "src/index.ts|src|implementation_entry|implementation entry point" \
  --owner-file "tests/readiness.test.ts|tests|behavior_test|readiness behavior proof"
```

Connect only if the dry-run source seed and forbidden-surface output are
acceptable:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm krn init --connect --repo <target-repo-path> --persist
```

Use the same `--owner-file` entries on connect when they were used in dry-run.

Record:

```txt
dry-run result:
source seeds:
owner files:
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

Evidence checklist:

```txt
preflight:
  KRN repo commit:
  KRN repo clean/aligned:
  operator machine/os:
  support boundary recorded:

target:
  target repo path/url:
  target repo mode:
  target dirty before:
  allowed writes:
  forbidden writes:
  target dirty after:

DB:
  DB mode:
  db:ready result:
  db:smoke result:
  target harness smoke result:

KRN:
  init dry-run result:
  init connect result:
  project id:
  plan run id:
  evidence captured:
  observe/reflect used:

review:
  selected context used/helped/missing:
  command proof strength:
  review burden:
  support used:
  failure taxonomy:
```

## Trial Verdict

Choose one:

```txt
completed unaided
completed with documented support
failed due to environment
failed due to DB runtime
failed due to target repo state
failed due to KRN docs
failed due to KRN behavior
failed due to support boundary breach
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
