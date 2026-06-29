# Beads + Codex Protocol

Status: active runbook.

Use Beads as the durable task graph and handoff layer for KRN/Codex work.
Do not use Beads as a replacement for KRN product truth:

- root `GOAL.md` remains the continuous objective;
- root `PLAN.md` remains the compact product source of truth;
- root `PLANS.md` remains the compact execution ledger;
- Beads tracks durable tasks, dependencies, claims, blockers, and handoff memory.

## Why

Beads helps when work spans compaction, subagents, interruptions, or follow-up
tasks. It should reduce context loss and stop root markdown files from becoming
task dumps.

## Startup

At the start of a continuation, after reading root KRN files:

```sh
rtk pnpm beads:prime
rtk pnpm beads:ready
```

If Beads output is missing or stale:

```sh
rtk pnpm exec bd where
rtk pnpm exec bd doctor
```

Use the repo-local skill before issue operations when details are needed:

```txt
.agents/skills/beads/SKILL.md
```

## Task Selection

Use KRN root state to decide the active stream and product direction. Use Beads
to track concrete executable work.

Before source edits:

```sh
rtk pnpm exec bd ready
rtk pnpm exec bd show <id>
rtk pnpm exec bd update <id> --claim
```

If no Beads issue exists for a new bounded slice, create one:

```sh
rtk pnpm exec bd create \
  --title="Short bounded title" \
  --description="Why this exists and what needs to be done" \
  --type=task \
  --priority=2
```

Do not create Beads issues for temporary local checklist items. Use Beads only
for durable work that should survive handoff.

## Subagents

Use subagents to accelerate read-only scouting, review, or disjoint write sets.

Required protocol:

1. Create or claim one parent Beads issue for the slice.
2. Create child Beads issues only when the delegated work is durable.
3. Give subagents disjoint scopes.
4. Keep one main write owner unless write sets are cleanly separated.
5. Record useful findings in Beads comments or follow-up issues.

Do not let subagents mutate the same files concurrently.

## During Work

For every non-trivial KRN slice, keep using:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

Use Beads for:

- durable task claims;
- blockers;
- dependency edges;
- follow-up work;
- handoff memory with `bd remember`.

Do not use Beads for:

- replacing `GOAL.md`, `PLAN.md`, or `PLANS.md`;
- product claims without evidence;
- ad hoc memory that should be KRN Memory Core;
- broad roadmap dumps.

## Verification

Run the verification required by the slice. For TypeScript/source changes this
usually includes:

```sh
rtk pnpm typecheck
rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test
rtk pnpm quality:fallow:ci
rtk git diff --check
```

Run DB/eval checks only when relevant.

Beads verification for a Beads-affecting slice:

```sh
rtk pnpm beads:prime
rtk pnpm beads:doctor
rtk pnpm exec bd show <id> --json
```

## Completion

Before calling work complete:

1. Update or close the Beads issue.
2. If useful follow-up exists, create a Beads issue instead of bloating root
   docs.
3. Update root `PLAN.md` / `PLANS.md` only with compact product state.
4. Commit and push source/docs/Beads changes.
5. Check CI for the pushed SHA.
6. Confirm `git status --short --branch` is clean and up to date.

Close a Beads issue only when the work is actually complete:

```sh
rtk pnpm exec bd close <id> --reason="Completed: <short proof>"
```

## Prompt Contract

Future `/goal` prompts should say:

```txt
Use Beads as durable task graph/handoff memory.
Run bd prime after compact/resume.
Claim or create a Beads issue before source edits.
Use KRN root files for product truth.
Use Beads for task dependencies/follow-ups.
Do not replace GOAL.md/PLAN.md/PLANS.md with Beads.
Do not create markdown TODO/memory files.
Close Beads issues only after verification, commit, push, and CI status.
```
