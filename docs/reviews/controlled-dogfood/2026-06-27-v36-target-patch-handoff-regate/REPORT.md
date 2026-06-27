# V36 Target Patch Handoff Re-Gate

Status: complete.

Date: 2026-06-27.

Mode: observation-only re-gate.

## Executive Verdict

V35 made the V32 FAQ accessibility patch explicit and handoff-safe, but the
target owner/operator has not accepted, rejected, committed, or reverted it.

Current decision:

```txt
Do not start another repair in the same dirty target repo.
Do not commit, revert, reset, clean, or normalize the target repo from KRN.
Do not resume V02-01 without real second-operator inputs.
Promote V37 to condense target patch lifecycle rules into the target-repo
workflow skill/runbook before more target trials.
```

Readiness remains:

```txt
controlled-internal-alpha for technical operators: yes / stronger
widened internal alpha: no
product-ready: no
V02-01 real second-operator proof: blocked/deferred
```

## Inputs Inspected

KRN repo:

```txt
branch: main...origin/main
worktree: clean
latest commit: 2144644 docs(target): hand off FAQ accessibility patch
latest CI: 28289750736 passed
```

Target repo:

```txt
repo: /home/krn/coding/krn/active/krn-elektroinstal-ogar
branch: master...origin/master
dirty files:
  M bedrock/web/app/themes/elektroinstal/src/css/blocks/faq-accordion.js
  M bedrock/web/app/themes/elektroinstal/template-parts/flex/faq-help.php
```

V35 artifacts:

```txt
docs/reviews/controlled-dogfood/2026-06-27-v35-target-patch-handoff/REPORT.md
docs/reviews/controlled-dogfood/2026-06-27-v35-target-patch-handoff/FAQ_ARIA_PATCH.diff
```

## Target Ownership Status

```txt
target_patch_status: handed_off_but_unresolved
target_owner_decision: missing
target_commit_ownership: target owner/operator only
KRN allowed target writes: none
KRN forbidden target actions:
  - commit target patch
  - revert target patch
  - reset/clean target repo
  - start another target repair in the same unresolved dirty target
```

The patch is no longer hidden state, but it is still living target state. That
means another target repair in this repo would mix product validation with
unresolved operator ownership.

## Decision Options

| Option | Decision | Rationale |
|---|---|---|
| Wait for target owner/operator decision | required before same-target repair | The target patch is still dirty and unaccepted. |
| Run stronger observation-only verification | possible later | It can help the target owner decide, but it does not solve ownership by itself. |
| Choose another clean target proof | allowed after lifecycle rule condensation | A clean target avoids mixing evidence with unresolved dirty state. |
| Resume V02-01 | rejected now | Real second-operator inputs/transcript are still missing. |
| Continue repairing same dirty target | rejected | Would violate target ownership and dirty-state hygiene. |

## What V36 Proves

V36 proves:

- V35 handoff was pushed and CI passed.
- The target repo still contains the same bounded two-file V32 patch.
- The patch has not been resolved by target owner action visible to KRN.
- The honest next KRN move is a lifecycle rule condensation, not another
  same-target repair.

V36 does not prove:

- target owner acceptance;
- browser/runtime/accessibility behavior;
- product readiness;
- widened internal alpha;
- V02-01 second-operator usability;
- that future target repairs are safe without lifecycle rules.

## Condensation Decision

Promote:

```txt
V37 — Target Patch Lifecycle Rule Condensation
```

Goal:

Update the target-repo workflow surface so every future headless target repair
must explicitly classify patch lifecycle state before KRN starts another target
task.

Expected durable rule:

```txt
If a headless target repair leaves a target repo dirty, KRN must create or
reference a handoff artifact and record one of:
  - accepted_by_target_owner
  - rejected_by_target_owner
  - stronger_verification_requested
  - handed_off_unresolved

If the state is handed_off_unresolved, KRN may not start another repair in that
same target repo. It may only run observation-only verification, wait for owner
decision, or choose a clean target.
```

Likely files:

```txt
.agents/skills/target-repo-testing/SKILL.md
docs/runbooks/target-repo-testing.md
GOAL.md
PLAN.md
PLANS.md
```

Non-goals:

- no target repo writes;
- no target commit/revert/reset/clean;
- no new product surface;
- no dashboard/API/MCP/worker;
- no fake V02-01 proof;
- no product-ready overclaim.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk git fetch --prune` in KRN | passed | local remote refs refreshed | CI correctness by itself |
| `rtk git status --short --branch` in KRN | `main...origin/main`, clean | KRN worktree clean at V36 start | target owner decision |
| `rtk git log --oneline --decorate -8` in KRN | latest `2144644` | V35 handoff is current local/remote HEAD | product readiness |
| `rtk gh run list --branch main --limit 8` | latest `28289750736` ok | V35 pushed commit passed KRN CI | target runtime/accessibility correctness |
| `rtk git status --short --branch` in target | dirty with same two V32 files | target patch remains unresolved and bounded | target owner acceptance |

## Final Decision

V36 is complete as a decision gate.

Next active stream:

```txt
V37 — Target Patch Lifecycle Rule Condensation
```

