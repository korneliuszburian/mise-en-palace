---
name: beads
description: Use when working in a repository that uses bd or Beads for durable project task tracking, issue dependencies, blocker management, multi-session handoff, or shared work memory. Trigger when the user asks to find ready work, claim or close tasks, create follow-up work, inspect blockers, recover project context, or choose between local planning and persistent project tracking.
---

# Beads

Use Beads as the shared project task system. Local plans, scratch files, and personal memories are useful, but they are not the durable source of truth for project work.

## Trigger

Use when durable task state, issue dependencies, blocker management, follow-up
work, or multi-session recovery matters.

## First Step

Run:

```bash
rtk bd prime
```

If that prints nothing, check whether the repository has an active Beads workspace:

```bash
rtk bd where
```

## Preferred Route

Use the `bd` CLI when shell access is available. It is the most compact and direct Beads interface.

## Core CLI Steps

1. Find work:

```bash
rtk bd ready
rtk bd list --status=open
rtk bd list --status=in_progress
```

2. Inspect before editing:

```bash
rtk bd show <id>
```

3. Claim work atomically:

```bash
rtk bd update <id> --claim
```

4. Create durable follow-up work when implementation reveals new tasks:

```bash
rtk bd create "Short title" --description="Why this exists and what needs to be done" --type=task --priority=2
```

5. Wire blocking edges when one issue must finish before another can start:

```bash
rtk bd dep <blocker-id> --blocks <blocked-id>
```

6. Close completed work:

```bash
rtk bd close <id> --reason="Completed"
```

## Planning Work

When turning a roadmap slice, audit, spec, or conversation into Beads, create
Beads issues directly. Do not create `tickets.md`, local TODO files, or a second
planning artifact.

For `to-spec`, `to-tickets`, or `wayfinding` planning, read
`references/planning-modes.md` before creating or rewriting issues.

Use tracer-bullet issues for product work:

- each issue delivers one narrow, verifiable path through the affected runtime
  boundary;
- each issue fits one fresh agent context;
- each issue states acceptance criteria and proof/non-proof boundaries;
- blockers are native Beads dependencies, not prose-only references;
- the frontier is `bd ready`: open work whose blockers are done.

Use expand-contract for wide refactors:

1. expand the new form beside the old only when a single green slice cannot
   migrate the blast radius safely;
2. migrate callers in batches sized by package, directory, or public boundary;
3. contract the old form only after `rg` and typecheck prove no caller remains.

If a planned issue has no runtime consumer, falsifier, or owner, reject it or
record it as a question before creating implementation work.

For foggy roadmap work, use wayfinding inside Beads instead of creating a
separate map document:

- first name the destination: the decision, spec, or runtime change that makes
  the roadmap more true;
- create question issues only for fog that is sharp enough to answer in one
  fresh context;
- keep vague future areas out of implementation tickets until a frontier issue
  makes them specific;
- record each resolved decision in the closing reason or issue notes, not in a
  parallel plan file;
- create newly discovered Beads only after the current question makes their
  blockers and acceptance criteria clear.

## Steps

Use Beads before durable work:

1. Run `bd prime` after compaction, resume, or a fresh session.
2. Inspect ready/in-progress work before choosing a slice.
3. Claim an existing issue, or create one when the work must survive handoff.
4. Keep implementation notes in Beads comments or issue descriptions when they are durable; keep root KRN plans compact.
5. Close the Beads issue only after verification, commit, push, and CI status are recorded or explicitly marked unavailable.

## What Belongs In Beads

Use Beads for:

- shared project tasks
- blockers and dependencies
- discovered follow-up work
- work that must survive thread reset, compaction, or handoff
- status that another person or agent should be able to resume

Use agent-local planning tools only for the current turn's execution checklist. Do not treat them as shared project state.

## Output

- Claimed, created, updated, blocked, or closed Beads issue.
- Dependency edge when one task gates another.
- Closing reason or issue note with verification and non-proof boundary.
- No markdown TODO or parallel task ledger.

## Forbidden

- Do not create markdown TODO files as the source of truth when Beads is available.
- Do not use `bd edit`; it opens an interactive editor. Use `bd update` flags instead.
- Prefer `--json` when parsing `bd` output programmatically.
- If hooks are installed, `bd prime` may already be injected. Run it manually when context is missing.
- Do not auto-close or mutate tasks unless the work is actually complete.

## Stop Condition

Stop when the active work has a claimed Bead or a justified local-only plan, new
durable follow-up work is represented in Beads, blockers are dependency edges
or explicit human decisions, and completed issues have verification recorded.

## Verification

For Beads workflow changes, verify the CLI and repository handoff surface:

```bash
rtk bd --version
rtk bd prime
rtk bd ready --json
rtk git diff --check
```

If Beads work changes package manifests or generated skills, also rely on the repository CI skill invariants before claiming the integration is complete.
