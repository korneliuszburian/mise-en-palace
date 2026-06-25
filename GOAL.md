# Goal: Execute KRN Production Roadmap From Root PLAN.md

You are working in:

```txt
/home/krn/coding/krn/active/mise-en-palace
```

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

## Current Objective

Use root `PLAN.md` as the single source of truth for production roadmap
execution.

Do not continue from `docs/plans/memory-ideal-state/PLAN.md` as active context.
Historical plans, dogfood reports, ADRs, run ledgers, and raw materials are
evidence only unless root `PLAN.md` names them for a current task.

## First Active Task

```txt
A-01 — DB-Backed Owner-File Recall Dogfood
```

A-00 is complete once the production roadmap is committed and pushed as root
`PLAN.md`.

## Operating Rules

- Keep `GOAL.md` compact.
- Keep root `PLAN.md` as the execution map.
- Do not create `PLANS.md` or a parallel roadmap.
- Do not reopen archived historical task bodies as active work.
- Do not build dashboard, API, MCP server, worker runtime, source crawler,
  broad eval platform, `krn audit`, anti-slop scanner, or package source
  changes unless a named `PLAN.md` task authorizes them.
- Before each task, inspect git status and current source truth.
- After each completed task, verify, commit, push, and leave the worktree
  clean.
