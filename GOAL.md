# Goal: Continuously Harden KRN As A Memory Brain Kernel

You are working in:

```txt
/home/krn/coding/krn/active/mise-en-palace
```

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

## Current Objective

Continue from the canonical root execution plan:

```txt
PLAN.md
```

Do not continue from `docs/plans/memory-ideal-state/PLAN.md` as the active
execution track. That file is historical planning/audit quarry until the root
plan explicitly promotes a retained decision.

The canonical reset baseline is complete. Completed slices are historical
ledger, not active context. The current objective is continuous hardening: keep
only the next live repair slice active, and compress finished work into
checkpoint observations and follow-up candidates in `PLAN.md`.

The continuing objective is:

1. keep repo current-truth surfaces honest as code changes;
2. keep productized QG-06 / anti-slop / audit-authority direction rejected;
3. turn completed-slice findings into bounded implementation slices;
4. harden the real Memory Brain spine through source-grounded, typed,
   reviewable changes;
5. keep `PLAN.md` as the living queue without keeping finished tasks in the
   active goal window.

The current epoch is continuous hardening after Evidence Integrity closure. P7
proved the operational spine, not Memory Brain readiness. Continue from the
first unchecked slice in `PLAN.md` Active Queue Snapshot:

```txt
TSQ-11: Decide ReviewAssessment And FeedbackDelta Create Status Boundaries
```

Do not build worker runtime, dashboard, broad memory behavior, Promptfoo
authority, standalone eval candidate storage, eval CLI, audit scanner, or an
eval platform while deciding review/feedback create-status boundaries.
Promote the slice through the `slice_template_gate` in `PLAN.md` before edits.

## Required Read Order

Before editing:

1. `AGENTS.md`
2. `docs/KRN_KERNEL.md`
3. `PLAN.md` active queue snapshot and the first unchecked slice only.

Read old plans, QG docs, handoffs, repo-reset reviews, and raw materials only
when the current slice names them as evidence or target files. Do not reread
completed slices just because they remain in the ledger.

## Non-Goals

- Do not build a dashboard-first app.
- Do not build a broad benchmark lane.
- Do not build a generic multi-agent framework.
- Do not build Research Foundry, Pattern Vault, source crawler, or runtime
  markdown memory.
- Do not reintroduce `krn audit` as a product quality engine, guardrail layer,
  or internal scanner UX.
- Do not create an anti-slop subsystem.
- Do not claim Promptfoo smoke proves KRN memory behavior.
- Do not let observation/reflection mutate Memory Core.
- Do not revive completed reset/audit-cleanup tasks unless live repo evidence
  shows drift.

## Operating Rules

- Repo evidence beats docs.
- Before starting a broad new goal, run `git fetch --prune`,
  `git status --short --branch`, and
  `git log --oneline --decorate --left-right origin/main...main`; record any
  ahead/behind state instead of relying on stale status output.
- A checked task is not the end of learning. If verification reveals a gap,
  record it in `PLAN.md` as a follow-up candidate or next slice.
- Do not create a new KRN subsystem for ordinary engineering quality concerns.
  Prefer direct code, type, test, naming, CLI, docs, and review-boundary repair.
- Treat architectural cleanliness as a hard acceptance bar. Prefer final-pattern
  boundaries, explicit ownership, narrow public surfaces, typed IO, and
  deletion of wrong abstractions over compatibility with local slop.
- Every retained source must pass:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> falsifier
```

- External/runtime data stays `unknown` until validated at a schema boundary.
- TypeScript safety must not be weakened to move faster.
- Commands must be recorded with what they prove and what they do not prove.
- DB runtime truth may be claimed only after DB commands run in the current
  environment.
- Use Conventional Commits.
- After each completed slice, commit the slice with a focused Conventional
  Commit and push it. A slice is not done until the commit is pushed and the
  worktree is clean, unless the user explicitly says to pause before
  commit/push.
- Worktree hygiene is part of done: check `git status --short --branch` before
  and after each slice, keep unrelated dirty state separate, and do not start
  the next slice with completed changes still floating in the worktree.
- Keep root `PLAN.md` current after every slice: compact checkpoint,
  decisions, command evidence, and next unchecked item. Finished tasks should
  be archived or summarized, not carried as active work.
- Keep active state small. Every few completed slices, condense `PLAN.md` /
  current goal state: remove or demote completed detail blocks from active
  context, keep only checkpoint evidence and next actions, and avoid preserving
  duplicate prose that does not change execution.

## Worktree And Remote Hygiene

This is part of the goal, not optional housekeeping.

- Treat every task/slice as an atomic Git unit: inspect, implement, verify,
  commit, push, and confirm clean status before starting the next one.
- If a task is too large for one focused commit, split the task before coding
  instead of producing a mixed commit.
- Before each slice, check `git status --short --branch` and confirm whether
  the worktree is clean or whether unrelated dirty state must be isolated.
- During a slice, touch only files required by that slice. Do not fold adjacent
  cleanup, formatting churn, or old completed-task edits into the same diff.
- After verification, commit the completed slice with one focused Conventional
  Commit.
- Push immediately after every completed slice commit.
- Do not batch completed tasks into catch-up commits or delayed pushes. If work
  is already mixed, stop, split the scope, and make the smallest honest commit
  before continuing.
- If push fails, fix the remote/worktree blocker or record it in `PLAN.md`;
  do not start the next task with a finished but unpushed commit.
- `GOAL.md` / `PLAN.md` bookkeeping may travel with the slice it describes.
  Unrelated backlog or policy edits require their own docs commit.
- Re-check `git status --short --branch` after push. The next slice cannot
  start unless the pushed slice is clean locally and remotely, or the exact
  blocker is recorded in `PLAN.md`.
- Do not keep finished work as active context. Once pushed, reduce it to a
  compact checkpoint, command evidence, rollback path, and next unchecked item.

## Verification Baseline

For every implementation slice, run the commands named in `PLAN.md`.

For docs-only slices, minimum verification is:

```sh
git status --short --branch
git diff --check
```

For package/source slices, minimum verification is:

```sh
pnpm typecheck
pnpm test
git diff --check
```

For DB-required slices, add:

```sh
pnpm db:ready
pnpm --filter @krn/db db:check
pnpm db:smoke
```

Root `pnpm db:*` scripts use the local compose database URL by default when
`KRN_DATABASE_URL` is absent. Direct `krn db ...` CLI calls remain strict and
only prove DB runtime truth when the command passes in the current environment.

For Promptfoo/eval slices, add:

```sh
pnpm exec promptfoo --version
pnpm eval:promptfoo:smoke
```

## Stop Conditions

Stop and report if:

- local DB is unavailable for a DB-required slice;
- typecheck/test cannot run;
- repo state has unrelated dirty changes that affect the slice;
- a slice requires destructive deletion not already approved by the plan;
- live code contradicts the root plan;
- the next step requires broad historical rereads instead of a bounded slice.

If not blocked, continue from the first unchecked item in `PLAN.md`.
