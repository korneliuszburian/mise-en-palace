---
name: handoff-compact
description: Produce a first-screen KRN handoff or resume packet after meaningful work, before compaction, or before transferring a Codex task. Use when Codex must preserve current objective, verified state, decisions, changed files, blockers, context selectors, and next action without dumping history, raw materials, source lists, or memory notes.
---

# Handoff Compact

Use this skill to keep continuation state small and useful.

## Workflow

1. State the current objective.
2. State the last verified state.
3. List changed files only if relevant.
4. List decisions made.
5. List blockers or risks.
6. Name context selectors to rerun.
7. State the exact next action.
8. State what not to reread.

## Output

```md
# Handoff

Objective:
Last verified state:
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
- Do not turn the handoff into product brain.
- Do not exceed the first screen unless the task explicitly requires it.

## Verification

A new Codex thread should be able to continue the next action without broad
reread.

