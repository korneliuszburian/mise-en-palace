# Goal: Reset KRN Into A Canonical Memory Brain Kernel

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

The current reset objective is:

1. make repo current-truth surfaces honest;
2. remove productized QG-06 / anti-slop / audit-authority direction;
3. classify public operator, governed admin, and internal dev surfaces;
4. harden the real Memory Brain spine only through final-pattern slices.

## Required Read Order

Before editing:

1. `AGENTS.md`
2. `docs/KRN_KERNEL.md`
3. `docs/STATE_OF_THE_ART.md`
4. `PLAN.md`
5. `docs/materials/20206-06-23-audit.md`
6. `docs/reviews/repo-reset-audit/FULL_REPO_AUDIT.md`
7. `docs/reviews/repo-reset-audit/WRONG_ABSTRACTIONS.md`
8. `docs/reviews/repo-reset-audit/RAW_MATERIALS_LEDGER.md`
9. `docs/reviews/repo-reset-audit/REPAIR_PLAN.md`

Read old plans, QG docs, handoffs, and raw materials only when the current
slice names them as evidence or target files.

## Non-Goals

- Do not build a dashboard-first app.
- Do not build a broad benchmark lane.
- Do not build a generic multi-agent framework.
- Do not build Research Foundry, Pattern Vault, source crawler, or runtime
  markdown memory.
- Do not turn `krn audit` into a product quality engine.
- Do not create an anti-slop subsystem.
- Do not claim Promptfoo smoke proves KRN memory behavior.
- Do not let observation/reflection mutate Memory Core.
- Do not do package source feature work before the docs/current-truth reset
  slices in `PLAN.md` are complete.

## Operating Rules

- Repo evidence beats docs.
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
