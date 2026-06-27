# V41 Target Trial Availability Re-Gate

Status: complete.

Date: 2026-06-27.

Mode: observation-only availability re-gate.

## Executive Verdict

Target trial work can continue, but only through a fresh WILQ observation-only
baseline retry.

Current target states:

```txt
krn-elektroinstal-ogar:
  status: dirty
  lifecycle: handed_off_unresolved
  same-target repair allowed: no

wilq-seo:
  status: clean at V41 check
  target_status_freshness: fresh_current_task
  lifecycle: none
  repair allowed now: no, baseline retry first
```

V39 correctly caught WILQ volatility when it was dirty. V41 found WILQ clean
again. That does not invalidate the V40 freshness rule; it proves why every
target task must re-check status at task start.

## Inputs Inspected

```txt
GOAL.md
PLAN.md
PLANS.md
docs/reviews/controlled-dogfood/2026-06-27-v36-target-patch-handoff-regate/REPORT.md
docs/reviews/controlled-dogfood/2026-06-27-v39-wilq-observation-baseline/REPORT.md
docs/reviews/controlled-dogfood/2026-06-27-v40-target-selection-freshness-rule/REPORT.md
```

Current status evidence:

```txt
KRN: main...origin/main, clean
KRN latest commit: a4d6ce5 docs(target): require fresh target status before use
KRN latest CI: 28290281793 passed

wilq-seo: main...origin/main, clean
krn-elektroinstal-ogar: dirty with V32 FAQ patch files
```

## Decision

Promote:

```txt
V42 — WILQ Fresh Observation-Only Baseline Retry
```

Goal:

Retry the WILQ observation-only baseline with the V40 freshness rule applied.
The task must first re-run `wilq-seo` status. If WILQ is still clean, inspect
baseline context and decide whether a bounded repair trial is safe later. If it
is dirty again, stop and record volatility.

## Non-Goals

- no target writes;
- no target repair;
- no target commit/push/reset/clean;
- no fake V02-01;
- no product-ready overclaim;
- no broad benchmark lane.

## What V41 Proves

V41 proves:

- `krn-elektroinstal-ogar` remains unavailable for same-target repair;
- `wilq-seo` is currently clean again;
- target availability can change quickly and must be checked per task;
- the next safe target task is a fresh baseline retry, not immediate repair.

V41 does not prove:

- WILQ repair scope is safe;
- WILQ tests pass;
- target owner/operator acceptance for any patch;
- V02-01 second-operator proof;
- product readiness.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk git status --short --branch` in KRN | clean | KRN repo clean after V40 | target product readiness |
| `rtk git log --oneline --decorate -6` | latest `a4d6ce5` | V40 is current local/remote HEAD | product readiness |
| `rtk gh run list --branch main --limit 5` | latest `28290281793` ok | V40 CI passed | target runtime correctness |
| `rtk git status --short --branch` in `wilq-seo` | clean | WILQ target is currently clean | still clean at V42 start |
| `rtk git status --short --branch` in `krn-elektroinstal-ogar` | dirty with two FAQ files | same-target repair remains blocked | target owner acceptance |

## Final Decision

V41 is complete as an availability re-gate.

Next active stream:

```txt
V42 — WILQ Fresh Observation-Only Baseline Retry
```

