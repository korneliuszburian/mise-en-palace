---
name: handoff-compact
description: Use when Codex must preserve current objective, active PLANS.md stream/task, verified commit/push/CI state, decisions, changed files, blockers, context selectors, and next action after meaningful work, before auto-compaction, resume, pause, or transfer of a KRN task.
---

# Handoff Compact

Use this skill to keep continuation state small and useful.

## Trigger

- Meaningful work has changed repo state, decisions, blockers, or next action.
- A continuous `PLANS.md` goal may compact, transfer, pause, or resume later.
- A slice was committed, pushed, CI-checked, blocked, or left with a precise
  next action.

## Workflow

1. State the current objective.
2. State the active stream and current task from `PLAN.md` / `PLANS.md`.
3. State the last verified commit, push, CI, DB, and worktree state.
   - For GitHub Actions CI, prefer `gh run list --commit "$(git rev-parse HEAD)"
     --json databaseId,status,conclusion,headSha,workflowName,url,createdAt`.
   - If commit lookup is empty, use branch readback and match `headSha` to the
     full local SHA.
   - Do not report missing CI from short-SHA lookup alone.
4. List changed files only if relevant.
5. List decisions made.
6. List blockers or risks.
7. Name context selectors to rerun.
8. State the exact next action.
9. State what not to reread.

For continuous KRN goals, prefer the first incomplete active task over any
older conversation memory.

## Output

```md
# Handoff

Objective:
Active stream/task:
Last verified state:
Commit/push/CI:
Changed files:
Decisions:
Blockers/risks:
Context selectors:
Next action:
Do not reread:
```

## Forbidden

- Do not write a historical narrative.
- Do not dump raw material.
- Do not include full source lists.
- Do not list completed backlog unless it changes the next action.
- Do not turn the handoff into product brain.
- Do not exceed the first screen unless the task explicitly requires it.

## Verification

A new Codex thread should be able to continue the next action without broad
reread, without losing the active `PLANS.md` slice, and without repeating
already-verified commit/push/CI work.
