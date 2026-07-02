# Root Doc Archive

Date: 2026-07-02

Beads issue: `mise-en-palace-vzos`

## Summary

This slice demotes stale root historical docs without deleting their content.

Active root truth remains:

```txt
README.md
AGENTS.md
GOAL.md
PLAN.md
PLANS.md
```

Historical root files now stay as pointer-only redirects:

```txt
CLAUDE.md
REVIEW.md
GOAL_REPO_RESET_AUDIT.md
```

The archived originals remain available at:

```txt
docs/archive/root-docs/2026-07-02-claude-placeholder.md
docs/reviews/anti-slop-review-request/REQUEST.md
docs/reviews/repo-reset-audit/GOAL_PROMPT.md
```

## Source To Decision

```yaml
source_id: root-doc-active-state-sprawl
source: repo-local audits and root-doc inspection
mechanism: >
  Root files are high-salience context for agents. Historical prompts at root
  can override compact active truth even when their headers say historical.
krn_implication: >
  Stale root docs should not look like current execution truth. The repo still
  needs history, but it should be routed through archive/review paths and tiny
  root pointers.
decision: >
  Keep active root files in place. Move full historical bodies for CLAUDE,
  REVIEW, and GOAL_REPO_RESET_AUDIT into archival locations. Leave root pointer
  files that identify current truth and archived originals.
consumer: >
  Future Codex/agent onboarding, active-plan/context-hygiene invariants, and
  operator resume flows.
falsifier: >
  A future continuation reads historical root prompt bodies as active truth,
  follows a stale reset-audit goal, or must broadly reread historical docs to
  identify current product state.
```

## Changed Files

```txt
CLAUDE.md
REVIEW.md
GOAL_REPO_RESET_AUDIT.md
docs/archive/root-docs/2026-07-02-claude-placeholder.md
docs/reviews/anti-slop-review-request/REQUEST.md
docs/reviews/repo-reset-audit/GOAL_PROMPT.md
docs/reviews/repo-reset-audit/STATE.md
docs/reviews/repo-reset-audit/REPAIR_PLAN.md
PLANS.md
GOAL.md
PLAN.md
```

## Proof

Proved by focused verification:

```txt
rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm --filter @krn/harness test -- activePlanInvariants contextHygieneInvariants sourceMapInvariants patternChainInvariants brainBattleMatrixInvariants skillInvariants ownerFileRecall
rtk pnpm --filter @krn/cli test -- runInitCommand runCli
rtk pnpm test
rtk pnpm eval:brain-battle:smoke
rtk git diff --check
```

## Does Not Prove

This does not prove every historical doc is perfectly clean, every future agent
will choose active truth, product readiness, or that root `PLANS.md` is finally
small enough. It only proves the most misleading historical root docs no longer
carry their full prompt bodies at root.

## Second Opinion Prompt

```txt
You are reviewing the current `mise-en-palace` root-doc cleanup diff.

Be ruthless and verify the current repo state, not old audit claims:

1. Did the slice correctly preserve active root truth while demoting historical
   `CLAUDE.md`, `REVIEW.md`, and `GOAL_REPO_RESET_AUDIT.md`?
2. Are the archive destinations appropriate, or should any moved file live in a
   different typed docs area?
3. Do root pointer files remove ambiguity, or do they still look like active
   instruction surfaces?
4. Did any references now point to pointer files when they should point to the
   archived originals?
5. Does `PLANS.md` still contain stale active/next-task state that can mislead a
   future continuation?
6. What is the next bounded cleanup/hardening slice that most improves senior
   repo health without broad docs rewrite or source-code churn?

Return findings first with exact file/line refs, then give delete/rename/leave
decisions, proof/non-proof, and one next slice with acceptance criteria and
verification commands.
```
