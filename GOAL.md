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

The canonical reset baseline is complete. The current objective is continuous
hardening: every completed slice must leave behind truthful observations,
follow-up candidates, and concrete next repair slices when evidence shows a gap.

The continuing objective is:

1. keep repo current-truth surfaces honest as code changes;
2. keep productized QG-06 / anti-slop / audit-authority direction rejected;
3. turn completed-slice findings into bounded implementation slices;
4. harden the real Memory Brain spine through source-grounded, typed,
   reviewable changes;
5. keep `PLAN.md` as the living queue instead of declaring the kernel done
   because one reset checklist is complete.

The current priority program is Evidence Integrity. P7 proved the operational
spine, not Memory Brain readiness. Do not build candidate generation, worker
runtime, dashboard, or broader memory behavior while persisted EvidenceBundle
command provenance remains weak or ambiguous.

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
- Before starting a broad new goal, run `git fetch --prune`,
  `git status --short --branch`, and
  `git log --oneline --decorate --left-right origin/main...main`; record any
  ahead/behind state instead of relying on stale status output.
- A checked task is not the end of learning. If verification reveals a gap,
  record it in `PLAN.md` as a follow-up candidate or next slice.
- Do not create a new KRN subsystem for ordinary engineering quality concerns.
  Prefer direct code, type, test, naming, CLI, docs, and review-boundary repair.
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
- Keep root `PLAN.md` current after every slice: progress, surprises,
  decisions, outcomes, command evidence, and next unchecked item.

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
