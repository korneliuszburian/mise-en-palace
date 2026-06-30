# V02-01 Second-Operator Launch Packet

Status: ready packet, not proof.
Date: 2026-06-30.

Use this packet when a real operator beyond the author runs the next KRN
internal-alpha trial.

This packet does not complete V02-01. It exists so the trial can start without
hidden author context once the missing inputs are supplied.

## Current Boundary

```txt
controlled-internal-alpha for technical operators: yes / stronger
widened internal alpha: no
product-ready: no
V02-01 real second-operator proof: blocked/deferred
```

## Required Inputs

Do not start V02-01 until every field is filled.

```txt
operator_name:
operator_machine_os:
operator_timezone:
trial_date:
support_channel:

KRN source:
  current main commit / explicit commit / explicit tag
KRN source ref:

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
operator transcript path:
```

If any field is missing, stop and keep V02-01 blocked/deferred.

## Trial Mode

Allowed V02-01 mode:

```txt
real-second-operator:
  a real non-author operator runs or directs the flow.
```

Not allowed as V02-01:

```txt
self run
headless run
author-run commands
synthetic transcript
post-hoc transcript reconstruction
target repair without explicit write scope
```

Headless/self runs may still be engineering evidence, but they must not be
renamed into V02-01 proof.

## Support Boundary

Allowed support:

```txt
documented_support:
  clarify which checked-in packet/runbook step to follow.

environment_recovery:
  help recover shell, Docker, pnpm, or local DB setup errors.

syntax_clarification:
  explain command syntax already present in checked-in docs.
```

Disallowed support:

```txt
hidden_author_context:
  author supplies knowledge not present in checked-in docs.

author_ran_commands:
  author runs the operator's commands.

author_interpreted_before_recording:
  author explains results before operator records their observation.

scope_expansion:
  author changes the target task or writes target files without explicit
  operator approval.
```

Any disallowed support prevents the run from counting as unaided V02-01 proof.

## Setup Commands

Operator runs:

```sh
git clone https://github.com/korneliuszburian/mise-en-palace.git
cd mise-en-palace
git checkout <KRN source ref>
pnpm install --frozen-lockfile
```

Record:

```txt
clone result:
checkout result:
install result:
warnings:
support used:
what this proves:
what this does not prove:
```

## Source Workspace Verification

Run:

```sh
pnpm alpha:verify
```

If `alpha:verify` is unavailable or fails, record the exact failure and run the
smallest documented fallback:

```sh
pnpm db:ready
pnpm run typecheck
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
pnpm quality:fallow:ci
git diff --check
```

This proves only source workspace readiness for the current shell. It does not
prove target success, second-operator usability, or product readiness.

## DB Mode

If DB mode is `local Docker/Postgres`:

```sh
docker compose up -d krn-postgres
pnpm db:ready
```

If DB mode is `no DB preview only`, do not claim DB-backed truth. Mark all
persisted-run requirements as skipped with reason:

```txt
DB unavailable by selected trial mode.
```

## Target Repo Preflight

Before target commands:

```sh
cd <target_repo>
git status --short --branch
```

Record:

```txt
target_dirty_before:
target_status_freshness: fresh_current_task
target_patch_lifecycle:
  none / accepted_by_target_owner / rejected_by_target_owner /
  stronger_verification_requested / handed_off_unresolved
allowed_writes:
forbidden_writes:
```

Default mode is observation-only unless `target_repo_mode=writable` and allowed
writes are explicitly named.

## KRN Flow

Back in the KRN repo:

```sh
pnpm --filter @krn/cli krn init --dry-run --repo <target_repo>
```

If DB mode is local Postgres and the operator approves connect:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn init --connect --repo <target_repo> --persist
```

If owner files are known, pass each one:

```sh
--owner-file "path|root|kind|reason"
```

Plan one bounded task:

```sh
pnpm --filter @krn/cli krn plan \
  --task "<bounded target task>"
```

If DB mode is local Postgres:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn plan \
  --task "<bounded target task>" \
  --persist
```

Record:

```txt
selected context:
selected memory:
selected source:
selected owner files:
missing context:
operator decision:
```

## Evidence And Review

After the operator completes the bounded task or stops:

```sh
pnpm --filter @krn/cli krn evidence capture \
  --verification "<command>=passed|failed|skipped"
```

If a persisted run exists, add:

```sh
--run-id <executionRunId> --persist
```

Run observe and reflect only after evidence capture:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn observe --run-id <executionRunId> --persist

KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn reflect --scope run:<executionRunId> --persist
```

Do not run observe and reflect in parallel for the same run.

## Transcript Template

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

Support labels:

```txt
none
documented_support
environment_recovery
syntax_clarification
hidden_author_context
author_ran_commands
author_interpreted_before_recording
scope_expansion
```

## Stop Conditions

Stop and record blockers when:

```txt
required input is missing
target repo has secrets and no narrow scope
target repo is dirty and writes were requested
target has unresolved KRN-made patch lifecycle
DB setup fails and the trial requires persisted proof
operator needs hidden author context
author must run commands for the operator
target writes are needed but not explicitly allowed
```

## Verdict Labels

Choose exactly one:

```txt
V02-01 passed:
  real operator completed the flow with complete transcript and no disallowed
  support.

V02-01 failed with product blocker:
  real operator ran the packet but KRN docs/CLI/context/evidence blocked the
  flow.

V02-01 inconclusive:
  transcript or evidence is incomplete.

not V02-01:
  run was self/headless, used disallowed support, or missed required inputs.
```

## Proof Boundary

V02-01 can prove:

```txt
a real technical operator can run or direct one bounded KRN workflow from
checked-in packet/docs with recorded support, evidence, and review burden.
```

V02-01 does not prove:

```txt
product readiness
widened alpha by itself
arbitrary target write safety
target full test health
source truth
Memory Core quality
autonomous repair
dashboard/API/MCP readiness
```

## Reference Runbooks

Use these only as supporting detail:

```txt
docs/runbooks/second-operator-alpha-trial.md
docs/runbooks/target-repo-testing.md
docs/runbooks/local-brain-store.md
```
