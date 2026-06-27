# V39 WILQ Clean Target Observation-Only Baseline

Status: complete.

Date: 2026-06-27.

Mode: observation-only baseline.

## Executive Verdict

V39 started the WILQ baseline, but the selected clean target was no longer clean
at execution time.

Current target status:

```txt
target_repo: /home/krn/coding/krn/active/wilq-seo
branch: main...origin/main
target_dirty_before: yes
target_patch_lifecycle: none / external active dirty state
same_target_repair_allowed: no
```

Dirty files observed before any V39 target write:

```txt
M apps/dashboard/src/routes/AdsDoctorSurface.tsx
M apps/dashboard/src/routes/App.test.tsx
M packages/shared-schemas/src/index.ts
M tests/test_api_contracts.py
M wilq/briefing/ads_diagnostics.py
M wilq/schemas.py
```

KRN did not edit, commit, reset, clean, or normalize `wilq-seo`.

Target dirty state after V39 remained the same six files.

## What Changed Since V38

V38 selected `wilq-seo` because it was clean and synced:

```txt
* main...origin/main
clean — nothing to commit
```

At V39 start, the target was dirty. This invalidates the “clean target” premise
for any repair trial. The correct behavior is to keep V39 observation-only and
avoid target writes.

## Baseline Read

Read-only files inspected:

```txt
wilq-seo/AGENTS.md
wilq-seo/README.md
wilq-seo/docs/CONTEXT.md
wilq-seo/docs/PROGRESS.md
wilq-seo/docs/goals/001-goal.md
wilq-seo/PLAN.md
wilq-seo/package.json
wilq-seo/pyproject.toml
```

High-level target model:

```txt
WILQ is an API-first Marketing Operating System for Ekologus.
The WILQ API is the system brain.
Dashboard and Codex skills consume typed API contracts.
Operator-facing output is Polish and evidence-bound.
```

Canonical target verification surfaces:

```txt
scripts/verify.sh
pnpm typecheck
pnpm test
uv run ...
scripts/local_stack.sh start|status|restart|logs
```

V39 did not run target verification because the target was already dirty and
the goal was selection/baseline, not repair.

## Owner-File Read-Model Notes

No bounded repair objective exists yet, so exact owner files should not be
invented.

For future WILQ target work, owner-file candidates must be chosen from a
bounded task and explicit source/read-model evidence. Current broad recovery
surfaces are:

```txt
AGENTS.md
docs/CONTEXT.md
docs/PROGRESS.md
docs/goals/001-goal.md
PLAN.md
package.json
pyproject.toml
```

These are orientation files, not owner files for an implementation repair.

## Product Decision

V39 rejects immediate WILQ repair.

Reason:

```txt
The target changed between selection and baseline. KRN must revalidate target
clean/dirty state immediately before any observation/repair proof and must not
treat a prior clean selection as durable.
```

## Condensation Decision

Promote:

```txt
V40 — Target Selection Freshness Rule Condensation
```

Goal:

Update the target workflow so any selected clean target must be revalidated at
task start. If it becomes dirty, the task must downgrade to observation-only,
reselect a clean target, or record an honest blocker.

Non-goals:

- no target writes;
- no target repair;
- no target commit/revert/reset/clean;
- no fake V02-01;
- no product-ready overclaim.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk git status --short --branch` in `wilq-seo` | dirty with six files | target was no longer clean before V39 writes | who changed the files |
| `rtk sed -n '1,220p' docs/CONTEXT.md` in `wilq-seo` | passed | recovery context inspected | full target implementation readiness |
| `rtk sed -n '1,220p' docs/PROGRESS.md` in `wilq-seo` | passed | current target progress inspected | repair safety |
| `rtk sed -n '1,220p' docs/goals/001-goal.md` in `wilq-seo` | passed | active target goal inspected | V02-01 proof |
| `rtk sed -n '1,260p' PLAN.md` in `wilq-seo` | passed | target execution plan inspected | target tests pass |
| `rtk sed -n '1,220p' pyproject.toml` in `wilq-seo` | passed | Python verification config inspected | runtime verification |
| `rtk git status --short --branch` in `wilq-seo` after baseline | same six dirty files | KRN did not add target dirty files during V39 | who owns the pre-existing dirty files |

## Final Decision

V39 is complete as an observation-only baseline and volatility finding.

Next active stream:

```txt
V40 — Target Selection Freshness Rule Condensation
```
