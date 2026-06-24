# Goal: Validate KRN Brain Usefulness

You are working in:

```txt
/home/krn/coding/krn/active/mise-en-palace
```

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

## Current Objective

Validate whether the current KRN Memory Brain improves real KRN dogfood work.

Continue from the canonical root execution plan:

```txt
PLAN.md
```

First unchecked slice:

```txt
BUV-00: Produce Brain Usefulness Report
```

Primary artifact:

```txt
docs/reviews/brain-usefulness/REPORT.md
```

This is a bounded validation goal, not a new architecture or implementation
program.

## Non-Goals

- Do not build dashboard, API server, MCP server, worker runtime, source
  crawler, broad benchmark lane, eval platform, new memory subsystem, new CLI
  command, new package, or new persistent schema.
- Do not reintroduce `krn audit`.
- Do not create an anti-slop subsystem, quality scanner, or plan-sprawl
  surface.
- Do not promote memory.
- Do not mutate Memory Core.
- Do not change activation behavior.
- Do not fix issues during this validation goal.
- Do not modify package source.

## Required Read Order

Before editing:

1. `AGENTS.md`
2. `docs/KRN_KERNEL.md`
3. `README.md`
4. `GOAL.md`
5. `PLAN.md`
6. `docs/runs/2026-06-23-self-hosting-memory-loop.md`
7. recent run ledgers under `docs/runs/`
8. architecture docs and ADRs only when relevant to selected runs.

If the next step requires broad historical rereads, stop and re-scope.

## Done

This goal is complete when `docs/reviews/brain-usefulness/REPORT.md` exists,
at least 3 real dogfood runs are evaluated across all required lanes, brain
readiness is stated, recommendations are bounded, `git diff --check` passes,
no package source is modified, the report is committed and pushed, and the
worktree is clean.
