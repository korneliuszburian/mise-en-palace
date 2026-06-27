# V40 Target Selection Freshness Rule Condensation

Status: complete.

Date: 2026-06-27.

Mode: workflow-rule condensation.

## Executive Verdict

V40 codified the V39 finding: clean target selection expires.

A target that was clean when selected must be revalidated immediately before the
next target task uses it. If the target changed, KRN must downgrade to
observation-only and must not start repair from stale clean-state evidence.

## Inputs Inspected

```txt
docs/reviews/controlled-dogfood/2026-06-27-v38-clean-target-selection-gate/REPORT.md
docs/reviews/controlled-dogfood/2026-06-27-v39-wilq-observation-baseline/REPORT.md
.agents/skills/target-repo-testing/SKILL.md
docs/runbooks/target-repo-testing.md
```

## Changes

Updated:

```txt
.agents/skills/target-repo-testing/SKILL.md
docs/runbooks/target-repo-testing.md
```

Added target status freshness states:

```txt
fresh_current_task
stale_prior_selection
changed_since_selection
```

Rule:

```txt
If a selected clean target is dirty at task start, classify
target_status_freshness: changed_since_selection, downgrade to
observation-only, and do not repair until a new clean state or explicit write
scope is established.
```

## What This Proves

V40 proves:

- the WILQ volatility finding is now durable workflow guidance;
- target repair cannot be justified by stale clean-state evidence;
- future target reports must record target status freshness.

V40 does not prove:

- WILQ target repair is safe;
- another clean target exists;
- V02-01 is complete;
- product readiness;
- target owner/operator accepted any patch.

## Product Decision

Readiness remains:

```txt
controlled-internal-alpha for technical operators: yes / stronger
widened internal alpha: no
product-ready: no
V02-01 real second-operator proof: blocked/deferred
```

## Condensation Decision

Promote:

```txt
V41 — Target Trial Availability Re-Gate
```

Goal:

Decide whether target trials should continue immediately, wait for target owner
state to settle, or switch back to KRN internal/source hardening until a clean
or explicitly writable target is available.

Non-goals:

- no target writes;
- no target repair;
- no fake V02-01;
- no product-ready overclaim.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk git diff --check` | passed | markdown/workflow diff has no whitespace errors | target repair safety |

## Final Decision

V40 is complete as workflow-rule condensation.

Next active stream:

```txt
V41 — Target Trial Availability Re-Gate
```
